import { FEATURE_LABEL } from "./fly";
import type { EngineResult, MemoryObject } from "./types";

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

export function hasSecondCase(
  memory: MemoryObject,
  sittings: { id: string; situationId: string; result: { features?: string[] } }[],
  originSituationId?: string,
): boolean {
  const pattern = new Set(memory.pattern);
  if (pattern.size === 0) return false;
  return sittings.some((sitting) => {
    if (sitting.id === memory.sittingId) return false;
    if (originSituationId && sitting.situationId === originSituationId) return false;
    const phrases = (sitting.result.features ?? []).map((f) => FEATURE_LABEL[f] ?? f);
    let n = 0;
    for (const phrase of phrases) if (pattern.has(phrase)) n += 1;
    return n >= 2;
  });
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
