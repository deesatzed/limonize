import type { CheckActionId, ReleasedObservation } from "./development";

export type DevelopmentWorldScenario = "acceptance_execution" | "source_dependence" | "context_change" | "quiet";

export interface DevelopmentWorldPacket {
  caseId: string;
  runId: string;
  track: "simulated";
  familyId: DevelopmentWorldScenario;
  parentExperienceId: string;
  context: {
    contextVersionId: string;
    objectiveVersionId: string;
    worldVersion: string;
    objective: string;
    decisionContext: string;
  };
  eligibleActions: CheckActionId[];
  observations: ReleasedObservation[];
  budget: { limit: 2; used: number };
  terminal: boolean;
}

export interface DevelopmentWorldExpectation {
  id: string;
  caseId: string;
  runId: string;
  track: "simulated";
  familyId: DevelopmentWorldScenario;
  actionId: CheckActionId;
  contextVersionId: string;
  objectiveVersionId: string;
  worldVersion: string;
}

const actions: CheckActionId[] = ["check-acceptance", "trace-lineage"];
const hash = (value: string): string => {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) result = Math.imul(result ^ value.charCodeAt(index), 16777619);
  return (result >>> 0).toString(16).padStart(8, "0");
};

/** A deterministic, bounded simulator. Hidden outcomes remain in this closure and are never in packets. */
export function createDevelopmentWorld(input: { seed: string; scenario: DevelopmentWorldScenario }) {
  if (!input.seed || !["acceptance_execution", "source_dependence", "context_change", "quiet"].includes(input.scenario)) {
    throw new Error("A seed and known scenario are required");
  }
  const key = `${input.scenario}:${input.seed}`;
  const caseId = `sim-case-${hash(`${key}:case`)}`;
  const runId = `sim-run-${hash(`${key}:run:0`)}`;
  const parentExperienceId = `sim-parent-${hash(`${input.scenario}:family`)}`;
  let contextVersionId = `sim-context-${hash(`${input.scenario}:context:0`)}`;
  let objectiveVersionId = `sim-objective-${hash(`${input.scenario}:objective:0`)}`;
  let worldVersion = `sim-world-${hash(`${input.scenario}:world:0`)}`;
  let used = 0;
  let pending: DevelopmentWorldExpectation | undefined;
  const observed: ReleasedObservation[] = [];
  const selected = new Set<CheckActionId>();

  const packet = (): DevelopmentWorldPacket => ({
    caseId,
    runId,
    track: "simulated",
    familyId: input.scenario,
    parentExperienceId,
    context: {
      contextVersionId,
      objectiveVersionId,
      worldVersion,
      objective: input.scenario === "quiet" ? "Determine whether either available check is warranted." : "Assess the decision using available evidence.",
      decisionContext: input.scenario === "source_dependence" ? "A claim relies on a source that may have changed." : "A decision depends on a reported acceptance and its execution.known state.",
    },
    eligibleActions: actions.filter((action) => !selected.has(action)),
    observations: observed.map((item) => structuredClone(item)),
    budget: { limit: 2, used },
    terminal: used >= 2,
  });

  const prepareCheck = (actionId: CheckActionId): DevelopmentWorldExpectation => {
    if (pending) throw new Error("A check already prepared expectation");
    if (!actions.includes(actionId) || selected.has(actionId)) throw new Error("Action is not eligible");
    if (used >= 2) throw new Error("Check budget exhausted");
    pending = {
      id: `sim-expect-${hash(`${key}:expect:${used}:${actionId}`)}`,
      caseId,
      runId,
      track: "simulated",
      familyId: input.scenario,
      actionId,
      contextVersionId,
      objectiveVersionId,
      worldVersion,
    };
    return { ...pending };
  };

  const releaseCheck = (expectationId: string): { observation: ReleasedObservation; packet: DevelopmentWorldPacket } => {
    if (!pending) throw new Error("A prepared expectation is required before release");
    if (pending.id !== expectationId) throw new Error("Release ID does not match the prepared expectation");
    const current = pending;
    const score = parseInt(hash(`${key}:outcome:${used}:${current.actionId}`), 16) % 8;
    const status: ReleasedObservation["status"] = score === 0 ? "unresolved" : "simulated";
    const result: ReleasedObservation["result"] = status === "unresolved" ? "inconclusive" : score < 4 ? "supports" : "contradicts";
    const observation: ReleasedObservation = {
      id: `sim-observation-${hash(`${key}:observation:${used}:${current.actionId}`)}`,
      caseId,
      runId: current.runId,
      track: "simulated",
      expectationId: current.id,
      source: { kind: "simulation_release", sourceId: `sim-check-${hash(`${key}:check:${used}`)}`, worldVersion: current.worldVersion },
      status,
      result,
    };
    used += 1;
    selected.add(current.actionId);
    observed.push(observation);
    pending = undefined;
    if (input.scenario === "context_change" && used === 1) {
      contextVersionId = `sim-context-${hash(`${input.scenario}:context:1`)}`;
      objectiveVersionId = `sim-objective-${hash(`${input.scenario}:objective:1`)}`;
      worldVersion = `sim-world-${hash(`${input.scenario}:world:1`)}`;
    }
    return { observation: structuredClone(observation), packet: packet() };
  };

  return { packet, prepareCheck, releaseCheck };
}
