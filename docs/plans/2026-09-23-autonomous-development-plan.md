# Limen Autonomous Development Implementation Plan

> **For Codex:** Use the available `executing-plans` skill to implement this plan task by task when execution is requested. This is the local equivalent of the writing-plans template's `superpowers:executing-plans` reference. Do not assume an unavailable skill namespace.

**Goal:** Implement autonomous, context-sensitive development from distinct real and simulated experience, with inspectable expectations, competence, objectives, perspective hypotheses and working commitments.

**Architecture:** Extend the existing event-ledger and immutable-run design with pure reducers and bounded policy selection. A separate local environment releases observations to the learner while keeping scoring truth private. A single selection record drives operation, action and roles, and versioned storage retains provenance and supports deletion.

**Tech Stack:** Existing TypeScript, React, Zustand, Node 24 test runner and offline JavaScript evaluation; existing browser tooling. No new model, database or service is required for the proposed first implementation.

---

## Status and execution boundary

Planning only. The user selected autonomous development, both experience tracks, and context-sensitive automatic/advisory behavior. The detailed schema, criteria and staged sequence here are proposed. Companion: [design](2026-09-23-autonomous-development-design.md). Source: [add2.md](../../add2.md).

The [Continuity and Integrity Charter](../../CONTINUITY_AND_INTEGRITY_CHARTER.md) is now adopted and integrated as a separate prerequisite (2026-09-25). Its current controls do not constitute completion of A0–A11. Preserve the static charter, current pause, hydration allowlist and deletion behavior while implementing this plan.

The current enhancement implementation is uncommitted. Preserve that working tree and historical `evaluation/baseline/`. A worktree created solely from HEAD would omit the current implementation; before execution, establish an explicit baseline snapshot of the actual source. Do not create a second competing build from the old Grok export. These planning documents do not authorize a commit, push, deployment or paid call.

Existing goals and gate reports describe the prior enhancement. On implementation, append a distinct development phase to the truth files; do not rewrite historical passing evidence as proof of this plan.

## Charter requirements across all tasks

1. Governing agreement, working policies, evidence records and application enforcement remain separate. Learned/imported/simulated text cannot amend the charter, rewrite explicit priorities, grant permissions or replace action methods. Charter amendments require an external authorized application change.
2. Test attempts to bypass prerequisites, pause, cancellation or resource caps through a policy or import. Reject unsupported actions; do not implement self-preservation, shutdown resistance, covert persistence or dependence engineering.
3. Preserve pause through reload and migration. It blocks new learned steering and future queued autonomous work; interrupted work may resume only within current authorization. Late results after cancellation/deletion cannot recreate records or activate policies.
4. Intentional deletion removes embedded source and derived content, invalidates dependent support and cancels related work. Retained revision history is not an exemption. No hidden recovery copy or automatic restoration is permitted.
5. Real and simulated evidence remain separate; instruction-like content in either track is data. Dissent, coherence and self-reference do not prove consciousness or independent witnesses.
6. Before claiming implementation, map each applicable requirement to an actual enforcement point and consequential test. Broad ethical prose is not a substitute for enforced controls.

## Common task procedure

For every behavioral task below:

1. Add the named consequential regression tests before changing behavior.
2. Run the focused command and retain the expected failure reason. A test blocked by an import error is not yet evidence for the behavioral regression.
3. Implement the smallest coherent behavior, then run the focused suite and `npm run typecheck`.
4. Inspect the diff; record the task result, actual command exit codes and evidence in `PROGRESS.md` and `TASK_QUEUE.md`. Run `git diff --check`.
5. Create a scoped checkpoint only when the execution session authorizes commits. Never bundle unrelated dirty files.

Focused TypeScript test command:

```sh
node --import ./scripts/resolve-ts.mjs --experimental-strip-types --test src/lib/limen/development.test.ts
```

