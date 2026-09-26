import type { SelectionRecord } from "./selection";

export type Stakes = "low" | "consequential" | "irreversible";
export type Reversible = "yes" | "partial" | "no";
export type Answer = "yes" | "no" | "unknown";
export type Attention = "quiet" | "stirred" | "insisting";
export type ReviewLevel = "result" | "method" | "objective";
export type Verdict = "useful" | "noise" | "mixed";
export type Move = "measure" | "wait" | "step" | "revise" | "none";
export type MemoryKind = "repair" | "unfinished" | "challenge" | "experiment";
export type ViewId = "sit" | "mind" | "ledger" | "self";

export type GapKind =
  | "observation"
  | "evidence"
  | "model"
  | "context"
  | "representation"
  | "objective"
  | "strategic"
  | "dynamic"
  | "reflexive"
  | "competence";

export type EvidenceStatus = "reported" | "inferred" | "assumed" | "simulated" | "unresolved" | "verified_check";
export type FlyOp =
  | "continue"
  | "check_source"
  | "test_alternative"
  | "ask"
  | "reframe"
  | "rehearse"
  | "escalate"
  | "stop";
export type SeatId = "grok" | "fable" | "astra" | "gemini";
export type RoleId = "perception" | "world" | "perspective" | "boundary";

export interface WorkItem {
  question: string;
  responsibility: string;
  outOfScope: string;
  required: string;
  stopWhen: string;
}

export interface OrgProposal {
  id: string;
  name: string;
  why: string;
}

export interface EvidenceItem {
  id: string;
  status: EvidenceStatus;
  text: string;
  origin: "user" | "rule" | "demo" | "checker";
  at: number;
  caseId: string;
  runId: string;
  source?: { field: "prose" | "claim" | "objective" | "choice" | "artifact"; start: number; end: number };
  receiptId?: string;
}

export interface CheckReceipt {
  id: string;
  caseId: string;
  runId: string;
  at: number;
  criterion: "limen-report-v1";
  checkerVersion: "1";
  fingerprint: string;
  outcome: "pass" | "fail" | "error";
  claim: string;
  artifact: string;
  detail: string;
}

export interface FourRecords {
  environment: EvidenceItem[];
  perception: EvidenceItem[];
  belief: EvidenceItem[];
  self: EvidenceItem[];
}

export interface RouterChoice {
  op: FlyOp;
  why: string;
  fromLearning: boolean;
  roles: RoleId[];
}

export interface JevJudgment {
  id: string;
  primitive: "noul" | "choice" | "score";
  question: string;
  answer: string;
  detail: string;
}

export interface HiveSeat {
  id: SeatId;
  model: string;
  live: boolean;
  active: boolean;
  roleId: RoleId;
  role: string;
  subRoleId: string;
  subRole: string;
  text: string;
  weight: number;
  starting: boolean;
  work: WorkItem;
}

export interface PerturbationView {
  irrelevant: { ran: boolean; held: boolean | null; note: string };
  decisive: { ran: boolean; held: boolean | null; note: string };
}

export interface Fact {
  pred: string;
  a?: string;
  b?: string;
  c?: string;
  source: "given" | "signal" | "rule" | "fly" | "answer";
}

export interface TraceStep {
  ruleId: string;
  name: string;
  module: "classify" | "decide" | "challenge" | "attend" | "self";
  because: string;
  asserted: string[];
}

export interface Gap {
  kind: GapKind;
  summary: string;
  decisive: boolean;
}

export interface Ask {
  id: string;
  text: string;
  why: string;
  supportIds?: string[];
  unresolvedIds?: string[];
}

export interface Reading {
  signal: string;
  text: string;
  status: "open" | "confirmed" | "dismissed";
  source?: EvidenceItem["source"];
  certainty?: "asserted" | "uncertain";
}

export interface CouncilNote {
  agent: string;
  role: string;
  spoke: boolean;
  text: string;
}

export interface ProposedAction {
  id: string;
  title: string;
  why: string;
  mismatch: string;
  stopping: string;
  supportIds?: string[];
  unresolvedIds?: string[];
}

export interface Challenge {
  id: string;
  text: string;
  signature: string;
}

export interface Resemble {
  summary: string;
  overlap: number;
  caveat: string;
  action: string;
}

