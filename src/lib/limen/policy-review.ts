import {
  replayDevelopment,
  type DecisionContext,
  type DevelopmentEvent,
  type PolicyReviewKind,
  type PolicyTransitionRecord,
} from "./development";

const reviewKinds: PolicyReviewKind[] = ["contract", "evidence", "continuity"];

export interface ReviewFinding {
  kind: PolicyReviewKind;
  verdict: "accepted" | "rejected";
  reasons: string[];
}

export function preparePolicyReviews(events: readonly DevelopmentEvent[], policyVersionId: string): {
  events: Extract<DevelopmentEvent, { kind: "policy.reviewed" }>[];
  findings: ReviewFinding[];
} {
  const replay = replayDevelopment(events);
  const policy = replay.policies.find((row) => row.id === policyVersionId);
  if (!policy || policy.supersededByVersionId) throw new Error("The requested policy version is unavailable or superseded.");
  const policyEvent = replay.events.find((event) => event.kind === "policy.version_recorded" && event.payload.policyVersion.id === policy.id);
  if (!policyEvent) throw new Error("The policy version has no retained source event.");
  const sourceEvents = policy.supportResolutionIds.flatMap((resolutionId) => {
    const resolution = replay.resolutions.find((row) => row.id === resolutionId);
    if (!resolution) return [];
    const expectation = replay.expectations.find((row) => row.id === resolution.expectationId);
    const expectationEvent = replay.events.find((event) => event.kind === "expectation.recorded" && event.payload.expectation.id === expectation?.id);
    const observationEvents = replay.events.filter((event) => event.kind === "observation.released" && resolution.observationIds.includes(event.payload.observation.id));
    const resolutionEvent = replay.events.find((event) => event.kind === "expectation.resolved" && event.payload.resolution.id === resolution.id);
    return [expectationEvent?.id, ...observationEvents.map((event) => event.id), resolutionEvent?.id].filter((id): id is string => Boolean(id));
  });
  const sourceEventIds = [...new Set([policyEvent.id, ...sourceEvents])];
  const findings: ReviewFinding[] = reviewKinds.map((kind) => {
    const reasons: string[] = [];
    if (kind === "contract") {
      if (policy.action.kind !== "prefer_check") reasons.push("Only a preference among existing checks is admitted in this cycle.");
      if (policy.track !== "simulated" || policy.scope.kind !== "simulation") reasons.push("Autonomous admission is restricted to a named simulation scope.");
      if (policy.action.kind === "prefer_check" && !["check-acceptance", "trace-lineage"].includes(policy.action.actionId)) reasons.push("The action is outside the existing eligible check set.");
    }
    if (kind === "evidence") {
      const roots = new Set<string>();
      for (const resolutionId of policy.supportResolutionIds) {
        const resolution = replay.resolutions.find((row) => row.id === resolutionId);
        const expectation = resolution && replay.expectations.find((row) => row.id === resolution.expectationId);
        const verifiedObservation = resolution?.observationIds.some((id) => {
          const observation = replay.observations.find((row) => row.id === id);
          return policy.track === "real"
            ? observation?.source.kind === "check_receipt" && observation.status === "verified_check"
            : observation?.source.kind === "simulation_release" && observation.status === "simulated";
        });
        if (resolution?.status === "supported" && !verifiedObservation) reasons.push(policy.track === "real"
          ? "A real support resolution needs an attributed verified check receipt; user reports do not qualify."
          : "A simulated support resolution needs an attributed simulation release.");
        if (!resolution || resolution.status !== "supported" || !verifiedObservation || !expectation || expectation.parentExperienceId || expectation.track !== policy.track || expectation.actionId !== (policy.action.kind === "prefer_check" ? policy.action.actionId : "check-acceptance")) continue;
        roots.add(expectation.familyId);
      }
      if (roots.size < 2) reasons.push("At least two distinct root experience families must support this exact check and track.");
    }
    if (kind === "continuity") {
      const conditions = new Set(policy.reconsideration.map((condition) => condition.kind));
      for (const required of ["context_changed", "objective_changed", "method_changed", "support_revoked"] as const) {
        if (!conditions.has(required)) reasons.push(`A ${required} reconsideration condition is missing.`);
      }
    }
    return { kind, verdict: reasons.length ? "rejected" : "accepted", reasons };
  });

  const firstSequence = replay.lastSequence + 1;
  return {
    findings,
    events: findings.map((finding, index) => {
      const sequence = firstSequence + index;
      return {
        id: `review:${policy.id}:${finding.kind}:${sequence}`,
        sequence,
        at: replay.events.at(-1)?.at ?? 0,
        schemaVersion: 1,
        kind: "policy.reviewed" as const,
        payload: { review: {
          id: `review-record:${policy.id}:${finding.kind}:${sequence}`,
          policyVersionId: policy.id,
          track: policy.track,
          reviewKind: finding.kind,
          verdict: finding.verdict,
          sourceEventIds,
          reviewedAtSequence: sequence,
        } },
      };
    }),
  };
}

export function prepareTestingTransition(events: readonly DevelopmentEvent[], policyVersionId: string): DevelopmentEvent {
  const replay = replayDevelopment(events);
  const policy = replay.policies.find((row) => row.id === policyVersionId);
  if (!policy || policy.lifecycle !== "candidate" || policy.track !== "simulated") throw new Error("Only the latest simulated candidate can enter testing.");
  requireCurrentReviews(replay, policyVersionId);
  const sequence = replay.lastSequence + 1;
  const event: DevelopmentEvent = {
    id: `testing:${policyVersionId}:${sequence}`, sequence, at: replay.events.at(-1)?.at ?? 0,
    schemaVersion: 1, kind: "policy.transitioned",
    payload: { transition: { policyVersionId, toState: "testing", reasonCode: "candidate_trial" } },
  };
  replayDevelopment([...replay.events, event]);
  return event;
}