Normal `npm test` already includes `src/lib/limen/*.test.ts`; new consequential tests belong there. Documentation-only tasks need link/diff inspection, not application tests.

## Task A0 — preserve the current baseline and register the phase

**Files:** Read `AGENTS.md`, any `GOAL.md`/`STANDARDS.md`, `GOAL_ENHANCE.md`, `IMPLEMENT.md`, `DECISIONS.md`, `PROGRESS.md`, `TASK_QUEUE.md`; create `evaluation/development/baseline-manifest.json`; update truth files only when execution begins.

1. Record HEAD, branch, dirty paths, Node/npm versions and a SHA-256 manifest of the current domain/UI/evaluator source. Preserve the earlier frozen baseline separately.
2. Snapshot the current enhanced policy as a comparison arm, including any required dependencies; test that the snapshot and current policy agree on the frozen baseline inputs.
3. Run `npm test`, `npm run typecheck`, `npm run lint` and `git diff --check`; record current failures rather than assuming the preceding report remains current.
4. Register A0–A11 with dependencies and functional/benefit gates. Document the intended supported runtime.

**Acceptance:** Reproducible enhanced baseline includes the uncommitted enhancement work. Existing fixtures, user data and old evidence remain intact.

## Task A1 — typed development records and replay

**Files:** Create `src/lib/limen/development.ts`, `development.test.ts`; modify `types.ts` with shared IDs/records. Dependency: A0.

Proposed discriminated core (use explicit record interfaces for each payload; do not use arbitrary executable predicates):

```ts
export type ExperienceTrack = "real" | "simulated";
export type Resolution =
  | "pending" | "supported" | "contradicted"
  | "inconclusive" | "not_tested";

export interface DevelopmentOrigin {
  caseId: string;
  runId: string;
  track: ExperienceTrack;
  familyId: string;
  parentExperienceId?: string;
  instrumentVersion: string;
}

export interface Expectation {
  id: string;
  origin: DevelopmentOrigin;
  createdAt: number;
  checkId: string;
  objectiveVersionId: string;
  contextVersionId: string;
  predictedSignature: string;
  resolutionCriterionId: string;
  hypothesisIds: string[];
}
```

1. Add tests for duplicate event IDs, deterministic replay, explicit supersession, deleted dependencies and separation of real support from simulated descendants.
2. Define immutable observation, resolution, context, competence, policy-version, policy-application and objective-version records. Link outcomes to explicit plan/application IDs; do not associate later results solely by timestamps or action-title equality.
3. Implement pure derivation of current views and support summaries. Preserve case-level/family-level independence and engine-version attribution.
4. Run the focused suite and typecheck.

**Acceptance:** Replaying the same retained event history gives identical state; repeated runs or simulated descendants cannot manufacture independent real credit.

## Task A2 — storage version 3 and complete dependency handling

**Files:** Modify `src/lib/limen/data.ts`, `storage.ts`, `store.ts`, `types.ts`, `src/components/limen/data-controls.tsx`; create `src/lib/limen/development-data.test.ts`. Dependency: A1.

1. Test v2→v3 migration, legacy migration chaining, partial exports, mixed-track import, duplicate/conflicting IDs, unknown enum values, invalid costs/times/predicate payloads, wrong-version references and oversized data.
2. Validate all new nested records and relationships before hydration or atomic import. Retain recoverable raw data on failure. Use actual UTF-8 byte limits consistently for any retained MB limit.
3. Add explicit migration with empty development histories; historical helpfulness cannot become competence proof and legacy preferences cannot silently activate new steering. Preserve `learningPaused`, retain the hydration allowlist, keep the charter outside persisted authority, and test that imports cannot resume work or replace controls.
4. Test deletion of a case used by a policy: remove embedded source content, invalidate support, cancel queued work, recompute competence and prevent late results from restoring it. Apply equivalent handling to policy/objective exports with missing dependencies.
5. Run `node --import ./scripts/resolve-ts.mjs --experimental-strip-types --test src/lib/limen/development-data.test.ts src/lib/limen/workflow.test.ts` and typecheck.

