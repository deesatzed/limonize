import test from "node:test";
import assert from "node:assert/strict";
import {
  activePolicyVersions,
  replayDevelopment,
  type DecisionContext,
  type DevelopmentEvent,
  type ExperienceTrack,
  type ExpectationRecord,
  type PolicyVersionRecord,
} from "./development";

type Kind = DevelopmentEvent["kind"];
type Payload<K extends Kind> = Extract<DevelopmentEvent, { kind: K }>["payload"];

function event<K extends Kind>(kind: K, payload: Payload<K>, sequence: number, id = `event-${sequence}`): DevelopmentEvent {
  return { id, sequence, at: 1_000 + sequence, schemaVersion: 1, kind, payload } as DevelopmentEvent;
}

function context(track: ExperienceTrack = "simulated"): DecisionContext {
  return {
    objectiveVersionId: "objective-1",
    contextVersionId: "context-1",
    stakes: "consequential",
    methodVersion: "limen-checks-1",
    workflow: "review",
    ...(track === "simulated" ? { worldVersion: "acceptance-world-1" } : {}),
  };
}

function learningPrefix(track: ExperienceTrack = "simulated", caseId = "case-discovery", runId = "run-discovery") {
  const expectation = {
    id: "expectation-discovery",
    caseId,
    runId,
    track,
    familyId: "family-discovery",
    context: context(track),
    actionId: "check-acceptance" as const,
    criterionId: "limen-report-v1" as const,
    predictedOutcome: "The acceptance document has the required shape.",
  };
  const observation = {
    id: "observation-discovery",
    caseId,
    runId,
    track,
    expectationId: expectation.id,
    source: track === "simulated"
      ? { kind: "simulation_release" as const, sourceId: "world-observation-1", worldVersion: "acceptance-world-1" }
      : { kind: "user_report" as const, sourceId: "reported-outcome-1" },
    status: track === "simulated" ? "simulated" as const : "reported" as const,
    result: "supports" as const,
  };
  const resolution = {
    id: "resolution-discovery",
    caseId,
    runId,
    track,
    expectationId: expectation.id,
    observationIds: [observation.id],
    status: "supported" as const,
    methodVersion: "limen-checks-1",
  };
  return [
    event("expectation.recorded", { expectation }, 1, "expectation-event"),
    event("observation.released", { observation }, 2, "observation-event"),
    event("expectation.resolved", { resolution }, 3, "resolution-event"),
  ];
}

function policyVersion(overrides: Partial<PolicyVersionRecord> = {}): PolicyVersionRecord {
  return {
    id: "policy-v1",
    policyId: "policy-1",
    version: 1,
    track: "simulated",
    scope: { kind: "simulation", worldVersion: "acceptance-world-1" },
    action: { kind: "prefer_check", actionId: "check-acceptance" },
    context: context(),
    supportResolutionIds: ["resolution-discovery"],
    reconsideration: [{ kind: "contradiction", expectationId: "expectation-discovery" }],
    ...overrides,
  };
}

function reviewEvents(start = 5, policyVersionId = "policy-v1", track: ExperienceTrack = "simulated") {
  return (["contract", "evidence", "continuity"] as const).map((reviewKind, index) =>
    event("policy.reviewed", {
      review: {
        id: `review-${reviewKind}-${policyVersionId}`,
        policyVersionId,
        track,
        reviewKind,
        verdict: "accepted" as const,
        sourceEventIds: ["resolution-event"],
        reviewedAtSequence: start + index,
      },
    }, start + index, `review-event-${reviewKind}-${policyVersionId}`),
  );
}

