import type { FlyEngram, SitInput } from "./types";
import { findAssertion } from "./interpret";

/** Fixed feature order. The projection below is a pure function of this list. */
export const FEATURES = [
  "sig:shared-ancestor",
  "sig:incentive",
  "sig:unmeasured",
  "sig:context-shift",
  "sig:disagreement",
  "sig:closure",
  "sig:pressure",
  "sig:relevance",
  "sig:metric-drift",
  "sig:rare",
  "sig:defaulted",
  "sig:units",
  "sig:reflexive",
  "sig:hedged",
  "sig:handoff",
  "sig:schema",
  "stakes:low",
  "stakes:consequential",
  "stakes:irreversible",
  "rev:yes",
  "rev:partial",
  "rev:no",
  "obj:missing",
  "obj:present",
  "choice:present",
  "mode:self",
] as const;

export type FeatureId = (typeof FEATURES)[number];

export const FEATURE_LABEL: Record<string, string> = {
  "sig:shared-ancestor": "repeated statements that may share one ancestor",
  "sig:incentive": "a claim from someone who benefits if it is accepted",
  "sig:unmeasured": "a property the choice needs that was never measured",
  "sig:context-shift": "evidence that may be leaving its envelope",
  "sig:disagreement": "accounts that do not agree",
  "sig:closure": "an inclination to close the question",
  "sig:pressure": "a push to commit before the gap is resolved",
  "sig:relevance": "a true-looking fact that may not serve the objective",
  "sig:metric-drift": "a score improving while the purpose is unchecked",
  "sig:rare": "a rare, unfamiliar, or previously unseen situation",
  "sig:defaulted": "an unknown that may have been filled with a default",
  "sig:units": "a unit, dimension, or convention that can reverse a fit",
  "sig:reflexive": "an intervention that can change the evidence",
  "sig:hedged": "wording that already knows it is unsure",
  "sig:handoff": "a finished tool and an unapproved result",
  "sig:schema": "a failed check against the current acceptance criteria",
  "stakes:low": "little depends on the choice",
  "stakes:consequential": "the choice has real consequences",
  "stakes:irreversible": "the choice is hard to undo",
  "rev:yes": "the next step can be taken back",
  "rev:partial": "only part of the next step can be taken back",
  "rev:no": "the next step cannot be taken back",
  "obj:missing": "no stated meaning of better",
  "obj:present": "a stated meaning of better",
  "choice:present": "an inclined move",
  "mode:self": "the instrument examining itself",
};

const KC_COUNT = 192;
const CLAWS = 6;
const WINNERS = 12;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable random claws: each Kenyon cell samples CLAWS feature indices. */
function claws(): number[][] {
  const rand = mulberry32(0x11a1);
  const table: number[][] = [];
  for (let k = 0; k < KC_COUNT; k++) {
    const chosen = new Set<number>();
    while (chosen.size < CLAWS) chosen.add(Math.floor(rand() * FEATURES.length));
    table.push([...chosen]);
  }
  return table;
}

const CLAW_TABLE = claws();

