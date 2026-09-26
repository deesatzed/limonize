# Limen enhancement report

Date: 2026-09-23. Starting source: `main` at `c8c89f038bec0d0407123f7a6e1b9089e91b5607`. Verification runtime: Node 24.13.0, npm 11.19.1. This report describes the local working tree; it has not been committed, pushed or deployed.

## Result and gate evidence

| Gate | Result | Evidence and scope |
|---|---|---|
| G0 — reproducible baseline | Pass | Historical failures retained in `PROGRESS.md`; original engine/inputs and hashes frozen under `evaluation/baseline/`. Normal test runner now includes product tests. Portable `startup.sh` and guarded screenshot paths; shared schema/migration design in `IMPLEMENT.md`. |
| G1 — truthful evidence | Pass | `src/lib/limen/check.ts`, `interpret.ts`, `engine.ts`; `check.test.ts`, `engine.test.ts`, `workflow.test.ts`. Real bounded document-shape pass/fail/error receipts include artifact fingerprint and criterion. Reviewer reveal remains simulated; imports recheck receipt artifacts. |
| G2 — revisions and feedback | Pass | `src/lib/limen/ledger.ts`, `store.ts`, `provider-protocol.ts`; `workflow.test.ts`, `provider-protocol.test.ts`. Immutable run snapshots, event-derived effective feedback, correction/idempotency and role-bound synthetic response tests. Adaptive steering defaults off; operation marks stay advisory behind prerequisites. |
| G3 — outcomes | Pass | `src/components/limen/outcome-panel.tsx`, `ledger.ts`, `workflow.test.ts`, `screenshots/enhance-flow-dev.json` and `enhance-flow-built.json`. Chosen action, expectation, local follow-up, status, correction and deferral retained separately from helpfulness. |
| G4 — interpretation and evaluation | Pass as an engineering gate; benefit unproven | Source-span and negation/quotation regressions in `engine.test.ts`, `workflow.test.ts`. `npm run eval:limen` emits `evaluation/limen/results/latest.json` and `.md` with 450 run records, fixed rubric, 30 family IDs, 20/10 split hashes, three-question budget and all failures. |
| G5 — conditional memory | Pass as implemented; causal transfer unproven | `src/lib/limen/memory.ts`, `workflow.test.ts`, and browser flow JSON/images. Two labeled, outcome-backed case families support promotion; a third case receives an applicability trace. Duplicates, missing prerequisites, counterexamples and retired/deleted memories are guarded. |
| G6 — UX and data control | Pass | `src/components/limen/mind-view.tsx`, `data-controls.tsx`, `src/lib/limen/data.ts`, `storage.ts`, `workflow.test.ts`, dev/built desktop/mobile images. Browser-local drafts, versioned migration, bounded atomic import preview, export, deletion and corrupt/quota recovery. Provider endpoint disabled; synthetic protocol tested. |
| G7 — integrated app | Pass locally | `npm run typecheck`, `npm test`, `npm run lint`, `npm run build`, `npm run eval:limen`, `git diff --check` all exit 0. Dev and freshly built desktop/mobile smoke: visible content, no overflow, console/page errors or branding warnings; built verdict matches dev. Full 11-step synthetic interaction flow passes on both. |

The final normal test run passed 196 platform and 77 product tests. The build ran from an isolated copy at `/private/tmp/limen-build.2RL3bv` to keep generated Vercel output out of the authored checkout. Build migration skipped because `DATABASE_URL` was absent. Browser smoke verdicts are `screenshots/enhance-final-dev.json` and `enhance-final-built.json`; interaction verdicts are `screenshots/enhance-flow-dev.json` and `enhance-flow-built.json`. Desktop and 390×844 mobile screenshots were visually inspected. The interactive run used the repository Playwright fallback because `agent-browser` was unavailable. The final browser-flow script was amended after the build, but no app source was changed after it.

## Offline behavioral comparison

The evaluation uses synthetic, agent-authored engineering fixtures, including decisive-fact changes and quiet cases. Scoring uses declared expected signals and ask IDs outside the product engine. The split was hashed before the final comparison, but fixtures were authored during implementation, so the held-out set is not prospective evidence of generalization.

| Arm | Missed decisive | False alarms | Harmful-revision proxy | Relevant questions | Action consistency |
|---|---:|---:|---:|---:|---:|
| Fixed checklist | 58/90 | 0/90 | 32/90 | 0/270 | 30/30 |
| Frozen original rules | 7/90 | 18/90 | 11/90 | 26/36 | 27/30 |
| Enhanced default | 1/90 | 10/90 | 3/90 | 22/32 | 29/30 |
| Adaptive off | 1/90 | 10/90 | 3/90 | 22/32 | 29/30 |
| Memory off | 1/90 | 10/90 | 3/90 | 22/32 | 29/30 |

The enhanced engine improves these fixture proxies over frozen rules at the same three-question budget, while retaining 10 false alarms and one missed decisive issue. The checklist's zero false alarms comes with many misses and nonquiet suggestions on quiet cases. Relevant-question counting covers four declared signal types and deliberately undercounts other useful questions. Machine time and every flagged case are in the generated reports; human effort and real-world outcomes were not measured. The adaptive and memory arms are identical because there are no validated feedback or lesson objects in these fixtures. This result does not justify enabling adaptive steering by default or claiming that lessons improve decisions.

## Scope and limitations

The work changed the Limen domain engine/store, local UI, test runner, browser tools and project documentation. It added no accounts, database, provider integration, public upload or deployment. The provider endpoint is disabled until a server-enforced aggregate usage ledger is configured; synthetic request tests do not authorize or demonstrate a live model call. The local JSON shape checker validates structure, not truth. A user-reported favorable outcome supports a lesson only within a recorded context and does not prove causation. The duplicate-family screen is heuristic, and old browser data is migrated conservatively rather than elevated to verified status. Node 22, real-user benefit, calibration, sensitive-data handling in production and deployment behavior remain unverified.
