import type { DevelopmentEvent, QueuedDevelopmentJob } from "./development";

export type DevelopmentJobStatus = "queued" | "completed" | "cancelled";
export interface DevelopmentJobState extends QueuedDevelopmentJob {
  status: DevelopmentJobStatus;
  createdAt: number;
  completedAt?: number;
}
export interface DevelopmentCycleState {
  jobs: DevelopmentJobState[];
  deferredSourceEventIds: string[];
}

export const DEVELOPMENT_CYCLE_LIMITS = Object.freeze({ transitionsPerSlice: 16, episodesPerSlice: 2, pendingJobs: 100 });
export const DEVELOPMENT_JOB_INPUT_VERSION = "luna-cycle-v1";

export function createDevelopmentCycleState(): DevelopmentCycleState {
  return { jobs: [], deferredSourceEventIds: [] };
}

function key(sourceEventId: string, jobKind: QueuedDevelopmentJob["jobKind"], inputVersion: string): string {
  return `${sourceEventId}\u0000${jobKind}\u0000${inputVersion}`;
}

function digest(value: string): string {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) result = Math.imul(result ^ value.charCodeAt(index), 16777619);
  return (result >>> 0).toString(16).padStart(8, "0");
}

export function enqueueDevelopmentJob(
  state: DevelopmentCycleState,
  sourceEventId: string,
  jobKind: QueuedDevelopmentJob["jobKind"],
  inputVersion: string,
  at: number,
): { state: DevelopmentCycleState; job?: DevelopmentJobState; accepted: boolean; duplicate: boolean; backpressured: boolean } {
  if (!sourceEventId.trim() || !inputVersion.trim() || !Number.isFinite(at) || at < 0) throw new Error("A source, version and finite timestamp are required for queued work.");
  const identity = key(sourceEventId, jobKind, inputVersion);
  const existing = state.jobs.find((job) => key(job.sourceEventId, job.jobKind, job.inputVersion) === identity);
  if (existing) return { state, job: existing, accepted: true, duplicate: true, backpressured: false };
  const pending = state.jobs.filter((job) => job.status === "queued").length;
  if (pending >= DEVELOPMENT_CYCLE_LIMITS.pendingJobs) {
    const deferredSourceEventIds = state.deferredSourceEventIds.includes(sourceEventId)
      ? state.deferredSourceEventIds : [...state.deferredSourceEventIds, sourceEventId];
    return { state: { ...state, deferredSourceEventIds }, accepted: false, duplicate: false, backpressured: true };
  }
  const job: DevelopmentJobState = {
    id: `job:${digest(identity)}`,
    sourceEventId,
    jobKind,
    inputVersion,
    status: "queued",
    createdAt: at,
  };
  return {
    state: { jobs: [...state.jobs, job], deferredSourceEventIds: state.deferredSourceEventIds.filter((id) => id !== sourceEventId) },
    job,
    accepted: true,
    duplicate: false,
    backpressured: false,
  };
}

export function completeDevelopmentJob(state: DevelopmentCycleState, jobId: string, at = 0): DevelopmentCycleState {
  const job = state.jobs.find((row) => row.id === jobId);
  if (!job || job.status !== "queued") return state;
  return { ...state, jobs: state.jobs.map((row) => row.id === jobId ? { ...row, status: "completed", completedAt: at } : row) };
}

/** Merges an in-flight slice without dropping jobs admitted by a concurrent commit. */
export function mergeDevelopmentJobs(current: readonly DevelopmentJobState[], completed: readonly DevelopmentJobState[]): DevelopmentJobState[] {
  const completedById = new Map(completed.map((job) => [job.id, job]));
  const merged = current.map((job) => completedById.get(job.id) ?? job);
  for (const job of completed) if (!merged.some((row) => row.id === job.id)) merged.push(job);
  return merged;
}

export function recoverDevelopmentQueue(
  state: DevelopmentCycleState,
  sourceEventIds: ReadonlySet<string>,
  inputVersion: string,
): DevelopmentCycleState {
  return {
    ...state,
    jobs: state.jobs.map((job) => job.status !== "queued" ? job
      : !sourceEventIds.has(job.sourceEventId) || job.inputVersion !== inputVersion
        ? { ...job, status: "cancelled" }
        : job),
    deferredSourceEventIds: state.deferredSourceEventIds.filter((id) => sourceEventIds.has(id)),
  };
}

