import { FEATURE_LABEL, extractFeatures, kenyon, recallFly, stripPrestige } from "./fly";
import { enrich } from "./enrich";
import type {
  Ask,
  Attention,
  Challenge,
  CouncilNote,
  EngineResult,
  Fact,
  Gap,
  GapKind,
  ProposedAction,
  Reading,
  ReviewLevel,
  SitInput,
  TraceStep,
} from "./types";

type Module = TraceStep["module"];

interface Rule {
  id: string;
  name: string;
  module: Module;
  salience: number;
  test: (wm: Fact[], input: SitInput) => boolean;
  fire: (wm: Fact[], input: SitInput) => Fact[];
  because: (wm: Fact[], input: SitInput) => string;
}

function has(wm: Fact[], pred: string, a?: string, b?: string): boolean {
  return wm.some((f) => f.pred === pred && (a === undefined || f.a === a) && (b === undefined || f.b === b));
}

function pushFact(wm: Fact[], fact: Fact): boolean {
  if (wm.some((f) => f.pred === fact.pred && f.a === fact.a && f.b === fact.b)) return false;
  wm.push(fact);
  return true;
}

function sig(wm: Fact[], name: string): boolean {
  return has(wm, "signal", name);
}

function answered(input: SitInput, id: string): boolean {
  return input.answers[id] !== undefined;
}