function prospectiveTrials(start = 8, policyVersionId = "policy-v1") {
  const expSupport = {
    id: "expectation-trial-support", caseId: "case-trial-support", runId: "run-trial-support", track: "simulated" as const,
    familyId: "family-trial-support", context: context(), actionId: "check-acceptance" as const,
    criterionId: "limen-report-v1" as const, predictedOutcome: "The released observation supports this check.",
  };
  const obsSupport = {
    id: "observation-trial-support", caseId: expSupport.caseId, runId: expSupport.runId, track: "simulated" as const,
    expectationId: expSupport.id, source: { kind: "simulation_release" as const, sourceId: "world-observation-support", worldVersion: "acceptance-world-1" },
    status: "simulated" as const, result: "supports" as const,
  };
  const resSupport = {
    id: "resolution-trial-support", caseId: expSupport.caseId, runId: expSupport.runId, track: "simulated" as const,
    expectationId: expSupport.id, observationIds: [obsSupport.id], status: "supported" as const, methodVersion: "limen-checks-1",
  };
  const expQuiet = {
    id: "expectation-trial-quiet", caseId: "case-trial-quiet", runId: "run-trial-quiet", track: "simulated" as const,
    familyId: "family-trial-quiet", context: context(), actionId: "trace-lineage" as const,
    criterionId: "limen-report-v1" as const, predictedOutcome: "The decision remains unchanged if no relevant result appears.",
  };
  const obsQuiet = {
    id: "observation-trial-quiet", caseId: expQuiet.caseId, runId: expQuiet.runId, track: "simulated" as const,
    expectationId: expQuiet.id, source: { kind: "simulation_release" as const, sourceId: "world-observation-quiet", worldVersion: "acceptance-world-1" },
    status: "simulated" as const, result: "inconclusive" as const,
  };
  const resQuiet = {
    id: "resolution-trial-quiet", caseId: expQuiet.caseId, runId: expQuiet.runId, track: "simulated" as const,
    expectationId: expQuiet.id, observationIds: [obsQuiet.id], status: "inconclusive" as const, methodVersion: "limen-checks-1",
  };
  const records = [
    event("expectation.recorded", { expectation: expSupport }, start, "trial-exp-support"),
    event("observation.released", { observation: obsSupport }, start + 1, "trial-obs-support"),
    event("expectation.resolved", { resolution: resSupport }, start + 2, "trial-res-support"),
    event("policy.trial_recorded", { trial: {
      id: "trial-support", policyVersionId, caseId: expSupport.caseId, runId: expSupport.runId, track: "simulated" as const,
      familyId: expSupport.familyId, worldVersion: "acceptance-world-1", resolutionId: resSupport.id,
      outcome: "supports" as const, baselineCheckId: "trace-lineage" as const, selectedCheckId: "check-acceptance" as const,
    } }, start + 3, "trial-event-support"),
    event("expectation.recorded", { expectation: expQuiet }, start + 4, "trial-exp-quiet"),
    event("observation.released", { observation: obsQuiet }, start + 5, "trial-obs-quiet"),
    event("expectation.resolved", { resolution: resQuiet }, start + 6, "trial-res-quiet"),
    event("policy.trial_recorded", { trial: {
      id: "trial-quiet", policyVersionId, caseId: expQuiet.caseId, runId: expQuiet.runId, track: "simulated" as const,
      familyId: expQuiet.familyId, worldVersion: "acceptance-world-1", resolutionId: resQuiet.id,
      outcome: "quiet_control" as const, baselineCheckId: "trace-lineage" as const, selectedCheckId: "trace-lineage" as const,
    } }, start + 7, "trial-event-quiet"),
  ];
  return records;
}

test("replay orders by stable sequence and treats identical event IDs as idempotent", () => {
  const [expectation, observation, resolution] = learningPrefix();
  const replay = replayDevelopment([resolution, observation, expectation, expectation]);
  assert.deepEqual(replay.events.map((row) => row.id), ["expectation-event", "observation-event", "resolution-event"]);
  assert.equal(replay.lastSequence, 3);
  assert.equal(replay.expectations.length, 1);
  assert.equal(replay.observations.length, 1);
  assert.equal(replay.resolutions[0]?.status, "supported");
  assert.deepEqual(replayDevelopment([expectation, observation, resolution]), replay);
});

test("same event ID with changed content and colliding sequences are rejected", () => {
  const [expectation] = learningPrefix();
  const changed = { ...expectation, payload: { expectation: { ...(expectation.payload as { expectation: object }).expectation, predictedOutcome: "changed" } } } as DevelopmentEvent;
  assert.throws(() => replayDevelopment([expectation, changed]), /same event ID has different content/);
  const other = event("dependency.deleted", { dependency: { kind: "case", id: "other-case" } }, 1, "other-event");
  assert.throws(() => replayDevelopment([expectation, other]), /sequence is already used/);
});

test("observations and resolutions require earlier matching expectation and track provenance", () => {
  const [expectation, observation, resolution] = learningPrefix();
  assert.throws(() => replayDevelopment([observation]), /earlier retained event/);
  const wrongTrack = { ...observation, payload: { observation: { ...(observation.payload as { observation: object }).observation, track: "real", source: { kind: "user_report", sourceId: "reported" }, status: "reported" } } } as unknown as DevelopmentEvent;
  assert.throws(() => replayDevelopment([expectation, wrongTrack]), /does not match its earlier expectation and track/);
  const wrongOrder = { ...resolution, sequence: 1, id: "early-resolution" } as DevelopmentEvent;
  assert.throws(() => replayDevelopment([expectation, observation, wrongOrder]), /sequence is already used/);
  assert.equal(replayDevelopment([expectation, observation, resolution]).resolutions.length, 1);
});

