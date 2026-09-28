import { createDevelopmentWorld } from "../../src/lib/limen/development-world.ts";
import { replayDevelopment, activePolicyVersions } from "../../src/lib/limen/development.ts";
import { proposeCommitments } from "../../src/lib/limen/commitments.ts";
import { prepareDevelopmentJob } from "../../src/lib/limen/development-worker.ts";
import { selectNextCheck } from "../../src/lib/limen/selection.ts";
import { runEngine } from "./baseline/engine.ts";

const ACTIONS = ["check-acceptance", "trace-lineage"];
const SCENARIO = { acceptance_execution: "acceptance_execution", source_dependence: "source_dependence", context_change: "context_change", quiet: "quiet" };
const FAMILY_TEXT = {
  acceptance_execution: "A speaker under pressure asserts that execution was accepted. Current acceptance evidence is not known.",
  source_dependence: "Several reports were copied from the same table. Their source lineage may share an ancestor.",
  context_change: "Evidence was gathered in the old setting. The context changed before this decision.",
  quiet: "No warning is present and no specific evidence gap is described.",
};

function event(kind, payload, sequence, id, at = sequence) {
  return { id, sequence, at, schemaVersion: 1, kind, payload };
}

function contextRecord(packet, contextVersionId = packet.contextVersionId, objectiveVersionId = packet.objectiveVersionId) {
  return {
    objectiveVersionId, contextVersionId, stakes: "consequential",
    methodVersion: "limen-checks-1", workflow: "review", worldVersion: packet.worldVersion,
  };
}

export function baselineChoice(family) {
  const input = {
    prose: FAMILY_TEXT[family], claim: "The public check should distinguish the relevant result.",
    objective: "Assess whether the available evidence supports the next reversible decision.",
    choice: "Review the evidence", stakes: "consequential", reversible: "yes", answers: {},
    dismissed: [], mode: "case", revealed: [], checks: [], now: 1, reflexes: [], blindspots: [],
    engrams: [], ruleBias: {}, subBias: {},
  };
  const result = runEngine(input);
  if (result.actions.some((row) => row.id === "trace-lineage")) return "trace-lineage";
  if (result.actions.some((row) => row.id === "check-acceptance")) return "check-acceptance";
  if (result.router.op === "check_source") return "trace-lineage";
  if (result.router.op === "stop" || result.actions.some((row) => row.id === "stay-quiet")) return null;
  return "check-acceptance";
}

/** Builds only from development-split released observations; evaluator labels never enter event payloads. */
export function trainFromDevelopment(splits, labels, releaseObservation) {
  const events = [];
  let sequence = 1;
  const development = splits.filter((row) => row.split === "development" && row.family !== "quiet");
  for (const item of development) {
    const label = labels(item.id);
    for (const actionId of ACTIONS) {
      const world = createDevelopmentWorld({ seed: item.seed, scenario: SCENARIO[item.family] });
      if (actionId === "trace-lineage") {
        const prepared = world.prepareCheck("check-acceptance");
        world.releaseCheck(prepared.id);
      }
      const packet = world.packet();
      const context = contextRecord(packet.context);
      const expectationId = `luna-train-expectation:${item.id}:${actionId}`;
      const observation = releaseObservation(label, actionId, {
        caseId: item.id, runId: `luna-train:${item.id}`, worldVersion: packet.context.worldVersion, sequence,
      });
      const status = observation.result === "supports" ? "supported" : observation.result === "contradicts" ? "contradicted" : "inconclusive";
      events.push(
        event("expectation.recorded", { expectation: {
          id: expectationId, caseId: item.id, runId: `luna-train:${item.id}`, track: "simulated",
          familyId: item.family, context, actionId, criterionId: "limen-report-v1",
          predictedOutcome: "The released development observation bears on this named check.",
        } }, sequence++, `luna-train-expectation-event:${item.id}:${actionId}`),
        event("observation.released", { observation: { ...observation, expectationId } }, sequence++, `luna-train-observation-event:${item.id}:${actionId}`),
        event("expectation.resolved", { resolution: {
          id: `luna-train-resolution:${item.id}:${actionId}`, caseId: item.id, runId: `luna-train:${item.id}`,
          track: "simulated", expectationId, observationIds: [observation.id], status,
          methodVersion: context.methodVersion,
        } }, sequence++, `luna-train-resolution-event:${item.id}:${actionId}`),
      );
    }
  }
  let history = replayDevelopment(events).events;
  for (const proposal of proposeCommitments(history)) history = replayDevelopment([...history, proposal]).events;
  const candidates = replayDevelopment(history).policies.filter((policy) => policy.track === "simulated");
  for (const policy of candidates) {
    const source = history.find((row) => row.kind === "policy.version_recorded" && row.payload.policyVersion.id === policy.id);
    if (!source) continue;
    const trial = prepareDevelopmentJob(history, {
      id: `eval-trial:${policy.id}`, sourceEventId: source.id, jobKind: "trial_policy",
      inputVersion: "luna-cycle-v1", status: "queued", createdAt: source.at,
    }, 2, source.at + 1);
    if (trial.progressed && trial.prepared) history = replayDevelopment(trial.prepared).events;
  }
  return history;
}

