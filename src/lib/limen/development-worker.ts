import { deriveCompetence } from "./competence";
import { proposeCommitments } from "./commitments";
import { replayDevelopment, type DevelopmentEvent, type PolicyVersionView } from "./development";
import { createDevelopmentWorld, type DevelopmentWorldScenario } from "./development-world";
import { prepareAdmission, preparePolicyReviews, prepareReconsideration, prepareTestingTransition } from "./policy-review";
import type { DevelopmentJobState, PreparedJobResult } from "./development-cycle";
import { SIMULATION_SCOPE_DISPOSITION, type SimulationScopeStatus } from "./scope-disposition";

function event<K extends DevelopmentEvent["kind"]>(kind: K, payload: Extract<DevelopmentEvent, { kind: K }>["payload"], sequence: number, id: string, at: number): Extract<DevelopmentEvent, { kind: K }> {
  return { id, sequence, at, schemaVersion: 1, kind, payload } as Extract<DevelopmentEvent, { kind: K }>;
}

function appendUnique(events: DevelopmentEvent[], additions: DevelopmentEvent[]): DevelopmentEvent[] {
  const replay = replayDevelopment(events);
  const known = new Set(replay.events.map((row) => row.id));
  const novel = additions.filter((row) => !known.has(row.id));
  return novel.length ? replayDevelopment([...replay.events, ...novel]).events : replay.events;
}

function derive(events: DevelopmentEvent[], at: number): DevelopmentEvent[] {
  const replay = replayDevelopment(events);
  const existing = new Set(replay.competence.map((row) => row.id));
  let sequence = replay.lastSequence + 1;
  const rows = deriveCompetence(replay.events).filter((row) => !existing.has(row.id)).map((summary) => event("competence.derived", {
    summary: {
      id: summary.id, track: summary.track, context: summary.context, actionId: summary.actionId,
      supportedResolutionIds: summary.supportedResolutionIds,
      contradictedResolutionIds: summary.contradictedResolutionIds,
      unknownResolutionIds: summary.unknownResolutionIds,
      counts: summary.counts,
    },
  }, sequence++, `competence-derived:${summary.id}`, at));
  return appendUnique(events, rows);
}

function consider(events: DevelopmentEvent[], sourceEventId: string, at: number): DevelopmentEvent[] {
  const replay = replayDevelopment(events);
  const source = replay.events.find((row) => row.id === sourceEventId);
  if (source?.kind !== "expectation.resolved") return events;
  const resolution = replay.resolutions.find((row) => row.id === source.payload.resolution.id);
  const expectation = resolution && replay.expectations.find((row) => row.id === resolution.expectationId);
  if (!expectation) return events;
  const additions: DevelopmentEvent[] = proposeCommitments(replay.events);
  for (const policy of replay.policies) {
    const policyEvent = replay.events.find((event) => event.kind === "policy.version_recorded" && event.payload.policyVersion.id === policy.id);
    if (!policyEvent || source.sequence <= policyEvent.sequence) continue;
    const transition = prepareReconsideration([...replay.events, ...additions], policy.id, expectation.context);
    if (transition) additions.push(transition);
  }
  return appendUnique(events, additions.map((row) => ({ ...row, at })));
}

function makeTrial(events: DevelopmentEvent[], policy: PolicyVersionView, scenario: DevelopmentWorldScenario, at: number): { events: DevelopmentEvent[]; episodes: number } {
  if (policy.action.kind !== "prefer_check" || policy.scope.kind !== "simulation") return { events, episodes: 0 };
  const seed = `${policy.id}:prospective:${scenario}`;
  const world = createDevelopmentWorld({ seed, scenario });
  const packet = world.packet();
  if (packet.context.contextVersionId !== policy.context.contextVersionId
    || packet.context.objectiveVersionId !== policy.context.objectiveVersionId
    || packet.context.worldVersion !== policy.scope.worldVersion
    || packet.context.worldVersion !== policy.context.worldVersion) return { events, episodes: 0 };
  const baselineCheckId = policy.action.actionId === "check-acceptance" ? "trace-lineage" : "check-acceptance";
  const selectedCheckId = scenario === "quiet" ? baselineCheckId : policy.action.actionId;
  if (!packet.eligibleActions.includes(selectedCheckId)) return { events, episodes: 0 };
  const expectation = world.prepareCheck(selectedCheckId);
  const replay = replayDevelopment(events);
  let sequence = replay.lastSequence + 1;
  const context = {
    objectiveVersionId: packet.context.objectiveVersionId,
    contextVersionId: packet.context.contextVersionId,
    stakes: policy.context.stakes,
    methodVersion: policy.context.methodVersion,
    workflow: policy.context.workflow,
    worldVersion: packet.context.worldVersion,
  } as const;
  const expectationId = `${expectation.id}:${policy.id}`;
  const observationId = `sim-observation:${expectationId}`;
  const runId = `${expectation.runId}:${policy.id}`;
  const caseId = `${expectation.caseId}:${policy.id}`;
  const familyId = `prospective:${policy.id}:${scenario}`;
  const prepared: DevelopmentEvent[] = [event("expectation.recorded", { expectation: {
    id: expectationId, caseId, runId, track: "simulated", familyId, context,
    actionId: selectedCheckId, criterionId: "limen-report-v1",
    predictedOutcome: "The released simulation observation is evaluated against this named check.",
  } }, sequence++, `trial-expectation:${expectationId}`, at)];
  const released = world.releaseCheck(expectation.id).observation;
  const observation = { ...released, id: observationId, caseId, runId, expectationId };
  prepared.push(event("observation.released", { observation }, sequence++, `trial-observation:${expectationId}`, at));
  const status = observation.result === "supports" ? "supported" : observation.result === "contradicts" ? "contradicted" : "inconclusive";
  const resolutionId = `trial-resolution:${expectationId}`;
  prepared.push(event("expectation.resolved", { resolution: {
    id: resolutionId, caseId, runId, track: "simulated", expectationId,
    observationIds: [observationId], status, methodVersion: policy.context.methodVersion,
  } }, sequence++, `trial-resolution-event:${expectationId}`, at));
  if (scenario === "quiet" || status !== "inconclusive") {
    const outcome = scenario === "quiet" ? "quiet_control" : status === "supported" ? "supports" : "contradicts";
    prepared.push(event("policy.trial_recorded", { trial: {
      id: `trial:${expectationId}`, policyVersionId: policy.id, caseId, runId,
      track: "simulated", familyId, worldVersion: packet.context.worldVersion,
      resolutionId, outcome, baselineCheckId, selectedCheckId,
    } }, sequence++, `trial-event:${expectationId}`, at));
  }
  return { events: appendUnique(events, prepared), episodes: 1 };
}

