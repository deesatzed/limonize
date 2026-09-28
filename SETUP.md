# Local setup and verification

This guide covers a local checkout of Limen. The app is browser-local and does not require an account, database, API key, or `.env` file. External model requests are disabled.

## Requirements

- Node.js 24.13.0 and npm 11.19.1 are the verified versions for this checkout.
- Node 22 compatibility has not been established.
- Dependencies are installed from the lockfile; install scripts are intentionally skipped.

## Install and start

From the repository root:

```sh
npm ci --ignore-scripts
sh startup.sh
```

`startup.sh` is the supported start/revive entry point. It checks the app on port 8080 and starts it through `npm run dev` when needed. The dev script uses the repository environment wrapper and binds to all interfaces for the configured preview. On a follow-up edit, hot reload keeps the app available. Do not start Vite directly or remove the wrapper, platform bridge, or branding middleware.

To run the dev server in the foreground instead, use `LIMEN_FOREGROUND=1 sh startup.sh`. To stop that foreground server, interrupt its terminal. The startup script is designed for the App Builder preview contract and is not a general production server.

## Verify the checkout

```sh
npm test
npm run typecheck
npm run lint
npm run build
```

`npm test` also checks the generated charter document and runs the product and Luna evaluator unit tests. `npm run build` includes the database migration hook; with no `DATABASE_URL`, it skips database work. Auth and database remain off in this application.

For the established product smoke checks:

```sh
node scripts/browser-smoke.mjs http://127.0.0.1:8080/ screenshots/setup-browser.png
node scripts/limen-flow-smoke.mjs
node scripts/limen-charter-smoke.mjs
npm run smoke:luna -- http://127.0.0.1:8080/ setup-luna
```

Browser automation needs a local Chromium installation supported by Playwright. The browser smoke command above writes desktop, mobile and verdict files with a distinct `setup-browser` prefix rather than overwriting the generic preview screenshot. The Luna command accepts a screenshot name as its second argument. Other smoke scripts write their documented `enhance-*` or `charter-*` filenames under `screenshots/`; rerunning them replaces files with those names. These checks are engineering evidence; they do not validate real-world outcomes.

## Commitment-cycle rehearsal and evaluation

Open the app and use **Self → Local and bounded → Run a free-family local rehearsal** to create an inspectable synthetic development history. This does not use external models or real case data. The rehearsal exercises proposal, review and trial behavior. Because the frozen protected comparison failed the benefit gate, runtime policies remain in `shadow` and cannot change selections. Real-context policies remain advisory. Read [LUNA_REPORT.md](LUNA_REPORT.md) before interpreting the result.

The evaluator's safe inspection sequence is:

```sh
npm run eval:luna -- --preflight
npm run eval:luna
```

Preflight checks the frozen contract and hashes without loading protected labels. The second command writes a new development-only artifact to `evaluation/luna/results/`; keep that artifact if retaining the run. Do not use protected outcomes for tuning. The protected evaluation was already performed once for this milestone, and its result is recorded in the report and results directory.

For the older Limen synthetic comparison, run `npm run eval:limen`. For technical context and documented limits, see [the evaluator contract](evaluation/luna/README.md), [the execution goal](GOAL_LUNA.md), and [the progress record](PROGRESS.md).

## Local data and recovery

Application records remain in the current browser's local storage. They are not encrypted, synchronized, or automatically backed up. Export records before clearing browser data or moving to another device. Current exports use format version 4; supported older data formats migrate during load. Import validation does not make user-provided claims independently true. Deletion intentionally removes dependent learning support, while imported controls cannot override the device's current pause settings.
