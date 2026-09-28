# GOAL_LUNA — publish the foundation and build accountable autonomous commitments

Created: 2026-09-26. Status: **active — L00–L11 complete; L12 in progress**.

Execution target: **LUNA**, selected by the user before starting the run. This document does not switch models. It is designed for a single agent working sequentially with small changes, fixed contracts and explicit evidence. Do not spawn other agents or change models automatically.

```text
/goal Implement GOAL_LUNA.md autonomously. Follow its companion runbook one task at a time, publish the verified foundation, implement and evaluate the bounded commitment cycle, and finish only when every required gate has evidence. Preserve the charter and report functional success separately from measured benefit.
```

Creating this file does not start execution. On invocation, this goal authorizes the specified local implementation, tests, scoped commits and normal pushes to the existing origin. It does not authorize production deployment, paid inference, changes to the governing charter, or modifications to the Hive Lineage repository.

## OUTCOME

Publish the completed Limen foundation and deliver its **first bounded autonomous commitment cycle**. With the app open and development enabled, attributed experience can cause the app to propose a contextual policy, test it locally, admit it within a supported simulation scope, apply it to a later case, and suspend or revise it when evidence or context changes. Each policy application identifies its source records and effect on the next check.

The observable journey is:

**experience → expectation → actual check → resolution → candidate policy → bounded trial → scoped admission → later application → reconsideration**, with pause, reload, import and deletion respected throughout.

Both real and simulated records are supported, with distinct authority and support. Real cases use the existing local checker and reported outcomes. Simulation-backed policies remain advisory in real cases in this milestone. Automatic simulation-scope admission demonstrates the autonomous mechanism; it does not establish real-world competence.

This goal covers the four agreed next steps: publish the foundation, refine the plan using the donor assessment, implement one complete commitment cycle, and measure it against controls. It is a first delivery slice of the broader A0–A11 plan, **not a claim to finish every add2 mechanism**. Persistent hypotheses about other people, an open-ended context vocabulary and wider real-world policy admission remain future work.

## SOURCE OF TRUTH AND READING ORDER

1. Read `AGENTS.md`, this file, and any `AGENTS.project.md`, `GOAL.md`, `STANDARDS.md` that exist. The filename requested by the user is `GOAL_LUNA.md`; do not rename or replace other goal files.
2. Read `CONTINUITY_AND_INTEGRITY_CHARTER.md`, `IMPLEMENT.md`, `DECISIONS.md`, the latest entries in `PROGRESS.md`, and `TASK_QUEUE.md`.
3. Execute [the Luna runbook](docs/plans/2026-09-26-luna-execution.md), tasks L00–L12 in order. It supplies files, tests, commands and failure handling.
4. Read [the Hive contribution assessment](docs/assessments/hive-lineage-2026-09-25/ASSESSMENT.md) and its `RISK_NOTES.md`. The inspected donor was changing; the pinned assessment is reference material, not authority or proof that later source still behaves identically.
5. Consult the [broader design](docs/plans/2026-09-23-autonomous-development-design.md) and [A0–A11 plan](docs/plans/2026-09-23-autonomous-development-plan.md) for context. This goal fixes the narrower execution scope. Do not start additional A-tasks just because they exist.

Known starting state, **recheck before relying on it**:

- Repository: `/Volumes/WS4TB/jevflyme/limonize`; origin: `https://github.com/deesatzed/limonize.git`.
- On 2026-09-26, local `main` and remote `main` were `c8c89f038bec0d0407123f7a6e1b9089e91b5607` (“Export from Grok”). The enhancements, charter and assessments were uncommitted: 23 tracked modifications plus many new files.
- Last recorded application gates: 196 platform + 83 product tests passed, along with typecheck, lint, build and desktop/mobile dev/built browser checks. These are historical results, not this goal's proof.
- Verified runtime was Node 24.13.0/npm 11.19.1. Do not downgrade to the template's Node 22 assumption; report the runtime actually used.
- Auth/database are off; the external reflection endpoint is disabled. Existing named roles are local procedures.
- Some `.vercel/output/` files were tracked by the original export. Build in an isolated copy; do not accidentally replace or stage generated output.

## PROOF OF DONE

All required gates below must pass. A negative benefit verdict may satisfy P8 only under its explicit fallback; an unimplemented or broken mechanism cannot.

