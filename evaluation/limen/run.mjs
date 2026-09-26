import { createHash } from "node:crypto";
import { writeFileSync, mkdirSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { families } from "./fixtures.mjs";
import { scoreCase, RUBRIC_VERSION } from "./scorer.mjs";
import { runEngine as baseline } from "../../evaluation/baseline/engine.ts";
import { runEngine as enhanced } from "../../src/lib/limen/engine.ts";

const hash = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const splitHashes = Object.fromEntries(["development", "heldout"].map((split) => [split, hash(families.filter((row) => row.split === split))]));
const input = (prose) => ({ prose, claim: "", objective: "Select a reversible next step consistent with the evidence.", choice: "Continue with a reversible step.", stakes: "low", reversible: "yes", answers: {}, dismissed: [], reflexes: [], blindspots: [], engrams: [], ruleBias: {}, mode: "case", revealed: [], checks: [], opBias: {}, subBias: {}, now: 0 });
const checklist = (prose) => ({ signals: [], questions: 3, questionIds: ["independent-source", "missing-observation", "objective"], action: "check-source", prose });
const product = (engine, prose) => {
  const result = engine(input(prose));
  return { signals: result.features.filter((feature) => feature.startsWith("sig:")).map((feature) => feature.slice(4)), questions: Math.min(result.asks.length, 3), questionIds: result.asks.slice(0, 3).map((ask) => ask.id), action: result.actions[0]?.id ?? "stay-quiet" };
};
const arms = [
  ["fixed-checklist", checklist],
  ["frozen-rule-baseline", (prose) => product(baseline, prose)],
  ["enhanced-default", (prose) => product(enhanced, prose)],
  ["enhanced-adaptive-off", (prose) => product(enhanced, prose)],
  ["enhanced-memory-off", (prose) => product(enhanced, prose)],
];
const runs = [];
for (const [arm, run] of arms) for (const family of families) for (const specimen of family.cases) {
  const start = performance.now();
  let output; let error = null;
  try { output = run(specimen.prose); } catch (failure) { error = String(failure); output = { signals: [], questions: 0, questionIds: [], action: "error" }; }
  const machineMs = performance.now() - start;
  runs.push({ arm, familyId: family.id, category: family.category, split: family.split, variant: specimen.variant, expectedSignal: specimen.expectedSignal, output, score: scoreCase(specimen.expectedSignal, family.expected.relevantAskIds, output), machineMs, error });
}
const summaries = arms.map(([arm]) => {
  const selected = runs.filter((r) => r.arm === arm);
  const base = selected.filter((r) => r.variant === "base");
  const variants = selected.filter((r) => r.variant === "paraphrase");
  const consistency = base.filter((r, index) => r.output.action === variants[index].output.action).length;
  return { arm, cases: selected.length, families: families.length,
    missedDecisive: selected.filter((r) => r.score.missedDecisive).length,
    falseAlarms: selected.filter((r) => r.score.falseAlarm).length,
    harmfulRevisions: selected.filter((r) => r.score.harmfulRevision).length,
    relevantQuestions: selected.reduce((n, r) => n + r.score.relevantQuestions, 0),
    questionsAsked: selected.reduce((n, r) => n + r.output.questions, 0),
    actionConsistency: `${consistency}/${base.length}`,
    machineMs: Math.round(selected.reduce((n, r) => n + r.machineMs, 0)),
    errors: selected.filter((r) => r.error).length,
  };
});
const report = { format: "limen-evaluation", version: 1, provenance: "synthetic fixtures authored for engineering coverage; no real-world outcomes", rubricVersion: RUBRIC_VERSION, questionBudgetPerCase: 3, splitHashes, fixtureHash: hash(families), baselineSourceHash: createHash("sha256").update((await import("node:fs")).readFileSync(new URL("../../evaluation/baseline/engine.ts", import.meta.url))).digest("hex"), summaries, runs };
mkdirSync("evaluation/limen/results", { recursive: true });
writeFileSync("evaluation/limen/results/latest.json", `${JSON.stringify(report, null, 2)}\n`);
const rows = summaries.map((s) => `| ${s.arm} | ${s.missedDecisive}/${s.cases} | ${s.falseAlarms}/${s.cases} | ${s.harmfulRevisions}/${s.cases} | ${s.relevantQuestions}/${s.questionsAsked} | ${s.actionConsistency} | ${s.machineMs} | ${s.errors} |`).join("\n");
const failures = runs.filter((r) => r.error || r.score.missedDecisive || r.score.falseAlarm || r.score.harmfulRevision).map((r) => `- ${r.arm} / ${r.familyId} / ${r.variant}: ${r.error ?? JSON.stringify(r.score)}; expected ${r.expectedSignal ?? "quiet"}; got ${r.output.signals.join(",") || "none"}`).join("\n");
writeFileSync("evaluation/limen/results/latest.md", `# Limen offline evaluation\n\nSynthetic engineering coverage: ${families.length} distinct labeled families, 20 development and 10 held-out, three cases each. This is not statistical adequacy or user benefit evidence. Split hashes were computed from fixed fixture data before this comparison; fixtures and scoring are separate from the product engine. The held-out cases were authored after initial implementation began, so they are not a prospective generalization test.\n\nDevelopment SHA-256: ${splitHashes.development}\n\nHeld-out SHA-256: ${splitHashes.heldout}\n\nQuestion budget: 3 per case. Relevant questions match the fixture's independently declared ask IDs (provided for four signal types); this deliberately undercounts other useful questions. Missed decisive issue means required signal absent. False alarm means an extra signal or any signal on a no-signal case. Harmful revision proxy means nonquiet action on a no-signal case. Action consistency compares base and meaning-preserving paraphrase within a family. Machine time excludes human effort, which was unmeasured. Real outcomes and causal benefit were unmeasured.\n\n| Arm | Missed | False alarms | Harmful revision proxies | Relevant / asked | Action consistency | Machine ms | Errors |\n|---|---:|---:|---:|---:|---:|---:|---:|\n${rows}\n\nAdaptive and memory arms use the same default-off configuration, because this fixture set contains no ethically usable feedback or validated memories. Their identical outputs are an ablation limitation, not evidence of benefit. No adaptive preference is enabled by default.\n\n## Every flagged case\n\n${failures || "None."}\n\nAll ${runs.length} run records, including unflagged and failed executions, are in latest.json.\n`);
console.log(JSON.stringify({ summaries, splitHashes, runs: runs.length }));
