import test from "node:test";
import assert from "node:assert/strict";
import { replayDevelopment } from "./development";
import { createLocalRehearsalEvents } from "./development-rehearsal";

test("the local rehearsal records three separate simulator families through released checks only", () => {
  const events = createLocalRehearsalEvents([], "product-flow", 10);
  const replay = replayDevelopment(events);
  assert.equal(events.length, 18);
  assert.equal(replay.expectations.length, 6);
  assert.equal(replay.observations.length, 6);
  assert.equal(replay.resolutions.length, 6);
  assert.deepEqual(new Set(replay.expectations.map((row) => row.familyId)), new Set(["acceptance_execution", "source_dependence", "context_change"]));
  assert.ok(replay.expectations.every((row) => row.track === "simulated" && row.parentExperienceId === undefined));
  assert.ok(replay.observations.every((row) => row.track === "simulated" && row.source.kind === "simulation_release"));
  assert.ok(replay.events.every((row) => row.kind !== "policy.applied"));
});

test("same seed replays identically and a later invocation has a separate event family instance", () => {
  const first = createLocalRehearsalEvents([], "repeatable", 1);
  const repeated = createLocalRehearsalEvents([], "repeatable", 1);
  assert.deepEqual(repeated, first);
  const second = createLocalRehearsalEvents([], "repeatable-next", 2);
  assert.notEqual(replayDevelopment(second).expectations[0]?.caseId, replayDevelopment(first).expectations[0]?.caseId);
});