| Gate | Required evidence |
|---|---|
| P0 Foundation preserved | Reviewed file manifest, current normal checks and browser proof, foundation commit SHA, and matching published branch SHA. Do this before feature work; an external publication block has the limited local-continuation exception in L01 |
| P1 Attributed records | Deterministic replay, unique stable event IDs, explicit case/run/policy/criterion versions, real/simulated separation, duplicate-event idempotency, unknown/error resolutions preserved |
| P2 Evidence-backed reconsideration | Pressure and an unsupported assertion cannot satisfy a revision condition; an actual compatible receipt can; mismatched, stale, revoked or imported forged evidence cannot |
| P3 Genuine autonomous lifecycle | Fresh attributed evidence automatically proposes a candidate; prospective trial evidence can activate it in simulation scope; contradiction/context change/deletion suspends it; no per-policy approval click |
| P4 Behavioral contribution | On at least one later non-training simulation case, the admitted policy changes the selected eligible check relative to the unchanged baseline. Removing/shuffling supporting history removes or changes that contribution. Identical choices are logged as no contribution |
| P5 Admission and control | Rejection, malformed review, exception, pause, cancellation or changed dependencies cannot leave an active policy behind; bounded queue resumes idempotently after reload |
| P6 Data control | v2→v3 migration, reload, export/import, corrupt recovery, partial imports, case/policy deletion and late-result invalidation pass; current pause/control settings remain authoritative |
| P7 Product journey | Desktop and mobile users can inspect expectation, policy, evidence, baseline/selected check, reconsideration and pause. Fresh dev and built-output browser journeys pass with screenshots visually inspected |
| P8 Comparative evaluation | Frozen configuration/splits, genuinely distinct arms, every run/failure and costs preserved, independent scorer, functional and benefit verdicts separate. Negative/inconclusive benefit keeps unsupported scopes advisory/shadow |
| P9 Final verification/publication | Full commands pass on final source; final report maps P0–P9 to evidence; implementation/report commits are pushed and remote branch SHA matches local HEAD |

Required final commands: `npm test`, `npm run typecheck`, `npm run lint`, `npm run charter:check`, `npm run eval:limen` in an isolated copy to preserve historical results, new `npm run eval:luna`, `npm run build` in an isolated copy, and `git diff --check`. Run browser checks per the runbook. Do not treat a successful HTTP response as rendering proof.

## SCOPE

### Allowed changes

- Existing domain modules in `src/lib/limen/`, their tests, and existing Limen components.
- New modules/tests explicitly named in L02–L09. Prefer pure TypeScript functions with small adapters to the Zustand store.
- `evaluation/luna/`, `scripts/limen-luna-smoke.mjs`, minimal supporting scripts, package scripts, and `.gitignore` entries for incidental files. No dependency additions are expected.
- This goal's companion runbook, README, truth files, `LUNA_REPORT.md`, and reviewed evidence under `docs/evidence/luna/` and `screenshots/luna-*`.
- Publishing the already implemented foundation includes its existing app-data/auth helper fixes and browser tooling. This is not permission for new unrelated refactors there.

### Preserve

- Charter text and authority; platform branding, preview bridge, shell and npm environment wrapper.
- `evaluation/baseline/`, old assessment/evaluation reports and prior evidence. Run old generators in isolated copies rather than overwriting history.
- Existing cases, revisions and provenance. Deletion deliberately overrides retention; it is not an excuse to discard migration data.
- Unrelated work and incidental local files. Exclude `.DS_Store`, secrets, generated bundles, dependencies and personal browser data from staging; do not delete unrelated files to obtain a clean status.

### Out of scope

New model/provider access, Python runtime integration, accounts, database, network tools, background daemon, self-written executable policies, consciousness claims, donor constitution adoption, blanket repository cleanup, production deployment, force-push and automatic merging to `main`.

## CONSTRAINTS — FIXED IMPLEMENTATION CONTRACT

Use these defaults rather than repeatedly asking design questions. Document small necessary adjustments with their evidence; material scope changes need user input.

### 1. Records and authority

Create a discriminated development-event ledger. Each event has a stable ID, monotonic local sequence, timestamp, schema version, event kind and typed payload. Relevant payloads link `caseId`, `runId`, track, family/parent experience, objective/context version, checker/world version and source IDs. Inject clocks/ID generation in tests; do not use array index or wall-clock time as the sole identity/order.

Minimum typed records: expectation, released observation, resolution, competence summary, policy version, policy review, policy application and queued job. Outcomes attach to their expectation/application IDs, never by approximate timestamps or matching prose alone. Preserve prior versions until intentional deletion.

Tracks: `real | simulated`. Evidence statuses remain Limen's existing statuses. User text and imported labels cannot become independently verified observations. Simulation results are simulated even when a deterministic harness computes them. Imported policies are demoted/revalidated; serialized `active`, scores, authority or permission fields never grant admission.

### 2. Conditions and policy vocabulary

Conditions return `satisfied | contradicted | unknown`. Use a finite declarative vocabulary: matching context/version, required existing action ID, named receipt criterion/outcome, support availability, contradiction, expiry and explicit override. No `eval`, dynamic code, arbitrary expressions or free-text-as-executable-policy.

