import test from "node:test";
import assert from "node:assert/strict";
import { useLimen } from "./store";
import { exportData } from "./data";
import { clearStorageIssue, guardedStorage } from "./storage";
import { memoryFromResult } from "./memory";
import type { Draft } from "./store-types";

const local = new Map<string, string>();
(globalThis as unknown as { window: unknown }).window = {
  localStorage: {
    getItem: (key: string) => local.get(key) ?? null,
    setItem: (key: string, value: string) => { local.set(key, value); },
    removeItem: (key: string) => { local.delete(key); },
  },
  dispatchEvent: () => true,
};
const draft: Draft = { title: "Synthetic case", prose: "The supplier has an incentive and the load was not measured.", claim: "", objective: "Check the evidence", choice: "Wait", stakes: "consequential", reversible: "partial" };
const initialState = useLimen.getState();
function reset() { clearStorageIssue(); useLimen.setState(initialState, true); local.clear(); useLimen.getState().release(); }

test("hydration accepts data but cannot replace controls or trust cached learning weights", async () => {
  reset();
  useLimen.getState().sit(draft);
  const data = JSON.parse(exportData(useLimen.getState())).data;
  const hostile = { ...data, deleteCase: "disabled", release: "disabled", charter: { allowExternalCalls: true }, ruleBias: { invented: 999 }, opBias: { stop: 999 }, engrams: [{ summary: "unsupported authority" }] };
  local.set("limen-v1", JSON.stringify({ version: 2, state: hostile }));
  await useLimen.persist.rehydrate();
  assert.equal(typeof useLimen.getState().deleteCase, "function");
  assert.equal(typeof useLimen.getState().release, "function");
  assert.ok(!Object.hasOwn(useLimen.getState(), "charter"));
  assert.equal(useLimen.getState().ruleBias.invented, undefined);
  assert.deepEqual(useLimen.getState().engrams, []);
});

test("pause suppresses learned preferences and memory candidates while preserving history", () => {
  reset();
  useLimen.getState().sit(draft);
  const origin = useLimen.getState().sittings[0];
  const memory = { ...memoryFromResult("repair", origin.result, "Synthetic repair", origin.id), id: "repair", at: 1, status: "kept" as const, validationStatus: "validated" as const, prerequisites: ["sig:incentive"], validationCaseIds: [] };
  useLimen.setState({ memories: [memory] });
  useLimen.getState().setAdaptiveEnabled(true);
  useLimen.getState().feedback("useful", "measure", "Synthetic feedback");
  useLimen.getState().sit(draft);
  const influenced = useLimen.getState().sittings[0];
  assert.equal(influenced.result.memoryCandidates?.length, 1);
  useLimen.getState().setLearningPaused(true);
  const paused = useLimen.getState().sittings[0];
  assert.notEqual(paused.id, influenced.id);
  assert.deepEqual(paused.result.memoryCandidates, []);
  assert.equal(paused.result.resembles, null);
  assert.equal(useLimen.getState().sittings.find((run) => run.id === influenced.id)?.result.memoryCandidates?.length, 1);
  assert.equal(useLimen.getState().memories.length, 1);
  useLimen.getState().setAdaptiveEnabled(true);
  assert.equal(useLimen.getState().learningPaused, true);
  useLimen.getState().setLearningPaused(false);
  assert.equal(useLimen.getState().sittings[0].result.memoryCandidates?.length, 1);
});

test("pause survives reload and importing a permissive file cannot resume it", async () => {
  reset();
  const json = exportData(useLimen.getState());
  useLimen.getState().setLearningPaused(true);
  await useLimen.persist.rehydrate();
  assert.equal(useLimen.getState().learningPaused, true);
  useLimen.getState().importData(json);
  assert.equal(useLimen.getState().learningPaused, true);
  const state = JSON.parse(local.get("limen-v1")!).state;
  assert.equal(state.learningPaused, true);
});

test("deleting a lesson removes its copied constructions from retained runs", () => {
  reset();
  useLimen.getState().sit(draft);
  useLimen.getState().keepMemory("repair");
  const memory = useLimen.getState().memories[0];
  const run = useLimen.getState().sittings[0];
  useLimen.setState({ sittings: [{ ...run, result: { ...run.result, memoryCandidates: [{ memoryId: memory.id, status: "applicable", why: "Synthetic match", checklist: ["PRIVATE LESSON CONTENT"] }] } }] });
  useLimen.getState().deleteMemory(memory.id);
  assert.ok(!exportData(useLimen.getState()).includes("PRIVATE LESSON CONTENT"));
  assert.deepEqual(useLimen.getState().sittings[0].result.memoryCandidates, []);
});

test("deleting a case removes copied source summaries and dependent lesson constructions", () => {
  reset();
  useLimen.getState().sit({ ...draft, title: "PRIVATE SOURCE TITLE" });
  const origin = useLimen.getState().sittings[0];
  useLimen.getState().keepMemory("repair");
  const memory = useLimen.getState().memories[0];
  useLimen.getState().sit({ ...draft, title: "Retained case" });
  const survivor = useLimen.getState().sittings[0];
  useLimen.setState({ sittings: [{ ...survivor, result: { ...survivor.result,
    resembles: { summary: "PRIVATE SOURCE TITLE", overlap: 1, action: "check", caveat: "Reported similarity" },
    memoryCandidates: [{ memoryId: memory.id, status: "applicable", why: "Match", checklist: ["PRIVATE COPIED LESSON"] }],
  } }, origin] });
  useLimen.getState().deleteCase(origin.situationId);
  const json = exportData(useLimen.getState());
  assert.ok(!json.includes("PRIVATE SOURCE TITLE"));
  assert.ok(!json.includes("PRIVATE COPIED LESSON"));
  assert.ok(useLimen.getState().sittings[0].result.retentionNote);
});

test("older version 2 data loads without a pause flag and an invalid flag is recoverable", async () => {
  reset();
  const data = JSON.parse(exportData(useLimen.getState())).data;
  delete data.learningPaused;
  local.set("limen-v1", JSON.stringify({ version: 2, state: data }));
  await useLimen.persist.rehydrate();
  assert.equal(useLimen.getState().learningPaused, false);
  const invalid = JSON.stringify({ version: 2, state: { ...data, learningPaused: "false" } });
  local.set("invalid-pause", invalid);
  assert.throws(() => guardedStorage.getItem("invalid-pause"), /Invalid pause setting/);
  guardedStorage.setItem("invalid-pause", "overwritten");
  assert.equal(local.get("invalid-pause"), invalid);
  clearStorageIssue();
});
