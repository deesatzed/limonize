import test from "node:test";
import assert from "node:assert/strict";
import { useLimen } from "./store";
import { currentOutcome, deriveLearning, dueFollowUps, effectiveFeedback } from "./ledger";
import { assessMemory, retrieveMemories } from "./memory";
import { exportData, migrateLegacy, parseImport, validateData } from "./data";
import { clearStorageIssue, guardedStorage, storageIssue } from "./storage";
import { findAssertion } from "./interpret";
import { runEngine } from "./engine";
import { replayDevelopment } from "./development";
import type { Draft, } from "./store-types";

const local = new Map<string, string>();
(globalThis as unknown as { window: unknown }).window = { localStorage: { getItem: (key: string) => local.get(key) ?? null, setItem: (key: string, val: string) => { local.set(key, val); }, removeItem: (key: string) => { local.delete(key); } }, dispatchEvent: () => true };
const draft = (prose: string, familyId: string): Draft => ({ title: familyId, familyId, prose, claim: "", objective: "Check evidence", choice: "Wait", stakes: "consequential", reversible: "partial" });
function reset() { useLimen.setState({ situations: [], sittings: [], activeSittingId: null, feedbackEvents: [], roleEvents: [], outcomeEvents: [], developmentEvents: [], memories: [], ruleBias: {}, ruleStats: {}, opBias: {}, subBias: {}, roleBias: {}, adaptiveEnabled: false, developmentEnabled: false, learningPaused: false, engrams: [] }); }

test("feedback correction links win same-timestamp ordering ties", () => {
  const prior = { id: "feedback-a", caseId: "case-a", runId: "run-a", targetId: "action-a", verdict: "useful" as const, move: "measure" as const, note: "prior", at: 10 };
  const correction = { ...prior, id: "feedback-z", verdict: "noise" as const, note: "correction", supersedes: prior.id };
  assert.equal(effectiveFeedback([correction, prior])[0]?.id, correction.id);
});

test("revisions are immutable and feedback correction is effective once per case", () => {
  reset();
  useLimen.getState().sit(draft("The load was not measured before selection. We need a reversible check.", "load"));
  const first = useLimen.getState().sittings[0];
  useLimen.getState().feedback("useful", "measure", "first mark");
  const firstEvent = useLimen.getState().feedbackEvents[0];
  useLimen.getState().recordFeedback(firstEvent);
  assert.equal(useLimen.getState().feedbackEvents.length, 1);
  useLimen.getState().answer("acceptance-checked", "unknown");
  const second = useLimen.getState().sittings[0];
  assert.notEqual(second.id, first.id);
  assert.equal(useLimen.getState().sittings[1].id, first.id);
  assert.equal(first.snapshot?.answers["acceptance-checked"], undefined);
  useLimen.getState().feedback("noise", "wait", "correction");
  assert.equal(useLimen.getState().feedbackEvents.length, 2);
  const derived = deriveLearning(useLimen.getState().feedbackEvents, useLimen.getState().sittings, useLimen.getState().situations);
  assert.deepEqual(derived.ruleBias, useLimen.getState().ruleBias);
  assert.equal(derived.engrams.length, 1);
  assert.equal(derived.engrams[0].sittingId, second.id);
});

test("outcome events preserve plan and corrections; unknown remains pending", () => {
  reset();
  useLimen.getState().sit(draft("The load was not measured before selection. We need a reversible check.", "load"));
  const caseId = useLimen.getState().situations[0].id;
  useLimen.getState().planOutcome("Wait", "Measurement arrives", "If load changes", 10);
  assert.deepEqual(dueFollowUps(useLimen.getState().outcomeEvents, 11), [caseId]);
  useLimen.getState().recordOutcome("unknown", "", "", "unclear");
  assert.deepEqual(dueFollowUps(useLimen.getState().outcomeEvents, 11), [caseId]);
  useLimen.getState().deferOutcome(100);
  assert.deepEqual(dueFollowUps(useLimen.getState().outcomeEvents, 11), []);
  useLimen.getState().recordOutcome("reported", "Sensor log", "Reconsider threshold", "supports");
  const outcome = currentOutcome(useLimen.getState().outcomeEvents, caseId);
  assert.equal(outcome.result?.supersedes, useLimen.getState().outcomeEvents[1].id);
  assert.deepEqual(dueFollowUps(useLimen.getState().outcomeEvents, 101), []);
});

test("import is atomic, idempotent and refuses conflicting IDs and missing dependencies", () => {
  reset();
  useLimen.getState().sit(draft("The load was not measured before selection. We need a reversible check.", "load"));
  const json = exportData(useLimen.getState());
  const preview = parseImport(json, useLimen.getState());
  assert.equal(preview.merged.situations.length, 1);
  const altered = JSON.parse(json);
  altered.data.situations[0].title = "Conflicting title";
  assert.throws(() => parseImport(JSON.stringify(altered), useLimen.getState()), /Conflicting case ID/);
  altered.data.sittings[0].situationId = "missing";
  assert.throws(() => validateData(altered.data), /missing case/);
  assert.equal(useLimen.getState().situations.length, 1);
});

