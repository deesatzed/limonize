# GOAL_ENHANCE — implement the six Limen enhancements

Created: 2026-09-23. Status: locally implemented and verified on 2026-09-23; see `PROGRESS.md` and `ENHANCEMENT_REPORT.md` for gate evidence and limits.

This is the implementation contract for the six recommendations in the repository assessment summary. Creating this file does not start an autonomous run, authorize paid inference, or authorize deployment. When invoked, implement the bounded local product changes below through verification.

Suggested invocation:

```text
/goal Implement GOAL_ENHANCE.md. Work through all six enhancements and their prerequisites, keep the project truth files current, and complete only when every required acceptance gate has current evidence.
```

## OUTCOME

Turn Limen into a dependable, browser-local decision and reflection workbench in which a person can:

1. Distinguish reported, inferred, simulated, and verified evidence.
2. Inspect immutable session revisions and correctly attributed feedback.
3. Record the action taken, expected result, actual outcome, and resulting revision.
4. Correct source-linked interpretations whose behavior is tested on unfamiliar cases.
5. Promote and reuse lessons only when distinct, outcome-backed cases support their applicability.
6. Use a clear default interface and control retention, export, deletion, and recovery.

The completed user loop is: **describe → inspect evidence and unknowns → choose a next check/action → record an outcome → revise → conditionally reuse a lesson**.

Preserve the existing visual identity and inspectable reasoning. Completion means these behaviors work and their verification gates pass. It does not establish general intelligence, calibrated confidence, real-world decision improvement, or production readiness.

## SOURCE OF TRUTH AND STARTING STATE

Before implementation, read `AGENTS.md`, this file, and any existing `GOAL.md`, `STANDARDS.md`, `IMPLEMENT.md`, `DECISIONS.md`, `PROGRESS.md`, `TASK_QUEUE.md`, and `AGENTS.project.md`. Reconcile any actual scope conflict before making the conflicting change.

Read these assessment artifacts:

- [ASSESSMENT.md](ASSESSMENT.md): findings, implementation boundaries, and recommendations.
- [ASSESSMENT_EVIDENCE.json](ASSESSMENT_EVIDENCE.json): recorded command results and behavioral probes.
- [REPO_MAP.md](REPO_MAP.md) and [RISK_NOTES.md](RISK_NOTES.md): architecture and risks.
- [EXPLORATION_REFERENCE.md](attachments/EXPLORATION_REFERENCE.md): broader conceptual source, especially evaluation section 23.

The assessment examined `c8c89f0`. Recheck the current branch, HEAD, working tree, dependencies, and truth files before executing; do not assume the snapshot remains current. Preserve unrelated changes and historical assessment evidence.

Recorded baseline, to be reverified:

- Build and TypeScript passed on Node 24.13.0; Node 22 compatibility was not established.
- Default tests: 187 passed and 8 failed in the first phase; the second phase did not run. Its separate invocation passed 55 tests.
- Six Limen engine tests were excluded from `npm test`; direct execution failed on extensionless imports. A temporary assessment resolver allowed all six to pass.
- Lint reported one error and one warning.
- Fresh browser verification was incomplete; the smoke tool assumed `/workspace`, and no browser was available during assessment.
- Auth/database were disabled. Live provider calls and deployment were not tested.

The six enhancements here follow the six-item user-facing recommendation list. Test/environment repairs are prerequisites. Additional model-provider integrations from the assessment's longer roadmap are outside this goal.

## SCOPE

Primary implementation surfaces:

- `src/lib/limen/`: domain types, evidence, revisions, feedback, outcomes, interpretation, routing, memory, persistence, existing provider boundary, tests.
- `src/components/limen/`, `src/styles.css`, and product metadata in `src/routes/`: user flows, disclosure, controls, accessibility, truthful capability descriptions.
- `package.json`, `package-lock.json`, test configuration, and narrowly scoped `scripts/` changes: normal test execution, portable startup/QA, evaluation, and isolated test fixtures.
- `startup.sh`: support the actual checkout while retaining the original `/workspace` lifecycle, npm wrapper, and host/port contracts.
- New local fixtures/evaluation resources, documentation, and evidence under clearly named project directories.

