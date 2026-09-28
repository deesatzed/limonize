import test from "node:test";
import assert from "node:assert/strict";
import {
  completeDevelopmentJob,
  createDevelopmentCycleState,
  enqueueDevelopmentJob,
  mergeDevelopmentJobs,
  recoverDevelopmentQueue,
  runDevelopmentCycle,
} from "./development-cycle";

test("enqueue is idempotent by source, task and version, and completed work is not repeated", () => {
  const first = enqueueDevelopmentJob(createDevelopmentCycleState(), "source-a", "derive_competence", "v1", 1);
  const duplicate = enqueueDevelopmentJob(first.state, "source-a", "derive_competence", "v1", 2);
  assert.equal(first.accepted, true);
  assert.equal(duplicate.accepted, true);
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.state.jobs.length, 1);
  const completed = completeDevelopmentJob(first.state, first.job!.id);
  const again = enqueueDevelopmentJob(completed, "source-a", "derive_competence", "v1", 3);
  assert.equal(again.duplicate, true);
  assert.equal(again.state.jobs[0]?.status, "completed");
});

test("bounded queue saturation defers the source without losing it and admits it after capacity returns", () => {
  let state = createDevelopmentCycleState();
  for (let index = 0; index < 100; index += 1) {
    state = enqueueDevelopmentJob(state, `source-${index}`, "consider_policy", "v1", index).state;
  }
  const full = enqueueDevelopmentJob(state, "source-overflow", "consider_policy", "v1", 101);
  assert.equal(full.accepted, false);
  assert.equal(full.backpressured, true);
  assert.deepEqual(full.state.deferredSourceEventIds, ["source-overflow"]);
  const available = completeDevelopmentJob(full.state, full.state.jobs[0]!.id);
  const resumed = enqueueDevelopmentJob(available, "source-overflow", "consider_policy", "v1", 102);
  assert.equal(resumed.accepted, true);
  assert.deepEqual(resumed.state.deferredSourceEventIds, []);
  assert.equal(resumed.state.jobs.filter((job) => job.status === "queued").length, 100);
});

test("reload recovery retries valid pending jobs and cancels missing-source or stale-version work", () => {
  let state = createDevelopmentCycleState();
  state = enqueueDevelopmentJob(state, "source-valid", "derive_competence", "v1", 1).state;
  state = enqueueDevelopmentJob(state, "source-gone", "consider_policy", "v1", 2).state;
  state = enqueueDevelopmentJob(state, "source-stale", "trial_policy", "v0", 3).state;
  const recovered = recoverDevelopmentQueue(state, new Set(["source-valid", "source-stale"]), "v1");
  assert.equal(recovered.jobs[0]?.status, "queued");
  assert.equal(recovered.jobs[1]?.status, "cancelled");
  assert.equal(recovered.jobs[2]?.status, "cancelled");
});

test("a cycle commit merges completed rows without dropping work admitted concurrently", () => {
  const initial = enqueueDevelopmentJob(createDevelopmentCycleState(), "source-a", "consider_policy", "v1", 1).state;
  const completedSlice = completeDevelopmentJob(initial, initial.jobs[0]!.id, 2);
  const concurrent = enqueueDevelopmentJob(initial, "source-b", "trial_policy", "v1", 3).state;
  const merged = mergeDevelopmentJobs(concurrent.jobs, completedSlice.jobs);
  assert.equal(merged.length, 2);
  assert.equal(merged.find((job) => job.sourceEventId === "source-a")?.status, "completed");
  assert.equal(merged.find((job) => job.sourceEventId === "source-b")?.status, "queued");
});

test("processing is capped per slice, yields between slices, and repeated resume is idempotent", async () => {
  let state = createDevelopmentCycleState();
  for (let index = 0; index < 17; index += 1) state = enqueueDevelopmentJob(state, `source-${index}`, "trial_policy", "v1", index).state;
  let yielded = 0;
  let committed = 0;
  const result = await runDevelopmentCycle({
    state,
    controls: () => ({ enabled: true, paused: false, epoch: 0, inputVersion: "v1", sourceEventIds: new Set(Array.from({ length: 17 }, (_, index) => `source-${index}`)) }),
    processJob: async () => ({ progressed: true, simulatedEpisodes: 1, prepared: true }),
    commitPrepared: () => { committed += 1; return true; },
    yieldBetweenSlices: async () => { yielded += 1; },
  });
  assert.equal(result.state.jobs.filter((job) => job.status === "completed").length, 17);
  assert.equal(committed, 17);
  assert.equal(yielded, 8);
  assert.ok(result.stats.every((slice) => slice.transitions <= 16 && slice.simulatedEpisodes <= 2));
  const repeated = await runDevelopmentCycle({
    state: result.state,
    controls: () => ({ enabled: true, paused: false, epoch: 0, inputVersion: "v1", sourceEventIds: new Set(Array.from({ length: 17 }, (_, index) => `source-${index}`)) }),
    processJob: async () => { throw new Error("completed jobs must not run again"); },
    commitPrepared: () => { throw new Error("completed jobs must not commit again"); },
  });
  assert.equal(repeated.stats.length, 0);
});

