import { checkReportArtifact } from "./check";
import type { CheckReceipt, Stakes } from "./types";
import type { DecisionContext, DevelopmentEvent, ExpectationRecord, ReleasedObservation } from "./development";

export interface ReportExpectationInput {
  id: string;
  caseId: string;
  runId: string;
  familyId: string;
  objectiveVersionId: string;
  stakes: Stakes;
  sequence: number;
  at: number;
}

export function createReportExpectation(input: ReportExpectationInput): {
  expectation: ExpectationRecord;
  event: Extract<DevelopmentEvent, { kind: "expectation.recorded" }>;
} {
  const context: DecisionContext = {
    objectiveVersionId: input.objectiveVersionId,
    contextVersionId: `report-shape:${input.stakes}:review`,
    stakes: input.stakes,
    methodVersion: "checkReportArtifact:1",
    workflow: "review",
  };
  const expectation: ExpectationRecord = {
    id: input.id,
    caseId: input.caseId,
    runId: input.runId,
    track: "real",
    familyId: input.familyId,
    context,
    actionId: "check-acceptance",
    criterionId: "limen-report-v1",
    predictedOutcome: "The submitted report has the required Limen report v1 shape.",
  };
  return {
    expectation,
    event: {
      id: `expectation-event:${expectation.id}`,
      sequence: input.sequence,
      at: input.at,
      schemaVersion: 1,
      kind: "expectation.recorded",
      payload: { expectation },
    },
  };
}

export function resolveReportReceipt(
  expectation: ExpectationRecord,
  receipt: CheckReceipt,
  firstSequence: number,
): [
  Extract<DevelopmentEvent, { kind: "observation.released" }>,
  Extract<DevelopmentEvent, { kind: "expectation.resolved" }>,
] {
  if (expectation.actionId !== "check-acceptance" || expectation.criterionId !== "limen-report-v1") throw new Error("The expectation does not authorize this report-shape receipt.");
  if (receipt.caseId !== expectation.caseId || receipt.runId !== expectation.runId) throw new Error("The receipt belongs to a different case or run.");
  if (receipt.criterion !== expectation.criterionId || receipt.checkerVersion !== "1") throw new Error("The receipt criterion or checker version does not match the expectation.");
  verifyCheckReceipt(receipt);

  const result: ReleasedObservation["result"] = receipt.outcome === "pass" ? "supports" : receipt.outcome === "fail" ? "contradicts" : "inconclusive";
  const observation = {
    id: `observation:${receipt.id}`,
    caseId: expectation.caseId,
    runId: expectation.runId,
    track: "real" as const,
    expectationId: expectation.id,
    source: {
      kind: "check_receipt" as const,
      sourceId: receipt.id,
      criterionId: "limen-report-v1" as const,
      checkerVersion: "1" as const,
    },
    status: receipt.outcome === "error" ? "unresolved" as const : "verified_check" as const,
    result,
  };
  const resolution = {
    id: `resolution:${receipt.id}`,
    caseId: expectation.caseId,
    runId: expectation.runId,
    track: "real" as const,
    expectationId: expectation.id,
    observationIds: [observation.id],
    status: result === "supports" ? "supported" as const : result === "contradicts" ? "contradicted" as const : "inconclusive" as const,
    methodVersion: expectation.context.methodVersion,
  };
  return [
    { id: `observation-event:${receipt.id}`, sequence: firstSequence, at: receipt.at, schemaVersion: 1, kind: "observation.released", payload: { observation } },
    { id: `resolution-event:${receipt.id}`, sequence: firstSequence + 1, at: receipt.at, schemaVersion: 1, kind: "expectation.resolved", payload: { resolution } },
  ];
}

export function verifyCheckReceipt(receipt: CheckReceipt): void {
  const checked = checkReportArtifact(receipt.artifact, receipt.caseId, receipt.runId, receipt.at);
  if (
    checked.id !== receipt.id || checked.criterion !== receipt.criterion || checked.checkerVersion !== receipt.checkerVersion
    || checked.fingerprint !== receipt.fingerprint || checked.outcome !== receipt.outcome
    || checked.claim !== receipt.claim || checked.detail !== receipt.detail
  ) throw new Error("The receipt does not match a fresh local check of its artifact.");
}