Narrow fixes to inherited helpers are allowed when required to repair a demonstrated build, lint, or test failure. Avoid broad platform refactoring. Do not remove, overwrite, or disable protected platform assets, branding, middleware, preview bridge, or prewired helpers.

On execution, create or update `README.md`, `IMPLEMENT.md`, `DECISIONS.md`, `PROGRESS.md`, and `TASK_QUEUE.md` as needed. This file remains the enhancement contract; do not silently replace another goal. Record task IDs, acceptance criteria, dependencies, and evidence paths in the task queue. Preserve historical assessments and the exploration reference unchanged.

## PREREQUISITE — reproducible baseline and shared data contract

Before feature implementation:

1. Reproduce the existing gates and save command output, exit codes, source identity, and runtime versions.
2. Put all product tests into the normal runner using a supported, repository-owned TypeScript execution method. Repair branding-test isolation without weakening expectations or disabling failures. Fix the demonstrated lint issues.
3. Make startup and smoke tooling work from the repository's actual root while preserving the original `/workspace` behavior. Keep screenshot output confined to the canonical project `screenshots/` directory and retain path-traversal protections. Keep `npm run dev` through the environment wrapper, development at `0.0.0.0:8080`, and built-output QA at `127.0.0.1:8081`.
4. Select and document the supported Node runtime range. Verify the documented default runtime; do not claim compatibility with untested versions.
5. Freeze the pre-enhancement engine and evaluation inputs as a reproducible baseline, with source/fixture hashes and provenance. Never import the evaluation answers into product code.
6. Define shared identifiers and migration semantics for cases, revisions/runs, evidence/check receipts, actions, outcomes, evaluations, memories, and provider requests before changing their consumers. Implement incrementally, preserving valid existing data.

Prerequisite exit gate: normal build, typecheck, test, and lint commands run reproducibly; product tests are included; baseline evidence and the migration design are recorded. Historical failures remain visible in the record.

## ENHANCEMENT 1 — truthful evidence and provenance

### Required behavior

- Give each evidence record a stable ID, origin, timestamp, applicable case/revision, and source reference or source span where available.
- Distinguish user-reported information, inferred interpretations, assumptions, simulations, unresolved questions, and verification by an actual recorded check. A user's confirmation changes a record to confirmed/reported; it does not independently verify the world.
- Represent a verification receipt with the checked artifact or its content hash, criterion/schema version, checker version, pass/fail/error result, and time. “Verified” refers to the recorded check and its limited claim, not every conclusion about the case.
- Replace the current hidden-check behavior with an explicitly labeled simulation restricted to demonstration cases. A normal case cannot acquire a verified schema failure from a button press that inserts a marker.
- Provide at least one real, bounded deterministic check with an inspectable artifact and criterion, covering both pass and fail. Never execute code supplied in an imported artifact. Manually entered outcomes remain reported unless accompanied by a real checker receipt.
- Link conclusions and next checks to supporting records and unresolved dependencies. Expose missing provenance instead of inventing it.
- Determine permissible operations from unresolved prerequisites before applying feedback preferences. All displays of the chosen operation, actions, and activated roles must agree. Stopping or escalating must preserve the unresolved prerequisite explicitly.

### Acceptance tests

- A simulated schema reveal stays simulated throughout Mind, Ledger, export/import, and subsequent reuse.
- A normal handoff narrative cannot manufacture a check result or the assertion that a report used an outdated schema.
- A valid artifact passes its named criterion; an invalid artifact fails; an execution error is neither pass nor substantive failure. Each result has the correct receipt.
- A confirmed reading retains its original source and correction history.
- Reachable feedback weights cannot bypass a failed prerequisite or produce contradictory operation/action guidance.

## ENHANCEMENT 2 — immutable revisions and attributable feedback

### Required behavior

