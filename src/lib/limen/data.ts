import type { EvidenceItem, FeedbackEvent, MemoryObject, Sitting, Situation } from "./types";
import type { LimenStore } from "./store";
import { deriveLearning } from "./ledger";
import { replayDevelopment, type DevelopmentEvent } from "./development";
import { verifyCheckReceipt } from "./expectations";

export const DATA_VERSION = 3;
export const MAX_DATA_BYTES = 2_000_000;
export const utf8ByteLength = (value: string): number => new TextEncoder().encode(value).byteLength;
type Data = Pick<LimenStore, "situations" | "sittings" | "memories" | "feedbackEvents" | "roleEvents" | "outcomeEvents" | "developmentEvents" | "blindspots" | "reflexes" | "draft" | "view" | "activeSittingId" | "adaptiveEnabled" | "developmentEnabled" | "learningPaused" | "roleBias">;
type Envelope = { format: "limen-data"; version: 3; exportedAt: number; data: Data };
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const string = (v: unknown): v is string => typeof v === "string" && v.length <= 20_000;
const idsUnique = (rows: { id: string }[]) => new Set(rows.map((row) => row.id)).size === rows.length;

export function validateData(raw: unknown): Data {
  if (!object(raw)) throw new Error("Data is not an object.");
  for (const field of ["situations", "sittings", "memories", "feedbackEvents", "roleEvents", "outcomeEvents", "blindspots", "reflexes"]) {
    if (!Array.isArray(raw[field]) || raw[field].length > 5000) throw new Error(`Invalid ${field} collection.`);
    for (const item of raw[field]) if (!object(item) || !string(item.id) || !item.id) throw new Error(`Invalid ${field} record.`);
    if (!idsUnique(raw[field] as { id: string }[])) throw new Error(`Duplicate IDs in ${field}.`);
  }
  const developmentEvents = raw.developmentEvents === undefined ? [] : raw.developmentEvents;
  if (!Array.isArray(developmentEvents) || developmentEvents.length > 100_000) throw new Error("Invalid developmentEvents collection.");
  const replay = replayDevelopment(developmentEvents);
  const developmentEnabled = raw.developmentEnabled === true;
  if (raw.developmentEnabled !== undefined && typeof raw.developmentEnabled !== "boolean") throw new Error("Invalid development setting.");
  const data = { ...(raw as unknown as Data), developmentEvents: replay.events, developmentEnabled };
  for (const situation of data.situations) {
    if (!string(situation.title) || !string(situation.prose) || !string(situation.claim) || !string(situation.objective) || !string(situation.choice) || !["case", "self"].includes(situation.mode) || !object(situation.answers)) throw new Error("Invalid case content.");
  }
  const cases = new Set(data.situations.map((s) => s.id));
  const receipts = new Map<string, { sitting: Sitting; receipt: NonNullable<Situation["receipts"]>[number] }>();
  for (const sitting of data.sittings) {
    if (!cases.has(sitting.situationId) || !object(sitting.result) || !Array.isArray(sitting.result.trace) || !Array.isArray(sitting.result.actions) || !Array.isArray(sitting.result.features) || !Array.isArray(sitting.result.gaps) || !Array.isArray(sitting.result.asks) || !Array.isArray(sitting.result.readings) || !string(sitting.result.voice)) throw new Error("Invalid run or missing case.");
    if (sitting.snapshot && sitting.snapshot.id !== sitting.situationId) throw new Error("Run snapshot has the wrong case.");
    if (sitting.snapshot?.receipts !== undefined && (!Array.isArray(sitting.snapshot.receipts) || sitting.snapshot.receipts.length > 5000)) throw new Error("Invalid check receipt collection.");
    for (const receipt of sitting.snapshot?.receipts ?? []) {
      if (receipt.caseId !== sitting.situationId || !data.sittings.some((row) => row.id === receipt.runId && row.situationId === receipt.caseId) || receipt.criterion !== "limen-report-v1" || receipt.checkerVersion !== "1") throw new Error("Check receipt has invalid attribution or version.");
      if (receipts.has(receipt.id)) throw new Error("Duplicate check receipt ID.");
      verifyCheckReceipt(receipt);
      receipts.set(receipt.id, { sitting, receipt });
    }
    const receiptIds = new Set(sitting.snapshot?.receipts?.filter((r) => r.outcome !== "error").map((r) => r.id) ?? []);
    for (const rows of Object.values(sitting.result.records ?? {})) {
      if (!Array.isArray(rows)) throw new Error("Invalid evidence records.");
      for (const item of rows) {
        if (!object(item) || !string(item.text) || !["reported", "inferred", "assumed", "simulated", "unresolved", "verified_check"].includes(String(item.status))) throw new Error("Invalid evidence item.");
        if (item.status === "verified_check" && (!item.receiptId || !receiptIds.has(String(item.receiptId)))) throw new Error("Checked evidence lacks a receipt in its revision.");
        if (item.source && (!object(item.source) || !["prose", "claim", "objective", "choice", "artifact"].includes(String(item.source.field)) || !Number.isInteger(item.source.start) || !Number.isInteger(item.source.end))) throw new Error("Invalid evidence source span.");
      }
    }
    for (const response of sitting.responses ?? []) if (response.caseId !== sitting.situationId || response.runId !== sitting.id) throw new Error("Response attribution mismatch.");
  }
  const runs = new Map(data.sittings.map((s) => [s.id, s]));
  for (const event of replay.events) {
    if (event.kind === "expectation.recorded") {
      const { expectation } = event.payload;
      if (runs.get(expectation.runId)?.situationId !== expectation.caseId) throw new Error("Development expectation references a missing or mismatched case/run.");
    }
    if (event.kind === "observation.released") {
      const { observation } = event.payload;
      if (runs.get(observation.runId)?.situationId !== observation.caseId) throw new Error("Development observation references a missing or mismatched case/run.");
      if (observation.source.kind === "check_receipt") {
        const source = receipts.get(observation.source.sourceId);
        if (!source || source.sitting.situationId !== observation.caseId || source.sitting.id !== observation.runId) throw new Error("Development observation references a missing or mismatched check receipt.");
        verifyCheckReceipt(source.receipt);
        const expectedResult = source.receipt.outcome === "pass" ? "supports" : source.receipt.outcome === "fail" ? "contradicts" : "inconclusive";
        if (observation.result !== expectedResult) throw new Error("Development observation outcome does not match the checked receipt.");
      }
    }
  }
  for (const event of [...data.feedbackEvents, ...data.roleEvents, ...data.outcomeEvents]) if (!cases.has(event.caseId) || runs.get(event.runId)?.situationId !== event.caseId) throw new Error("Event references a missing run.");
  for (const memory of data.memories) {
    if (!runs.has(memory.sittingId) || !["candidate", "kept", "retired"].includes(memory.status) || !Array.isArray(memory.pattern) || !string(memory.title) || !string(memory.body)) throw new Error("Memory origin is missing or invalid.");
    if (memory.status === "kept" && (memory.validationStatus !== "validated" || (memory.validationCaseIds?.length ?? 0) < 2 || !memory.validationCaseIds?.every((id) => cases.has(id)))) throw new Error("Kept memory lacks two retained validation cases.");
  }
  if (!object(data.draft) || !string(data.draft.prose) || !["sit", "mind", "ledger", "self"].includes(data.view)) throw new Error("Invalid settings or draft.");
  if (typeof data.adaptiveEnabled !== "boolean" || !object(data.roleBias)) throw new Error("Invalid adaptive settings.");
  if (raw.learningPaused !== undefined && typeof raw.learningPaused !== "boolean") throw new Error("Invalid pause setting.");
  if (data.activeSittingId && !runs.has(data.activeSittingId)) throw new Error("Active run is missing.");
  // Never hydrate the original object: arbitrary keys could replace store actions
  // or manufacture permissions. Derived learning is recomputed by the store.
  return {
    situations: data.situations, sittings: data.sittings, memories: data.memories,
    feedbackEvents: data.feedbackEvents, roleEvents: data.roleEvents, outcomeEvents: data.outcomeEvents,
    blindspots: data.blindspots, reflexes: data.reflexes, draft: data.draft,
    view: data.view, activeSittingId: data.activeSittingId, adaptiveEnabled: data.adaptiveEnabled,
    learningPaused: raw.learningPaused === true, developmentEnabled, developmentEvents: replay.events, roleBias: data.roleBias,
  };
}

