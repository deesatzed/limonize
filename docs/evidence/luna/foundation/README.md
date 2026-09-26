# Luna foundation checkpoint evidence

Captured 2026-09-26 from the live dirty worktree before feature implementation.

## Source boundary

`../foundation-manifest.json` identifies the original foundation include/exclude boundary and SHA-256 values. The verified source is under `/Volumes/WS4TB/jevflyme/limonize` at base commit `c8c89f038bec0d0407123f7a6e1b9089e91b5607`. Build and legacy evaluation ran in isolated copy `/private/tmp/limen-luna-foundation.TXRsYD`; its `src/` tree and `package.json` were compared with the checkout and matched. No `.env` file or generated bundle was added to the checkpoint.

## Current checks

`checks.json` records exit code 0 for `npm test`, `npm run typecheck`, `npm run lint`, `npm run charter:check` and `git diff --check`. The captured test log reports 196 platform and 83 product tests passing with no failures.

The isolated production build used `env -u DATABASE_URL npm run build` and exited 0. Database migration was skipped because the environment variable was absent. Full output is in `build.log`.

The isolated legacy evaluator `npm run eval:limen` exited 0 and produced all 450 synthetic runs. Its split hashes match the prior report: development `e02583d25b4c6d2e42a044e32c6832ff0bbb7358284e469644ef3f4de855458c`, held-out `2b7efe6dd7857be8b6c4adec3313b2c65bfb794e1656aa102f7baf95012824b3`. Enhanced-default remains at 1/90 missed decisive issues, 10/90 false alarms and 3/90 harmful-revision proxies; identical default-off ablations still provide no adaptive or memory benefit evidence. These are synthetic engineering results, not user benefit.

## Browser proof

- Dev (`http://127.0.0.1:8080/`): [verdict](../../../../screenshots/luna-foundation-dev.json), desktop/mobile screenshots `screenshots/luna-foundation-dev*.png`.
- Fresh isolated built output (`http://127.0.0.1:8081/`): [verdict](../../../../screenshots/luna-foundation-built.json), desktop/mobile screenshots `screenshots/luna-foundation-built*.png`.
- Both viewports returned 200, showed the Limen interface, had no horizontal overflow or console/page errors, and had no branding/auth warnings. Built output matched the dev baseline. All four screenshots were visually inspected.

The first sandboxed Playwright launch was denied by macOS Chromium's Mach port permission. The same required smoke commands were then rerun with the tool's approved escalation path and passed; the denied attempt did not render or produce a verdict.

## Publication state at capture

The local and remote `main` refs both point to the base commit above. This checkpoint evidence is pre-commit; the goal branch commit and remote SHA will be recorded after exact-path staging and review.