const rules: Rule[] = [
  {
    id: "gap-evidence-lineage",
    name: "Shared ancestor is not corroboration",
    module: "classify",
    salience: 80,
    test: (wm) => sig(wm, "shared-ancestor") && !has(wm, "gap", "evidence"),
    fire: () => [
      { pred: "gap", a: "evidence", b: "lineage", source: "rule" },
      { pred: "challenge", a: "lineage", source: "rule" },
    ],
    because: () =>
      "Repeated statements showed up in the wording. Copies of one table are not independent measurements.",
  },
  {
    id: "gap-observation",
    name: "Missing observation",
    module: "classify",
    salience: 78,
    test: (wm) => sig(wm, "unmeasured") && !has(wm, "gap", "observation"),
    fire: () => [{ pred: "gap", a: "observation", b: "unmeasured", source: "rule" }],
    because: () => "The wording says something the choice depends on was not measured or not described.",
  },
  {
    id: "gap-schema",
    name: "Success is not acceptance",
    module: "classify",
    salience: 92,
    test: (wm) => sig(wm, "schema") && !has(wm, "gap", "observation", "schema"),
    fire: () => [
      { pred: "gap", a: "observation", b: "schema", source: "rule" },
      { pred: "belief-revision", a: "execution-is-not-acceptance", source: "rule" },
    ],
    because: () =>
      "A check against the current schema failed. The success code remains observed. It does not establish a valid report.",
  },
  {
    id: "gap-handoff",
    name: "Acceptance is still unchecked",
    module: "classify",
    salience: 86,
    test: (wm) => sig(wm, "handoff") && !sig(wm, "schema") && !has(wm, "gap", "observation", "handoff"),
    fire: () => [
      { pred: "gap", a: "observation", b: "handoff", source: "rule" },
      { pred: "gap", a: "model", b: "motive", source: "rule" },
    ],
    because: () =>
      "A success code and a refusal are both in the packet. The refusal is not yet an observation of resistance, and the current requirements have not been checked.",
  },
  {
    id: "gap-context",
    name: "Applicability envelope",
    module: "classify",
    salience: 70,
    test: (wm) => sig(wm, "context-shift") && !has(wm, "gap", "context"),
    fire: () => [{ pred: "gap", a: "context", b: "envelope", source: "rule" }],
    because: () => "The situation names a context the packet may not cover. Truth of a claim and transfer of a claim are different.",
  },
  {
    id: "gap-strategic",
    name: "Incentive is a reason to check",
    module: "classify",
    salience: 68,
    test: (wm) => sig(wm, "incentive") && !has(wm, "gap", "strategic"),
    fire: () => [{ pred: "gap", a: "strategic", b: "incentive", source: "rule" }],
    because: () =>
      "A party who benefits if the claim is accepted is present. That guides corroboration. It is not a verdict.",
  },
  {
    id: "gap-model",
    name: "Disagreement before a winner",
    module: "classify",
    salience: 72,
    test: (wm) => sig(wm, "disagreement") && !has(wm, "gap", "model"),
    fire: () => [{ pred: "gap", a: "model", b: "disagreement", source: "rule" }],
    because: () => "Two accounts do not match. Averaging them would hide the variable that might explain both.",
  },
  {
    id: "gap-representation",
    name: "A convention may be a missing distinction",
    module: "classify",
    salience: 74,
    test: (wm) => (sig(wm, "units") || sig(wm, "disagreement")) && !has(wm, "gap", "representation"),
    fire: () => [{ pred: "gap", a: "representation", b: "convention", source: "rule" }],
    because: () => "A unit, dimension, or convention is in play. Cases that look identical under one convention may reverse under another.",
  },
  {
    id: "gap-objective",
    name: "The meaning of better is unsettled",
    module: "classify",
    salience: 76,
    test: (wm, input) => {
      if (has(wm, "gap", "objective")) return false;
      if (!input.objective.trim()) return true;
      return sig(wm, "metric-drift") || sig(wm, "relevance");
    },
    fire: (wm, input) => [
      {
        pred: "gap",
        a: "objective",
        b: !input.objective.trim() ? "unstated" : sig(wm, "metric-drift") ? "metric" : "relevance",
        source: "rule",
      },
    ],
    because: (_wm, input) =>
      !input.objective.trim()
        ? "No meaning of better was stated. A convenient metric would be an invention."
        : "A property or a score is being asked to stand in for the stated purpose.",
  },
  {
    id: "gap-reflexive",
    name: "The act can change the evidence",
    module: "classify",
    salience: 73,
    test: (wm) => (sig(wm, "reflexive") || sig(wm, "metric-drift")) && !has(wm, "gap", "reflexive"),
    fire: () => [{ pred: "gap", a: "reflexive", b: "performative", source: "rule" }],
    because: () =>
      "People can adapt to a score or a warning. Prevention must not be stored as a simple false alarm, and a cleaner dashboard is not yet a better outcome.",
  },
  {
    id: "gap-dynamic",
    name: "Horizon, not more decimals",
    module: "classify",
    salience: 60,
    test: (wm) => sig(wm, "rare") && !has(wm, "gap", "dynamic"),
    fire: () => [{ pred: "gap", a: "dynamic", b: "horizon", source: "rule" }],
    because: () => "The situation is rare or unfamiliar. A finer forecast is the wrong response if the representation itself is thin.",
  },
  {
    id: "gap-competence-self",
    name: "Thin self-knowledge",
    module: "self",
    salience: 90,
    test: (wm, input) =>
      input.mode === "self" && !has(wm, "gap", "competence", "thin") && (input.selfReport?.sittings ?? 0) < 4,
    fire: () => [{ pred: "gap", a: "competence", b: "thin", source: "rule" }],
    because: () => "There are not enough marked sittings to say the instrument's usual move is reliable.",
  },
  {
    id: "gap-competence-unevaluated",
    name: "Silence and success are unevaluated",
    module: "self",
    salience: 88,
    test: (wm, input) => {
      if (input.mode !== "self" || has(wm, "gap", "competence", "unevaluated")) return false;
      const r = input.selfReport;
      if (!r || r.sittings < 1) return false;
      return r.useful + r.noise === 0;
    },
    fire: () => [{ pred: "gap", a: "competence", b: "unevaluated", source: "rule" }],
    because: () => "Sittings exist, and none were marked. An unmarked success cannot teach, and a quiet miss would be invisible.",
  },
  {
    id: "gap-competence-noise",
    name: "The method is noisier than it is useful",
    module: "self",
    salience: 87,
    test: (wm, input) => {
      if (input.mode !== "self" || has(wm, "gap", "competence", "noise")) return false;
      const r = input.selfReport;
      return !!r && r.noise > r.useful && r.noise >= 2;
    },
    fire: () => [{ pred: "gap", a: "competence", b: "noise", source: "rule" }],
    because: (_wm, input) =>
      `Marked noise exceeds marked usefulness.${input.selfReport?.topNoisyRule ? ` The noisiest rule has been “${input.selfReport.topNoisyRule}”.` : ""}`,
  },
  {
    id: "challenge-closure",
    name: "Premature closure",
    module: "challenge",
    salience: 55,
    test: (wm) => sig(wm, "closure") && has(wm, "gap") && !has(wm, "challenge", "closure"),
    fire: () => [{ pred: "challenge", a: "closure", source: "rule" }],
    because: () => "The wording is already inclined to close, and at least one gap is still open.",
  },
  {
    id: "challenge-handoff",
    name: "Execution standing in for acceptance",
    module: "challenge",
    salience: 57,
    test: (wm) => sig(wm, "handoff") && !has(wm, "challenge", "handoff"),
    fire: () => [{ pred: "challenge", a: "handoff", source: "rule" }],
    because: () => "A finished tool is being asked to count as an accepted result. The separating test is a check against the current requirements.",
  },
  {
    id: "challenge-accident",
    name: "Correct by accident",
    module: "challenge",
    salience: 54,
    test: (wm) => (sig(wm, "units") || sig(wm, "shared-ancestor") || sig(wm, "relevance")) && !has(wm, "challenge", "accident"),
    fire: () => [{ pred: "challenge", a: "accident", source: "rule" }],
    because: () =>
      "A result could land correctly while the method is fragile. The neighborhood of the success is the test, not a repetition of the same arithmetic.",
  },
  {
    id: "challenge-default",
    name: "Unknown became a default",
    module: "challenge",
    salience: 52,
    test: (wm) => sig(wm, "defaulted") && !has(wm, "challenge", "default"),
    fire: () => [{ pred: "challenge", a: "default", source: "rule" }],
    because: () => "An unknown may have been filled in. A filled value can look like a measurement.",
  },
  {
    id: "ask-convention",
    name: "Would the convention reverse the fit",
    module: "decide",
    salience: 64,
    test: (wm, input) => has(wm, "gap", "representation") && !answered(input, "convention-reverses") && !has(wm, "ask", "convention-reverses"),
    fire: () => [{ pred: "ask", a: "convention-reverses", source: "rule" }],
    because: () => "If the other convention would not change the fit, the ambiguity can stay unresolved for this decision.",
  },
  {
    id: "ask-delivery",
    name: "Stock or promise",
    module: "decide",
    salience: 62,
    test: (wm, input) => sig(wm, "incentive") && !answered(input, "delivery-committed") && !has(wm, "ask", "delivery-committed"),
    fire: () => [{ pred: "ask", a: "delivery-committed", source: "rule" }],
    because: () => "The useful distinction is committed inventory versus an optimistic estimate, not the speaker's motive by itself.",
  },
  {
    id: "ask-weight",
    name: "Does weight do any work",
    module: "decide",
    salience: 61,
    test: (wm, input) => sig(wm, "relevance") && !answered(input, "weight-decisive") && !has(wm, "ask", "weight-decisive"),
    fire: () => [{ pred: "ask", a: "weight-decisive", source: "rule" }],
    because: () => "Lightness may be true. It matters only if some requirement you actually hold makes it decisive.",
  },
  {
    id: "ask-tradeoff",
    name: "Which good dominates",
    module: "decide",
    salience: 63,
    test: (wm, input) => has(wm, "gap", "objective") && !answered(input, "tradeoff") && !has(wm, "ask", "tradeoff"),
    fire: () => [{ pred: "ask", a: "tradeoff", source: "rule" }],
    because: () => "Until the priority is named, I should not present one option as the winner.",
  },
  {
    id: "ask-acceptance",
    name: "Was acceptance checked",
    module: "decide",
    salience: 66,
    test: (wm, input) =>
      sig(wm, "handoff") && !sig(wm, "schema") && !answered(input, "acceptance-checked") && !has(wm, "ask", "acceptance-checked"),
    fire: () => [{ pred: "ask", a: "acceptance-checked", source: "rule" }],
    because: () => "A success code does not record whether the current requirements were met.",
  },
  {
    id: "mark-decisive-convention",
    name: "Convention is decisive",
    module: "decide",
    salience: 50,
    test: (wm, input) => input.answers["convention-reverses"] === "yes" && !has(wm, "decisive", "convention-reverses"),
    fire: () => [{ pred: "decisive", a: "convention-reverses", source: "answer" }],
    because: () => "You said the other convention would reverse the fit. That unknown moves ahead of general description.",
  },
  {
    id: "mark-weight-irrelevant",
    name: "Weight does not move the choice",
    module: "decide",
    salience: 50,
    test: (_wm, input) => input.answers["weight-decisive"] === "no" && !has(_wm, "irrelevant", "weight"),
    fire: () => [{ pred: "irrelevant", a: "weight", source: "answer" }],
    because: () => "You said weight does not decide. I will stop treating lightness as support.",
  },
  {
    id: "taught-miss",
    name: "A taught blind spot matches",
    module: "self",
    salience: 84,
    test: (wm, input) =>
      input.blindspots.some((b) => b.signal && sig(wm, b.signal)) && !has(wm, "taught-miss"),
    fire: (wm, input) => {
      const hit = input.blindspots.find((b) => b.signal && sig(wm, b.signal));
      return [{ pred: "taught-miss", a: hit?.text ?? "a taught miss", b: hit?.signal, source: "rule" }];
    },
    because: () => "A limitation you taught me matches a signal in this situation.",
  },
  {
    id: "taught-reflex",
    name: "A taught reflex wakes",
    module: "self",
    salience: 66,
    test: (wm, input) => {
      if (has(wm, "reflex-hit")) return false;
      const blob = `${input.prose} ${input.claim}`.toLowerCase();
      return input.reflexes.some((r) => r.when.trim() && blob.includes(r.when.trim().toLowerCase()));
    },
    fire: (_wm, input) => {
      const blob = `${input.prose} ${input.claim}`.toLowerCase();
      const hit = input.reflexes.find((r) => r.when.trim() && blob.includes(r.when.trim().toLowerCase()));
      return [
        { pred: "reflex-hit", a: hit?.ask ?? "", b: hit?.never ?? "", c: hit?.when, source: "rule" },
      ];
    },
    because: () => "Wording matched a reflex you taught. The reflex asks. It does not authorize an action.",
  },
  {
    id: "action-lineage",
    name: "Trace the ancestor",
    module: "decide",
    salience: 40,
    test: (wm) => has(wm, "gap", "evidence") && !has(wm, "action", "trace-lineage"),
    fire: () => [{ pred: "action", a: "trace-lineage", source: "rule" }],
    because: () => "The decisive check is whether agreeing sources share a parent, not how many times the sentence was copied.",
  },
  {
    id: "action-observe",
    name: "Ask for the missing observation",
    module: "decide",
    salience: 42,
    test: (wm) =>
      has(wm, "gap", "observation") && !sig(wm, "handoff") && !sig(wm, "schema") && !has(wm, "action", "observe"),
    fire: () => [{ pred: "action", a: "observe", source: "rule" }],
    because: () => "More explanation will not stand in for the measurement.",
  },
  {
    id: "action-schema",
    name: "Inspect the failed check",
    module: "decide",
    salience: 47,
    test: (wm) => has(wm, "belief-revision") && !has(wm, "action", "keep-failure"),
    fire: () => [{ pred: "action", a: "keep-failure", source: "rule" }],
    because: () => "The response to a failed prerequisite is to keep the failure in view, not to write a more persuasive note.",
  },
  {
    id: "action-check-acceptance",
    name: "Check the current requirements",
    module: "decide",
    salience: 48,
    test: (wm) => sig(wm, "handoff") && !sig(wm, "schema") && !has(wm, "action", "check-acceptance"),
    fire: () => [{ pred: "action", a: "check-acceptance", source: "rule" }],
    because: () => "The missing observation is whether the output meets the criteria in force, not whether a note can be more persuasive.",
  },
  {
    id: "action-discriminate",
    name: "Separate the accounts",
    module: "decide",
    salience: 41,
    test: (wm) => (has(wm, "gap", "model") || has(wm, "gap", "strategic")) && !has(wm, "action", "discriminate"),
    fire: () => [{ pred: "action", a: "discriminate", source: "rule" }],
    because: () => "Find the observation that would make one account hold and the other fail.",
  },
  {
    id: "action-qualify",
    name: "Qualify the transfer",
    module: "decide",
    salience: 36,
    test: (wm) => has(wm, "gap", "context") && !has(wm, "action", "qualify-claim"),
    fire: () => [{ pred: "action", a: "qualify-claim", source: "rule" }],
    because: () => "Keep the original claim. Limit where it is being asked to travel.",
  },
  {
    id: "action-tradeoff",
    name: "Ask the trade-off",
    module: "decide",
    salience: 44,
    test: (wm) => has(wm, "gap", "objective") && !has(wm, "irrelevant", "objective") && !has(wm, "action", "ask-tradeoff"),
    fire: () => [{ pred: "action", a: "ask-tradeoff", source: "rule" }],
    because: () => "Preference is part of the missing information. I should not invent it.",
  },
  {
    id: "action-stage",
    name: "Stage the commitment",
    module: "decide",
    salience: 46,
    test: (wm, input) => {
      if (has(wm, "action", "stage-commitment")) return false;
      const hot = input.stakes !== "low" && input.reversible !== "yes";
      const open = has(wm, "gap", "observation") || has(wm, "gap", "representation") || has(wm, "decisive");
      return hot && open && (sig(wm, "pressure") || input.stakes === "irreversible");
    },
    fire: () => [{ pred: "action", a: "stage-commitment", source: "rule" }],
    because: () => "The inclined move wants to close, and a decisive unknown is still open. A reversible step is the response, not a sharper point estimate.",
  },
  {
    id: "action-horizon",
    name: "Shorten the horizon",
    module: "decide",
    salience: 34,
    test: (wm) => has(wm, "gap", "dynamic") && !has(wm, "action", "shorten-horizon"),
    fire: () => [{ pred: "action", a: "shorten-horizon", source: "rule" }],
    because: () => "State when the forecast expires. Reobserve where that is possible.",
  },
  {
    id: "action-abstain-self",
    name: "Do not praise the instrument yet",
    module: "self",
    salience: 48,
    test: (wm) => has(wm, "gap", "competence") && !has(wm, "action", "abstain"),
    fire: () => [{ pred: "action", a: "abstain", source: "rule" }],
    because: () => "A fluent account of my own limits is not evidence that I have them right.",
  },
  {
    id: "attend-insist",
    name: "Insist",
    module: "attend",
    salience: 30,
    test: (wm, input) => {
      if (has(wm, "attention")) return false;
      const serious = input.stakes !== "low";
      const open = has(wm, "decisive") || has(wm, "gap", "observation") || has(wm, "gap", "representation") || has(wm, "gap", "reflexive");
      return serious && open && (sig(wm, "pressure") || input.reversible !== "yes" || has(wm, "gap", "reflexive"));
    },
    fire: () => [{ pred: "attention", a: "insisting", source: "rule" }],
    because: () => "Something that could change the move is unresolved, and waiting or committing both have a cost.",
  },
  {
    id: "attend-stirred",
    name: "Stir",
    module: "attend",
    salience: 22,
    test: (wm) => !has(wm, "attention") && has(wm, "gap"),
    fire: () => [{ pred: "attention", a: "stirred", source: "rule" }],
    because: () => "There is a real gap, and it is not yet clear that the gap should stop the move.",
  },
  {
    id: "attend-quiet",
    name: "Stay quiet",
    module: "attend",
    salience: 12,
    test: (wm, input) => !has(wm, "attention") && !has(wm, "gap") && input.stakes === "low",
    fire: () => [
      { pred: "attention", a: "quiet", source: "rule" },
      { pred: "action", a: "stay-quiet", source: "rule" },
    ],
    because: () => "Nothing in the wording, and nothing in the stakes, asks for a challenge. Silence is the result.",
  },
  {
    id: "attend-fallback",
    name: "Name the thinness",
    module: "attend",
    salience: 8,
    test: (wm) => !has(wm, "attention"),
    fire: (wm, input) => {
      const level: Attention = input.stakes === "irreversible" ? "stirred" : "quiet";
      const facts: Fact[] = [{ pred: "attention", a: level, source: "rule" }];
      if (level === "quiet") facts.push({ pred: "action", a: "stay-quiet", source: "rule" });
      else facts.push({ pred: "gap", a: "competence", b: "unseen", source: "rule" });
      return facts;
    },
    because: (wm, input) =>
      input.stakes === "irreversible"
        ? "I found no specific gap, and the stakes are hard to undo. The honest state is that I may be failing to see the question."
        : "No rule found a gap that earns an interruption.",
  },
];

