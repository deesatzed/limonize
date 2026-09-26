import assert from "node:assert/strict";
import test from "node:test";
import { checkReportArtifact } from "./check.ts";
import { runEngine } from "./engine.ts";
import type { SitInput } from "./types.ts";

const base: SitInput = {
  prose: "A report was generated. The tool returned a success code, but acceptance is still unknown.",
  claim: "The report is accepted.",
  objective: "Produce a report in the required shape.",
  choice: "Submit it.",
  stakes: "consequential",
  reversible: "yes",
  answers: {}, dismissed: [], reflexes: [], blindspots: [], engrams: [], ruleBias: {}, mode: "case",
  caseId: "case-1", runId: "run-1", now: 100,
};

test("a bounded local check separates pass, fail and parse error with inspectable receipts", () => {
  const good = checkReportArtifact('{"schemaVersion":"limen-report-v1","summary":"Ready"}', "case-1", "run-1", 100);
  const bad = checkReportArtifact('{"schemaVersion":"old","summary":"Ready"}', "case-1", "run-1", 101);
  const error = checkReportArtifact("not JSON", "case-1", "run-1", 102);
  assert.deepEqual([good.outcome, bad.outcome, error.outcome], ["pass", "fail", "error"]);
  assert.equal(good.criterion, "limen-report-v1");
  assert.match(good.fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.notEqual(good.fingerprint, bad.fingerprint);
  assert.throws(() => checkReportArtifact("x".repeat(4001), "case-1", "run-1"));
});

test("only recorded failures or the named demo activate the schema concern", () => {
  const plain = runEngine({ ...base, revealed: ["schema-fail"] });
  assert.ok(!plain.features.includes("sig:schema"));
  assert.ok(!plain.records.environment.some((r) => r.status === "verified_check" || r.status === "simulated"));

  const bad = checkReportArtifact('{"schemaVersion":"old","summary":"Ready"}', "case-1", "run-1", 101);
  const checked = runEngine({ ...base, receipts: [bad], opBias: { stop: 4 } });
  assert.ok(checked.features.includes("sig:schema"));
  assert.equal(checked.router.op, "check_source");
  const receiptRecord = checked.records.environment.find((r) => r.receiptId === bad.id);
  assert.equal(receiptRecord?.status, "verified_check");
  assert.equal(receiptRecord?.origin, "checker");
  assert.equal(receiptRecord?.caseId, "case-1");
  assert.equal(receiptRecord?.runId, "run-1");

  const demo = runEngine({ ...base, episode: "reviewer", revealed: ["schema-fail"] });
  assert.ok(demo.records.environment.some((r) => r.status === "simulated"));
  assert.ok(!demo.records.environment.some((r) => r.status === "verified_check"));
});
