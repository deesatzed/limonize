import test from "node:test";
import assert from "node:assert/strict";
import { selectNextCheck } from "./selection";
import type { DecisionContext, PolicyVersionView } from "./development";

const context: DecisionContext = {
  objectiveVersionId: "objective-v1", contextVersionId: "context-v1", stakes: "consequential",
  methodVersion: "method-v1", workflow: "review", worldVersion: "world-v1",
};

function policy(overrides: Partial<PolicyVersionView> = {}): PolicyVersionView {
  return {
    id: "policy-v1", policyId: "policy", version: 1, track: "simulated",
    scope: { kind: "simulation", worldVersion: "world-v1" },
    action: { kind: "prefer_check", actionId: "trace-lineage" }, context,
    supportResolutionIds: ["res-a", "res-b"], reconsideration: [{ kind: "context_changed" }], lifecycle: "active",
    ...overrides,
  };
}

function select(overrides: Partial<Parameters<typeof selectNextCheck>[0]> = {}) {
  return selectNextCheck({
    track: "simulated", context, eligibleChecks: ["check-acceptance", "trace-lineage"],
    baselineCheckId: "check-acceptance", baselineOperation: "check_source", policies: [policy()],
    developmentEnabled: true, learningPaused: false, ...overrides,
  });
}

test("a matching active simulation commitment changes an eligible next check with one trace record", () => {
  const selection = select();
  assert.equal(selection.baselineCheckId, "check-acceptance");
  assert.equal(selection.selectedCheckId, "trace-lineage");
  assert.deepEqual(selection.eligibleChecks, ["check-acceptance", "trace-lineage"]);
  assert.deepEqual(selection.policyVersionIds, ["policy-v1"]);
  assert.equal(selection.contributed, true);
  assert.equal(selection.operation, "ask");
  assert.deepEqual(selection.roles, ["perspective"]);
  assert.equal(selection.costUnits, 1);
});

test("real track, pause, disabled mode, stale context, and ineligible actions preserve baseline equality", () => {
  const cases = [
    select({ track: "real" as const }),
    select({ developmentEnabled: false }),
    select({ learningPaused: true }),
    select({ context: { ...context, objectiveVersionId: "objective-v2" } }),
    select({ eligibleChecks: ["check-acceptance"] }),
  ];
  for (const selection of cases) {
    assert.equal(selection.selectedCheckId, "check-acceptance");
    assert.equal(selection.contributed, false);
    assert.deepEqual(selection.policyVersionIds, []);
    assert.equal(selection.operation, "check_source");
  }
});

test("selection rejects an impossible baseline and conflicting ties preserve the baseline", () => {
  assert.throws(() => select({ eligibleChecks: ["trace-lineage"] }), /Baseline check must be in the eligible action set/);
  const result = select({ policies: [policy({ id: "a-policy", action: { kind: "prefer_check", actionId: "trace-lineage" } }), policy({ id: "b-policy", action: { kind: "prefer_check", actionId: "check-acceptance" } })] });
  assert.equal(result.selectedCheckId, "check-acceptance");
  assert.equal(result.contributed, false);
  assert.deepEqual(result.policyVersionIds, []);
});