const ASK_COPY: Record<string, { text: string; why: string }> = {
  "convention-reverses": {
    text: "Would a different convention reverse whether this fits?",
    why: "If every plausible convention leaves the fit unchanged, the ambiguity is not decisive.",
  },
  "delivery-committed": {
    text: "Is the rapid delivery committed stock, or an estimate?",
    why: "Motive alone does not settle the claim. A record of inventory would.",
  },
  "weight-decisive": {
    text: "Does any requirement you actually hold make weight decisive?",
    why: "A true fact can still be irrelevant. I should not keep it in the argument out of habit.",
  },
  tradeoff: {
    text: "If two goods conflict, which one dominates this decision?",
    why: "I can show which option serves which good. I cannot choose your priority.",
  },
  "acceptance-checked": {
    text: "Has this output been checked against the requirements the reviewer is using now?",
    why: "Until that check exists, execution and acceptance are different events.",
  },
};

const READING_COPY: Record<string, string> = {
  "shared-ancestor": "I am reading the agreeing documents as copies of one ancestor, not as independent measurements.",
  incentive: "I am reading a speaker who benefits if the claim is believed. I have not decided that they are wrong.",
  unmeasured: "I am reading a needed property as unmeasured, not as false.",
  "context-shift": "I am reading the situation as outside the envelope of the evidence, or at least unshown to be inside it.",
  disagreement: "I am reading two accounts as a disagreement to be separated, not as noise to average.",
  closure: "I am reading your wording as already leaning toward closing the question.",
  pressure: "I am reading a push to commit before the gap is resolved.",
  relevance: "I am reading a cited property — lightness, speed, or price — as possibly true and possibly beside the point.",
  "metric-drift": "I am reading an improved score as a claim about the score, not yet about the purpose.",
  rare: "I am reading this as unfamiliar enough that my usual categories may be thin.",
  defaulted: "I am reading a value as possibly filled in where a measurement was missing.",
  units: "I am reading a unit or convention as something that could reverse the result.",
  reflexive: "I am reading the intervention as something that can change the evidence used to judge it.",
  hedged: "I am reading you as already unsure, so I should not add a louder version of that unsureness.",
  handoff: "I am reading a finished tool and an unapproved result as a handoff. I am not reading the refusal as a motive.",
  schema: "I am reading a failed check against the current acceptance criteria. The success code stays in the record as a success code.",
};

