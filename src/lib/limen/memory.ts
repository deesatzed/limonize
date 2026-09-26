import { FEATURE_LABEL } from "./fly";
import { currentOutcome } from "./ledger";
import type { EngineResult, MemoryObject, OutcomeEvent, Sitting, Situation } from "./types";

export interface Construction {
  label: string;
  note: string;
  lines: string[];
}

export function construct(memory: MemoryObject, mode: "checklist" | "boundary" | "revival"): Construction {
  if (mode === "checklist") {
    return {
      label: "Checklist",
      note: "Generated from the kept object. Not a record of a past checklist.",
      lines: [
        "Does the same pattern hold?",
        ...memory.pattern.map((p) => `Pattern to check: ${p}.`),
        memory.test ? `Run this test before trusting the old move: ${memory.test}` : "No discriminating test was stored.",
        memory.caveat,
        "If the prerequisite fails, do not apply the previous answer.",
      ],
    };
  }
  if (mode === "boundary") {
    return {
      label: "Boundary cases",
      note: "Generated hypotheticals. They were not observed.",
      lines: [
        "Nearby case that flips one decisive fact and keeps the rest: the previous move should change, or the memory is too coarse.",
        "Nearby case that changes only wording or prestige and keeps the structure: the move should stay put.",
        memory.revival ? `Wake this again only if: ${memory.revival}` : "No revival condition was stored.",
        "A plausible story that reconciles a conflict is still a hypothesis until it has a separating observation.",
      ],
    };
  }
  return {
    label: "Revival",
    note: "A condition for waking the question, not a conclusion.",
    lines: [
      memory.revival || "Reopen if the context, the objective, or the lineage changes.",
      memory.body,
      "When it wakes, propose the check. Do not paste the old answer.",
    ],
  };
}

export function retrieveMemories(memories: MemoryObject[], features: string[]): NonNullable<EngineResult["memoryCandidates"]> {
  const present = new Set(features);
  return memories.filter((memory) => memory.status === "kept" && memory.validationStatus === "validated").map((memory) => {
    const excluded = (memory.exclusions ?? []).filter((key) => present.has(key));
    const unknown = (memory.prerequisites?.length ? memory.prerequisites : ["no prerequisites recorded"]).filter((key) => !present.has(key));
    const status = excluded.length ? "excluded" as const : unknown.length ? "unknown" as const : "applicable" as const;
    return {
      memoryId: memory.id,
      status,
      why: excluded.length ? `Excluded by ${excluded.join(", ")}` : unknown.length ? `Prerequisites not established: ${unknown.join(", ")}` : `Recorded prerequisites matched: ${(memory.prerequisites ?? []).join(", ") || "none recorded"}`,
      checklist: status === "applicable" ? construct(memory, "checklist").lines : [],
    };
  });
}

export function assessMemory(memory: MemoryObject, situations: Situation[], sittings: Sitting[], outcomes: OutcomeEvent[]) {
  const originRun = sittings.find((s) => s.id === memory.sittingId);
  const origin = situations.find((s) => s.id === originRun?.situationId);
  if (!origin) return { ready: false, reason: "Origin case missing", caseIds: [] as string[] };
  const originOutcome = currentOutcome(outcomes, origin.id);
  if (!supports(originOutcome, originRun)) return { ready: false, reason: "Origin needs an outcome supporting the chosen action", caseIds: [] as string[] };
  if (!origin.familyId?.trim()) return { ready: false, reason: "Origin family needs a label", caseIds: [] as string[] };
  for (const candidate of situations) {
    if (candidate.id === origin.id || !candidate.familyId?.trim() || candidate.familyId.trim().toLowerCase() === origin.familyId.trim().toLowerCase()) continue;
    if (similarity(origin.prose, candidate.prose) > 0.55) return { ready: false, reason: "Possible duplicate family needs independent review", caseIds: [] as string[] };
    const run = sittings.find((s) => s.situationId === candidate.id);
    if (!run) continue;
    const labels = new Set(run.result.features.map((f) => FEATURE_LABEL[f] ?? f));
    if (memory.pattern.filter((p) => labels.has(p)).length < 2) continue;
    if (!supports(currentOutcome(outcomes, candidate.id), run)) continue;
    return { ready: true, reason: "Two labeled, distinct cases have supporting reported outcomes; causality remains unverified", caseIds: [origin.id, candidate.id] };
  }
  return { ready: false, reason: "Needs a distinct family with applicable pattern and supporting outcome", caseIds: [] as string[] };
}

function supports(outcome: ReturnType<typeof currentOutcome>, run?: Sitting): boolean {
  return !!(run && outcome.plan && outcome.result && outcome.result.assessment === "supports" &&
    (outcome.result.status === "observed" || outcome.result.status === "reported") &&
    outcome.result.evidence?.trim() && outcome.plan.proposedActionId === run.result.actions[0]?.id);
}

function similarity(a: string, b: string): number {
  const words = (s: string) => new Set(s.toLowerCase().match(/[a-z]{4,}/g) ?? []);
  const x = words(a); const y = words(b);
  if (!x.size || !y.size) return 0;
  return [...x].filter((word) => y.has(word)).length / new Set([...x, ...y]).size;
}

export function memoryFromResult(
  kind: MemoryObject["kind"],
  result: EngineResult,
  title: string,
  sittingId: string,
): Omit<MemoryObject, "id" | "at" | "status"> {
  const action = result.actions[0];
  const phrases = result.features
    .filter((f) => f.startsWith("sig:") || f.startsWith("stakes:"))
    .slice(0, 6)
    .map((f) => FEATURE_LABEL[f] ?? f);
  return {
    kind,
    title: kind === "unfinished" ? `Unfinished — ${title}` : (action?.title ?? title),
    pattern: phrases,
    body:
      kind === "unfinished"
        ? result.selfDoubt
        : `${action?.why ?? ""} ${action?.mismatch ?? ""}`.trim(),
    caveat: "Resemblance is not authorization. A similar symptom can have a different cause.",
    test: result.challenges[0]?.text ?? result.asks[0]?.text ?? "State what would count against this before reusing it.",
    revival: result.asks[0]?.text ?? "Reopen if the objective or the context changes.",
    sittingId,
  };
}
