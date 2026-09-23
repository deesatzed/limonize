import { create } from "zustand";
import { persist } from "zustand/middleware";
import { featurePhrases, RULE_NAMES, runEngine } from "./engine";
import { hasSecondCase, memoryFromResult } from "./memory";
import type { Draft } from "./store-types";
import type {
  Answer,
  Blindspot,
  FlyEngram,
  MemoryKind,
  MemoryObject,
  Move,
  Reflex,
  SelfReport,
  Sitting,
  Situation,
  Verdict,
  ViewId,
  RoleId,
} from "./types";

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export interface LimenStore {
  view: ViewId;
  situations: Situation[];
  sittings: Sitting[];
  activeSittingId: string | null;
  engrams: FlyEngram[];
  memories: MemoryObject[];
  blindspots: Blindspot[];
  reflexes: Reflex[];
  ruleBias: Record<string, number>;
  ruleStats: Record<string, { fire: number; useful: number; noise: number }>;
  opBias: Partial<Record<import("./types").FlyOp, number>>;
  subBias: Record<string, number>;
  setView: (view: ViewId) => void;
  open: (sittingId: string) => void;
  sit: (draft: Draft) => void;
  correctReading: (signal: string, accept: boolean) => void;
  answer: (id: string, value: Answer) => void;
  feedback: (verdict: Verdict, move: Move, note: string) => void;
  keepMemory: (kind: MemoryKind) => void;
  promoteMemory: (id: string) => void;
  applyCheck: (check: "paraphrase" | "schema") => void;
  markSeat: (subRoleId: string, verdict: "useful" | "noise") => void;
  rotateRole: (roleId: RoleId) => void;
  retireMemory: (id: string) => void;
  teachBlindspot: (text: string, signal?: string) => void;
  removeBlindspot: (id: string) => void;
  teachReflex: (when: string, ask: string, never: string) => void;
  removeReflex: (id: string) => void;
  assessSelf: () => void;
  setGrok: (sittingId: string, text: string, model?: string) => void;
  release: () => void;
}

function blankData() {
  return {
    view: "sit" as ViewId,
    situations: [] as Situation[],
    sittings: [] as Sitting[],
    activeSittingId: null as string | null,
    engrams: [] as FlyEngram[],
    memories: [] as MemoryObject[],
    blindspots: [] as Blindspot[],
    reflexes: [] as Reflex[],
    ruleBias: {} as Record<string, number>,
    ruleStats: {} as Record<string, { fire: number; useful: number; noise: number }>,
    opBias: {} as LimenStore["opBias"],
    subBias: {} as Record<string, number>,
  };
}

function selfReport(get: () => LimenStore): SelfReport {
  const { situations, sittings, ruleStats } = get();
  const caseIds = new Set(situations.filter((s) => s.mode === "case").map((s) => s.id));
  const rows = sittings.filter((s) => caseIds.has(s.situationId));
  let useful = 0;
  let noise = 0;
  let unevaluated = 0;
  for (const row of rows) {
    if (!row.feedback) unevaluated += 1;
    else if (row.feedback.verdict === "useful") useful += 1;
    else if (row.feedback.verdict === "noise") noise += 1;
  }
  let topNoisyRule: string | undefined;
  let top = 0;
  for (const [id, stat] of Object.entries(ruleStats)) {
    if (stat.noise > top) {
      top = stat.noise;
      topNoisyRule = RULE_NAMES[id] ?? id;
    }
  }
  return { sittings: rows.length, useful, noise, unevaluated, topNoisyRule: top ? topNoisyRule : undefined };
}

function runFor(situation: Situation, get: () => LimenStore) {
  const state = get();
  return runEngine({
    prose: situation.prose,
    claim: situation.claim,
    objective: situation.objective,
    choice: situation.choice,
    stakes: situation.stakes,
    reversible: situation.reversible,
    answers: situation.answers,
    dismissed: situation.dismissed,
    reflexes: state.reflexes,
    blindspots: state.blindspots,
    engrams: state.engrams,
    ruleBias: state.ruleBias,
    mode: situation.mode,
    episode: situation.episode,
    revealed: situation.revealed ?? [],
    checks: situation.checks ?? [],
    opBias: state.opBias,
    subBias: state.subBias,
    selfReport: situation.mode === "self" ? selfReport(get) : undefined,
  });
}