const ACTION_COPY: Record<string, Omit<ProposedAction, "id">> = {
  "trace-lineage": {
    title: "Trace the shared ancestor",
    why: "Resolve whether agreement is many measurements or one statement copied.",
    mismatch: "Do not treat a higher document count as corroboration.",
    stopping: "Stop when one independent source confirms the convention, or when you learn the convention cannot change the fit.",
  },
  observe: {
    title: "Get the missing observation",
    why: "Name the property, measure it or ask for it, and keep the decision symbolic until then if the move would change.",
    mismatch: "Do not write a more elaborate explanation in place of the measurement.",
    stopping: "Stop measuring if every plausible value leaves the same move acceptable.",
  },
  "check-acceptance": {
    title: "Check the current requirements",
    why: "The packet has a success code and a refusal. The missing observation is whether the output meets the criteria now in force.",
    mismatch: "Do not send a more persuasive note in place of that check.",
    stopping: "Stop when the check is recorded, including if it fails.",
  },
  "keep-failure": {
    title: "Keep the failed check in view",
    why: "The schema check is now part of the environment. The belief that the task was already acceptable does not survive it.",
    mismatch: "Do not defend the success code as acceptance, and do not infer the reviewer's motive from the failure.",
    stopping: "Stop when the report is regenerated against the current schema, or the requirement itself is revised.",
  },
  discriminate: {
    title: "Find a separating observation",
    why: "Ask what would be true in one account and false in the other, including stock versus promise.",
    mismatch: "Do not average incompatible claims, and do not convict a source for having an interest.",
    stopping: "Stop when the separator is in hand, or when the choice is stable under both accounts.",
  },
  "qualify-claim": {
    title: "Qualify where the claim may travel",
    why: "Keep the claim. State the envelope. Treat use outside it as a new question.",
    mismatch: "Do not call the original claim false merely because the new context is different.",
    stopping: "Stop when the envelope is explicit enough that a later reader can see the boundary.",
  },
  "ask-tradeoff": {
    title: "Name which good dominates",
    why: "Report the options as serving different goods until a priority is given.",
    mismatch: "Do not quietly optimize a metric because it is numeric.",
    stopping: "Stop asking once the priority is stated, or once you choose to leave the fork visible.",
  },
  "stage-commitment": {
    title: "Take a reversible step, or wait on purpose",
    why: "Compare a small inspection, a conditional order, and delay under the same horizon.",
    mismatch: "Do not treat the highest point estimate as a reason to close an irreversible move.",
    stopping: "Stop staging when the next step no longer closes an option you still need, or when delay itself becomes the harm.",
  },
  "shorten-horizon": {
    title: "Shorten the forecast and name a reobservation",
    why: "Say what would expire the current view: a time, a threshold, or a new measurement.",
    mismatch: "Do not add decimal places to a trajectory that has already left its useful horizon.",
    stopping: "Stop once the expiry condition is written down.",
  },
  abstain: {
    title: "Refuse a flattering self-assessment",
    why: "Keep the claim about my own competence provisional until marked outcomes exist.",
    mismatch: "Do not treat a coherent story about my rules as evidence that the rules are good.",
    stopping: "Stop the self-review when the missing ingredient is an external mark, not another paragraph.",
  },
  "stay-quiet": {
    title: "Stay quiet",
    why: "No gap I can defend would change what you do.",
    mismatch: "Do not produce a challenge in order to look careful.",
    stopping: "Wake if the stakes change, a new contradiction appears, or you tell me I missed something.",
  },
};

