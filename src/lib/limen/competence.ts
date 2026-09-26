import { replayDevelopment, type CheckActionId, type DecisionContext, type DevelopmentEvent, type ExperienceTrack } from "./development";

export interface DerivedCompetence {
  id: string;
  track: ExperienceTrack;
  context: DecisionContext;
  actionId: CheckActionId;
  supportedResolutionIds: string[];
  contradictedResolutionIds: string[];
  unknownResolutionIds: string[];
  counts: { supported: number; contradicted: number; unknown: number };
  independentSupportCount: number;
  independentFamilyIds: string[];
}

function stable(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stable(record[key])}`).join(",")}}`;
}

function digest(value: string): string {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) result = Math.imul(result ^ value.charCodeAt(index), 16777619);
  return (result >>> 0).toString(16).padStart(8, "0");
}

/** Derives summaries only from replay-valid, attributed check resolutions. */
export function deriveCompetence(events: readonly DevelopmentEvent[]): DerivedCompetence[] {
  const replay = replayDevelopment(events);
  const expectationById = new Map(replay.expectations.map((row) => [row.id, row]));
  const observationsById = new Map(replay.observations.map((row) => [row.id, row]));
  const groups = new Map<string, DerivedCompetence>();

  for (const resolution of replay.resolutions) {
    const expectation = expectationById.get(resolution.expectationId);
    if (!expectation) continue;
    const key = stable({ track: resolution.track, context: expectation.context, actionId: expectation.actionId });
    let summary = groups.get(key);
    if (!summary) {
      summary = {
        id: `competence:${digest(key)}`,
        track: resolution.track,
        context: structuredClone(expectation.context),
        actionId: expectation.actionId,
        supportedResolutionIds: [],
        contradictedResolutionIds: [],
        unknownResolutionIds: [],
        counts: { supported: 0, contradicted: 0, unknown: 0 },
        independentSupportCount: 0,
        independentFamilyIds: [],
      };
      groups.set(key, summary);
    }
    const sourceIsAdmissible = resolution.observationIds.some((id) => {
      const source = observationsById.get(id)?.source.kind;
      return (resolution.track === "real" && source === "check_receipt") || (resolution.track === "simulated" && source === "simulation_release");
    });
    const status = sourceIsAdmissible ? resolution.status : "inconclusive";
    if (status === "supported") summary.supportedResolutionIds.push(resolution.id);
    else if (status === "contradicted") summary.contradictedResolutionIds.push(resolution.id);
    else summary.unknownResolutionIds.push(resolution.id);
  }

  for (const summary of groups.values()) {
    for (const ids of [summary.supportedResolutionIds, summary.contradictedResolutionIds, summary.unknownResolutionIds]) ids.sort();
    summary.counts = {
      supported: summary.supportedResolutionIds.length,
      contradicted: summary.contradictedResolutionIds.length,
      unknown: summary.unknownResolutionIds.length,
    };
    const independentFamilies = new Set<string>();
    for (const resolutionId of summary.supportedResolutionIds) {
      const resolution = replay.resolutions.find((row) => row.id === resolutionId)!;
      const expectation = expectationById.get(resolution.expectationId)!;
      if (!expectation.parentExperienceId) independentFamilies.add(expectation.familyId);
    }
    summary.independentFamilyIds = [...independentFamilies].sort();
    summary.independentSupportCount = summary.independentFamilyIds.length;
  }
  return [...groups.values()].sort((a, b) => a.id.localeCompare(b.id));
}
