import type { DecisionContext, PolicyVersionView, CheckActionId } from "./development";
import type { FlyOp, RoleId } from "./types";

export interface SelectionRecord {
  track: "real" | "simulated";
  context: DecisionContext;
  eligibleChecks: CheckActionId[];
  baselineCheckId: CheckActionId | null;
  selectedCheckId: CheckActionId | null;
  operation: FlyOp;
  roles: RoleId[];
  policyVersionIds: string[];
  supportResolutionIds: string[];
  contributed: boolean;
  costUnits: number;
  reason: string;
}

export interface SelectNextCheckInput {
  track: "real" | "simulated";
  context: DecisionContext;
  eligibleChecks: CheckActionId[];
  baselineCheckId: CheckActionId | null;
  baselineOperation: FlyOp;
  policies: readonly PolicyVersionView[];
  developmentEnabled: boolean;
  learningPaused: boolean;
}

function stable(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stable(record[key])}`).join(",")}}`;
}

function rolesFor(op: FlyOp): RoleId[] {
  if (op === "check_source") return ["perception", "boundary"];
  if (op === "test_alternative") return ["world", "boundary"];
  if (op === "ask") return ["perspective"];
  if (op === "reframe") return ["world"];
  if (op === "rehearse") return ["world", "perspective"];
  if (op === "escalate") return ["boundary"];
  return [];
}

function operationFor(check: CheckActionId): FlyOp {
  return check === "check-acceptance" ? "check_source" : "ask";
}

export function selectNextCheck(input: SelectNextCheckInput): SelectionRecord {
  const eligibleChecks = [...new Set(input.eligibleChecks)];
  if (input.baselineCheckId && !eligibleChecks.includes(input.baselineCheckId)) throw new Error("Baseline check must be in the eligible action set.");
  let selectedCheckId = input.baselineCheckId;
  let contributing: PolicyVersionView | undefined;
  if (input.track === "simulated" && input.developmentEnabled && !input.learningPaused) {
    const matching = input.policies.filter((policy) => policy.lifecycle === "active"
      && policy.track === "simulated" && policy.scope.kind === "simulation"
      && policy.scope.worldVersion === input.context.worldVersion
      && stable(policy.context) === stable(input.context)
      && policy.action.kind === "prefer_check" && eligibleChecks.includes(policy.action.actionId));
    const strengthByAction = new Map<CheckActionId, number>();
    for (const policy of matching) {
      if (policy.action.kind !== "prefer_check") continue;
      strengthByAction.set(policy.action.actionId, Math.max(strengthByAction.get(policy.action.actionId) ?? 0, policy.supportResolutionIds.length));
    }
    const strongest = Math.max(0, ...strengthByAction.values());
    const winners = [...strengthByAction].filter(([, strength]) => strength === strongest);
    const preferredAction = winners.length === 1 && strongest > 0 ? winners[0]![0] : undefined;
    const preferred = matching.filter((policy) => policy.action.kind === "prefer_check" && policy.action.actionId === preferredAction)
      .sort((a, b) => a.id.localeCompare(b.id))[0];
    if (preferred?.action.kind === "prefer_check" && preferred.action.actionId !== selectedCheckId) {
      selectedCheckId = preferred.action.actionId;
      contributing = preferred;
    }
  }
  const operation = selectedCheckId ? operationFor(selectedCheckId) : input.baselineOperation;
  const contributed = Boolean(contributing && selectedCheckId !== input.baselineCheckId);
  return {
    track: input.track,
    context: structuredClone(input.context),
    eligibleChecks,
    baselineCheckId: input.baselineCheckId,
    selectedCheckId,
    operation,
    roles: rolesFor(operation),
    policyVersionIds: contributing ? [contributing.id] : [],
    supportResolutionIds: contributing ? [...contributing.supportResolutionIds] : [],
    contributed,
    costUnits: selectedCheckId ? 1 : 0,
    reason: contributed
      ? `The active simulation policy ${contributing!.id} selected ${selectedCheckId}; the baseline was ${input.baselineCheckId}. This applies only to this matching simulated context.`
      : input.learningPaused ? "Learned influence is paused; the existing eligible action remains selected."
        : "No matching active policy changed the baseline selection.",
  };
}
