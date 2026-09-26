import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { featurePhrases, RULE_NAMES, runEngine } from "./engine";
import { extractFeatures } from "./fly";
import { checkReportArtifact } from "./check";
import { currentOutcome, deriveLearning, dueFollowUps, effectiveFeedback } from "./ledger";
import { migrateLegacy, parseImport, validateData } from "./data";
import { guardedStorage } from "./storage";
import { assessMemory, memoryFromResult, retrieveMemories } from "./memory";
import type { Draft } from "./store-types";
import type {
  Answer,
  Blindspot,
  FlyEngram,
  FeedbackEvent,
  MemoryKind,
  MemoryObject,
  Move,
  OutcomeEvent,
  Reflex,
  SelfReport,
  Sitting,
  Situation,
  Verdict,
  ViewId,
  RoleId,
  RoleFeedbackEvent,
  ProviderResponse,
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
  feedbackEvents: FeedbackEvent[];
  roleEvents: RoleFeedbackEvent[];
  adaptiveEnabled: boolean;
  learningPaused: boolean;
  setLearningPaused: (paused: boolean) => void;
  roleBias: Record<string, number>;
  setAdaptiveEnabled: (enabled: boolean) => void;
  outcomeEvents: OutcomeEvent[];
  draft: Draft;
  setDraft: (draft: Draft) => void;
  setView: (view: ViewId) => void;
  open: (sittingId: string) => void;
  sit: (draft: Draft) => void;
  reviseCase: (patch: Partial<Draft>) => void;
  correctReading: (signal: string, accept: boolean) => void;
  answer: (id: string, value: Answer) => void;
  feedback: (verdict: Verdict, move: Move, note: string) => void;
  recordFeedback: (event: FeedbackEvent) => void;
  planOutcome: (action: string, expectation: string, revisionCondition: string, revisitAt?: number, revisitCondition?: string) => void;
  recordOutcome: (status: OutcomeEvent["status"], evidence: string, changed: string, assessment?: OutcomeEvent["assessment"]) => void;
  deferOutcome: (revisitAt: number) => void;
  triggerOutcomeCondition: () => void;
  dueCaseIds: (now: number) => string[];
  keepMemory: (kind: MemoryKind) => void;
  promoteMemory: (id: string) => void;
  applyCheck: (check: "paraphrase" | "schema") => void;
  checkArtifact: (artifact: string) => void;
  markSeat: (subRoleId: string, verdict: "useful" | "noise") => void;
  rotateRole: (roleId: RoleId) => void;
  retireMemory: (id: string) => void;
  teachBlindspot: (text: string, signal?: string) => void;
  removeBlindspot: (id: string) => void;
  teachReflex: (when: string, ask: string, never: string) => void;
  removeReflex: (id: string) => void;
  assessSelf: () => void;
  setGrok: (sittingId: string, text: string, model?: string) => void;
  addProviderResponse: (response: ProviderResponse) => void;
  deleteCase: (caseId: string) => void;
  deleteMemory: (id: string) => void;
  importData: (json: string) => ReturnType<typeof parseImport>["preview"];
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
    feedbackEvents: [] as FeedbackEvent[],
    roleEvents: [] as RoleFeedbackEvent[],
    adaptiveEnabled: false,
    learningPaused: false,
    roleBias: {} as Record<string, number>,
    outcomeEvents: [] as OutcomeEvent[],
    draft: { title: "", prose: "", claim: "", objective: "", choice: "", stakes: "consequential", reversible: "partial" } as Draft,
  };
}

function selfReport(get: () => LimenStore): SelfReport {
  const { situations, ruleStats, feedbackEvents } = get();
  const caseIds = new Set(situations.filter((s) => s.mode === "case").map((s) => s.id));
  let useful = 0;
  let noise = 0;
  let unevaluated = 0;
  const effective = new Map(effectiveFeedback(feedbackEvents).map((event) => [event.caseId, event]));
  for (const caseId of caseIds) {
    const row = effective.get(caseId);
    if (!row) unevaluated += 1;
    else if (row.verdict === "useful") useful += 1;
    else if (row.verdict === "noise") noise += 1;
  }
  let topNoisyRule: string | undefined;
  let top = 0;
  for (const [id, stat] of Object.entries(ruleStats)) {
    if (stat.noise > top) {
      top = stat.noise;
      topNoisyRule = RULE_NAMES[id] ?? id;
    }
  }
  return { sittings: caseIds.size, useful, noise, unevaluated, topNoisyRule: top ? topNoisyRule : undefined };
}