function bumpFires(stats: LimenStore["ruleStats"], sitting: Sitting) {
  const next = { ...stats };
  for (const step of sitting.result.trace) {
    const prev = next[step.ruleId] ?? { fire: 0, useful: 0, noise: 0 };
    next[step.ruleId] = { ...prev, fire: prev.fire + 1 };
  }
  return next;
}

export const useLimen = create<LimenStore>()(
  persist(
    (set, get) => ({
      ...blankData(),
      setView: (view) => set({ view }),
      open: (sittingId) => set({ activeSittingId: sittingId, view: "mind" }),
      sit: (draft) => {
        const situation: Situation = {
          id: uid(),
          ...draft,
          title: draft.title.trim() || draft.prose.trim().slice(0, 72),
          answers: {},
          dismissed: [],
          revealed: [],
          checks: [],
          mode: "case",
          createdAt: Date.now(),
        };
        const result = runFor(situation, get);
        const sitting: Sitting = { id: uid(), situationId: situation.id, at: Date.now(), result };
        set({
          situations: [situation, ...get().situations],
          sittings: [sitting, ...get().sittings],
          activeSittingId: sitting.id,
          view: "mind",
          ruleStats: bumpFires(get().ruleStats, sitting),
        });
      },
      correctReading: (signal, accept) => {
        const current = currentPair(get());
        if (!current) return;
        const answers = { ...current.situation.answers };
        const dismissed = current.situation.dismissed.filter((d) => d !== signal);
        if (accept) answers[signal] = "yes";
        else {
          delete answers[signal];
          dismissed.push(signal);
        }
        const situation = { ...current.situation, answers, dismissed };
        const result = runFor(situation, get);
        replaceActive(set, get, situation, result);
      },
      answer: (id, value) => {
        const current = currentPair(get());
        if (!current) return;
        const situation = { ...current.situation, answers: { ...current.situation.answers, [id]: value } };
        const result = runFor(situation, get);
        replaceActive(set, get, situation, result);
      },
      feedback: (verdict, move, note) => {
        const current = currentPair(get());
        if (!current) return;
        const { sitting } = current;
        const delta = verdict === "useful" ? 1 : verdict === "noise" ? -1 : 0;
        const valence = verdict === "useful" ? 1 : verdict === "noise" ? -1 : 0.15;
        const bias = { ...get().ruleBias };
        const stats = { ...get().ruleStats };
        const opBias = { ...(get().opBias ?? {}) };
        const subBias = { ...(get().subBias ?? {}) };
        const op = sitting.result.router?.op;
        if (op && delta !== 0) opBias[op] = Math.max(-3, Math.min(4, (opBias[op] ?? 0) + delta));
        for (const seat of sitting.result.hive ?? []) {
          if (delta === 0 || seat.active === false) continue;
          subBias[seat.subRoleId] = clampBias(subBias[seat.subRoleId], delta);
          const [model, role] = seat.subRoleId.split("|");
          if (model && role) subBias[`occupy:${role}:${model}`] = clampBias(subBias[`occupy:${role}:${model}`], delta);
        }
        for (const step of sitting.result.trace) {
          if (step.module !== "challenge" && step.module !== "decide" && step.module !== "attend") continue;
          if (delta !== 0) {
            bias[step.ruleId] = Math.max(-2, Math.min(3, (bias[step.ruleId] ?? 0) + delta));
          }
          const prev = stats[step.ruleId] ?? { fire: 0, useful: 0, noise: 0 };
          stats[step.ruleId] = {
            ...prev,
            useful: prev.useful + (verdict === "useful" ? 1 : 0),
            noise: prev.noise + (verdict === "noise" ? 1 : 0),
          };
        }
        const action = sitting.result.actions[0]?.id ?? "stay-quiet";
        const engram: FlyEngram = {
          id: uid(),
          sittingId: sitting.id,
          kc: sitting.result.kc,
          at: Date.now(),
          action,
          valence,
          summary: `${current.situation.title}: ${sitting.result.actions[0]?.title ?? "quiet"}`,
          features: sitting.result.features,
        };
        const engrams = [engram, ...get().engrams.filter((e) => e.sittingId !== sitting.id)];
        const sittings = get().sittings.map((s) =>
          s.id === sitting.id ? { ...s, feedback: { verdict, move, note, at: Date.now() } } : s,
        );
        set({ ruleBias: bias, ruleStats: stats, opBias, subBias, engrams, sittings });
      },
      keepMemory: (kind) => {
        const current = currentPair(get());
        if (!current) return;
        if (get().memories.some((m) => m.sittingId === current.sitting.id && m.kind === kind && m.status !== "retired")) {
          return;
        }
        const seed = memoryFromResult(kind, current.sitting.result, current.situation.title, current.sitting.id);
        const memory: MemoryObject = { ...seed, id: uid(), at: Date.now(), status: "candidate" };
        set({ memories: [memory, ...get().memories], view: "ledger" });
      },
      promoteMemory: (id) => {
        const memory = get().memories.find((m) => m.id === id);
        if (!memory || memory.status !== "candidate") return;
        const origin = get().sittings.find((s) => s.id === memory.sittingId)?.situationId;
        if (!hasSecondCase(memory, get().sittings, origin)) return;
        set({
          memories: get().memories.map((m) => (m.id === id ? { ...m, status: "kept" } : m)),
        });
      },
      applyCheck: (check) => {
        const current = currentPair(get());
        if (!current) return;
        const revealed = [...(current.situation.revealed ?? [])];
        const checks = [...(current.situation.checks ?? [])];
        if (check === "schema" && !revealed.includes("schema-fail")) revealed.push("schema-fail");
        if (check === "paraphrase" && !checks.includes("paraphrase")) checks.push("paraphrase");
        const situation = { ...current.situation, revealed, checks };
        const result = runFor(situation, get);
        replaceActive(set, get, situation, result);
      },
      markSeat: (subRoleId, verdict) => {
        const delta = verdict === "useful" ? 1 : -1;
        const subBias = { ...(get().subBias ?? {}) };
        subBias[subRoleId] = clampBias(subBias[subRoleId], delta);
        const [model, role] = subRoleId.split("|");
        if (model && role) subBias[`occupy:${role}:${model}`] = clampBias(subBias[`occupy:${role}:${model}`], delta);
        set({ subBias });
        const current = currentPair(get());
        if (!current) return;
        const result = runFor(current.situation, get);
        const active = get().activeSittingId;
        set({
          sittings: get().sittings.map((s) => (s.id === active ? { ...s, result } : s)),
        });
      },
      rotateRole: (roleId) => {
        const current = currentPair(get());
        if (!current) return;
        const seat = current.sitting.result.hive?.find((s) => s.roleId === roleId);
        if (!seat) return;
        const order = ["gemini", "astra", "fable", "grok"] as const;
        const next = order[(Math.max(0, order.indexOf(seat.id)) + 1) % order.length];
        const subBias = { ...(get().subBias ?? {}) };
        const key = `occupy:${roleId}:${next}`;
        subBias[key] = Math.min(8, (subBias[key] ?? 0) + 4);
        set({ subBias });
        const result = runFor(current.situation, get);
        const active = get().activeSittingId;
        set({
          sittings: get().sittings.map((s) => (s.id === active ? { ...s, result } : s)),
        });
      },
      retireMemory: (id) => {
        set({
          memories: get().memories.map((m) => (m.id === id ? { ...m, status: "retired" } : m)),
        });
      },
      teachBlindspot: (text, signal) => {
        const clean = text.trim();
        if (!clean) return;
        const spot: Blindspot = { id: uid(), text: clean, signal, at: Date.now() };
        set({ blindspots: [spot, ...get().blindspots] });
        refreshActive(set, get);
      },
      removeBlindspot: (id) => {
        set({ blindspots: get().blindspots.filter((b) => b.id !== id) });
        refreshActive(set, get);
      },
      teachReflex: (when, ask, never) => {
        if (!when.trim() || !ask.trim()) return;
        const reflex: Reflex = { id: uid(), when: when.trim(), ask: ask.trim(), never: never.trim(), at: Date.now() };
        set({ reflexes: [reflex, ...get().reflexes] });
        refreshActive(set, get);
      },
      removeReflex: (id) => {
        set({ reflexes: get().reflexes.filter((r) => r.id !== id) });
        refreshActive(set, get);
      },
      assessSelf: () => {
        const report = selfReport(get);
        const situation: Situation = {
          id: uid(),
          title: "Sitting with myself",
          prose: `This is the instrument examining its own record. It has sat with ${report.sittings} situations. ${report.useful} were marked useful, ${report.noise} were marked noise, and ${report.unevaluated} were never marked. ${report.topNoisyRule ? `The noisiest rule has been “${report.topNoisyRule}”.` : "No rule has been marked noisy yet."} The claim under review is that recent recommendations were appropriate to the gaps found.`,
          claim: "Recent recommendations were appropriate to the gaps that were found.",
          objective: "Choose responses, including silence, that later marks call useful — and notice misses that were never marked.",
          choice: "Keep the current rule weights.",
          stakes: report.sittings >= 4 ? "consequential" : "low",
          reversible: "yes",
          answers: {},
          dismissed: [],
          revealed: [],
          checks: [],
          mode: "self",
          createdAt: Date.now(),
        };
        const result = runFor(situation, get);
        const sitting: Sitting = { id: uid(), situationId: situation.id, at: Date.now(), result };
        set({
          situations: [situation, ...get().situations],
          sittings: [sitting, ...get().sittings],
          activeSittingId: sitting.id,
          view: "mind",
          ruleStats: bumpFires(get().ruleStats, sitting),
        });
      },
      setGrok: (sittingId, text, model) => {
        set({
          sittings: get().sittings.map((s) => (s.id === sittingId ? { ...s, grok: text, grokModel: model } : s)),
        });
      },
      release: () => set({ ...blankData() }),
    }),
    {
      name: "limen-v1",
      skipHydration: true,
      partialize: (state) => ({
        view: state.view,
        situations: state.situations,
        sittings: state.sittings,
        activeSittingId: state.activeSittingId,
        engrams: state.engrams,
        memories: state.memories,
        blindspots: state.blindspots,
        reflexes: state.reflexes,
        ruleBias: state.ruleBias,
        ruleStats: state.ruleStats,
        opBias: state.opBias,
        subBias: state.subBias,
      }),
    },
  ),
);