export function exportData(state: LimenStore, selectedCaseIds?: string[]): string {
  const selected = selectedCaseIds ? new Set(selectedCaseIds) : null;
  const situations = selected ? state.situations.filter((s) => selected.has(s.id)) : state.situations;
  const caseIds = new Set(situations.map((s) => s.id));
  const sittings = state.sittings.filter((s) => caseIds.has(s.situationId));
  const runs = new Set(sittings.map((s) => s.id));
  const data: Data = {
    situations, sittings,
    memories: state.memories.filter((m) => runs.has(m.sittingId)).map((m) => selected && m.validationCaseIds?.some((id) => !caseIds.has(id)) ? { ...m, status: "candidate", validationStatus: "unvalidated", validationCaseIds: [] } as MemoryObject : m),
    feedbackEvents: state.feedbackEvents.filter((e) => caseIds.has(e.caseId)),
    roleEvents: state.roleEvents.filter((e) => caseIds.has(e.caseId)),
    outcomeEvents: state.outcomeEvents.filter((e) => caseIds.has(e.caseId)),
    blindspots: selected ? [] : state.blindspots,
    reflexes: selected ? [] : state.reflexes,
    draft: selected ? { title: "", prose: "", claim: "", objective: "", choice: "", stakes: "consequential", reversible: "partial" } : state.draft,
    view: "sit", activeSittingId: null, adaptiveEnabled: selected ? false : state.adaptiveEnabled, developmentEnabled: selected ? false : state.developmentEnabled, learningPaused: state.learningPaused, roleBias: selected ? {} : state.roleBias,
    developmentEvents: selected ? partialDevelopmentEvents(state.developmentEvents, caseIds) : state.developmentEvents,
  };
  const envelope: Envelope = { format: "limen-data", version: DATA_VERSION, exportedAt: Date.now(), data };
  const json = JSON.stringify(envelope);
  if (utf8ByteLength(json) > MAX_DATA_BYTES) throw new Error("Export exceeds the 2 MB limit. Select fewer cases.");
  return json;
}

