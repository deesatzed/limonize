import test from "node:test";
import assert from "node:assert/strict";
import { proposeCommitments } from "./commitments";
import { activePolicyVersions, replayDevelopment, type CheckActionId, type DecisionContext, type DevelopmentEvent } from "./development";
import { prepareAdmission, preparePolicyReviews, prepareReconsideration, prepareRetirement, prepareTestingTransition } from "./policy-review";
import { selectNextCheck } from "./selection";
import { useLimen } from "./store";

const context: DecisionContext = {
  objectiveVersionId: "objective-v1", contextVersionId: "context-v1", stakes: "consequential",
  methodVersion: "method-v1", workflow: "review", worldVersion: "world-v1",
};

function event<K extends DevelopmentEvent["kind"]>(kind: K, payload: Extract<DevelopmentEvent, { kind: K }> ["payload"], sequence: number, id: string): Extract<DevelopmentEvent, { kind: K }> {
  return { id, sequence, at: sequence, schemaVersion: 1, kind, payload } as Extract<DevelopmentEvent, { kind: K }>;
}

function discovery(action: CheckActionId, prefix: string, decisionContext: DecisionContext = context): DevelopmentEvent[] {
  const rows: DevelopmentEvent[] = [];
  let sequence = 1;
  for (const family of ["discovery-a", "discovery-b"]) {
    const tag = `${prefix}-${family}`;
    const expectationId = `expect-${tag}`;
    const observationId = `observation-${tag}`;
    const resolutionId = `resolution-${tag}`;
    rows.push(event("expectation.recorded", { expectation: { id: expectationId, caseId: `case-${tag}`, runId: `run-${tag}`, track: "simulated", familyId: family, context: decisionContext, actionId: action, criterionId: "limen-report-v1", predictedOutcome: "Expected check discriminates this local outcome." } }, sequence++, `expect-event-${tag}`));
    rows.push(event("observation.released", { observation: { id: observationId, caseId: `case-${tag}`, runId: `run-${tag}`, track: "simulated", expectationId, source: { kind: "simulation_release", sourceId: `source-${tag}`, worldVersion: decisionContext.worldVersion! }, status: "simulated", result: "supports" } }, sequence++, `obs-event-${tag}`));
    rows.push(event("expectation.resolved", { resolution: { id: resolutionId, caseId: `case-${tag}`, runId: `run-${tag}`, track: "simulated", expectationId, observationIds: [observationId], status: "supported", methodVersion: decisionContext.methodVersion } }, sequence++, `res-event-${tag}`));
  }
  return rows;
}

function trials(prefixEvents: DevelopmentEvent[], policyVersionId: string, action: CheckActionId, decisionContext: DecisionContext = context): DevelopmentEvent[] {
  const rows: DevelopmentEvent[] = [];
  let sequence = Math.max(...prefixEvents.map((row) => row.sequence)) + 1;
  for (const trialKind of ["support", "quiet"] as const) {
    const tag = `${policyVersionId}-${trialKind}`;
    const familyId = `prospective-${tag}`;
    const caseId = `case-${tag}`;
    const runId = `run-${tag}`;
    const expectationId = `expect-${tag}`;
    const observationId = `observation-${tag}`;
    const resolutionId = `resolution-${tag}`;
    const outcome = trialKind === "support" ? "supports" as const : "inconclusive" as const;
    const trialOutcome = trialKind === "support" ? "supports" as const : "quiet_control" as const;
    const selectedCheckId = trialKind === "support" ? action : "trace-lineage" as const;
    rows.push(event("expectation.recorded", { expectation: { id: expectationId, caseId, runId, track: "simulated", familyId, context: decisionContext, actionId: selectedCheckId, criterionId: "limen-report-v1", predictedOutcome: "Prospective check result." } }, sequence++, `trial-exp-${tag}`));
    rows.push(event("observation.released", { observation: { id: observationId, caseId, runId, track: "simulated", expectationId, source: { kind: "simulation_release", sourceId: `source-${tag}`, worldVersion: decisionContext.worldVersion! }, status: "simulated", result: outcome === "supports" ? "supports" : "inconclusive" } }, sequence++, `trial-obs-${tag}`));
    rows.push(event("expectation.resolved", { resolution: { id: resolutionId, caseId, runId, track: "simulated", expectationId, observationIds: [observationId], status: outcome === "supports" ? "supported" : "inconclusive", methodVersion: decisionContext.methodVersion } }, sequence++, `trial-res-${tag}`));
    rows.push(event("policy.trial_recorded", { trial: { id: `trial-${tag}`, policyVersionId, caseId, runId, track: "simulated", familyId, worldVersion: decisionContext.worldVersion!, resolutionId, outcome: trialOutcome, baselineCheckId: trialKind === "support" ? action === "check-acceptance" ? "trace-lineage" : "check-acceptance" : "trace-lineage", selectedCheckId } }, sequence++, `trial-event-${tag}`));
  }
  return rows;
}

