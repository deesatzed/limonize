import { replayDevelopment, type CheckActionId, type DevelopmentEvent, type ExperienceTrack, type PolicyVersionRecord, type ReconsiderationCondition } from "./development";
import { deriveCompetence } from "./competence";

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

/** Proposes inert, evidence-linked candidates; admission and runtime selection belong to later tasks. */
export function proposeCommitments(events: readonly DevelopmentEvent[]): Extract<DevelopmentEvent, { kind: "policy.version_recorded" }>[] {
  const replay = replayDevelopment(events);
  const summaries = deriveCompetence(replay.events);
  const latest = new Map<string, number>();
  for (const policy of replay.policies) latest.set(policy.policyId, Math.max(latest.get(policy.policyId) ?? 0, policy.version));
  const proposals: Extract<DevelopmentEvent, { kind: "policy.version_recorded" }>[] = [];

  for (const profile of summaries) {
    if (profile.independentSupportCount < 2 || profile.counts.supported <= profile.counts.contradicted) continue;
    const track: ExperienceTrack = profile.track;
    const key = stable({ track, context: profile.context, actionId: profile.actionId });
    const policyId = `commitment:${digest(key)}`;
    const priorVersion = latest.get(policyId) ?? 0;
    const supportResolutionIds = profile.supportedResolutionIds.filter((id) => {
      const resolution = replay.resolutions.find((row) => row.id === id)!;
      const expectation = replay.expectations.find((row) => row.id === resolution.expectationId)!;
      return expectation.parentExperienceId === undefined;
    });
    const familyIds = new Set(supportResolutionIds.map((id) => {
      const resolution = replay.resolutions.find((row) => row.id === id)!;
      return replay.expectations.find((row) => row.id === resolution.expectationId)!.familyId;
    }));
    if (familyIds.size < 2) continue;

    const current = replay.policies.find((policy) => policy.policyId === policyId && policy.version === priorVersion);
    if (current && current.action.kind === "prefer_check" && current.action.actionId === profile.actionId
      && stable(current.supportResolutionIds) === stable(supportResolutionIds)) continue;

    const reconsideration: ReconsiderationCondition[] = [
      { kind: "context_changed" },
      { kind: "objective_changed" },
      { kind: "method_changed" },
      { kind: "support_revoked", resolutionId: supportResolutionIds[0]! },
      ...profile.contradictedResolutionIds.map((resolutionId) => {
        const resolution = replay.resolutions.find((row) => row.id === resolutionId)!;
        return { kind: "contradiction" as const, expectationId: resolution.expectationId };
      }),
    ];
    const policyVersion: PolicyVersionRecord = {
      id: `${policyId}:v${priorVersion + 1}`,
      policyId,
      version: priorVersion + 1,
      track,
      scope: track === "simulated" ? { kind: "simulation", worldVersion: profile.context.worldVersion! } : { kind: "real_advisory" },
      action: { kind: "prefer_check", actionId: profile.actionId as CheckActionId },
      context: profile.context,
      supportResolutionIds,
      reconsideration,
      ...(priorVersion ? { supersedesVersionId: `${policyId}:v${priorVersion}` } : {}),
    };
    const sequence = replay.lastSequence + proposals.length + 1;
    const at = replay.events.at(-1)?.at ?? 0;
    proposals.push({
      id: `candidate-event:${policyVersion.id}`,
      sequence,
      at,
      schemaVersion: 1,
      kind: "policy.version_recorded",
      payload: { policyVersion },
    });
    latest.set(policyId, policyVersion.version);
  }
  return proposals;
}