export function parseImport(json: string, current: LimenStore) {
  if (utf8ByteLength(json) > MAX_DATA_BYTES) throw new Error("Import exceeds the 2 MB limit.");
  const raw: unknown = JSON.parse(json);
  if (!object(raw) || raw.format !== "limen-data" || (raw.version !== 2 && raw.version !== DATA_VERSION)) throw new Error("Unsupported Limen export version.");
  const incoming = validateData(raw.data);
  const merge = <T extends { id: string }>(existing: T[], incomingRows: T[], label: string) => {
    const byId = new Map(existing.map((row) => [row.id, row]));
    for (const row of incomingRows) {
      const prior = byId.get(row.id);
      if (prior && JSON.stringify(prior) !== JSON.stringify(row)) throw new Error(`Conflicting ${label} ID: ${row.id}.`);
      byId.set(row.id, row);
    }
    return [...byId.values()];
  };
  const situations = merge(current.situations, incoming.situations, "case");
  const sittings = merge(current.sittings, incoming.sittings, "run");
  const feedbackEvents = merge(current.feedbackEvents, incoming.feedbackEvents, "feedback");
  const roleEvents = merge(current.roleEvents, incoming.roleEvents, "role feedback");
  const importEvents = demoteImportedPolicyEvents(incoming.developmentEvents);
  const developmentEvents = replayDevelopment([...current.developmentEvents, ...importEvents]).events;
  const merged = {
    situations, sittings, feedbackEvents, roleEvents,
    developmentEvents,
    outcomeEvents: merge(current.outcomeEvents, incoming.outcomeEvents, "outcome"),
    memories: merge(current.memories, incoming.memories, "memory"),
    blindspots: merge(current.blindspots, incoming.blindspots, "blindspot"),
    reflexes: merge(current.reflexes, incoming.reflexes, "reflex"),
    ...deriveLearning(feedbackEvents, sittings, situations, roleEvents),
  };
  return { preview: { cases: incoming.situations.length, runs: incoming.sittings.length, outcomes: incoming.outcomeEvents.length, memories: incoming.memories.length }, merged };
}

