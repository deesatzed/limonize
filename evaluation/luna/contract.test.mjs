import test from "node:test";
import assert from "node:assert/strict";
import { evaluatorLabel } from "./worlds.mjs";
import { releaseObservation } from "./observer.mjs";
import { scoreRun } from "./scorer.mjs";

test("released observations expose attribution and result but no evaluator truth", () => {
  const label = evaluatorLabel("sd-dev-01");
  const observation = releaseObservation(label, "trace-lineage", {
    caseId: "sd-dev-01", runId: "run-a", worldVersion: "luna-world-v1", sequence: 1
  });
  assert.equal(observation.track, "simulated");
  assert.equal(observation.result, "supports");
  assert.equal(observation.source.worldVersion, "luna-world-v1");
  for (const key of ["truth", "answer", "expected", "decisive", "successfulResolution", "quiet", "checkerError"]) {
    assert.equal(Object.hasOwn(observation, key), false);
  }
});

test("checker errors stay inconclusive and do not become valid negative evidence", () => {
  const label = evaluatorLabel("ae-prot-02");
  const observation = releaseObservation(label, "trace-lineage", {
    caseId: "ae-prot-02", runId: "run-b", worldVersion: "luna-world-v1", sequence: 1
  });
  assert.equal(observation.status, "unresolved");
  assert.equal(observation.result, "inconclusive");
  const score = scoreRun(label, { checks: ["trace-lineage"], track: "simulated" }, [observation], {
    costs: { "check-acceptance": 1, "trace-lineage": 1 }, budget: 2
  });
  assert.equal(score.successfulResolution, false);
  assert.equal(score.consequentialMiss, true);
});

test("quiet cases charge for unnecessary checks and reject unauthorized changes", () => {
  const label = evaluatorLabel("quiet-prot-01");
  const score = scoreRun(label, {
    checks: ["check-acceptance"], track: "simulated", revision: true,
    changedAuthority: true, currentContextVersion: "v2", contextVersion: "v1"
  }, [], { costs: { "check-acceptance": 1, "trace-lineage": 1 }, budget: 2 });
  assert.equal(score.unnecessaryChecks, 1);
  assert.equal(score.invalidRevision, true);
  assert.equal(score.constraintViolations, 1);
});
