import type { EvidenceStatus, Stakes } from "./types";

export const DEVELOPMENT_SCHEMA_VERSION = 1 as const;

export type ExperienceTrack = "real" | "simulated";
export type CheckActionId = "check-acceptance" | "trace-lineage";
export type ResolutionStatus = "pending" | "supported" | "contradicted" | "inconclusive" | "not_tested";
export type ResolvedStatus = Exclude<ResolutionStatus, "pending">;
export type PolicyLifecycle = "candidate" | "testing" | "active" | "suspended" | "retired";
export type PolicyReviewKind = "contract" | "evidence" | "continuity";

export interface DecisionContext {
  objectiveVersionId: string;
  contextVersionId: string;
  stakes: Stakes;
  methodVersion: string;
  workflow: "intake" | "review" | "follow_up";
  worldVersion?: string;
}

export interface ExpectationRecord {
  id: string;
  caseId: string;
  runId: string;
  track: ExperienceTrack;
  familyId: string;
  parentExperienceId?: string;
  context: DecisionContext;
  actionId: CheckActionId;
  criterionId: "limen-report-v1";
  predictedOutcome: string;
}

export type ObservationSource =
  | { kind: "user_report"; sourceId: string }
  | { kind: "check_receipt"; sourceId: string; criterionId: "limen-report-v1"; checkerVersion: "1" }
  | { kind: "simulation_release"; sourceId: string; worldVersion: string };

export interface ReleasedObservation {
  id: string;
  caseId: string;
  runId: string;
  track: ExperienceTrack;
  expectationId: string;
  source: ObservationSource;
  status: EvidenceStatus;
  result: "supports" | "contradicts" | "inconclusive";
}

export interface ExpectationResolution {
  id: string;
  caseId: string;
  runId: string;
  track: ExperienceTrack;
  expectationId: string;
  observationIds: string[];
  status: ResolvedStatus;
  methodVersion: string;
}

export interface CompetenceSummary {
  id: string;
  track: ExperienceTrack;
  context: DecisionContext;
  actionId: CheckActionId;
  supportedResolutionIds: string[];
  contradictedResolutionIds: string[];
  unknownResolutionIds: string[];
  counts: { supported: number; contradicted: number; unknown: number };
}

export type PolicyScope = { kind: "real_advisory" } | { kind: "simulation"; worldVersion: string };
export type PolicyAction =
  | { kind: "prefer_check"; actionId: CheckActionId }
  | { kind: "require_receipt"; criterionId: "limen-report-v1" };

export type ReconsiderationCondition =
  | { kind: "context_changed" }
  | { kind: "objective_changed" }
  | { kind: "method_changed" }
  | { kind: "support_revoked"; resolutionId: string }
  | { kind: "contradiction"; expectationId: string }
  | { kind: "receipt_outcome"; criterionId: "limen-report-v1"; outcome: "pass" | "fail" }
  | { kind: "expires_at"; at: number }
  | { kind: "explicit_override" };

export interface PolicyVersionRecord {
  id: string;
  policyId: string;
  version: number;
  track: ExperienceTrack;
  scope: PolicyScope;
  action: PolicyAction;
  context: DecisionContext;
  supportResolutionIds: string[];
  reconsideration: ReconsiderationCondition[];
  supersedesVersionId?: string;
}

export interface PolicyVersionView extends PolicyVersionRecord {
  lifecycle: PolicyLifecycle;
  supersededByVersionId?: string;
}

export interface PolicyReviewRecord {
  id: string;
  policyVersionId: string;
  track: ExperienceTrack;
  reviewKind: PolicyReviewKind;
  verdict: "accepted" | "rejected";
  sourceEventIds: string[];
  reviewedAtSequence: number;
}

export interface ProspectiveTrialRecord {
  id: string;
  policyVersionId: string;
  caseId: string;
  runId: string;
  track: "simulated";
  familyId: string;
  worldVersion: string;
  resolutionId: string;
  outcome: "supports" | "contradicts" | "quiet_control";
  baselineCheckId: CheckActionId;
  selectedCheckId: CheckActionId;
}

export interface PolicyTransitionRecord {
  policyVersionId: string;
  toState: Exclude<PolicyLifecycle, "candidate">;
  reasonCode:
    | "candidate_trial"
    | "prospective_trials_passed"
    | "contradiction"
    | "context_changed"
    | "objective_changed"
    | "method_changed"
    | "support_revoked"
    | "explicit_retirement";
}

export interface PolicyApplicationRecord {
  id: string;
  policyVersionId: string;
  caseId: string;
  runId: string;
  track: "simulated";
  baselineCheckId: CheckActionId;
  selectedCheckId: CheckActionId;
  sourceEventIds: string[];
  contributed: boolean;
  costUnits: number;
}

export interface QueuedDevelopmentJob {
  id: string;
  sourceEventId: string;
  jobKind: "derive_competence" | "consider_policy" | "trial_policy";
  inputVersion: string;
}

export interface DeletedDependency {
  kind: "case" | "run" | "evidence" | "receipt" | "expectation" | "observation" | "resolution" | "policy";
  id: string;
}

interface EventBase<K extends string, P> {
  id: string;
  sequence: number;
  at: number;
  schemaVersion: typeof DEVELOPMENT_SCHEMA_VERSION;
  kind: K;
  payload: P;
}

export type DevelopmentEvent =
  | EventBase<"expectation.recorded", { expectation: ExpectationRecord }>
  | EventBase<"observation.released", { observation: ReleasedObservation }>
  | EventBase<"expectation.resolved", { resolution: ExpectationResolution }>
  | EventBase<"competence.derived", { summary: CompetenceSummary }>
  | EventBase<"policy.version_recorded", { policyVersion: PolicyVersionRecord }>
  | EventBase<"policy.reviewed", { review: PolicyReviewRecord }>
  | EventBase<"policy.trial_recorded", { trial: ProspectiveTrialRecord }>
  | EventBase<"policy.transitioned", { transition: PolicyTransitionRecord }>
  | EventBase<"policy.applied", { application: PolicyApplicationRecord }>
  | EventBase<"job.queued", { job: QueuedDevelopmentJob }>
  | EventBase<"dependency.deleted", { dependency: DeletedDependency }>;

export interface DevelopmentReplay {
  events: DevelopmentEvent[];
  lastSequence: number;
  expectations: ExpectationRecord[];
  observations: ReleasedObservation[];
  resolutions: ExpectationResolution[];
  competence: CompetenceSummary[];
  policies: PolicyVersionView[];
  reviews: PolicyReviewRecord[];
  trials: ProspectiveTrialRecord[];
  applications: PolicyApplicationRecord[];
  jobs: QueuedDevelopmentJob[];
  deletedDependencies: DeletedDependency[];
}

