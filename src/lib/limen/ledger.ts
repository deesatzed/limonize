import type { FeedbackEvent, FlyEngram, FlyOp, OutcomeEvent, RoleFeedbackEvent, Sitting, Situation } from "./types";

export function effectiveFeedback(events: FeedbackEvent[]): FeedbackEvent[] {
  const byCase = new Map<string, FeedbackEvent>();
  for (const event of [...events].sort((a, b) => {
    if (a.at !== b.at) return a.at - b.at;
    if (a.supersedes === b.id) return 1;
    if (b.supersedes === a.id) return -1;
    return a.id.localeCompare(b.id);
  })) {
    byCase.set(event.caseId, event);
  }
  return [...byCase.values()];
}

export function deriveLearning(events: FeedbackEvent[], sittings: Sitting[], situations: Situation[], roleEvents: RoleFeedbackEvent[] = []) {
  const ruleBias: Record<string, number> = {};
  const ruleStats: Record<string, { fire: number; useful: number; noise: number }> = {};
  const opBias: Partial<Record<FlyOp, number>> = {};
  const subBias: Record<string, number> = {};
  const engrams: FlyEngram[] = [];
  const liveCaseIds = new Set(situations.map((s) => s.id));
  for (const sitting of sittings) {
    if (!liveCaseIds.has(sitting.situationId)) continue;
    for (const step of sitting.result.trace) {
      const row = ruleStats[step.ruleId] ?? { fire: 0, useful: 0, noise: 0 };
      row.fire += 1;
      ruleStats[step.ruleId] = row;
    }
  }
  for (const event of effectiveFeedback(events)) {
    if (!liveCaseIds.has(event.caseId)) continue;
    const sitting = sittings.find((s) => s.id === event.runId && s.situationId === event.caseId);
    if (!sitting) continue;
    const delta = event.verdict === "useful" ? 1 : event.verdict === "noise" ? -1 : 0;
    const op = sitting.result.router?.op;
    if (op && delta) opBias[op] = clamp((opBias[op] ?? 0) + delta, -3, 4);
    for (const step of sitting.result.trace) {
      if (!["challenge", "decide", "attend"].includes(step.module)) continue;
      if (delta) ruleBias[step.ruleId] = clamp((ruleBias[step.ruleId] ?? 0) + delta, -2, 3);
      const row = ruleStats[step.ruleId] ?? { fire: 0, useful: 0, noise: 0 };
      if (event.verdict === "useful") row.useful += 1;
      if (event.verdict === "noise") row.noise += 1;
      ruleStats[step.ruleId] = row;
    }
    engrams.push({
      id: `feedback:${event.id}`, sittingId: sitting.id, kc: sitting.result.kc, at: event.at,
      action: event.targetId, valence: delta || 0.15,
      summary: `${sitting.snapshot?.title ?? situations.find((s) => s.id === event.caseId)?.title ?? "Case"}: ${sitting.result.actions[0]?.title ?? "quiet"}`,
      features: sitting.result.features,
    });
  }
  const rolesByCase = new Map<string, RoleFeedbackEvent>();
  for (const event of [...roleEvents].sort((a, b) => a.at - b.at || a.id.localeCompare(b.id))) rolesByCase.set(event.caseId, event);
  for (const event of rolesByCase.values()) {
    const run = sittings.find((s) => s.id === event.runId && s.situationId === event.caseId);
    if (!run || !liveCaseIds.has(event.caseId) || !run.result.hive.some((seat) => seat.subRoleId === event.subRoleId && seat.active)) continue;
    const delta = event.verdict === "useful" ? 1 : -1;
    subBias[event.subRoleId] = clamp((subBias[event.subRoleId] ?? 0) + delta, -3, 4);
  }
  return { ruleBias, ruleStats, opBias, subBias, engrams };
}

export function currentOutcome(events: OutcomeEvent[], caseId: string): { plan?: OutcomeEvent; result?: OutcomeEvent; deferredUntil?: number } {
  const selected = events.filter((event) => event.caseId === caseId);
  const plan = [...selected].reverse().find((event) => event.kind === "plan");
  const result = [...selected].reverse().find((event) => event.kind === "result" && (!plan || event.at >= plan.at));
  const defer = [...selected].reverse().find((event) => event.kind === "defer" && (!plan || event.at >= plan.at));
  return { plan, result, deferredUntil: defer?.revisitAt };
}

export function dueFollowUps(events: OutcomeEvent[], now: number): string[] {
  return [...new Set(events.map((event) => event.caseId))].filter((id) => {
    const { plan, result, deferredUntil } = currentOutcome(events, id);
    if (!plan || (result && result.status !== "unknown" && result.status !== "ongoing")) return false;
    const triggered = events.some((event) => event.caseId === id && event.kind === "trigger" && event.at >= plan.at);
    return triggered || (deferredUntil ?? plan.revisitAt ?? Infinity) <= now;
  });
}

function clamp(value: number, min: number, max: number) { return Math.max(min, Math.min(max, value)); }
