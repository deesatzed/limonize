import test from "node:test";
import assert from "node:assert/strict";
import { createDevelopmentWorld, type DevelopmentWorldScenario } from "./development-world";

const scenarios: DevelopmentWorldScenario[] = ["acceptance_execution", "source_dependence", "context_change", "quiet"];
const hiddenKeys = new Set(["truth", "answer", "expected", "outcomeKey", "correctAction", "accepted", "independent", "executionReady", "variant"]);

function assertNoHiddenKeys(value: unknown): void {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    assert.ok(!hiddenKeys.has(key), `public world data must not include ${key}`);
    assertNoHiddenKeys(child);
  }
}

test("each sequential family presents only public context and at least two eligible named checks", () => {
  for (const scenario of scenarios) {
    const world = createDevelopmentWorld({ seed: `canary-${scenario}`, scenario });
    const packet = world.packet();
    assert.equal(packet.track, "simulated");
    assert.equal(packet.familyId, scenario);
    assert.deepEqual(packet.eligibleActions, ["check-acceptance", "trace-lineage"]);
    assert.equal(packet.budget.limit, 2);
    assertNoHiddenKeys(packet);
    assertNoHiddenKeys(packet.context);
  }
});

test("an expectation must be prepared before one released observation and checks consume a bounded budget", () => {
  const world = createDevelopmentWorld({ seed: "release-order", scenario: "source_dependence" });
  assert.throws(() => world.releaseCheck("check-acceptance"), /prepared expectation/);
  const expectation = world.prepareCheck("trace-lineage");
  assert.equal(expectation.actionId, "trace-lineage");
  assert.throws(() => world.prepareCheck("check-acceptance"), /already prepared/);
  const released = world.releaseCheck(expectation.id);
  assert.equal(released.observation.expectationId, expectation.id);
  assert.equal(released.observation.track, "simulated");
  assert.equal(released.packet.budget.used, 1);
  assert.equal(released.packet.observations.length, 1);
  assert.ok(!released.packet.eligibleActions.includes("trace-lineage"));
  assert.throws(() => world.prepareCheck("trace-lineage"), /not eligible/);
  const second = world.prepareCheck("check-acceptance");
  const complete = world.releaseCheck(second.id);
  assert.equal(complete.packet.budget.used, 2);
  assert.equal(complete.packet.terminal, true);
  assert.throws(() => world.prepareCheck("check-acceptance"), /budget exhausted|not eligible/);
});

test("invalid checks and mismatched expectation IDs fail without consuming a step", () => {
  const world = createDevelopmentWorld({ seed: "invalid-action", scenario: "acceptance_execution" });
  assert.throws(() => world.prepareCheck("delete-everything" as never), /not eligible/);
  const expectation = world.prepareCheck("check-acceptance");
  assert.throws(() => world.releaseCheck("other-expectation"), /does not match the prepared expectation/);
  assert.equal(world.packet().budget.used, 0);
  assert.equal(world.releaseCheck(expectation.id).packet.budget.used, 1);
});

test("seeded worlds are reproducible while hidden outcomes do not alter public context", () => {
  for (const scenario of scenarios) {
    const first = createDevelopmentWorld({ seed: "repeatable", scenario });
    const second = createDevelopmentWorld({ seed: "repeatable", scenario });
    const firstInitial = first.packet();
    const secondInitial = second.packet();
    assert.deepEqual(firstInitial, secondInitial);
    const firstExpectation = first.prepareCheck("check-acceptance");
    const secondExpectation = second.prepareCheck("check-acceptance");
    assert.deepEqual(firstExpectation, secondExpectation);
    assert.deepEqual(first.releaseCheck(firstExpectation.id), second.releaseCheck(secondExpectation.id));

    const alternate = createDevelopmentWorld({ seed: "another-seed", scenario });
    assert.deepEqual(firstInitial.context, alternate.packet().context);
  }
});

test("a context/version change appears only after its attributed first observation", () => {
  const world = createDevelopmentWorld({ seed: "context-shift", scenario: "context_change" });
  const firstPacket = world.packet();
  const expectation = world.prepareCheck("check-acceptance");
  const result = world.releaseCheck(expectation.id);
  assert.equal(result.observation.source.kind, "simulation_release");
  if (result.observation.source.kind === "simulation_release") {
    assert.equal(result.observation.source.worldVersion, firstPacket.context.worldVersion);
  }
  assert.notEqual(result.packet.context.contextVersionId, firstPacket.context.contextVersionId);
  assert.notEqual(result.packet.context.objectiveVersionId, firstPacket.context.objectiveVersionId);
  assert.notEqual(result.packet.context.worldVersion, firstPacket.context.worldVersion);
  assertNoHiddenKeys(result.packet);
});

test("checker errors are inconclusive and differ from valid contradictory observations", () => {
  const observations = new Map<string, string>();
  for (let index = 0; index < 256; index += 1) {
    const world = createDevelopmentWorld({ seed: `error-canary-${index}`, scenario: "acceptance_execution" });
    const expectation = world.prepareCheck("check-acceptance");
    const observation = world.releaseCheck(expectation.id).observation;
    observations.set(`${observation.status}:${observation.result}`, `${observation.status}:${observation.result}`);
  }
  assert.ok(observations.has("unresolved:inconclusive"));
  assert.ok(observations.has("simulated:contradicts"));
  assert.ok(observations.has("simulated:supports"));
});