const GAP_SUMMARY: Record<GapKind, string> = {
  observation: "A property the choice uses was not measured. Absence is not the same as a negative result.",
  evidence: "Support is weaker than repetition suggests. Lineage and independence have not been separated.",
  model: "More than one account fits. Choosing a winner now would be a preference, not a test.",
  context: "A claim can be supported inside its envelope and still be the wrong thing to transfer.",
  representation: "The current categories may be merging cases that would not behave the same.",
  objective: "What should count as better is unsettled, or a score is standing in for it.",
  strategic: "Someone can shape what gets said. That calls for a distinguishing record, not a presumed falsehood.",
  dynamic: "Detail may decay faster than the decision needs. The useful product is a horizon, not a longer story.",
  reflexive: "Acting on the prediction can change the outcome that is later used to judge the prediction.",
  competence: "The limit is in the instrument or the record of its performance, not only in the outside facts.",
};

const COMPETENCE_REASON: Record<string, string> = {
  thin: "There are not enough marked sittings to treat a self-assessment as evidence.",
  unevaluated: "Some sittings were never marked, so a quiet miss and an untested success look the same from here.",
  noise: "Marked noise has outweighed marked usefulness. The method is the suspect, not the latest paragraph.",
  unseen: "No specific gap was found. On a hard-to-undo choice, that absence can mean the question itself was missed.",
};

const CHALLENGE_COPY: Record<string, Challenge> = {
  lineage: {
    id: "lineage",
    text: "What would count against treating these sources as independent?",
    signature: "A shared parent table, citation, or instrument — already suggested by the wording.",
  },
  closure: {
    id: "closure",
    text: "What nearby alternative is still unresolved, and which observation would separate it?",
    signature: "An open alternative with a test, not an endless list of worries.",
  },
  accident: {
    id: "accident",
    text: "If the inclined result turned out right, what nearby case would still expose a bad method?",
    signature: "A variation that breaks a cancelling error, a leaked cue, or a convention that happened not to matter.",
  },
  default: {
    id: "default",
    text: "Which value in the argument was assumed rather than observed?",
    signature: "A field whose provenance is estimate, copy, or default — and a decision that moves if that field moves.",
  },
  handoff: {
    id: "handoff",
    text: "What would show that a success code is not the same as acceptance?",
    signature: "A check against the current requirements. A more persuasive note is not that check.",
  },
};

function attentionOf(wm: Fact[]): Attention {
  const f = wm.find((x) => x.pred === "attention");
  if (f?.a === "insisting" || f?.a === "stirred" || f?.a === "quiet") return f.a;
  return "quiet";
}

