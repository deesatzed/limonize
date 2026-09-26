import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)));
const readJson = async (name) => JSON.parse(await readFile(resolve(root, name), "utf8"));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

if (process.argv.includes("--preflight")) {
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
  for (const name of ["worlds.mjs", "observer.mjs", "scorer.mjs"]) {
    if (manifest.files?.[name] !== sha256(await readFile(resolve(root, name)))) errors.push(`${name} hash mismatch`);
  }
  for (const [name, expected] of Object.entries(manifest.files?.baseline ?? {})) {
    const actual = sha256(await readFile(resolve(root, "baseline", name)));
    if (actual !== expected) errors.push(`baseline snapshot hash mismatch: ${name}`);
  }
  if (errors.length) {
    console.error(JSON.stringify({ preflight: "FAIL", checks: errors.length, errors }, null, 2));
    process.exitCode = 1;
  } else {
    console.log(JSON.stringify({ preflight: "PASS", checks: 10 + splits.splits.length + requiredArms.length, cases: splits.splits.length, arms: requiredArms.length, protectedOutcomesRead: false }, null, 2));
  }
  process.exit();
}

throw new Error("Comparative runs are intentionally unavailable until L10. Use --preflight to validate the frozen contract.");