- Preserve the case as a stable identity and append a new immutable revision/run when inputs, readings, answers, checks, or relevant role configuration change. Old results remain inspectable with their original evidence and configuration.
- Bind feedback to its exact run, evaluated target/action or role configuration, and event ID. Separate subjective helpfulness from observed outcomes and independent validation.
- Make duplicate event submission idempotent. A correction supersedes an earlier evaluation through an explicit event; it does not silently add another unit of credit.
- Derive effective statistics and bounded learning weights from the event history. Define how repeated revisions of one case contribute so that they cannot count as independent cases or repeatedly amplify one lesson.
- Keep counts, denominators, current effective marks, and historical marks consistent. Reloading or replaying a ledger produces the same effective state.
- Scope any adaptive preference by relevant context and retain the prerequisite constraints from enhancement 1. Preserve the baseline policy for comparison and rollback.
- Repair the existing Grok boundary: requests include case/run/revision identity, selected role and work contract, and selected source evidence. Responses are stored per request/role/revision, with actual provider/model metadata. A response cannot appear under a different role or silently attach after the case changes.
- Old responses may remain visible under their original revision. Late responses for deleted data are discarded and cannot recreate deleted records.

### Acceptance tests

- Reproduce and fix the assessment sequence: mark useful → answer a question → mark useful. Both revisions and evaluations are inspectable; effective credit follows the documented correction policy.
- Repeating the same mark or request does not double-count.
- Replacing useful with noise produces the correct effective weights; no stale credit remains.
- Editing inputs or rotating a role leaves the earlier result intact and prevents reuse of its response as a new completion.
- Two Grok-assigned roles receive distinct response attribution. Test delayed returns, role changes, cancellation, reload, and deletion with synthetic provider responses; make no paid calls.

## ENHANCEMENT 3 — outcome follow-up

### Required behavior

- Let the user record the action actually chosen, including waiting, checking, revising, declining a suggestion, or taking no action.
- Capture the expected result and revision conditions before the outcome, plus a revisit date or condition where useful. Preserve later corrections rather than rewriting the original expectation.
- Record actual outcomes as observed/reported/unknown/ongoing with evidence and time. Keep “I liked this suggestion,” “the outcome was favorable,” and “the suggestion caused that outcome” distinct.
- Show pending follow-ups locally when the app is opened. No background email, external messaging, push notification service, or cloud scheduler is required.
- Reopen unresolved decisions when their revisit condition is met; permit “still unknown” without forcing closure or repeatedly interrupting the user.
- Display a concise comparison of expectation, chosen action, outcome, and what changed. Feed appropriately attributed evidence into memory validation, not into an unsupported causal-success score.

### Acceptance tests

- Complete describe → choose action → record expectation → reopen after reload → record outcome → revise.
- The chosen action can differ from the proposed action without misattributing success to the proposal.
- Missing outcomes remain pending; unknown outcomes do not become negative or successful outcomes by default.
- Overdue and condition-based follow-ups appear correctly under a controlled clock, and can be deferred without losing history.

## ENHANCEMENT 4 — source-linked interpretation and unfamiliar-case evaluation

### Required behavior

- Preserve the current rules as an explicit comparison baseline. Improve interpretation conservatively within the local engine; a new model service is not required.
- Attach readings to relevant input fields and source spans. Distinguish asserted facts, negation, quotation, hypothetical conditions, and uncertain wording. Mark ambiguity as uncertain and allow correction.
- Remove broad trigger shortcuts such as treating “several” alone as evidence of a shared ancestor. Do not equate mention of a concept with evidence that it holds.
- Keep unknown answers visible as unresolved dependencies. They may be deferred or deemed irrelevant to the current action with a reason, but cannot silently become resolved.
- Require confirmation where an ambiguous interpretation would materially change the proposed action. Keep the presentation compact and avoid demanding confirmation for every sentence.

### Evaluation contract

- Create a versioned, offline evaluation covering at least 30 distinct case families across the app's uncertainty categories, including quiet/no-intervention cases. Document this as an engineering coverage target, not a claim of statistical adequacy.
- Include meaning-preserving wording variants and decisive-fact changes, with negation, quotation, missing objectives, conflicting evidence, context shifts, and applicability boundaries.
- Separate development fixtures from at least 10 held-out families. Declare family IDs, expected behaviors, metric definitions, question budget, and split hashes before tuning. Exact duplicates and paraphrases of one family cannot cross the split.
- Define expected behavior independently of engine outputs, using an explicit scoring rubric or deterministic checks. The same function that generates suggestions cannot grade their usefulness. Agent-generated fixtures remain labeled synthetic even when the scorer is separate.
- Compare a fixed checklist, the frozen rule baseline, and the enhanced workflow with equal case information and a fixed question budget. Report relevant questions, missed decisive issues, false alarms, harmful revisions, action consistency, and machine time. Report human effort and real-world outcomes as unmeasured unless actually collected.
- Once held-out failures influence implementation, mark those cases as development data and create a fresh held-out set before making generalization claims. Keep every evaluated run in the report.
- Report enhancements with and without adaptive preferences and memory reuse. Generalization or benefit claims require observed evidence; a negative or inconclusive result is a valid report but cannot be called an improvement.
- Keep unproven adaptive behavior advisory/default-off. Enabling it by default requires a frozen comparison showing fewer missed decisive issues or false alarms, no increase in harmful revisions, and no increase in question budget against the stronger simple baseline. Record exact counts and limitations.

