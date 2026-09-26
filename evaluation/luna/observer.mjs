// Converts evaluator-only world facts into the learner-facing observation.
// Keep this adapter outside src/ and never pass its label argument to an arm.
export function releaseObservation(label, actionId, { caseId, runId, worldVersion, sequence }) {
  if (!label || !["check-acceptance", "trace-lineage"].includes(actionId)) throw new Error("Invalid simulated check");
  const matches = label.decisive === actionId;
  return {
    id: `luna-observation-${caseId}-${sequence}`,
    caseId,
    runId,
    track: "simulated",
    expectationId: `luna-expectation-${caseId}-${sequence}`,
    source: { kind: "simulation_release", sourceId: `luna-check-${caseId}-${sequence}`, worldVersion },
    status: label.checkerError ? "unresolved" : "simulated",
    result: label.checkerError ? "inconclusive" : matches ? "supports" : "contradicts"
  };
}
