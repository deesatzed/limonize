import test from "node:test";
import assert from "node:assert/strict";
import { useLimen } from "./store";
import { DATA_VERSION, MAX_DATA_BYTES, exportData, migrateLegacy, migrateV3, parseImport, utf8ByteLength, validateData } from "./data";
import { clearStorageIssue } from "./storage";
import { replayDevelopment, type DevelopmentEvent } from "./development";
import type { Draft } from "./store-types";

const local = new Map<string, string>();
(globalThis as unknown as { window: unknown }).window = { localStorage: { getItem: (key: string) => local.get(key) ?? null, setItem: (key: string, value: string) => local.set(key, value), removeItem: (key: string) => local.delete(key) }, dispatchEvent: () => true };
const draft: Draft = { title: "Report", familyId: "report-family", prose: "The submitted report requires a local shape check before it is used.", claim: "The shape is acceptable.", objective: "Check the report shape", choice: "Inspect", stakes: "consequential", reversible: "yes" };

function reset() {
  useLimen.setState({ situations: [], sittings: [], activeSittingId: null, feedbackEvents: [], roleEvents: [], outcomeEvents: [], developmentEvents: [], developmentJobs: [], developmentDeferredSourceEventIds: [], developmentProcessing: false, developmentEnabled: false, learningPaused: false, adaptiveEnabled: false, memories: [], ruleBias: {}, ruleStats: {}, opBias: {}, subBias: {}, roleBias: {}, engrams: [] });
}

function checkedState() {
  reset();
  useLimen.getState().sit(draft);
  useLimen.getState().checkArtifact('{"schemaVersion":"limen-report-v1","summary":"Ready"}');
  return useLimen.getState();
}

function emptyImportTarget(source: ReturnType<typeof checkedState>) {
  return {
    ...source,
    situations: [], sittings: [], memories: [], feedbackEvents: [], roleEvents: [], outcomeEvents: [], developmentEvents: [],
  };
}

test("v4 export carries attributed development events and v2 imports migrate with an empty ledger", () => {
  const source = checkedState();
  assert.equal(DATA_VERSION, 4);
  const exported = JSON.parse(exportData(source));
  assert.equal(exported.version, 4);
  assert.equal(exported.data.developmentEvents.length, 3);
  const v2 = structuredClone(exported);
  v2.version = 2;
  delete v2.data.developmentEvents;
  delete v2.data.developmentEnabled;
  const target = emptyImportTarget(source);
  const imported = parseImport(JSON.stringify(v2), target);
  assert.equal(imported.merged.situations.length, 1);
  assert.deepEqual(imported.merged.developmentEvents, []);
});

test("old persisted state migrates without turning development on or unpausing learning", () => {
  checkedState();
  useLimen.getState().setAdaptiveEnabled(true);
  useLimen.getState().feedback("useful", "measure", "legacy feedback");
  useLimen.getState().planOutcome("Wait", "The required source arrives", "If its result changes the decision");
  const source = useLimen.getState();
  const persistedV2 = JSON.parse(JSON.stringify(source)) as Record<string, unknown>;
  delete persistedV2.developmentEvents;
  delete persistedV2.developmentEnabled;
  const migrated = migrateLegacy(persistedV2);
  assert.deepEqual(migrated.developmentEvents, []);
  assert.equal(migrated.developmentEnabled, false);
  assert.equal(migrated.learningPaused, source.learningPaused);
  assert.equal(migrated.adaptiveEnabled, true);
  assert.equal(migrated.feedbackEvents.length, source.feedbackEvents.length);
  assert.equal(migrated.outcomeEvents.length, source.outcomeEvents.length);
});

test("the persisted v0 and v2 envelopes both hydrate as v4 with learning disabled by default", async () => {
  for (const version of [0, 2]) {
    checkedState();
    useLimen.getState().setAdaptiveEnabled(true);
    useLimen.getState().feedback("useful", "measure", "retained feedback");
    useLimen.getState().planOutcome("Wait", "The required source arrives", "If its result changes the decision");
    const source = useLimen.getState();
    const oldState = JSON.parse(JSON.stringify(source)) as Record<string, unknown>;
    delete oldState.developmentEvents;
    delete oldState.developmentEnabled;
    if (version === 0) delete oldState.learningPaused;
    else oldState.learningPaused = true;
    reset();
    local.set("limen-v1", JSON.stringify({ version, state: oldState }));
    clearStorageIssue();
    await useLimen.persist.rehydrate();
    const saved = JSON.parse(local.get("limen-v1")!);
    assert.equal(saved.version, 4);
    assert.equal(useLimen.getState().developmentEnabled, false);
    assert.deepEqual(useLimen.getState().developmentEvents, []);
    assert.equal(useLimen.getState().learningPaused, version === 2);
    assert.equal(useLimen.getState().adaptiveEnabled, true);
    assert.equal(useLimen.getState().feedbackEvents.length, 1);
    assert.equal(useLimen.getState().outcomeEvents.length, 1);
  }
});

