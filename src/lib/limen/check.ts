import type { CheckReceipt } from "./types";

// This is a document-shape check, not proof that a report's assertions are true.
export function checkReportArtifact(artifact: string, caseId: string, runId: string, at = Date.now()): CheckReceipt {
  if (artifact.length > 4000) throw new Error("The artifact must be 4,000 characters or fewer.");
  let fingerprint = 0x811c9dc5;
  for (const code of new TextEncoder().encode(artifact)) {
    fingerprint = Math.imul(fingerprint ^ code, 0x01000193);
  }
  const receipt: CheckReceipt = {
    id: `${runId}:limen-report-v1:${at}`,
    caseId,
    runId,
    at,
    criterion: "limen-report-v1",
    checkerVersion: "1",
    fingerprint: `fnv1a32:${(fingerprint >>> 0).toString(16).padStart(8, "0")}`,
    outcome: "error",
    claim: "This JSON document satisfies the Limen report v1 shape.",
    artifact,
    detail: "The artifact was not checked.",
  };
  let value: unknown;
  try {
    value = JSON.parse(artifact);
  } catch {
    return { ...receipt, detail: "The artifact is not valid JSON." };
  }
  const valid = value !== null && typeof value === "object" && !Array.isArray(value)
    && (value as Record<string, unknown>).schemaVersion === "limen-report-v1"
    && typeof (value as Record<string, unknown>).summary === "string"
    && ((value as Record<string, unknown>).summary as string).trim().length > 0;
  return {
    ...receipt,
    outcome: valid ? "pass" : "fail",
    detail: valid
      ? "The document has the required schemaVersion and nonempty summary. Its claims were not independently verified."
      : "The document is missing schemaVersion=limen-report-v1 or a nonempty summary.",
  };
}
