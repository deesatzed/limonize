import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)));
const readJson = async (name) => JSON.parse(await readFile(resolve(root, name), "utf8"));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const args = process.argv.slice(2);

async function preflight() {
  const [splits, arms, manifest] = await Promise.all([readJson("splits.json"), readJson("arms.json"), readJson("manifest.json")]);
  const requiredArms = ["frozen_enhanced_baseline", "fixed_checklist", "matched_raw_history", "learned_profile_commitments", "no_profile_ablation", "stale_profile", "shuffled_profile"];
  const errors = [];
  const ids = splits.splits.map((item) => item.id);
  if (new Set(ids).size !== ids.length) errors.push("split case IDs must be unique");
  for (const family of ["acceptance_execution", "source_dependence", "context_change", "quiet"]) {
    for (const split of ["development", "protected"]) {
      if (splits.splits.filter((item) => item.family === family && item.split === split).length < 2) errors.push(`${family} requires at least two ${split} variants`);
    }
  }
  for (const arm of requiredArms) if (arms.arms.filter((item) => item.id === arm).length !== 1) errors.push(`arm registration must contain ${arm} exactly once`);
  if (new Set(arms.arms.map((item) => item.id)).size !== arms.arms.length) errors.push("arm IDs must be unique");
  if (splits.observationBudget !== 2 || manifest.observationBudget !== splits.observationBudget) errors.push("observation budget mismatch");
  if (JSON.stringify(splits.costUnits) !== JSON.stringify(manifest.costUnits)) errors.push("check costs mismatch");
  if (manifest.worldVersion !== splits.worldVersion) errors.push("world version mismatch");
  if (manifest.criterionHash !== sha256(manifest.admissionCriterion)) errors.push("admission criterion hash mismatch");
  if (manifest.files?.splits !== sha256(await readFile(resolve(root, "splits.json")))) errors.push("split hash mismatch");
  if (manifest.files?.arms !== sha256(await readFile(resolve(root, "arms.json")))) errors.push("arm hash mismatch");
  for (const name of ["worlds.mjs", "observer.mjs", "scorer.mjs", "arms.mjs", "run.mjs"]) {
    if (manifest.files?.[name] !== sha256(await readFile(resolve(root, name)))) errors.push(`${name} hash mismatch`);
  }
  for (const [name, expected] of Object.entries(manifest.files?.baseline ?? {})) {
    if (sha256(await readFile(resolve(root, "baseline", name))) !== expected) errors.push(`baseline snapshot hash mismatch: ${name}`);
  }
  for (const [name, expected] of Object.entries(manifest.files?.implementation ?? {})) {
    if (sha256(await readFile(resolve(root, "../..", name))) !== expected) errors.push(`implementation snapshot hash mismatch: ${name}`);
  }
  if (errors.length) {
    console.error(JSON.stringify({ preflight: "FAIL", errors }, null, 2));
    process.exitCode = 1;
  } else {
    console.log(JSON.stringify({ preflight: "PASS", checks: 12 + splits.splits.length + requiredArms.length, cases: splits.splits.length, arms: requiredArms.length, protectedOutcomesRead: false }, null, 2));
  }
}

if (args.includes("--preflight")) {
  await preflight();
} else {
  const { splits, arms, manifest } = await Promise.all([readJson("splits.json"), readJson("arms.json"), readJson("manifest.json")]).then(([splits, arms, manifest]) => ({ splits, arms, manifest }));
  const protectedMode = args.includes("--protected");
  const phase = protectedMode ? "protected" : "development";
  const splitItems = splits.splits.filter((item) => item.split === phase);
  const developmentArtifact = args.find((arg) => arg.startsWith("--development-run="))?.split("=")[1];
  if (protectedMode && !developmentArtifact) throw new Error("Protected evaluation requires --development-run=<path> after development review.");
  const { trainFromDevelopment, runArm, scoreArm, summarizeRuns } = await import("./arms.mjs");
  const { evaluatorLabel } = await import("./worlds.mjs");
  const { releaseObservation } = await import("./observer.mjs");
  const { scoreRun, SCORER_VERSION } = await import("./scorer.mjs");
  const history = trainFromDevelopment(splits.splits, evaluatorLabel, releaseObservation);
  const activePolicies = (await import("../../src/lib/limen/development.ts")).activePolicyVersions(
    (await import("../../src/lib/limen/development.ts")).replayDevelopment(history),
  );
  const runs = [];
  for (const item of splitItems) {
    const baseline = (await import("./arms.mjs")).baselineChoice(item.family);
    for (const arm of arms.arms) {
      const run = runArm(arm.id, item, history, baseline, { label: evaluatorLabel(item.id), releaseObservation });
      runs.push(scoreArm(run, evaluatorLabel(item.id), scoreRun, splits.costUnits, splits.observationBudget));
    }
  }
  const runId = `${phase}-${randomUUID()}`;
  const artifact = {
    runId, phase, createdAt: new Date().toISOString(), manifestSha256: sha256(await readFile(resolve(root, "manifest.json"))),
    scorerVersion: SCORER_VERSION, configuration: {
      armIds: arms.arms.map((arm) => arm.id), caseIds: splitItems.map((item) => item.id),
      observationBudget: splits.observationBudget, costUnits: splits.costUnits,
      implementationSha256: manifest.files.implementation,
      developmentCaseIds: splits.splits.filter((item) => item.split === "development").map((item) => item.id),
      activeLearnedPolicies: activePolicies.map((policy) => ({ id: policy.id, action: policy.action, supportResolutionIds: policy.supportResolutionIds, lifecycle: policy.lifecycle })),
    },
    runCount: runs.length, runs, summary: summarizeRuns(runs),
  };
  if (protectedMode) {
    const previous = JSON.parse(await readFile(resolve(developmentArtifact), "utf8"));
    if (previous.phase !== "development" || previous.manifestSha256 !== artifact.manifestSha256) throw new Error("Development run is missing or its frozen manifest differs from the protected configuration.");
    artifact.developmentRunId = previous.runId;
  }
  const directory = resolve(root, "results");
  await mkdir(directory, { recursive: true });
  const path = resolve(directory, `${runId}.json`);
  await writeFile(path, `${JSON.stringify(artifact, null, 2)}\n`, { flag: "wx" });
  console.log(JSON.stringify({ runId, phase, path, cases: splitItems.length, arms: arms.arms.length, records: runs.length, activeLearnedPolicies: activePolicies.length, summary: artifact.summary }, null, 2));
}