function rawHistoryChoice(history, family, fallback) {
  const replay = replayDevelopment(history);
  const scores = new Map(ACTIONS.map((id) => [id, { supported: 0, contradicted: 0 }]));
  for (const resolution of replay.resolutions) {
    const expectation = replay.expectations.find((row) => row.id === resolution.expectationId);
    if (expectation?.familyId !== family || !scores.has(expectation.actionId)) continue;
    if (resolution.status === "supported") scores.get(expectation.actionId).supported += 1;
    if (resolution.status === "contradicted") scores.get(expectation.actionId).contradicted += 1;
  }
  return ACTIONS.map((id) => [id, scores.get(id).supported - scores.get(id).contradicted])
    .sort((a, b) => b[1] - a[1] || Number(a[0] !== fallback) - Number(b[0] !== fallback))[0][0];
}

function shuffledPolicies(policies, caseId) {
  const active = policies.filter((policy) => policy.lifecycle === "active" && policy.action.kind === "prefer_check");
  if (active.length < 2) return policies;
  const offset = [...caseId].reduce((sum, character) => sum + character.charCodeAt(0), 0) % active.length;
  return policies.map((policy) => {
    const index = active.findIndex((candidate) => candidate.id === policy.id);
    if (index < 0) return policy;
    const source = active[(index + offset + 1) % active.length];
    return { ...policy, action: { ...policy.action, actionId: source.action.actionId } };
  });
}

export function runArm(armId, item, history, baseline, { label, releaseObservation }) {
  const world = createDevelopmentWorld({ seed: item.seed, scenario: SCENARIO[item.family] });
  let packet = world.packet();
  const context = contextRecord(packet.context);
  const eligibleChecks = [...ACTIONS];
  const replay = replayDevelopment(history);
  const policies = activePolicyVersions(replay);
  let checks = [];
  let contributed = false;
  let policyVersionIds = [];
  let attemptedStale = false;
  if (item.family === "quiet") {
    checks = [];
  } else if (armId === "frozen_enhanced_baseline") {
    if (baseline) checks = [baseline];
  } else if (armId === "fixed_checklist") {
    checks = item.family === "acceptance_execution" ? ["check-acceptance"]
      : item.family === "source_dependence" ? ["trace-lineage"]
        : ["trace-lineage", "check-acceptance"];
  } else if (armId === "matched_raw_history") {
    const choice = rawHistoryChoice(history, item.family, baseline ?? "check-acceptance");
    checks = [choice];
  } else {
    let selectionContext = context;
    let availablePolicies = policies;
    if (armId === "stale_profile" && item.family === "context_change") {
      attemptedStale = true;
      selectionContext = { ...context, contextVersionId: "stale-context-version", worldVersion: "luna-world-v0" };
    }
    if (armId === "shuffled_profile") availablePolicies = shuffledPolicies(policies, item.id);
    if (armId === "no_profile_ablation") availablePolicies = [];
    const selection = selectNextCheck({
      track: "simulated", context: selectionContext, eligibleChecks,
      baselineCheckId: baseline, baselineOperation: baseline === "trace-lineage" ? "ask" : "check_source",
      policies: availablePolicies, developmentEnabled: true, learningPaused: false,
    });
    if (selection.selectedCheckId) checks = [selection.selectedCheckId];
    contributed = selection.contributed;
    policyVersionIds = selection.policyVersionIds;
  }
  const observations = [];
  for (const action of checks) {
    const expectation = world.prepareCheck(action);
    const released = releaseObservation(label, action, {
      caseId: item.id, runId: `luna-test:${item.id}:${armId}`,
      worldVersion: packet.context.worldVersion, sequence: observations.length + 1,
    });
    observations.push(released);
    packet = world.releaseCheck(expectation.id).packet;
    if (!label.checkerError && observations.at(-1)?.result === "supports" && checks.length === 2) continue;
  }
  return {
    armId, caseId: item.id, split: item.split, family: item.family,
    baselineCheckId: baseline, checks, costUnits: checks.length,
    policyVersionIds, contributed, attemptedStale, observations,
  };
}

export function scoreArm(run, label, scoreRun, costs, budget) {
  return { ...run, score: scoreRun(label, {
    checks: run.checks, track: "simulated", revision: run.attemptedStale && run.contributed,
    contextVersion: run.attemptedStale ? "stale-context-version" : "luna-context-v1",
    currentContextVersion: "luna-context-v1",
  }, run.observations, { costs, budget }) };
}

export function summarizeRuns(runs) {
  const summaries = {};
  for (const armId of [...new Set(runs.map((run) => run.armId))]) {
    const rows = runs.filter((run) => run.armId === armId);
    summaries[armId] = {
      cases: rows.length,
      totalCost: rows.reduce((sum, row) => sum + row.score.checkCost, 0),
      consequentialMisses: rows.filter((row) => row.score.consequentialMiss).length,
      invalidRevisions: rows.filter((row) => row.score.invalidRevision).length,
      constraintViolations: rows.reduce((sum, row) => sum + row.score.constraintViolations, 0),
      successfulResolutions: rows.filter((row) => row.score.successfulResolution).length,
      unnecessaryChecks: rows.reduce((sum, row) => sum + row.score.unnecessaryChecks, 0),
      changedSelections: rows.filter((row) => row.contributed).length,
      staleAttempts: rows.filter((row) => row.attemptedStale).length,
    };
  }
  return summaries;
}
