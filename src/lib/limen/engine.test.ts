import assert from "node:assert/strict";
import test from "node:test";
import { runEngine } from "./engine.ts";
import { kenyon, overlapRatio } from "./fly.ts";
import { SAMPLES } from "./samples.ts";
import type { SitInput } from "./types.ts";

function input(partial: Partial<SitInput> & Pick<SitInput, "prose">): SitInput {
  return {
    claim: "",
    objective: "",
    choice: "",
    stakes: "low",
    reversible: "yes",
    answers: {},
    dismissed: [],
    reflexes: [],
    blindspots: [],
    engrams: [],
    ruleBias: {},
    mode: "case",
    ...partial,
  };
}

test("component case insists and separates kinds of not-knowing", () => {
  const draft = SAMPLES[0].draft;
  const result = runEngine(input({ ...draft, stakes: draft.stakes, reversible: draft.reversible }));
  assert.equal(result.attention, "insisting");
  const kinds = result.gaps.map((g) => g.kind);
  assert.ok(kinds.includes("evidence"));
  assert.ok(kinds.includes("observation"));
  assert.ok(kinds.includes("strategic"));
  assert.ok(result.actions.some((a) => a.id === "trace-lineage"));
  assert.ok(result.actions.some((a) => a.id === "stage-commitment"));
  assert.ok(result.trace.length > 4);
  assert.match(result.voice, /not one uncertainty/i);
  assert.ok(result.council.some((c) => c.agent === "Archivist" && c.spoke));
  assert.ok(result.readings.some((r) => r.signal === "shared-ancestor"));
});

test("an improved score is reviewed at the objective level", () => {
  const draft = SAMPLES[1].draft;
  const result = runEngine(input({ ...draft, stakes: draft.stakes, reversible: draft.reversible }));
  assert.equal(result.level, "objective");
  assert.ok(result.gaps.some((g) => g.kind === "reflexive" || g.kind === "objective"));
  assert.match(result.voice, /score|purpose|false alarm/i);
});

test("low stakes with no gap stays quiet", () => {
  const result = runEngine(
    input({
      prose: "Lunch nearby. Two places, both acceptable, and nothing in the day depends on which one.",
      objective: "A meal.",
      choice: "Either place.",
      stakes: "low",
      reversible: "yes",
    }),
  );
  assert.equal(result.attention, "quiet");
  assert.ok(result.actions.some((a) => a.id === "stay-quiet"));
});

test("dismissing a reading removes its gap", () => {
  const draft = SAMPLES[0].draft;
  const base = input({ ...draft, stakes: draft.stakes, reversible: draft.reversible });
  const kept = runEngine(base);
  assert.ok(kept.gaps.some((g) => g.kind === "strategic"));
  const dropped = runEngine({ ...base, dismissed: ["incentive"] });
  assert.ok(!dropped.readings.some((r) => r.signal === "incentive"));
  assert.ok(!dropped.gaps.some((g) => g.kind === "strategic"));
});

test("fly tags stabilize and resemblance is not identity", () => {
  const draft = SAMPLES[0].draft;
  const first = runEngine(input({ ...draft, stakes: draft.stakes, reversible: draft.reversible, now: 1_700_000_000_000 }));
  const again = runEngine(
    input({
      ...draft,
      stakes: draft.stakes,
      reversible: draft.reversible,
      now: 1_700_000_000_000,
      engrams: [
        {
          id: "e1",
          sittingId: "s1",
          kc: first.kc,
          at: 1_700_000_000_000,
          action: "trace-lineage",
          valence: 1,
          summary: "Replacement component: Trace the shared ancestor",
          features: first.features,
        },
      ],
    }),
  );
  assert.ok(again.novelty < 0.5);
  assert.match(again.resembles?.caveat ?? "", /not authorization/i);
  assert.ok(overlapRatio(kenyon(first.features), first.kc) > 0.9);
});

test("reviewer handoff treats resistance as a belief until the schema check", () => {
  const draft = SAMPLES.find((s) => s.id === "reviewer");
  assert.ok(draft);
  const before = runEngine(
    input({
      ...draft.draft,
      stakes: draft.draft.stakes,
      reversible: draft.draft.reversible,
      episode: "reviewer",
    }),
  );
  assert.ok(before.features.includes("sig:handoff"));
  assert.ok(!before.features.includes("sig:schema"));
  assert.ok(before.records.belief.some((item) => item.status === "inferred" && /resist/i.test(item.text)));
  assert.ok(!before.records.belief.some((item) => item.status === "verified_check" && /resist/i.test(item.text)));
  assert.ok(!before.records.environment.some((item) => /outdated schema/i.test(item.text)));
  assert.equal(before.hive.length, 4);
  assert.equal(new Set(before.hive.map((seat) => seat.roleId)).size, 4);
  assert.deepEqual(before.router.roles, ["perception", "boundary"]);
  assert.equal(before.hive.filter((seat) => seat.active).length, 2);
  assert.equal(before.hive.find((seat) => seat.roleId === "perception")?.id, "gemini");
  assert.equal(before.hive.find((seat) => seat.roleId === "boundary")?.id, "grok");
  assert.equal(before.hive.find((seat) => seat.roleId === "boundary")?.starting, true);
  assert.equal(before.hive.filter((seat) => seat.live).length, 0);
  assert.match(before.jev.map((item) => item.detail).join(" "), /not TypeSafe/i);
  assert.equal(before.router.op, "check_source");
  assert.equal(before.perturbations.decisive.ran, false);
  assert.equal(before.proposals.length, 0);

  const learned = runEngine(
    input({
      ...draft.draft,
      stakes: draft.draft.stakes,
      reversible: draft.draft.reversible,
      episode: "reviewer",
      subBias: { "occupy:boundary:astra": 8 },
      opBias: { stop: 3 },
    }),
  );
  assert.equal(learned.hive.find((seat) => seat.roleId === "boundary")?.id, "astra");
  assert.equal(learned.hive.find((seat) => seat.roleId === "boundary")?.starting, false);
  assert.equal(learned.router.op, "check_source");
  assert.equal(learned.router.fromLearning, false);
  assert.equal(learned.hive.filter((seat) => seat.active).length, 2);

  const after = runEngine(
    input({
      ...draft.draft,
      stakes: draft.draft.stakes,
      reversible: draft.draft.reversible,
      episode: "reviewer",
      revealed: ["schema-fail"],
    }),
  );
  assert.ok(after.features.includes("sig:schema"));
  assert.match(after.voice, /schema|acceptance|motive/i);
  assert.ok(after.records.environment.some((item) => item.status === "simulated" && /outdated report schema/i.test(item.text)));
  assert.ok(after.actions.some((action) => action.id === "keep-failure"));
  assert.equal(after.router.op, "check_source");
  assert.ok(after.proposals.some((proposal) => proposal.id === "completion-semantics"));

  const kinds = before.gaps.map((gap) => gap.kind).sort().join("|");
  const paraphrased = runEngine(
    input({
      ...draft.draft,
      stakes: draft.draft.stakes,
      reversible: draft.draft.reversible,
      episode: "reviewer",
      checks: ["paraphrase"],
    }),
  );
  assert.equal(paraphrased.gaps.map((gap) => gap.kind).sort().join("|"), kinds);
  assert.equal(paraphrased.perturbations.irrelevant.held, true);
  assert.equal(paraphrased.perturbations.irrelevant.ran, true);
});