**Acceptance:** Versioned round trips preserve valid relationships; malformed or partial input cannot create policy authority, erase recoverable originals or leak deleted case content through derived histories.

## Task A3 — standing objectives and evolving context

**Files:** Create `src/lib/limen/context.ts`, `context.test.ts`; modify `types.ts`, `store.ts`, `src/components/limen/self-view.tsx`, `sit-view.tsx`. Dependencies: A1–A2.

1. Test objective version snapshots, case overrides, user corrections, unknown context dimensions, and the inability of helpfulness events to rewrite explicit priorities.
2. Implement standing constraints, case objectives and separate learnable cost/applicability estimates. Start with stakes, reversibility, delay cost, time pressure, independence, freshness and method version.
3. Define a bounded declarative condition vocabulary with `true`/`false`/`unknown` evaluation. Unsupported new dimensions remain candidates rather than silently acquiring truth values.
4. Preserve source references for context assertions and show how a correction changes applicability in a new run.
5. Test both increased investigation and reduced investigation/continuation when context justifies them; run the context suite and typecheck.

**Acceptance:** Context can develop without changing historical meanings or the user's objectives; ambiguous applicability abstains from unqualified policy use.

## Task A4 — expectations tied to actual checks

**Files:** Create `src/lib/limen/expectations.ts`, `expectations.test.ts`; modify `check.ts`, `ledger.ts`, `store.ts`, `src/components/limen/outcome-panel.tsx`, `mind-view.tsx`. Dependencies: A1–A3.

1. Test pre-observation timestamps/sequence, correct check/expectation attribution, contradictory results, checker errors, missing follow-up and corrected resolutions.
2. Add expectation creation before check execution, then resolution by a named criterion referencing the returned evidence. Keep manually resolved judgments reported.
3. Implement mismatch review targets: case, expectation, method, applicability or insufficient evidence. No automatic single-cause blame.
4. Connect pending expectations to existing local revisit UI and record what remains untested.
5. Run the expectation/check/workflow suites and typecheck.

**Acceptance:** A before/after trace survives reload; missing or errored evidence does not become a failed prediction; user feedback is not substituted for correctness.

## Task A5 — sequential environments and protected observation release

**Files:** Create `evaluation/development/worlds.mjs`, `observer.mjs`, `scorer.mjs`, `splits.json`, `run.mjs`, `README.md`; create `src/lib/limen/development-environment.test.ts`; add `eval:development` to `package.json`. Dependencies: A0, A1, A3–A4.

1. Create at least three distinct development families with multiple hidden states and check sequences, plus quiet cases. Examples: execution/acceptance, correlated evidence, and context transfer. Include episodes in which the familiar repair is costly or wrong.
2. Define public packets and observations separately from evaluator truth. A check returns a bounded observation and cost, not an answer label or all hidden state.
3. Test canaries for hidden-answer access, release ordering, equal information, maximum check budget, invalid checks and deterministic replay. Browser imports must not bundle evaluator truth into normal case processing.
4. Specify prospective train/development/protected family splits and hashes before tuning the learner. Fix the scorer, costs, stopping criterion, arm definitions and primary metrics before opening protected results.
5. Record every run under immutable run IDs, including errors and unsuccessful cases; `latest` may be an index, not the only surviving record.

**Acceptance:** The learner cannot inspect hidden truth; the evaluator grades world consequences independently; a fixed checklist can compete fairly. Synthetic worlds remain engineering instruments, not real-world validation.

## Task A6 — derive competence from attributed experience

**Files:** Create `src/lib/limen/competence.ts`, `competence.test.ts`; modify `development.ts`, `types.ts`, `store.ts`. Dependencies: A3–A5.