### Acceptance tests

- The assessment's lunch/negation example no longer asserts the negated gaps; positive counterparts still trigger the relevant readings.
- All required semantic regression fixtures pass, including unresolved unknowns and prerequisite routing.
- Source spans remain attached to the correct revision after edits and round-trip export/import.
- A reproducible evaluation command emits machine-readable results and a Markdown report containing all arms, failures, denominators, split hashes, and claims supported or unsupported by the run.

## ENHANCEMENT 5 — outcome-backed memory promotion and conditional reuse

### Required behavior

- Store memory origin, the proposed lesson/procedure, prerequisites, exclusions, a discriminating test, revival conditions, outcome evidence, and validation status.
- Keep recurrence (“seen again”), candidate status, validation for a defined context, retirement, and deletion distinct.
- Require evidence from at least two distinct, outcome-backed case families, including one validation case outside the origin family, before promotion. Similar wording or overlapping feature tags alone cannot establish independence or effectiveness.
- Prevent exact/replayed duplicates automatically. Near-duplicate or uncertain family relationships must remain flagged for explicit review rather than being declared independent. Unknown outcomes cannot count as validation.
- Retain counterexamples and failed applicability checks. Narrow or revoke a memory's eligibility when evidence no longer supports it.
- Wire eligible memory objects into retrieval as candidate procedures. Check prerequisites and exclusions against current evidence before offering a checklist or next check. Unknown prerequisites require clarification or abstention.
- Show why a memory was retrieved, which applicability conditions passed or remain unknown, and the evidence behind its status. Generated constructions stay labeled as generated.
- Trace proposed reuse to the later chosen action and outcome. Preference marks and repetition cannot substitute for outcome-backed validation.

### Acceptance tests

- Entering the same sample twice, paraphrasing it, reimporting it, or rating multiple revisions cannot satisfy the independent-case gate.
- Two genuinely distinct families with relevant outcome evidence can support promotion under the recorded criterion; a failed criterion prevents it.
- An applicable unseen case receives a traceable candidate construction. A contradicted or unknown prerequisite prevents unqualified reuse.
- A counterexample updates eligibility without erasing prior evidence.
- Retired or deleted memories stop influencing recommendations and derived weights as required by their documented semantics.

## ENHANCEMENT 6 — clear interaction, retention, export, deletion, and recovery

### Required behavior

- Lead with the user benefit. Default Mind output emphasizes the consequential unknown, why it matters, and one next check/action, with additional consequential concerns accessible without being concealed.
- Keep evidence, revision history, roles, traces, and evaluation detail available through progressive disclosure. Retain the existing design identity and responsive navigation.
- Replace illustrative probability decimals with qualitative descriptions unless a calibration result supports the exact quantitative interpretation. Label simulations and provider availability accurately.
- Preserve drafts while navigating. Explain which drafts, sessions, outcomes, and lessons are retained in this browser and what clearing them does. Do not describe browser storage as encrypted or cross-device storage.
- Add versioned, schema-validated export/import covering the selected records, their dependencies, and settings. Show import contents and conflicts before applying; enforce size/schema limits, deduplicate IDs, and apply atomically without executing imported content.
- Add per-case and per-memory deletion as well as clear-all. Preview the affected dependent records and request confirmation in the product. Deletion removes associated source text, revisions, responses, derived tags, and learning contributions; surviving memories with missing support must be invalidated or redacted explicitly.
- Auditability applies while data is retained. Intentional deletion takes precedence over append-only history; do not retain supposedly deleted personal content in audit logs, tombstones, browser keys, or restored state.
- Version persisted state, migrate valid legacy data, validate loaded/imported values, and handle corrupt data, storage quota errors, and unavailable storage without silently overwriting recoverable originals.
- Keep unsupported or corrupted data available for deliberate recovery/export where safe. Explain when changes exist only in memory. Migration must not fabricate verified evidence or independently validated lessons from legacy labels, counts, or weights.
- Before a live request, show the selected content and destination. Preserve server-only credentials and add timeout, deduplication, and server-enforced aggregate usage controls to the existing endpoint, or keep external requests disabled by default until those controls are configured. Browser counters alone do not enforce a budget. Auth/database remain off unless separately authorized.