export interface EngineResult {
  retentionNote?: string;
  attention: Attention;
  attentionWhy: string;
  level: ReviewLevel;
  gaps: Gap[];
  asks: Ask[];
  readings: Reading[];
  actions: ProposedAction[];
  challenges: Challenge[];
  council: CouncilNote[];
  voice: string;
  alien: string;
  trace: TraceStep[];
  features: string[];
  kc: number[];
  novelty: number;
  resembles: Resemble | null;
  selfDoubt: string;
  flyPrior: string | null;
  records: FourRecords;
  router: RouterChoice;
  selection?: SelectionRecord;
  jev: JevJudgment[];
  hive: HiveSeat[];
  proposals: OrgProposal[];
  perturbations: PerturbationView;
  memoryCandidates?: { memoryId: string; status: "applicable" | "unknown" | "excluded"; why: string; checklist: string[] }[];
}

export interface Situation {
  id: string;
  title: string;
  familyId?: string;
  prose: string;
  claim: string;
  objective: string;
  choice: string;
  stakes: Stakes;
  reversible: Reversible;
  answers: Record<string, Answer>;
  dismissed: string[];
  mode: "case" | "self";
  episode?: "reviewer";
  revealed: string[];
  checks: string[];
  receipts?: CheckReceipt[];
  createdAt: number;
}

export interface Feedback {
  verdict: Verdict;
  move: Move;
  note: string;
  at: number;
}

export interface FeedbackEvent extends Feedback {
  id: string;
  runId: string;
  caseId: string;
  targetId: string;
  supersedes?: string;
}

export interface RoleFeedbackEvent {
  id: string;
  caseId: string;
  runId: string;
  subRoleId: string;
  verdict: "useful" | "noise";
  at: number;
  supersedes?: string;
}

export interface OutcomeEvent {
  id: string;
  caseId: string;
  runId: string;
  at: number;
  kind: "plan" | "result" | "defer" | "trigger";
  action?: string;
  proposedActionId?: string;
  memoryId?: string;
  expectation?: string;
  revisionCondition?: string;
  revisitAt?: number;
  revisitCondition?: string;
  status?: "observed" | "reported" | "unknown" | "ongoing";
  evidence?: string;
  changed?: string;
  assessment?: "supports" | "contradicts" | "unclear";
  supersedes?: string;
}

export interface ProviderResponse {
  id: string;
  caseId: string;
  runId: string;
  roleId: RoleId;
  requestId: string;
  model: string;
  text: string;
  at: number;
}

export interface Sitting {
  id: string;
  situationId: string;
  at: number;
  result: EngineResult;
  snapshot?: Situation;
  parentRunId?: string;
  revisionReason?: string;
  feedback?: Feedback;
  responses?: ProviderResponse[];
  grok?: string;
  grokModel?: string;
}

export interface FlyEngram {
  id: string;
  sittingId: string;
  kc: number[];
  at: number;
  action: string;
  valence: number;
  summary: string;
  features: string[];
}

export interface MemoryObject {
  id: string;
  kind: MemoryKind;
  title: string;
  pattern: string[];
  body: string;
  caveat: string;
  test: string;
  revival: string;
  sittingId: string;
  at: number;
  status: "candidate" | "kept" | "retired";
  prerequisites?: string[];
  exclusions?: string[];
  originFamily?: string;
  validationCaseIds?: string[];
  validationStatus?: "unvalidated" | "review_required" | "validated" | "counterexample";
  counterexamples?: string[];
}

export interface Blindspot {
  id: string;
  text: string;
  signal?: string;
  at: number;
}

export interface Reflex {
  id: string;
  when: string;
  ask: string;
  never: string;
  at: number;
}

export interface SitInput {
  prose: string;
  claim: string;
  objective: string;
  choice: string;
  stakes: Stakes;
  reversible: Reversible;
  answers: Record<string, Answer>;
  dismissed: string[];
  reflexes: Reflex[];
  blindspots: Blindspot[];
  engrams: FlyEngram[];
  ruleBias: Record<string, number>;
  mode: "case" | "self";
  revealed?: string[];
  checks?: string[];
  episode?: "reviewer";
  caseId?: string;
  runId?: string;
  receipts?: CheckReceipt[];
  selfReport?: SelfReport;
  now?: number;
  opBias?: Partial<Record<FlyOp, number>>;
  subBias?: Record<string, number>;
  selection?: SelectionRecord;
}

export interface SelfReport {
  sittings: number;
  useful: number;
  noise: number;
  unevaluated: number;
  topNoisyRule?: string;
}
