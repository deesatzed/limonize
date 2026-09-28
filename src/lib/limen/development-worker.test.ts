import test from "node:test";
import assert from "node:assert/strict";
import { replayDevelopment, type DecisionContext, type DevelopmentEvent } from "./development";
import { createDevelopmentWorld } from "./development-world";
import { prepareDevelopmentJob } from "./development-worker";
import { proposeCommitments } from "./commitments";
import { deriveCompetence } from "./competence";
import type { DevelopmentJobState } from "./development-cycle";

function discovery(): DevelopmentEvent[] {
  const publicContext = createDevelopmentWorld({ seed: "training-context", scenario: "acceptance_execution" }).packet().context;
  const context: DecisionContext = {
    objectiveVersionId: publicContext.objectiveVersionId,
    contextVersionId: publicContext.contextVersionId,
    stakes: "consequential",
    methodVersion: "limen-checks-1",
    workflow: "review",
    worldVersion: publicContext.worldVersion,
  };
  const events: DevelopmentEvent[] = [];
  let sequence = 1;
  for (const familyId of ["training-family-a", "training-family-b"]) {
    const expectationId = `expectation-${familyId}`;
    const observationId = `observation-${familyId}`;
    const resolutionId = `resolution-${familyId}`;
    const caseId = `case-${familyId}`;
    const runId = `run-${familyId}`;
    events.push(
      { id: `event-expectation-${familyId}`, sequence: sequence++, at: sequence, schemaVersion: 1, kind: "expectation.recorded", payload: { expectation: { id: expectationId, caseId, runId, track: "simulated", familyId, context, actionId: "check-acceptance", criterionId: "limen-report-v1", predictedOutcome: "The simulated check provides discriminating evidence." } } },
      { id: `event-observation-${familyId}`, sequence: sequence++, at: sequence, schemaVersion: 1, kind: "observation.released", payload: { observation: { id: observationId, caseId, runId, track: "simulated", expectationId, source: { kind: "simulation_release", sourceId: `release-${familyId}`, worldVersion: context.worldVersion! }, status: "simulated", result: "supports" } } },
      { id: `event-resolution-${familyId}`, sequence: sequence++, at: sequence, schemaVersion: 1, kind: "expectation.resolved", payload: { resolution: { id: resolutionId, caseId, runId, track: "simulated", expectationId, observationIds: [observationId], status: "supported", methodVersion: context.methodVersion } } },
    );
  }
  return replayDevelopment(events).events;
}

test("a queued simulated candidate is reviewed, prospectively tried, and admitted only from released results", () => {
  const sourceEvents = discovery();
  const candidateJob: DevelopmentJobState = {
    id: "candidate-job", sourceEventId: sourceEvents.at(-1)!.id,
    jobKind: "consider_policy", inputVersion: "luna-cycle-v1", status: "queued", createdAt: 20,
  };
  const candidate = prepareDevelopmentJob(sourceEvents, candidateJob, 0, 21);
  assert.equal(candidate.progressed, true);
  const withCandidate = replayDevelopment(candidate.prepared!).events;
  const policyEvent = withCandidate.find((event) => event.kind === "policy.version_recorded");
  assert.ok(policyEvent?.kind === "policy.version_recorded");
  const trialJob: DevelopmentJobState = {
    id: "trial-job", sourceEventId: policyEvent.id,
    jobKind: "trial_policy", inputVersion: "luna-cycle-v1", status: "queued", createdAt: 22,
  };
  const trial = prepareDevelopmentJob(withCandidate, trialJob, 2, 23, "active");
  assert.equal(trial.progressed, true);
  assert.equal(trial.simulatedEpisodes, 2);
  const replay = replayDevelopment(trial.prepared!);
  assert.deepEqual(deriveCompetence(trial.prepared!).map((row) => row.supportedResolutionIds), deriveCompetence(withCandidate).map((row) => row.supportedResolutionIds));
  assert.equal(replay.reviews.length, 3);
  assert.equal(replay.trials.length, 2);
  assert.ok(replay.trials.some((row) => row.outcome === "quiet_control"));
  assert.equal(replay.policies[0]?.lifecycle, "active");
  assert.ok(replay.trials.some((row) => row.outcome === "supports" && row.selectedCheckId !== row.baselineCheckId));
});

test("the reviewed trial remains in testing while the protected benefit disposition is shadow", () => {
  const sourceEvents = discovery();
  const candidate = proposeCommitments(sourceEvents)[0];
  assert.ok(candidate);
  const withCandidate = replayDevelopment([...sourceEvents, candidate]).events;
  const job: DevelopmentJobState = {
    id: "shadow-trial-job", sourceEventId: candidate.id,
    jobKind: "trial_policy", inputVersion: "luna-cycle-v1", status: "queued", createdAt: 22,
  };
  const trial = prepareDevelopmentJob(withCandidate, job, 2, 23);
  assert.equal(trial.progressed, true);
  assert.equal(replayDevelopment(trial.prepared!).policies[0]?.lifecycle, "testing");
  assert.equal(replayDevelopment(trial.prepared!).trials.length, 2);
});

test("a candidate from a changed simulator context stays pending instead of borrowing another context's trials", () => {
  const source = discovery().map((row): DevelopmentEvent => {
    if (row.kind === "expectation.recorded") return { ...row, payload: { expectation: { ...row.payload.expectation, context: { ...row.payload.expectation.context, worldVersion: "luna-world-v2" } } } };
    if (row.kind === "observation.released" && row.payload.observation.source.kind === "simulation_release") return { ...row, payload: { observation: { ...row.payload.observation, source: { ...row.payload.observation.source, worldVersion: "luna-world-v2" } } } };
    return row;
  });
  const events = replayDevelopment(source).events;
  const candidate = proposeCommitments(events)[0];
  assert.ok(candidate);
  const rows = replayDevelopment([...events, candidate]).events;
  const job: DevelopmentJobState = { id: "changed-context-job", sourceEventId: candidate.id, jobKind: "trial_policy", inputVersion: "luna-cycle-v1", status: "queued", createdAt: 31 };
  const prepared = prepareDevelopmentJob(rows, job, 2, 32);
  assert.equal(prepared.progressed, false);
  assert.equal(prepared.simulatedEpisodes, 0);
  assert.equal(prepared.prepared, undefined);
});
