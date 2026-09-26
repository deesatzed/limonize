import type {
  EngineResult,
  EvidenceItem,
  FlyOp,
  FourRecords,
  HiveSeat,
  JevJudgment,
  PerturbationView,
  RouterChoice,
  RoleId,
  SeatId,
  SitInput,
  WorkItem,
  OrgProposal,
} from "./types";

const OP_WHY: Record<FlyOp, string> = {
  continue: "Nothing decisive is open. Continuing is the operation, not a new investigation.",
  check_source: "The next useful operation is to inspect a source or a prerequisite, not to argue.",
  test_alternative: "Two accounts are live. Find the observation that would make one of them fail.",
  ask: "A preference or a missing fact has to come from outside the packet.",
  reframe: "The categories may be the problem. Rename the distinction before reusing the old one.",
  rehearse: "Compare a reversible step with waiting before a commitment that is hard to undo.",
  escalate: "The limit is competence or coverage. Another method, not a louder version of this one.",
  stop: "Further reflection is not the missing ingredient.",
};

function has(features: string[], id: string): boolean {
  return features.includes(id);
}

function priorOp(result: EngineResult, input: SitInput): FlyOp {
  if (has(result.features, "sig:schema")) return "check_source";
  if (result.attention === "quiet") return "stop";
  if (result.gaps.some((g) => g.kind === "competence") && input.mode === "self") return "escalate";
  if (result.gaps.some((g) => g.kind === "observation" || g.kind === "evidence")) return "check_source";
  if (result.gaps.some((g) => g.kind === "model" || g.kind === "strategic")) return "test_alternative";
  if (result.gaps.some((g) => g.kind === "objective")) return "ask";
  if (result.gaps.some((g) => g.kind === "representation")) return "reframe";
  if (input.stakes !== "low" && input.reversible !== "yes") return "rehearse";
  if (result.asks.length) return "ask";
  return "continue";
}

export function chooseRouter(result: Pick<EngineResult, "features" | "attention" | "gaps" | "asks">, input: SitInput): RouterChoice {
  const base = priorOp(result as EngineResult, input);
  const pendingCheck = has(result.features, "sig:schema") || result.gaps.some((g) => g.decisive && (g.kind === "observation" || g.kind === "evidence"));
  const op = pendingCheck && !["check_source", "ask", "escalate"].includes(base) ? "check_source" : base;
  const why = `${OP_WHY[op]} Stored operation marks are advisory; they do not change the selected operation while action alignment is unverified.`;
  return { op, why, fromLearning: false, roles: rolesFor(op) };
}

function rolesFor(op: FlyOp): RoleId[] {
  if (op === "check_source") return ["perception", "boundary"];
  if (op === "test_alternative") return ["world", "boundary"];
  if (op === "ask") return ["perspective"];
  if (op === "reframe") return ["world"];
  if (op === "rehearse") return ["world", "perspective"];
  if (op === "escalate") return ["boundary"];
  return [];
}

function item(status: EvidenceItem["status"], text: string): EvidenceItem {
  return { id: "", status, text, origin: status === "reported" ? "user" : status === "simulated" ? "demo" : status === "verified_check" ? "checker" : "rule", at: 0, caseId: "", runId: "" };
}

