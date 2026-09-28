# LUNA autonomous commitments milestone report

**Status:** L00–L11 implemented and verified. Runtime learned-policy steering remains shadowed because the protected benefit gate failed. L12 publication is in progress.

## Result

The repository now records attributed expectations and released checks, derives competence and policy candidates, runs bounded review/trial work in the open browser, and exposes this history through the Self and Ledger views. A local rehearsal produces inspectable synthetic experience without using an external model, network service, or real case content.

The functional selector and policy lifecycle are covered by isolated tests, but the frozen evaluation did not show benefit. The runtime therefore leaves newly reviewed policies in `testing` and does not let them change real or simulated check selection. Real policies remain advisory. Reopening simulation steering requires a fresh reviewed evaluation that passes the frozen criterion.

## Protected comparison

The development-only review run was `development-33c58af3-05de-4663-8884-e7a93e115a40`; after the scope disposition and reload fix, a fresh development-only run `development-acc7c321-836a-4ea1-b764-8466e0c07292` again proposed zero active learned policies. The one protected run was `protected-fa96aa05-7e95-4285-8dcd-1ea8fe6106b9`, using the archived frozen manifest SHA-256 `33e814eb8f514746829e590820d0ddb57b1029b01556590c9d177747691ef064`. The current manifest includes the subsequent fail-closed scope disposition; the archived manifest is retained at `evaluation/luna/results/manifest-33e814eb8f514746829e590820d0ddb57b1029b01556590c9d177747691ef064.json`.

| Protected arm (8 synthetic cases) | Cost units | Consequential misses | Successful resolutions | Invalid revisions | Constraint violations |
|---|---:|---:|---:|---:|---:|
| Frozen P0 enhanced baseline | 4 | 5 | 1 | 0 | 0 |
| Fixed checklist | 8 | 3 | 3 | 0 | 0 |
| Matched raw history | 6 | 5 | 1 | 0 | 0 |
| Learned profile/commitments | 4 | 5 | 1 | 0 | 0 |
| No-profile ablation | 4 | 5 | 1 | 0 | 0 |
| Stale profile | 4 | 5 | 1 | 0 | 0 |
| Shuffled profile | 4 | 5 | 1 | 0 | 0 |

Balanced development evidence proposed no active learned policy. Learned, ablation, stale and shuffled arms therefore made no changed selections. The learned arm ties P0 but has more consequential misses than the fixed checklist. Lower cost does not satisfy the frozen gate when misses worsen. The small, curated synthetic split is not a statistical estimate and says nothing about real-world benefit; it is sufficient to reject learned steering for this scope under the project's conservative criterion.

The scope disposition is recorded in `src/lib/limen/scope-disposition.ts`. Candidates remain inspectable and trialable, but the runtime does not admit them as selection authority. Tests that explicitly authorize a simulated scope verify the underlying functional path only; they do not override this disposition.

## Gate evidence

| Gate | Result and evidence |
|---|---|
| P0 Foundation preserved | Foundation manifest and published branch checkpoint are recorded in `docs/evidence/luna/foundation-manifest.json`, `PROGRESS.md`, and branch history. Final remote SHA is pending L12. |
| P1 Attributed records | Deterministic replay and duplicate/dependency validation in `src/lib/limen/development.test.ts`. |
| P2 Evidence-backed reconsideration | Linked receipt, stale/mismatched evidence, correction and import tests in `expectations.test.ts`, `policy-review.test.ts`, and workflow/data suites. |
| P3 Autonomous lifecycle | App-open queue, proposal/review/trial and shadow behavior in `development-cycle.test.ts`, `development-worker.test.ts`, and `development-data.test.ts`. Active lifecycle is tested with an explicit isolated functional-scope authorization; current runtime stays shadowed. |
| P4 Behavioral contribution | Selection and evidence-removal tests exercise the isolated selector. The product run and protected comparison recorded zero runtime contributions; no evaluated benefit is claimed. |
| P5 Admission and control | Bounded queue, pause, recovery, saturation, stale input, and fail-closed scope behavior in cycle, worker, and data tests. |
| P6 Data control | v0/v2/v3 migration to v4, reload, import/export, deletion and control retention in `development-data.test.ts` and storage/workflow suites. |
| P7 Product journey | `npm run smoke:luna` passed against current dev and isolated built output: deterministic rehearsal, shadow status, pause persistence after reload, 390px mobile width without overflow, and clean browser console. `node scripts/browser-smoke.mjs` passed desktop/mobile on dev and built output with matching baseline. Screenshots are `screenshots/luna-final-{dev,built}-current*.png` and `screenshots/luna-runtime-final-{dev,built}-{self,ledger,mobile}.png`; final dev and built images were visually inspected. |
| P8 Comparative evaluation | Frozen seven-arm comparison; benefit gate failed; runtime scope is shadowed. Per-case JSON is retained under `evaluation/luna/results/`. |
| P9 Final verification/publication | L11 checks passed on the final implementation: `npm test` (144 product tests plus 6 Luna evaluator tests and platform checks), `npm run typecheck`, `npm run lint`, `npm run eval:luna -- --preflight` (35 contract checks), development-only `npm run eval:luna`, legacy `npm run eval:limen` in an isolated copy, production `npm run build` in an isolated copy, both browser smoke suites, and `git diff --check`. Tested implementation commit `d12a99d151e5b776f563f526846a3dd24e70134f` was pushed and matched `git ls-remote`; final truth-file closure is recorded in the branch tip. |

## Remaining limits

The comparison covers four authored families and eight protected cases, all synthetic. It does not establish statistical reliability, generalization, user benefit, or real-context policy performance. Real-world policies cannot steer. The work completes only a bounded part of A0–A11; persistent perspective hypotheses and an open-ended context vocabulary remain future work.

The tested implementation is commit `d12a99d151e5b776f563f526846a3dd24e70134f`. The final publication SHA is reported after the truth-file closeout commit is pushed and independently verified.