test("document receipts survive revision export and forged check labels are rejected", () => {
  reset();
  useLimen.getState().sit(draft("The report returned a success code but acceptance has not been checked.", "report"));
  useLimen.getState().checkArtifact('{"schemaVersion":"limen-report-v1","summary":"checked shape"}');
  const exported = JSON.parse(exportData(useLimen.getState()));
  assert.equal(exported.data.sittings[0].snapshot.receipts[0].outcome, "pass");
  assert.equal(parseImport(JSON.stringify(exported), useLimen.getState()).preview.runs, 2);
  exported.data.sittings[0].snapshot.receipts[0].outcome = "fail";
  assert.throws(() => parseImport(JSON.stringify(exported), useLimen.getState()), /does not match a fresh local check/);
});

test("an artifact check records its expectation before the linked receipt resolution", () => {
  reset();
  useLimen.getState().sit(draft("A report was produced but its required shape is not yet checked. Preserve the actual artifact.", "report"));
  useLimen.getState().checkArtifact('{"schemaVersion":"limen-report-v1","summary":"Ready"}');
  const state = useLimen.getState();
  const replay = replayDevelopment(state.developmentEvents);
  assert.deepEqual(replay.events.map((event) => event.kind), ["expectation.recorded", "observation.released", "expectation.resolved"]);
  assert.equal(replay.expectations[0]?.runId, state.sittings[0]?.id);
  assert.equal(replay.observations[0]?.source.kind, "check_receipt");
  assert.equal(replay.observations[0]?.source.sourceId, state.sittings[0]?.snapshot?.receipts?.[0]?.id);
  assert.equal(replay.resolutions[0]?.status, "supported");

  const caseId = state.situations[0]!.id;
  useLimen.getState().deleteCase(caseId);
  const afterDelete = replayDevelopment(useLimen.getState().developmentEvents);
  assert.equal(afterDelete.expectations.length, 0);
  assert.equal(afterDelete.observations.length, 0);
  assert.equal(afterDelete.resolutions.length, 0);
  assert.deepEqual(afterDelete.deletedDependencies, [{ kind: "case", id: caseId }]);
});

test("deletion removes outcomes and stale provider responses cannot recreate a case", () => {
  reset();
  useLimen.getState().sit(draft("The load was not measured before selection. We need a reversible check.", "load"));
  const run = useLimen.getState().sittings[0];
  useLimen.getState().deleteCase(run.situationId);
  useLimen.getState().addProviderResponse({ id: "late", requestId: "late", caseId: run.situationId, runId: run.id, roleId: "boundary", model: "synthetic", text: "late", at: 1 });
  assert.equal(useLimen.getState().sittings.length, 0);
  assert.equal(useLimen.getState().situations.length, 0);
});

test("synthetic provider responses remain attributed to exact roles and original revision", () => {
  reset();
  useLimen.getState().sit(draft("The load was not measured before selection. We need a reversible check.", "load"));
  const original = useLimen.getState().sittings[0];
  const seats = original.result.hive.map((seat) => ({ ...seat, id: "grok" as const, active: seat.roleId === "perception" || seat.roleId === "boundary" }));
  useLimen.setState({ sittings: [{ ...original, result: { ...original.result, hive: seats } }] });
  for (const roleId of ["perception", "boundary"] as const) useLimen.getState().addProviderResponse({ id: roleId, requestId: `req-${roleId}`, caseId: original.situationId, runId: original.id, roleId, model: "synthetic-only", text: roleId, at: 1 });
  assert.equal(useLimen.getState().sittings[0].responses?.length, 2);
  useLimen.getState().answer("acceptance-checked", "unknown");
  assert.equal(useLimen.getState().sittings[0].responses?.length ?? 0, 0);
  assert.equal(useLimen.getState().sittings[1].responses?.length, 2);
  useLimen.getState().addProviderResponse({ id: "duplicate", requestId: "req-boundary", caseId: original.situationId, runId: original.id, roleId: "boundary", model: "synthetic-only", text: "duplicate", at: 2 });
  assert.equal(useLimen.getState().sittings[1].responses?.length, 2);
});

