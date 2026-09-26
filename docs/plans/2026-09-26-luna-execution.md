# Luna Accountable Commitments Implementation Plan

> For Codex running LUNA: use the available `executing-plans` workflow for one task at a time. No unavailable `superpowers:*` namespace is required. The user's autonomous instruction overrides optional between-batch confirmation; follow `GOAL_LUNA.md` stop rules.

**Goal:** Publish the verified foundation, then implement and evaluate the first evidence-backed autonomous commitment cycle defined by [GOAL_LUNA.md](../../GOAL_LUNA.md).

**Architecture:** Extend the existing event ledger with pure development reducers, a bounded declarative policy selector and a browser-local queue. Separate observations from evaluator truth, proposal from admission, and retained records from governing authority. Extend the current UI and storage rather than add a second runtime.

**Tech stack:** Existing TypeScript, React, Zustand, Node test runner, local deterministic checks and offline JS evaluation. No added model, database or provider.

Status: ready; all L-tasks initially queued. Do not create a worktree from the old HEAD before preserving the uncommitted foundation.

## How to use each task

Perform the numbered steps one at a time. Split a step further if needed; do not open a second task before its predecessor's gate passes. Each functional task follows test → observed failure → minimal code → focused test → typecheck → recorded evidence. Test names describe externally observable behavior, not implementation internals. Keep the first meaningful failing output and the final passing output.

For a newly created test file:

```sh
node --import ./scripts/resolve-ts.mjs --experimental-strip-types --test src/lib/limen/development.test.ts
npm run typecheck
git diff --check
```

Replace the test path with the current task's named files. Normal `npm test` already discovers `src/lib/limen/*.test.ts`. Do not claim a source-only change is complete because the file parses.

## Task queue and dependencies

| Task | Work | Depends on | Broader-plan mapping |
|---|---|---|---|
| L00 | Inventory and recovery baseline | none | A0 |
| L01 | Verify, commit and push current foundation | L00 | A0 |
| L02 | Freeze records, constraints and policy contract | L01 | bounded A1/A3 |
| L03 | Expectations and attributed observation resolution | L02 | bounded A4 |
| L04 | v3 storage, control preservation and deletion | L02–L03 | bounded A2 |
| L05 | Separate simulation observations and scorer; freeze controls | L03–L04 | bounded A5 |
| L06 | Evidence-derived competence and candidate commitments | L05 | bounded A6/A8 |
| L07 | Reviewed admission and coherent check selection | L06 | bounded A7/A8 |
| L08 | Bounded autonomous queue, pause and recovery | L07 | bounded A8 |
| L09 | Integrated Mind/Self/Ledger rehearsal journey | L08 | bounded A11 |
| L10 | Protected comparisons and scope disposition | L09 | bounded A10 |
| L11 | Final normal/build/browser proof | L10 | bounded A11 |
| L12 | Final report, commit, push and remote verification | L11 | publication |

A9 (persistent perspective alternatives), open-ended context growth and broader real-world admission are not completed by this queue. Register the mapping without checking off whole A-tasks.

## L00 — inspect and preserve the actual starting tree

**Read:** source-of-truth files in the goal, `package.json`, `.gitignore`, `startup.sh`, `scripts/preview.mjs`.
**Write:** `docs/evidence/luna/foundation-manifest.json`, progress and queue entries. Do not edit app behavior.

1. Record `pwd`, `git status --short --branch`, `git rev-parse HEAD`, `git remote -v`, `git log -3 --oneline`, `node --version`, `npm --version`, and `git ls-remote --heads origin`.
2. Inventory modified/untracked paths without opening secrets. List what belongs to enhancements, charter, source assessments, goal docs and evidence. Classify unrelated/incidental files explicitly; preserve them unstaged. Use explicit file lists, not `git add .`.
3. Write a SHA-256 manifest of the included source/config/tests/docs and a list of exclusions. Do not include `.env*`, dependencies, generated output or private browser state. Record the actual dirty tree, not just HEAD.
4. Use the existing checkout for this first checkpoint. Do not stash, reset, clean or reconstruct only from HEAD. If another task is actively changing overlapping source, record affected paths and stop conflicting writes; complete independent checks.