function runFor(situation: Situation, get: () => LimenStore, runId?: string) {
  const state = get();
  const features = new Set<string>(extractFeatures({ prose: situation.prose, claim: situation.claim, objective: situation.objective, choice: situation.choice, stakes: situation.stakes, reversible: situation.reversible, mode: situation.mode, episode: situation.episode, dismissed: situation.dismissed, revealed: situation.revealed, receipts: situation.receipts }));
  const contextual = !state.learningPaused && state.adaptiveEnabled ? effectiveFeedback(state.feedbackEvents).filter((event) => {
    const previous = state.sittings.find((row) => row.id === event.runId);
    return previous && previous.result.features.filter((feature) => feature.startsWith("sig:") && features.has(feature)).length >= 2 && previous.snapshot?.stakes === situation.stakes;
  }) : [];
  const contextualIds = new Set(contextual.map((event) => event.caseId));
  const contextualLearning = deriveLearning(contextual, state.sittings, state.situations, state.roleEvents.filter((event) => contextualIds.has(event.caseId)));
  const result = runEngine({
    prose: situation.prose,
    claim: situation.claim,
    objective: situation.objective,
    choice: situation.choice,
    stakes: situation.stakes,
    reversible: situation.reversible,
    answers: situation.answers,
    dismissed: situation.dismissed,
    reflexes: state.learningPaused ? [] : state.reflexes,
    blindspots: state.learningPaused ? [] : state.blindspots,
    engrams: contextualLearning.engrams,
    ruleBias: contextualLearning.ruleBias,
    mode: situation.mode,
    episode: situation.episode,
    caseId: situation.id,
    runId: runId ?? state.activeSittingId ?? undefined,
    now: situation.createdAt,
    receipts: situation.receipts ?? [],
    revealed: situation.revealed ?? [],
    checks: situation.checks ?? [],
    opBias: contextualLearning.opBias,
    subBias: state.learningPaused ? {} : { ...state.roleBias, ...contextualLearning.subBias },
    selfReport: situation.mode === "self" ? selfReport(get) : undefined,
  });
  return { ...result, memoryCandidates: state.learningPaused ? [] : retrieveMemories(state.memories, result.features) };
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
      setAdaptiveEnabled: (enabled) => set({ adaptiveEnabled: enabled }),
      setLearningPaused: (paused) => {
        if (typeof paused !== "boolean" || get().learningPaused === paused) return;
        set({ learningPaused: paused });
        refreshActive(set, get);
      },
      setDraft: (draft) => set({ draft }),
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
        const sittingId = uid();
        const result = runFor(situation, get, sittingId);
        const sitting: Sitting = { id: sittingId, situationId: situation.id, at: Date.now(), result, snapshot: structuredClone(situation), revisionReason: "initial" };
        set({
          situations: [situation, ...get().situations],
          sittings: [sitting, ...get().sittings],
          activeSittingId: sitting.id,
          view: "mind",
          ruleStats: bumpFires(get().ruleStats, sitting),
        });
      },
      reviseCase: (patch) => {
        const current = currentPair(get());
        if (!current) return;
        const situation = { ...current.situation, ...patch };
        if (situation.prose.trim().length < 20) return;
        appendRevision(set, get, situation, "case fields edited");
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
        appendRevision(set, get, situation, accept ? "reading confirmed" : "reading dismissed");
      },
      answer: (id, value) => {
        const current = currentPair(get());
        if (!current) return;
        const situation = { ...current.situation, answers: { ...current.situation.answers, [id]: value } };
        appendRevision(set, get, situation, `answer ${id}: ${value}`);
      },
      feedback: (verdict, move, note) => {
        const current = currentPair(get());
        if (!current) return;
        const previous = effectiveFeedback(get().feedbackEvents).find((event) => event.caseId === current.situation.id);
        if (previous?.runId === current.sitting.id && previous.verdict === verdict && previous.move === move && previous.note === note) return;
        get().recordFeedback({
          id: uid(), caseId: current.situation.id, runId: current.sitting.id,
          targetId: current.sitting.result.actions[0]?.id ?? "stay-quiet",
          verdict, move, note, at: Date.now(), supersedes: previous?.id,
        });
      },
      recordFeedback: (event) => {
        if (get().feedbackEvents.some((old) => old.id === event.id)) return;
        const sitting = get().sittings.find((row) => row.id === event.runId && row.situationId === event.caseId);
        if (!sitting || !sitting.result.actions.some((action) => action.id === event.targetId) && event.targetId !== "stay-quiet") return;
        const events = [...get().feedbackEvents, event];
        set({ feedbackEvents: events, ...deriveLearning(events, get().sittings, get().situations, get().roleEvents) });
      },
      planOutcome: (action, expectation, revisionCondition, revisitAt, revisitCondition) => {
        const current = currentPair(get());
        if (!current || !action.trim() || !expectation.trim()) return;
        const event: OutcomeEvent = { id: uid(), caseId: current.situation.id, runId: current.sitting.id, at: Date.now(), kind: "plan", action: action.trim(), expectation: expectation.trim(), revisionCondition: revisionCondition.trim(), revisitAt, revisitCondition: revisitCondition?.trim(), proposedActionId: current.sitting.result.actions.find((a) => a.title === action.trim())?.id };
        set({ outcomeEvents: [...get().outcomeEvents, event] });
      },
      recordOutcome: (status, evidence, changed, assessment) => {
        const current = currentPair(get());
        if (!current || !status) return;
        const prior = currentOutcome(get().outcomeEvents, current.situation.id);
        if (!prior.plan) return;
        const event: OutcomeEvent = { id: uid(), caseId: current.situation.id, runId: current.sitting.id, at: Date.now(), kind: "result", status, evidence: evidence.trim(), changed: changed.trim(), assessment, supersedes: prior.result?.id };
        const memories = assessment === "contradicts" ? get().memories.map((m) => {
          const originCase = get().sittings.find((s) => s.id === m.sittingId)?.situationId;
          return originCase === event.caseId || m.validationCaseIds?.includes(event.caseId)
            ? { ...m, status: "candidate" as const, validationStatus: "counterexample" as const, counterexamples: [...(m.counterexamples ?? []), event.id] }
            : m;
        }) : get().memories;
        set({ outcomeEvents: [...get().outcomeEvents, event], memories });
      },
      deferOutcome: (revisitAt) => {
        const current = currentPair(get());
        if (!current || !Number.isFinite(revisitAt)) return;
        set({ outcomeEvents: [...get().outcomeEvents, { id: uid(), caseId: current.situation.id, runId: current.sitting.id, at: Date.now(), kind: "defer", revisitAt }] });
      },
      triggerOutcomeCondition: () => {
        const current = currentPair(get());
        if (!current) return;
        const plan = currentOutcome(get().outcomeEvents, current.situation.id).plan;
        if (!plan?.revisitCondition?.trim()) return;
        set({ outcomeEvents: [...get().outcomeEvents, { id: uid(), caseId: current.situation.id, runId: current.sitting.id, at: Date.now(), kind: "trigger", evidence: plan.revisitCondition }] });
      },
      dueCaseIds: (now) => dueFollowUps(get().outcomeEvents, now),
      keepMemory: (kind) => {
        const current = currentPair(get());
        if (!current) return;
        if (get().memories.some((m) => m.sittingId === current.sitting.id && m.kind === kind && m.status !== "retired")) {
          return;
        }
        const seed = memoryFromResult(kind, current.sitting.result, current.situation.title, current.sitting.id);
        const memory: MemoryObject = { ...seed, id: uid(), at: Date.now(), status: "candidate", validationStatus: "unvalidated", originFamily: current.situation.familyId, prerequisites: current.sitting.result.features.filter((f) => f.startsWith("sig:")).slice(0, 3), exclusions: [], validationCaseIds: [] };
        set({ memories: [memory, ...get().memories], view: "ledger" });
      },
      promoteMemory: (id) => {
        const memory = get().memories.find((m) => m.id === id);
        if (!memory || memory.status !== "candidate") return;
        const assessment = assessMemory(memory, get().situations, get().sittings, get().outcomeEvents);
        if (!assessment.ready) return;
        set({
          memories: get().memories.map((m) => (m.id === id ? { ...m, status: "kept", validationStatus: "validated", validationCaseIds: assessment.caseIds } : m)),
        });
      },
      applyCheck: (check) => {
        const current = currentPair(get());
        if (!current) return;
        const revealed = [...(current.situation.revealed ?? [])];
        const checks = [...(current.situation.checks ?? [])];
        if (check === "schema" && current.situation.episode === "reviewer" && !revealed.includes("schema-fail")) revealed.push("schema-fail");
        if (check === "paraphrase" && !checks.includes("paraphrase")) checks.push("paraphrase");
        const situation = { ...current.situation, revealed, checks };
        appendRevision(set, get, situation, `local ${check} simulation`);
      },
      checkArtifact: (artifact) => {
        const current = currentPair(get());
        if (!current) return;
        const receipt = checkReportArtifact(artifact, current.situation.id, uid());
        const situation = {
          ...current.situation,
          receipts: [...(current.situation.receipts ?? []), receipt],
        };
        appendRevision(set, get, situation, "document checked", receipt.runId);
      },
      markSeat: (subRoleId, verdict) => {
        const current = currentPair(get());
        if (!current) return;
        if (!current.sitting.result.hive.some((seat) => seat.subRoleId === subRoleId && seat.active)) return;
        const prior = get().roleEvents.filter((event) => event.caseId === current.situation.id).at(-1);
        if (prior?.runId === current.sitting.id && prior.subRoleId === subRoleId && prior.verdict === verdict) return;
        const roleEvents: RoleFeedbackEvent[] = [...get().roleEvents, { id: uid(), caseId: current.situation.id, runId: current.sitting.id, subRoleId, verdict, at: Date.now(), supersedes: prior?.id }];
        set({ roleEvents, ...deriveLearning(get().feedbackEvents, get().sittings, get().situations, roleEvents) });
      },
      rotateRole: (roleId) => {
        const current = currentPair(get());
        if (!current) return;
        const seat = current.sitting.result.hive?.find((s) => s.roleId === roleId);
        if (!seat) return;
        const order = ["gemini", "astra", "fable", "grok"] as const;
        const next = order[(Math.max(0, order.indexOf(seat.id)) + 1) % order.length];
        const subBias = { ...(get().roleBias ?? {}) };
        const key = `occupy:${roleId}:${next}`;
        subBias[key] = Math.min(8, (subBias[key] ?? 0) + 4);
        set({ roleBias: subBias });
        appendRevision(set, get, current.situation, `role ${roleId} rotated`);
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
        const sittingId = uid();
        const result = runFor(situation, get, sittingId);
        const sitting: Sitting = { id: sittingId, situationId: situation.id, at: Date.now(), result, snapshot: structuredClone(situation), revisionReason: "self review" };
        set({
          situations: [situation, ...get().situations],
          sittings: [sitting, ...get().sittings],
          activeSittingId: sitting.id,
          view: "mind",
          ruleStats: bumpFires(get().ruleStats, sitting),
        });
      },
      setGrok: (sittingId, text, model) => {
        const sitting = get().sittings.find((s) => s.id === sittingId);
        const seat = sitting?.result.hive.find((s) => s.id === "grok" && s.active);
        if (!sitting || !seat) return;
        get().addProviderResponse({ id: uid(), requestId: uid(), caseId: sitting.situationId, runId: sitting.id, roleId: seat.roleId, model: model ?? "unknown", text, at: Date.now() });
      },
      addProviderResponse: (response) => {
        const sitting = get().sittings.find((s) => s.id === response.runId && s.situationId === response.caseId);
        if (!sitting || !get().situations.some((s) => s.id === response.caseId)) return;
        const seat = sitting.result.hive.find((s) => s.roleId === response.roleId && s.id === "grok" && s.active);
        if (!seat || sitting.responses?.some((r) => r.requestId === response.requestId)) return;
        set({ sittings: get().sittings.map((s) => s.id === sitting.id ? { ...s, responses: [...(s.responses ?? []), response] } : s) });
      },
      deleteCase: (caseId) => {
        const retained = get().sittings.filter((s) => s.situationId !== caseId);
        const situations = get().situations.filter((s) => s.id !== caseId);
        const feedbackEvents = get().feedbackEvents.filter((e) => e.caseId !== caseId);
        const removedRuns = new Set(get().sittings.filter((s) => s.situationId === caseId).map((s) => s.id));
        const memories = get().memories.filter((m) => !removedRuns.has(m.sittingId)).map((m) => m.validationCaseIds?.includes(caseId) ? { ...m, status: "candidate" as const, validationStatus: "unvalidated" as const, validationCaseIds: m.validationCaseIds.filter((id) => id !== caseId) } : m);
        const affectedMemoryIds = new Set(get().memories.filter((m) => removedRuns.has(m.sittingId) || m.validationCaseIds?.includes(caseId)).map((m) => m.id));
        const sittings = redactLearningReferences(retained, affectedMemoryIds, true);
        const roleEvents = get().roleEvents.filter((e) => e.caseId !== caseId);
        set({ situations, sittings, memories, feedbackEvents, roleEvents, outcomeEvents: get().outcomeEvents.filter((e) => e.caseId !== caseId), activeSittingId: removedRuns.has(get().activeSittingId ?? "") ? null : get().activeSittingId, ...deriveLearning(feedbackEvents, sittings, situations, roleEvents) });
      },
      deleteMemory: (id) => set({ memories: get().memories.filter((m) => m.id !== id), sittings: redactLearningReferences(get().sittings, new Set([id]), false) }),
      importData: (json) => {
        const result = parseImport(json, get());
        set(result.merged);
        return result.preview;
      },
      release: () => {
        void useLimen.persist.clearStorage();
        set({ ...blankData() });
      },
    }),
    {
      name: "limen-v1",
      version: 2,
      storage: createJSONStorage(() => guardedStorage),
      skipHydration: true,
      migrate: (state) => {
        const data = migrateLegacy(state);
        return { ...data, ...deriveLearning(data.feedbackEvents, data.sittings, data.situations) };
      },
      merge: (persisted, current) => {
        if (persisted === undefined) return current;
        const data = validateData(persisted);
        return { ...current, ...data, ...deriveLearning(data.feedbackEvents, data.sittings, data.situations, data.roleEvents) };
      },
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
        feedbackEvents: state.feedbackEvents,
        roleEvents: state.roleEvents,
        adaptiveEnabled: state.adaptiveEnabled,
        learningPaused: state.learningPaused,
        roleBias: state.roleBias,
        outcomeEvents: state.outcomeEvents,
        draft: state.draft,
      }),
    },
  ),
);