function admittedHistory(action: CheckActionId, decisionContext: DecisionContext = context) {
  const evidence = discovery(action, `training-${action}`, decisionContext);
  const [candidate] = proposeCommitments(evidence);
  assert.ok(candidate);
  const policyId = candidate.payload.policyVersion.id;
  const withCandidate = [...evidence, candidate];
  const reviews = preparePolicyReviews(withCandidate, policyId);
  assert.ok(reviews.findings.every((finding) => finding.verdict === "accepted"));
  const reviewed = [...withCandidate, ...reviews.events];
  const testing = prepareTestingTransition(reviewed, policyId);
  const inTesting = [...reviewed, testing];
  const withTrials = [...inTesting, ...trials(inTesting, policyId, action, decisionContext)];
  const admission = prepareAdmission(withTrials, policyId);
  assert.equal(admission.accepted, true);
  return { events: [...withTrials, admission.event!], policyId };
}

test("three deterministic reviews and a prospective changed success plus quiet control admit only simulation scope", () => {
  const { events } = admittedHistory("check-acceptance");
  const state = replayDevelopment(events);
  assert.equal(state.policies[0]?.lifecycle, "active");
  assert.equal(state.reviews.length, 3);
  assert.equal(state.trials.length, 2);
  assert.equal(activePolicyVersions(state).length, 1);
  assert.equal(state.policies[0]?.track, "simulated");
});

test("removing or changing the attributed history changes the selected action", () => {
  const first = admittedHistory("check-acceptance");
  const baseInput = {
    track: "simulated" as const, context, eligibleChecks: ["check-acceptance", "trace-lineage"] as CheckActionId[],
    baselineCheckId: "trace-lineage" as const, baselineOperation: "ask" as const,
    developmentEnabled: true, learningPaused: false,
  };
  const withHistory = selectNextCheck({ ...baseInput, policies: activePolicyVersions(replayDevelopment(first.events)) });
  const removedHistory = selectNextCheck({ ...baseInput, policies: [] });
  assert.equal(withHistory.selectedCheckId, "check-acceptance");
  assert.equal(withHistory.contributed, true);
  assert.equal(removedHistory.selectedCheckId, "trace-lineage");
  assert.equal(removedHistory.contributed, false);

  const changedHistory = admittedHistory("trace-lineage");
  const changed = selectNextCheck({ ...baseInput, policies: activePolicyVersions(replayDevelopment(changedHistory.events)) });
  assert.equal(changed.selectedCheckId, "trace-lineage");
  assert.equal(changed.contributed, false);
});

test("the store applies a matching learned selection only in the labeled enabled rehearsal and records its application", () => {
  const draft = {
    title: "Selection rehearsal",
    prose: "The report returned a success code, but acceptance has not been checked.",
    claim: "The report is accepted.",
    objective: "Assess acceptance.",
    choice: "Proceed",
    stakes: "consequential" as const,
    reversible: "partial" as const,
    episode: "reviewer" as const,
  };
  const fingerprint = (value: string) => {
    let hash = 0x811c9dc5;
    for (const byte of new TextEncoder().encode(value)) hash = Math.imul(hash ^ byte, 0x01000193);
    return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
  };
  const rehearsalContext: DecisionContext = {
    objectiveVersionId: fingerprint(draft.objective),
    contextVersionId: fingerprint(`${draft.episode}:${draft.stakes}:${draft.reversible}`),
    stakes: draft.stakes,
    methodVersion: "limen-checks-1",
    workflow: "review",
    worldVersion: "luna-world-v1",
  };
  const history = admittedHistory("trace-lineage", rehearsalContext);
  const prior = useLimen.getState();
  try {
    useLimen.setState({
      situations: [], sittings: [], activeSittingId: null, developmentEvents: history.events,
      developmentEnabled: true, learningPaused: false, adaptiveEnabled: false,
    });
    useLimen.getState().sit(draft);
    const state = useLimen.getState();
    const sitting = state.sittings.find((row) => row.id === state.activeSittingId);
    assert.equal(sitting?.result.router.op, "ask");
    assert.equal(sitting?.result.selection?.baselineCheckId, "check-acceptance");
    assert.equal(sitting?.result.selection?.selectedCheckId, "trace-lineage");
    assert.equal(sitting?.result.selection?.contributed, true);
    assert.ok(state.developmentEvents.some((row) => row.kind === "policy.applied" && row.payload.application.runId === sitting?.id));
  } finally {
    useLimen.setState(prior, true);
  }
});