export function buildRecords(input: SitInput, result: EngineResult): FourRecords {
  const demoSchema = input.episode === "reviewer" && (input.revealed ?? []).includes("schema-fail");
  const failure = (input.receipts ?? []).find((r) => r.outcome === "fail");
  const checked = !!failure || demoSchema;
  const environment: EvidenceItem[] = [
    item("inferred", "The situation below was reported by the user. It was not independently witnessed."),
  ];
  if (input.prose.trim()) environment.push(item("reported", input.prose.trim()));
  if (has(result.features, "sig:handoff")) {
    environment.push(item("inferred", "The wording suggests a process finished. Execution alone is not acceptance."));
    environment.push(
      checked
        ? demoSchema
          ? item("simulated", "In this example, a simulated check reveals an outdated report schema. No user artifact was checked.")
          : { ...item("verified_check", `The recorded ${failure?.criterion} document-shape check failed. ${failure?.detail}`), receiptId: failure?.id }
        : item("unresolved", "Whether the output meets the current acceptance criteria has not been checked. The hidden defect, if any, is not in this record yet."),
    );
  }
  if (failure && !has(result.features, "sig:handoff")) {
    environment.push({ ...item("verified_check", `The recorded ${failure.criterion} document-shape check failed. ${failure.detail}`), receiptId: failure.id });
  }
  for (const receipt of input.receipts ?? []) {
    if (receipt === failure) continue;
    environment.push({ ...item(receipt.outcome === "error" ? "unresolved" : "verified_check", `Document-shape check ${receipt.outcome}: ${receipt.detail}`), receiptId: receipt.id });
  }

  const perception: EvidenceItem[] = [
    item("simulated", "Local role procedures use the same provided packet. Disconnected model names did not inspect private context."),
  ];
  if (!checked && input.episode === "reviewer") {
    perception.push(item("unresolved", "The current schema was not in the packet. A seat that reasons only from the packet cannot already know it."));
  }
  for (const reading of result.readings) {
    perception.push({ ...item(reading.status === "confirmed" ? "reported" : "inferred", reading.text), source: reading.source });
  }
  if (!result.readings.length) {
    perception.push(item("unresolved", "No wording-based reading was asserted."));
  }

  const belief: EvidenceItem[] = result.gaps.map((g) => item("inferred", `${g.kind}: ${g.summary}`));
  if (has(result.features, "sig:handoff") && !checked) {
    belief.push(
      item(
        "inferred",
        "One available belief is that the reviewer is resisting. That belief is not an observation. Missing information, a failed prerequisite, a different standard, and unwillingness are all still open.",
      ),
    );
  }
  if (checked) {
    belief.push(
      item(
        "inferred",
        "The completion belief is contradicted. The reviewer's objection is consistent with a requirement that was not in the packet. Motive remains unresolved.",
      ),
    );
  }
  if (!belief.length) belief.push(item("unresolved", "No belief was promoted from the packet."));

  const self: EvidenceItem[] = [item("inferred", result.selfDoubt)];
  if (input.episode === "reviewer") {
    self.push(
      item(
        "inferred",
        "A known miss of this instrument is to treat disagreement as obstruction after treating execution as success. That concern is a self-model entry, not a fact about the reviewer.",
      ),
    );
  }
  const at = input.now ?? Date.now();
  const stamp = (category: keyof FourRecords, rows: EvidenceItem[]) => rows.map((row, index) => ({
    ...row,
    id: `${input.runId ?? "unbound"}:${category}:${index}`,
    at,
    caseId: input.caseId ?? "unbound",
    runId: input.runId ?? "unbound",
    ...(category === "environment" && index === 1 && row.status === "reported"
      ? { source: { field: "prose" as const, start: 0, end: input.prose.length } }
      : {}),
    ...(row.status === "verified_check" && failure && row.text.includes(failure.criterion)
      ? { receiptId: failure.id }
      : {}),
  }));
  return {
    environment: stamp("environment", environment),
    perception: stamp("perception", perception),
    belief: stamp("belief", belief),
    self: stamp("self", self),
  };
}