export function extractFeatures(input: Pick<SitInput, "prose" | "claim" | "objective" | "choice" | "stakes" | "reversible" | "mode" | "episode" | "dismissed" | "revealed" | "receipts">): FeatureId[] {
  const text = `${input.prose}\n${input.claim}\n${input.objective}\n${input.choice}`.toLowerCase();
  const dismissed = new Set(input.dismissed);
  const on = new Set<FeatureId>();

  const allow = (id: FeatureId, hit: boolean) => {
    const sig = id.startsWith("sig:") ? id.slice(4) : "";
    if (sig && dismissed.has(sig)) return;
    if (hit) on.add(id);
  };

  allow("sig:shared-ancestor", !!findAssertion(input, /(?:same|one|single|shared) (?:source|table|ancestor|specification)|copied (?:from|the same)|documents (?:share|copy)|all (?:come|came) from/i));
  allow("sig:incentive", !!findAssertion(input, /(?:supplier|vendor|salesperson|commission|incentive|benefits if|who gains)/i));
  allow("sig:unmeasured", !!findAssertion(input, /(?:not fully described|not (?:fully |well )?(?:described|known|measured|specified)|unmeasured|was never measured|we do not know|we don't know|missing measurement|unknown environment|isn't known|is not known)/i));
  allow("sig:context-shift", !!findAssertion(input, /(?:different|new|changed) (?:environment|setting|population|context)|(?:laboratory|lab) (?:to|versus|vs) (?:field|real world)|roll it out|transfer (?:to|from)/i));
  allow("sig:disagreement", !!findAssertion(input, /disagree|different convention|inconsistent|on the other hand|conflict|does not match|doesn't match/i));
  allow("sig:closure", !!findAssertion(input, /inclined|seems (?:better|preferable)|appears preferable|obviously|definitely|certainly|no doubt|just order|call (?:it|the) improved/i));
  allow("sig:pressure", !!findAssertion(input, /today|immediately|as soon as|downtime|deadline|cannot wait|can't wait|commit now|right away/i));
  allow("sig:relevance", !!findAssertion(input, /lighter|lightest|weighs less|cheaper|faster/i) && !/weight|mass|lightness/.test(input.objective.toLowerCase()));
  allow(
    "sig:metric-drift",
    /(score|metric|dashboard|kpi|alert).{0,80}(improv|cleaner|better|fewer)/.test(text) ||
      /(improv|cleaner|better).{0,60}(score|dashboard|metric)/.test(text),
  );
  allow("sig:rare", /rare|unusual|never seen|first time|black swan|unfamiliar|not anticipated/.test(text));
  allow("sig:defaulted", /default|assumed value|typical value|filled in|placeholder/.test(text));
  allow("sig:units", /unit|dimension|convention|millimet|millimeter|\bmm\b|inches/.test(text));
  allow("sig:reflexive", /false alarm|prevention|phrases avoid|learned which|changed (the |their )?behavior|behaviour|people adapt|gaming the/.test(text));
  allow("sig:hedged", /i think|i feel|not sure|unsure|probably|might|perhaps|i may/.test(text));
  allow("sig:handoff", /cannot approve|success code|tool returned|tool finished/.test(text));
  allow("sig:schema", (input.episode === "reviewer" && (input.revealed ?? []).includes("schema-fail")) || (input.receipts ?? []).some((r) => r.outcome === "fail"));

  on.add(`stakes:${input.stakes}`);
  on.add(`rev:${input.reversible}`);
  on.add(input.objective.trim() ? "obj:present" : "obj:missing");
  if (input.choice.trim()) on.add("choice:present");
  if (input.mode === "self") on.add("mode:self");

  return FEATURES.filter((f) => on.has(f));
}

/** Sparse expansion then winner-take-all, in the style of Kenyon cells. */
export function kenyon(features: string[]): number[] {
  const present = new Set(features);
  const scored = CLAW_TABLE.map((claw, index) => {
    let n = 0;
    for (const i of claw) if (present.has(FEATURES[i])) n += 1;
    return { index, n };
  });
  const active = scored.filter((s) => s.n >= 2).sort((a, b) => b.n - a.n || a.index - b.index);
  const top = (active.length ? active : scored.sort((a, b) => b.n - a.n)).slice(0, WINNERS);
  return top.map((t) => t.index).sort((a, b) => a - b);
}

export function overlapRatio(a: number[], b: number[]): number {
  if (!a.length || !b.length) return 0;
  const bs = new Set(b);
  let n = 0;
  for (const x of a) if (bs.has(x)) n += 1;
  return n / Math.max(a.length, b.length);
}

export interface Recall {
  novelty: number;
  best: FlyEngram | null;
  overlap: number;
  prior: { action: string; support: number } | null;
}

export function recallFly(kc: number[], engrams: FlyEngram[], now: number): Recall {
  if (!engrams.length) return { novelty: 1, best: null, overlap: 0, prior: null };
  let best: FlyEngram | null = null;
  let bestScore = 0;
  let bestOverlap = 0;
  const tally = new Map<string, number>();

  for (const e of engrams) {
    const raw = overlapRatio(kc, e.kc);
    const ageDays = Math.max(0, (now - e.at) / 86_400_000);
    const decayed = raw * Math.exp(-ageDays / 40);
    if (decayed > bestScore) {
      bestScore = decayed;
      bestOverlap = raw;
      best = e;
    }
    if (raw > 0.2 && e.valence !== 0) {
      tally.set(e.action, (tally.get(e.action) ?? 0) + e.valence * raw);
    }
  }

  let prior: Recall["prior"] = null;
  for (const [action, support] of tally) {
    if (!prior || support > prior.support) prior = { action, support };
  }
  if (prior && prior.support < 0.35) prior = null;

  return {
    novelty: Math.max(0, Math.min(1, 1 - bestScore)),
    best,
    overlap: bestOverlap,
    prior,
  };
}

export const KC_TOTAL = KC_COUNT;

/** Drop prestige and pressure-to-close wording. Structural facts stay. */
export function stripPrestige(text: string): string {
  return text
    .replace(/\b(inclined|inclination|unnecessary|persuasive|prestige|impressive|obviously|certainly|definitely)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.])/g, "$1")
    .trim();
}