/** Materializes only source work; derived events never recursively enqueue themselves. */
export function enqueueForDevelopmentEvents(
  state: DevelopmentCycleState,
  events: readonly DevelopmentEvent[],
  at: number,
  firstSequence: number,
  inputVersion = DEVELOPMENT_JOB_INPUT_VERSION,
): { state: DevelopmentCycleState; events: Extract<DevelopmentEvent, { kind: "job.queued" }>[]; backpressuredSourceIds: string[] } {
  let nextState = state;
  let sequence = firstSequence;
  const jobs: Extract<DevelopmentEvent, { kind: "job.queued" }>[] = [];
  const backpressuredSourceIds: string[] = [];
  for (const source of events) {
    const kinds: QueuedDevelopmentJob["jobKind"][] = source.kind === "expectation.resolved"
      ? ["derive_competence", "consider_policy"]
      : source.kind === "policy.version_recorded" && source.payload.policyVersion.track === "simulated" ? ["trial_policy"] : [];
    for (const jobKind of kinds) {
      const queued = enqueueDevelopmentJob(nextState, source.id, jobKind, inputVersion, at);
      nextState = queued.state;
      if (queued.backpressured) { backpressuredSourceIds.push(source.id); continue; }
      if (queued.duplicate || !queued.job) continue;
      jobs.push({
        id: `job-queued-event:${queued.job.id}`,
        sequence: sequence++,
        at,
        schemaVersion: 1,
        kind: "job.queued",
        payload: { job: { id: queued.job.id, sourceEventId: queued.job.sourceEventId, jobKind: queued.job.jobKind, inputVersion: queued.job.inputVersion } },
      });
    }
  }
  return { state: nextState, events: jobs, backpressuredSourceIds: [...new Set(backpressuredSourceIds)] };
}

export interface CycleControls {
  enabled: boolean;
  paused: boolean;
  epoch: number;
  inputVersion: string;
  sourceEventIds: ReadonlySet<string>;
}

export interface PreparedJobResult<T> {
  progressed: boolean;
  simulatedEpisodes: number;
  prepared?: T;
}

export interface CycleSliceStats {
  transitions: number;
  simulatedEpisodes: number;
  blocked: boolean;
}

export async function runDevelopmentCycle<T>(input: {
  state: DevelopmentCycleState;
  controls: () => CycleControls;
  processJob: (job: DevelopmentJobState, budget: { maxSimulatedEpisodes: number }) => Promise<PreparedJobResult<T>>;
  /** Must recheck controls/dependencies and persist source events plus this completion atomically. */
  commitPrepared: (job: DevelopmentJobState, result: PreparedJobResult<T>, completedState: DevelopmentCycleState) => boolean | Promise<boolean>;
  yieldBetweenSlices?: () => Promise<void>;
  now?: () => number;
}): Promise<{ state: DevelopmentCycleState; stats: CycleSliceStats[] }> {
  let state = input.state;
  const stats: CycleSliceStats[] = [];
  const yieldBetweenSlices = input.yieldBetweenSlices ?? (() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
  const now = input.now ?? (() => Date.now());

  while (true) {
    const startControls = input.controls();
    if (!startControls.enabled || startControls.paused) break;
    state = recoverDevelopmentQueue(state, startControls.sourceEventIds, startControls.inputVersion);
    const slice: CycleSliceStats = { transitions: 0, simulatedEpisodes: 0, blocked: false };
    for (const queued of state.jobs.filter((job) => job.status === "queued")) {
      if (slice.transitions >= DEVELOPMENT_CYCLE_LIMITS.transitionsPerSlice || slice.simulatedEpisodes >= DEVELOPMENT_CYCLE_LIMITS.episodesPerSlice) break;
      const before = input.controls();
      if (!before.enabled || before.paused || before.epoch !== startControls.epoch) { slice.blocked = true; break; }
      if (!before.sourceEventIds.has(queued.sourceEventId) || before.inputVersion !== queued.inputVersion) {
        state = { ...state, jobs: state.jobs.map((job) => job.id === queued.id ? { ...job, status: "cancelled" } : job) };
        slice.transitions += 1;
        continue;
      }
      let result: PreparedJobResult<T>;
      try {
        result = await input.processJob(queued, { maxSimulatedEpisodes: DEVELOPMENT_CYCLE_LIMITS.episodesPerSlice - slice.simulatedEpisodes });
      } catch {
        // Keep failed work pending for a later explicit/app-open retry; preparation must never leak into admission.
        slice.blocked = true;
        continue;
      }
      if (!Number.isInteger(result.simulatedEpisodes) || result.simulatedEpisodes < 0 || result.simulatedEpisodes > DEVELOPMENT_CYCLE_LIMITS.episodesPerSlice - slice.simulatedEpisodes) {
        throw new Error("A job exceeded its per-slice simulated episode budget.");
      }
      if (!result.progressed) { slice.blocked = true; continue; }
      const beforeCommit = input.controls();
      if (!beforeCommit.enabled || beforeCommit.paused || beforeCommit.epoch !== startControls.epoch
        || beforeCommit.inputVersion !== queued.inputVersion || !beforeCommit.sourceEventIds.has(queued.sourceEventId)) {
        slice.blocked = true;
        break;
      }
      const completedState = completeDevelopmentJob(state, queued.id, now());
      if (!await input.commitPrepared(queued, result, completedState)) { slice.blocked = true; break; }
      state = completedState;
      slice.transitions += 1;
      slice.simulatedEpisodes += result.simulatedEpisodes;
      if (slice.transitions >= DEVELOPMENT_CYCLE_LIMITS.transitionsPerSlice || slice.simulatedEpisodes >= DEVELOPMENT_CYCLE_LIMITS.episodesPerSlice) break;
    }
    if (!slice.transitions && !slice.blocked) break;
    stats.push(slice);
    if (slice.blocked || !state.jobs.some((job) => job.status === "queued")) break;
    await yieldBetweenSlices();
  }
  return { state, stats };
}