### Acceptance tests

- Desktop and 390×844 mobile flows work with keyboard and touch; controls have accessible names, visible focus, and no horizontal overflow. Empty, pending, failure, and recovery states are usable.
- Drafts survive navigation according to the disclosed retention setting.
- Valid export/import round trips preserve relationships and effective statistics; repeated import does not duplicate cases or credit. Invalid, oversized, unsupported, and conflicting imports cannot partially corrupt the current store.
- Legacy state migrates without losing valid user content or promoting its evidentiary status. Corrupt/unsupported state produces a recoverable state rather than a blank page or silent reset.
- Deleting a case invalidates dependent memory support and recomputes derived statistics. Reload and stale async responses cannot restore the deleted data. Test only disposable fixtures.
- Quota/unavailable-storage failures are visible; the app does not falsely claim persistence succeeded.
- Synthetic provider tests cover unavailable configuration, timeout, repeated requests, budget/rate rejection, and content/role/revision attribution. No real provider call is required for this goal.

## PROOF OF DONE

Every gate below is required. Record commands, exit codes, runtime versions, source identity, and evidence paths in `PROGRESS.md` and a final `ENHANCEMENT_REPORT.md`.

| Gate | Required proof |
|---|---|
| G0: Baseline | Reproduced starting state, frozen baseline, repaired runner, documented supported runtime, migration design |
| G1: Evidence | Enhancement 1 behavior and regressions pass; simulated/reported evidence never silently becomes verified |
| G2: Revisions/feedback | Enhancement 2 replay, correction, idempotency, routing, and response-attribution tests pass |
| G3: Outcomes | Enhancement 3 end-to-end follow-up flow and state tests pass |
| G4: Interpretation/evaluation | Enhancement 4 semantic regressions pass; frozen, independently scored comparison and honest benefit/default-activation decision recorded |
| G5: Memory | Enhancement 5 duplicate, independent validation, applicability, counterexample, and reuse tests pass |
| G6: UX/data control | Enhancement 6 migration, recovery, export/import, deletion, disclosure, and provider-boundary tests pass |
| G7: Integrated app | Build, typecheck, test, lint, evaluation, fresh browser smoke, interaction checks, and diff checks all pass on the final source |

Required normal commands:

```sh
npm run typecheck
npm test
npm run lint
npm run build
git diff --check
```

Add and document a stable offline command such as `npm run eval:limen` for the G4/G5 comparisons. Its report must preserve unsuccessful cases and clearly distinguish mandatory correctness-gate failures from lack of evidence for adaptive benefit.

For integrated browser proof:

- Run the app through the maintained startup contract and inspect fresh desktop/mobile renders and browser console errors.
- Exercise the full user loop, correction/revision flow, memory promotion/reuse, export/import, deletion, and representative recovery states using synthetic data.
- Verify the freshly rebuilt production output as well as development, with separate evidence files and the development baseline where supported. Rebuild if source changed after the preceding build.
- Visually inspect both viewport screenshots. HTTP 200, historical images, or JSON alone cannot prove rendering and interaction.
- Preserve required platform branding and preview behavior. Record console/page errors and horizontal-overflow checks; mandatory errors must be resolved.

If the required browser capability is unavailable, continue independent work and record the missing proof. Do not mark G7 or the overall goal complete on that basis.

## CONSTRAINTS