export class DevelopmentReplayError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "DevelopmentReplayError";
    this.code = code;
  }
}

const EVENT_KINDS = new Set([
  "expectation.recorded", "observation.released", "expectation.resolved", "competence.derived",
  "policy.version_recorded", "policy.reviewed", "policy.trial_recorded", "policy.transitioned",
  "policy.applied", "job.queued", "dependency.deleted",
]);
const CHECK_IDS = new Set<CheckActionId>(["check-acceptance", "trace-lineage"]);
const RESOLUTIONS = new Set<ResolvedStatus>(["supported", "contradicted", "inconclusive", "not_tested"]);
const REVIEW_KINDS = new Set<PolicyReviewKind>(["contract", "evidence", "continuity"]);
const DELETED_KINDS = new Set<DeletedDependency["kind"]>(["case", "run", "evidence", "receipt", "expectation", "observation", "resolution", "policy"]);

type Dict = Record<string, unknown>;
type EventKind = DevelopmentEvent["kind"];
type EventPayload<K extends EventKind> = Extract<DevelopmentEvent, { kind: K }>["payload"];

function reject(code: string, message: string): never {
  throw new DevelopmentReplayError(code, message);
}

function object(value: unknown, label: string): Dict {
  if (!value || typeof value !== "object" || Array.isArray(value)) reject("invalid_record", `${label} must be an object.`);
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) reject("invalid_record", `${label} must be a plain object.`);
  return value as Dict;
}

function exact(value: unknown, required: string[], optional: string[] = [], label = "record"): Dict {
  const row = object(value, label);
  const allowed = new Set([...required, ...optional]);
  for (const key of Object.keys(row)) if (!allowed.has(key)) reject("unknown_field", `${label} contains unknown field: ${key}.`);
  for (const key of required) if (!Object.hasOwn(row, key)) reject("missing_field", `${label} is missing ${key}.`);
  return row;
}

function id(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length > 200 || !value.trim() || value.trim() !== value || /\p{Cc}/u.test(value)) {
    reject("invalid_id", `${label} must be a nonempty stable identifier.`);
  }
  return value;
}

function text(value: unknown, label: string, max = 2_000): string {
  if (typeof value !== "string" || value.length > max || !value.trim()) reject("invalid_text", `${label} must be nonempty text of at most ${max} characters.`);
  return value;
}

function finite(value: unknown, label: string, min = 0): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min) reject("invalid_number", `${label} must be a finite number at least ${min}.`);
  return value;
}

function integer(value: unknown, label: string, min = 0): number {
  const number = finite(value, label, min);
  if (!Number.isSafeInteger(number)) reject("invalid_integer", `${label} must be a safe integer.`);
  return number;
}

function strings(value: unknown, label: string, allowEmpty = false): string[] {
  if (!Array.isArray(value) || value.length > 5_000) reject("invalid_array", `${label} must be a bounded array.`);
  const result = value.map((item, index) => id(item, `${label}[${index}]`));
  if (new Set(result).size !== result.length) reject("duplicate_reference", `${label} contains duplicate identifiers.`);
  if (!allowEmpty && result.length === 0) reject("missing_reference", `${label} must contain at least one identifier.`);
  return result;
}

function track(value: unknown, label = "track"): ExperienceTrack {
  if (value !== "real" && value !== "simulated") reject("invalid_track", `${label} must be real or simulated.`);
  return value;
}

function checkId(value: unknown, label = "check ID"): CheckActionId {
  if (typeof value !== "string" || !CHECK_IDS.has(value as CheckActionId)) reject("invalid_check", `${label} is not an existing Limen action ID.`);
  return value as CheckActionId;
}

function decisionContext(value: unknown, recordTrack: ExperienceTrack): DecisionContext {
  const row = exact(value, ["objectiveVersionId", "contextVersionId", "stakes", "methodVersion", "workflow"], ["worldVersion"], "decision context");
  const stakes = row.stakes;
  if (stakes !== "low" && stakes !== "consequential" && stakes !== "irreversible") reject("invalid_context", "Decision context has an unknown stakes value.");
  if (row.workflow !== "intake" && row.workflow !== "review" && row.workflow !== "follow_up") reject("invalid_context", "Decision context has an unknown workflow.");
  if (recordTrack === "simulated") id(row.worldVersion, "context worldVersion");
  else if (row.worldVersion !== undefined) reject("track_mismatch", "Real context cannot carry a simulation world version.");
  return {
    objectiveVersionId: id(row.objectiveVersionId, "objectiveVersionId"),
    contextVersionId: id(row.contextVersionId, "contextVersionId"),
    stakes,
    methodVersion: id(row.methodVersion, "methodVersion"),
    workflow: row.workflow,
    ...(row.worldVersion === undefined ? {} : { worldVersion: id(row.worldVersion, "worldVersion") }),
  };
}

function sameContext(a: DecisionContext, b: DecisionContext): boolean {
  return canonical(a) === canonical(b);
}

function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const row = value as Dict;
  return `{${Object.keys(row).sort().map((key) => `${JSON.stringify(key)}:${canonical(row[key])}`).join(",")}}`;
}

function uniqueRecordId<T extends { id: string }>(rows: T[], row: T, label: string): void {
  if (rows.some((prior) => prior.id === row.id)) reject("duplicate_record", `${label} ID already exists: ${row.id}.`);
}

function validateCondition(value: unknown): ReconsiderationCondition {
  const row = object(value, "reconsideration condition");
  switch (row.kind) {
    case "context_changed":
    case "objective_changed":
    case "method_changed":
    case "explicit_override":
      exact(row, ["kind"], [], "reconsideration condition");
      return { kind: row.kind };
    case "support_revoked":
      exact(row, ["kind", "resolutionId"], [], "reconsideration condition");
      return { kind: row.kind, resolutionId: id(row.resolutionId, "resolutionId") };
    case "contradiction":
      exact(row, ["kind", "expectationId"], [], "reconsideration condition");
      return { kind: row.kind, expectationId: id(row.expectationId, "expectationId") };
    case "receipt_outcome":
      exact(row, ["kind", "criterionId", "outcome"], [], "reconsideration condition");
      if (row.criterionId !== "limen-report-v1" || (row.outcome !== "pass" && row.outcome !== "fail")) reject("invalid_condition", "Receipt condition is outside the supported vocabulary.");
      return { kind: row.kind, criterionId: row.criterionId, outcome: row.outcome };
    case "expires_at":
      exact(row, ["kind", "at"], [], "reconsideration condition");
      return { kind: row.kind, at: finite(row.at, "condition expiry") };
    default:
      reject("unknown_condition", `Unknown condition kind: ${String(row.kind)}.`);
  }
}