export function migrateLegacy(raw: unknown): Data {
  if (!object(raw)) throw new Error("Legacy state is invalid.");
  const situations = raw.situations as Situation[];
  const sittings = (raw.sittings as Sitting[]).map((sitting) => {
    const records = sitting.result.records;
    if (!records) return sitting;
    const next = Object.fromEntries(Object.entries(records as unknown as Record<string, EvidenceItem[]>).map(([category, rows]) => [category, rows.map((row, index) => ({
      ...row,
      id: `${sitting.id}:legacy:${category}:${index}`,
      status: (row.status as string) === "observed" ? (/schema|hidden check/i.test(row.text) ? "simulated" : "reported") : row.status,
      origin: (row.status as string) === "observed" ? "user" : "rule",
      at: sitting.at, caseId: sitting.situationId, runId: sitting.id,
    }))]));
    return { ...sitting, result: { ...sitting.result, records: next as unknown as Sitting["result"]["records"] } };
  });
  const memories = (raw.memories as MemoryObject[]).map((m) => ({ ...m, status: m.status === "retired" ? "retired" as const : "candidate" as const, validationStatus: "unvalidated" as const }));
  const feedbackEvents: FeedbackEvent[] = Array.isArray(raw.feedbackEvents)
    ? raw.feedbackEvents as FeedbackEvent[]
    : sittings.filter((s) => s.feedback).map((s) => ({ id: `legacy:${s.id}`, caseId: s.situationId, runId: s.id, targetId: s.result.actions[0]?.id ?? "stay-quiet", ...s.feedback! }));
  const roleEvents = Array.isArray(raw.roleEvents) ? raw.roleEvents : [];
  const outcomeEvents = Array.isArray(raw.outcomeEvents) ? raw.outcomeEvents : [];
  const legacyV2 = validateData({ situations, sittings, memories, feedbackEvents, roleEvents, outcomeEvents, developmentEvents: [], developmentEnabled: false, learningPaused: raw.learningPaused === true, blindspots: raw.blindspots, reflexes: raw.reflexes, draft: { title: "", prose: "", claim: "", objective: "", choice: "", stakes: "consequential", reversible: "partial" }, view: raw.view ?? "sit", activeSittingId: raw.activeSittingId ?? null, adaptiveEnabled: typeof raw.adaptiveEnabled === "boolean" ? raw.adaptiveEnabled : false, roleBias: object(raw.roleBias) ? raw.roleBias : {} });
  return migrateV2(legacyV2);
}

export function migrateV2(raw: unknown): Data {
  const prior = validateData(raw);
  return { ...prior, developmentEnabled: false, developmentEvents: [] };
}

function partialDevelopmentEvents(events: DevelopmentEvent[], selectedCaseIds: Set<string>): DevelopmentEvent[] {
  return events.filter((event) => {
    switch (event.kind) {
      case "expectation.recorded": return selectedCaseIds.has(event.payload.expectation.caseId);
      case "observation.released": return selectedCaseIds.has(event.payload.observation.caseId);
      case "expectation.resolved": return selectedCaseIds.has(event.payload.resolution.caseId);
      case "dependency.deleted": return event.payload.dependency.kind === "case" && selectedCaseIds.has(event.payload.dependency.id);
      default: return false;
    }
  });
}

function demoteImportedPolicyEvents(events: DevelopmentEvent[]): DevelopmentEvent[] {
  return events.filter((event) => event.kind !== "policy.reviewed" && event.kind !== "policy.trial_recorded" && event.kind !== "policy.transitioned" && event.kind !== "policy.applied" && event.kind !== "job.queued");
}