export function prepareAdmission(events: readonly DevelopmentEvent[], policyVersionId: string): {
  accepted: boolean;
  reason: string;
  event?: DevelopmentEvent;
} {
  const replay = replayDevelopment(events);
  const policy = replay.policies.find((row) => row.id === policyVersionId);
  if (!policy || policy.lifecycle !== "testing" || policy.track !== "simulated" || policy.scope.kind !== "simulation") {
    return { accepted: false, reason: "Only a named simulation policy in testing may be admitted." };
  }
  if (!hasCurrentReviews(replay, policyVersionId)) return { accepted: false, reason: "All three current reviews must be accepted." };
  const trials = replay.trials.filter((row) => row.policyVersionId === policyVersionId);
  const successfulChange = trials.some((row) => row.outcome === "supports" && row.selectedCheckId !== row.baselineCheckId && (policy.action.kind !== "prefer_check" || row.selectedCheckId === policy.action.actionId));
  if (!successfulChange) return { accepted: false, reason: "No released prospective trial shows a successful changed selection." };
  const control = trials.some((row) => row.outcome === "contradicts" || row.outcome === "quiet_control");
  if (!control) return { accepted: false, reason: "A contradiction or quiet control is required before admission." };
  const sequence = replay.lastSequence + 1;
  const event: DevelopmentEvent = {
    id: `admit:${policyVersionId}:${sequence}`, sequence, at: replay.events.at(-1)?.at ?? 0,
    schemaVersion: 1, kind: "policy.transitioned",
    payload: { transition: { policyVersionId, toState: "active", reasonCode: "prospective_trials_passed" } satisfies PolicyTransitionRecord },
  };
  replayDevelopment([...replay.events, event]);
  return { accepted: true, reason: "The scoped simulation admission contract passed; this is not the independent benefit verdict.", event };
}

export function prepareReconsideration(events: readonly DevelopmentEvent[], policyVersionId: string, currentContext: DecisionContext): DevelopmentEvent | null {
  const replay = replayDevelopment(events);
  const policy = replay.policies.find((row) => row.id === policyVersionId);
  if (!policy || policy.supersededByVersionId || !["testing", "active"].includes(policy.lifecycle)) return null;
  const policyEvent = replay.events.find((event) => event.kind === "policy.version_recorded" && event.payload.policyVersion.id === policy.id);
  if (!policyEvent) return null;
  let reasonCode: "contradiction" | "context_changed" | "objective_changed" | "method_changed" | undefined;
  if (policy.context.objectiveVersionId !== currentContext.objectiveVersionId) reasonCode = "objective_changed";
  else if (policy.context.methodVersion !== currentContext.methodVersion) reasonCode = "method_changed";
  else if (policy.context.contextVersionId !== currentContext.contextVersionId || policy.context.worldVersion !== currentContext.worldVersion) reasonCode = "context_changed";
  else if (replay.resolutions.some((resolution) => {
    const resolutionEvent = replay.events.find((event) => event.kind === "expectation.resolved" && event.payload.resolution.id === resolution.id);
    if (!resolutionEvent || resolutionEvent.sequence <= policyEvent.sequence) return false;
    if (resolution.status !== "contradicted" || resolution.track !== policy.track) return false;
    const expectation = replay.expectations.find((row) => row.id === resolution.expectationId);
    return expectation?.actionId === (policy.action.kind === "prefer_check" ? policy.action.actionId : "check-acceptance")
      && stable(expectation.context) === stable(policy.context);
  })) reasonCode = "contradiction";
  if (!reasonCode) return null;
  const sequence = replay.lastSequence + 1;
  const event: DevelopmentEvent = {
    id: `suspend:${policy.id}:${reasonCode}:${sequence}`, sequence, at: replay.events.at(-1)?.at ?? 0,
    schemaVersion: 1, kind: "policy.transitioned",
    payload: { transition: { policyVersionId, toState: "suspended", reasonCode } },
  };
  replayDevelopment([...replay.events, event]);
  return event;
}

export function prepareRetirement(events: readonly DevelopmentEvent[], policyVersionId: string): DevelopmentEvent {
  const replay = replayDevelopment(events);
  const policy = replay.policies.find((row) => row.id === policyVersionId);
  if (!policy || policy.supersededByVersionId || policy.lifecycle === "retired") throw new Error("Only the latest non-retired policy can be retired.");
  const sequence = replay.lastSequence + 1;
  const event: DevelopmentEvent = {
    id: `retire:${policy.id}:${sequence}`, sequence, at: replay.events.at(-1)?.at ?? 0,
    schemaVersion: 1, kind: "policy.transitioned",
    payload: { transition: { policyVersionId, toState: "retired", reasonCode: "explicit_retirement" } },
  };
  replayDevelopment([...replay.events, event]);
  return event;
}

function hasCurrentReviews(replay: ReturnType<typeof replayDevelopment>, policyVersionId: string): boolean {
  const latest = new Map<PolicyReviewKind, "accepted" | "rejected">();
  for (const review of replay.reviews.filter((row) => row.policyVersionId === policyVersionId).sort((a, b) => a.reviewedAtSequence - b.reviewedAtSequence)) latest.set(review.reviewKind, review.verdict);
  return reviewKinds.every((kind) => latest.get(kind) === "accepted");
}

function requireCurrentReviews(replay: ReturnType<typeof replayDevelopment>, policyVersionId: string): void {
  if (!hasCurrentReviews(replay, policyVersionId)) throw new Error("All three current policy reviews must be accepted before testing.");
}

function stable(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stable(record[key])}`).join(",")}}`;
}