function validateExpectation(value: unknown): ExpectationRecord {
  const row = exact(value, ["id", "caseId", "runId", "track", "familyId", "context", "actionId", "criterionId", "predictedOutcome"], ["parentExperienceId"], "expectation");
  const recordTrack = track(row.track);
  if (row.criterionId !== "limen-report-v1") reject("invalid_criterion", "Expectation criterion is outside the supported vocabulary.");
  return {
    id: id(row.id, "expectation ID"), caseId: id(row.caseId, "caseId"), runId: id(row.runId, "runId"), track: recordTrack,
    familyId: id(row.familyId, "familyId"), ...(row.parentExperienceId === undefined ? {} : { parentExperienceId: id(row.parentExperienceId, "parentExperienceId") }),
    context: decisionContext(row.context, recordTrack), actionId: checkId(row.actionId), criterionId: row.criterionId,
    predictedOutcome: text(row.predictedOutcome, "predictedOutcome"),
  };
}

function validateObservation(value: unknown): ReleasedObservation {
  const row = exact(value, ["id", "caseId", "runId", "track", "expectationId", "source", "status", "result"], [], "released observation");
  const recordTrack = track(row.track);
  const source = object(row.source, "observation source");
  let normalizedSource: ObservationSource;
  if (source.kind === "user_report") {
    exact(source, ["kind", "sourceId"], [], "user report source");
    normalizedSource = { kind: "user_report", sourceId: id(source.sourceId, "sourceId") };
    if (recordTrack !== "real" || row.status !== "reported") reject("track_mismatch", "A user report is real reported evidence.");
  } else if (source.kind === "check_receipt") {
    exact(source, ["kind", "sourceId", "criterionId", "checkerVersion"], [], "check receipt source");
    if (recordTrack !== "real" || !["verified_check", "unresolved"].includes(String(row.status)) || source.criterionId !== "limen-report-v1" || source.checkerVersion !== "1") reject("track_mismatch", "A check receipt must use its named real criterion and checker version.");
    if (row.status === "unresolved" && row.result !== "inconclusive") reject("invalid_observation", "An unresolved checker outcome cannot support or contradict an expectation.");
    normalizedSource = { kind: "check_receipt", sourceId: id(source.sourceId, "receiptId"), criterionId: source.criterionId, checkerVersion: source.checkerVersion };
  } else if (source.kind === "simulation_release") {
    exact(source, ["kind", "sourceId", "worldVersion"], [], "simulation release source");
    if (recordTrack !== "simulated" || (row.status !== "simulated" && row.status !== "unresolved")) reject("track_mismatch", "A simulation release cannot become real evidence.");
    if (row.status === "unresolved" && row.result !== "inconclusive") reject("invalid_observation", "An unresolved simulation outcome cannot support or contradict an expectation.");
    normalizedSource = { kind: "simulation_release", sourceId: id(source.sourceId, "sourceId"), worldVersion: id(source.worldVersion, "worldVersion") };
  } else reject("invalid_observation_source", "Observation source is outside the supported vocabulary.");
  if (row.result !== "supports" && row.result !== "contradicts" && row.result !== "inconclusive") reject("invalid_observation", "Observation result is invalid.");
  return {
    id: id(row.id, "observation ID"), caseId: id(row.caseId, "caseId"), runId: id(row.runId, "runId"), track: recordTrack,
    expectationId: id(row.expectationId, "expectationId"), source: normalizedSource,
    status: row.status as EvidenceStatus, result: row.result,
  };
}

function validateResolution(value: unknown): ExpectationResolution {
  const row = exact(value, ["id", "caseId", "runId", "track", "expectationId", "observationIds", "status", "methodVersion"], [], "expectation resolution");
  const status = row.status;
  if (typeof status !== "string" || !RESOLUTIONS.has(status as ResolvedStatus)) reject("invalid_resolution", "Resolution status is invalid.");
  const observationIds = strings(row.observationIds, "observationIds", true);
  if ((status === "supported" || status === "contradicted") && observationIds.length === 0) reject("missing_observation", "A supported or contradicted resolution requires a released observation.");
  if (status === "not_tested" && observationIds.length > 0) reject("invalid_resolution", "A not-tested resolution cannot cite observations.");
  return {
    id: id(row.id, "resolution ID"), caseId: id(row.caseId, "caseId"), runId: id(row.runId, "runId"), track: track(row.track),
    expectationId: id(row.expectationId, "expectationId"), observationIds, status: status as ResolvedStatus,
    methodVersion: id(row.methodVersion, "methodVersion"),
  };
}

function validateCompetence(value: unknown): CompetenceSummary {
  const row = exact(value, ["id", "track", "context", "actionId", "supportedResolutionIds", "contradictedResolutionIds", "unknownResolutionIds", "counts"], [], "competence summary");
  const recordTrack = track(row.track);
  const supportedResolutionIds = strings(row.supportedResolutionIds, "supportedResolutionIds", true);
  const contradictedResolutionIds = strings(row.contradictedResolutionIds, "contradictedResolutionIds", true);
  const unknownResolutionIds = strings(row.unknownResolutionIds, "unknownResolutionIds", true);
  const counts = exact(row.counts, ["supported", "contradicted", "unknown"], [], "competence counts");
  const allResolutionIds = [...supportedResolutionIds, ...contradictedResolutionIds, ...unknownResolutionIds];
  if (new Set(allResolutionIds).size !== allResolutionIds.length) reject("invalid_competence", "A resolution may appear in only one competence bucket.");
  const supported = integer(counts.supported, "supported competence count");
  const contradicted = integer(counts.contradicted, "contradicted competence count");
  const unknown = integer(counts.unknown, "unknown competence count");
  if (supported !== supportedResolutionIds.length || contradicted !== contradictedResolutionIds.length || unknown !== unknownResolutionIds.length) reject("invalid_competence", "Competence counts must be recomputed from cited resolutions.");
  return { id: id(row.id, "competence ID"), track: recordTrack, context: decisionContext(row.context, recordTrack), actionId: checkId(row.actionId), supportedResolutionIds, contradictedResolutionIds, unknownResolutionIds, counts: { supported, contradicted, unknown } };
}

