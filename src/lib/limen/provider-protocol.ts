import type { ProviderResponse } from "./types";

export interface ProviderRequest {
  requestId: string;
  caseId: string;
  runId: string;
  roleId: ProviderResponse["roleId"];
  brief: string;
  sourceIds: string[];
}
export interface ProviderLedger {
  admit: (request: ProviderRequest) => Promise<"ok" | "duplicate" | "budget" | "rate">;
  commit: (request: ProviderRequest) => Promise<void>;
}
export type ProviderResult = { ok: true; response: ProviderResponse } | { ok: false; reason: "disabled" | "duplicate" | "budget" | "rate" | "timeout" | "failure" };

export function validateProviderRequest(input: ProviderRequest): ProviderRequest {
  if (!input || !input.requestId || !input.caseId || !input.runId || !["perception", "world", "perspective", "boundary"].includes(input.roleId) ||
      typeof input.brief !== "string" || input.brief.length < 20 || input.brief.length > 6000 ||
      !Array.isArray(input.sourceIds) || input.sourceIds.length > 30 || input.sourceIds.some((id) => typeof id !== "string" || id.length > 100)) {
    throw new Error("The selected reflection request is invalid.");
  }
  return input;
}

// Protocol exercise for synthetic tests. The deployed route stays disabled until a durable,
// shared ledger implements ProviderLedger; an in-memory ledger would not bound aggregate spend.
export async function exerciseProviderBoundary(
  request: ProviderRequest,
  options: { enabled: boolean; ledger?: ProviderLedger; timeoutMs: number; send: (signal: AbortSignal) => Promise<{ text: string; model: string }> },
): Promise<ProviderResult> {
  validateProviderRequest(request);
  if (!options.enabled || !options.ledger) return { ok: false, reason: "disabled" };
  const admission = await options.ledger.admit(request);
  if (admission !== "ok") return { ok: false, reason: admission };
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeout = new Promise<never>((_, reject) => { timer = setTimeout(() => { reject(new Error("timeout")); controller.abort(); }, options.timeoutMs); });
    const result = await Promise.race([options.send(controller.signal), timeout]);
    if (!result.text.trim() || !result.model.trim()) return { ok: false, reason: "failure" };
    await options.ledger.commit(request);
    return { ok: true, response: { id: request.requestId, requestId: request.requestId, caseId: request.caseId, runId: request.runId, roleId: request.roleId, model: result.model, text: result.text, at: Date.now() } };
  } catch (error) { return { ok: false, reason: error instanceof Error && error.message === "timeout" ? "timeout" : "failure" }; }
  finally { if (timer) clearTimeout(timer); }
}
