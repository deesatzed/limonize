# Limen

Limen is a browser-local workbench for decisions under uncertainty. Describe a situation, inspect the next consequential unknown, record what you chose and expected, and revisit the outcome. The local engine is deterministic. The named roles are local procedures; external model requests are disabled while shared server-side usage controls are absent.

The default Mind view leads with one next move. Revision history, evidence records, role procedures, and rule traces remain available through disclosure controls. A reported outcome or helpfulness mark is not independent verification or proof of causal benefit.

The [Continuity and Integrity Charter](CONTINUITY_AND_INTEGRITY_CHARTER.md) governs the build. Self → Continuity and integrity displays the same versioned text and offers **Pause learned influence**. Pausing makes new reflections use baseline rules without saved lessons, taught reflexes, blind spots or adaptive preferences, while retaining history. It survives reload; imported records cannot resume it or replace application controls. Resuming restores eligibility under the existing settings, without enabling adaptive preferences automatically.

The charter permits context-sensitive, reversible learning within authorized capabilities. It excludes self-preservation goals, covert persistence, shutdown resistance and unsupported consciousness claims. The full autonomous development cycle in [the design](docs/plans/2026-09-23-autonomous-development-design.md) and [implementation plan](docs/plans/2026-09-23-autonomous-development-plan.md) remains planned; the charter does not claim that cycle is running.

This repository began as a Grok App Builder export. [GOAL_ENHANCE.md](GOAL_ENHANCE.md) is the six-enhancement contract, [PROGRESS.md](PROGRESS.md) records current gate evidence, and [ENHANCEMENT_REPORT.md](ENHANCEMENT_REPORT.md) distinguishes implemented behavior from unproven benefit. The broader [exploration reference](attachments/EXPLORATION_REFERENCE.md) remains conceptual.

## Run and verify

Verified local runtime: Node 24.13.0 and npm 11.19.1. Node 22 compatibility has not been established.

```sh
npm ci --ignore-scripts
sh startup.sh
npm test
npm run typecheck
npm run lint
npm run build
npm run eval:limen
```

`startup.sh` locates its checkout and starts `npm run dev` on the platform preview port. The npm environment wrapper and platform branding are preserved. Auth and database are off. With no `DATABASE_URL`, the migration step in `npm run build` skips database work. No `.env` file is needed.

`node scripts/browser-smoke.mjs` audits fresh desktop/mobile rendering; screenshots are confined to this checkout's `screenshots/`. `node scripts/limen-flow-smoke.mjs` exercises a disposable synthetic case in a fresh browser context. On this macOS checkout, Chromium requires local process permission and `agent-browser` is not installed; the latter script is the documented Playwright fallback. The original `/workspace` preview contract remains in `AGENTS.md`.

`node scripts/limen-charter-smoke.mjs` checks the charter disclosure, pause/reload, protected controls during import, and explicit resume on desktop/mobile. `npm test` includes `charter:check`, which rejects drift between the app's charter and its generated Markdown. After an authorized edit to `src/lib/limen/charter.ts`, run `npm run charter:write` to refresh the document.

## Data and limits

Cases, drafts, revisions, feedback, outcomes, and lessons are stored in this browser only. They are not encrypted or synced. Self → Your local data can export all or one selected case, preview and apply a version 2 JSON import, delete a case, and recover an unreadable stored value. Ledger can retire or delete individual memories. Clear-all intentionally removes local data. Export before clearing browser storage or moving devices.

Deletion also removes copied lesson checklists and cached case-recall summaries from retained runs, with a visible retention note; affected support is invalidated. Clear-all resets settings as well as records. Exports already saved outside the browser remain under your control. The app does not create hidden backups or synchronize deleted material.

One local document-shape check accepts bounded JSON with `schemaVersion: "limen-report-v1"` and a nonempty `summary`. Its receipt says only whether that shape criterion passed, failed, or could not run. The reviewer example's hidden schema reveal is a labeled simulation. A report's truth and real-world consequences are outside this checker.

Lesson promotion requires supporting reported/observed outcome evidence from two distinct, labeled case families and a matching chosen suggested action. Similarity and ratings alone cannot validate a lesson. The duplicate-family screen is conservative but imperfect; validation is contextual and does not prove causal transfer. Adaptive preferences are off by default and are not shown to improve decisions by the synthetic evaluation.