test("memory promotion requires distinct labeled outcome-backed cases", () => {
  reset();
  useLimen.getState().sit(draft("The vendor has an incentive and the load was not measured before selection.", "purchase-one"));
  const origin = useLimen.getState().sittings[0];
  const title = origin.result.actions[0]?.title ?? "Wait";
  useLimen.getState().planOutcome(title, "Source arrives", "If no evidence");
  useLimen.getState().recordOutcome("reported", "Source log", "Check again", "supports");
  useLimen.getState().keepMemory("repair");
  const memory = useLimen.getState().memories[0];
  assert.equal(assessMemory(memory, useLimen.getState().situations, useLimen.getState().sittings, useLimen.getState().outcomeEvents).ready, false);
  useLimen.getState().sit(draft("A salesperson receives a commission while temperature remains unmeasured in the trial.", "experiment-two"));
  const later = useLimen.getState().sittings[0];
  const laterTitle = later.result.actions[0]?.title ?? "Wait";
  useLimen.getState().planOutcome(laterTitle, "Source arrives", "If no evidence");
  useLimen.getState().recordOutcome("reported", "Independent log", "Check again", "supports");
  const assessment = assessMemory(memory, useLimen.getState().situations, useLimen.getState().sittings, useLimen.getState().outcomeEvents);
  assert.equal(assessment.ready, true, assessment.reason);
  useLimen.getState().promoteMemory(memory.id);
  assert.equal(useLimen.getState().memories[0].status, "kept");
  assert.equal(retrieveMemories(useLimen.getState().memories, ["sig:incentive", "sig:unmeasured"])[0].status, "applicable");
  assert.equal(retrieveMemories(useLimen.getState().memories, ["sig:incentive"])[0].status, "unknown");
  useLimen.getState().recordOutcome("reported", "Counterexample log", "Revise lesson", "contradicts");
  assert.equal(useLimen.getState().memories[0].status, "candidate");
  assert.equal(useLimen.getState().memories[0].validationStatus, "counterexample");
  assert.equal(retrieveMemories(useLimen.getState().memories, ["sig:incentive", "sig:unmeasured"]).length, 0);
});

test("negated and quoted claims are not asserted source readings", () => {
  const input = { prose: "Several friends want lunch. There is no supplier incentive and no missing measurement. The note says \"vendor incentive\".", claim: "", choice: "" };
  assert.equal(findAssertion(input, /supplier|vendor|incentive/i), null);
  assert.equal(findAssertion(input, /missing measurement/i), null);
  assert.ok(findAssertion({ ...input, prose: "The supplier has an incentive." }, /supplier|incentive/i));
  const engineInput = { ...draft(input.prose, "lunch"), answers: {}, dismissed: [], reflexes: [], blindspots: [], engrams: [], ruleBias: {}, mode: "case" as const };
  const result = runEngine(engineInput);
  assert.ok(!result.features.includes("sig:shared-ancestor"));
  assert.ok(!result.features.includes("sig:incentive"));
  assert.ok(!result.features.includes("sig:unmeasured"));
  const positive = runEngine({ ...engineInput, prose: "The supplier has an incentive. The load was not measured. The documents use the same table." });
  assert.ok(positive.features.includes("sig:incentive"));
  assert.ok(positive.features.includes("sig:unmeasured"));
  assert.ok(positive.features.includes("sig:shared-ancestor"));
  const reading = positive.readings.find((r) => r.signal === "incentive");
  assert.equal(positive.records.perception.find((r) => r.text === reading?.text)?.source?.field, "prose");
});

test("legacy migration retains content but demotes legacy checked claims and lessons", () => {
  reset();
  useLimen.getState().sit(draft("The load was not measured before selection. We need a reversible check.", "load"));
  const state = useLimen.getState();
  const run = structuredClone(state.sittings[0]);
  run.result.records.environment[0].status = "observed" as typeof run.result.records.environment[0]["status"];
  const legacy = { ...state, sittings: [run], memories: [{ id: "legacy-memory", sittingId: run.id, status: "kept", pattern: [], title: "Old lesson", body: "Old" }], view: "sit" };
  const migrated = migrateLegacy(legacy);
  assert.equal(migrated.situations[0].prose, state.situations[0].prose);
  assert.equal(migrated.sittings[0].result.records.environment[0].status, "reported");
  assert.equal(migrated.memories[0].status, "candidate");
  assert.equal(migrated.adaptiveEnabled, false);
});

test("unsupported stored state is held for recovery and quota failures are visible", () => {
  clearStorageIssue();
  local.set("limen-test-corrupt", JSON.stringify({ version: 99, state: { secret: "recover me" } }));
  assert.throws(() => guardedStorage.getItem("limen-test-corrupt"), /unsupported version/);
  assert.match(storageIssue() ?? "", /unsupported version/);
  clearStorageIssue();
  const previous = (globalThis as unknown as { window: { localStorage: { setItem: (key: string, value: string) => void } } }).window.localStorage.setItem;
  (globalThis as unknown as { window: { localStorage: { setItem: (key: string, value: string) => void } } }).window.localStorage.setItem = () => { throw new Error("QuotaExceededError"); };
  guardedStorage.setItem("limen-test-quota", "x");
  assert.match(storageIssue() ?? "", /QuotaExceededError/);
  (globalThis as unknown as { window: { localStorage: { setItem: (key: string, value: string) => void } } }).window.localStorage.setItem = previous;
  clearStorageIssue();
});
