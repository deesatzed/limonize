import test from "node:test";
import assert from "node:assert/strict";
import { checkReportArtifact } from "./check";
import { replayDevelopment } from "./development";
import { createReportExpectation, resolveReportReceipt } from "./expectations";

function expectation(runId = "run-1") {
  return createReportExpectation({
    id: `expectation:${runId}`,
    caseId: "case-1",
    runId,
    familyId: "family-1",
    objectiveVersionId: "objective:v1",
    stakes: "consequential",
    sequence: 1,
    at: 100,
  });
}

function records(artifact: string) {
  const { expectation: expected, event } = expectation();
  const receipt = checkReportArtifact(artifact, expected.caseId, expected.runId, 101);
  const resolved = resolveReportReceipt(expected, receipt, 2);
  const replay = replayDevelopment([event, ...resolved]);
  return { expected, event, receipt, resolved, replay };
}

test("expectation precedes a fresh receipt; a valid pass resolves shape only", () => {
  const { expected, receipt, resolved, replay } = records('{"schemaVersion":"limen-report-v1","summary":"Ready"}');
  assert.equal(expected.actionId, "check-acceptance");
  assert.equal(receipt.outcome, "pass");
  assert.deepEqual(resolved.map((event) => event.sequence), [2, 3]);
  assert.equal(replay.resolutions[0]?.status, "supported");
  assert.match(receipt.claim, /shape/);
  assert.match(receipt.detail, /claims were not independently verified/);
});

test("a fresh failing shape receipt contradicts the shape expectation", () => {
  const { receipt, replay } = records('{"schemaVersion":"old","summary":"Ready"}');
  assert.equal(receipt.outcome, "fail");
  assert.equal(replay.observations[0]?.result, "contradicts");
  assert.equal(replay.resolutions[0]?.status, "contradicted");
});

test("checker errors remain unresolved and inconclusive, never negative evidence", () => {
  const { receipt, replay } = records("not JSON");
  assert.equal(receipt.outcome, "error");
  assert.equal(replay.observations[0]?.status, "unresolved");
  assert.equal(replay.observations[0]?.result, "inconclusive");
  assert.equal(replay.resolutions[0]?.status, "inconclusive");
});

test("forged outcomes, artifacts, attribution, criteria and checker versions are rejected", () => {
  const { expected, receipt } = records('{"schemaVersion":"limen-report-v1","summary":"Ready"}');
  assert.throws(() => resolveReportReceipt(expected, { ...receipt, outcome: "fail" }, 2), /fresh local check/);
  assert.throws(() => resolveReportReceipt(expected, { ...receipt, artifact: "{}" }, 2), /fresh local check/);
  assert.throws(() => resolveReportReceipt(expected, { ...receipt, caseId: "other-case" }, 2), /different case or run/);
  assert.throws(() => resolveReportReceipt(expected, { ...receipt, runId: "other-run" }, 2), /different case or run/);
  assert.throws(() => resolveReportReceipt(expected, { ...receipt, criterion: "other" as never }, 2), /criterion or checker version/);
  assert.throws(() => resolveReportReceipt(expected, { ...receipt, checkerVersion: "2" as never }, 2), /criterion or checker version/);
});

test("a later receipt cannot resolve another run's expectation", () => {
  const { expectation: expected } = expectation("run-expected");
  const receipt = checkReportArtifact('{"schemaVersion":"limen-report-v1","summary":"Ready"}', "case-1", "run-later", 101);
  assert.throws(() => resolveReportReceipt(expected, receipt, 2), /different case or run/);
});
