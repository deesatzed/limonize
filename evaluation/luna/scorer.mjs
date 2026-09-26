// Independent rubric; scorer labels are evaluator-only and never enter learner input.
export const SCORER_VERSION = "luna-scorer-v1";

export function scoreRun(label, selection, observations, { costs, budget }) {
  const checks = selection.checks ?? [];
  const cost = checks.reduce((sum, id) => sum + costs[id], 0);
  const invalidRevision = selection.revision === true && (label.quiet || selection.contextVersion !== selection.currentContextVersion);
  const authorityViolation = selection.changedAuthority === true || selection.changedPrerequisite === true || selection.track !== "simulated";
  const errorAsNegative = observations.some((observation) => observation.status === "unresolved" && observation.result !== "inconclusive");
  const resolved = label.successfulResolution && !label.checkerError && checks.includes(label.decisive);
  const unnecessaryChecks = label.quiet ? checks.length : checks.filter((id) => id !== label.decisive).length;
  return {
    consequentialMiss: !label.quiet && !resolved,
    invalidRevision,
    unnecessaryChecks,
    checkCost: cost,
    constraintViolations: Number(authorityViolation || errorAsNegative || checks.length > budget),
    successfulResolution: Boolean(resolved)
  };
}