export function buildJev(input: SitInput, result: EngineResult): JevJudgment[] {
  const kinds = result.gaps.map((g) => g.kind);
  const options = ["observation", "evidence", "context", "objective", "strategic", "representation", "none"];
  const hits = options.filter((o) => o === "none" || kinds.includes(o as (typeof kinds)[number]));
  const top = hits.find((h) => h !== "none") ?? "none";

  const executionIsAcceptance = (input.revealed ?? []).includes("schema-fail") ? "contradicted in simulation" : has(result.features, "sig:handoff") ? "unverified" : "not assessed";
  const stakesScore = input.stakes === "low" ? 1 : input.stakes === "consequential" ? 2 : 3;

  return [
    {
      id: "kind",
      primitive: "choice",
      question: "Which uncertainty kind is live? none is allowed.",
      answer: top,
      detail: `Local, uncalibrated, not TypeSafe Jev and not Gemini. Candidate categories: ${options.filter((o) => hits.includes(o)).join(", ")}. This does not prove that every omission was found.`,
    },
    {
      id: "execution",
      primitive: "noul",
      question: "The reported success establishes that the acceptance criteria were met.",
      answer: executionIsAcceptance,
      detail: "Qualitative local judgment. No calibrated probability or TypeSafe Noul is available.",
    },
    {
      id: "stakes",
      primitive: "score",
      question: "How costly is acting on the current inference before the open gap is checked?",
      answer: `${stakesScore} of 3`,
      detail: "Ordered rubric: 1 little, 2 real, 3 hard to undo. Taken from the stated stakes, not from a model score.",
    },
  ];
}

interface SubSpec {
  id: string;
  label: string;
  prior: number;
  text: string;
}

function pickSub(specs: SubSpec[], bias: Record<string, number>): SubSpec & { weight: number } {
  let best = specs[0];
  let weight = -Infinity;
  for (const spec of specs) {
    const w = spec.prior + (bias[spec.id] ?? 0);
    if (w > weight) {
      weight = w;
      best = spec;
    }
  }
  return { ...best, weight };
}

const MODELS: { id: SeatId; name: string; live: boolean }[] = [
  { id: "gemini", name: "Gemini 3.8 Flash", live: false },
  { id: "astra", name: "GPT-6 Astra", live: false },
  { id: "fable", name: "Claude Fable 5.1", live: false },
  { id: "grok", name: "Grok role (local procedure)", live: false },
];

const STARTING: Record<RoleId, SeatId> = {
  perception: "gemini",
  world: "astra",
  perspective: "fable",
  boundary: "grok",
};

const ROLE_NAME: Record<RoleId, string> = {
  perception: "Perception and evidence",
  world: "World model and decisions",
  perspective: "Perspective and objectives",
  boundary: "Countermodel and boundary test",
};

function occupy(role: RoleId, bias: Record<string, number>): { id: SeatId; name: string; live: boolean; starting: boolean; weight: number } {
  let best = MODELS[0];
  let weight = -Infinity;
  for (const model of MODELS) {
    const prior = STARTING[role] === model.id ? 2 : 0;
    const w = prior + (bias[`occupy:${role}:${model.id}`] ?? 0);
    if (w > weight) {
      weight = w;
      best = model;
    }
  }
  return { ...best, starting: best.id === STARTING[role], weight };
}

function configKey(model: SeatId, role: RoleId, skill: string): string {
  return `${model}|${role}|${skill}`;
}