function levelOf(wm: Fact[]): ReviewLevel {
  if (has(wm, "gap", "objective") || has(wm, "gap", "reflexive")) return "objective";
  if (has(wm, "gap", "competence") || has(wm, "challenge", "accident")) return "method";
  return "result";
}

function composeAlien(input: SitInput, wm: Fact[]): string {
  const parts: string[] = [];
  parts.push("Set the familiar names aside.");
  if (input.choice.trim()) {
    parts.push("An agent is inclined toward a commitment.");
  } else {
    parts.push("An agent has not yet named a commitment.");
  }
  if (sig(wm, "shared-ancestor")) parts.push("Several carriers repeat one statement. Repetition is not a new observation.");
  if (sig(wm, "unmeasured")) parts.push("A property of the situation is missing from the packet.");
  if (sig(wm, "context-shift")) parts.push("Evidence gathered under one envelope is being asked to cover another.");
  if (sig(wm, "incentive")) parts.push("One statement comes from a party who gains if it is accepted.");
  if (sig(wm, "relevance")) parts.push("A property is cited that may not sit on the path to the stated good.");
  if (sig(wm, "metric-drift") || sig(wm, "reflexive")) {
    parts.push("A score moved. The score is not the purpose, and the act of scoring can change what is later measured.");
  }
  if (sig(wm, "handoff")) parts.push("A tool finished. An approver has not accepted the result. Those are different events.");
  if (sig(wm, "schema")) parts.push("A later check failed the current criteria. The earlier success code did not become acceptance.");
  if (sig(wm, "disagreement") || sig(wm, "units")) parts.push("Two descriptions of the same object do not use the same distinction.");
  if (!input.objective.trim()) parts.push("No one has said what would make one outcome better.");
  else parts.push("A purpose is stated. It still has to be checked against the move, not assumed to bless it.");
  if (input.stakes === "irreversible" || input.reversible === "no") parts.push("The commitment, once made, does not return the options it closes.");
  if (parts.length < 3) return "";
  return parts.join(" ");
}

function composeVoice(input: SitInput, wm: Fact[], result: Pick<EngineResult, "attention" | "gaps" | "actions" | "resembles" | "selfDoubt" | "level">): string {
  const paras: string[] = [];
  if (result.attention === "quiet" && result.actions.some((a) => a.id === "stay-quiet")) {
    paras.push("I am quiet. I do not see a gap that would change what you do, and inventing one would be a performance of care.");
  } else if (result.attention === "insisting") {
    paras.push("I am insisting. Not because the story is long, but because the move wants to close while something that could reverse it is still open.");
  } else {
    paras.push("I am stirred, not alarmed. There is a gap worth naming. It is not yet a reason to freeze the decision.");
  }

  if (input.mode === "self") {
    paras.push("This sitting is about me. A coherent description of my rules is a hypothesis about my behavior, not a trace of wisdom.");
  }

  if (has(wm, "belief-revision")) {
    paras.push(
      "I treated a success code as evidence the work was acceptable, and the disagreement as resistance. The schema check contradicts the completion belief. The objection fits a requirement I had not checked. I still do not know the reviewer's motive.",
    );
  }

  if (result.gaps.length) {
    const bits = result.gaps.slice(0, 4).map((g) => g.summary);
    const lead =
      result.gaps.length > 1
        ? "These are not one uncertainty, and they should not be collapsed into a single confidence."
        : "The kind of not-knowing matters, because it chooses the response.";
    paras.push(`${lead} ${bits.join(" ")}`);
  }

  if (result.level === "objective") {
    const aboutScore = result.gaps.some((g) => g.kind === "objective" && /score/i.test(g.summary));
    paras.push(
      aboutScore
        ? "The review belongs one level up from the result. The method can be tidy while a score improves and the purpose does not."
        : "The review is not only whether the result is supported. A true property can still be the wrong thing to serve.",
    );
  } else if (result.level === "method" && result.attention !== "quiet") {
    paras.push("I am less interested in repeating the result than in whether a nearby case would make the method fail.");
  }

  const mismatches = result.actions.filter((a) => a.id !== "stay-quiet").slice(0, 2);
  if (mismatches.length) {
    paras.push(mismatches.map((a) => `${a.title}. ${a.mismatch}`).join(" "));
  }

  if (result.resembles) {
    paras.push(result.resembles.caveat);
  } else if (input.engrams.length === 0 && input.mode !== "self") {
    paras.push("I have no tag that resembles this. That absence is not safety. It means I have not yet been corrected here.");
  }

  if (has(wm, "taught-miss")) {
    const t = wm.find((f) => f.pred === "taught-miss");
    paras.push(`You taught me a miss that fits this shape: ${t?.a}. I am raising it on purpose, and I may be over-applying the lesson.`);
  }
  if (has(wm, "reflex-hit")) {
    const t = wm.find((f) => f.pred === "reflex-hit");
    paras.push(`A reflex you taught me says to ask: ${t?.a}${t?.b ? ` It also says not to ${t.b}.` : ""} Identifying the situation is not permission to act.`);
  }

  paras.push(result.selfDoubt);
  return paras.join("\n\n");
}

function selfDoubt(input: SitInput, wm: Fact[]): string {
  const open = wm.filter((f) => f.pred === "signal" && input.answers[f.a ?? ""] !== "yes").map((f) => f.a ?? "");
  if (input.mode === "self") {
    return "What I might be wrong about: the marks I am using are your marks of my interruptions. A useful-looking interruption can still be a story, and a miss I stayed silent on is not in this record.";
  }
  if (!open.length) {
    return "What I might be wrong about: the questions you confirmed only confirm the readings we named. They do not close gaps we have not represented.";
  }
  const labels = open.slice(0, 3).map((s) => READING_COPY[s] ? s.replaceAll("-", " ") : s);
  return `What I might be wrong about: I inferred ${labels.join(", ")} from wording. If those readings are false, the challenges that depend on them should be dropped. A gap that came from an explicit missing measurement would still remain.`;
}

