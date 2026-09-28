# Enhancement task queue

Implementation and local verification of the six-enhancement contract are complete on the current working tree. Evidence and limitations are in [PROGRESS.md](PROGRESS.md) and [ENHANCEMENT_REPORT.md](ENHANCEMENT_REPORT.md). No commit, push or deployment is implied.

| ID | Acceptance focus | Dependency | Status | Evidence |
|---|---|---|---|---|
| G0 | Baseline, normal gates, portable startup/smoke, frozen engine and schema | none | done | `evaluation/baseline/`, `IMPLEMENT.md`, final commands |
| E1/G1 | Evidence origin, deterministic check receipts, simulated demo, safe routing | G0 | done | `check.test.ts`, `engine.test.ts`, `workflow.test.ts` |
| E2/G2 | Immutable runs, event feedback, idempotency, response attribution | E1 | done | `workflow.test.ts`, `provider-protocol.test.ts` |
| E3/G3 | Chosen action, expectation, follow-up, outcome and correction | E2 | done | `workflow.test.ts`, `screenshots/enhance-flow-*.json` |
| E4/G4 | Conservative source readings and honest synthetic comparison | G0, E1 | done | `engine.test.ts`, `evaluation/limen/results/latest.*` |
| E5/G5 | Distinct outcome-backed promotion and conditional reuse | E3, E4 | done | `workflow.test.ts`, `screenshots/enhance-flow-*.json` |
| E6/G6 | Simple Mind, versioned local data, migration, import/export, deletion, recovery, disabled provider | E1–E5 | done | `workflow.test.ts`, browser flow, dev/built smoke |
| G7 | Final normal commands and fresh dev/built desktop/mobile browser proof | G1–G6 | done | `PROGRESS.md` integrated verification, `ENHANCEMENT_REPORT.md` |

## Continuity and integrity integration — 2026-09-25

This is a separate completed local change following the six enhancements. Governing text: [CONTINUITY_AND_INTEGRITY_CHARTER.md](CONTINUITY_AND_INTEGRITY_CHARTER.md). Evidence: [PROGRESS.md](PROGRESS.md), charter integration entry.

| ID | Acceptance focus | Status | Evidence |
|---|---|---|---|
| C1 | One versioned governing charter in the app and Markdown; document drift fails normal tests | done | `charter.ts`, `scripts/limen-charter.mjs`, Self disclosure, `npm test` |
| C2 | Persistent learned-influence pause; import/hydration cannot replace controls; external requests disabled | done | `charter.test.ts`, store/data/storage, `charter-*-flow.json` |
| C3 | Deletion removes copied lesson and recall content, invalidates support and labels redaction | done | `charter.test.ts`, store deletion, Mind retention note |
| C4 | Charter integrated into development plan; typecheck/lint/tests/build and dev/built browser gates pass | done | plan/design, `PROGRESS.md`, `screenshots/charter-*.json` |

## Autonomous development — planned

[A0–A11](docs/plans/2026-09-23-autonomous-development-plan.md) remain proposed implementation work. The agreed direction includes both real and simulated experience, context-sensitive automatic/advisory behavior and autonomous reversible policy development. Charter integration supplies boundaries and current controls; it does not implement the expectation/competence/commitment cycle or establish its benefit.

## Luna execution goal — active; final publication in progress

[GOAL_LUNA.md](GOAL_LUNA.md) is the user-requested execution contract for the next milestone. Follow [the runbook](docs/plans/2026-09-26-luna-execution.md) sequentially when invoked. Publication is to the goal branch; no main merge or deployment is included.

| Task | Work | Status |
|---|---|---|
| L00 | Inventory and recovery baseline | done — manifest written from the live dirty tree |
| L01 | Verify, commit and push existing foundation | done — P0 checkpoint SHA matches the live remote branch |
| L02 | Typed development contract and replay | done — v1 contract and deterministic replay tests pass; active admission remains disabled |
| L03 | Expectations and attributed resolution | done — actual report checks link to prior expectation and recomputed receipt resolution |
| L04 | v3 persistence, control preservation and deletion | done — v0/v2 migration, v3 ledger, import safeguards, partial export and UTF-8 limits verified |
| L05 | Sequential worlds, separate scorer and frozen controls | done — bounded simulated worlds, separate evaluator/scorer, 16 fixed variants, seven arms and hash-checked preflight |
| L06 | Evidence-derived competence and candidate commitments | done — event-derived profiles, independent family support, inert candidates and reconsideration conditions pass |
| L07 | Reviewed admission and coherent selection | done — three-review simulation gate, prospective controls, pause/context-aware selection and attributed store applications pass |
| L08 | Bounded autonomous queue and recovery | done — persistent app-open runner, scoped simulation worker, pause/recovery and full worker lifecycle tests |
| L09 | Integrated product and rehearsal flow | done — desktop/mobile flow exposes candidate reviews and trial evidence |
| L10 | Comparative evaluation and scope disposition | done — protected result does not meet benefit gate; simulation steering is shadowed |
| L11 | Final tests/build/browser proof | done — current tests, typecheck, lint, isolated legacy evaluation/build, protected preflight, development-only evaluation, and dev/built desktop/mobile browser proof passed; screenshots visually inspected |
| L12 | Report, commit, push and remote verification | in progress — final report reconciled; commit and branch publication remain |

These tasks implement a bounded slice of the wider development roadmap. Record partial A-task coverage explicitly; do not mark all A0–A11 done when this milestone completes.