- Keep the work within the six enhancements. No new provider integrations, account system, shared database, collaboration service, deployment, or framework rewrite.
- Preserve the exploration reference's breadth. Reviewer/engineering cases are a useful pilot; they do not redefine the research program or justify medical, financial, or other specialized advice.
- No paid inference, public uploads, external messages, or use of sensitive real cases during implementation/evaluation without separate authorization.
- Do not remove failing tests, loosen scoring, tune on protected held-out labels, or relabel synthetic evidence to pass a gate.
- Do not create `.env` files or expose server secrets. Model/provider fixtures must be clearly synthetic and cannot be displayed as real completions.
- Preserve existing valid user data; use disposable copies/fixtures for migration and deletion tests. Never clear the user's browser state for QA.
- Retain protected platform files and the npm environment wrapper. Changes to portability must preserve the original platform contract and safe output-path checks.
- Add dependencies only when necessary, explaining why existing facilities are insufficient. Do not upgrade unrelated packages as general cleanup.
- Keep generated build output separate from authored changes during verification. Preserve unrelated dirty files. Do not publish, push, merge, or deploy as part of this goal without authorization.

## SAFETY / PROVENANCE

- Preserve the distinctions between an example, a simulation, a user report, an inference, and a recorded verification result through storage, display, import, export, and reuse.
- Record historical baseline evidence separately from new verification. No command result from the assessment substitutes for a current gate.
- Record learning provenance, application context, and counterevidence. A favorable outcome alone does not prove causation or transfer.
- Supported implementation and an honest negative evaluation can coexist. Unproven adaptive features must remain advisory/default-off, with no claim that they improve decisions.
- Automated tests cannot establish actual user benefit, real-world calibration, or production readiness. State those limitations in the final report.

## ITERATION

1. Verify the current state and read the truth files. Create a concise implementation plan and queue using E1–E6 and G0–G7 IDs.
2. Complete baseline and shared-contract work first, including storage versioning needed by later features. Then implement E1/E2, E3/E4, E5, and the completed E6 user experience; integrate persistence safeguards throughout.
3. Work in small coherent changes. Add meaningful regression tests for consequential state and evidence behavior, then run the nearest relevant checks. Do not create tests that merely mirror static rendering or implementation details.
4. Update `PROGRESS.md` after each verified milestone with changed files, actual results, decisions, failures, and next steps. Update `DECISIONS.md` for schema, migration, feedback-credit, evaluation, or retention choices.
5. Investigate failures before expanding scope. Preserve the original failing evidence and record each distinct mitigation. Continue independent work while external verification is unavailable.
6. Keep one shared schema and design system. Delegation is optional only where existing session/project rules permit it; define non-overlapping ownership and review contributions before integration.
7. Run integrated checks when the implementation is stable. Repeat affected checks after new changes. Update the final capability and gate matrix to reflect the actual result.

## STOP

- Continue autonomously for safe local implementation choices; document assumptions instead of repeatedly asking for clarification.
- Ask for the missing decision only when work requires credentials/accounts, paid usage, real sensitive data, destructive action against user data, production deployment, a material scope change, or resolution of a genuine legal/compliance uncertainty. Complete independent authorized work first.
- After three distinct unsuccessful mitigations of the same essential failure, record the exact blocker, evidence, attempted repairs, and smallest external action needed. Do not keep repeating the same attempt.
- A missing optional API key does not block the local product: finish the disabled/unavailable state and synthetic boundary tests. A missing required browser verification capability prevents overall completion until proof is available.
- Respect any explicit user pause or limit. Report status truthfully without converting incomplete work into completion.

## COMPLETE

Mark this goal complete only when E1–E6 are implemented, G0–G7 have current passing evidence, retained data and migration behavior are verified, and the final user journey works in fresh development and built-output browser checks.

Deliver:

- Working product changes implementing all six enhancements.
- Updated README and project truth files with supported commands, data behavior, and current limitations.
- Regression tests and reproducible offline evaluation with frozen splits, baseline comparisons, and outcome reports.
- `ENHANCEMENT_REPORT.md` mapping each requirement/gate to evidence, summarizing changed files, and stating whether adaptive benefit is supported or remains unproven.
- A concise final response separating implemented, tested, behaviorally evaluated, and externally unverified capabilities. Commit/push/deployment status must be explicit if relevant; none is implied by passing local gates.

Do not mark the goal complete because code was written, a subset of tests passed, the evaluation produced a report, or remaining proof requires another environment.