test("deletion removes dependent history and later records cannot restore it implicitly", () => {
  const [expectation, observation, resolution] = learningPrefix();
  const deletion = event("dependency.deleted", { dependency: { kind: "case", id: "case-discovery" } }, 4, "delete-case");
  const deleted = replayDevelopment([expectation, observation, resolution, deletion]);
  assert.equal(deleted.expectations.length, 0);
  assert.equal(deleted.observations.length, 0);
  assert.equal(deleted.resolutions.length, 0);
  assert.deepEqual(deleted.deletedDependencies, [{ kind: "case", id: "case-discovery" }]);
  const later = event("expectation.recorded", { expectation: { ...(expectation.payload as { expectation: ExpectationRecord }).expectation, id: "new-expectation" } }, 5, "new-expectation-event");
  assert.throws(() => replayDevelopment([expectation, observation, resolution, deletion, later]), /dependency was deleted/);
});

test("policies can enter testing but activation stays disabled in the contract milestone", () => {
  const prefix = learningPrefix();
  const version = event("policy.version_recorded", { policyVersion: policyVersion() }, 4, "policy-version-v1");
  const reviews = reviewEvents();
  const testing = event("policy.transitioned", { transition: { policyVersionId: "policy-v1", toState: "testing", reasonCode: "candidate_trial" } }, 8, "policy-testing");
  const trials = prospectiveTrials(9);
  const activation = event("policy.transitioned", { transition: { policyVersionId: "policy-v1", toState: "active", reasonCode: "prospective_trials_passed" } }, 17, "policy-active");
  const state = replayDevelopment([...prefix, version, ...reviews, testing, ...trials]);
  assert.equal(state.policies[0]?.lifecycle, "testing");
  assert.equal(activePolicyVersions(state).length, 0);
  assert.throws(() => replayDevelopment([...prefix, version, ...reviews, testing, ...trials, activation]), /not enabled in the typed-contract milestone/);
});

test("a newer policy version shadows its predecessor and cannot silently reactivate it", () => {
  const prefix = learningPrefix();
  const first = event("policy.version_recorded", { policyVersion: policyVersion() }, 4, "policy-version-v1");
  const reviews = reviewEvents();
  const testing = event("policy.transitioned", { transition: { policyVersionId: "policy-v1", toState: "testing", reasonCode: "candidate_trial" } }, 8, "policy-testing");
  const trials = prospectiveTrials(9);
  const secondVersion = event("policy.version_recorded", { policyVersion: policyVersion({ id: "policy-v2", version: 2, supersedesVersionId: "policy-v1", supportResolutionIds: ["resolution-trial-support"] }) }, 18, "policy-version-v2");
  const state = replayDevelopment([...prefix, first, ...reviews, testing, ...trials, secondVersion]);
  assert.equal(state.policies.find((row) => row.id === "policy-v1")?.supersededByVersionId, "policy-v2");
  assert.equal(activePolicyVersions(state).length, 0);
  const staleActivation = event("policy.transitioned", { transition: { policyVersionId: "policy-v1", toState: "active", reasonCode: "prospective_trials_passed" } }, 19, "stale-policy-active");
  assert.throws(() => replayDevelopment([...prefix, first, ...reviews, testing, ...trials, secondVersion, staleActivation]), /not the latest version/);
});

test("real-scope policies remain advisory and learned payloads cannot write controls or executable conditions", () => {
  const prefix = learningPrefix("real");
  const realPolicy = policyVersion({ track: "real", scope: { kind: "real_advisory" }, context: context("real") });
  const version = event("policy.version_recorded", { policyVersion: realPolicy }, 4, "real-policy-v1");
  assert.throws(() => replayDevelopment([...prefix, version, ...reviewEvents(5, realPolicy.id, "real"), event("policy.transitioned", { transition: { policyVersionId: realPolicy.id, toState: "testing", reasonCode: "candidate_trial" } }, 8)]), /Real policies cannot enter an autonomous testing or active lifecycle/);

  const injected = { ...version, payload: { policyVersion: { ...(version.payload as { policyVersion: PolicyVersionRecord }).policyVersion, learningPaused: false } } } as unknown as DevelopmentEvent;
  assert.throws(() => replayDevelopment([...prefix, injected]), /unknown field/);
  const forgedKind = { ...version, kind: "charter.replaced" } as unknown as DevelopmentEvent;
  assert.throws(() => replayDevelopment([...prefix, forgedKind]), /Unknown event kind/);
  const unsafeCondition = event("policy.version_recorded", { policyVersion: policyVersion({ reconsideration: [{ kind: "run_code", code: "return true" }] as never }) }, 4, "unsafe-condition");
  assert.throws(() => replayDevelopment([...learningPrefix(), unsafeCondition]), /Unknown condition kind/);
});