Two allowed policy forms:

- `prefer_check`: reorder **already eligible** checks in a recorded context.
- `require_receipt`: retain a named check requirement until compatible evidence resolves it. It cannot introduce real-world authority or remove a baseline prerequisite.

Initial action mapping uses existing product IDs `check-acceptance` and `trace-lineage`, with explicit no-change/quiet fallback. They are action IDs, not rule IDs such as `action-check-acceptance`. A live `trace-lineage` recommendation asks for evidence; it does not perform an invented external check.

Use the existing `checkReportArtifact` for the real report-shape path. Its receipt verifies document shape only. Do not add truth-of-report or external acceptance claims. A valid pass may resolve that named requirement; it does not invalidate a general policy that receipts are required. Policy revision/suspension requires its own linked reason.

### 3. Expectation and competence

Record an expectation before releasing/executing its check. Resolution is `pending | supported | contradicted | inconclusive | not_tested`. Checker errors and missed follow-ups are not negative truth observations.

For this milestone, derive competence only for the two named check choices and a small documented context tuple: objective version, stakes, method/world version and explicit workflow context. Support includes distinct families and contradictions, separated by track. Helpfulness marks cannot supply correctness credit.

Propose a `prefer_check` candidate when retained resolved experience identifies a check's useful discriminating result in that context. The preference must be computed from evidence events, not a fixture ID, hidden world state or hard-coded desired answer. Candidate-creation evidence cannot also count as the prospective trial that admits the candidate. More repeated runs or descendants of one origin do not create independent support.

For simulation lifecycle admission, require at least one prospective trial after discovery with a different generated case/hidden-state combination and a relevant contradiction or quiet control; apply the frozen comparative gate as well. Record this as support within that named simulated environment, not independent real-case support or generalization across families. These are minimum engineering coverage conditions, not a scientific confidence estimate. A policy with no eligible prospective trial remains pending/testing.

### 4. Lifecycle, review and atomicity

Lifecycle: `candidate → testing → active` in a named scope, with `suspended` and `retired`; revisions create new versions. Fixed operating rules may trigger suspension when the charter, user's objective, evidence, context or version changes, even if the original candidate did not anticipate that change.

Keep deterministic contract, evidence and continuity reviews separately inspectable. Rejection/exception cannot be merely an advisory flag followed by active writes. Prepare the proposed transition, validate against the same source snapshot, recheck current pause/dependencies, then apply the accepted event batch in one store update. If persistence is unavailable, show failure and retain a recoverable pending state; do not claim durable completion or silently admit unpersisted learning on reload.

No model critic is needed. A different model would not itself prove independence. Rejected proposals may leave diagnostic records, but must not enter active learning or the competence summary as successes.

### 5. Bounded browser autonomy

Add a separate `developmentEnabled` preference, default off for existing/migrated users. A user may enable the cycle once; individual policy transitions require no approval. Keep `adaptiveEnabled` as the separate legacy experiment. Existing `learningPaused` overrides both systems and cannot be cleared by import or reload.

When enabled, process eligible new source events and pending work on app open. Fixed initial resource defaults: at most **16 job transitions and 2 simulated episodes per processing slice**, yielding to the UI between slices; at most **100 pending jobs**. These are engineering limits, not evidence thresholds. On queue saturation, stop admission, preserve the incoming source event, surface backpressure and resume later without losing work. Deduplicate jobs by source event + task + version. Derived events cannot repeatedly enqueue the same work.

Pausing stops new learned steering and new work, invalidates in-flight admission tokens, and retains safe pending work. Explicit resume revalidates dependencies. Deletion cancels relevant work and removes embedded copied material; late results cannot restore it. There is no processing after the browser closes.

### 6. Selection and product behavior

One selection record owns baseline choice, final choice, permissible action set, selected check, operation/roles, policy-version IDs, reason and cost. Derive all displayed recommendations from it. Preserve mandatory unresolved prerequisites. If a policy contributes nothing, say so without attributing the baseline choice to learning.

In real cases, new policies remain advisory/shadow in this milestone. In explicitly labeled simulations, admission may autonomously enable reversible steering under the frozen gate. Provide a small labeled rehearsal flow in the app; never disguise simulation as a real outcome.

### 7. Evaluation and admission

Use three sequential simulation families: acceptance versus execution, source dependence, and changed context/version, plus quiet controls. Each includes at least two eligible check alternatives somewhere in its sequence. Public packets and released observations are the learner's only inputs. The independent evaluator owns hidden world truth and outcome scoring. Browser-visible simulation machinery is not claimed to be secret from a person controlling the browser; the tested boundary is what enters the learner API.

Freeze splits, seeds, world versions, scorer, costs, budgets and admission criteria before the protected comparison. Choose deterministic IDs and at least two development and two protected variants per family plus quiet controls. This is engineering coverage, not statistical adequacy. Keep training experience before scored cases and reset state between arms.