**Gate:** reviewed file manifest identifies the current foundation and excludes unrelated content. If current history differs from the recorded starting point, reconcile from source truth before continuing.

## L01 — publish the verified foundation before feature work

**Files:** only manifest-approved existing foundation files, this goal/runbook, supporting truth files and fresh gate evidence. `.gitignore` may add `.DS_Store` patterns without deleting files.

1. Run the normal gates and dev/built browser recipes below. Run the old evaluator in the isolated copy; save the resulting report under this goal's evidence rather than replacing `evaluation/limen/results/latest.*`.
2. Fix only reproducible foundation failures required for these gates. Explain each change and preserve failed evidence; do not start the new learning modules yet.
3. Create or resume branch **`luna/commitment-cycle`**. The user authorized normal scoped commits/pushes for this goal. Publishing on this branch preserves `main` and provides a recoverable checkpoint without an automatic main merge. If the branch exists, verify its ancestry/purpose and resume; do not overwrite it. If known automation would deploy this branch to production, stop that publication step for the production decision while continuing local work.
4. Stage explicit reviewed paths; inspect `git diff --cached --stat`, `git diff --cached --check` and the actual staged diff. Screen for credentials, machine/user-state exports, generated bundles and unexpected large files; display only filenames/locations for potential secrets. Keep synthetic evaluation/screenshots needed by reports, not failed scratch duplicates unless they support a documented finding.
5. Commit `feat: checkpoint verified Limen foundation and continuity charter`. Push with `git push -u origin luna/commitment-cycle`. Never force-push. Compare `git rev-parse HEAD` with `git ls-remote origin refs/heads/luna/commitment-cycle` and record the foundation SHA.
6. If remote advanced, fetch the named branch, inspect history, integrate safely without discarding work and rerun affected checks. Stop for incompatible overlapping changes rather than guessing. A denied push leaves publication incomplete; record it.

**Gate P0:** source, tests and evidence are committed and present on the remote branch. The existing origin must remain `deesatzed/limonize`; do not create another remote or repo. Ordinary sandbox approval prompts are tool permissions, not a reason to re-ask the product decision.

**Limited continuation exception:** if local verification and the foundation commit pass but publishing is externally blocked, mark L01 `local checkpoint complete / publication pending`. Record the blocker and continue independent L02–L11 work from that local checkpoint. P0 remains unmet and full completion remains blocked until publication succeeds. Do not proceed from an unverified or uncommitted foundation under this exception.

## L02 — define and freeze the small development contract

**Create:** `src/lib/limen/development.ts`, `development.test.ts`, `docs/plans/LUNA_CONTRACT.md`.
**Modify:** `src/lib/limen/types.ts` only where existing domain types need links.

1. Translate the fixed contract in `GOAL_LUNA.md` into explicit discriminated payload interfaces. Enumerate expected IDs/references for each event, state version and policy lifecycle transition in `LUNA_CONTRACT.md`.
2. Add tests for replay order, duplicate ID idempotency, same-ID/different-content rejection, unknown event kinds, deleted dependencies and no implicit restoration of a superseded version.
3. Implement pure event validation/replay with a finite context/condition vocabulary. Use existing `EvidenceItem`, `CheckReceipt` and action IDs through adapters; do not create incompatible parallel case/run concepts.
4. Add tests that learned data cannot change the charter, enabled/pause settings, user objectives or available actions. Store those controls outside learnable payloads.
5. Run the focused test and typecheck. Record the contract version and scope choices. No policy becomes active in this task.

**Gate P1 foundation:** the same admissible event history produces the same state; invalid references and control injection fail closed.

## L03 — connect expectations to actual evidence

**Create:** `src/lib/limen/expectations.ts`, `expectations.test.ts`.
**Modify:** `check.ts`, `types.ts`, `store.ts` only for explicit expectation/check links and actual receipt events.