function redactLearningReferences(sittings: Sitting[], removedMemoryIds: Set<string>, clearRecall: boolean): Sitting[] {
  return sittings.map((sitting) => {
    const candidates = sitting.result.memoryCandidates ?? [];
    const retained = candidates.filter((candidate) => !removedMemoryIds.has(candidate.memoryId));
    if (retained.length === candidates.length && !(clearRecall && sitting.result.resembles)) return sitting;
    return { ...sitting, result: { ...sitting.result,
      memoryCandidates: retained,
      resembles: clearRecall ? null : sitting.result.resembles,
      retentionNote: "Some earlier learning references were removed after a deletion. Retained case evidence is unchanged.",
    } };
  });
}

function currentPair(state: LimenStore) {
  const sitting = state.sittings.find((s) => s.id === state.activeSittingId);
  if (!sitting) return null;
  const situation = state.situations.find((s) => s.id === sitting.situationId);
  if (!situation) return null;
  return { sitting, situation: sitting.snapshot ?? situation };
}

function refreshActive(set: (partial: Partial<LimenStore>) => void, get: () => LimenStore) {
  const current = currentPair(get());
  if (!current) return;
  appendRevision(set, get, current.situation, "configuration changed");
}

function appendRevision(
  set: (partial: Partial<LimenStore>) => void,
  get: () => LimenStore,
  situation: Situation,
  reason: string,
  explicitId?: string,
) {
  const id = explicitId ?? uid();
  const result = runFor(situation, get, id);
  const sitting: Sitting = { id, situationId: situation.id, parentRunId: get().activeSittingId ?? undefined, at: Date.now(), revisionReason: reason, snapshot: structuredClone(situation), result };
  set({
    situations: get().situations.map((s) => (s.id === situation.id ? situation : s)),
    sittings: [sitting, ...get().sittings],
    activeSittingId: id,
    ruleStats: bumpFires(get().ruleStats, sitting),
  });
}

export function idleLines(state: Pick<LimenStore, "sittings" | "situations" | "memories" | "blindspots" | "ruleStats" | "engrams" | "feedbackEvents">): string[] {
  const caseIds = new Set(state.situations.filter((s) => s.mode === "case").map((s) => s.id));
  const rows = state.sittings.filter((s) => caseIds.has(s.situationId));
  const marks = effectiveFeedback(state.feedbackEvents).filter((event) => caseIds.has(event.caseId));
  const useful = marks.filter((event) => event.verdict === "useful").length;
  const noise = marks.filter((event) => event.verdict === "noise").length;
  const unfinished = state.memories.filter((m) => m.kind === "unfinished" && m.status !== "retired").length;
  const repairs = state.memories.filter((m) => m.kind === "repair" && m.status !== "retired").length;
  const lines: string[] = [];
  if (!caseIds.size) {
    lines.push("I have not sat with anything of yours yet. I know several shapes of not-knowing, and I do not know which of them I over-apply.");
  } else {
    lines.push(`I have considered ${caseIds.size} case${caseIds.size === 1 ? "" : "s"} across ${rows.length} revision${rows.length === 1 ? "" : "s"}. ${useful} marked useful, ${noise} marked noise.`);
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
