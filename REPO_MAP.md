# REPO_MAP.md

Assessed 2026-09-23 at `c8c89f0`. See [ASSESSMENT.md](ASSESSMENT.md) for findings and recommendations.

## Project Type

Limen: browser-local uncertainty and decision-reflection prototype, exported from Grok App Builder. Rule-based core with one optional server-side xAI text request. The attached research reference explicitly leaves the broader direction unselected.

## Tech Stack

- React 19, TypeScript, TanStack Start/Router, Tailwind CSS v4, Zustand.
- Vite 8 and Nitro Vercel build preset.
- Inherited opt-in auth, PostgreSQL/PGLite, connector, and multiplayer helpers. Auth/database disabled for this app.

## Package Manager

npm with committed package-lock.json. Verified on Node 24.13.0 / npm 11.19.1; original instructions specify Node 22.

## Commands

| Purpose | Command | Verified |
|---|---|---|
| Install | `npm ci --ignore-scripts --no-audit --no-fund` | Pass |
| Development | `npm run dev` | Inspected, not launched |
| Production build | `npm run build` | Pass in isolated copy; DB migration skipped |
| Built-output server | `npm run preview` | Started, HTTP 200; no fresh browser proof |
| Type check | `npm run typecheck` | Pass |
| Standard tests | `npm test` | Fail: first phase 187 pass / 8 fail; second phase not reached |
| Secondary test phase | Explicit four app-data/auth files named in package.json | 55 pass |
| Limen tests | `node --experimental-strip-types --test src/lib/limen/engine.test.ts` | Fails import resolution; 6 pass with temporary resolver |
| Lint | `npm run lint` | One error, one warning |
| Browser smoke | `node scripts/browser-smoke.mjs` | Export hardcodes `/workspace` output root |
| Restart contract | `sh startup.sh` | Inspected: `cd /workspace` is not portable to this checkout |

## Entry Points

- `src/router.tsx`: router and error component.
- `src/routes/__root.tsx`: document, metadata, auth provider, preview bridge.
- `src/routes/index.tsx`: single product route.
- `src/components/limen/app.tsx`: Sit / Mind / Ledger / Self navigation and hydration.
- `src/lib/limen/reflect.ts`: optional server function; only direct product provider call found.

## Major Folders

| Folder | Responsibility |
|---|---|
| `src/components/limen/` | Product UI |
| `src/lib/limen/` | Types, store, rules, sparse recall, role/routing enrichment, memory construction, examples, six engine tests |
| `src/lib/auth/`, `app-data/`, `multiplayer/` | Exported platform capabilities; not proof of product integration |
| `src/lib/og/`, `public/` | Product identity and protected platform assets |
| `scripts/`, `server/` | Build/env/migration/preview/PWA infrastructure and its tests |
| `attachments/` | Broad conceptual exploration reference |
| `.grok/` | Builder flags, skills, references, historical logs |
| `.vercel/output/` | Tracked generated deployment artifact from export |
| `screenshots/` | Historical screenshots and smoke verdicts |

## Existing Patterns To Preserve

- Correctable readings and inspectable rule traces.
- Explicit distinctions among evidence, inference, simulation, and unknowns; strengthen places where implementation violates them.
- Local persistence by default; auth/database remain opt-in.
- Server-only API key handling and user-triggered model calls.
- Grok platform branding, preview bridge, and protected helper files; preserve unless project settings explicitly change the contract.

## Tests and Verification

The normal suite mainly covers platform helpers and excludes the product engine tests. No independent task/outcome evaluation, UI interaction regression suite, store lifecycle tests, or provider-boundary tests were found. Historical smoke artifacts are not current verification. The detailed assessment records all check outcomes and limitations.

## Likely Files For Current Task

`attachments/EXPLORATION_REFERENCE.md`; all `src/lib/limen/*`; all `src/components/limen/*`; `package.json`; `startup.sh`; browser smoke and PWA test scripts.

## Unknowns

- Intended audience and selected product scope beyond the demonstrator.
- Whether an externally managed deployment exists and which perimeter controls it supplies.
- Provider credentials/model availability; no paid calls tested.
- Behavior with existing, corrupt, or quota-limited browser storage.
- Current end-to-end desktop/mobile behavior and Node 22 compatibility.
- Whether the proposed mechanisms improve outcomes on independent cases.