1. Test expectation-before-observation ordering, wrong case/run/criterion/version, report versus receipt, invalid artifact, checker error, missing follow-up, superseded evidence and user correction.
2. Implement expectation creation and resolution with the goal's five resolution states. Reuse `checkReportArtifact`; preserve its shape-only claim. Recompute/check a receipt's artifact, criterion, output and attribution before admitting it.
3. Keep reported outcomes useful but separate from independent check evidence. A model/user saying “verified” never satisfies a receipt condition. A receipt for another case or earlier artifact version cannot authorize the current transition.
4. Add an end-to-end unit fixture: pressure holds requirement → unverified assertion holds → actual compatible shape receipt resolves the local requirement. This need not claim learned benefit.
5. Run expectations/check/workflow suites and typecheck.

**Gate P2:** the requirement changes only through linked admissible evidence or an explicit authorized correction/suspension path.

## L04 — persist v3 records without weakening control or deletion

**Create:** `src/lib/limen/development-data.test.ts`.
**Modify:** `data.ts`, `storage.ts`, `store.ts`, `types.ts`, `data-controls.tsx`.

1. Test v0→v2→v3 migration and direct v2→v3 migration using actual old-shape fixtures. New collections start empty; retain prior cases, events, pause and legacy preference values. New development mode defaults off.
2. Validate nested discriminated payloads, enums, finite numeric bounds, unique IDs, relationships and referenced versions before one atomic import. Use UTF-8 byte counts for advertised data limits. Corrupt/unsupported input keeps recoverable original storage and blocks destructive overwrite.
3. Test imports cannot resume, enable development, replace methods, install a charter or trust an imported admission flag. Partial exports remove/demote unsupported derived policies; duplicate imports do not amplify support.
4. Test deletion redacts copied source/checklist/summary content, invalidates support and pending jobs, and recomputes competence. The current user case remains legitimate input; historical recall does not restore a deleted case. Keep intentional user reimport distinct from covert restoration.
5. Run development-data/workflow/charter suites and typecheck.

**Gate P6 data foundation:** reload/import preserve controls and evidence meaning. No invalid or partial import creates authority. Commit the passing L02–L04 slice.

## L05 — build small sequential worlds and freeze comparison rules

**Create:** `src/lib/limen/development-world.ts`, `development-world.test.ts`; `evaluation/luna/{worlds,observer,scorer,run}.mjs`, `evaluation/luna/splits.json`, `evaluation/luna/README.md`.
**Modify:** `package.json` with `eval:luna` using the existing TS resolver.

1. Implement bounded simulated observation transitions for acceptance/execution, source dependence and context/version change, plus quiet cases. Map released check choices to product actions `check-acceptance` and `trace-lineage` where eligible. World truth and outcome keys must not appear in the learner's public packet or context tuple.
2. Define/check explicit check costs, observation budgets, initial conditions and terminal outcomes. Checker execution error differs from a valid negative observation. Unchosen real branches remain unknown.
3. Test release ordering, maximum budget, invalid check rejection, deterministic seeds, family/parent lineage and hidden-truth canaries. The pure learner may not import world constructors, scorers or protected expected answers. Browser code must not import `evaluation/luna/`.
4. Freeze development/protected variants, scorer and admission rules from the goal in a manifest before comparative results. Define each comparison arm; include a strong fixed checklist selected on development data only. Keep a baseline snapshot of the enhanced policy from P0, separate from the original `evaluation/baseline/`.
5. Add a `--preflight` mode that validates splits, arm registration, manifests and budget controls without reporting benefit. Run it and the world tests/typecheck. Do not open protected outcomes to tune the policy.

**Gate:** worlds return observations rather than answers; scorer is independent of learner choices and narrative. Checkpoint the frozen comparison contract before L06.

## L06 — derive competence and propose commitments from events

**Create:** `src/lib/limen/competence.ts`, `competence.test.ts`, `commitments.ts`, `commitments.test.ts`.
**Modify:** `development.ts` only for the frozen contract, with versioned changes if needed.