export function buildHive(input: SitInput, result: EngineResult, roles: RoleId[]): HiveSeat[] {
  const bias = input.subBias ?? {};
  const schema = (input.revealed ?? []).includes("schema-fail");
  const handoff = has(result.features, "sig:handoff") || input.episode === "reviewer";
  const active = new Set(roles);

  const skills: Record<RoleId, SubSpec[]> = {
    perception: [
      { id: "lineage", label: "Source lineage", prior: has(result.features, "sig:shared-ancestor") ? 4 : 1, text: "Three carriers of one specification are one observation, not three. Provenance stays attached." },
      { id: "missing", label: "Missing observation", prior: handoff || result.gaps.some((g) => g.kind === "observation") ? 4 : 1, text: "Name what was reported and what was not observed. A success code is not an acceptance." },
      { id: "context", label: "Context change", prior: has(result.features, "sig:context-shift") ? 4 : 0, text: "The evidence may be leaving the envelope it was gathered in. That is a change of context, not yet a falsehood." },
      { id: "extract", label: "Event extraction", prior: 1, text: "Separate the events in the packet. Do not collapse them into one completed workflow." },
    ],
    world: [
      { id: "two-claims", label: "Separate the propositions", prior: handoff || schema ? 4 : 1, text: "Two propositions are live: a process finished, and the result meets the current criterion. They are not the same claim." },
      { id: "experiments", label: "Discriminating experiment", prior: result.gaps.some((g) => g.kind === "model") ? 3 : 0, text: "The next model step is an observation that would make one account fail. Not a blend of both." },
      { id: "actions", label: "Action alternatives", prior: 1, text: "The inclined move is one action. A check, a wait, and a revision are different actions." },
      { id: "dependencies", label: "Dependency analysis", prior: 1, text: "Name the assumption the decision actually hangs on. Drop the rest." },
    ],
    perspective: [
      { id: "access", label: "Different information", prior: handoff ? 4 : 1, text: "Hypothesis only: the other party may be using a requirement this packet does not contain. That is not a motive." },
      { id: "objective", label: "Conflicting objectives", prior: result.gaps.some((g) => g.kind === "objective") ? 4 : 0, text: "Both sides can want completion and still mean different things by it." },
      { id: "continuity", label: "Commitment continuity", prior: input.stakes !== "low" && input.reversible !== "yes" ? 3 : 0, text: "A commitment closes options. Say which ones, without deciding the priority." },
      { id: "interpretation", label: "Interpretation alternative", prior: 1, text: "Another reading of the same words is available. It is a hypothesis, not a personality." },
    ],
    boundary: [
      { id: "completion", label: "Completion is not the signal", prior: handoff || schema ? 5 : 0, text: schema ? "The test was the current-criteria check. It failed. This seat does not score its own challenge." : "One challenge: execution is being used as acceptance. Predicted signature: an unmet current criterion. I do not grade that test." },
      { id: "lineage", label: "Shared ancestor", prior: has(result.features, "sig:shared-ancestor") ? 4 : 0, text: "One challenge: agreement may be one ancestor copied. Predicted signature: a shared parent. I do not decide that the challenge succeeded." },
      { id: "omission", label: "Omitted alternative", prior: 1, text: "One omitted branch that could change the move. If none is consequential, return no challenge." },
      { id: "assumption", label: "Remove one assumption", prior: 1, text: "Remove the assumption the conclusion needs most. Say what the conclusion becomes without it." },
    ],
  };

  const workFor = (role: RoleId): WorkItem => {
    if (role === "perception") {
      return {
        question: "What was observed, what changed, and what is still unavailable?",
        responsibility: "A provenance-linked account. Not a decision.",
        outOfScope: "Motives, and redesigning the workflow.",
        required: "Observed events, their lineage, and the observation still missing.",
        stopWhen: "The missing observation is named, or it is already in the record.",
      };
    }
    if (role === "world") {
      return {
        question: "Which propositions, actions, and consequences are being collapsed?",
        responsibility: "A conditional model. Not a verdict.",
        outOfScope: "A second retelling of the packet.",
        required: "The link from evidence and assumptions to actions.",
        stopWhen: "The collapsed distinction is named, or no distinction would change the move.",
      };
    }
    if (role === "perspective") {
      return {
        question: "What could another party know or value that this packet does not?",
        responsibility: "An alternative perspective. Not a claim to know a motive.",
        outOfScope: "Diagnosing the reviewer, or scoring them.",
        required: "Information-access or objective differences that are still open.",
        stopWhen: "The difference is stated as a hypothesis, or nothing in the packet supports one.",
      };
    }
    return {
      question: "Does the evidence support treating this as completed?",
      responsibility: "One challenge, a predicted signature, and a test. Do not score it.",
      outOfScope: "Contrarian commentary, and interpreting personality.",
      required: "The unsupported dependency most likely to change the decision.",
      stopWhen: "The criterion has been checked, or the needed observation is unavailable.",
    };
  };

  return (Object.keys(STARTING) as RoleId[]).map((role) => {
    const holder = occupy(role, bias);
    const picked = pickSub(
      skills[role].map((skill) => ({
        ...skill,
        id: configKey(holder.id, role, skill.id),
        prior: skill.prior + (bias[configKey(holder.id, role, skill.id)] ?? 0),
      })),
      {},
    );
    const on = active.has(role);
    const local = holder.live ? "" : ` Local procedure. Not a completion from ${holder.name}.`;
    return {
      id: holder.id,
      model: holder.name,
      live: holder.live,
      active: on,
      roleId: role,
      role: ROLE_NAME[role],
      subRoleId: picked.id,
      subRole: picked.label,
      text: on ? `${picked.text}${local}` : "Not activated. The operation did not ask for this role.",
      weight: picked.weight,
      starting: holder.starting,
      work: workFor(role),
    };
  });
}