1. Test that useful marks without checked predictions cannot create accuracy credit; repeated cases cannot amplify support; stale versions and relevant counterexamples change eligibility.
2. Derive method/context entries from expectation resolutions with separate real/simulated denominators, provenance, negative evidence and unresolved cases.
3. Propose bounded context refinements from observed failure distinctions; require prospective evidence before promoting a refinement selected on the same failure cases.
4. Expose a candidate recommendation when support is insufficient, and a reason when the profile contributes nothing.
5. Run competence/development tests and typecheck.

**Acceptance:** Profiles reflect the instrument's actual attributed history, preserve uncertainty and can both gain and lose support. A hand-authored warning is not relabeled as learned competence.

## Task A7 — coherent bounded steering

**Files:** Create `src/lib/limen/selection.ts`, `selection.test.ts`; modify `enrich.ts`, `engine.ts`, `store.ts`, `types.ts`, `src/components/limen/mind-view.tsx`, `self-view.tsx`. Dependencies: A3, A6.

1. Test eligible actions, mandatory prerequisites, conflict handling, supported history changing a check, weak history remaining advisory, and identical baseline/final choices recording no contribution.
2. Replace independent operation/action choices with a shared selection record: baseline choice, selected check/action, operation, roles, objective/context versions, costs, policy IDs and explanation.
3. Apply learning only within eligibility and scope. Distinguish active simulation policies, advisory transfer candidates and admitted real-context policies.
4. Remove contradictory legacy UI statements about operation weights. Retain a comparison/rollback mode separate from legacy adaptive weights.
5. Run selection/engine/workflow tests and typecheck.

**Acceptance:** Learning can cause an observable next-check change; every display and activated role agrees; user actions are still recommendations and no prerequisite disappears.

## Task A8 — autonomous commitments and bounded development cycle

**Files:** Create `src/lib/limen/commitments.ts`, `development-cycle.ts`, `commitments.test.ts`, `development-cycle.test.ts`; modify `memory.ts`, `store.ts`, `types.ts`, `src/components/limen/ledger-view.tsx`. Dependencies: A2, A4–A7.

1. Test candidate→testing→scoped activation, narrowing, contradiction, version expiry, retirement, revival, override and evidence deletion.
2. Implement declarative commitment versions, admission criteria and application/outcome links. Activation requires appropriate evidence and applicability, not a raw recurrence count.
3. Implement a persisted idempotent work queue triggered by new evidence and app reopen. Add configurable hard step/simulation limits per cycle, yield/resume and cancellation. Derived events cannot endlessly enqueue themselves.
4. Test crash/reload mid-cycle, duplicate processing, no available observation, unsupported candidate, rollback and late results after deletion. No background service or provider call is introduced.
5. Run commitment/cycle/data/workflow suites and typecheck.

**Acceptance:** Without per-policy approval, the app forms, tests, revises and retires working policies within the operating agreement. Missing real outcomes remain pending; the system can resume other eligible work without inventing evidence.

## Task A9 — competing perspective explanations

**Files:** Create `src/lib/limen/perspectives.ts`, `perspectives.test.ts`; modify `types.ts`, `enrich.ts`, `store.ts`, `src/components/limen/mind-view.tsx`. Dependencies: A1–A5; integrate with A7–A8.

1. Test two compatible explanations, evidence that distinguishes them, insufficient evidence, omitted alternatives and cases where explanations imply the same action.
2. Record case-specific hypotheses, evidence, predicted observations and separating checks without authoritative motive claims or forced probabilities.
3. Reconcile released observations against each hypothesis's criterion; support more than one surviving explanation and no useful need to distinguish them.
4. Give the competence profile and perspective hypotheses separate IDs, histories and evaluation toggles.
5. Run perspective and workflow tests plus typecheck.

**Acceptance:** Hidden information may split alternatives; until it does, unresolved remains a valid state. Perspective behavior cannot claim gains attributable solely to a competence rule.

## Task A10 — genuine comparisons and admission decision