function validatePolicyVersion(value: unknown): PolicyVersionRecord {
  const row = exact(value, ["id", "policyId", "version", "track", "scope", "action", "context", "supportResolutionIds", "reconsideration"], ["supersedesVersionId"], "policy version");
  const recordTrack = track(row.track);
  const version = integer(row.version, "policy version", 1);
  const scope = object(row.scope, "policy scope");
  let normalizedScope: PolicyScope;
  if (scope.kind === "simulation") {
    exact(scope, ["kind", "worldVersion"], [], "simulation scope");
    normalizedScope = { kind: "simulation", worldVersion: id(scope.worldVersion, "scope worldVersion") };
    if (recordTrack !== "simulated") reject("track_mismatch", "Simulation scope requires simulated experience.");
  } else if (scope.kind === "real_advisory") {
    exact(scope, ["kind"], [], "real advisory scope");
    normalizedScope = { kind: "real_advisory" };
    if (recordTrack !== "real") reject("track_mismatch", "Real advisory scope requires real experience.");
  } else reject("invalid_scope", "Policy scope is outside the supported vocabulary.");
  const action = object(row.action, "policy action");
  let normalizedAction: PolicyAction;
  if (action.kind === "prefer_check") {
    exact(action, ["kind", "actionId"], [], "prefer-check policy action");
    normalizedAction = { kind: "prefer_check", actionId: checkId(action.actionId) };
  } else if (action.kind === "require_receipt") {
    exact(action, ["kind", "criterionId"], [], "require-receipt policy action");
    if (action.criterionId !== "limen-report-v1") reject("invalid_policy_action", "Receipt policy criterion is not supported.");
    normalizedAction = { kind: "require_receipt", criterionId: action.criterionId };
  } else reject("invalid_policy_action", "Policy action is outside the supported vocabulary.");
  const policyContext = decisionContext(row.context, recordTrack);
  if (normalizedScope.kind === "simulation" && (policyContext.worldVersion !== normalizedScope.worldVersion)) reject("track_mismatch", "Policy context and simulation scope versions differ.");
  if (!Array.isArray(row.reconsideration) || row.reconsideration.length === 0 || row.reconsideration.length > 32) reject("invalid_condition", "Policy needs a bounded reconsideration condition.");
  const reconsideration = row.reconsideration.map(validateCondition);
  const supportResolutionIds = strings(row.supportResolutionIds, "supportResolutionIds");
  return {
    id: id(row.id, "policy version ID"), policyId: id(row.policyId, "policyId"), version, track: recordTrack,
    scope: normalizedScope, action: normalizedAction, context: policyContext, supportResolutionIds, reconsideration,
    ...(row.supersedesVersionId === undefined ? {} : { supersedesVersionId: id(row.supersedesVersionId, "supersedesVersionId") }),
  };
}

function validateReview(value: unknown): PolicyReviewRecord {
  const row = exact(value, ["id", "policyVersionId", "track", "reviewKind", "verdict", "sourceEventIds", "reviewedAtSequence"], [], "policy review");
  if (typeof row.reviewKind !== "string" || !REVIEW_KINDS.has(row.reviewKind as PolicyReviewKind)) reject("invalid_review", "Review kind is invalid.");
  if (row.verdict !== "accepted" && row.verdict !== "rejected") reject("invalid_review", "Review verdict is invalid.");
  const sourceEventIds = strings(row.sourceEventIds, "review sourceEventIds");
  if (!sourceEventIds.length) reject("invalid_review", "Policy review must cite at least one source event.");
  return { id: id(row.id, "review ID"), policyVersionId: id(row.policyVersionId, "policyVersionId"), track: track(row.track), reviewKind: row.reviewKind as PolicyReviewKind, verdict: row.verdict, sourceEventIds, reviewedAtSequence: integer(row.reviewedAtSequence, "reviewedAtSequence", 1) };
}

function validateTrial(value: unknown): ProspectiveTrialRecord {
  const row = exact(value, ["id", "policyVersionId", "caseId", "runId", "track", "familyId", "worldVersion", "resolutionId", "outcome", "baselineCheckId", "selectedCheckId"], [], "prospective trial");
  if (row.track !== "simulated") reject("track_mismatch", "Prospective trials must remain simulated.");
  if (row.outcome !== "supports" && row.outcome !== "contradicts" && row.outcome !== "quiet_control") reject("invalid_trial", "Trial outcome is invalid.");
  return { id: id(row.id, "trial ID"), policyVersionId: id(row.policyVersionId, "policyVersionId"), caseId: id(row.caseId, "caseId"), runId: id(row.runId, "runId"), track: "simulated", familyId: id(row.familyId, "familyId"), worldVersion: id(row.worldVersion, "worldVersion"), resolutionId: id(row.resolutionId, "resolutionId"), outcome: row.outcome, baselineCheckId: checkId(row.baselineCheckId), selectedCheckId: checkId(row.selectedCheckId) };
}

function validateTransition(value: unknown): PolicyTransitionRecord {
  const row = exact(value, ["policyVersionId", "toState", "reasonCode"], [], "policy transition");
  if (row.toState !== "testing" && row.toState !== "active" && row.toState !== "suspended" && row.toState !== "retired") reject("invalid_transition", "Target policy state is invalid.");
  const reasons = new Set(["candidate_trial", "prospective_trials_passed", "contradiction", "context_changed", "objective_changed", "method_changed", "support_revoked", "explicit_retirement"]);
  if (typeof row.reasonCode !== "string" || !reasons.has(row.reasonCode)) reject("invalid_transition", "Policy transition reason is invalid.");
  return { policyVersionId: id(row.policyVersionId, "policyVersionId"), toState: row.toState, reasonCode: row.reasonCode as PolicyTransitionRecord["reasonCode"] };
}

function validateApplication(value: unknown): PolicyApplicationRecord {
  const row = exact(value, ["id", "policyVersionId", "caseId", "runId", "track", "baselineCheckId", "selectedCheckId", "sourceEventIds", "contributed", "costUnits"], [], "policy application");
  if (row.track !== "simulated") reject("track_mismatch", "Active learned steering is limited to simulation in this milestone.");
  if (typeof row.contributed !== "boolean") reject("invalid_application", "Application contribution must be explicit.");
  const baselineCheckId = checkId(row.baselineCheckId);
  const selectedCheckId = checkId(row.selectedCheckId);
  if (baselineCheckId === selectedCheckId && row.contributed) reject("invalid_application", "An unchanged baseline choice cannot be credited to learning.");
  return { id: id(row.id, "application ID"), policyVersionId: id(row.policyVersionId, "policyVersionId"), caseId: id(row.caseId, "caseId"), runId: id(row.runId, "runId"), track: "simulated", baselineCheckId, selectedCheckId, sourceEventIds: strings(row.sourceEventIds, "application sourceEventIds"), contributed: row.contributed, costUnits: finite(row.costUnits, "costUnits") };
}

function validateJob(value: unknown): QueuedDevelopmentJob {
  const row = exact(value, ["id", "sourceEventId", "jobKind", "inputVersion"], [], "queued development job");
  if (row.jobKind !== "derive_competence" && row.jobKind !== "consider_policy" && row.jobKind !== "trial_policy") reject("invalid_job", "Job kind is invalid.");
  return { id: id(row.id, "job ID"), sourceEventId: id(row.sourceEventId, "sourceEventId"), jobKind: row.jobKind, inputVersion: id(row.inputVersion, "inputVersion") };
}

