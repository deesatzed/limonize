import { activePolicyVersions, replayDevelopment, type DecisionContext, type DevelopmentEvent } from "./development";
import { createDevelopmentWorld, type DevelopmentWorldScenario } from "./development-world";
import { selectNextCheck } from "./selection";

function event<K extends DevelopmentEvent["kind"]>(kind: K, payload: Extract<DevelopmentEvent, { kind: K }>["payload"], sequence: number, id: string, at: number): DevelopmentEvent {
  return { id, sequence, at, schemaVersion: 1, kind, payload } as DevelopmentEvent;
}

const TRAINING_SCENARIOS: DevelopmentWorldScenario[] = ["acceptance_execution", "source_dependence", "context_change"];

/** Creates attributed training observations from public simulated checks only. */
export function createLocalRehearsalEvents(existing: readonly DevelopmentEvent[], seed: string, at = 0): DevelopmentEvent[] {
  let rows = replayDevelopment(existing).events;
  let sequence = replayDevelopment(rows).lastSequence + 1;
  for (const scenario of TRAINING_SCENARIOS) {
    const world = createDevelopmentWorld({ seed: `${seed}:${scenario}`, scenario });
    while (!world.packet().terminal) {
      const packet = world.packet();
      const actionId = packet.eligibleActions[0];
      if (!actionId) break;
      const prepared = world.prepareCheck(actionId);
      const context: DecisionContext = {
        objectiveVersionId: packet.context.objectiveVersionId,
        contextVersionId: packet.context.contextVersionId,
        stakes: "consequential",
        methodVersion: "limen-checks-1",
        workflow: "review",
        worldVersion: packet.context.worldVersion,
      };
      const expectationId = `rehearsal-expectation:${seed}:${scenario}:${packet.budget.used}:${actionId}`;
      const expectationEvent = event("expectation.recorded", { expectation: {
        id: expectationId, caseId: packet.caseId, runId: packet.runId, track: "simulated",
        familyId: scenario, context, actionId, criterionId: "limen-report-v1",
        predictedOutcome: "The next public simulation release bears on this named check.",
      } }, sequence++, `rehearsal-expectation-event:${expectationId}`, at);
      rows = replayDevelopment([...rows, expectationEvent]).events;
      const release = world.releaseCheck(prepared.id).observation;
      const observation = { ...release, id: `rehearsal-observation:${expectationId}`, caseId: packet.caseId, runId: packet.runId, expectationId };
      const observationEvent = event("observation.released", { observation }, sequence++, `rehearsal-observation-event:${expectationId}`, at);
      rows = replayDevelopment([...rows, observationEvent]).events;
      const status = observation.result === "supports" ? "supported" : observation.result === "contradicts" ? "contradicted" : "inconclusive";
      const resolutionEvent = event("expectation.resolved", { resolution: {
        id: `rehearsal-resolution:${expectationId}`, caseId: packet.caseId, runId: packet.runId,
        track: "simulated", expectationId, observationIds: [observation.id], status,
        methodVersion: context.methodVersion,
      } }, sequence++, `rehearsal-resolution-event:${expectationId}`, at);
      rows = replayDevelopment([...rows, resolutionEvent]).events;
    }
  }
  return rows;
}

/** Records one fresh, non-training simulated selection/application if learned history changes the baseline. */
export function createLocalRehearsalApplication(existing: readonly DevelopmentEvent[], seed: string, at = 0): DevelopmentEvent[] {
  const replay = replayDevelopment(existing);
  const policies = activePolicyVersions(replay);
  for (const policy of policies) {
    if (policy.action.kind !== "prefer_check" || policy.scope.kind !== "simulation") continue;
    const world = createDevelopmentWorld({ seed: `${seed}:application:${policy.id}`, scenario: "acceptance_execution" });
    const packet = world.packet();
    const context: DecisionContext = {
      objectiveVersionId: packet.context.objectiveVersionId,
      contextVersionId: packet.context.contextVersionId,
      stakes: policy.context.stakes,
      methodVersion: policy.context.methodVersion,
      workflow: policy.context.workflow,
      worldVersion: packet.context.worldVersion,
    };
    const baselineCheckId = policy.action.actionId === "check-acceptance" ? "trace-lineage" : "check-acceptance";
    const selection = selectNextCheck({
      track: "simulated", context, eligibleChecks: packet.eligibleActions,
      baselineCheckId, baselineOperation: "ask", policies,
      developmentEnabled: true, learningPaused: false,
    });
    if (!selection.contributed || !selection.selectedCheckId || !selection.baselineCheckId) continue;
    const selectedPolicy = policies.find((row) => row.id === selection.policyVersionIds[0]);
    if (!selectedPolicy || selectedPolicy.action.kind !== "prefer_check") continue;
    const prepared = world.prepareCheck(selection.selectedCheckId);
    const expectationId = `rehearsal-application-expectation:${seed}:${policy.id}`;
    const expectation = event("expectation.recorded", { expectation: {
      id: expectationId, caseId: packet.caseId, runId: packet.runId, track: "simulated",
      familyId: "rehearsal-application", context, actionId: selection.selectedCheckId,
      criterionId: "limen-report-v1", predictedOutcome: "A new simulated check follows the context-matched selection.",
    } }, replay.lastSequence + 1, `rehearsal-application-expectation-event:${expectationId}`, at);
    const release = world.releaseCheck(prepared.id).observation;
    const observation = { ...release, id: `rehearsal-application-observation:${expectationId}`, caseId: packet.caseId, runId: packet.runId, expectationId };
    const observationEvent = event("observation.released", { observation }, replay.lastSequence + 2, `rehearsal-application-observation-event:${expectationId}`, at);
    const status = observation.result === "supports" ? "supported" : observation.result === "contradicts" ? "contradicted" : "inconclusive";
    const resolutionId = `rehearsal-application-resolution:${expectationId}`;
    const resolutionEvent = event("expectation.resolved", { resolution: {
      id: resolutionId, caseId: packet.caseId, runId: packet.runId, track: "simulated",
      expectationId, observationIds: [observation.id], status, methodVersion: context.methodVersion,
    } }, replay.lastSequence + 3, `rehearsal-application-resolution-event:${expectationId}`, at);
    const policySource = replay.events.find((row) => row.kind === "policy.version_recorded" && row.payload.policyVersion.id === selectedPolicy.id);
    const supportEventIds = selectedPolicy.supportResolutionIds.map((id) => replay.events.find((row) => row.kind === "expectation.resolved" && row.payload.resolution.id === id)?.id).filter((id): id is string => Boolean(id));
    if (!policySource || supportEventIds.length !== selectedPolicy.supportResolutionIds.length) continue;
    const application = event("policy.applied", { application: {
      id: `rehearsal-application:${seed}:${selectedPolicy.id}`, policyVersionId: selectedPolicy.id,
      caseId: packet.caseId, runId: packet.runId, track: "simulated",
      baselineCheckId: selection.baselineCheckId, selectedCheckId: selection.selectedCheckId,
      sourceEventIds: [policySource.id, ...supportEventIds], contributed: true, costUnits: selection.costUnits,
    } }, replay.lastSequence + 4, `rehearsal-application-event:${seed}:${selectedPolicy.id}`, at);
    return replayDevelopment([...replay.events, expectation, observationEvent, resolutionEvent, application]).events;
  }
  return replay.events;
}