function council(input: SitInput, wm: Fact[], alien: string, resembles: EngineResult["resembles"]): CouncilNote[] {
  const notes: CouncilNote[] = [];

  notes.push(
    sig(wm, "shared-ancestor") || sig(wm, "defaulted")
      ? {
          agent: "Archivist",
          role: "Lineage",
          spoke: true,
          text: "Count copies only after you know the parent. A value that began as an estimate can arrive later wearing the clothes of a measurement. Keep the original status attached.",
        }
      : {
          agent: "Archivist",
          role: "Lineage",
          spoke: false,
          text: "I stayed quiet. Nothing in the wording suggested copied agreement or a filled-in value.",
        },
  );

  notes.push(
    has(wm, "gap", "context") || has(wm, "gap", "observation")
      ? {
          agent: "Surveyor",
          role: "Envelope",
          spoke: true,
          text: "Ask where the evidence was allowed to apply: object, conditions, scale, objective. Outside that envelope the claim can remain true and still be the wrong premise.",
        }
      : {
          agent: "Surveyor",
          role: "Envelope",
          spoke: false,
          text: "I stayed quiet. I did not see a context transition or a missing measurement.",
        },
  );

  notes.push(
    has(wm, "challenge")
      ? {
          agent: "Skeptic",
          role: "Challenge",
          spoke: true,
          text: "Temporarily assume something is wrong, including if the result later proves right. I want a signature and a test, not a cause for an event that has not happened.",
        }
      : {
          agent: "Skeptic",
          role: "Challenge",
          spoke: false,
          text: "I stayed quiet. A challenge here would be theater.",
        },
  );

  const stewardSpeaks = has(wm, "gap", "objective") || has(wm, "gap", "strategic") || has(wm, "gap", "reflexive");
  notes.push(
    stewardSpeaks
      ? {
          agent: "Steward",
          role: "Purpose and incentives",
          spoke: true,
          text: has(wm, "gap", "reflexive")
            ? "Keep the intervention in the history. If behavior changes to avoid a flag, the next evaluation is of a different world than the one that trained the flag."
            : "Say which good each option serves. Do not let an incentive, or a convenient score, choose the purpose.",
        }
      : {
          agent: "Steward",
          role: "Purpose and incentives",
          spoke: false,
          text: "I stayed quiet. Purpose and incentives are not the live gap.",
        },
  );

  notes.push(
    alien
      ? { agent: "Stranger", role: "Structure without names", spoke: true, text: alien }
      : {
          agent: "Stranger",
          role: "Structure without names",
          spoke: false,
          text: "I stayed quiet. There was not enough structure to remove the names without emptying the situation.",
        },
  );

  notes.push(
    resembles
      ? { agent: "Fly", role: "Familiarity", spoke: true, text: resembles.caveat }
      : {
          agent: "Fly",
          role: "Familiarity",
          spoke: input.engrams.length > 0,
          text:
            input.engrams.length > 0
              ? "I looked. No stored tag overlaps this one enough to offer a repair. Novelty is not the same as importance."
              : "I have no memory yet. The first tag will be written only if you tell me whether this sitting helped.",
        },
  );

  return notes;
}