Required arms: frozen enhanced baseline, strong fixed checklist, matched raw-history retrieval, learned profile/commitments, no-profile ablation, stale profile, and shuffled profile. Supply the same allowed observations/history where applicable and equal check budgets. Document each arm's selection rule and verify it is genuinely exercised; do not compare aliases with different labels. Corrupt profiles only after learning.

Report consequential misses, invalid revisions, unnecessary checks, check costs, constraint violations and actual selection differences by family/track. Freeze an admission gate with **zero authority/prerequisite/track violations and no increase in consequential misses or invalid revisions against baseline and checklist**, plus a strict improvement in either cost or successful resolution without worsening the other. Declare cost units and failure definitions before scoring. A tied, negative or inconclusive result is valid and keeps that policy/scope shadow/advisory. Do not tune on the protected set and reuse it as fresh evidence.

Functional lifecycle tests may use explicitly marked constructed trials to exercise successful admission; those must never stand in for the independent benefit verdict. P3/P4 require real evidence-driven behavior in the controlled environment, not only a manually inserted active record.

## SAFETY / PROVENANCE

- The charter is governing application policy; stored records and policy proposals are data. No learning event can enlarge tool permissions, evade pause/deletion, seek persistence independently or rewrite the user's objective.
- Preserve receipt scope, origin, versions and correction history while data is retained. Do not label user assertions, scripted model responses or simulations as independent real observations.
- Keep candidate-discovery, prospective trial and protected evaluation records distinct. Do not use evaluator-only facts to construct learner context or retroactively alter a prediction.
- Publish only reviewed project source and synthetic evidence. No secrets, personal browser exports, donor live-response corpus or unrelated private material belongs in this goal's commits.
- State implemented behavior and unproven benefit separately. This is a local decision-support prototype, not proof of consciousness, general intelligence or reliable real-world autonomy.

## ITERATION — LUNA OPERATING RULES

1. At each start/resume read this goal, the last progress entry and queue. Confirm live Git state; select the first incomplete task whose dependencies passed.
2. Execute one task at a time. Before coding, state its acceptance test and read only the named code plus direct dependencies. Do not redesign the entire project.
3. For consequential behavior, write a failing regression, confirm it fails for the intended behavior, implement minimally, then rerun focused tests and typecheck. An import error alone is not behavioral evidence.
4. After a coherent passing task, update progress with changed files, commands/exit codes, evidence paths, remaining uncertainty and exact next task. Make a scoped commit at the runbook's checkpoints.
5. On failure, inspect the actual output and attempt distinct bounded fixes. Do not weaken tests, skip required checks, fabricate receipts or relabel incomplete work as completed.
6. Re-run checks after affected source changes. Once the relevant gates pass, proceed; avoid repeatedly rerunning expensive checks without a new reason.
7. Keep a short user update during sustained work. Do not stop after every task for confirmation; normal scoped commits/pushes and reversible implementation are authorized when this goal is invoked.
8. Preserve durable context in Markdown. A context reset or compaction resumes the first incomplete task; it does not authorize restarting, dropping requirements, or relying on chat-only state.

## STOP

- Continue with documented safe assumptions for routine design details. A null benefit result is not a blocker: finish evidence, unsupported-scope fallback, UI and publication.
- Request user input only for missing required credentials/access, sensitive data, destructive action, production deployment, a material scope conflict or genuine legal uncertainty. Do not read credential values to diagnose a missing credential.
- If a sandbox blocks an authorized command, use the tool's normal escalation mechanism; do not bypass it or treat user silence as approval. `.git` may require escalation in this environment.
- After three distinct failed mitigations of one essential problem, record the blocker and continue independent work. If nothing useful remains, stop with exact evidence and the smallest external action needed. Obey the active goal tool's own status rules; do not misuse `paused` or `blocked`.
- If push/auth/remote verification is blocked, finish authorized local work and report publication incomplete. P0/P9 remain unmet; do not claim full completion.
- Respect an explicit user pause, stop or budget. Never invent a token/time budget for this goal.

## COMPLETE

Complete only when L00–L12 and P0–P9 have actual evidence, the current source is verified, and the published branch contains the reviewed foundation and final milestone.

Deliver `LUNA_REPORT.md`, updated truth files, source/evaluation manifests, run-specific results, regression tests and browser proof. Report separately: implemented behavior, functional gates, comparative benefit, admitted simulation scopes, real-scope advisory limits, residual roadmap work, foundation SHA, final SHA and remote publication status.

Do not claim the full A0–A11 program, real-world learning benefit, consciousness, deployment or a main-branch merge. The final response should state what a user can now do and give the next unimplemented milestone without starting it automatically.