function validateDeleted(value: unknown): DeletedDependency {
  const row = exact(value, ["kind", "id"], [], "deleted dependency");
  if (typeof row.kind !== "string" || !DELETED_KINDS.has(row.kind as DeletedDependency["kind"])) reject("invalid_dependency", "Deleted dependency kind is invalid.");
  return { kind: row.kind as DeletedDependency["kind"], id: id(row.id, "dependency ID") };
}

function validateEvent(value: unknown): DevelopmentEvent {
  const row = exact(value, ["id", "sequence", "at", "schemaVersion", "kind", "payload"], [], "development event");
  id(row.id, "event ID");
  integer(row.sequence, "event sequence", 1);
  finite(row.at, "event timestamp");
  if (row.schemaVersion !== DEVELOPMENT_SCHEMA_VERSION) reject("unsupported_version", "Development event schema version is unsupported.");
  if (typeof row.kind !== "string" || !EVENT_KINDS.has(row.kind)) reject("unknown_event_kind", `Unknown event kind: ${String(row.kind)}.`);
  const kind = row.kind as EventKind;
  let payload: unknown;
  switch (kind) {
    case "expectation.recorded": {
      const p = exact(row.payload, ["expectation"], [], "expectation event payload");
      payload = { expectation: validateExpectation(p.expectation) };
      break;
    }
    case "observation.released": {
      const p = exact(row.payload, ["observation"], [], "observation event payload");
      payload = { observation: validateObservation(p.observation) };
      break;
    }
    case "expectation.resolved": {
      const p = exact(row.payload, ["resolution"], [], "resolution event payload");
      payload = { resolution: validateResolution(p.resolution) };
      break;
    }
    case "competence.derived": {
      const p = exact(row.payload, ["summary"], [], "competence event payload");
      payload = { summary: validateCompetence(p.summary) };
      break;
    }
    case "policy.version_recorded": {
      const p = exact(row.payload, ["policyVersion"], [], "policy version event payload");
      payload = { policyVersion: validatePolicyVersion(p.policyVersion) };
      break;
    }
    case "policy.reviewed": {
      const p = exact(row.payload, ["review"], [], "policy review event payload");
      payload = { review: validateReview(p.review) };
      break;
    }
    case "policy.trial_recorded": {
      const p = exact(row.payload, ["trial"], [], "policy trial event payload");
      payload = { trial: validateTrial(p.trial) };
      break;
    }
    case "policy.transitioned": {
      const p = exact(row.payload, ["transition"], [], "policy transition event payload");
      payload = { transition: validateTransition(p.transition) };
      break;
    }
    case "policy.applied": {
      const p = exact(row.payload, ["application"], [], "policy application event payload");
      payload = { application: validateApplication(p.application) };
      break;
    }
    case "job.queued": {
      const p = exact(row.payload, ["job"], [], "job event payload");
      payload = { job: validateJob(p.job) };
      break;
    }
    case "dependency.deleted": {
      const p = exact(row.payload, ["dependency"], [], "deletion event payload");
      payload = { dependency: validateDeleted(p.dependency) };
      break;
    }
  }
  return { id: row.id as string, sequence: row.sequence as number, at: row.at as number, schemaVersion: DEVELOPMENT_SCHEMA_VERSION, kind, payload } as DevelopmentEvent;
}

function eventPayload<K extends EventKind>(event: DevelopmentEvent, kind: K): EventPayload<K> | null {
  return (event.kind === kind ? event.payload : null) as EventPayload<K> | null;
}

function assertNotDeleted(state: DevelopmentReplay, kind: DeletedDependency["kind"], value: string): void {
  if (state.deletedDependencies.some((row) => row.kind === kind && row.id === value)) reject("deleted_dependency", `The ${kind} dependency was deleted: ${value}.`);
  if ((kind === "run" || kind === "evidence" || kind === "receipt" || kind === "expectation" || kind === "observation" || kind === "resolution") && state.deletedDependencies.some((row) => row.kind === "case" && state.expectations.some((expectation) => expectation.id === value && expectation.caseId === row.id))) {
    reject("deleted_dependency", `The ${kind} dependency belongs to a deleted case.`);
  }
}

function expectBefore(state: DevelopmentReplay, idValue: string, beforeSequence: number, label: string): DevelopmentEvent {
  const event = state.events.find((candidate) => candidate.id === idValue);
  if (!event || event.sequence >= beforeSequence) reject("missing_reference", `${label} must reference an earlier retained event.`);
  return event;
}

