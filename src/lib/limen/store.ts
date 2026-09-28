import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { featurePhrases, RULE_NAMES, runEngine } from "./engine";
import { extractFeatures } from "./fly";
import { checkReportArtifact } from "./check";
import { createReportExpectation, resolveReportReceipt } from "./expectations";
import { activePolicyVersions, replayDevelopment, type DevelopmentEvent, type ExpectationRecord } from "./development";
import { selectNextCheck } from "./selection";
import { DEVELOPMENT_JOB_INPUT_VERSION, enqueueForDevelopmentEvents, createDevelopmentCycleState, mergeDevelopmentJobs, recoverDevelopmentQueue, runDevelopmentCycle, type DevelopmentJobState } from "./development-cycle";
import { prepareDevelopmentJob } from "./development-worker";
import { createLocalRehearsalApplication, createLocalRehearsalEvents } from "./development-rehearsal";
import { prepareRetirement } from "./policy-review";
import { currentOutcome, deriveLearning, dueFollowUps, effectiveFeedback } from "./ledger";
import { migrateLegacy, migrateV2, migrateV3, parseImport, validateData } from "./data";
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

let developmentCycleEpoch = 0;
let developmentCycleRunning = false;
let developmentCycleRerunRequested = false;

function fingerprintText(value: string): string {
  let hash = 0x811c9dc5;
  for (const byte of new TextEncoder().encode(value)) hash = Math.imul(hash ^ byte, 0x01000193);
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function queueEligibleDevelopmentWork(state: LimenStore, sourceEvents = state.developmentEvents): Pick<LimenStore, "developmentEvents" | "developmentJobs" | "developmentDeferredSourceEventIds"> {
  if (!state.developmentEnabled || state.learningPaused) return {
    developmentEvents: state.developmentEvents,
    developmentJobs: state.developmentJobs,
    developmentDeferredSourceEventIds: state.developmentDeferredSourceEventIds,
  };
  const replay = replayDevelopment(state.developmentEvents);
  const cycle = {
    ...createDevelopmentCycleState(),
    jobs: state.developmentJobs,
    deferredSourceEventIds: state.developmentDeferredSourceEventIds,
  };
  const queued = enqueueForDevelopmentEvents(cycle, sourceEvents, Date.now(), replay.lastSequence + 1);
  const developmentEvents = queued.events.length ? replayDevelopment([...state.developmentEvents, ...queued.events]).events : state.developmentEvents;
  return {
    developmentEvents,
    developmentJobs: queued.state.jobs,
    developmentDeferredSourceEventIds: queued.state.deferredSourceEventIds,
  };
}

function applicationForSelection(
  events: DevelopmentEvent[],
  selection: NonNullable<ReturnType<typeof runEngine>["selection"]> | undefined,
  situation: Situation,
  runId: string,
  at: number,
): DevelopmentEvent[] {
  if (!selection?.contributed || !selection.baselineCheckId || !selection.selectedCheckId || selection.policyVersionIds.length !== 1) return events;
  const replay = replayDevelopment(events);
  const policy = replay.policies.find((row) => row.id === selection.policyVersionIds[0]);
  if (!policy || policy.lifecycle !== "active" || policy.track !== "simulated") return events;
  const sourceEventIds = replay.events.filter((event) =>
    (event.kind === "policy.version_recorded" && event.payload.policyVersion.id === policy.id)
    || (event.kind === "expectation.resolved" && selection.supportResolutionIds.includes(event.payload.resolution.id)),
  ).map((event) => event.id);
  if (!sourceEventIds.length) return events;
  const next: DevelopmentEvent = {
    id: `application:${runId}:${policy.id}`,
    sequence: replay.lastSequence + 1,
    at,
    schemaVersion: 1,
    kind: "policy.applied",
    payload: { application: {
      id: `application-record:${runId}:${policy.id}`,
      policyVersionId: policy.id,
      caseId: situation.id,
      runId,
      track: "simulated",
      baselineCheckId: selection.baselineCheckId,
      selectedCheckId: selection.selectedCheckId,
      sourceEventIds,
      contributed: true,
      costUnits: selection.costUnits,
    } },
  };
  return replayDevelopment([...events, next]).events;
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
  developmentEnabled: boolean;
  setDevelopmentEnabled: (enabled: boolean) => void;
  learningPaused: boolean;
  setLearningPaused: (paused: boolean) => void;
  roleBias: Record<string, number>;
  setAdaptiveEnabled: (enabled: boolean) => void;
  outcomeEvents: OutcomeEvent[];
  developmentEvents: DevelopmentEvent[];
  developmentJobs: DevelopmentJobState[];
  developmentDeferredSourceEventIds: string[];
  developmentProcessing: boolean;
  queueDevelopmentWork: () => void;
  runDevelopmentWork: () => Promise<void>;
  runLocalRehearsal: () => Promise<void>;
  retireDevelopmentPolicy: (policyVersionId: string) => void;
  deleteDevelopmentPolicy: (policyVersionId: string) => void;
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
    developmentEnabled: false,
    learningPaused: false,
    roleBias: {} as Record<string, number>,
    outcomeEvents: [] as OutcomeEvent[],
    developmentEvents: [] as DevelopmentEvent[],
    developmentJobs: [] as DevelopmentJobState[],
    developmentDeferredSourceEventIds: [] as string[],
    developmentProcessing: false,
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
  const engineInput = {
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
  };
  const baseline = runEngine(engineInput);
  const rehearsal = situation.mode === "case" && situation.episode === "reviewer" && state.developmentEnabled;
  let result = baseline;
  if (rehearsal) {
    const hasCheckGap = baseline.gaps.some((gap) => gap.kind === "observation" || gap.kind === "evidence");
    const eligibleChecks = hasCheckGap ? ["check-acceptance", "trace-lineage"] as const : [];
    const baselineCheckId = eligibleChecks.length
      ? baseline.router.op === "check_source" ? "check-acceptance" as const : "trace-lineage" as const
      : null;
    const context = {
      objectiveVersionId: fingerprintText(situation.objective.trim() || "objective-missing"),
      contextVersionId: fingerprintText(`${situation.episode}:${situation.stakes}:${situation.reversible}`),
      stakes: situation.stakes,
      methodVersion: "limen-checks-1",
      workflow: "review" as const,
      worldVersion: "luna-world-v1",
    };
    const policies = activePolicyVersions(replayDevelopment(state.developmentEvents));
    const selection = selectNextCheck({
      track: "simulated",
      context,
      eligibleChecks: [...eligibleChecks],
      baselineCheckId,
      baselineOperation: baseline.router.op,
      policies,
      developmentEnabled: state.developmentEnabled,
      learningPaused: state.learningPaused,
    });
    result = runEngine({ ...engineInput, selection });
  }
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
      setDevelopmentEnabled: (enabled) => {
        if (typeof enabled !== "boolean") return;
        if (!enabled) developmentCycleEpoch += 1;
        const next = { ...get(), developmentEnabled: enabled };
        set({ developmentEnabled: enabled, ...queueEligibleDevelopmentWork(next) });
        if (enabled) void get().runDevelopmentWork();
      },
      setLearningPaused: (paused) => {
        if (typeof paused !== "boolean" || get().learningPaused === paused) return;
        if (paused) developmentCycleEpoch += 1;
        set({ learningPaused: paused });
        if (!paused) {
          set(queueEligibleDevelopmentWork(get()));
          void get().runDevelopmentWork();
        }
        refreshActive(set, get);
      },
      queueDevelopmentWork: () => set(queueEligibleDevelopmentWork(get())),
      runDevelopmentWork: async () => {
        if (developmentCycleRunning) { developmentCycleRerunRequested = true; return; }
        if (!get().developmentEnabled || get().learningPaused) return;
        developmentCycleRunning = true;
        set({ developmentProcessing: true });
        try {
          for (let pass = 0; pass < 16; pass += 1) {
            if (!get().developmentEnabled || get().learningPaused) break;
            developmentCycleRerunRequested = false;
            let madeProgress = false;
            const current = get();
            const cycle = await runDevelopmentCycle<DevelopmentEvent[]>({
              state: { jobs: current.developmentJobs, deferredSourceEventIds: current.developmentDeferredSourceEventIds },
              controls: () => {
                const state = get();
                return {
                  enabled: state.developmentEnabled,
                  paused: state.learningPaused,
                  epoch: developmentCycleEpoch,
                  inputVersion: DEVELOPMENT_JOB_INPUT_VERSION,
                  sourceEventIds: new Set(state.developmentEvents.map((event) => event.id)),
                };
              },
              processJob: async (job, budget) => prepareDevelopmentJob(get().developmentEvents, job, budget.maxSimulatedEpisodes, Date.now()),
              commitPrepared: (job, result, completedState) => {
                const latest = get();
                if (!latest.developmentEnabled || latest.learningPaused
                  || !latest.developmentJobs.some((row) => row.id === job.id && row.status === "queued")
                  || !latest.developmentEvents.some((event) => event.id === job.sourceEventId)) return false;
                const events = result.prepared ?? latest.developmentEvents;
                const mergedJobs = mergeDevelopmentJobs(latest.developmentJobs, completedState.jobs);
                const queued = queueEligibleDevelopmentWork({ ...latest, developmentEvents: events, developmentJobs: mergedJobs, developmentDeferredSourceEventIds: completedState.deferredSourceEventIds });
                set(queued);
                madeProgress = true;
                return true;
              },
            });
            const latest = get();
            const recoveredById = new Map(cycle.state.jobs.map((job) => [job.id, job]));
            const reconciled = latest.developmentJobs.map((job) => recoveredById.get(job.id) ?? job);
            if (reconciled.some((job, index) => job.status !== latest.developmentJobs[index]?.status)) set({ developmentJobs: reconciled });
            const hasPending = get().developmentJobs.some((job) => job.status === "queued");
            if (!madeProgress || !hasPending) break;
          }
        } finally {
          developmentCycleRunning = false;
          set({ developmentProcessing: false });
          const state = get();
          if (developmentCycleRerunRequested && state.developmentEnabled && !state.learningPaused && state.developmentJobs.some((job) => job.status === "queued")) {
            queueMicrotask(() => { void get().runDevelopmentWork(); });
          }
        }
      },
      runLocalRehearsal: async () => {
        const initial = get();
        if (!initial.developmentEnabled || initial.learningPaused || initial.developmentJobs.some((job) => job.status === "queued")) return;
        // The first local rehearsal is reproducible for an inspectable product journey.
        // Later rehearsals use fresh seeds so each contributes distinct simulated cases.
        const hasPriorRehearsal = initial.developmentEvents.some((event) => event.kind === "expectation.recorded" && event.payload.expectation.track === "simulated");
        const seed = hasPriorRehearsal ? `local-rehearsal:${uid()}` : "product-flow";
        const at = Date.now();
        const beforeIds = new Set(initial.developmentEvents.map((event) => event.id));
        const events = createLocalRehearsalEvents(initial.developmentEvents, seed, at);
        const added = events.filter((event) => !beforeIds.has(event.id));
        const sources = added.filter((event) => event.kind === "expectation.resolved");
        const queued = queueEligibleDevelopmentWork({ ...initial, developmentEvents: events }, sources);
        set(queued);
        await get().runDevelopmentWork();

        const current = get();
        if (!current.developmentEnabled || current.learningPaused) return;
        const applicationEvents = createLocalRehearsalApplication(current.developmentEvents, seed, Date.now());
        if (applicationEvents.length > current.developmentEvents.length) {
          const newResolutions = applicationEvents.filter((event) => !current.developmentEvents.some((prior) => prior.id === event.id) && event.kind === "expectation.resolved");
          set(queueEligibleDevelopmentWork({ ...current, developmentEvents: applicationEvents }, newResolutions));
          await get().runDevelopmentWork();
        }
      },
      retireDevelopmentPolicy: (policyVersionId) => {
        const transition = prepareRetirement(get().developmentEvents, policyVersionId);
        set({ developmentEvents: replayDevelopment([...get().developmentEvents, transition]).events });
      },
      deleteDevelopmentPolicy: (policyVersionId) => {
        developmentCycleEpoch += 1;
        const replay = replayDevelopment(get().developmentEvents);
        const policy = replay.policies.find((row) => row.id === policyVersionId);
        if (!policy) return;
        const deletion: DevelopmentEvent = {
          id: `delete-policy:${policy.id}:${replay.lastSequence + 1}`,
          sequence: replay.lastSequence + 1,
          at: Date.now(),
          schemaVersion: 1,
          kind: "dependency.deleted",
          payload: { dependency: { kind: "policy", id: policy.id } },
        };
        const developmentEvents = replayDevelopment([...get().developmentEvents, deletion]).events;
        const queue = recoverDevelopmentQueue(
          { jobs: get().developmentJobs, deferredSourceEventIds: get().developmentDeferredSourceEventIds },
          new Set(developmentEvents.map((event) => event.id)),
          DEVELOPMENT_JOB_INPUT_VERSION,
        );
        set({ developmentEvents, developmentJobs: queue.jobs, developmentDeferredSourceEventIds: queue.deferredSourceEventIds });
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
        const developmentEvents = applicationForSelection(get().developmentEvents, result.selection, situation, sittingId, sitting.at);
        set({
          situations: [situation, ...get().situations],
          sittings: [sitting, ...get().sittings],
          developmentEvents,
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
        const at = Date.now();
        const runId = uid();
        const shouldRecordExpectation = current.situation.mode === "case" && !current.situation.episode;
        let expectationEvents: DevelopmentEvent[] = [];
        let expectation: ExpectationRecord | undefined;
        if (shouldRecordExpectation) {
          const objectiveHash = fingerprintText(current.situation.objective);
          const sequence = replayDevelopment(get().developmentEvents).lastSequence + 1;
          const made = createReportExpectation({
            id: `expectation:${runId}`,
            caseId: current.situation.id,
            runId,
            familyId: current.situation.familyId?.trim() || current.situation.id,
            objectiveVersionId: `objective:${objectiveHash}`,
            stakes: current.situation.stakes,
            sequence,
            at,
          });
          expectation = made.expectation;
          expectationEvents = [made.event];
        }
        const receipt = checkReportArtifact(artifact, current.situation.id, runId, at);
          if (expectation) {
          const resolvedEvents = resolveReportReceipt(expectation, receipt, replayDevelopment(get().developmentEvents).lastSequence + 2);
          const nextEvents = [...get().developmentEvents, ...expectationEvents, ...resolvedEvents];
          replayDevelopment(nextEvents);
          const sourceEvents = resolvedEvents.filter((event) => event.kind === "expectation.resolved");
          set(queueEligibleDevelopmentWork({ ...get(), developmentEvents: nextEvents }, sourceEvents));
          }
        const situation = {
          ...current.situation,
          receipts: [...(current.situation.receipts ?? []), receipt],
        };
        appendRevision(set, get, situation, "document checked", receipt.runId);
        void get().runDevelopmentWork();
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
        developmentCycleEpoch += 1;
        const lastSequence = replayDevelopment(get().developmentEvents).lastSequence;
        const deletionEvent: DevelopmentEvent = {
          id: `delete-case:${caseId}:${lastSequence + 1}`,
          sequence: lastSequence + 1,
          at: Date.now(),
          schemaVersion: 1,
          kind: "dependency.deleted",
          payload: { dependency: { kind: "case", id: caseId } },
        };
        const developmentEvents = replayDevelopment([...get().developmentEvents, deletionEvent]).events;
        const recoveredQueue = recoverDevelopmentQueue(
          { jobs: get().developmentJobs, deferredSourceEventIds: get().developmentDeferredSourceEventIds },
          new Set(developmentEvents.map((event) => event.id)),
          DEVELOPMENT_JOB_INPUT_VERSION,
        );
        const retained = get().sittings.filter((s) => s.situationId !== caseId);
        const situations = get().situations.filter((s) => s.id !== caseId);
        const feedbackEvents = get().feedbackEvents.filter((e) => e.caseId !== caseId);
        const removedRuns = new Set(get().sittings.filter((s) => s.situationId === caseId).map((s) => s.id));
        const memories = get().memories.filter((m) => !removedRuns.has(m.sittingId)).map((m) => m.validationCaseIds?.includes(caseId) ? { ...m, status: "candidate" as const, validationStatus: "unvalidated" as const, validationCaseIds: m.validationCaseIds.filter((id) => id !== caseId) } : m);
        const affectedMemoryIds = new Set(get().memories.filter((m) => removedRuns.has(m.sittingId) || m.validationCaseIds?.includes(caseId)).map((m) => m.id));
        const sittings = redactLearningReferences(retained, affectedMemoryIds, true);
        const roleEvents = get().roleEvents.filter((e) => e.caseId !== caseId);
        set({ situations, sittings, memories, feedbackEvents, roleEvents, outcomeEvents: get().outcomeEvents.filter((e) => e.caseId !== caseId), developmentEvents, developmentJobs: recoveredQueue.jobs, developmentDeferredSourceEventIds: recoveredQueue.deferredSourceEventIds, activeSittingId: removedRuns.has(get().activeSittingId ?? "") ? null : get().activeSittingId, ...deriveLearning(feedbackEvents, sittings, situations, roleEvents) });
      },
      deleteMemory: (id) => set({ memories: get().memories.filter((m) => m.id !== id), sittings: redactLearningReferences(get().sittings, new Set([id]), false) }),
      importData: (json) => {
        const result = parseImport(json, get());
        developmentCycleEpoch += 1;
        set(result.merged);
        return result.preview;
      },
      release: () => {
        developmentCycleEpoch += 1;
        void useLimen.persist.clearStorage();
        set({ ...blankData() });
      },
    }),
    {
      name: "limen-v1",
      version: 4,
      storage: createJSONStorage(() => guardedStorage),
      skipHydration: true,
      migrate: (state, version) => {
        const data = version === 3 ? migrateV3(state) : version === 2 ? migrateV2(state) : migrateLegacy(state);
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
        developmentEnabled: state.developmentEnabled,
        learningPaused: state.learningPaused,
        roleBias: state.roleBias,
        outcomeEvents: state.outcomeEvents,
        developmentEvents: state.developmentEvents,
        developmentJobs: state.developmentJobs,
        developmentDeferredSourceEventIds: state.developmentDeferredSourceEventIds,
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