function clampBias(current: number | undefined, delta: number): number {
  return Math.max(-3, Math.min(4, (current ?? 0) + delta));
}

function currentPair(state: LimenStore) {
  const sitting = state.sittings.find((s) => s.id === state.activeSittingId);
  if (!sitting) return null;
  const situation = state.situations.find((s) => s.id === sitting.situationId);
  if (!situation) return null;
  return { sitting, situation };
}

function refreshActive(set: (partial: Partial<LimenStore>) => void, get: () => LimenStore) {
  const current = currentPair(get());
  if (!current) return;
  const result = runFor(current.situation, get);
  replaceActive(set, get, current.situation, result);
}

function replaceActive(
  set: (partial: Partial<LimenStore>) => void,
  get: () => LimenStore,
  situation: Situation,
  result: Sitting["result"],
) {
  const active = get().activeSittingId;
  set({
    situations: get().situations.map((s) => (s.id === situation.id ? situation : s)),
    sittings: get().sittings.map((s) => (s.id === active ? { ...s, result, feedback: undefined, grok: undefined } : s)),
  });
}

export function idleLines(state: Pick<LimenStore, "sittings" | "situations" | "memories" | "blindspots" | "ruleStats" | "engrams">): string[] {
  const caseIds = new Set(state.situations.filter((s) => s.mode === "case").map((s) => s.id));
  const rows = state.sittings.filter((s) => caseIds.has(s.situationId));
  const useful = rows.filter((r) => r.feedback?.verdict === "useful").length;
  const noise = rows.filter((r) => r.feedback?.verdict === "noise").length;
  const unfinished = state.memories.filter((m) => m.kind === "unfinished" && m.status !== "retired").length;
  const repairs = state.memories.filter((m) => m.kind === "repair" && m.status !== "retired").length;
  const lines: string[] = [];
  if (!rows.length) {
    lines.push("I have not sat with anything of yours yet. I know several shapes of not-knowing, and I do not know which of them I over-apply.");
  } else {
    lines.push(`I have sat ${rows.length} time${rows.length === 1 ? "" : "s"}. ${useful} marked useful, ${noise} marked noise.`);
  }
  if (unfinished) lines.push(`${unfinished} unfinished question${unfinished === 1 ? "" : "s"}. I will not pretend they closed.`);
  if (repairs) lines.push(`${repairs} repair${repairs === 1 ? "" : "s"} in memory. Overlap is not permission to use them.`);
  if (state.blindspots[0]) lines.push(`You told me I miss this: ${state.blindspots[0].text}`);
  let topName = "";
  let top = 0;
  for (const [id, stat] of Object.entries(state.ruleStats)) {
    if (stat.noise > top) {
      top = stat.noise;
      topName = RULE_NAMES[id] ?? id;
    }
  }
  if (topName) lines.push(`I have been noisiest with “${topName}”. I should be slower to fire it.`);
  return lines.slice(0, 3);
}

export function describeFeatures(features: string[]): string[] {
  return featurePhrases(features);
}

export type { Draft };