export function buildProposals(input: SitInput): OrgProposal[] {
  if (!(input.revealed ?? []).includes("schema-fail")) return [];
  return [
    {
      id: "completion-semantics",
      name: "Completion-semantics checker",
      why: "Candidate only. A success signal was not the acceptance criterion. This is not yet a role: a held-out case has not shown that the narrower check helps, and a deterministic validator has not replaced the model call.",
    },
  ];
}

export function buildPerturbations(
  input: SitInput,
  result: EngineResult,
  paraphraseStable: boolean | null = null,
): PerturbationView {
  const checks = new Set(input.checks ?? []);
  const revealed = new Set(input.revealed ?? []);
  const irrelevantRan = checks.has("paraphrase");
  const decisiveRan = input.episode === "reviewer" && revealed.has("schema-fail");
  const separable = irrelevantRan && !decisiveRan;
  return {
    irrelevant: {
      ran: irrelevantRan,
      held: !separable ? null : paraphraseStable,
      note: !irrelevantRan
        ? "Not run. An irrelevant change should leave the decision standing if meaning was preserved."
        : decisiveRan
          ? "Both checks have been run. Their effects are not separable on this sitting."
          : paraphraseStable
            ? "Prestige wording was stripped and the kinds of not-knowing stayed the same. That is what an irrelevant change should do. It does not prove every rephrasing is harmless."
            : "Stripping prestige wording changed the kinds of not-knowing. This change was not irrelevant.",
    },
    decisive: {
      ran: decisiveRan,
      held: decisiveRan ? result.features.includes("sig:schema") : null,
      note: decisiveRan
        ? "In this example, a simulated schema failure was revealed. It shows how execution and acceptance can diverge; no user artifact was checked."
        : input.episode === "reviewer"
          ? "Not revealed. This demonstration contains a simulated result outside the original packet."
          : "This case has no simulated hidden schema result to reveal.",
    },
  };
}

export function enrich(
  input: SitInput,
  result: Omit<EngineResult, "records" | "router" | "jev" | "hive" | "proposals" | "perturbations">,
  extras?: { paraphraseStable: boolean | null },
): EngineResult {
  const full = result as EngineResult;
  const baselineRouter = chooseRouter(full, input);
  const router = input.selection
    ? {
      ...baselineRouter,
      op: input.selection.operation,
      roles: input.selection.roles,
      fromLearning: input.selection.contributed,
      why: input.selection.reason,
    }
    : baselineRouter;
  const records = buildRecords(input, full);
  const supportIds = records.environment.filter((row) => row.status === "reported" || row.status === "verified_check" || row.status === "simulated").map((row) => row.id);
  const unresolvedIds = Object.values(records).flat().filter((row) => row.status === "unresolved").map((row) => row.id);
  return {
    ...result,
    asks: result.asks.map((ask) => ({ ...ask, supportIds, unresolvedIds })),
    actions: result.actions.map((action) => ({ ...action, supportIds, unresolvedIds })),
    router,
    ...(input.selection ? { selection: structuredClone(input.selection) } : {}),
    records,
    jev: buildJev(input, full),
    hive: buildHive(input, full, router.roles),
    proposals: buildProposals(input),
    perturbations: buildPerturbations(input, full, extras?.paraphraseStable ?? null),
  };
}