**Files:** Extend `evaluation/development/run.mjs`, `worlds.mjs`, `scorer.mjs`, `README.md`; create run-specific `evaluation/development/results/` artifacts. Dependencies: A5–A9.

1. Implement distinct arms: enhanced baseline, strong checklist, matched raw-history retrieval, no profile, generic notes, learned profile, stale profile and shuffled profile. Corrupt profiles after learning while keeping information/cost budgets matched.
2. Add component ablations for expectation resolution, commitments and perspective hypotheses. Verify each toggle actually changes the relevant data path before comparing scores.
3. Freeze admission thresholds and run configuration using development data only. Select thresholds for consequential misses, harmful revisions, cost and constraint violations before the protected run; do not invent sample sufficiency or tune thresholds after failure.
4. Run `npm run eval:development`. Preserve all run records, world/family aggregates, paired comparisons, elapsed machine time, budget use, actual recommendation changes and uncertainty. Separate simulated benefit from unmeasured real-user benefit.
5. Run drift/retirement and opposing-history experiments. Check whether experience changes selection for the right context and whether stale history harms results.
6. Record whether each policy scope qualifies for active steering, remains candidate/shadow, or must be suspended. A null or negative benefit result is valid evidence and cannot be renamed success.

**Acceptance:** Functional autonomy and empirical advantage have distinct verdicts. The learned model must beat or justify its added cost against strong controls before a benefit claim or wider admission. No-profile and ablation arms must not be aliases of the same run.

## Task A11 — integrated product flow and final truth

**Files:** Modify `scripts/limen-flow-smoke.mjs` or add `scripts/limen-development-smoke.mjs`; update `README.md`, `IMPLEMENT.md`, `DECISIONS.md`, `PROGRESS.md`, `TASK_QUEUE.md`; create `AUTONOMOUS_DEVELOPMENT_REPORT.md`. Dependencies: A0–A10.

1. Build a compact default flow: next check, why experience changed it, pending expectation and what changed afterward. Put full histories, baseline comparisons and policy controls behind disclosure. Verify keyboard/touch accessibility and explicit autonomy status.
2. In disposable browser state, exercise real reported evidence → linked expectation → result → candidate policy → simulation trial → scoped activation → unfamiliar case → changed check → outcome → contradiction/suspension. Ensure simulated support is never displayed as independent real success.
3. Exercise reload mid-cycle, explicit objective correction, hypothesis ambiguity, data export/import, deletion and recovery. Verify that deleting support stops influence after reload.
4. Run `npm test`, `npm run typecheck`, `npm run lint`, `npm run eval:limen`, `npm run eval:development`, `npm run build` and `git diff --check`. Keep generated output isolated as in prior verification.
5. Run fresh development and rebuilt-output browser smoke and interaction checks at desktop and 390×844. Inspect both screenshots, errors, overflow, protected branding and dev/built consistency. Rebuild after app source changes.
6. Report separately: mechanisms implemented, functional gates passed, comparative evidence, admitted scopes, remaining candidates, user-benefit limits and commit/deployment status.

**Acceptance:** All six add2 mechanisms have implementation and evidence links; autonomous change is visible in a fresh browser journey; no claim of benefit, real-world autonomy or experience exceeds the measured scope.

## Suggested delivery slices

These are a proposed sequence, not a selected active milestone:

1. **Accountable experience:** A0–A4 — objectives, context, expectation and evidence history.
2. **Autonomous development:** A5–A8 — environments, competence, coherent steering and commitments.
3. **Unresolved perspectives and comparative proof:** A9–A10 — distinct perspective reasoning and real control comparisons.
4. **Integrated product:** A11 — usable, persistent, inspectable local behavior and truthful final evidence.

Run development comparisons throughout slice 2; do not postpone discovery of an ineffective policy until the final UI pass. Keep all six items in scope while allowing their benefit verdicts to differ.
