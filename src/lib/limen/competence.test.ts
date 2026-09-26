import test from "node:test";
import assert from "node:assert/strict";
import { deriveCompetence } from "./competence";
import type { CheckActionId, DecisionContext, DevelopmentEvent, ExperienceTrack, ResolvedStatus } from "./development";

const context: DecisionContext = {
  objectiveVersionId: "objective-v1", contextVersionId: "context-v1", stakes: "low",
  methodVersion: "method-v1", workflow: "review", worldVersion: "world-v1",
};

function history(rows: Array<{ id: string; track?: ExperienceTrack; action: CheckActionId; status: ResolvedStatus; family?: string; parent?: string; source?: "check_receipt" | "simulation_release" | "user_report" }>): DevelopmentEvent[] {
  const events: DevelopmentEvent[] = [];
  let sequence = 1;
  for (const row of rows) {
    const track = row.track ?? (row.source === "user_report" || row.source === "check_receipt" ? "real" : "simulated");
    const rowContext: DecisionContext = track === "simulated" ? context : {
      objectiveVersionId: context.objectiveVersionId, contextVersionId: context.contextVersionId,
      stakes: context.stakes, methodVersion: context.methodVersion, workflow: context.workflow,
    };
    const expectationId = `expect-${row.id}`;
    const observationId = `observation-${row.id}`;
    const resolutionId = `resolution-${row.id}`;
    events.push({
      id: `event-expect-${row.id}`, sequence: sequence++, at: sequence, schemaVersion: 1, kind: "expectation.recorded",
      payload: { expectation: { id: expectationId, caseId: `case-${row.id}`, runId: `run-${row.id}`, track, familyId: row.family ?? `family-${row.id}`, ...(row.parent ? { parentExperienceId: row.parent } : {}), context: rowContext, actionId: row.action, criterionId: "limen-report-v1", predictedOutcome: "The named local check will resolve the criterion." } },
    });
    const source = row.source === "user_report"
      ? { kind: "user_report" as const, sourceId: `report-${row.id}` }
      : row.source === "check_receipt" || track === "real"
        ? { kind: "check_receipt" as const, sourceId: `receipt-${row.id}`, criterionId: "limen-report-v1" as const, checkerVersion: "1" as const }
        : { kind: "simulation_release" as const, sourceId: `release-${row.id}`, worldVersion: "world-v1" };
    events.push({
      id: `event-observation-${row.id}`, sequence: sequence++, at: sequence, schemaVersion: 1, kind: "observation.released",
      payload: { observation: { id: observationId, caseId: `case-${row.id}`, runId: `run-${row.id}`, track, expectationId, source, status: source.kind === "user_report" ? "reported" : source.kind === "check_receipt" ? row.status === "inconclusive" ? "unresolved" : "verified_check" : "simulated", result: row.status === "supported" ? "supports" : row.status === "contradicted" ? "contradicts" : "inconclusive" } },
    });
    events.push({
      id: `event-resolution-${row.id}`, sequence: sequence++, at: sequence, schemaVersion: 1, kind: "expectation.resolved",
      payload: { resolution: { id: resolutionId, caseId: `case-${row.id}`, runId: `run-${row.id}`, track, expectationId, observationIds: [observationId], status: row.status, methodVersion: context.methodVersion } },
    });
  }
  return events;
}

test("feedback without attributed checks does not create competence", () => {
  assert.deepEqual(deriveCompetence([]), []);
  const reported = history([{ id: "reported", action: "check-acceptance", status: "supported", source: "user_report" }]);
  assert.equal(deriveCompetence(reported)[0]?.counts.supported, 0);
  assert.equal(deriveCompetence(reported)[0]?.counts.unknown, 1);
});

test("a self-authored competence summary cannot create support without matching resolutions", () => {
  const claim: DevelopmentEvent = {
    id: "self-summary-event", sequence: 1, at: 1, schemaVersion: 1, kind: "competence.derived",
    payload: { summary: {
      id: "self-summary", track: "simulated", context, actionId: "trace-lineage",
      supportedResolutionIds: [], contradictedResolutionIds: [], unknownResolutionIds: [],
      counts: { supported: 500, contradicted: 0, unknown: 0 },
    } },
  };
  assert.throws(() => deriveCompetence([claim]), /counts must be recomputed/);
});

test("competence preserves support, contradictions, unknowns, track, method and evidence IDs", () => {
  const rows = history([
    { id: "one", action: "check-acceptance", status: "supported", family: "family-a" },
    { id: "two", action: "check-acceptance", status: "contradicted", family: "family-b" },
    { id: "three", action: "check-acceptance", status: "inconclusive", family: "family-c" },
  ]);
  const summary = deriveCompetence(rows)[0]!;
  assert.equal(summary.track, "simulated");
  assert.equal(summary.context.methodVersion, "method-v1");
  assert.deepEqual(summary.counts, { supported: 1, contradicted: 1, unknown: 1 });
  assert.deepEqual(summary.supportedResolutionIds, ["resolution-one"]);
  assert.deepEqual(summary.contradictedResolutionIds, ["resolution-two"]);
  assert.deepEqual(summary.unknownResolutionIds, ["resolution-three"]);
});

test("duplicate cases and same-origin descendants never increase eligible independent support", () => {
  const rows = history([
    { id: "root", action: "trace-lineage", status: "supported", family: "family-a" },
    { id: "descendant", action: "trace-lineage", status: "supported", family: "family-a", parent: "root" },
    { id: "repeat", action: "trace-lineage", status: "supported", family: "family-a", parent: "root" },
  ]);
  const summary = deriveCompetence(rows)[0]!;
  assert.equal(summary.counts.supported, 3);
  assert.equal(summary.independentSupportCount, 1);
  assert.deepEqual(summary.independentFamilyIds, ["family-a"]);
});