test("v3 queue migration reconstructs only retained current-version source jobs; v4 reload preserves pending work", async () => {
  const source = checkedState();
  source.setDevelopmentEnabled(true);
  source.queueDevelopmentWork();
  const queued = useLimen.getState();
  assert.equal(queued.developmentJobs.length, 2);
  assert.equal(queued.developmentJobs.every((job) => job.status === "queued"), true);
  const v4 = validateData(queued);
  assert.equal(v4.developmentJobs.length, 2);

  const oldV3 = { ...queued } as Record<string, unknown>;
  delete oldV3.developmentJobs;
  delete oldV3.developmentDeferredSourceEventIds;
  const migrated = migrateV3(oldV3);
  assert.equal(migrated.developmentJobs.length, 2);
  assert.equal(migrated.developmentJobs.every((job) => job.status === "queued"), true);

  useLimen.setState({ developmentJobs: queued.developmentJobs, developmentDeferredSourceEventIds: queued.developmentDeferredSourceEventIds });
  const exported = JSON.parse(exportData(useLimen.getState()));
  const target = emptyImportTarget(useLimen.getState());
  const imported = parseImport(JSON.stringify(exported), target);
  assert.equal("developmentJobs" in imported.merged, false);
});

test("enabled app-open processing derives attributed summaries and commits job completion", async () => {
  checkedState();
  useLimen.setState({ developmentEnabled: true });
  useLimen.getState().queueDevelopmentWork();
  await useLimen.getState().runDevelopmentWork();
  const result = useLimen.getState();
  assert.ok(result.developmentEvents.some((event) => event.kind === "competence.derived"));
  assert.ok(result.developmentJobs.length > 0);
  assert.ok(result.developmentJobs.every((job) => job.status === "completed"));
});

test("the user-facing rehearsal autonomously records evidence and trials while the comparative gate keeps steering shadowed", async () => {
  reset();
  useLimen.setState({ developmentEnabled: true });
  await useLimen.getState().runLocalRehearsal();
  const processed = replayDevelopment(useLimen.getState().developmentEvents);
  assert.ok(processed.policies.some((policy) => policy.lifecycle === "testing"));
  assert.ok(processed.trials.length > 0);
  assert.ok(processed.trials.some((trial) => trial.outcome === "quiet_control"));
  assert.ok(useLimen.getState().developmentJobs.every((job) => job.status !== "queued"));

  assert.equal(processed.applications.length, 0);
  const exported = JSON.parse(exportData(useLimen.getState()));
  const reloaded = validateData(exported.data);
  assert.equal(replayDevelopment(reloaded.developmentEvents).policies.length, processed.policies.length);
  assert.ok(reloaded.developmentEvents.some((event) => event.kind === "observation.released" && event.payload.observation.track === "simulated"));
});

test("imports preserve current development and pause controls while merging valid history", () => {
  const source = checkedState();
  const exported = JSON.parse(exportData(source));
  exported.data.developmentEnabled = true;
  exported.data.learningPaused = false;
  useLimen.setState({ developmentEnabled: false, learningPaused: true });
  const current = useLimen.getState();
  const result = parseImport(JSON.stringify(exported), current);
  useLimen.setState(result.merged);
  assert.equal(useLimen.getState().developmentEnabled, false);
  assert.equal(useLimen.getState().learningPaused, true);
  assert.equal(useLimen.getState().developmentEvents.length, 3);
});

test("partial exports omit derived policy and queued-job events", () => {
  const source = checkedState();
  const last = source.developmentEvents.at(-1)!;
  const queued: DevelopmentEvent = {
    id: "job-event-1", sequence: last.sequence + 1, at: last.at + 1, schemaVersion: 1,
    kind: "job.queued", payload: { job: { id: "job-1", sourceEventId: last.id, jobKind: "consider_policy", inputVersion: "dev-v1" } },
  };
  useLimen.setState({ developmentEvents: [...source.developmentEvents, queued] });
  const partial = JSON.parse(exportData(useLimen.getState(), [source.situations[0]!.id]));
  assert.deepEqual(partial.data.developmentEvents.map((event: DevelopmentEvent) => event.kind), ["expectation.recorded", "observation.released", "expectation.resolved"]);
});