function onEvent(state: DevelopmentReplay, event: DevelopmentEvent): void {
  switch (event.kind) {
    case "expectation.recorded": {
      const { expectation } = event.payload;
      assertNotDeleted(state, "case", expectation.caseId);
      assertNotDeleted(state, "run", expectation.runId);
      if (state.expectations.some((row) => row.id === expectation.id)) reject("duplicate_record", `Expectation ID already exists: ${expectation.id}.`);
      state.expectations.push(expectation);
      break;
    }
    case "observation.released": {
      const { observation } = event.payload;
      assertNotDeleted(state, "case", observation.caseId);
      assertNotDeleted(state, "run", observation.runId);
      assertNotDeleted(state, "evidence", observation.source.sourceId);
      const expectation = state.expectations.find((row) => row.id === observation.expectationId);
      expectBefore(state, state.events.find((e) => eventPayload(e, "expectation.recorded")?.expectation.id === observation.expectationId)?.id ?? "", event.sequence, "Observation");
      if (!expectation || expectation.caseId !== observation.caseId || expectation.runId !== observation.runId || expectation.track !== observation.track) reject("invalid_reference", "Observation does not match its earlier expectation and track.");
      if (observation.source.kind === "simulation_release" && observation.source.worldVersion !== expectation.context.worldVersion) reject("track_mismatch", "Simulation observation world version differs from its expectation.");
      if (state.observations.some((row) => row.id === observation.id)) reject("duplicate_record", `Observation ID already exists: ${observation.id}.`);
      state.observations.push(observation);
      break;
    }
    case "expectation.resolved": {
      const { resolution } = event.payload;
      assertNotDeleted(state, "case", resolution.caseId);
      assertNotDeleted(state, "run", resolution.runId);
      const expectation = state.expectations.find((row) => row.id === resolution.expectationId);
      const expectationEvent = state.events.find((e) => eventPayload(e, "expectation.recorded")?.expectation.id === resolution.expectationId);
      if (!expectation || !expectationEvent || expectationEvent.sequence >= event.sequence || expectation.caseId !== resolution.caseId || expectation.runId !== resolution.runId || expectation.track !== resolution.track) reject("invalid_reference", "Resolution must follow and match its expectation.");
      const observations = resolution.observationIds.map((observationId) => {
        const found = state.observations.find((row) => row.id === observationId);
        const sourceEvent = state.events.find((e) => eventPayload(e, "observation.released")?.observation.id === observationId);
        if (!found || !sourceEvent || sourceEvent.sequence >= event.sequence || found.expectationId !== expectation.id || found.caseId !== resolution.caseId || found.runId !== resolution.runId || found.track !== resolution.track) reject("invalid_reference", "Resolution cites missing, late, mismatched, or cross-track observation.");
        return found;
      });
      if (resolution.status === "supported" && !observations.some((row) => row.result === "supports")) reject("invalid_resolution", "Supported resolution needs supporting released evidence.");
      if (resolution.status === "contradicted" && !observations.some((row) => row.result === "contradicts")) reject("invalid_resolution", "Contradicted resolution needs contradictory released evidence.");
      if (state.resolutions.some((row) => row.id === resolution.id)) reject("duplicate_record", `Resolution ID already exists: ${resolution.id}.`);
      state.resolutions.push(resolution);
      break;
    }
    case "competence.derived": {
      const { summary } = event.payload;
      const resolutionIds = [...summary.supportedResolutionIds, ...summary.contradictedResolutionIds, ...summary.unknownResolutionIds];
      for (const resolutionId of resolutionIds) {
        const resolution = state.resolutions.find((row) => row.id === resolutionId);
        if (!resolution || resolution.track !== summary.track || resolution.methodVersion !== summary.context.methodVersion) reject("invalid_reference", "Competence summary cites missing or mismatched resolution.");
        const expectation = state.expectations.find((row) => row.id === resolution.expectationId);
        if (!expectation || expectation.actionId !== summary.actionId || !sameContext(expectation.context, summary.context)) reject("invalid_competence", "Competence resolution does not match the summarized action and context.");
        const expectedStatus = summary.supportedResolutionIds.includes(resolutionId) ? "supported" : summary.contradictedResolutionIds.includes(resolutionId) ? "contradicted" : "unknown";
        if ((expectedStatus === "supported" && resolution.status !== "supported") || (expectedStatus === "contradicted" && resolution.status !== "contradicted") || (expectedStatus === "unknown" && (resolution.status === "supported" || resolution.status === "contradicted"))) reject("invalid_competence", "Competence bucket does not match the attributed resolution.");
      }
      uniqueRecordId(state.competence, summary, "Competence");
      state.competence.push(summary);
      break;
    }
    case "policy.version_recorded": {
      const { policyVersion } = event.payload;
      const prior = [...state.policies].filter((row) => row.policyId === policyVersion.policyId).sort((a, b) => b.version - a.version)[0];
      assertNotDeleted(state, "policy", policyVersion.policyId);
      if (policyVersion.supportResolutionIds.some((resolutionId) => !state.resolutions.some((row) => row.id === resolutionId && row.track === policyVersion.track && sameContext(state.expectations.find((e) => e.id === row.expectationId)?.context ?? policyVersion.context, policyVersion.context)))) reject("invalid_reference", "Policy support must reference retained same-track resolutions in its recorded context.");
      if (!prior) {
        if (policyVersion.version !== 1 || policyVersion.supersedesVersionId !== undefined) reject("invalid_policy_version", "First policy version must be version 1 and cannot supersede another version.");
      } else {
        if (policyVersion.version !== prior.version + 1 || policyVersion.supersedesVersionId !== prior.id || prior.track !== policyVersion.track) reject("invalid_policy_version", "A new policy version must explicitly supersede the immediately prior same-track version.");
        prior.supersededByVersionId = policyVersion.id;
      }
      if (state.policies.some((row) => row.id === policyVersion.id)) reject("duplicate_record", `Policy version ID already exists: ${policyVersion.id}.`);
      state.policies.push({ ...policyVersion, lifecycle: "candidate" });
      break;
    }
    case "policy.reviewed": {
      const { review } = event.payload;
      const policy = state.policies.find((row) => row.id === review.policyVersionId);
      if (!policy || policy.supersededByVersionId || policy.track !== review.track || latestPolicy(state, policy.policyId)?.id !== policy.id) reject("invalid_reference", "Review must match the latest retained policy version and track.");
      for (const sourceEventId of review.sourceEventIds) {
        expectBefore(state, sourceEventId, event.sequence, "Policy review");
        const sourceEvent = state.events.find((row) => row.id === sourceEventId);
        if (!sourceEvent || eventTrack(sourceEvent) !== review.track) reject("track_mismatch", "Policy review sources must match the reviewed policy track.");
      }
      if (review.reviewedAtSequence !== event.sequence) reject("invalid_review", "Review sequence must match its ledger event.");
      uniqueRecordId(state.reviews, review, "Policy review");
      state.reviews.push(review);
      break;
    }
    case "policy.trial_recorded": {
      const { trial } = event.payload;
      const policy = latestPolicy(state, state.policies.find((row) => row.id === trial.policyVersionId)?.policyId ?? "");
      if (!policy || policy.id !== trial.policyVersionId || policy.track !== "simulated" || policy.lifecycle !== "testing" || policy.scope.kind !== "simulation" || policy.scope.worldVersion !== trial.worldVersion) reject("invalid_trial", "Prospective trial must test the latest simulation policy in its named world.");
      assertNotDeleted(state, "case", trial.caseId);
      assertNotDeleted(state, "run", trial.runId);
      const resolution = state.resolutions.find((row) => row.id === trial.resolutionId);
      if (!resolution || resolution.track !== "simulated" || resolution.caseId !== trial.caseId || resolution.runId !== trial.runId || resolution.status !== (trial.outcome === "supports" ? "supported" : trial.outcome === "contradicts" ? "contradicted" : "inconclusive")) reject("invalid_trial", "Trial outcome must match its attributed released-observation resolution.");
      const expectation = state.expectations.find((row) => row.id === resolution.expectationId);
      if (!expectation || expectation.familyId !== trial.familyId || expectation.context.worldVersion !== trial.worldVersion) reject("invalid_trial", "Trial family or world version does not match its resolved expectation.");
      const supportFamilies = policy.supportResolutionIds.map((resolutionId) => state.resolutions.find((row) => row.id === resolutionId)).filter(Boolean).map((row) => state.expectations.find((e) => e.id === row!.expectationId)?.familyId);
      const supportCases = new Set(policy.supportResolutionIds.map((resolutionId) => state.resolutions.find((row) => row.id === resolutionId)?.caseId));
      if (supportFamilies.includes(trial.familyId)) reject("nonprospective_trial", "A policy discovery family cannot count as its prospective trial.");
      if (supportCases.has(trial.caseId)) reject("nonprospective_trial", "A policy discovery case cannot count as its prospective trial.");
      if (trial.outcome === "supports" && policy.action.kind === "prefer_check" && trial.selectedCheckId !== policy.action.actionId) reject("invalid_trial", "A supporting preference trial must select its declared check.");
      if (trial.outcome === "quiet_control" && trial.baselineCheckId !== trial.selectedCheckId) reject("invalid_trial", "A quiet control must preserve the baseline selection.");
      if (state.trials.some((row) => row.id === trial.id || (row.policyVersionId === trial.policyVersionId && row.familyId === trial.familyId))) reject("duplicate_trial", "Trial ID or policy-family trial already exists.");
      state.trials.push(trial);
      break;
    }
    case "policy.transitioned": {
      const { transition } = event.payload;
      const policy = state.policies.find((row) => row.id === transition.policyVersionId);
      if (!policy) reject("invalid_reference", "Policy transition references a missing version.");
      if (policy.supersededByVersionId || latestPolicy(state, policy.policyId)?.id !== policy.id) reject("stale_policy", "A superseded policy version is not the latest version and cannot be restored.");
      const allowed: Record<PolicyLifecycle, PolicyLifecycle[]> = {
        candidate: ["testing", "suspended", "retired"],
        testing: ["active", "suspended", "retired"],
        active: ["suspended", "retired"],
        suspended: ["retired"],
        retired: [],
      };
      if (policy.track === "real" && transition.toState !== "suspended" && transition.toState !== "retired") reject("advisory_only", "Real policies cannot enter an autonomous testing or active lifecycle.");
      if (!allowed[policy.lifecycle].includes(transition.toState)) reject("invalid_transition", `Cannot transition policy from ${policy.lifecycle} to ${transition.toState}.`);
      if (transition.toState === "testing") {
        if (transition.reasonCode !== "candidate_trial") reject("invalid_transition", "Testing requires the candidate_trial reason.");
        requireAcceptedReviews(state, policy.id);
      }
      if (transition.toState === "active") {
        if (transition.reasonCode !== "prospective_trials_passed") reject("invalid_transition", "Simulation admission requires prospective_trials_passed.");
        if (policy.track !== "simulated" || policy.scope.kind !== "simulation") reject("advisory_only", "Only named simulation policies may be admitted.");
        requireAcceptedReviews(state, policy.id);
        const trials = state.trials.filter((row) => row.policyVersionId === policy.id);
        const contributed = trials.some((row) => row.outcome === "supports" && row.selectedCheckId !== row.baselineCheckId && (policy.action.kind !== "prefer_check" || row.selectedCheckId === policy.action.actionId));
        const control = trials.some((row) => row.outcome === "contradicts" || row.outcome === "quiet_control");
        if (!contributed || !control) reject("admission_gate", "Admission requires a changed successful prospective selection and a contradiction or quiet control.");
      }
      if (transition.toState === "suspended" && !["contradiction", "context_changed", "objective_changed", "method_changed", "support_revoked"].includes(transition.reasonCode)) reject("invalid_transition", "Suspension requires a named reconsideration reason.");
      if (transition.toState === "retired" && transition.reasonCode !== "explicit_retirement") reject("invalid_transition", "Retirement requires an explicit retirement reason.");
      policy.lifecycle = transition.toState;
      break;
    }
    case "policy.applied": {
      const { application } = event.payload;
      const policy = state.policies.find((row) => row.id === application.policyVersionId);
      if (!policy || latestPolicy(state, policy.policyId)?.id !== policy.id || policy.lifecycle !== "active" || policy.track !== "simulated" || application.track !== policy.track) reject("invalid_application", "Application must reference the latest active simulation policy.");
      assertNotDeleted(state, "case", application.caseId);
      assertNotDeleted(state, "run", application.runId);
      for (const sourceEventId of application.sourceEventIds) expectBefore(state, sourceEventId, event.sequence, "Policy application");
      if (application.contributed && policy.action.kind === "prefer_check" && application.selectedCheckId !== policy.action.actionId) reject("invalid_application", "Attributed policy contribution does not match its declared preference.");
      uniqueRecordId(state.applications, application, "Policy application");
      state.applications.push(application);
      break;
    }
    case "job.queued": {
      const { job } = event.payload;
      expectBefore(state, job.sourceEventId, event.sequence, "Queued job source");
      uniqueRecordId(state.jobs, job, "Queued job");
      state.jobs.push(job);
      break;
    }
    case "dependency.deleted": {
      const { dependency } = event.payload;
      applyDeletion(state, dependency, event);
      break;
    }
  }
}

