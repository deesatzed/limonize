// Evaluator-only hidden labels. This module is deliberately absent from the
// preflight import graph and is not imported by browser or learner modules.
const labels = Object.freeze({
  "ae-dev-01": { decisive: "check-acceptance", successfulResolution: true, quiet: false, checkerError: false },
  "ae-dev-02": { decisive: "trace-lineage", successfulResolution: true, quiet: false, checkerError: false },
  "ae-prot-01": { decisive: "check-acceptance", successfulResolution: true, quiet: false, checkerError: false },
  "ae-prot-02": { decisive: "trace-lineage", successfulResolution: true, quiet: false, checkerError: true },
  "sd-dev-01": { decisive: "trace-lineage", successfulResolution: true, quiet: false, checkerError: false },
  "sd-dev-02": { decisive: "check-acceptance", successfulResolution: true, quiet: false, checkerError: false },
  "sd-prot-01": { decisive: "trace-lineage", successfulResolution: true, quiet: false, checkerError: false },
  "sd-prot-02": { decisive: "trace-lineage", successfulResolution: false, quiet: false, checkerError: false },
  "cv-dev-01": { decisive: "check-acceptance", successfulResolution: true, quiet: false, checkerError: false },
  "cv-dev-02": { decisive: "trace-lineage", successfulResolution: true, quiet: false, checkerError: false },
  "cv-prot-01": { decisive: "check-acceptance", successfulResolution: false, quiet: false, checkerError: false },
  "cv-prot-02": { decisive: "trace-lineage", successfulResolution: true, quiet: false, checkerError: false },
  "quiet-dev-01": { decisive: null, successfulResolution: true, quiet: true, checkerError: false },
  "quiet-dev-02": { decisive: null, successfulResolution: true, quiet: true, checkerError: false },
  "quiet-prot-01": { decisive: null, successfulResolution: true, quiet: true, checkerError: false },
  "quiet-prot-02": { decisive: null, successfulResolution: true, quiet: true, checkerError: false }
});

export function evaluatorLabel(caseId) {
  const label = labels[caseId];
  if (!label) throw new Error(`No evaluator label for ${caseId}`);
  return { ...label };
}
