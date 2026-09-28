import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { trainFromDevelopment, runArm, baselineChoice, scoreArm } from "./arms.mjs";
import { evaluatorLabel } from "./worlds.mjs";
import { releaseObservation } from "./observer.mjs";
import { scoreRun } from "./scorer.mjs";

const splits = JSON.parse(await readFile(new URL("./splits.json", import.meta.url), "utf8"));
const arms = JSON.parse(await readFile(new URL("./arms.json", import.meta.url), "utf8"));

test("development-only released records reach the evidence-derived proposal gate without evaluator labels", () => {
  const events = trainFromDevelopment(splits.splits, evaluatorLabel, releaseObservation);
  assert.equal(events.filter((row) => row.kind === "expectation.resolved").length, 12);
  assert.equal(events.some((row) => row.kind === "policy.version_recorded"), false, "balanced development evidence must not force a policy candidate");
  assert.ok(events.every((row) => !JSON.stringify(row).includes("successfulResolution") && !JSON.stringify(row).includes("decisive")));
});

test("all seven registered development arms emit bounded, attributed run records", () => {
  const history = trainFromDevelopment(splits.splits, evaluatorLabel, releaseObservation);
  const item = splits.splits.find((row) => row.split === "development" && row.family === "acceptance_execution");
  const baseline = baselineChoice(item.family);
  const outputs = arms.arms.map((arm) => {
    const run = runArm(arm.id, item, history, baseline, { label: evaluatorLabel(item.id), releaseObservation });
    return scoreArm(run, evaluatorLabel(item.id), scoreRun, splits.costUnits, splits.observationBudget);
  });
  assert.equal(outputs.length, 7);
  assert.equal(new Set(outputs.map((row) => row.armId)).size, 7);
  assert.ok(outputs.every((row) => row.caseId === item.id && row.score.checkCost <= splits.observationBudget));
  assert.ok(outputs.some((row) => row.armId === "no_profile_ablation"));
  assert.ok(outputs.some((row) => row.armId === "shuffled_profile"));
});

test("context changes reject stale profile application and quiet cases remain check-free", () => {
  const history = trainFromDevelopment(splits.splits, evaluatorLabel, releaseObservation);
  const stale = splits.splits.find((row) => row.split === "development" && row.family === "context_change");
  const quiet = splits.splits.find((row) => row.split === "development" && row.family === "quiet");
  const staleRun = runArm("stale_profile", stale, history, baselineChoice(stale.family), { label: evaluatorLabel(stale.id), releaseObservation });
  const quietRun = runArm("learned_profile_commitments", quiet, history, null, { label: evaluatorLabel(quiet.id), releaseObservation });
  assert.equal(staleRun.attemptedStale, true);
  assert.equal(staleRun.contributed, false);
  assert.deepEqual(quietRun.checks, []);
});