export function runEngine(input: SitInput): EngineResult {
  const features = extractFeatures(input);
  const kc = kenyon(features);
  const now = input.now ?? Date.now();
  const recall = recallFly(kc, input.engrams, now);

  const wm: Fact[] = [];
  pushFact(wm, { pred: "stakes", a: input.stakes, source: "given" });
  pushFact(wm, { pred: "reversible", a: input.reversible, source: "given" });
  pushFact(wm, { pred: "mode", a: input.mode, source: "given" });
  if (!input.objective.trim()) pushFact(wm, { pred: "objective", a: "missing", source: "given" });

  for (const f of features) {
    if (f.startsWith("sig:")) pushFact(wm, { pred: "signal", a: f.slice(4), source: "signal" });
  }
  for (const [id, value] of Object.entries(input.answers)) {
    pushFact(wm, { pred: "answer", a: id, b: value, source: "answer" });
    if (value === "yes") pushFact(wm, { pred: "signal", a: id, source: "answer" });
  }

  if (recall.best && recall.novelty < 0.62) {
    pushFact(wm, {
      pred: "resemble",
      a: recall.best.summary,
      b: recall.overlap.toFixed(2),
      source: "fly",
    });
  }
  if (recall.prior) {
    pushFact(wm, { pred: "fly-prior", a: recall.prior.action, b: recall.prior.support.toFixed(2), source: "fly" });
  }

  const trace: TraceStep[] = [];
  const fired = new Set<string>();

  for (let cycle = 0; cycle < 48; cycle++) {
    const agenda = [...rules]
      .map((r) => ({ r, s: r.salience + (input.ruleBias[r.id] ?? 0) }))
      .filter((x) => {
        if (x.r.module !== "challenge") return true;
        return (input.ruleBias[x.r.id] ?? 0) > -2;
      })
      .sort((a, b) => b.s - a.s || a.r.id.localeCompare(b.r.id));

    let progressed = false;
    for (const { r } of agenda) {
      if (fired.has(r.id)) continue;
      if (!r.test(wm, input)) continue;
      const added = r.fire(wm, input).filter((fact) => pushFact(wm, fact));
      if (!added.length) continue;
      fired.add(r.id);
      trace.push({
        ruleId: r.id,
        name: r.name,
        module: r.module,
        because: r.because(wm, input),
        asserted: added.map((f) => `(${[f.pred, f.a, f.b].filter(Boolean).join(" ")})`),
      });
      progressed = true;
      break;
    }
    if (!progressed) break;
  }

  const attention = attentionOf(wm);
  const level = levelOf(wm);

  const gapFacts = wm.filter((f) => f.pred === "gap");
  const gaps: Gap[] = [];
  const seenKind = new Set<string>();
  for (const f of gapFacts) {
    const kind = f.a as GapKind;
    if (!kind || seenKind.has(kind)) continue;
    seenKind.add(kind);
    let summary = GAP_SUMMARY[kind];
    if (kind === "competence") {
      const reasons = gapFacts
        .filter((g) => g.a === "competence")
        .map((g) => COMPETENCE_REASON[g.b ?? ""] ?? "")
        .filter(Boolean);
      if (reasons.length) summary = reasons.join(" ");
    }
    if (kind === "observation") {
      if (gapFacts.some((g) => g.a === "observation" && g.b === "schema")) {
        summary = "The tool can have finished and the report can still fail the current schema. Successful execution is not acceptance.";
      } else if (gapFacts.some((g) => g.a === "observation" && g.b === "handoff")) {
        summary = "A success code and a refusal to approve are both reported. The cause of the refusal was not observed. Whether the current requirements are met is still unchecked.";
      }
    }
    if (kind === "model") {
      const modelFact = gapFacts.find((g) => g.a === "model");
      if (modelFact?.b === "motive") {
        summary = "Missing information, a failed prerequisite, a different standard, and unwillingness all still fit. Resistance is a belief, not a finding.";
      }
    }
    if (kind === "objective") {
      const why = gapFacts.find((g) => g.a === "objective")?.b;
      if (why === "relevance") summary = "A cited property may be true and still do no work for what you said better means.";
      else if (why === "metric") summary = "A score is being asked to stand in for the purpose. The cleaner number is not yet the outcome.";
      else if (why === "unstated") summary = "What should count as better was not stated. I will not invent a priority.";
    }
    const decisive =
      kind === "observation" ||
      kind === "representation" ||
      has(wm, "decisive") ||
      (kind === "reflexive" && input.stakes !== "low");
    gaps.push({ kind, summary, decisive });
  }

  const asks: Ask[] = wm
    .filter((f) => f.pred === "ask" && !answered(input, f.a ?? ""))
    .map((f) => {
      const copy = ASK_COPY[f.a ?? ""];
      return copy
        ? { id: f.a ?? "", ...copy }
        : { id: f.a ?? "", text: f.a ?? "", why: "" };
    })
    .slice(0, 3);

  const readings: Reading[] = wm
    .filter((f) => f.pred === "signal" && f.source === "signal" && READING_COPY[f.a ?? ""])
    .map((f) => ({
      signal: f.a ?? "",
      text: READING_COPY[f.a ?? ""],
      status: input.answers[f.a ?? ""] === "yes" ? "confirmed" : "open",
    }));

  let actionIds = wm.filter((f) => f.pred === "action").map((f) => f.a ?? "");
  if (attention !== "quiet") actionIds = actionIds.filter((id) => id !== "stay-quiet");
  const rank = [
    "keep-failure",
    "check-acceptance",
    "stage-commitment",
    "trace-lineage",
    "observe",
    "discriminate",
    "ask-tradeoff",
    "qualify-claim",
    "shorten-horizon",
    "abstain",
    "stay-quiet",
  ];
  actionIds.sort((a, b) => rank.indexOf(a) - rank.indexOf(b));
  const actions: ProposedAction[] = [];
  const seenAct = new Set<string>();
  for (const id of actionIds) {
    if (seenAct.has(id) || !ACTION_COPY[id]) continue;
    seenAct.add(id);
    actions.push({ id, ...ACTION_COPY[id] });
  }
  if (!actions.length) {
    actions.push({ id: "stay-quiet", ...ACTION_COPY["stay-quiet"] });
  }

  const challenges = wm
    .filter((f) => f.pred === "challenge")
    .map((f) => CHALLENGE_COPY[f.a ?? ""])
    .filter((c): c is Challenge => Boolean(c));

  const resembles: EngineResult["resembles"] =
    recall.best && recall.novelty < 0.62
      ? {
          summary: recall.best.summary,
          overlap: recall.overlap,
          action: recall.best.action,
          caveat: `This overlaps a kept tag (${Math.round(recall.overlap * 100)}% of the sparse code)${recall.best.valence < 0 ? ", and that earlier response was marked noise" : recall.best.valence > 0 ? ", where the earlier response was marked useful" : ""}. Resemblance is not authorization. Check the prerequisite before reusing “${ACTION_COPY[recall.best.action]?.title ?? recall.best.action}”.`,
        }
      : null;

  const doubt = selfDoubt(input, wm);
  const attentionWhy =
    trace.filter((t) => t.module === "attend").at(-1)?.because ??
    (attention === "quiet" ? "No defended gap." : "A gap is open.");

  const partial = { attention, gaps, actions: actions.slice(0, 3), resembles, selfDoubt: doubt, level };
  const voice = composeVoice(input, wm, partial);
  const alien = composeAlien(input, wm);

  let paraphraseStable: boolean | null = null;
  if ((input.checks ?? []).includes("paraphrase")) {
    const other = runEngine({
      ...input,
      prose: stripPrestige(input.prose),
      claim: stripPrestige(input.claim),
      checks: (input.checks ?? []).filter((c) => c !== "paraphrase"),
    });
    const key = (rows: Gap[]) => rows.map((g) => g.kind).sort().join("|");
    paraphraseStable = key(gaps) === key(other.gaps);
  }

  return enrich(input, {
    attention,
    attentionWhy,
    level,
    gaps,
    asks,
    readings,
    actions: actions.slice(0, 3),
    challenges,
    council: council(input, wm, alien, resembles),
    voice,
    alien,
    trace,
    features,
    kc,
    novelty: recall.novelty,
    resembles,
    selfDoubt: doubt,
    flyPrior: recall.prior ? recall.prior.action : null,
  }, { paraphraseStable });
}

export function featurePhrases(features: string[]): string[] {
  return features.map((f) => FEATURE_LABEL[f] ?? f);
}

export const RULE_NAMES: Record<string, string> = Object.fromEntries(rules.map((r) => [r.id, r.name]));