test("pause before work, during asynchronous preparation, or before commit never admits a late result", async () => {
  const queued = enqueueDevelopmentJob(createDevelopmentCycleState(), "source-a", "consider_policy", "v1", 1).state;
  let committed = 0;
  const before = await runDevelopmentCycle({
    state: queued,
    controls: () => ({ enabled: true, paused: true, epoch: 1, inputVersion: "v1", sourceEventIds: new Set(["source-a"]) }),
    processJob: async () => { throw new Error("paused work must not start"); },
    commitPrepared: () => { committed += 1; return true; },
  });
  assert.equal(before.state.jobs[0]?.status, "queued");
  assert.equal(before.stats.length, 0);

  let controls = { enabled: true, paused: false, epoch: 0, inputVersion: "v1", sourceEventIds: new Set(["source-a"]) };
  const during = await runDevelopmentCycle({
    state: queued,
    controls: () => controls,
    processJob: async () => {
      controls = { ...controls, paused: true, epoch: 1 };
      return { progressed: true, simulatedEpisodes: 0, prepared: true };
    },
    commitPrepared: () => { committed += 1; return true; },
  });
  assert.equal(during.state.jobs[0]?.status, "queued");
  assert.equal(committed, 0);

  controls = { enabled: true, paused: false, epoch: 0, inputVersion: "v1", sourceEventIds: new Set(["source-a"]) };
  const beforeCommit = await runDevelopmentCycle({
    state: queued,
    controls: () => controls,
    processJob: async () => ({ progressed: true, simulatedEpisodes: 0, prepared: true }),
    commitPrepared: () => {
      controls = { ...controls, epoch: 1, sourceEventIds: new Set() };
      const current = controls;
      if (!current.enabled || current.paused || current.epoch !== 0 || !current.sourceEventIds.has("source-a")) return false;
      committed += 1;
      return true;
    },
  });
  assert.equal(beforeCommit.state.jobs[0]?.status, "queued");
  assert.equal(committed, 0);
});

test("crash-like rejected commit remains pending and retries deterministically; no progress terminates", async () => {
  const state = enqueueDevelopmentJob(createDevelopmentCycleState(), "source-a", "trial_policy", "v1", 1).state;
  let prepared = 0;
  const rejected = await runDevelopmentCycle({
    state,
    controls: () => ({ enabled: true, paused: false, epoch: 0, inputVersion: "v1", sourceEventIds: new Set(["source-a"]) }),
    processJob: async () => ({ progressed: true, simulatedEpisodes: 1, prepared: { stable: true } }),
    commitPrepared: () => false,
  });
  assert.equal(rejected.state.jobs[0]?.status, "queued");
  const resumed = await runDevelopmentCycle({
    state: rejected.state,
    controls: () => ({ enabled: true, paused: false, epoch: 0, inputVersion: "v1", sourceEventIds: new Set(["source-a"]) }),
    processJob: async () => { prepared += 1; return { progressed: true, simulatedEpisodes: 0, prepared: { stable: true } }; },
    commitPrepared: () => true,
  });
  assert.equal(prepared, 1);
  assert.equal(resumed.state.jobs[0]?.status, "completed");

  const noProgress = await runDevelopmentCycle({
    state,
    controls: () => ({ enabled: true, paused: false, epoch: 0, inputVersion: "v1", sourceEventIds: new Set(["source-a"]) }),
    processJob: async () => ({ progressed: false, simulatedEpisodes: 0 }),
    commitPrepared: () => true,
  });
  assert.equal(noProgress.stats.length, 1);
  assert.equal(noProgress.state.jobs[0]?.status, "queued");
});
