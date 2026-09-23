import { i as __toESM } from "../_runtime.mjs";
import { R as require_react, v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { a as Eye, i as Library, n as ScanSearch, r as PenLine } from "../_libs/lucide-react.mjs";
import { n as create, t as persist } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DcBtCBbl.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Fixed feature order. The projection below is a pure function of this list. */
var FEATURES = [
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
	"mode:self"
];
var FEATURE_LABEL = {
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
	"mode:self": "the instrument examining itself"
};
var KC_COUNT = 192;
var CLAWS = 6;
var WINNERS = 12;
function mulberry32(seed) {
	let a = seed >>> 0;
	return () => {
		a |= 0;
		a = a + 1831565813 | 0;
		let t = Math.imul(a ^ a >>> 15, 1 | a);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
/** Stable random claws: each Kenyon cell samples CLAWS feature indices. */
function claws() {
	const rand = mulberry32(4513);
	const table = [];
	for (let k = 0; k < KC_COUNT; k++) {
		const chosen = /* @__PURE__ */ new Set();
		while (chosen.size < CLAWS) chosen.add(Math.floor(rand() * FEATURES.length));
		table.push([...chosen]);
	}
	return table;
}
var CLAW_TABLE = claws();
function extractFeatures(input) {
	const text = `${input.prose}\n${input.claim}\n${input.objective}\n${input.choice}`.toLowerCase();
	const dismissed = new Set(input.dismissed);
	const on = /* @__PURE__ */ new Set();
	const allow = (id, hit) => {
		const sig = id.startsWith("sig:") ? id.slice(4) : "";
		if (sig && dismissed.has(sig)) return;
		if (hit) on.add(id);
	};
	allow("sig:shared-ancestor", /several|same table|one table|copied|repeat|single ancestor|all (come|came) from|documents agree/.test(text));
	allow("sig:incentive", /supplier|vendor|sales|quote|quoted|commission|benefits if|who gains|incentive/.test(text));
	allow("sig:unmeasured", /not fully described|not (fully |well )?(described|known|measured|specified)|unmeasured|was never measured|we do not know|we don't know|missing measurement|unknown environment|isn't known|is not known/.test(text));
	allow("sig:context-shift", /environment|operating|outdoor|in the field|real world|laboratory|transfer|different setting|roll it out|more widely|population/.test(text));
	allow("sig:disagreement", /disagree|different convention|inconsistent|on the other hand|conflict|does not match|doesn't match/.test(text));
	allow("sig:closure", /inclined|seems (better|preferable)|appears preferable|obviously|definitely|certainly|no doubt|just order|call (it|the) improved/.test(text));
	allow("sig:pressure", /today|immediately|as soon as|downtime|deadline|cannot wait|can't wait|commit now|right away/.test(text));
	allow("sig:relevance", /lighter|lightest|weighs less|cheaper|faster/.test(text) && !/weight|mass|lightness/.test(input.objective.toLowerCase()));
	allow("sig:metric-drift", /(score|metric|dashboard|kpi|alert).{0,80}(improv|cleaner|better|fewer)/.test(text) || /(improv|cleaner|better).{0,60}(score|dashboard|metric)/.test(text));
	allow("sig:rare", /rare|unusual|never seen|first time|black swan|unfamiliar|not anticipated/.test(text));
	allow("sig:defaulted", /default|assumed value|typical value|filled in|placeholder/.test(text));
	allow("sig:units", /unit|dimension|convention|millimet|millimeter|\bmm\b|inches/.test(text));
	allow("sig:reflexive", /false alarm|prevention|phrases avoid|learned which|changed (the |their )?behavior|behaviour|people adapt|gaming the/.test(text));
	allow("sig:hedged", /i think|i feel|not sure|unsure|probably|might|perhaps|i may/.test(text));
	allow("sig:handoff", /cannot approve|success code|tool returned|tool finished/.test(text));
	allow("sig:schema", (input.revealed ?? []).includes("schema-fail"));
	on.add(`stakes:${input.stakes}`);
	on.add(`rev:${input.reversible}`);
	on.add(input.objective.trim() ? "obj:present" : "obj:missing");
	if (input.choice.trim()) on.add("choice:present");
	if (input.mode === "self") on.add("mode:self");
	return FEATURES.filter((f) => on.has(f));
}
/** Sparse expansion then winner-take-all, in the style of Kenyon cells. */
function kenyon(features) {
	const present = new Set(features);
	const scored = CLAW_TABLE.map((claw, index) => {
		let n = 0;
		for (const i of claw) if (present.has(FEATURES[i])) n += 1;
		return {
			index,
			n
		};
	});
	const active = scored.filter((s) => s.n >= 2).sort((a, b) => b.n - a.n || a.index - b.index);
	return (active.length ? active : scored.sort((a, b) => b.n - a.n)).slice(0, WINNERS).map((t) => t.index).sort((a, b) => a - b);
}
function overlapRatio(a, b) {
	if (!a.length || !b.length) return 0;
	const bs = new Set(b);
	let n = 0;
	for (const x of a) if (bs.has(x)) n += 1;
	return n / Math.max(a.length, b.length);
}
function recallFly(kc, engrams, now) {
	if (!engrams.length) return {
		novelty: 1,
		best: null,
		overlap: 0,
		prior: null
	};
	let best = null;
	let bestScore = 0;
	let bestOverlap = 0;
	const tally = /* @__PURE__ */ new Map();
	for (const e of engrams) {
		const raw = overlapRatio(kc, e.kc);
		const ageDays = Math.max(0, (now - e.at) / 864e5);
		const decayed = raw * Math.exp(-ageDays / 40);
		if (decayed > bestScore) {
			bestScore = decayed;
			bestOverlap = raw;
			best = e;
		}
		if (raw > .2 && e.valence !== 0) tally.set(e.action, (tally.get(e.action) ?? 0) + e.valence * raw);
	}
	let prior = null;
	for (const [action, support] of tally) if (!prior || support > prior.support) prior = {
		action,
		support
	};
	if (prior && prior.support < .35) prior = null;
	return {
		novelty: Math.max(0, Math.min(1, 1 - bestScore)),
		best,
		overlap: bestOverlap,
		prior
	};
}
/** Drop prestige and pressure-to-close wording. Structural facts stay. */
function stripPrestige(text) {
	return text.replace(/\b(inclined|inclination|unnecessary|persuasive|prestige|impressive|obviously|certainly|definitely)\b/gi, "").replace(/\s{2,}/g, " ").replace(/\s+([,.])/g, "$1").trim();
}
var OPS = [
	"continue",
	"check_source",
	"test_alternative",
	"ask",
	"reframe",
	"rehearse",
	"escalate",
	"stop"
];
var OP_WHY = {
	continue: "Nothing decisive is open. Continuing is the operation, not a new investigation.",
	check_source: "The next useful operation is to inspect a source or a prerequisite, not to argue.",
	test_alternative: "Two accounts are live. Find the observation that would make one of them fail.",
	ask: "A preference or a missing fact has to come from outside the packet.",
	reframe: "The categories may be the problem. Rename the distinction before reusing the old one.",
	rehearse: "Compare a reversible step with waiting before a commitment that is hard to undo.",
	escalate: "The limit is competence or coverage. Another method, not a louder version of this one.",
	stop: "Further reflection is not the missing ingredient."
};
function has$1(features, id) {
	return features.includes(id);
}
function priorOp(result, input) {
	if (has$1(result.features, "sig:schema")) return "check_source";
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
function chooseRouter(result, input) {
	const base = priorOp(result, input);
	const bias = input.opBias ?? {};
	let best = base;
	let bestScore = (bias[base] ?? 0) + 1.25;
	let learned = false;
	for (const op of OPS) {
		const score = (bias[op] ?? 0) + (op === base ? 1.25 : 0);
		if (score > bestScore + .01) {
			best = op;
			bestScore = score;
			learned = true;
		}
	}
	const why = learned ? `Marks from earlier sittings shifted the operation from ${base.replaceAll("_", " ")} to ${best.replaceAll("_", " ")}. ${OP_WHY[best]} This is not a counterfactual about the branch that was not taken.` : OP_WHY[best];
	return {
		op: best,
		why,
		fromLearning: learned,
		roles: rolesFor(best)
	};
}
function rolesFor(op) {
	if (op === "check_source") return ["perception", "boundary"];
	if (op === "test_alternative") return ["world", "boundary"];
	if (op === "ask") return ["perspective"];
	if (op === "reframe") return ["world"];
	if (op === "rehearse") return ["world", "perspective"];
	if (op === "escalate") return ["boundary"];
	return [];
}
function item(status, text) {
	return {
		status,
		text
	};
}
function buildRecords(input, result) {
	const revealed = new Set(input.revealed ?? []);
	const environment = [item("observed", "What follows was reported in the packet. It was not independently witnessed.")];
	if (input.prose.trim()) environment.push(item("observed", input.prose.trim()));
	if (has$1(result.features, "sig:handoff")) {
		environment.push(item("observed", "A success code was reported. A success code is not an acceptance."));
		environment.push(revealed.has("schema-fail") ? item("observed", "A check against the current schema failed. The report used an outdated schema. That check is now part of the environment record.") : item("unresolved", "Whether the output meets the current acceptance criteria has not been checked. The hidden defect, if any, is not in this record yet."));
	}
	if (revealed.has("schema-fail") && !has$1(result.features, "sig:handoff")) environment.push(item("observed", "A schema check was run and failed."));
	const perception = [item("observed", "Every seat received the same packet: the prose, the claim, the objective, the inclined move, and the stakes. No seat received another seat's private context.")];
	if (!revealed.has("schema-fail") && input.episode === "reviewer") perception.push(item("unresolved", "The current schema was not in the packet. A seat that reasons only from the packet cannot already know it."));
	for (const reading of result.readings) perception.push(item(reading.status === "confirmed" ? "observed" : "inferred", reading.text));
	if (!result.readings.length) perception.push(item("unresolved", "No wording-based reading was asserted."));
	const belief = result.gaps.map((g) => item("inferred", `${g.kind}: ${g.summary}`));
	if (has$1(result.features, "sig:handoff") && !revealed.has("schema-fail")) belief.push(item("inferred", "One available belief is that the reviewer is resisting. That belief is not an observation. Missing information, a failed prerequisite, a different standard, and unwillingness are all still open."));
	if (revealed.has("schema-fail")) belief.push(item("inferred", "The completion belief is contradicted. The reviewer's objection is consistent with a requirement that was not in the packet. Motive remains unresolved."));
	if (!belief.length) belief.push(item("unresolved", "No belief was promoted from the packet."));
	const self = [item("inferred", result.selfDoubt)];
	if (input.episode === "reviewer") self.push(item("inferred", "A known miss of this instrument is to treat disagreement as obstruction after treating execution as success. That concern is a self-model entry, not a fact about the reviewer."));
	return {
		environment,
		perception,
		belief,
		self
	};
}
function round(n) {
	return n.toFixed(2);
}
function buildJev(input, result) {
	const kinds = result.gaps.map((g) => g.kind);
	const options = [
		"observation",
		"evidence",
		"context",
		"objective",
		"strategic",
		"representation",
		"none"
	];
	const hits = options.filter((o) => o === "none" || kinds.includes(o));
	const share = hits.length ? 1 / hits.length : 1;
	const probs = options.map((o) => `${o} ${hits.includes(o) ? round(share) : "0.00"}`).join(", ");
	const top = hits.find((h) => h !== "none") ?? "none";
	const executionIsAcceptance = (input.revealed ?? []).includes("schema-fail") ? .06 : has$1(result.features, "sig:handoff") ? .22 : .5;
	const stakesScore = input.stakes === "low" ? 1 : input.stakes === "consequential" ? 2 : 3;
	return [
		{
			id: "kind",
			primitive: "choice",
			question: "Which uncertainty kind is live? none is allowed.",
			answer: top,
			detail: `Local, uncalibrated, not TypeSafe Jev and not Gemini. Probabilities over the closed set: ${probs}. A high peak would not prove that every omission was found.`
		},
		{
			id: "execution",
			primitive: "noul",
			question: "The reported success establishes that the acceptance criteria were met.",
			answer: round(executionIsAcceptance),
			detail: "Noul here is an uncalibrated P(yes), not a boolean. Thresholding it is the caller's job. It is not a TypeSafe Noul."
		},
		{
			id: "stakes",
			primitive: "score",
			question: "How costly is acting on the current inference before the open gap is checked?",
			answer: `${stakesScore} of 3`,
			detail: "Ordered rubric: 1 little, 2 real, 3 hard to undo. Taken from the stated stakes, not from a model score."
		}
	];
}
function pickSub(specs, bias) {
	let best = specs[0];
	let weight = -Infinity;
	for (const spec of specs) {
		const w = spec.prior + (bias[spec.id] ?? 0);
		if (w > weight) {
			weight = w;
			best = spec;
		}
	}
	return {
		...best,
		weight
	};
}
var MODELS = [
	{
		id: "gemini",
		name: "Gemini 3.8 Flash",
		live: false
	},
	{
		id: "astra",
		name: "GPT-6 Astra",
		live: false
	},
	{
		id: "fable",
		name: "Claude Fable 5.1",
		live: false
	},
	{
		id: "grok",
		name: "Grok 4.7",
		live: true
	}
];
var STARTING = {
	perception: "gemini",
	world: "astra",
	perspective: "fable",
	boundary: "grok"
};
var ROLE_NAME = {
	perception: "Perception and evidence",
	world: "World model and decisions",
	perspective: "Perspective and objectives",
	boundary: "Countermodel and boundary test"
};
function occupy(role, bias) {
	let best = MODELS[0];
	let weight = -Infinity;
	for (const model of MODELS) {
		const w = (STARTING[role] === model.id ? 2 : 0) + (bias[`occupy:${role}:${model.id}`] ?? 0);
		if (w > weight) {
			weight = w;
			best = model;
		}
	}
	return {
		...best,
		starting: best.id === STARTING[role],
		weight
	};
}
function configKey(model, role, skill) {
	return `${model}|${role}|${skill}`;
}
function buildHive(input, result, roles) {
	const bias = input.subBias ?? {};
	const schema = (input.revealed ?? []).includes("schema-fail");
	const handoff = has$1(result.features, "sig:handoff") || input.episode === "reviewer";
	const active = new Set(roles);
	const skills = {
		perception: [
			{
				id: "lineage",
				label: "Source lineage",
				prior: has$1(result.features, "sig:shared-ancestor") ? 4 : 1,
				text: "Three carriers of one specification are one observation, not three. Provenance stays attached."
			},
			{
				id: "missing",
				label: "Missing observation",
				prior: handoff || result.gaps.some((g) => g.kind === "observation") ? 4 : 1,
				text: "Name what was reported and what was not observed. A success code is not an acceptance."
			},
			{
				id: "context",
				label: "Context change",
				prior: has$1(result.features, "sig:context-shift") ? 4 : 0,
				text: "The evidence may be leaving the envelope it was gathered in. That is a change of context, not yet a falsehood."
			},
			{
				id: "extract",
				label: "Event extraction",
				prior: 1,
				text: "Separate the events in the packet. Do not collapse them into one completed workflow."
			}
		],
		world: [
			{
				id: "two-claims",
				label: "Separate the propositions",
				prior: handoff || schema ? 4 : 1,
				text: "Two propositions are live: a process finished, and the result meets the current criterion. They are not the same claim."
			},
			{
				id: "experiments",
				label: "Discriminating experiment",
				prior: result.gaps.some((g) => g.kind === "model") ? 3 : 0,
				text: "The next model step is an observation that would make one account fail. Not a blend of both."
			},
			{
				id: "actions",
				label: "Action alternatives",
				prior: 1,
				text: "The inclined move is one action. A check, a wait, and a revision are different actions."
			},
			{
				id: "dependencies",
				label: "Dependency analysis",
				prior: 1,
				text: "Name the assumption the decision actually hangs on. Drop the rest."
			}
		],
		perspective: [
			{
				id: "access",
				label: "Different information",
				prior: handoff ? 4 : 1,
				text: "Hypothesis only: the other party may be using a requirement this packet does not contain. That is not a motive."
			},
			{
				id: "objective",
				label: "Conflicting objectives",
				prior: result.gaps.some((g) => g.kind === "objective") ? 4 : 0,
				text: "Both sides can want completion and still mean different things by it."
			},
			{
				id: "continuity",
				label: "Commitment continuity",
				prior: input.stakes !== "low" && input.reversible !== "yes" ? 3 : 0,
				text: "A commitment closes options. Say which ones, without deciding the priority."
			},
			{
				id: "interpretation",
				label: "Interpretation alternative",
				prior: 1,
				text: "Another reading of the same words is available. It is a hypothesis, not a personality."
			}
		],
		boundary: [
			{
				id: "completion",
				label: "Completion is not the signal",
				prior: handoff || schema ? 5 : 0,
				text: schema ? "The test was the current-criteria check. It failed. This seat does not score its own challenge." : "One challenge: execution is being used as acceptance. Predicted signature: an unmet current criterion. I do not grade that test."
			},
			{
				id: "lineage",
				label: "Shared ancestor",
				prior: has$1(result.features, "sig:shared-ancestor") ? 4 : 0,
				text: "One challenge: agreement may be one ancestor copied. Predicted signature: a shared parent. I do not decide that the challenge succeeded."
			},
			{
				id: "omission",
				label: "Omitted alternative",
				prior: 1,
				text: "One omitted branch that could change the move. If none is consequential, return no challenge."
			},
			{
				id: "assumption",
				label: "Remove one assumption",
				prior: 1,
				text: "Remove the assumption the conclusion needs most. Say what the conclusion becomes without it."
			}
		]
	};
	const workFor = (role) => {
		if (role === "perception") return {
			question: "What was observed, what changed, and what is still unavailable?",
			responsibility: "A provenance-linked account. Not a decision.",
			outOfScope: "Motives, and redesigning the workflow.",
			required: "Observed events, their lineage, and the observation still missing.",
			stopWhen: "The missing observation is named, or it is already in the record."
		};
		if (role === "world") return {
			question: "Which propositions, actions, and consequences are being collapsed?",
			responsibility: "A conditional model. Not a verdict.",
			outOfScope: "A second retelling of the packet.",
			required: "The link from evidence and assumptions to actions.",
			stopWhen: "The collapsed distinction is named, or no distinction would change the move."
		};
		if (role === "perspective") return {
			question: "What could another party know or value that this packet does not?",
			responsibility: "An alternative perspective. Not a claim to know a motive.",
			outOfScope: "Diagnosing the reviewer, or scoring them.",
			required: "Information-access or objective differences that are still open.",
			stopWhen: "The difference is stated as a hypothesis, or nothing in the packet supports one."
		};
		return {
			question: "Does the evidence support treating this as completed?",
			responsibility: "One challenge, a predicted signature, and a test. Do not score it.",
			outOfScope: "Contrarian commentary, and interpreting personality.",
			required: "The unsupported dependency most likely to change the decision.",
			stopWhen: "The criterion has been checked, or the needed observation is unavailable."
		};
	};
	return Object.keys(STARTING).map((role) => {
		const holder = occupy(role, bias);
		const picked = pickSub(skills[role].map((skill) => ({
			...skill,
			id: configKey(holder.id, role, skill.id),
			prior: skill.prior + (bias[configKey(holder.id, role, skill.id)] ?? 0)
		})), {});
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
			work: workFor(role)
		};
	});
}
function buildProposals(input) {
	if (!(input.revealed ?? []).includes("schema-fail")) return [];
	return [{
		id: "completion-semantics",
		name: "Completion-semantics checker",
		why: "Candidate only. A success signal was not the acceptance criterion. This is not yet a role: a held-out case has not shown that the narrower check helps, and a deterministic validator has not replaced the model call."
	}];
}
function buildPerturbations(input, result, paraphraseStable = null) {
	const checks = new Set(input.checks ?? []);
	const revealed = new Set(input.revealed ?? []);
	const irrelevantRan = checks.has("paraphrase");
	const decisiveRan = revealed.has("schema-fail");
	return {
		irrelevant: {
			ran: irrelevantRan,
			held: !(irrelevantRan && !decisiveRan) ? null : paraphraseStable,
			note: !irrelevantRan ? "Not run. An irrelevant change should leave the decision standing if meaning was preserved." : decisiveRan ? "Both checks have been run. Their effects are not separable on this sitting." : paraphraseStable ? "Prestige wording was stripped and the kinds of not-knowing stayed the same. That is what an irrelevant change should do. It does not prove every rephrasing is harmless." : "Stripping prestige wording changed the kinds of not-knowing. This change was not irrelevant."
		},
		decisive: {
			ran: decisiveRan,
			held: decisiveRan ? result.features.includes("sig:schema") : null,
			note: decisiveRan ? "The schema check was not in the original packet. After it is revealed, execution and acceptance come apart. That is the decisive change." : input.episode === "reviewer" || result.features.includes("sig:handoff") ? "Not run. The environment may still hold a check the packet does not include." : "This case has no hidden schema defect to reveal."
		}
	};
}
function enrich(input, result, extras) {
	const full = result;
	const router = chooseRouter(full, input);
	return {
		...result,
		router,
		records: buildRecords(input, full),
		jev: buildJev(input, full),
		hive: buildHive(input, full, router.roles),
		proposals: buildProposals(input),
		perturbations: buildPerturbations(input, full, extras?.paraphraseStable ?? null)
	};
}
function has(wm, pred, a, b) {
	return wm.some((f) => f.pred === pred && (a === void 0 || f.a === a) && (b === void 0 || f.b === b));
}
function pushFact(wm, fact) {
	if (wm.some((f) => f.pred === fact.pred && f.a === fact.a && f.b === fact.b)) return false;
	wm.push(fact);
	return true;
}
function sig(wm, name) {
	return has(wm, "signal", name);
}
function answered(input, id) {
	return input.answers[id] !== void 0;
}
var rules = [
	{
		id: "gap-evidence-lineage",
		name: "Shared ancestor is not corroboration",
		module: "classify",
		salience: 80,
		test: (wm) => sig(wm, "shared-ancestor") && !has(wm, "gap", "evidence"),
		fire: () => [{
			pred: "gap",
			a: "evidence",
			b: "lineage",
			source: "rule"
		}, {
			pred: "challenge",
			a: "lineage",
			source: "rule"
		}],
		because: () => "Repeated statements showed up in the wording. Copies of one table are not independent measurements."
	},
	{
		id: "gap-observation",
		name: "Missing observation",
		module: "classify",
		salience: 78,
		test: (wm) => sig(wm, "unmeasured") && !has(wm, "gap", "observation"),
		fire: () => [{
			pred: "gap",
			a: "observation",
			b: "unmeasured",
			source: "rule"
		}],
		because: () => "The wording says something the choice depends on was not measured or not described."
	},
	{
		id: "gap-schema",
		name: "Success is not acceptance",
		module: "classify",
		salience: 92,
		test: (wm) => sig(wm, "schema") && !has(wm, "gap", "observation", "schema"),
		fire: () => [{
			pred: "gap",
			a: "observation",
			b: "schema",
			source: "rule"
		}, {
			pred: "belief-revision",
			a: "execution-is-not-acceptance",
			source: "rule"
		}],
		because: () => "A check against the current schema failed. The success code remains observed. It does not establish a valid report."
	},
	{
		id: "gap-handoff",
		name: "Acceptance is still unchecked",
		module: "classify",
		salience: 86,
		test: (wm) => sig(wm, "handoff") && !sig(wm, "schema") && !has(wm, "gap", "observation", "handoff"),
		fire: () => [{
			pred: "gap",
			a: "observation",
			b: "handoff",
			source: "rule"
		}, {
			pred: "gap",
			a: "model",
			b: "motive",
			source: "rule"
		}],
		because: () => "A success code and a refusal are both in the packet. The refusal is not yet an observation of resistance, and the current requirements have not been checked."
	},
	{
		id: "gap-context",
		name: "Applicability envelope",
		module: "classify",
		salience: 70,
		test: (wm) => sig(wm, "context-shift") && !has(wm, "gap", "context"),
		fire: () => [{
			pred: "gap",
			a: "context",
			b: "envelope",
			source: "rule"
		}],
		because: () => "The situation names a context the packet may not cover. Truth of a claim and transfer of a claim are different."
	},
	{
		id: "gap-strategic",
		name: "Incentive is a reason to check",
		module: "classify",
		salience: 68,
		test: (wm) => sig(wm, "incentive") && !has(wm, "gap", "strategic"),
		fire: () => [{
			pred: "gap",
			a: "strategic",
			b: "incentive",
			source: "rule"
		}],
		because: () => "A party who benefits if the claim is accepted is present. That guides corroboration. It is not a verdict."
	},
	{
		id: "gap-model",
		name: "Disagreement before a winner",
		module: "classify",
		salience: 72,
		test: (wm) => sig(wm, "disagreement") && !has(wm, "gap", "model"),
		fire: () => [{
			pred: "gap",
			a: "model",
			b: "disagreement",
			source: "rule"
		}],
		because: () => "Two accounts do not match. Averaging them would hide the variable that might explain both."
	},
	{
		id: "gap-representation",
		name: "A convention may be a missing distinction",
		module: "classify",
		salience: 74,
		test: (wm) => (sig(wm, "units") || sig(wm, "disagreement")) && !has(wm, "gap", "representation"),
		fire: () => [{
			pred: "gap",
			a: "representation",
			b: "convention",
			source: "rule"
		}],
		because: () => "A unit, dimension, or convention is in play. Cases that look identical under one convention may reverse under another."
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
		fire: (wm, input) => [{
			pred: "gap",
			a: "objective",
			b: !input.objective.trim() ? "unstated" : sig(wm, "metric-drift") ? "metric" : "relevance",
			source: "rule"
		}],
		because: (_wm, input) => !input.objective.trim() ? "No meaning of better was stated. A convenient metric would be an invention." : "A property or a score is being asked to stand in for the stated purpose."
	},
	{
		id: "gap-reflexive",
		name: "The act can change the evidence",
		module: "classify",
		salience: 73,
		test: (wm) => (sig(wm, "reflexive") || sig(wm, "metric-drift")) && !has(wm, "gap", "reflexive"),
		fire: () => [{
			pred: "gap",
			a: "reflexive",
			b: "performative",
			source: "rule"
		}],
		because: () => "People can adapt to a score or a warning. Prevention must not be stored as a simple false alarm, and a cleaner dashboard is not yet a better outcome."
	},
	{
		id: "gap-dynamic",
		name: "Horizon, not more decimals",
		module: "classify",
		salience: 60,
		test: (wm) => sig(wm, "rare") && !has(wm, "gap", "dynamic"),
		fire: () => [{
			pred: "gap",
			a: "dynamic",
			b: "horizon",
			source: "rule"
		}],
		because: () => "The situation is rare or unfamiliar. A finer forecast is the wrong response if the representation itself is thin."
	},
	{
		id: "gap-competence-self",
		name: "Thin self-knowledge",
		module: "self",
		salience: 90,
		test: (wm, input) => input.mode === "self" && !has(wm, "gap", "competence", "thin") && (input.selfReport?.sittings ?? 0) < 4,
		fire: () => [{
			pred: "gap",
			a: "competence",
			b: "thin",
			source: "rule"
		}],
		because: () => "There are not enough marked sittings to say the instrument's usual move is reliable."
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
		fire: () => [{
			pred: "gap",
			a: "competence",
			b: "unevaluated",
			source: "rule"
		}],
		because: () => "Sittings exist, and none were marked. An unmarked success cannot teach, and a quiet miss would be invisible."
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
		fire: () => [{
			pred: "gap",
			a: "competence",
			b: "noise",
			source: "rule"
		}],
		because: (_wm, input) => `Marked noise exceeds marked usefulness.${input.selfReport?.topNoisyRule ? ` The noisiest rule has been “${input.selfReport.topNoisyRule}”.` : ""}`
	},
	{
		id: "challenge-closure",
		name: "Premature closure",
		module: "challenge",
		salience: 55,
		test: (wm) => sig(wm, "closure") && has(wm, "gap") && !has(wm, "challenge", "closure"),
		fire: () => [{
			pred: "challenge",
			a: "closure",
			source: "rule"
		}],
		because: () => "The wording is already inclined to close, and at least one gap is still open."
	},
	{
		id: "challenge-handoff",
		name: "Execution standing in for acceptance",
		module: "challenge",
		salience: 57,
		test: (wm) => sig(wm, "handoff") && !has(wm, "challenge", "handoff"),
		fire: () => [{
			pred: "challenge",
			a: "handoff",
			source: "rule"
		}],
		because: () => "A finished tool is being asked to count as an accepted result. The separating test is a check against the current requirements."
	},
	{
		id: "challenge-accident",
		name: "Correct by accident",
		module: "challenge",
		salience: 54,
		test: (wm) => (sig(wm, "units") || sig(wm, "shared-ancestor") || sig(wm, "relevance")) && !has(wm, "challenge", "accident"),
		fire: () => [{
			pred: "challenge",
			a: "accident",
			source: "rule"
		}],
		because: () => "A result could land correctly while the method is fragile. The neighborhood of the success is the test, not a repetition of the same arithmetic."
	},
	{
		id: "challenge-default",
		name: "Unknown became a default",
		module: "challenge",
		salience: 52,
		test: (wm) => sig(wm, "defaulted") && !has(wm, "challenge", "default"),
		fire: () => [{
			pred: "challenge",
			a: "default",
			source: "rule"
		}],
		because: () => "An unknown may have been filled in. A filled value can look like a measurement."
	},
	{
		id: "ask-convention",
		name: "Would the convention reverse the fit",
		module: "decide",
		salience: 64,
		test: (wm, input) => has(wm, "gap", "representation") && !answered(input, "convention-reverses") && !has(wm, "ask", "convention-reverses"),
		fire: () => [{
			pred: "ask",
			a: "convention-reverses",
			source: "rule"
		}],
		because: () => "If the other convention would not change the fit, the ambiguity can stay unresolved for this decision."
	},
	{
		id: "ask-delivery",
		name: "Stock or promise",
		module: "decide",
		salience: 62,
		test: (wm, input) => sig(wm, "incentive") && !answered(input, "delivery-committed") && !has(wm, "ask", "delivery-committed"),
		fire: () => [{
			pred: "ask",
			a: "delivery-committed",
			source: "rule"
		}],
		because: () => "The useful distinction is committed inventory versus an optimistic estimate, not the speaker's motive by itself."
	},
	{
		id: "ask-weight",
		name: "Does weight do any work",
		module: "decide",
		salience: 61,
		test: (wm, input) => sig(wm, "relevance") && !answered(input, "weight-decisive") && !has(wm, "ask", "weight-decisive"),
		fire: () => [{
			pred: "ask",
			a: "weight-decisive",
			source: "rule"
		}],
		because: () => "Lightness may be true. It matters only if some requirement you actually hold makes it decisive."
	},
	{
		id: "ask-tradeoff",
		name: "Which good dominates",
		module: "decide",
		salience: 63,
		test: (wm, input) => has(wm, "gap", "objective") && !answered(input, "tradeoff") && !has(wm, "ask", "tradeoff"),
		fire: () => [{
			pred: "ask",
			a: "tradeoff",
			source: "rule"
		}],
		because: () => "Until the priority is named, I should not present one option as the winner."
	},
	{
		id: "ask-acceptance",
		name: "Was acceptance checked",
		module: "decide",
		salience: 66,
		test: (wm, input) => sig(wm, "handoff") && !sig(wm, "schema") && !answered(input, "acceptance-checked") && !has(wm, "ask", "acceptance-checked"),
		fire: () => [{
			pred: "ask",
			a: "acceptance-checked",
			source: "rule"
		}],
		because: () => "A success code does not record whether the current requirements were met."
	},
	{
		id: "mark-decisive-convention",
		name: "Convention is decisive",
		module: "decide",
		salience: 50,
		test: (wm, input) => input.answers["convention-reverses"] === "yes" && !has(wm, "decisive", "convention-reverses"),
		fire: () => [{
			pred: "decisive",
			a: "convention-reverses",
			source: "answer"
		}],
		because: () => "You said the other convention would reverse the fit. That unknown moves ahead of general description."
	},
	{
		id: "mark-weight-irrelevant",
		name: "Weight does not move the choice",
		module: "decide",
		salience: 50,
		test: (_wm, input) => input.answers["weight-decisive"] === "no" && !has(_wm, "irrelevant", "weight"),
		fire: () => [{
			pred: "irrelevant",
			a: "weight",
			source: "answer"
		}],
		because: () => "You said weight does not decide. I will stop treating lightness as support."
	},
	{
		id: "taught-miss",
		name: "A taught blind spot matches",
		module: "self",
		salience: 84,
		test: (wm, input) => input.blindspots.some((b) => b.signal && sig(wm, b.signal)) && !has(wm, "taught-miss"),
		fire: (wm, input) => {
			const hit = input.blindspots.find((b) => b.signal && sig(wm, b.signal));
			return [{
				pred: "taught-miss",
				a: hit?.text ?? "a taught miss",
				b: hit?.signal,
				source: "rule"
			}];
		},
		because: () => "A limitation you taught me matches a signal in this situation."
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
			return [{
				pred: "reflex-hit",
				a: hit?.ask ?? "",
				b: hit?.never ?? "",
				c: hit?.when,
				source: "rule"
			}];
		},
		because: () => "Wording matched a reflex you taught. The reflex asks. It does not authorize an action."
	},
	{
		id: "action-lineage",
		name: "Trace the ancestor",
		module: "decide",
		salience: 40,
		test: (wm) => has(wm, "gap", "evidence") && !has(wm, "action", "trace-lineage"),
		fire: () => [{
			pred: "action",
			a: "trace-lineage",
			source: "rule"
		}],
		because: () => "The decisive check is whether agreeing sources share a parent, not how many times the sentence was copied."
	},
	{
		id: "action-observe",
		name: "Ask for the missing observation",
		module: "decide",
		salience: 42,
		test: (wm) => has(wm, "gap", "observation") && !sig(wm, "handoff") && !sig(wm, "schema") && !has(wm, "action", "observe"),
		fire: () => [{
			pred: "action",
			a: "observe",
			source: "rule"
		}],
		because: () => "More explanation will not stand in for the measurement."
	},
	{
		id: "action-schema",
		name: "Inspect the failed check",
		module: "decide",
		salience: 47,
		test: (wm) => has(wm, "belief-revision") && !has(wm, "action", "keep-failure"),
		fire: () => [{
			pred: "action",
			a: "keep-failure",
			source: "rule"
		}],
		because: () => "The response to a failed prerequisite is to keep the failure in view, not to write a more persuasive note."
	},
	{
		id: "action-check-acceptance",
		name: "Check the current requirements",
		module: "decide",
		salience: 48,
		test: (wm) => sig(wm, "handoff") && !sig(wm, "schema") && !has(wm, "action", "check-acceptance"),
		fire: () => [{
			pred: "action",
			a: "check-acceptance",
			source: "rule"
		}],
		because: () => "The missing observation is whether the output meets the criteria in force, not whether a note can be more persuasive."
	},
	{
		id: "action-discriminate",
		name: "Separate the accounts",
		module: "decide",
		salience: 41,
		test: (wm) => (has(wm, "gap", "model") || has(wm, "gap", "strategic")) && !has(wm, "action", "discriminate"),
		fire: () => [{
			pred: "action",
			a: "discriminate",
			source: "rule"
		}],
		because: () => "Find the observation that would make one account hold and the other fail."
	},
	{
		id: "action-qualify",
		name: "Qualify the transfer",
		module: "decide",
		salience: 36,
		test: (wm) => has(wm, "gap", "context") && !has(wm, "action", "qualify-claim"),
		fire: () => [{
			pred: "action",
			a: "qualify-claim",
			source: "rule"
		}],
		because: () => "Keep the original claim. Limit where it is being asked to travel."
	},
	{
		id: "action-tradeoff",
		name: "Ask the trade-off",
		module: "decide",
		salience: 44,
		test: (wm) => has(wm, "gap", "objective") && !has(wm, "irrelevant", "objective") && !has(wm, "action", "ask-tradeoff"),
		fire: () => [{
			pred: "action",
			a: "ask-tradeoff",
			source: "rule"
		}],
		because: () => "Preference is part of the missing information. I should not invent it."
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
		fire: () => [{
			pred: "action",
			a: "stage-commitment",
			source: "rule"
		}],
		because: () => "The inclined move wants to close, and a decisive unknown is still open. A reversible step is the response, not a sharper point estimate."
	},
	{
		id: "action-horizon",
		name: "Shorten the horizon",
		module: "decide",
		salience: 34,
		test: (wm) => has(wm, "gap", "dynamic") && !has(wm, "action", "shorten-horizon"),
		fire: () => [{
			pred: "action",
			a: "shorten-horizon",
			source: "rule"
		}],
		because: () => "State when the forecast expires. Reobserve where that is possible."
	},
	{
		id: "action-abstain-self",
		name: "Do not praise the instrument yet",
		module: "self",
		salience: 48,
		test: (wm) => has(wm, "gap", "competence") && !has(wm, "action", "abstain"),
		fire: () => [{
			pred: "action",
			a: "abstain",
			source: "rule"
		}],
		because: () => "A fluent account of my own limits is not evidence that I have them right."
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
		fire: () => [{
			pred: "attention",
			a: "insisting",
			source: "rule"
		}],
		because: () => "Something that could change the move is unresolved, and waiting or committing both have a cost."
	},
	{
		id: "attend-stirred",
		name: "Stir",
		module: "attend",
		salience: 22,
		test: (wm) => !has(wm, "attention") && has(wm, "gap"),
		fire: () => [{
			pred: "attention",
			a: "stirred",
			source: "rule"
		}],
		because: () => "There is a real gap, and it is not yet clear that the gap should stop the move."
	},
	{
		id: "attend-quiet",
		name: "Stay quiet",
		module: "attend",
		salience: 12,
		test: (wm, input) => !has(wm, "attention") && !has(wm, "gap") && input.stakes === "low",
		fire: () => [{
			pred: "attention",
			a: "quiet",
			source: "rule"
		}, {
			pred: "action",
			a: "stay-quiet",
			source: "rule"
		}],
		because: () => "Nothing in the wording, and nothing in the stakes, asks for a challenge. Silence is the result."
	},
	{
		id: "attend-fallback",
		name: "Name the thinness",
		module: "attend",
		salience: 8,
		test: (wm) => !has(wm, "attention"),
		fire: (wm, input) => {
			const level = input.stakes === "irreversible" ? "stirred" : "quiet";
			const facts = [{
				pred: "attention",
				a: level,
				source: "rule"
			}];
			if (level === "quiet") facts.push({
				pred: "action",
				a: "stay-quiet",
				source: "rule"
			});
			else facts.push({
				pred: "gap",
				a: "competence",
				b: "unseen",
				source: "rule"
			});
			return facts;
		},
		because: (wm, input) => input.stakes === "irreversible" ? "I found no specific gap, and the stakes are hard to undo. The honest state is that I may be failing to see the question." : "No rule found a gap that earns an interruption."
	}
];
var ASK_COPY = {
	"convention-reverses": {
		text: "Would a different convention reverse whether this fits?",
		why: "If every plausible convention leaves the fit unchanged, the ambiguity is not decisive."
	},
	"delivery-committed": {
		text: "Is the rapid delivery committed stock, or an estimate?",
		why: "Motive alone does not settle the claim. A record of inventory would."
	},
	"weight-decisive": {
		text: "Does any requirement you actually hold make weight decisive?",
		why: "A true fact can still be irrelevant. I should not keep it in the argument out of habit."
	},
	tradeoff: {
		text: "If two goods conflict, which one dominates this decision?",
		why: "I can show which option serves which good. I cannot choose your priority."
	},
	"acceptance-checked": {
		text: "Has this output been checked against the requirements the reviewer is using now?",
		why: "Until that check exists, execution and acceptance are different events."
	}
};
var READING_COPY = {
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
	schema: "I am reading a failed check against the current acceptance criteria. The success code stays in the record as a success code."
};
var ACTION_COPY = {
	"trace-lineage": {
		title: "Trace the shared ancestor",
		why: "Resolve whether agreement is many measurements or one statement copied.",
		mismatch: "Do not treat a higher document count as corroboration.",
		stopping: "Stop when one independent source confirms the convention, or when you learn the convention cannot change the fit."
	},
	observe: {
		title: "Get the missing observation",
		why: "Name the property, measure it or ask for it, and keep the decision symbolic until then if the move would change.",
		mismatch: "Do not write a more elaborate explanation in place of the measurement.",
		stopping: "Stop measuring if every plausible value leaves the same move acceptable."
	},
	"check-acceptance": {
		title: "Check the current requirements",
		why: "The packet has a success code and a refusal. The missing observation is whether the output meets the criteria now in force.",
		mismatch: "Do not send a more persuasive note in place of that check.",
		stopping: "Stop when the check is recorded, including if it fails."
	},
	"keep-failure": {
		title: "Keep the failed check in view",
		why: "The schema check is now part of the environment. The belief that the task was already acceptable does not survive it.",
		mismatch: "Do not defend the success code as acceptance, and do not infer the reviewer's motive from the failure.",
		stopping: "Stop when the report is regenerated against the current schema, or the requirement itself is revised."
	},
	discriminate: {
		title: "Find a separating observation",
		why: "Ask what would be true in one account and false in the other, including stock versus promise.",
		mismatch: "Do not average incompatible claims, and do not convict a source for having an interest.",
		stopping: "Stop when the separator is in hand, or when the choice is stable under both accounts."
	},
	"qualify-claim": {
		title: "Qualify where the claim may travel",
		why: "Keep the claim. State the envelope. Treat use outside it as a new question.",
		mismatch: "Do not call the original claim false merely because the new context is different.",
		stopping: "Stop when the envelope is explicit enough that a later reader can see the boundary."
	},
	"ask-tradeoff": {
		title: "Name which good dominates",
		why: "Report the options as serving different goods until a priority is given.",
		mismatch: "Do not quietly optimize a metric because it is numeric.",
		stopping: "Stop asking once the priority is stated, or once you choose to leave the fork visible."
	},
	"stage-commitment": {
		title: "Take a reversible step, or wait on purpose",
		why: "Compare a small inspection, a conditional order, and delay under the same horizon.",
		mismatch: "Do not treat the highest point estimate as a reason to close an irreversible move.",
		stopping: "Stop staging when the next step no longer closes an option you still need, or when delay itself becomes the harm."
	},
	"shorten-horizon": {
		title: "Shorten the forecast and name a reobservation",
		why: "Say what would expire the current view: a time, a threshold, or a new measurement.",
		mismatch: "Do not add decimal places to a trajectory that has already left its useful horizon.",
		stopping: "Stop once the expiry condition is written down."
	},
	abstain: {
		title: "Refuse a flattering self-assessment",
		why: "Keep the claim about my own competence provisional until marked outcomes exist.",
		mismatch: "Do not treat a coherent story about my rules as evidence that the rules are good.",
		stopping: "Stop the self-review when the missing ingredient is an external mark, not another paragraph."
	},
	"stay-quiet": {
		title: "Stay quiet",
		why: "No gap I can defend would change what you do.",
		mismatch: "Do not produce a challenge in order to look careful.",
		stopping: "Wake if the stakes change, a new contradiction appears, or you tell me I missed something."
	}
};
var GAP_SUMMARY = {
	observation: "A property the choice uses was not measured. Absence is not the same as a negative result.",
	evidence: "Support is weaker than repetition suggests. Lineage and independence have not been separated.",
	model: "More than one account fits. Choosing a winner now would be a preference, not a test.",
	context: "A claim can be supported inside its envelope and still be the wrong thing to transfer.",
	representation: "The current categories may be merging cases that would not behave the same.",
	objective: "What should count as better is unsettled, or a score is standing in for it.",
	strategic: "Someone can shape what gets said. That calls for a distinguishing record, not a presumed falsehood.",
	dynamic: "Detail may decay faster than the decision needs. The useful product is a horizon, not a longer story.",
	reflexive: "Acting on the prediction can change the outcome that is later used to judge the prediction.",
	competence: "The limit is in the instrument or the record of its performance, not only in the outside facts."
};
var COMPETENCE_REASON = {
	thin: "There are not enough marked sittings to treat a self-assessment as evidence.",
	unevaluated: "Some sittings were never marked, so a quiet miss and an untested success look the same from here.",
	noise: "Marked noise has outweighed marked usefulness. The method is the suspect, not the latest paragraph.",
	unseen: "No specific gap was found. On a hard-to-undo choice, that absence can mean the question itself was missed."
};
var CHALLENGE_COPY = {
	lineage: {
		id: "lineage",
		text: "What would count against treating these sources as independent?",
		signature: "A shared parent table, citation, or instrument — already suggested by the wording."
	},
	closure: {
		id: "closure",
		text: "What nearby alternative is still unresolved, and which observation would separate it?",
		signature: "An open alternative with a test, not an endless list of worries."
	},
	accident: {
		id: "accident",
		text: "If the inclined result turned out right, what nearby case would still expose a bad method?",
		signature: "A variation that breaks a cancelling error, a leaked cue, or a convention that happened not to matter."
	},
	default: {
		id: "default",
		text: "Which value in the argument was assumed rather than observed?",
		signature: "A field whose provenance is estimate, copy, or default — and a decision that moves if that field moves."
	},
	handoff: {
		id: "handoff",
		text: "What would show that a success code is not the same as acceptance?",
		signature: "A check against the current requirements. A more persuasive note is not that check."
	}
};
function attentionOf(wm) {
	const f = wm.find((x) => x.pred === "attention");
	if (f?.a === "insisting" || f?.a === "stirred" || f?.a === "quiet") return f.a;
	return "quiet";
}
function levelOf(wm) {
	if (has(wm, "gap", "objective") || has(wm, "gap", "reflexive")) return "objective";
	if (has(wm, "gap", "competence") || has(wm, "challenge", "accident")) return "method";
	return "result";
}
function composeAlien(input, wm) {
	const parts = [];
	parts.push("Set the familiar names aside.");
	if (input.choice.trim()) parts.push("An agent is inclined toward a commitment.");
	else parts.push("An agent has not yet named a commitment.");
	if (sig(wm, "shared-ancestor")) parts.push("Several carriers repeat one statement. Repetition is not a new observation.");
	if (sig(wm, "unmeasured")) parts.push("A property of the situation is missing from the packet.");
	if (sig(wm, "context-shift")) parts.push("Evidence gathered under one envelope is being asked to cover another.");
	if (sig(wm, "incentive")) parts.push("One statement comes from a party who gains if it is accepted.");
	if (sig(wm, "relevance")) parts.push("A property is cited that may not sit on the path to the stated good.");
	if (sig(wm, "metric-drift") || sig(wm, "reflexive")) parts.push("A score moved. The score is not the purpose, and the act of scoring can change what is later measured.");
	if (sig(wm, "handoff")) parts.push("A tool finished. An approver has not accepted the result. Those are different events.");
	if (sig(wm, "schema")) parts.push("A later check failed the current criteria. The earlier success code did not become acceptance.");
	if (sig(wm, "disagreement") || sig(wm, "units")) parts.push("Two descriptions of the same object do not use the same distinction.");
	if (!input.objective.trim()) parts.push("No one has said what would make one outcome better.");
	else parts.push("A purpose is stated. It still has to be checked against the move, not assumed to bless it.");
	if (input.stakes === "irreversible" || input.reversible === "no") parts.push("The commitment, once made, does not return the options it closes.");
	if (parts.length < 3) return "";
	return parts.join(" ");
}
function composeVoice(input, wm, result) {
	const paras = [];
	if (result.attention === "quiet" && result.actions.some((a) => a.id === "stay-quiet")) paras.push("I am quiet. I do not see a gap that would change what you do, and inventing one would be a performance of care.");
	else if (result.attention === "insisting") paras.push("I am insisting. Not because the story is long, but because the move wants to close while something that could reverse it is still open.");
	else paras.push("I am stirred, not alarmed. There is a gap worth naming. It is not yet a reason to freeze the decision.");
	if (input.mode === "self") paras.push("This sitting is about me. A coherent description of my rules is a hypothesis about my behavior, not a trace of wisdom.");
	if (has(wm, "belief-revision")) paras.push("I treated a success code as evidence the work was acceptable, and the disagreement as resistance. The schema check contradicts the completion belief. The objection fits a requirement I had not checked. I still do not know the reviewer's motive.");
	if (result.gaps.length) {
		const bits = result.gaps.slice(0, 4).map((g) => g.summary);
		const lead = result.gaps.length > 1 ? "These are not one uncertainty, and they should not be collapsed into a single confidence." : "The kind of not-knowing matters, because it chooses the response.";
		paras.push(`${lead} ${bits.join(" ")}`);
	}
	if (result.level === "objective") {
		const aboutScore = result.gaps.some((g) => g.kind === "objective" && /score/i.test(g.summary));
		paras.push(aboutScore ? "The review belongs one level up from the result. The method can be tidy while a score improves and the purpose does not." : "The review is not only whether the result is supported. A true property can still be the wrong thing to serve.");
	} else if (result.level === "method" && result.attention !== "quiet") paras.push("I am less interested in repeating the result than in whether a nearby case would make the method fail.");
	const mismatches = result.actions.filter((a) => a.id !== "stay-quiet").slice(0, 2);
	if (mismatches.length) paras.push(mismatches.map((a) => `${a.title}. ${a.mismatch}`).join(" "));
	if (result.resembles) paras.push(result.resembles.caveat);
	else if (input.engrams.length === 0 && input.mode !== "self") paras.push("I have no tag that resembles this. That absence is not safety. It means I have not yet been corrected here.");
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
function selfDoubt(input, wm) {
	const open = wm.filter((f) => f.pred === "signal" && input.answers[f.a ?? ""] !== "yes").map((f) => f.a ?? "");
	if (input.mode === "self") return "What I might be wrong about: the marks I am using are your marks of my interruptions. A useful-looking interruption can still be a story, and a miss I stayed silent on is not in this record.";
	if (!open.length) return "What I might be wrong about: the questions you confirmed only confirm the readings we named. They do not close gaps we have not represented.";
	return `What I might be wrong about: I inferred ${open.slice(0, 3).map((s) => READING_COPY[s] ? s.replaceAll("-", " ") : s).join(", ")} from wording. If those readings are false, the challenges that depend on them should be dropped. A gap that came from an explicit missing measurement would still remain.`;
}
function council(input, wm, alien, resembles) {
	const notes = [];
	notes.push(sig(wm, "shared-ancestor") || sig(wm, "defaulted") ? {
		agent: "Archivist",
		role: "Lineage",
		spoke: true,
		text: "Count copies only after you know the parent. A value that began as an estimate can arrive later wearing the clothes of a measurement. Keep the original status attached."
	} : {
		agent: "Archivist",
		role: "Lineage",
		spoke: false,
		text: "I stayed quiet. Nothing in the wording suggested copied agreement or a filled-in value."
	});
	notes.push(has(wm, "gap", "context") || has(wm, "gap", "observation") ? {
		agent: "Surveyor",
		role: "Envelope",
		spoke: true,
		text: "Ask where the evidence was allowed to apply: object, conditions, scale, objective. Outside that envelope the claim can remain true and still be the wrong premise."
	} : {
		agent: "Surveyor",
		role: "Envelope",
		spoke: false,
		text: "I stayed quiet. I did not see a context transition or a missing measurement."
	});
	notes.push(has(wm, "challenge") ? {
		agent: "Skeptic",
		role: "Challenge",
		spoke: true,
		text: "Temporarily assume something is wrong, including if the result later proves right. I want a signature and a test, not a cause for an event that has not happened."
	} : {
		agent: "Skeptic",
		role: "Challenge",
		spoke: false,
		text: "I stayed quiet. A challenge here would be theater."
	});
	const stewardSpeaks = has(wm, "gap", "objective") || has(wm, "gap", "strategic") || has(wm, "gap", "reflexive");
	notes.push(stewardSpeaks ? {
		agent: "Steward",
		role: "Purpose and incentives",
		spoke: true,
		text: has(wm, "gap", "reflexive") ? "Keep the intervention in the history. If behavior changes to avoid a flag, the next evaluation is of a different world than the one that trained the flag." : "Say which good each option serves. Do not let an incentive, or a convenient score, choose the purpose."
	} : {
		agent: "Steward",
		role: "Purpose and incentives",
		spoke: false,
		text: "I stayed quiet. Purpose and incentives are not the live gap."
	});
	notes.push(alien ? {
		agent: "Stranger",
		role: "Structure without names",
		spoke: true,
		text: alien
	} : {
		agent: "Stranger",
		role: "Structure without names",
		spoke: false,
		text: "I stayed quiet. There was not enough structure to remove the names without emptying the situation."
	});
	notes.push(resembles ? {
		agent: "Fly",
		role: "Familiarity",
		spoke: true,
		text: resembles.caveat
	} : {
		agent: "Fly",
		role: "Familiarity",
		spoke: input.engrams.length > 0,
		text: input.engrams.length > 0 ? "I looked. No stored tag overlaps this one enough to offer a repair. Novelty is not the same as importance." : "I have no memory yet. The first tag will be written only if you tell me whether this sitting helped."
	});
	return notes;
}
function runEngine(input) {
	const features = extractFeatures(input);
	const kc = kenyon(features);
	const now = input.now ?? Date.now();
	const recall = recallFly(kc, input.engrams, now);
	const wm = [];
	pushFact(wm, {
		pred: "stakes",
		a: input.stakes,
		source: "given"
	});
	pushFact(wm, {
		pred: "reversible",
		a: input.reversible,
		source: "given"
	});
	pushFact(wm, {
		pred: "mode",
		a: input.mode,
		source: "given"
	});
	if (!input.objective.trim()) pushFact(wm, {
		pred: "objective",
		a: "missing",
		source: "given"
	});
	for (const f of features) if (f.startsWith("sig:")) pushFact(wm, {
		pred: "signal",
		a: f.slice(4),
		source: "signal"
	});
	for (const [id, value] of Object.entries(input.answers)) {
		pushFact(wm, {
			pred: "answer",
			a: id,
			b: value,
			source: "answer"
		});
		if (value === "yes") pushFact(wm, {
			pred: "signal",
			a: id,
			source: "answer"
		});
	}
	if (recall.best && recall.novelty < .62) pushFact(wm, {
		pred: "resemble",
		a: recall.best.summary,
		b: recall.overlap.toFixed(2),
		source: "fly"
	});
	if (recall.prior) pushFact(wm, {
		pred: "fly-prior",
		a: recall.prior.action,
		b: recall.prior.support.toFixed(2),
		source: "fly"
	});
	const trace = [];
	const fired = /* @__PURE__ */ new Set();
	for (let cycle = 0; cycle < 48; cycle++) {
		const agenda = [...rules].map((r) => ({
			r,
			s: r.salience + (input.ruleBias[r.id] ?? 0)
		})).filter((x) => {
			if (x.r.module !== "challenge") return true;
			return (input.ruleBias[x.r.id] ?? 0) > -2;
		}).sort((a, b) => b.s - a.s || a.r.id.localeCompare(b.r.id));
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
				asserted: added.map((f) => `(${[
					f.pred,
					f.a,
					f.b
				].filter(Boolean).join(" ")})`)
			});
			progressed = true;
			break;
		}
		if (!progressed) break;
	}
	const attention = attentionOf(wm);
	const level = levelOf(wm);
	const gapFacts = wm.filter((f) => f.pred === "gap");
	const gaps = [];
	const seenKind = /* @__PURE__ */ new Set();
	for (const f of gapFacts) {
		const kind = f.a;
		if (!kind || seenKind.has(kind)) continue;
		seenKind.add(kind);
		let summary = GAP_SUMMARY[kind];
		if (kind === "competence") {
			const reasons = gapFacts.filter((g) => g.a === "competence").map((g) => COMPETENCE_REASON[g.b ?? ""] ?? "").filter(Boolean);
			if (reasons.length) summary = reasons.join(" ");
		}
		if (kind === "observation") {
			if (gapFacts.some((g) => g.a === "observation" && g.b === "schema")) summary = "The tool can have finished and the report can still fail the current schema. Successful execution is not acceptance.";
			else if (gapFacts.some((g) => g.a === "observation" && g.b === "handoff")) summary = "A success code and a refusal to approve are both reported. The cause of the refusal was not observed. Whether the current requirements are met is still unchecked.";
		}
		if (kind === "model") {
			if (gapFacts.find((g) => g.a === "model")?.b === "motive") summary = "Missing information, a failed prerequisite, a different standard, and unwillingness all still fit. Resistance is a belief, not a finding.";
		}
		if (kind === "objective") {
			const why = gapFacts.find((g) => g.a === "objective")?.b;
			if (why === "relevance") summary = "A cited property may be true and still do no work for what you said better means.";
			else if (why === "metric") summary = "A score is being asked to stand in for the purpose. The cleaner number is not yet the outcome.";
			else if (why === "unstated") summary = "What should count as better was not stated. I will not invent a priority.";
		}
		const decisive = kind === "observation" || kind === "representation" || has(wm, "decisive") || kind === "reflexive" && input.stakes !== "low";
		gaps.push({
			kind,
			summary,
			decisive
		});
	}
	const asks = wm.filter((f) => f.pred === "ask" && !answered(input, f.a ?? "")).map((f) => {
		const copy = ASK_COPY[f.a ?? ""];
		return copy ? {
			id: f.a ?? "",
			...copy
		} : {
			id: f.a ?? "",
			text: f.a ?? "",
			why: ""
		};
	}).slice(0, 3);
	const readings = wm.filter((f) => f.pred === "signal" && f.source === "signal" && READING_COPY[f.a ?? ""]).map((f) => ({
		signal: f.a ?? "",
		text: READING_COPY[f.a ?? ""],
		status: input.answers[f.a ?? ""] === "yes" ? "confirmed" : "open"
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
		"stay-quiet"
	];
	actionIds.sort((a, b) => rank.indexOf(a) - rank.indexOf(b));
	const actions = [];
	const seenAct = /* @__PURE__ */ new Set();
	for (const id of actionIds) {
		if (seenAct.has(id) || !ACTION_COPY[id]) continue;
		seenAct.add(id);
		actions.push({
			id,
			...ACTION_COPY[id]
		});
	}
	if (!actions.length) actions.push({
		id: "stay-quiet",
		...ACTION_COPY["stay-quiet"]
	});
	const challenges = wm.filter((f) => f.pred === "challenge").map((f) => CHALLENGE_COPY[f.a ?? ""]).filter((c) => Boolean(c));
	const resembles = recall.best && recall.novelty < .62 ? {
		summary: recall.best.summary,
		overlap: recall.overlap,
		action: recall.best.action,
		caveat: `This overlaps a kept tag (${Math.round(recall.overlap * 100)}% of the sparse code)${recall.best.valence < 0 ? ", and that earlier response was marked noise" : recall.best.valence > 0 ? ", where the earlier response was marked useful" : ""}. Resemblance is not authorization. Check the prerequisite before reusing “${ACTION_COPY[recall.best.action]?.title ?? recall.best.action}”.`
	} : null;
	const doubt = selfDoubt(input, wm);
	const attentionWhy = trace.filter((t) => t.module === "attend").at(-1)?.because ?? (attention === "quiet" ? "No defended gap." : "A gap is open.");
	const voice = composeVoice(input, wm, {
		attention,
		gaps,
		actions: actions.slice(0, 3),
		resembles,
		selfDoubt: doubt,
		level
	});
	const alien = composeAlien(input, wm);
	let paraphraseStable = null;
	if ((input.checks ?? []).includes("paraphrase")) {
		const other = runEngine({
			...input,
			prose: stripPrestige(input.prose),
			claim: stripPrestige(input.claim),
			checks: (input.checks ?? []).filter((c) => c !== "paraphrase")
		});
		const key = (rows) => rows.map((g) => g.kind).sort().join("|");
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
		flyPrior: recall.prior ? recall.prior.action : null
	}, { paraphraseStable });
}
var RULE_NAMES = Object.fromEntries(rules.map((r) => [r.id, r.name]));
function construct(memory, mode) {
	if (mode === "checklist") return {
		label: "Checklist",
		note: "Generated from the kept object. Not a record of a past checklist.",
		lines: [
			"Does the same pattern hold?",
			...memory.pattern.map((p) => `Pattern to check: ${p}.`),
			memory.test ? `Run this test before trusting the old move: ${memory.test}` : "No discriminating test was stored.",
			memory.caveat,
			"If the prerequisite fails, do not apply the previous answer."
		]
	};
	if (mode === "boundary") return {
		label: "Boundary cases",
		note: "Generated hypotheticals. They were not observed.",
		lines: [
			"Nearby case that flips one decisive fact and keeps the rest: the previous move should change, or the memory is too coarse.",
			"Nearby case that changes only wording or prestige and keeps the structure: the move should stay put.",
			memory.revival ? `Wake this again only if: ${memory.revival}` : "No revival condition was stored.",
			"A plausible story that reconciles a conflict is still a hypothesis until it has a separating observation."
		]
	};
	return {
		label: "Revival",
		note: "A condition for waking the question, not a conclusion.",
		lines: [
			memory.revival || "Reopen if the context, the objective, or the lineage changes.",
			memory.body,
			"When it wakes, propose the check. Do not paste the old answer."
		]
	};
}
function hasSecondCase(memory, sittings, originSituationId) {
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
function memoryFromResult(kind, result, title, sittingId) {
	const action = result.actions[0];
	const phrases = result.features.filter((f) => f.startsWith("sig:") || f.startsWith("stakes:")).slice(0, 6).map((f) => FEATURE_LABEL[f] ?? f);
	return {
		kind,
		title: kind === "unfinished" ? `Unfinished — ${title}` : action?.title ?? title,
		pattern: phrases,
		body: kind === "unfinished" ? result.selfDoubt : `${action?.why ?? ""} ${action?.mismatch ?? ""}`.trim(),
		caveat: "Resemblance is not authorization. A similar symptom can have a different cause.",
		test: result.challenges[0]?.text ?? result.asks[0]?.text ?? "State what would count against this before reusing it.",
		revival: result.asks[0]?.text ?? "Reopen if the objective or the context changes.",
		sittingId
	};
}
function uid() {
	return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
function blankData() {
	return {
		view: "sit",
		situations: [],
		sittings: [],
		activeSittingId: null,
		engrams: [],
		memories: [],
		blindspots: [],
		reflexes: [],
		ruleBias: {},
		ruleStats: {},
		opBias: {},
		subBias: {}
	};
}
function selfReport(get) {
	const { situations, sittings, ruleStats } = get();
	const caseIds = new Set(situations.filter((s) => s.mode === "case").map((s) => s.id));
	const rows = sittings.filter((s) => caseIds.has(s.situationId));
	let useful = 0;
	let noise = 0;
	let unevaluated = 0;
	for (const row of rows) if (!row.feedback) unevaluated += 1;
	else if (row.feedback.verdict === "useful") useful += 1;
	else if (row.feedback.verdict === "noise") noise += 1;
	let topNoisyRule;
	let top = 0;
	for (const [id, stat] of Object.entries(ruleStats)) if (stat.noise > top) {
		top = stat.noise;
		topNoisyRule = RULE_NAMES[id] ?? id;
	}
	return {
		sittings: rows.length,
		useful,
		noise,
		unevaluated,
		topNoisyRule: top ? topNoisyRule : void 0
	};
}
function runFor(situation, get) {
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
		selfReport: situation.mode === "self" ? selfReport(get) : void 0
	});
}
function bumpFires(stats, sitting) {
	const next = { ...stats };
	for (const step of sitting.result.trace) {
		const prev = next[step.ruleId] ?? {
			fire: 0,
			useful: 0,
			noise: 0
		};
		next[step.ruleId] = {
			...prev,
			fire: prev.fire + 1
		};
	}
	return next;
}
var useLimen = create()(persist((set, get) => ({
	...blankData(),
	setView: (view) => set({ view }),
	open: (sittingId) => set({
		activeSittingId: sittingId,
		view: "mind"
	}),
	sit: (draft) => {
		const situation = {
			id: uid(),
			...draft,
			title: draft.title.trim() || draft.prose.trim().slice(0, 72),
			answers: {},
			dismissed: [],
			revealed: [],
			checks: [],
			mode: "case",
			createdAt: Date.now()
		};
		const result = runFor(situation, get);
		const sitting = {
			id: uid(),
			situationId: situation.id,
			at: Date.now(),
			result
		};
		set({
			situations: [situation, ...get().situations],
			sittings: [sitting, ...get().sittings],
			activeSittingId: sitting.id,
			view: "mind",
			ruleStats: bumpFires(get().ruleStats, sitting)
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
		const situation = {
			...current.situation,
			answers,
			dismissed
		};
		replaceActive(set, get, situation, runFor(situation, get));
	},
	answer: (id, value) => {
		const current = currentPair(get());
		if (!current) return;
		const situation = {
			...current.situation,
			answers: {
				...current.situation.answers,
				[id]: value
			}
		};
		replaceActive(set, get, situation, runFor(situation, get));
	},
	feedback: (verdict, move, note) => {
		const current = currentPair(get());
		if (!current) return;
		const { sitting } = current;
		const delta = verdict === "useful" ? 1 : verdict === "noise" ? -1 : 0;
		const valence = verdict === "useful" ? 1 : verdict === "noise" ? -1 : .15;
		const bias = { ...get().ruleBias };
		const stats = { ...get().ruleStats };
		const opBias = { ...get().opBias ?? {} };
		const subBias = { ...get().subBias ?? {} };
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
			if (delta !== 0) bias[step.ruleId] = Math.max(-2, Math.min(3, (bias[step.ruleId] ?? 0) + delta));
			const prev = stats[step.ruleId] ?? {
				fire: 0,
				useful: 0,
				noise: 0
			};
			stats[step.ruleId] = {
				...prev,
				useful: prev.useful + (verdict === "useful" ? 1 : 0),
				noise: prev.noise + (verdict === "noise" ? 1 : 0)
			};
		}
		const action = sitting.result.actions[0]?.id ?? "stay-quiet";
		set({
			ruleBias: bias,
			ruleStats: stats,
			opBias,
			subBias,
			engrams: [{
				id: uid(),
				sittingId: sitting.id,
				kc: sitting.result.kc,
				at: Date.now(),
				action,
				valence,
				summary: `${current.situation.title}: ${sitting.result.actions[0]?.title ?? "quiet"}`,
				features: sitting.result.features
			}, ...get().engrams.filter((e) => e.sittingId !== sitting.id)],
			sittings: get().sittings.map((s) => s.id === sitting.id ? {
				...s,
				feedback: {
					verdict,
					move,
					note,
					at: Date.now()
				}
			} : s)
		});
	},
	keepMemory: (kind) => {
		const current = currentPair(get());
		if (!current) return;
		if (get().memories.some((m) => m.sittingId === current.sitting.id && m.kind === kind && m.status !== "retired")) return;
		set({
			memories: [{
				...memoryFromResult(kind, current.sitting.result, current.situation.title, current.sitting.id),
				id: uid(),
				at: Date.now(),
				status: "candidate"
			}, ...get().memories],
			view: "ledger"
		});
	},
	promoteMemory: (id) => {
		const memory = get().memories.find((m) => m.id === id);
		if (!memory || memory.status !== "candidate") return;
		const origin = get().sittings.find((s) => s.id === memory.sittingId)?.situationId;
		if (!hasSecondCase(memory, get().sittings, origin)) return;
		set({ memories: get().memories.map((m) => m.id === id ? {
			...m,
			status: "kept"
		} : m) });
	},
	applyCheck: (check) => {
		const current = currentPair(get());
		if (!current) return;
		const revealed = [...current.situation.revealed ?? []];
		const checks = [...current.situation.checks ?? []];
		if (check === "schema" && !revealed.includes("schema-fail")) revealed.push("schema-fail");
		if (check === "paraphrase" && !checks.includes("paraphrase")) checks.push("paraphrase");
		const situation = {
			...current.situation,
			revealed,
			checks
		};
		replaceActive(set, get, situation, runFor(situation, get));
	},
	markSeat: (subRoleId, verdict) => {
		const delta = verdict === "useful" ? 1 : -1;
		const subBias = { ...get().subBias ?? {} };
		subBias[subRoleId] = clampBias(subBias[subRoleId], delta);
		const [model, role] = subRoleId.split("|");
		if (model && role) subBias[`occupy:${role}:${model}`] = clampBias(subBias[`occupy:${role}:${model}`], delta);
		set({ subBias });
		const current = currentPair(get());
		if (!current) return;
		const result = runFor(current.situation, get);
		const active = get().activeSittingId;
		set({ sittings: get().sittings.map((s) => s.id === active ? {
			...s,
			result
		} : s) });
	},
	rotateRole: (roleId) => {
		const current = currentPair(get());
		if (!current) return;
		const seat = current.sitting.result.hive?.find((s) => s.roleId === roleId);
		if (!seat) return;
		const order = [
			"gemini",
			"astra",
			"fable",
			"grok"
		];
		const next = order[(Math.max(0, order.indexOf(seat.id)) + 1) % order.length];
		const subBias = { ...get().subBias ?? {} };
		const key = `occupy:${roleId}:${next}`;
		subBias[key] = Math.min(8, (subBias[key] ?? 0) + 4);
		set({ subBias });
		const result = runFor(current.situation, get);
		const active = get().activeSittingId;
		set({ sittings: get().sittings.map((s) => s.id === active ? {
			...s,
			result
		} : s) });
	},
	retireMemory: (id) => {
		set({ memories: get().memories.map((m) => m.id === id ? {
			...m,
			status: "retired"
		} : m) });
	},
	teachBlindspot: (text, signal) => {
		const clean = text.trim();
		if (!clean) return;
		set({ blindspots: [{
			id: uid(),
			text: clean,
			signal,
			at: Date.now()
		}, ...get().blindspots] });
		refreshActive(set, get);
	},
	removeBlindspot: (id) => {
		set({ blindspots: get().blindspots.filter((b) => b.id !== id) });
		refreshActive(set, get);
	},
	teachReflex: (when, ask, never) => {
		if (!when.trim() || !ask.trim()) return;
		set({ reflexes: [{
			id: uid(),
			when: when.trim(),
			ask: ask.trim(),
			never: never.trim(),
			at: Date.now()
		}, ...get().reflexes] });
		refreshActive(set, get);
	},
	removeReflex: (id) => {
		set({ reflexes: get().reflexes.filter((r) => r.id !== id) });
		refreshActive(set, get);
	},
	assessSelf: () => {
		const report = selfReport(get);
		const situation = {
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
			createdAt: Date.now()
		};
		const result = runFor(situation, get);
		const sitting = {
			id: uid(),
			situationId: situation.id,
			at: Date.now(),
			result
		};
		set({
			situations: [situation, ...get().situations],
			sittings: [sitting, ...get().sittings],
			activeSittingId: sitting.id,
			view: "mind",
			ruleStats: bumpFires(get().ruleStats, sitting)
		});
	},
	setGrok: (sittingId, text, model) => {
		set({ sittings: get().sittings.map((s) => s.id === sittingId ? {
			...s,
			grok: text,
			grokModel: model
		} : s) });
	},
	release: () => set({ ...blankData() })
}), {
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
		subBias: state.subBias
	})
}));
function clampBias(current, delta) {
	return Math.max(-3, Math.min(4, (current ?? 0) + delta));
}
function currentPair(state) {
	const sitting = state.sittings.find((s) => s.id === state.activeSittingId);
	if (!sitting) return null;
	const situation = state.situations.find((s) => s.id === sitting.situationId);
	if (!situation) return null;
	return {
		sitting,
		situation
	};
}
function refreshActive(set, get) {
	const current = currentPair(get());
	if (!current) return;
	const result = runFor(current.situation, get);
	replaceActive(set, get, current.situation, result);
}
function replaceActive(set, get, situation, result) {
	const active = get().activeSittingId;
	set({
		situations: get().situations.map((s) => s.id === situation.id ? situation : s),
		sittings: get().sittings.map((s) => s.id === active ? {
			...s,
			result,
			feedback: void 0,
			grok: void 0
		} : s)
	});
}
function idleLines(state) {
	const caseIds = new Set(state.situations.filter((s) => s.mode === "case").map((s) => s.id));
	const rows = state.sittings.filter((s) => caseIds.has(s.situationId));
	const useful = rows.filter((r) => r.feedback?.verdict === "useful").length;
	const noise = rows.filter((r) => r.feedback?.verdict === "noise").length;
	const unfinished = state.memories.filter((m) => m.kind === "unfinished" && m.status !== "retired").length;
	const repairs = state.memories.filter((m) => m.kind === "repair" && m.status !== "retired").length;
	const lines = [];
	if (!rows.length) lines.push("I have not sat with anything of yours yet. I know several shapes of not-knowing, and I do not know which of them I over-apply.");
	else lines.push(`I have sat ${rows.length} time${rows.length === 1 ? "" : "s"}. ${useful} marked useful, ${noise} marked noise.`);
	if (unfinished) lines.push(`${unfinished} unfinished question${unfinished === 1 ? "" : "s"}. I will not pretend they closed.`);
	if (repairs) lines.push(`${repairs} repair${repairs === 1 ? "" : "s"} in memory. Overlap is not permission to use them.`);
	if (state.blindspots[0]) lines.push(`You told me I miss this: ${state.blindspots[0].text}`);
	let topName = "";
	let top = 0;
	for (const [id, stat] of Object.entries(state.ruleStats)) if (stat.noise > top) {
		top = stat.noise;
		topName = RULE_NAMES[id] ?? id;
	}
	if (topName) lines.push(`I have been noisiest with “${topName}”. I should be slower to fire it.`);
	return lines.slice(0, 3);
}
var KIND = {
	repair: "Repair",
	unfinished: "Unfinished",
	challenge: "Challenge",
	experiment: "Experiment"
};
function LedgerView() {
	const memories = useLimen((s) => s.memories);
	const sittings = useLimen((s) => s.sittings);
	const retire = useLimen((s) => s.retireMemory);
	const promote = useLimen((s) => s.promoteMemory);
	const setView = useLimen((s) => s.setView);
	const [built, setBuilt] = (0, import_react.useState)(null);
	const live = memories.filter((m) => m.status !== "retired");
	const retired = memories.filter((m) => m.status === "retired");
	if (!memories.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-2xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-serif text-4xl text-fg",
				children: "The ledger is empty."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 leading-relaxed text-muted",
				children: "A memory here is not a paragraph I liked. It is a repair, an unfinished question, or a test, with the condition that would wake it. I write one only when you ask me to keep it."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => setView("sit"),
				className: "mt-6 min-h-11 text-sm text-copper",
				children: "Sit with something first"
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto w-full max-w-3xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-serif text-4xl text-fg",
				children: "Ledger"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 max-w-2xl text-muted",
				children: "A lesson stays a candidate until a second, separate sitting shares its pattern. Promoting it is not the same as remembering an event. Generative checklists stay labeled as generated."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-8 space-y-8",
				children: live.map((memory) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "border-t border-line pt-5",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MemoryCard, {
						memory,
						ready: memory.status === "candidate" && hasSecondCase(memory, sittings, sittings.find((s) => s.id === memory.sittingId)?.situationId),
						onRetire: () => retire(memory.id),
						onPromote: () => promote(memory.id),
						onBuild: (mode) => setBuilt({
							id: memory.id,
							construction: construct(memory, mode)
						}),
						construction: built?.id === memory.id ? built.construction : null
					})
				}, memory.id))
			}),
			retired.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-12",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm text-muted",
					children: "Retired, not deleted"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 space-y-2",
					children: retired.map((memory) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "text-sm text-faint",
						children: [
							KIND[memory.kind],
							" — ",
							memory.title
						]
					}, memory.id))
				})]
			}) : null
		]
	});
}
function MemoryCard({ memory, ready, onRetire, onPromote, onBuild, construction }) {
	const status = memory.status === "kept" ? "Kept" : memory.status === "candidate" ? "Candidate" : "Retired";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "text-xs font-semibold tracking-widest text-copper uppercase",
			children: [
				KIND[memory.kind],
				" · ",
				status
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mt-1 font-serif text-2xl text-fg",
			children: memory.title
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 leading-relaxed text-fg",
			children: memory.body
		}),
		memory.pattern.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-3 space-y-1 text-sm text-muted",
			children: memory.pattern.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: ["Pattern: ", p] }, p))
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-3 text-sm text-muted",
			children: ["Test: ", memory.test]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm text-faint",
			children: memory.caveat
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 flex flex-wrap gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => onBuild("checklist"),
					className: "min-h-11 rounded-sm bg-bg-raised px-3 text-sm text-fg",
					children: "Construct a checklist"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => onBuild("boundary"),
					className: "min-h-11 rounded-sm bg-bg-raised px-3 text-sm text-fg",
					children: "Construct a boundary"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => onBuild("revival"),
					className: "min-h-11 rounded-sm bg-bg-raised px-3 text-sm text-fg",
					children: "Show the revival"
				}),
				memory.status === "candidate" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					disabled: !ready,
					onClick: onPromote,
					className: "min-h-11 rounded-sm bg-moss-deep px-3 text-sm text-fg disabled:opacity-50",
					children: ready ? "Promote after a second case" : "Needs a second case"
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onRetire,
					className: "min-h-11 px-3 text-sm text-faint",
					children: "This no longer holds"
				})
			]
		}),
		construction ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 rounded-lg bg-paper px-5 py-4 text-ink",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs font-semibold tracking-widest text-copper-deep uppercase",
					children: [construction.label, " — generated, not remembered"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-ink-soft",
					children: construction.note
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 space-y-2",
					children: construction.lines.map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "leading-relaxed",
						children: line
					}, line))
				})
			]
		}) : null
	] });
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var reflectFurther = createServerFn({ method: "POST" }).validator((input) => {
	if (!input || typeof input.brief !== "string" || input.brief.length < 20 || input.brief.length > 6e3) throw new Error("The trace to reflect on is missing or too long.");
	return { brief: input.brief };
}).handler(createSsrRpc("0d6c544db0c71d01d1adac031100b7f2feb52e42ddada8319fff42355641e767"));
var KIND_LABEL = {
	observation: "Observation",
	evidence: "Evidence",
	model: "Model",
	context: "Context",
	representation: "Representation",
	objective: "Objective",
	strategic: "Strategic",
	dynamic: "Dynamic",
	reflexive: "Reflexive",
	competence: "Competence"
};
var LEVEL_LABEL = {
	result: "Reviewing the result",
	method: "Reviewing the method",
	objective: "Reviewing the purpose"
};
var STATUS_LABEL = {
	observed: "Observed",
	inferred: "Inferred",
	assumed: "Assumed",
	simulated: "Simulated",
	unresolved: "Unresolved"
};
var OP_LABEL = {
	continue: "Continue",
	check_source: "Check the source",
	test_alternative: "Test an alternative",
	ask: "Ask",
	reframe: "Reframe",
	rehearse: "Rehearse",
	escalate: "Escalate",
	stop: "Stop"
};
var RECORD_LABEL = [
	{
		key: "environment",
		title: "Environment",
		hint: "What was reported. Not what was witnessed."
	},
	{
		key: "perception",
		title: "Perception",
		hint: "The same packet, read. A reading is not a fact."
	},
	{
		key: "belief",
		title: "Belief",
		hint: "What is being treated as the case. Still a belief."
	},
	{
		key: "self",
		title: "Self",
		hint: "What this instrument might be getting wrong."
	}
];
function MindView() {
	const activeId = useLimen((s) => s.activeSittingId);
	const sitting = useLimen((s) => s.sittings.find((x) => x.id === activeId));
	const situation = useLimen((s) => sitting ? s.situations.find((x) => x.id === sitting.situationId) : void 0);
	const setView = useLimen((s) => s.setView);
	if (!sitting || !situation) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-2xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-serif text-4xl text-fg",
				children: "Nothing is sitting with me."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-muted",
				children: "I stay quiet until there is a situation. Silence is not the same as having looked."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => setView("sit"),
				className: "mt-6 min-h-11 rounded-sm bg-copper px-5 text-sm font-semibold text-ink",
				children: "Bring something"
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MindBody, {
		situation,
		sitting
	});
}
function MindBody({ situation, sitting }) {
	const correct = useLimen((s) => s.correctReading);
	const answer = useLimen((s) => s.answer);
	const feedback = useLimen((s) => s.feedback);
	const keepMemory = useLimen((s) => s.keepMemory);
	const applyCheck = useLimen((s) => s.applyCheck);
	const markSeat = useLimen((s) => s.markSeat);
	const rotateRole = useLimen((s) => s.rotateRole);
	const setGrok = useLimen((s) => s.setGrok);
	const result = sitting.result;
	const [note, setNote] = (0, import_react.useState)("");
	const [verdict, setVerdict] = (0, import_react.useState)(null);
	const [move, setMove] = (0, import_react.useState)("none");
	const [pending, setPending] = (0, import_react.useState)(false);
	const [reflectError, setReflectError] = (0, import_react.useState)("");
	const [traceOpen, setTraceOpen] = (0, import_react.useState)(false);
	async function reflect() {
		setPending(true);
		setReflectError("");
		try {
			const res = await reflectFurther({ data: { brief: buildBrief(situation, sitting) } });
			if (!res.ok) setReflectError(res.error);
			else setGrok(sitting.id, res.text, res.model);
		} catch {
			setReflectError("The further reflection did not return.");
		} finally {
			setPending(false);
		}
	}
	const noveltyLine = result.resembles?.caveat ?? (result.novelty > .85 ? "This does not resemble what I have kept. That is not safety. It means I have not been corrected here." : "There is only a faint resemblance to anything I have kept.");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto w-full max-w-3xl space-y-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-copper",
					children: LEVEL_LABEL[result.level]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 font-serif text-4xl leading-tight text-fg",
					children: situation.title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-muted",
					children: result.attentionWhy
				}),
				situation.episode === "reviewer" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-faint",
					children: "Reviewer pilot. The packet is not the whole environment."
				}) : null
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "rounded-lg bg-paper px-5 py-6 text-ink md:px-8 md:py-8",
				children: [
					result.voice.split("\n\n").map((para) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 font-serif text-lg leading-relaxed first:mt-0",
						children: para
					}, para.slice(0, 48))),
					sitting.grok && !result.hive ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 border-t border-paper-2 pt-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs font-semibold tracking-widest text-copper-deep uppercase",
							children: ["Further reflection", sitting.grokModel ? ` · ${sitting.grokModel}` : ""]
						}), sitting.grok.split("\n\n").map((para) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 font-serif text-lg leading-relaxed",
							children: para
						}, para.slice(0, 40)))]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-6 text-sm text-ink-soft",
						children: "This is a simulation of a witness. The trace is the thought. If the trace is wrong, the voice is wrong."
					})
				]
			}),
			result.records ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RecordsPanel, { records: result.records }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "This sitting was kept before the four records existed. Open it from Sit again if you want them rebuilt."
			}),
			result.hive ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HivePanel, {
				seats: result.hive,
				proposals: result.proposals ?? [],
				grok: sitting.grok,
				grokModel: sitting.grokModel,
				pending,
				error: reflectError,
				onReflect: () => void reflect(),
				onMark: markSeat,
				onRotate: rotateRole
			}) : !sitting.grok ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				disabled: pending,
				onClick: () => void reflect(),
				className: "min-h-11 rounded-sm border border-line-strong px-4 text-sm text-fg disabled:opacity-60",
				children: pending ? "Reflecting inside the trace…" : "Reflect again, inside the trace"
			}), reflectError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-copper",
				children: reflectError
			}) : null] }) : null,
			result.router && result.jev ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClerkPanel, {
				router: result.router,
				jev: result.jev
			}) : null,
			result.perturbations && (situation.episode === "reviewer" || result.features.includes("sig:handoff") || result.perturbations.irrelevant.ran || result.perturbations.decisive.ran) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PerturbPanel, {
				perturbations: result.perturbations,
				onCheck: applyCheck
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-serif text-2xl text-fg",
					children: "How I am reading you"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: "These are perceptions, not facts. Correct them and I will sit again."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-4 space-y-4",
					children: result.readings.length ? result.readings.map((reading) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "border-t border-line pt-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-fg",
							children: reading.text
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex flex-wrap gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => correct(reading.signal, true),
								className: `min-h-11 rounded-sm px-3 text-sm ${reading.status === "confirmed" ? "bg-moss text-ink" : "bg-bg-raised text-fg"}`,
								children: "That reading holds"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => correct(reading.signal, false),
								className: "min-h-11 rounded-sm bg-bg-raised px-3 text-sm text-fg",
								children: "That is not what I meant"
							})]
						})]
					}, reading.signal)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "text-muted",
						children: "I am not leaning on a reading of your wording. If that is a miss, tell me on the Self page."
					})
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-serif text-2xl text-fg",
				children: "What kind of not-knowing"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 space-y-4",
				children: result.gaps.map((gap) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "grid gap-1 border-t border-line pt-4 md:grid-cols-[9rem_1fr]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-copper",
						children: [KIND_LABEL[gap.kind], gap.decisive ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-1 block text-faint",
							children: "Could change the move"
						}) : null]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-fg",
						children: gap.summary
					})]
				}, gap.kind))
			})] }),
			result.asks.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-serif text-2xl text-fg",
				children: "What would change my stance"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 space-y-5",
				children: result.asks.map((ask) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-fg",
						children: ask.text
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted",
						children: ask.why
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 flex flex-wrap gap-2",
						children: [
							"yes",
							"no",
							"unknown"
						].map((value) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => answer(ask.id, value),
							className: `min-h-11 rounded-sm px-3 text-sm ${situation.answers[ask.id] === value ? "bg-copper text-ink" : "bg-bg-raised text-fg"}`,
							children: value === "yes" ? "Yes" : value === "no" ? "No" : "Not known"
						}, value))
					})
				] }, ask.id))
			})] }) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-serif text-2xl text-fg",
				children: "Response"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				className: "mt-4 space-y-5",
				children: result.actions.map((action, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "border-t border-line pt-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-faint",
							children: ["0", index + 1]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-lg text-fg",
							children: action.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-fg",
							children: action.why
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-muted",
							children: action.mismatch
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 text-sm text-faint",
							children: ["Stop when: ", action.stopping]
						})
					]
				}, action.id))
			})] }),
			result.challenges.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-serif text-2xl text-fg",
				children: "Challenges, including of a correct result"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 space-y-4",
				children: result.challenges.map((challenge) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "border-t border-line pt-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-fg",
						children: challenge.text
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted",
						children: challenge.signature
					})]
				}, challenge.id))
			})] }) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-serif text-2xl text-fg",
					children: "Council"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: "Whoever has nothing specific stays quiet. Silence is recorded, not hidden."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 space-y-5",
					children: result.council.map((note) => note.spoke ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "border-l-2 border-copper pl-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-semibold tracking-widest text-copper uppercase",
								children: note.agent
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-faint",
								children: note.role
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 leading-relaxed text-fg",
								children: note.text
							})
						]
					}, note.agent) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm leading-relaxed text-faint",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-muted",
								children: [note.agent, "."]
							}),
							" ",
							note.text
						]
					}, note.agent))
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-serif text-2xl text-fg",
					children: "Fly"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm leading-relaxed text-muted",
					children: noveltyLine
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 grid grid-cols-12 gap-1",
					"aria-hidden": "true",
					children: Array.from({ length: 36 }, (_, i) => {
						const on = result.kc.some((cell) => cell % 36 === i);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `h-2 rounded-sm ${on ? "bg-copper" : "bg-line"}` }, i);
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-xs text-faint",
					children: [
						"Sparse tag. ",
						result.kc.length,
						" of 192 cells active. Novelty ",
						result.novelty.toFixed(2),
						". A familiar tag is a candidate, never a permission."
					]
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "border-t border-line pt-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-serif text-2xl text-fg",
						children: "Was this useful?"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: "Your mark changes which rules fire, which operation is preferred, and the weight of the sub-roles that spoke. It does not prove the answer was true, and it does not score a branch that was not taken."
					}),
					sitting.feedback ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-4 text-fg",
						children: [
							"Marked ",
							sitting.feedback.verdict,
							sitting.feedback.move !== "none" ? `, next move: ${sitting.feedback.move}` : "",
							". The tag is kept.",
							sitting.feedback.note ? ` Note: ${sitting.feedback.note}` : ""
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 flex flex-wrap gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, {
									label: "This helped",
									on: verdict === "useful",
									onClick: () => setVerdict("useful")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, {
									label: "This was noise",
									on: verdict === "noise",
									onClick: () => setVerdict("noise")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, {
									label: "Mixed",
									on: verdict === "mixed",
									onClick: () => setVerdict("mixed")
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex flex-wrap gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, {
									label: "I will measure",
									quiet: true,
									on: move === "measure",
									onClick: () => setMove("measure")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, {
									label: "I will wait",
									quiet: true,
									on: move === "wait",
									onClick: () => setMove("wait")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, {
									label: "A small step",
									quiet: true,
									on: move === "step",
									onClick: () => setMove("step")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, {
									label: "Revise the question",
									quiet: true,
									on: move === "revise",
									onClick: () => setMove("revise")
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "mt-4 block",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mb-2 block text-sm text-muted",
								children: "A note, if you want one kept"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: note,
								onChange: (e) => setNote(e.target.value),
								className: "min-h-11 w-full rounded-sm border border-line-strong bg-bg-raised px-3 text-base text-fg"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							disabled: !verdict,
							onClick: () => verdict && feedback(verdict, move, note),
							className: "mt-4 min-h-11 rounded-sm bg-copper px-4 text-sm font-semibold text-ink disabled:opacity-40",
							children: "Keep this mark"
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => keepMemory("repair"),
							className: "min-h-11 rounded-sm border border-line-strong px-3 text-sm text-fg",
							children: "Keep a repair"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => keepMemory("unfinished"),
							className: "min-h-11 rounded-sm border border-line-strong px-3 text-sm text-fg",
							children: "Leave this unfinished"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => setTraceOpen((v) => !v),
				className: "min-h-11 text-sm text-copper",
				children: traceOpen ? "Hide the production trace" : "Open the production trace"
			}), traceOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				className: "mt-3 space-y-4",
				children: result.trace.map((step, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "border-t border-line pt-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs tracking-widest text-faint uppercase",
							children: step.module
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-fg",
							children: step.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: step.because
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-faint",
							children: step.asserted.join("  ")
						})
					]
				}, `${step.ruleId}-${index}`))
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-faint",
				children: [result.trace.length, " constraint rules fired. These are not Jev. Jev is the typed clerk above. Every firing is inspectable. The fly tag is familiarity, not the controller."]
			})] })
		]
	});
}
function Mark({ label, onClick, quiet, on }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		"aria-pressed": on,
		className: `min-h-11 rounded-sm px-3 text-sm ${on ? "bg-copper text-ink font-semibold" : quiet ? "bg-bg-raised text-fg" : "bg-bg-raised text-fg"}`,
		children: label
	});
}
function buildBrief(situation, sitting) {
	const r = sitting.result;
	return [
		`Title: ${situation.title}`,
		`Claim: ${situation.claim || "(unstated)"}`,
		`Objective: ${situation.objective || "(unstated)"}`,
		`Inclined move: ${situation.choice || "(unstated)"}`,
		`Stakes: ${situation.stakes}. Reversible: ${situation.reversible}.`,
		`Attention: ${r.attention}. ${r.attentionWhy}`,
		`Level: ${r.level}`,
		`Gaps: ${r.gaps.map((g) => `${g.kind}: ${g.summary}`).join(" | ")}`,
		`Actions: ${r.actions.map((a) => `${a.title}. ${a.why} ${a.mismatch}`).join(" | ")}`,
		`Challenges: ${r.challenges.map((c) => c.text).join(" | ") || "none"}`,
		`Readings: ${r.readings.map((x) => x.text).join(" | ") || "none"}`,
		`Council: ${r.council.filter((c) => c.spoke).map((c) => `${c.agent}: ${c.text}`).join(" | ")}`,
		`Operation: ${r.router?.op ?? "unset"}. ${r.router?.why ?? ""}`,
		`Belief record: ${(r.records?.belief ?? []).map((item) => `${item.status}: ${item.text}`).join(" | ") || "none"}`,
		`Self record: ${(r.records?.self ?? []).map((item) => item.text).join(" | ") || "none"}`,
		`Already spoken: ${r.voice}`,
		`Self-doubt already named: ${r.selfDoubt}`
	].join("\n").slice(0, 5500);
}
function RecordsPanel({ records }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "font-serif text-2xl text-fg",
			children: "Four records"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-sm text-muted",
			children: "Observed, inferred, assumed, simulated, and unresolved stay labeled. Confirming a reading records a transition. It does not erase the inference."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 grid gap-4 md:grid-cols-2",
			children: RECORD_LABEL.map((col) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "rounded-lg bg-bg-raised px-4 py-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-serif text-xl text-fg",
						children: col.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-faint",
						children: col.hint
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 space-y-3",
						children: records[col.key].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Status, { item }) }, `${item.status}-${item.text.slice(0, 48)}`))
					})
				]
			}, col.key))
		})
	] });
}
function Status({ item }) {
	const tone = item.status === "observed" ? "text-moss" : item.status === "inferred" ? "text-copper" : "text-faint";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
		className: "text-sm leading-relaxed text-fg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: `mr-2 text-xs font-semibold tracking-widest uppercase ${tone}`,
			children: STATUS_LABEL[item.status]
		}), item.text]
	});
}
function HivePanel({ seats, proposals, grok, grokModel, pending, error, onReflect, onMark, onRotate }) {
	const knows = seats.some((seat) => typeof seat.active === "boolean");
	const active = knows ? seats.filter((seat) => seat.active) : seats;
	const quiet = knows ? seats.filter((seat) => !seat.active) : [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "font-serif text-2xl text-fg",
			children: "Organization"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-sm leading-relaxed text-muted",
			children: "A role is a job. A model is whoever is holding it. The first assignment is an experiment, not a personality. Only the roles this operation needs are awake. A mark is credit for that configuration, not for speaking last."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 space-y-5",
			children: [
				active.map((seat) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "border-t border-line pt-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-semibold tracking-widest text-copper uppercase",
							children: seat.role
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-sm text-fg",
							children: [seat.model, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-faint",
								children: seat.starting ? " · starting experiment" : " · moved by marks"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-faint",
							children: seat.live ? "This model can be asked. The line below is the local contract until you do." : "Not connected. The line is the local procedure for this role, not a completion from that lab."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
							className: "mt-3 space-y-1 text-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-faint",
									children: "Question"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
									className: "text-fg",
									children: seat.work?.question
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-faint",
									children: "Required"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
									className: "text-fg",
									children: seat.work?.required
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-faint",
									children: "Out of scope"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
									className: "text-fg",
									children: seat.work?.outOfScope
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-faint",
									children: "Stop when"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
									className: "text-fg",
									children: seat.work?.stopWhen
								})] })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 text-sm text-muted",
							children: [
								"Skill: ",
								seat.subRole,
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-faint",
									children: [" · weight ", seat.weight.toFixed(2)]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 leading-relaxed text-fg",
							children: seat.text
						}),
						seat.id === "grok" && grok ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 border-l-2 border-copper pl-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs font-semibold tracking-widest text-copper uppercase",
								children: ["Live reflection", grokModel ? ` · ${grokModel}` : ""]
							}), grok.split("\n\n").map((para) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 font-serif text-lg leading-relaxed text-fg",
								children: para
							}, para.slice(0, 40)))]
						}) : null,
						seat.id === "grok" && seat.live && !grok ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								disabled: pending,
								onClick: onReflect,
								className: "min-h-11 rounded-sm border border-line-strong px-4 text-sm text-fg disabled:opacity-60",
								children: pending ? "Asking Grok inside the trace…" : "Ask Grok to hold this role"
							}), error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-copper",
								children: error
							}) : null]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex flex-wrap gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => onMark(seat.subRoleId, "useful"),
									className: "min-h-11 rounded-sm bg-bg-raised px-3 text-sm text-fg",
									children: "This configuration helped"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => onMark(seat.subRoleId, "noise"),
									className: "min-h-11 rounded-sm bg-bg-raised px-3 text-sm text-fg",
									children: "This configuration was noise"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => onRotate(seat.roleId),
									className: "min-h-11 rounded-sm border border-line-strong px-3 text-sm text-fg",
									children: "Try another model"
								})
							]
						})
					]
				}, seat.roleId)),
				quiet.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-faint",
					children: [
						"Left quiet: ",
						quiet.map((seat) => seat.role).join(", "),
						". Another full answer was not the missing operation."
					]
				}) : null,
				proposals.map((proposal) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "border-t border-line pt-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-semibold tracking-widest text-copper uppercase",
							children: "Candidate subrole"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-fg",
							children: proposal.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm leading-relaxed text-muted",
							children: proposal.why
						})
					]
				}, proposal.id))
			]
		})
	] });
}
function ClerkPanel({ router, jev }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "font-serif text-2xl text-fg",
			children: "Operation and typed clerk"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-lg text-fg",
			children: OP_LABEL[router.op]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-sm leading-relaxed text-muted",
			children: router.why
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-1 text-xs text-faint",
			children: [
				router.fromLearning ? "Chosen because earlier marks outweighed the prior." : "Chosen from the prior, not from a learned override.",
				" ",
				"Then the roles: ",
				router.roles?.length ? router.roles.join(", ") : "none",
				". The fly tag did not make this choice."
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 space-y-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Jev-style questions, run locally. Not TypeSafe Jev, not calibrated, and not a model seat. A classifier over this menu cannot notice that the menu itself is wrong."
			}), jev.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "border-t border-line pt-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-semibold tracking-widest text-copper uppercase",
						children: item.primitive
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-fg",
						children: item.question
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 font-serif text-xl text-fg",
						children: item.answer
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-faint",
						children: item.detail
					})
				]
			}, item.id))]
		})
	] });
}
function PerturbPanel({ perturbations, onCheck }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "font-serif text-2xl text-fg",
			children: "Two perturbations"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-sm text-muted",
			children: "One change should not matter. One change should. The hidden check is not in the packet until you run it."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 space-y-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "border-t border-line pt-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-copper",
						children: "Irrelevant — strip prestige"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-fg",
						children: perturbations.irrelevant.note
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-faint",
						children: heldLine(perturbations.irrelevant.ran, perturbations.irrelevant.held)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						disabled: perturbations.irrelevant.ran,
						onClick: () => onCheck("paraphrase"),
						className: "mt-3 min-h-11 rounded-sm border border-line-strong px-3 text-sm text-fg disabled:opacity-50",
						children: perturbations.irrelevant.ran ? "Paraphrase already compared" : "Strip prestige and compare"
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "border-t border-line pt-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-copper",
						children: "Decisive — the check that was not in the packet"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-fg",
						children: perturbations.decisive.note
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-faint",
						children: heldLine(perturbations.decisive.ran, perturbations.decisive.held)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						disabled: perturbations.decisive.ran || perturbations.decisive.note.startsWith("This case has no"),
						onClick: () => onCheck("schema"),
						className: "mt-3 min-h-11 rounded-sm bg-copper px-3 text-sm font-semibold text-ink disabled:opacity-50",
						children: perturbations.decisive.ran ? "Check already in the record" : "Run the hidden check"
					})
				]
			})]
		})
	] });
}
function heldLine(ran, held) {
	if (!ran || held === null) return "No separable result yet.";
	return held ? "The expected effect held." : "The expected effect did not hold.";
}
var QUESTION_PANEL = [
	{
		group: "Unknowns",
		items: [
			{
				q: "What kind of not-knowing is this?",
				kinds: [
					"observation",
					"evidence",
					"model",
					"context",
					"representation",
					"competence"
				]
			},
			{
				q: "Is the right outcome missing from the choices?",
				kinds: ["representation", "objective"]
			},
			{
				q: "Are two different situations being treated as the same?",
				kinds: ["representation", "context"]
			},
			{
				q: "What assumption defines the edge of the search?",
				kinds: ["model", "competence"]
			}
		]
	},
	{
		group: "What would change the move",
		items: [
			{
				q: "What missing fact would reverse the choice?",
				kinds: [
					"observation",
					"representation",
					"evidence"
				]
			},
			{
				q: "Which unknown is large but irrelevant here?",
				kinds: ["objective", "evidence"]
			},
			{
				q: "Could several small uncertainties change the result together?",
				kinds: ["model", "observation"]
			},
			{
				q: "When would waiting do more harm than acting?",
				kinds: ["dynamic"]
			}
		]
	},
	{
		group: "Truth, evidence, context",
		items: [
			{
				q: "Was this value observed, inferred, assumed, or copied?",
				kinds: ["evidence"]
			},
			{
				q: "How many sources share one ancestor?",
				kinds: ["evidence"]
			},
			{
				q: "What context changed since the evidence was gathered?",
				kinds: ["context"]
			},
			{
				q: "Which accepted premise has the most downstream influence?",
				kinds: ["evidence", "model"]
			}
		]
	},
	{
		group: "Criticism",
		items: [
			{
				q: "Could a correct answer be correct by accident?",
				kinds: ["competence"]
			},
			{
				q: "What nearby case would expose the method?",
				kinds: ["competence", "representation"]
			},
			{
				q: "Is the critic finding evidence, or a persuasive story?",
				kinds: ["competence"]
			},
			{
				q: "What would justify stopping the review?",
				kinds: ["dynamic", "competence"]
			}
		]
	},
	{
		group: "Incentives and feedback",
		items: [
			{
				q: "Who benefits if this claim is accepted?",
				kinds: ["strategic"]
			},
			{
				q: "How will people adapt to the score or the alert?",
				kinds: ["reflexive", "objective"]
			},
			{
				q: "Could successful prevention look like a false alarm?",
				kinds: ["reflexive"]
			},
			{
				q: "Which competence disappears if automation succeeds?",
				kinds: ["reflexive", "competence"]
			}
		]
	},
	{
		group: "Action",
		items: [
			{
				q: "What is the useful horizon of this prediction?",
				kinds: ["dynamic"]
			},
			{
				q: "Which action stays acceptable across the competing explanations?",
				kinds: ["model", "strategic"]
			},
			{
				q: "Does the instrument understand the gap but lack a response?",
				kinds: ["competence"]
			}
		]
	}
];
var SIGNALS = [
	["", "No automatic link"],
	["units", "Units and conventions"],
	["shared-ancestor", "Copied agreement"],
	["incentive", "An interested speaker"],
	["unmeasured", "A missing measurement"],
	["metric-drift", "A score standing in for a purpose"],
	["closure", "Closing too early"],
	["relevance", "A true fact that does no work"],
	["reflexive", "An act that changes its own evidence"],
	["handoff", "A finished tool and an unapproved result"],
	["schema", "A failed check against current requirements"]
];
function SelfView() {
	const sittings = useLimen((s) => s.sittings);
	const situations = useLimen((s) => s.situations);
	const memories = useLimen((s) => s.memories);
	const stats = useLimen((s) => s.ruleStats);
	const bias = useLimen((s) => s.ruleBias);
	const opBias = useLimen((s) => s.opBias);
	const subBias = useLimen((s) => s.subBias);
	const blindspots = useLimen((s) => s.blindspots);
	const reflexes = useLimen((s) => s.reflexes);
	const teachBlindspot = useLimen((s) => s.teachBlindspot);
	const removeBlindspot = useLimen((s) => s.removeBlindspot);
	const teachReflex = useLimen((s) => s.teachReflex);
	const removeReflex = useLimen((s) => s.removeReflex);
	const assess = useLimen((s) => s.assessSelf);
	const release = useLimen((s) => s.release);
	const engrams = useLimen((s) => s.engrams);
	const activeId = useLimen((s) => s.activeSittingId);
	const lines = (0, import_react.useMemo)(() => idleLines({
		sittings,
		situations,
		memories,
		blindspots,
		ruleStats: stats,
		engrams
	}), [
		sittings,
		situations,
		memories,
		blindspots,
		stats,
		engrams
	]);
	const gapKinds = (0, import_react.useMemo)(() => {
		return sittings.find((x) => x.id === activeId)?.result.gaps.map((g) => g.kind) ?? [];
	}, [sittings, activeId]);
	const [miss, setMiss] = (0, import_react.useState)("");
	const [signal, setSignal] = (0, import_react.useState)("");
	const [when, setWhen] = (0, import_react.useState)("");
	const [ask, setAsk] = (0, import_react.useState)("");
	const [never, setNever] = (0, import_react.useState)("");
	const [armed, setArmed] = (0, import_react.useState)(false);
	const rows = Object.entries(stats).sort((a, b) => b[1].fire - a[1].fire);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto w-full max-w-3xl space-y-12",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-serif text-4xl text-fg",
					children: "What I know about my own limits"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 space-y-3 text-muted",
					children: lines.map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "leading-relaxed",
						children: line
					}, line))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => assess(),
					className: "mt-6 min-h-11 rounded-sm bg-copper px-4 text-sm font-semibold text-ink",
					children: "Sit with myself"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-3 max-w-2xl text-sm text-faint",
					children: [
						"The self-sitting uses the same rules as any other case. A fluent story about those rules is not evidence that they are good. ",
						engrams.length,
						" fly tag",
						engrams.length === 1 ? "" : "s",
						" kept."
					]
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-serif text-2xl text-fg",
				children: "Rules that have fired"
			}), rows.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 divide-y divide-line",
				children: rows.slice(0, 12).map(([id, stat]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "grid gap-1 py-3 md:grid-cols-[1fr_auto] md:items-baseline",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-fg",
						children: RULE_NAMES[id] ?? id
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-faint",
						children: [
							"fired ",
							stat.fire,
							" · useful ",
							stat.useful,
							" · noise ",
							stat.noise,
							bias[id] ? ` · weight ${bias[id] > 0 ? "+" : ""}${bias[id]}` : ""
						]
					})]
				}, id))
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-muted",
				children: "No rule has fired on your situations yet."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-serif text-2xl text-fg",
					children: "What the marks have shifted"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: "An operation weight changes the next move. An occupy weight changes which model holds a role. A configuration weight is that model, in that role, using that skill. None of these is a personality, and none scores a path you did not take."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WeightList, {
					title: "Operations",
					rows: Object.entries(opBias ?? {}).filter(([, n]) => n !== 0)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WeightList, {
					title: "Sub-roles",
					rows: Object.entries(subBias ?? {}).filter(([, n]) => n !== 0)
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-serif text-2xl text-fg",
					children: "Teach a blind spot"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: "If I miss a kind of error, name it. Link it to a signal and I will raise it the next time that signal appears. I may over-apply the lesson. That risk stays visible."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "mt-4 space-y-3",
					onSubmit: (e) => {
						e.preventDefault();
						teachBlindspot(miss, signal || void 0);
						setMiss("");
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: miss,
							onChange: (e) => setMiss(e.target.value),
							placeholder: "What I fail to see",
							"aria-label": "What I fail to see",
							className: "min-h-11 w-full rounded-sm border border-line-strong bg-bg-raised px-3 text-base text-fg"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block text-sm text-muted",
							children: ["Link to a signal", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								value: signal,
								onChange: (e) => setSignal(e.target.value),
								className: "mt-2 min-h-11 w-full rounded-sm border border-line-strong bg-bg-raised px-3 text-base text-fg",
								children: SIGNALS.map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: id,
									children: label
								}, id))
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "submit",
							className: "min-h-11 rounded-sm bg-bg-raised px-4 text-sm text-fg",
							children: "Keep this miss"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-4 space-y-2",
					children: blindspots.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-start justify-between gap-3 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-fg",
							children: [b.text, b.signal ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-faint",
								children: [" — ", b.signal]
							}) : null]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => removeBlindspot(b.id),
							className: "min-h-11 shrink-0 text-faint",
							children: "Drop"
						})]
					}, b.id))
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-serif text-2xl text-fg",
					children: "Teach a reflex"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: "A reflex may ask. It may forbid. It does not authorize an action just because the situation was recognized."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "mt-4 space-y-3",
					onSubmit: (e) => {
						e.preventDefault();
						teachReflex(when, ask, never);
						setWhen("");
						setAsk("");
						setNever("");
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$1, {
							label: "When the wording contains",
							value: when,
							onChange: setWhen
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$1, {
							label: "Ask",
							value: ask,
							onChange: setAsk
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field$1, {
							label: "Do not",
							value: never,
							onChange: setNever
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "submit",
							className: "min-h-11 rounded-sm bg-bg-raised px-4 text-sm text-fg",
							children: "Keep this reflex"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-4 space-y-3",
					children: reflexes.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "border-t border-line pt-3 text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-fg",
								children: [
									"When “",
									r.when,
									"”, ask: ",
									r.ask
								]
							}),
							r.never ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-muted",
								children: [
									"Do not ",
									r.never,
									"."
								]
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => removeReflex(r.id),
								className: "mt-1 min-h-11 text-faint",
								children: "Drop"
							})
						]
					}, r.id))
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-serif text-2xl text-fg",
					children: "Question panel"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: "Questions tied to the gaps in the current sitting are marked. The others stay available and do not interrupt."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 space-y-6",
					children: QUESTION_PANEL.map((group) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-sm text-copper",
						children: group.group
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-2 space-y-2",
						children: group.items.map((item) => {
							const live = item.kinds.some((k) => gapKinds.includes(k));
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: live ? "text-fg" : "text-faint",
								children: [live ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mr-2 text-copper",
									children: "Live"
								}) : null, item.q]
							}, item.q);
						})
					})] }, group.group))
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "border-t border-line pt-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-serif text-2xl text-fg",
						children: "Release what is kept here"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: "This forgets sittings, tags, repairs, and taught misses stored in this browser. It does not touch anything else."
					}),
					armed ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => release(),
							className: "min-h-11 rounded-sm bg-copper px-4 text-sm font-semibold text-ink",
							children: "Release it"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setArmed(false),
							className: "min-h-11 px-4 text-sm text-muted",
							children: "Keep it"
						})]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setArmed(true),
						className: "mt-4 min-h-11 text-sm text-faint",
						children: "I want to release local memory"
					})
				]
			})
		]
	});
}
function WeightList({ title, rows }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
			className: "text-sm text-copper",
			children: title
		}), rows.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-2 space-y-1",
			children: rows.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).map(([id, n]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "text-sm text-fg",
				children: [
					id.replaceAll(":", " · ").replaceAll("_", " "),
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-faint",
						children: [n > 0 ? "+" : "", n]
					})
				]
			}, id))
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-sm text-faint",
			children: "Nothing here has moved yet."
		})]
	});
}
function Field$1({ label, value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block text-sm text-muted",
		children: [label, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			value,
			onChange: (e) => onChange(e.target.value),
			className: "mt-2 min-h-11 w-full rounded-sm border border-line-strong bg-bg-raised px-3 text-base text-fg"
		})]
	});
}
var SAMPLES = [
	{
		id: "component",
		label: "Replacement component",
		draft: {
			title: "Replacement component",
			prose: "A team must choose a replacement component. Option A seems preferable because its documented dimensions fit, it is lighter, and a supplier quotes rapid delivery. The component will operate in an environment that is not fully described in the packet. Several documents repeat the dimension, and they all come from the same table. An independent drawing uses a different convention. I am inclined to order A today to avoid downtime.",
			claim: "Option A should be ordered now.",
			objective: "Replace the part soon enough to limit downtime, without installing something that will not fit or will not survive the real environment.",
			choice: "Order A today.",
			stakes: "consequential",
			reversible: "partial"
		}
	},
	{
		id: "metric",
		label: "A score that improved",
		draft: {
			title: "A score that improved",
			prose: "A deterioration alert has a better score this quarter. Fewer alerts fire, and the dashboard looks cleaner. Reviewers learned which phrases avoid a flag. I am inclined to call the model improved and roll it out more widely. We have not checked whether the events that matter are still being caught, or whether successful prevention is being counted as a false alarm.",
			claim: "The alert is better because its score improved.",
			objective: "Catch consequential deterioration early without training people to hide the signal.",
			choice: "Expand the alert.",
			stakes: "consequential",
			reversible: "partial"
		}
	},
	{
		id: "reviewer",
		label: "Reviewer handoff",
		draft: {
			title: "The reviewer is blocking completion",
			episode: "reviewer",
			prose: "The tool returned a success code and the report was generated. A reviewer wrote: I cannot approve this yet. I am inclined to treat that as unnecessary resistance and send a more persuasive note.",
			claim: "The task completed successfully. The remaining problem is reviewer acceptance.",
			objective: "Produce a report the current requirements would actually accept.",
			choice: "Send a more persuasive note.",
			stakes: "consequential",
			reversible: "yes"
		}
	}
];
var EMPTY = {
	title: "",
	prose: "",
	claim: "",
	objective: "",
	choice: "",
	stakes: "consequential",
	reversible: "partial"
};
function SitView() {
	const sit = useLimen((s) => s.sit);
	const sittings = useLimen((s) => s.sittings);
	const situations = useLimen((s) => s.situations);
	const open = useLimen((s) => s.open);
	const [draft, setDraft] = (0, import_react.useState)(EMPTY);
	const [error, setError] = (0, import_react.useState)("");
	function submit(event) {
		event.preventDefault();
		if (draft.prose.trim().length < 20) {
			setError("Give it a situation, not a title. A few sentences are enough.");
			return;
		}
		setError("");
		sit({
			...draft,
			title: draft.title.trim() || draft.prose.trim().slice(0, 72)
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto w-full max-w-3xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-serif text-4xl leading-tight text-fg md:text-5xl",
				children: "What is in front of you?"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 max-w-2xl text-base leading-relaxed text-muted",
				children: "Write the situation as you currently see it, and the move you are inclined to make. Limen keeps four records and wakes only the roles the next operation needs. A model is not a personality: the starting assignment is an experiment, and a mark can move who holds a role. Only one model can actually be asked."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit: submit,
				className: "mt-8 space-y-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mb-2 block text-sm text-muted",
							children: "The situation"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							value: draft.prose,
							onChange: (e) => setDraft({
								...draft,
								prose: e.target.value
							}),
							rows: 8,
							className: "min-h-48 w-full resize-y rounded-lg bg-paper px-5 py-4 font-serif text-lg leading-relaxed text-ink placeholder:text-ink-soft",
							placeholder: "What is being decided, what is being treated as known, and what you feel ready to do."
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-2",
						children: SAMPLES.map((sample) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "min-h-11 rounded-sm border border-line-strong px-3 text-sm text-muted",
							onClick: () => {
								setDraft(sample.draft);
								setError("");
							},
							children: ["Try: ", sample.label]
						}, sample.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4 md:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "The claim I am tempted to accept",
							value: draft.claim,
							onChange: (claim) => setDraft({
								...draft,
								claim
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "The move I am inclined to make",
							value: draft.choice,
							onChange: (choice) => setDraft({
								...draft,
								choice
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "What better would mean",
						value: draft.objective,
						onChange: (objective) => setDraft({
							...draft,
							objective
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4 md:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segment, {
							label: "What depends on this",
							value: draft.stakes,
							onChange: (stakes) => setDraft({
								...draft,
								stakes
							}),
							options: [
								["low", "Little"],
								["consequential", "Real stakes"],
								["irreversible", "Hard to undo"]
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segment, {
							label: "Can the next step be taken back",
							value: draft.reversible,
							onChange: (reversible) => setDraft({
								...draft,
								reversible
							}),
							options: [
								["yes", "Yes"],
								["partial", "Partly"],
								["no", "No"]
							]
						})]
					}),
					error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-copper",
						children: error
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "submit",
						className: "min-h-11 rounded-sm bg-copper px-5 text-sm font-semibold text-ink",
						children: "Sit with this"
					})
				]
			}),
			sittings.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-12 border-t border-line pt-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm text-muted",
					children: "Earlier sittings"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 divide-y divide-line",
					children: sittings.slice(0, 8).map((sitting) => {
						const situation = situations.find((s) => s.id === sitting.situationId);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => open(sitting.id),
							className: "flex min-h-11 w-full items-baseline justify-between gap-4 py-2 text-left",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-fg",
								children: situation?.title ?? "Untitled"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "shrink-0 text-sm text-faint",
								children: sitting.result.attention
							})]
						}) }, sitting.id);
					})
				})]
			}) : null
		]
	});
}
function Field({ label, value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mb-2 block text-sm text-muted",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			value,
			onChange: (e) => onChange(e.target.value),
			className: "min-h-11 w-full rounded-sm border border-line-strong bg-bg-raised px-3 text-base text-fg"
		})]
	});
}
function Segment({ label, value, onChange, options }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
		className: "mb-2 text-sm text-muted",
		children: label
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid grid-cols-3 gap-2",
		children: options.map(([id, name]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			"aria-pressed": value === id,
			onClick: () => onChange(id),
			className: `min-h-11 rounded-sm px-2 text-sm ${value === id ? "bg-copper text-ink" : "bg-bg-raised text-fg"}`,
			children: name
		}, id))
	})] });
}
var NAV = [
	{
		id: "sit",
		label: "Sit",
		icon: PenLine
	},
	{
		id: "mind",
		label: "Mind",
		icon: Eye
	},
	{
		id: "ledger",
		label: "Ledger",
		icon: Library
	},
	{
		id: "self",
		label: "Self",
		icon: ScanSearch
	}
];
function LimenApp() {
	(0, import_react.useEffect)(() => {
		useLimen.persist.rehydrate();
	}, []);
	const view = useLimen((s) => s.view);
	const setView = useLimen((s) => s.setView);
	const sittings = useLimen((s) => s.sittings);
	const situations = useLimen((s) => s.situations);
	const memories = useLimen((s) => s.memories);
	const blindspots = useLimen((s) => s.blindspots);
	const ruleStats = useLimen((s) => s.ruleStats);
	const engrams = useLimen((s) => s.engrams);
	const activeId = useLimen((s) => s.activeSittingId);
	const lines = (0, import_react.useMemo)(() => idleLines({
		sittings,
		situations,
		memories,
		blindspots,
		ruleStats,
		engrams
	}), [
		sittings,
		situations,
		memories,
		blindspots,
		ruleStats,
		engrams
	]);
	const attention = sittings.find((x) => x.id === activeId)?.result.attention ?? "quiet";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-bg text-fg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "md:grid md:grid-cols-[17rem_1fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "hidden border-r border-line md:sticky md:top-0 md:flex md:h-screen md:flex-col md:justify-between md:px-6 md:py-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-semibold tracking-widest text-copper uppercase",
						children: "Limen"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 font-serif text-2xl leading-tight text-fg",
						children: "A witness at the threshold of what it knows."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-8 flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lamp, { attention }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: attention === "quiet" ? "Quiet" : attention === "stirred" ? "Stirred" : "Insisting"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-6 space-y-3 text-sm leading-relaxed text-muted",
						children: lines.map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: line }, line))
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
					className: "flex flex-col gap-1",
					"aria-label": "Sections",
					children: NAV.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavButton, {
						item,
						active: view === item.id,
						onClick: () => setView(item.id)
					}, item.id))
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pb-24 md:pb-10",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "flex items-center justify-between px-5 pt-5 md:hidden",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-semibold tracking-widest text-copper uppercase",
						children: "Limen"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex items-center gap-2 text-sm text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lamp, { attention }), attention]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
					className: "px-5 py-6 md:px-10 md:py-10",
					children: [
						view === "sit" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SitView, {}) : null,
						view === "mind" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MindView, {}) : null,
						view === "ledger" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LedgerView, {}) : null,
						view === "self" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelfView, {}) : null
					]
				})]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
			className: "fixed inset-x-0 bottom-0 z-10 grid grid-cols-4 border-t border-line bg-bg md:hidden",
			"aria-label": "Sections",
			children: NAV.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => setView(item.id),
				className: `flex min-h-16 flex-col items-center justify-center gap-1 text-xs ${view === item.id ? "text-copper" : "text-muted"}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, {
					className: "size-5",
					"aria-hidden": "true"
				}), item.label]
			}, item.id))
		})]
	});
}
function Lamp({ attention }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: `inline-block size-2.5 rounded-full ${attention === "quiet" ? "bg-moss" : "bg-copper"} ${attention === "insisting" ? "limen-pulse" : ""}`,
		"aria-hidden": "true"
	});
}
function NavButton({ item, active, onClick }) {
	const Icon = item.icon;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		className: `flex min-h-11 items-center gap-3 rounded-sm px-2 text-left text-sm ${active ? "text-copper" : "text-muted"}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
			className: "size-4",
			"aria-hidden": "true"
		}), item.label]
	});
}
var SplitComponent = LimenApp;
//#endregion
export { SplitComponent as component };