1. Test that feedback alone, duplicated cases, same-origin simulated descendants, unresolved outcomes and self-authored summaries cannot manufacture competence support.
2. Implement the small method/context profile from attributed expectation resolutions. Preserve counts, evidence IDs, contradictions, unknowns, track and method versions. Do not learn a psychological personality or free-form identity narrative.
3. Test opposing histories under the same public decision packet: candidate preference must follow the relevant evidence. Removing history must remove the candidate or its evidence-based preference. Fixture IDs may not drive policy selection.
4. Implement evidence-driven candidate creation and explicit reconsideration/suspension reasons. Prospective trials occur after the candidate's creation snapshot and do not reuse its discovery evidence as independent validation.
5. Run competence/commitment/development suites and typecheck.

**Gate P3 proposal:** a fresh event sequence produces a candidate without manually installing a prewritten active policy. Keep all candidates inactive until L07 review.

## L07 — enforce review before admission and unify selection

**Create:** `src/lib/limen/policy-review.ts`, `policy-review.test.ts`, `selection.ts`, `selection.test.ts`.
**Modify:** `commitments.ts`, `engine.ts`, `enrich.ts`, `types.ts`, minimal store adapter.

1. Test failed/malformed/errored reviews, wrong source versions, wrong tracks and missing receipts. Assert active state stays unchanged—not merely that a failure flag exists.
2. Implement deterministic contract, evidence and continuity reviews. Prepare an accepted batch and check dependencies again before application. A rejected attempt may append diagnostics without activating a policy or scoring success.
3. Test candidate→testing→simulation-scope active, contradiction→suspended, explicit retirement and new-version reconsideration. Never silently reactivate a superseded policy.
4. Implement selection among the current eligible action set. Keep required prerequisites. Derive operation, role activation, action order and explanation from the same selection record; record baseline equality honestly.
5. Demonstrate at least one non-training simulated case where learned history changes the next eligible check and removal/shuffling of that history changes the result. Also test contexts where it should contribute nothing. Constructed functional trials are labeled separately from benefit evaluation.
6. Run policy-review/selection/commitment/engine/workflow suites and typecheck.

**Gates P3–P5:** there is a causal history-to-selection path and no failed review leaves active learning. Commit the passing L05–L07 slice.

Admission here uses the frozen rules on released prospective trial outcomes in an explicitly labeled functional simulation scope. It does not require opening the protected evaluation set early, nor importing its scorer into the learner. L10 supplies the separate comparative-benefit verdict and may remove that scope's active disposition. Keep these two evidence sets and verdicts distinct.

## L08 — schedule bounded work and enforce pause/recovery

**Create:** `src/lib/limen/development-cycle.ts`, `development-cycle.test.ts`.
**Modify:** `store.ts`, `storage.ts`, `data.ts`, `development.ts` as needed within the contract.

1. Test source-event job deduplication, idempotent resume, crash between preparation/admission, no-progress termination, capped slices and queue saturation without source-event loss.
2. Implement the goal's 16-transition/2-episode slices and 100-pending-job bound. Persist pending work; yield between slices. Default limits are code-controlled and are not imported or learned values.
3. Test pause before work, pause during async review, pause immediately before commit, explicit resume, disabled development mode, deleted dependencies and stale late results.
4. On reload, retry only unresolved jobs whose inputs still exist and whose versions still match. No scheduler/network/process outside the open app. Automatic simulation trials use the public observation boundary from L05.
5. Test a full automatically triggered candidate→trial→scoped activation→application→contradiction sequence. Only the initial development-mode enablement may require a user toggle; no per-policy acceptance step.
6. Run cycle/data/selection/charter/workflow suites and typecheck.

**Gates P3/P5/P6:** automatic bounded progress, honest pending states, effective cancellation and recoverable persistence.

## L09 — integrate a compact, usable product journey

**Read first:** `.grok/skills/design-ui/SKILL.md` and relevant references; preserve current design tokens.
**Modify:** `mind-view.tsx`, `self-view.tsx`, `ledger-view.tsx`, `outcome-panel.tsx`, `data-controls.tsx`; add a small `development-panel.tsx` only if it keeps those files coherent.