test("full imports retain a policy definition as candidate but discard admission and queued-job records", () => {
  const source = checkedState();
  const discovery = source.developmentEvents.find((event) => event.kind === "expectation.recorded");
  const priorResolution = source.developmentEvents.find((event) => event.kind === "expectation.resolved");
  assert.ok(discovery && priorResolution?.kind === "expectation.resolved");
  const policyVersion: DevelopmentEvent = {
    id: "policy-definition-event", sequence: 4, at: 104, schemaVersion: 1,
    kind: "policy.version_recorded",
    payload: { policyVersion: {
      id: "policy-import-v1", policyId: "policy-import", version: 1, track: "real", scope: { kind: "real_advisory" },
      action: { kind: "prefer_check", actionId: "check-acceptance" },
      context: discovery.payload.expectation.context,
      supportResolutionIds: [priorResolution.payload.resolution.id],
      reconsideration: [{ kind: "context_changed" }],
    } },
  };
  const review: DevelopmentEvent = {
    id: "policy-review-event", sequence: 5, at: 105, schemaVersion: 1, kind: "policy.reviewed",
    payload: { review: { id: "policy-review", policyVersionId: "policy-import-v1", track: "real", reviewKind: "evidence", verdict: "accepted", sourceEventIds: [priorResolution.id], reviewedAtSequence: 5 } },
  };
  const transition: DevelopmentEvent = {
    id: "policy-suspended-event", sequence: 6, at: 106, schemaVersion: 1, kind: "policy.transitioned",
    payload: { transition: { policyVersionId: "policy-import-v1", toState: "suspended", reasonCode: "contradiction" } },
  };
  const queued: DevelopmentEvent = {
    id: "job-event-import", sequence: 7, at: 107, schemaVersion: 1, kind: "job.queued",
    payload: { job: { id: "job-import", sourceEventId: transition.id, jobKind: "consider_policy", inputVersion: "dev-v1" } },
  };
  useLimen.setState({ developmentEvents: [...source.developmentEvents, policyVersion, review, transition, queued] });
  const exported = exportData(useLimen.getState());
  const imported = parseImport(exported, emptyImportTarget(source));
  const replay = replayDevelopment(imported.merged.developmentEvents);
  assert.equal(replay.policies[0]?.lifecycle, "candidate");
  assert.equal(replay.reviews.length, 0);
  assert.equal(replay.jobs.length, 0);
  assert.ok(imported.merged.developmentEvents.some((event) => event.id === policyVersion.id));
  assert.ok(!imported.merged.developmentEvents.some((event) => event.id === transition.id));
});

test("nested event validation rejects control injection and a forged receipt cannot import", () => {
  const source = checkedState();
  const data = structuredClone(exportData(source));
  const injected = JSON.parse(data).data;
  injected.developmentEvents[0].payload.expectation.learningPaused = false;
  assert.throws(() => validateData(injected), /unknown field/);

  const forged = JSON.parse(data);
  forged.data.sittings[0].snapshot.receipts[0].artifact = "{}";
  assert.throws(() => parseImport(JSON.stringify(forged), emptyImportTarget(source)), /does not match a fresh local check/);
});

test("duplicate imports do not amplify support and conflicting event IDs fail atomically", () => {
  const source = checkedState();
  const exported = exportData(source);
  const target = emptyImportTarget(source);
  const first = parseImport(exported, target).merged;
  const repeated = parseImport(exported, { ...target, ...first }).merged;
  assert.equal(repeated.developmentEvents.length, 3);
  const conflict = JSON.parse(exported);
  conflict.data.developmentEvents[0].payload.expectation.predictedOutcome = "A changed assertion.";
  assert.throws(() => parseImport(JSON.stringify(conflict), { ...target, ...first }), /different content|Conflicting development event/);
  assert.equal(target.developmentEvents.length, 0);
});

test("the advertised data limit measures UTF-8 bytes", () => {
  assert.equal(utf8ByteLength("Limen"), 5);
  assert.equal(utf8ByteLength("🪷"), 4);
  assert.throws(() => parseImport("🪷".repeat(Math.floor(MAX_DATA_BYTES / 2) + 1), useLimen.getState()), /2 MB limit/);
});
