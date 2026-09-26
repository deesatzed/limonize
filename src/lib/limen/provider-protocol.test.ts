import test from "node:test";
import assert from "node:assert/strict";
import { exerciseProviderBoundary, validateProviderRequest, type ProviderRequest } from "./provider-protocol";
const request: ProviderRequest = { requestId: "req-1", caseId: "case-1", runId: "run-1", roleId: "boundary", brief: "Synthetic source evidence for a local test only.", sourceIds: ["evidence-1"] };

test("disabled provider makes no send or ledger call", async () => {
  let calls = 0;
  const result = await exerciseProviderBoundary(request, { enabled: false, timeoutMs: 10, send: async () => { calls++; return { text: "synthetic", model: "fake" }; } });
  assert.deepEqual(result, { ok: false, reason: "disabled" });
  assert.equal(calls, 0);
});

test("synthetic shared ledger rejects duplicates, aggregate budget and rate", async () => {
  const seen = new Set<string>(); let spend = 0; let calls = 0;
  const ledger = { admit: async (r: ProviderRequest) => seen.has(r.requestId) ? "duplicate" as const : spend >= 1 ? "budget" as const : "ok" as const, commit: async (r: ProviderRequest) => { seen.add(r.requestId); spend++; } };
  const send = async () => { calls++; return { text: "synthetic role response", model: "fixture-model" }; };
  const first = await exerciseProviderBoundary(request, { enabled: true, ledger, timeoutMs: 100, send });
  assert.equal(first.ok, true);
  if (first.ok) { assert.equal(first.response.roleId, "boundary"); assert.equal(first.response.runId, "run-1"); assert.equal(first.response.model, "fixture-model"); }
  assert.deepEqual(await exerciseProviderBoundary(request, { enabled: true, ledger, timeoutMs: 100, send }), { ok: false, reason: "duplicate" });
  assert.deepEqual(await exerciseProviderBoundary({ ...request, requestId: "req-2" }, { enabled: true, ledger, timeoutMs: 100, send }), { ok: false, reason: "budget" });
  assert.equal(calls, 1);
  const rate = { admit: async () => "rate" as const, commit: async () => {} };
  assert.deepEqual(await exerciseProviderBoundary({ ...request, requestId: "req-3" }, { enabled: true, ledger: rate, timeoutMs: 100, send }), { ok: false, reason: "rate" });
});

test("synthetic timeout aborts and never commits", async () => {
  let committed = false; let aborted = false;
  const ledger = { admit: async () => "ok" as const, commit: async () => { committed = true; } };
  const result = await exerciseProviderBoundary(request, { enabled: true, ledger, timeoutMs: 5, send: (signal) => new Promise((resolve) => { signal.addEventListener("abort", () => { aborted = true; resolve({ text: "late", model: "fixture" }); }); }) });
  assert.deepEqual(result, { ok: false, reason: "timeout" });
  assert.equal(aborted, true);
  assert.equal(committed, false);
});

test("content and role identity are validated before admission", () => {
  assert.throws(() => validateProviderRequest({ ...request, roleId: "wrong" as ProviderRequest["roleId"] }), /invalid/);
  assert.throws(() => validateProviderRequest({ ...request, brief: "short" }), /invalid/);
});