1. Show development enabled/paused/processing/pending state in Self. Keep one persistent pause control with clear precedence; do not make users administer every event.
2. Mind shows the selected check and a brief explanation when experience changes it. Disclose baseline, source policy/version, evidence, uncertainty and cost on request. Existing operation marks must remain honestly described.
3. Ledger shows candidate/testing/active-simulation/suspended/retired records and reconsideration history, with supported correction/deletion controls. Real advisory scope is visible.
4. Add a clearly labeled local rehearsal using the simulation world module, isolated from real family support. Let users see the pressure/assertion/check/reconsideration sequence without editing storage through developer tools.
5. Test keyboard/touch controls and explanatory states through component/store integration; run product tests and typecheck. Preserve mobile layout and progressive disclosure.

**Gate P7 preparation:** a normal user can observe the lifecycle and its limits. Commit the L08–L09 slice.

## L10 — run comparisons and apply the honest disposition

**Files:** `evaluation/luna/`, run-specific results; `docs/evidence/luna/`; draft `LUNA_REPORT.md`.

1. Verify source and frozen evaluation manifests. Run development comparisons first, diagnose defects there, and freeze the final configuration before the protected run.
2. Run all seven arms on matched histories, budgets and released information. Record every step, cost, failed check, baseline/selected action, scope and policy contribution. Store immutable run IDs; `latest` may only be an index.
3. Check distinct arms actually exercise their intended path. If learned and baseline outputs are identical, report no behavioral contribution there. If no-history/shuffled controls behave identically everywhere, investigate whether the profile is decorative; P4 is not satisfied by relabeling it.
4. Apply the frozen gate by family/track. Report raw counts and per-case data as well as aggregates; retain adverse cases. Differentiate functional success from advantage over the strongest simple control.
5. If benefit is negative/inconclusive, keep unsupported policies shadow/advisory and finish. Do not change protected scores/thresholds to obtain a pass. After evaluation-driven changes, a fresh protected set is required for a new benefit claim; preserve the earlier result.
6. Add a regression for any actual correctness defect fixed, rerun affected suites, and document any admission-state change in UI/data.

**Gate P8:** complete reproducible comparisons and honest scope disposition. No mandate to claim a positive result. Real-scope active learned steering remains deferred under this goal regardless of simulation results.

## L11 — final verification on the exact source

**Create:** `scripts/limen-luna-smoke.mjs`, using the existing guarded browser tooling conventions.
**Evidence:** `docs/evidence/luna/final/`, `screenshots/luna-*`, final source manifest.

1. Run normal checks below; run baseline semantic evaluation in the isolated copy and compare with its historical result. Investigate new regressions; do not rewrite old evidence. Run `eval:luna` on final source/config and preserve its new run ID.
2. Run existing product and charter flows to catch migration/control regressions. Avoid overwriting historical screenshots: add an optional output prefix to those scripts if needed, preserving old defaults, or run them from a matching isolated copy.
3. New Luna flow uses fresh synthetic browser contexts. Exercise real reported input and receipt, separate simulation learning/activation, later selection change, pressure/unsupported assertion, appropriate reconsideration, pause, reload, hostile import, source deletion and late-result rejection. Verify UI through public controls, not only store injection.
4. Run both dev and freshly built output at desktop and 390×844. Inspect screenshots from both viewports and the key new flow. Require no uncaught console/page errors, horizontal overflow, missing branding or unexplained dev/built divergence.
5. If any app source changes after the build, rebuild and repeat affected proof. Preserve source hash and command exit codes, not just a “passed” note.

**Gate P7/P9 technical:** all required verification has current evidence; app remains running through startup contract.

## L12 — record final truth and publish

**Modify:** `LUNA_REPORT.md`, README, IMPLEMENT, DECISIONS, PROGRESS, TASK_QUEUE; update this goal's status only when justified.

1. Map P0–P9 to exact files, tests, run IDs and browser evidence. State implemented scope, functional result, benefit verdict, admitted simulation scopes, real advisory limit and remaining A-tasks.
2. Review the full staged diff against the foundation manifest. Stage scoped source/tests/docs/evidence only; keep unrelated files untouched. Do not require a completely clean working tree if known unrelated files remain; explicitly report them.
3. Commit verified implementation/evidence, then final report if separate. Record the tested implementation SHA in the report. Avoid circular “report contains its own final commit hash” requirements; report the final publication SHA in the final response.
4. Push the named goal branch normally and verify `git ls-remote origin refs/heads/luna/commitment-cycle` equals `git rev-parse HEAD`. Do not force-push, merge to `main` or deploy. If remote verification fails, report that gate as incomplete.
5. End with user-facing capabilities, tests/evaluation limits, remote branch/link and final SHA. Mark the active goal complete only when its required gates are satisfied.

