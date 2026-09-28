/** Frozen comparative gate outcome. Changing this requires a new reviewed protected evaluation. */
export const SIMULATION_SCOPE_DISPOSITION = Object.freeze({
  status: "shadow" as const,
  evaluationRunId: "protected-fa96aa05-7e95-4285-8dcd-1ea8fe6106b9",
  reason: "Learned policy tied the frozen baseline and had more consequential misses than the fixed checklist on the small protected simulation set.",
});

export type SimulationScopeStatus = "active" | "shadow";