test("missing, rejected, wrong-track, wrong-version and errored review records never activate a candidate", () => {
  const evidence = discovery("check-acceptance", "review-gates");
  const [candidate] = proposeCommitments(evidence);
  assert.ok(candidate);
  const policyId = candidate.payload.policyVersion.id;
  const withCandidate = [...evidence, candidate];
  const reviewPlan = preparePolicyReviews(withCandidate, policyId);
  assert.throws(() => prepareTestingTransition([...withCandidate, ...reviewPlan.events.slice(0, 2)], policyId), /All three current policy reviews must be accepted/);

  const wrongSource = event("expectation.recorded", { expectation: {
    id: "real-source-expectation", caseId: "real-source-case", runId: "real-source-run", track: "real",
    familyId: "real-source-family", context: { objectiveVersionId: "obj", contextVersionId: "ctx", stakes: "low", methodVersion: "method-v1", workflow: "review" },
    actionId: "check-acceptance", criterionId: "limen-report-v1", predictedOutcome: "shape",
  } }, Math.max(...withCandidate.map((row) => row.sequence)) + 1, "real-source-event");
  const wrongTrack = { ...reviewPlan.events[0]!, sequence: wrongSource.sequence + 1, payload: { review: { ...reviewPlan.events[0]!.payload.review, sourceEventIds: [wrongSource.id], reviewedAtSequence: wrongSource.sequence + 1 } } };
  assert.throws(() => replayDevelopment([...withCandidate, wrongSource, wrongTrack]), /review sources must match the reviewed policy track/);

  const rejected = reviewPlan.events.map((row) => row.kind === "policy.reviewed" && row.payload.review.reviewKind === "evidence"
    ? { ...row, payload: { review: { ...row.payload.review, verdict: "rejected" as const } } } : row);
  assert.throws(() => prepareTestingTransition([...withCandidate, ...rejected], policyId), /All three current policy reviews must be accepted/);

  const errored = prepareAdmission([...withCandidate, ...reviewPlan.events], policyId);
  assert.equal(errored.accepted, false);
  assert.match(errored.reason, /in testing/);

  const invalidVerdict = { ...reviewPlan.events[0]!, payload: { review: { ...reviewPlan.events[0]!.payload.review, verdict: "error" as never } } };
  assert.throws(() => replayDevelopment([...withCandidate, invalidVerdict]), /Review verdict is invalid/);

  const priorVersion = candidate.payload.policyVersion;
  const replacement = event("policy.version_recorded", { policyVersion: {
    ...priorVersion, id: `${priorVersion.policyId}:v2`, version: 2, supersedesVersionId: priorVersion.id,
  } }, candidate.sequence + 1, "replacement-policy-version");
  assert.throws(() => preparePolicyReviews([...withCandidate, replacement], policyId), /unavailable or superseded/);
});