## Command recipes and environment pitfalls

### Normal gates

```sh
npm test
npm run typecheck
npm run lint
npm run charter:check
git diff --check
```

`npm test` already includes charter synchronization and all product tests. Historical count 279 is a reference, not a hard-coded target; never remove tests to meet a count. Store logs and exit codes. Independent build/typecheck may run concurrently once source is stable; keep dependent edits sequential.

### Isolated build and historical evaluator

The original export tracks generated build files. Use a new copy for each final build:

```sh
LUNA_REPO="$PWD"
LUNA_BUILD=$(mktemp -d "${TMPDIR:-/tmp}/limen-luna-build.XXXXXX")
rsync -a --exclude=.git --exclude=node_modules --exclude=.vercel --exclude=.output --exclude=.nitro --exclude=screenshots --exclude=.env --exclude='.env.*' "$LUNA_REPO/" "$LUNA_BUILD/"
ln -s "$LUNA_REPO/node_modules" "$LUNA_BUILD/node_modules"
cd "$LUNA_BUILD"
env -u DATABASE_URL npm run build
npm run eval:limen
```

Record the actual path; shell variables do not survive separate tool sessions automatically. Capture exit codes separately if batching. Compare/hash authored source against the checkout before using the build as proof. Copy new evaluation reports into this goal's evidence; leave historical originals intact. Use existing dependencies; if genuinely missing, use the lockfile installation path after documenting the need, not an opportunistic upgrade.

### Dev and built browser QA

1. Read `.grok/references/browser-qa.md`. Start/reuse dev with `sh startup.sh` from the actual checkout; use its `LIMEN_FOREGROUND=1` mode in a managed terminal if background lifetime is unreliable.
2. On macOS the `/proc` preview helper is unavailable. Inspect any 8081 listener's PID, command and working directory. Stop only a positively identified Limen preview, then from the fresh build copy run `npm run preview -- --host 127.0.0.1 --port 8081`. Leave unknown processes alone. In a supported Linux sandbox use `npm run preview:restart` after confirming the intended port owner.
3. A dev server previously served stale cached source. If the new UI is absent, inspect the served module and process directory before editing product code; restart only the identified app through `startup.sh` when needed.
4. Run from the current checkout, with output confined to its `screenshots/`:

```sh
node scripts/browser-smoke.mjs http://127.0.0.1:8080/ screenshots/luna-final-dev.png
node scripts/browser-smoke.mjs http://127.0.0.1:8081/ screenshots/luna-final-built.png --baseline screenshots/luna-final-dev.json
node scripts/limen-luna-smoke.mjs http://127.0.0.1:8080/
node scripts/limen-luna-smoke.mjs http://127.0.0.1:8081/
```

5. Give interaction images distinct names (`luna-flow-dev-mobile.png`, etc.); do not overwrite home-render evidence with Self/Mind screenshots. Visually inspect desktop/mobile images in a batched read.
6. `agent-browser` was previously unavailable after two probes; recheck availability once in a new environment. Use the documented Playwright fallback when it remains unavailable or fails per its instructions. Chromium may need ordinary tool escalation on macOS. Do not ask the user to do browser QA.

### Resume record after every passing task

Append this concise structure to `PROGRESS.md`:

```text
Task: Lxx; status: passed / in progress / blocked
Source: branch, HEAD, included dirty paths, snapshot/manifest path
Changed: explicit file list and behavior
Evidence: command, exit code, test result, artifact paths
Decision: assumption or contract adjustment, if any
Limits: functional vs benefit, current admitted scopes
Next: exact task and first action
```

A task failure is not a cue to skip it. After three distinct failed repairs, preserve the smallest reproducer, record what remains blocked, finish independent work and follow the goal/tool stop rules.