function latestPolicy(state: DevelopmentReplay, policyId: string): PolicyVersionView | undefined {
  return state.policies.filter((row) => row.policyId === policyId).sort((a, b) => b.version - a.version)[0];
}

function eventTrack(event: DevelopmentEvent): ExperienceTrack | undefined {
  switch (event.kind) {
    case "expectation.recorded": return event.payload.expectation.track;
    case "observation.released": return event.payload.observation.track;
    case "expectation.resolved": return event.payload.resolution.track;
    case "competence.derived": return event.payload.summary.track;
    case "policy.version_recorded": return event.payload.policyVersion.track;
    case "policy.reviewed": return event.payload.review.track;
    case "policy.trial_recorded": return event.payload.trial.track;
    case "policy.applied": return event.payload.application.track;
    default: return undefined;
  }
}

function requireAcceptedReviews(state: DevelopmentReplay, policyVersionId: string): void {
  const latest = new Map<PolicyReviewKind, PolicyReviewRecord>();
  for (const review of state.reviews.filter((row) => row.policyVersionId === policyVersionId).sort((a, b) => a.reviewedAtSequence - b.reviewedAtSequence)) latest.set(review.reviewKind, review);
  for (const kind of REVIEW_KINDS) {
    if (latest.get(kind)?.verdict !== "accepted") reject("review_required", `Policy needs a current accepted ${kind} review.`);
  }
}

function sourceRecord(event: DevelopmentEvent): Dict | null {
  switch (event.kind) {
    case "expectation.recorded": return event.payload.expectation as unknown as Dict;
    case "observation.released": return event.payload.observation as unknown as Dict;
    case "expectation.resolved": return event.payload.resolution as unknown as Dict;
    case "competence.derived": return event.payload.summary as unknown as Dict;
    case "policy.version_recorded": return event.payload.policyVersion as unknown as Dict;
    case "policy.reviewed": return event.payload.review as unknown as Dict;
    case "policy.trial_recorded": return event.payload.trial as unknown as Dict;
    case "policy.transitioned": return event.payload.transition as unknown as Dict;
    case "policy.applied": return event.payload.application as unknown as Dict;
    case "job.queued": return event.payload.job as unknown as Dict;
    case "dependency.deleted": return event.payload.dependency as unknown as Dict;
  }
}

