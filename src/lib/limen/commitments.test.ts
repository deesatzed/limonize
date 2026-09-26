import test from "node:test";
import assert from "node:assert/strict";
import { proposeCommitments } from "./commitments";
import type { CheckActionId, DecisionContext, DevelopmentEvent } from "./development";

const context: DecisionContext = { objectiveVersionId: "objective-v1", contextVersionId: "context-v1", stakes: "low", methodVersion: "method-v1", workflow: "review", worldVersion: "world-v1" };

function evidence(action: CheckActionId, families: string[], status: "supported" | "contradicted" = "supported"): DevelopmentEvent[] {
  const result: DevelopmentEvent[] = [];
  let sequence = 1;
  for (const [index, familyId] of families.entries()) {
    const suffix = `${action}-${familyId}-${index}`;
    const expectationId = `expect-${suffix}`;
    const observationId = `obs-${suffix}`;
    const resolutionId = `res-${suffix}`;
    result.push({ id: `e-${suffix}`, sequence: sequence++, at: sequence, schemaVersion: 1, kind: "expectation.recorded", payload: { expectation: { id: expectationId, caseId: `case-${suffix}`, runId: `run-${suffix}`, track: "simulated", familyId, context, actionId: action, criterionId: "limen-report-v1", predictedOutcome: "check result" } } });
    result.push({ id: `o-${suffix}`, sequence: sequence++, at: sequence, schemaVersion: 1, kind: "observation.released", payload: { observation: { id: observationId, caseId: `case-${suffix}`, runId: `run-${suffix}`, track: "simulated", expectationId, source: { kind: "simulation_release", sourceId: `release-${suffix}`, worldVersion: "world-v1" }, status: "simulated", result: status === "supported" ? "supports" : "contradicts" } } });
    result.push({ id: `r-${suffix}`, sequence: sequence++, at: sequence, schemaVersion: 1, kind: "expectation.resolved", payload: { resolution: { id: resolutionId, caseId: `case-${suffix}`, runId: `run-${suffix}`, track: "simulated", expectationId, observationIds: [observationId], status, methodVersion: "method-v1" } } });
  }
  return result;
}

test("opposing evidence histories yield context-matched evidence-backed preferences", () => {
  const left = proposeCommitments(evidence("check-acceptance", ["family-a", "family-b"]));
  const right = proposeCommitments(evidence("trace-lineage", ["family-a", "family-b"]));
  assert.equal(left.length, 1);
  assert.equal(right.length, 1);
  assert.equal(left[0]!.payload.policyVersion.action.kind, "prefer_check");
  assert.equal(left[0]!.payload.policyVersion.action.kind === "prefer_check" ? left[0]!.payload.policyVersion.action.actionId : "", "check-acceptance");
  assert.equal(right[0]!.payload.policyVersion.action.kind === "prefer_check" ? right[0]!.payload.policyVersion.action.actionId : "", "trace-lineage");
  assert.deepEqual(left[0]!.payload.policyVersion.supportResolutionIds, ["res-check-acceptance-family-a-0", "res-check-acceptance-family-b-1"]);
});

test("missing, unresolved, contradicted, duplicate-family, and descendant evidence cannot propose a candidate", () => {
  assert.deepEqual(proposeCommitments([]), []);
  assert.deepEqual(proposeCommitments(evidence("check-acceptance", ["family-a"], "contradicted")), []);
  const oneFamily = evidence("check-acceptance", ["family-a", "family-a"]);
  assert.deepEqual(proposeCommitments(oneFamily), []);
});

test("candidate support is captured before prospective trial data and candidate remains inert", () => {
  const rows = evidence("trace-lineage", ["family-a", "family-b"]);
  const [candidate] = proposeCommitments(rows);
  assert.equal(candidate?.kind, "policy.version_recorded");
  assert.deepEqual(candidate?.payload.policyVersion.supportResolutionIds, ["res-trace-lineage-family-a-0", "res-trace-lineage-family-b-1"]);
  assert.equal(candidate?.payload.policyVersion.version, 1);
  assert.equal(candidate?.payload.policyVersion.scope.kind, "simulation");
  assert.deepEqual(candidate?.payload.policyVersion.reconsideration.map((item) => item.kind), ["context_changed", "objective_changed", "method_changed", "support_revoked"]);
  assert.deepEqual(proposeCommitments([...rows, candidate!]), []);
});