/** Performs one deterministic, bounded job using only replayed events and released world observations. */
export function prepareDevelopmentJob(events: DevelopmentEvent[], job: DevelopmentJobState, maxSimulatedEpisodes: number, at: number, simulationScope: SimulationScopeStatus = SIMULATION_SCOPE_DISPOSITION.status): PreparedJobResult<DevelopmentEvent[]> {
  const replay = replayDevelopment(events);
  const source = replay.events.find((row) => row.id === job.sourceEventId);
  if (!source) return { progressed: false, simulatedEpisodes: 0 };
  if (job.jobKind === "derive_competence") return { progressed: true, simulatedEpisodes: 0, prepared: derive(events, at) };
  if (job.jobKind === "consider_policy") return { progressed: true, simulatedEpisodes: 0, prepared: consider(events, job.sourceEventId, at) };
  if (source.kind !== "policy.version_recorded" || source.payload.policyVersion.track !== "simulated" || maxSimulatedEpisodes < 2) {
    return { progressed: false, simulatedEpisodes: 0 };
  }
  let prepared = events;
  const policyId = source.payload.policyVersion.id;
  let latestPolicy = replayDevelopment(prepared).policies.find((row) => row.id === policyId);
  if (!latestPolicy || latestPolicy.supersededByVersionId || latestPolicy.lifecycle === "suspended" || latestPolicy.lifecycle === "retired") {
    return { progressed: true, simulatedEpisodes: 0, prepared };
  }
  if (latestPolicy.track !== "simulated" || latestPolicy.scope.kind !== "simulation") return { progressed: true, simulatedEpisodes: 0, prepared };
  const initialPacket = createDevelopmentWorld({ seed: `${latestPolicy.id}:prospective:acceptance_execution`, scenario: "acceptance_execution" }).packet();
  if (initialPacket.context.contextVersionId !== latestPolicy.context.contextVersionId
    || initialPacket.context.objectiveVersionId !== latestPolicy.context.objectiveVersionId
    || initialPacket.context.worldVersion !== latestPolicy.scope.worldVersion
    || initialPacket.context.worldVersion !== latestPolicy.context.worldVersion) return { progressed: false, simulatedEpisodes: 0 };
  if (latestPolicy.lifecycle === "candidate") {
    const reviews = preparePolicyReviews(prepared, policyId);
    prepared = appendUnique(prepared, reviews.events.map((row) => ({ ...row, at })));
    if (reviews.findings.some((finding) => finding.verdict !== "accepted")) return { progressed: true, simulatedEpisodes: 0, prepared };
    prepared = appendUnique(prepared, [prepareTestingTransition(prepared, policyId)]);
    latestPolicy = replayDevelopment(prepared).policies.find((row) => row.id === policyId);
  }
  if (!latestPolicy || latestPolicy.lifecycle !== "testing") return { progressed: true, simulatedEpisodes: 0, prepared };
  let episodes = 0;
  for (const scenario of ["acceptance_execution", "quiet"] as const) {
    if (episodes >= maxSimulatedEpisodes) break;
    const trial = makeTrial(prepared, latestPolicy, scenario, at);
    prepared = trial.events;
    episodes += trial.episodes;
  }
  const admission = prepareAdmission(prepared, policyId);
  if (admission.accepted && admission.event && simulationScope === "active") prepared = appendUnique(prepared, [{ ...admission.event, at }]);
  return { progressed: true, simulatedEpisodes: episodes, prepared };
}