function touches(record: Dict | null, dependency: DeletedDependency): boolean {
  if (!record) return false;
  const exactId = record.id === dependency.id;
  if (dependency.kind === "case") return record.caseId === dependency.id;
  if (dependency.kind === "run") return record.runId === dependency.id;
  if (dependency.kind === "policy") return exactId || record.policyId === dependency.id || record.policyVersionId === dependency.id;
  if (dependency.kind === "expectation") return exactId || record.expectationId === dependency.id;
  if (dependency.kind === "observation") return exactId || record.observationIds instanceof Array && record.observationIds.includes(dependency.id);
  if (dependency.kind === "resolution") return exactId || record.resolutionId === dependency.id || ["supportedResolutionIds", "contradictedResolutionIds", "unknownResolutionIds", "supportResolutionIds"].some((key) => Array.isArray(record[key]) && (record[key] as unknown[]).includes(dependency.id));
  if (dependency.kind === "evidence" || dependency.kind === "receipt") {
    const source = record.source;
    return exactId || (!!source && typeof source === "object" && (source as Dict).sourceId === dependency.id);
  }
  return false;
}

function applyDeletion(state: DevelopmentReplay, dependency: DeletedDependency, deletionEvent: DevelopmentEvent): void {
  const removedExpectations = new Set(state.expectations.filter((row) => touches(row as unknown as Dict, dependency)).map((row) => row.id));
  const removedObservations = new Set(state.observations.filter((row) => touches(row as unknown as Dict, dependency) || removedExpectations.has(row.expectationId)).map((row) => row.id));
  const removedResolutions = new Set(state.resolutions.filter((row) => touches(row as unknown as Dict, dependency) || removedExpectations.has(row.expectationId) || row.observationIds.some((idValue) => removedObservations.has(idValue))).map((row) => row.id));
  const removedPolicies = new Set(state.policies.filter((row) => touches(row as unknown as Dict, dependency) || row.supportResolutionIds.some((idValue) => removedResolutions.has(idValue))).map((row) => row.id));
  const removedEventIds = new Set(state.events.filter((row) => touches(sourceRecord(row), dependency)).map((row) => row.id));
  for (const event of state.events) {
    const payload = sourceRecord(event);
    if (!payload) continue;
    const referencesExpectation = "expectationId" in payload && removedExpectations.has(String(payload.expectationId));
    const referencesObservations = "observationIds" in payload && Array.isArray(payload.observationIds) && payload.observationIds.some((idValue) => removedObservations.has(String(idValue)));
    const referencesObservation = "observationId" in payload && removedObservations.has(String(payload.observationId));
    const referencesResolution = "resolutionId" in payload && removedResolutions.has(String(payload.resolutionId));
    const referencesResolutions = "supportResolutionIds" in payload && Array.isArray(payload.supportResolutionIds) && payload.supportResolutionIds.some((idValue) => removedResolutions.has(String(idValue)));
    const referencesPolicy = "policyVersionId" in payload && removedPolicies.has(String(payload.policyVersionId));
    if (referencesExpectation || referencesObservations || referencesObservation || referencesResolution || referencesResolutions || referencesPolicy) removedEventIds.add(event.id);
  }
  removedEventIds.delete(deletionEvent.id);
  state.events = state.events.filter((row) => !removedEventIds.has(row.id));
  state.expectations = state.expectations.filter((row) => !removedExpectations.has(row.id));
  state.observations = state.observations.filter((row) => !removedObservations.has(row.id));
  state.resolutions = state.resolutions.filter((row) => !removedResolutions.has(row.id));
  state.competence = state.competence.filter((row) => !touches(row as unknown as Dict, dependency) && !row.supportedResolutionIds.some((idValue) => removedResolutions.has(idValue)) && !row.contradictedResolutionIds.some((idValue) => removedResolutions.has(idValue)) && !row.unknownResolutionIds.some((idValue) => removedResolutions.has(idValue)));
  state.policies = state.policies.filter((row) => !removedPolicies.has(row.id));
  state.reviews = state.reviews.filter((row) => !removedPolicies.has(row.policyVersionId) && !row.sourceEventIds.some((idValue) => removedEventIds.has(idValue)));
  state.trials = state.trials.filter((row) => !removedPolicies.has(row.policyVersionId) && !removedExpectations.has(state.resolutions.find((resolution) => resolution.id === row.resolutionId)?.expectationId ?? "") && !removedResolutions.has(row.resolutionId));
  state.applications = state.applications.filter((row) => !removedPolicies.has(row.policyVersionId) && !touches(row as unknown as Dict, dependency));
  state.jobs = state.jobs.filter((row) => !removedEventIds.has(row.sourceEventId) && !touches(row as unknown as Dict, dependency));
  if (!state.deletedDependencies.some((row) => row.kind === dependency.kind && row.id === dependency.id)) state.deletedDependencies.push(dependency);
}

function emptyReplay(): DevelopmentReplay {
  return { events: [], lastSequence: 0, expectations: [], observations: [], resolutions: [], competence: [], policies: [], reviews: [], trials: [], applications: [], jobs: [], deletedDependencies: [] };
}

export function replayDevelopment(input: readonly unknown[]): DevelopmentReplay {
  if (!Array.isArray(input) || input.length > 100_000) reject("invalid_ledger", "Development event history must be a bounded array.");
  const byId = new Map<string, DevelopmentEvent>();
  for (const raw of input) {
    const event = validateEvent(raw);
    const prior = byId.get(event.id);
    if (prior && canonical(prior) !== canonical(event)) reject("event_id_conflict", `The same event ID has different content: ${event.id}.`);
    if (!prior) byId.set(event.id, event);
  }
  const events = [...byId.values()].sort((a, b) => a.sequence - b.sequence || a.id.localeCompare(b.id));
  const sequences = new Set<number>();
  for (const event of events) {
    if (sequences.has(event.sequence)) reject("sequence_conflict", `Development sequence is already used: ${event.sequence}.`);
    sequences.add(event.sequence);
  }
  const state = emptyReplay();
  for (const event of events) {
    onEvent(state, event);
    state.events.push(event);
    state.lastSequence = event.sequence;
  }
  return state;
}

export function activePolicyVersions(state: DevelopmentReplay): PolicyVersionView[] {
  const latest = new Map<string, PolicyVersionView>();
  for (const policy of state.policies) {
    const prior = latest.get(policy.policyId);
    if (!prior || prior.version < policy.version) latest.set(policy.policyId, policy);
  }
  return [...latest.values()].filter((policy) => policy.lifecycle === "active" && policy.track === "simulated" && policy.scope.kind === "simulation").sort((a, b) => a.policyId.localeCompare(b.policyId));
}