test("real user reports without a verified receipt cannot pass the evidence review", () => {
  const realContext: DecisionContext = {
    objectiveVersionId: "objective-real", contextVersionId: "context-real", stakes: "low",
    methodVersion: "method-v1", workflow: "review",
  };
  const prefix: DevelopmentEvent[] = [
    event("expectation.recorded", { expectation: { id: "real-expectation", caseId: "real-case", runId: "real-run", track: "real", familyId: "real-family", context: realContext, actionId: "check-acceptance", criterionId: "limen-report-v1", predictedOutcome: "The report meets the shape criterion." } }, 1, "real-expectation-event"),
    event("observation.released", { observation: { id: "real-observation", caseId: "real-case", runId: "real-run", track: "real", expectationId: "real-expectation", source: { kind: "user_report", sourceId: "reported-outcome" }, status: "reported", result: "supports" } }, 2, "real-observation-event"),
    event("expectation.resolved", { resolution: { id: "real-resolution", caseId: "real-case", runId: "real-run", track: "real", expectationId: "real-expectation", observationIds: ["real-observation"], status: "supported", methodVersion: realContext.methodVersion } }, 3, "real-resolution-event"),
  ];
  const candidate = event("policy.version_recorded", { policyVersion: {
    id: "real-policy-v1", policyId: "real-policy", version: 1, track: "real", scope: { kind: "real_advisory" },
    action: { kind: "prefer_check", actionId: "check-acceptance" }, context: realContext,
    supportResolutionIds: ["real-resolution"], reconsideration: [{ kind: "context_changed" }, { kind: "objective_changed" }, { kind: "method_changed" }, { kind: "support_revoked", resolutionId: "real-resolution" }],
  } }, 4, "real-policy-event");
  const plan = preparePolicyReviews([...prefix, candidate], "real-policy-v1");
  const evidenceFinding = plan.findings.find((finding) => finding.kind === "evidence");
  assert.equal(evidenceFinding?.verdict, "rejected");
  assert.match(evidenceFinding?.reasons.join(" ") ?? "", /verified check receipt/);
});

test("failed gate leaves state in testing and direct active transition cannot bypass the gate", () => {
  const evidence = discovery("check-acceptance", "admission-gate");
  const [candidate] = proposeCommitments(evidence);
  assert.ok(candidate);
  const policyId = candidate.payload.policyVersion.id;
  const withCandidate = [...evidence, candidate];
  const reviews = preparePolicyReviews(withCandidate, policyId).events;
  const reviewed = [...withCandidate, ...reviews];
  const testing = prepareTestingTransition(reviewed, policyId);
  const withoutTrials = [...reviewed, testing];
  const denied = prepareAdmission(withoutTrials, policyId);
  assert.equal(denied.accepted, false);
  assert.equal(replayDevelopment(withoutTrials).policies[0]?.lifecycle, "testing");
  const direct = event("policy.transitioned", { transition: { policyVersionId: policyId, toState: "active", reasonCode: "prospective_trials_passed" } }, Math.max(...withoutTrials.map((row) => row.sequence)) + 1, "direct-active");
  assert.throws(() => replayDevelopment([...withoutTrials, direct]), /requires a changed successful prospective selection/);
});

test("a relevant contradiction suspends an active policy, context changes suspend it, and retirement is explicit", () => {
  const { events, policyId } = admittedHistory("check-acceptance");
  const start = Math.max(...events.map((row) => row.sequence)) + 1;
  const contradiction: DevelopmentEvent[] = [
    event("expectation.recorded", { expectation: { id: "contradiction-expectation", caseId: "contradiction-case", runId: "contradiction-run", track: "simulated", familyId: "contradiction-family", context, actionId: "check-acceptance", criterionId: "limen-report-v1", predictedOutcome: "The check will discriminate." } }, start, "contradiction-expectation-event"),
    event("observation.released", { observation: { id: "contradiction-observation", caseId: "contradiction-case", runId: "contradiction-run", track: "simulated", expectationId: "contradiction-expectation", source: { kind: "simulation_release", sourceId: "contradiction-source", worldVersion: "world-v1" }, status: "simulated", result: "contradicts" } }, start + 1, "contradiction-observation-event"),
    event("expectation.resolved", { resolution: { id: "contradiction-resolution", caseId: "contradiction-case", runId: "contradiction-run", track: "simulated", expectationId: "contradiction-expectation", observationIds: ["contradiction-observation"], status: "contradicted", methodVersion: context.methodVersion } }, start + 2, "contradiction-resolution-event"),
  ];
  const suspension = prepareReconsideration([...events, ...contradiction], policyId, context);
  assert.equal(suspension?.kind, "policy.transitioned");
  assert.equal(suspension?.payload.transition.reasonCode, "contradiction");
  assert.equal(replayDevelopment([...events, ...contradiction, suspension!]).policies[0]?.lifecycle, "suspended");

  const changed = prepareReconsideration(events, policyId, { ...context, objectiveVersionId: "objective-v2" });
  assert.equal(changed?.kind, "policy.transitioned");
  assert.equal(changed?.payload.transition.reasonCode, "objective_changed");
  const retired = prepareRetirement(events, policyId);
  assert.equal(replayDevelopment([...events, retired]).policies[0]?.lifecycle, "retired");
});
