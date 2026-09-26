# Limen repository assessment

Assessed: 2026-09-23. Source snapshot: `c8c89f0` (`Export from Grok`), branch `main`.

Scope: assess intent, implementation, limitations, and enhancements. Application source was not changed. This report proposes work; it does not approve a new product scope, experiments, paid inference, or deployment.

## Overall assessment

Limen is an interactive prototype of an uncertainty-aware decision and reflection workbench. A person describes a situation, a claim, an intended action, an objective, and the stakes. Limen identifies possible gaps, proposes questions or checks, exposes its reasoning, and accepts feedback for future sessions.

Its most promising product idea is the inspectable relationship between **a claim, its supporting evidence, its applicability, a decision, an outcome, and a later revision**. The current implementation demonstrates portions of that relationship. It has not established improved decision quality, reliable competence assessment, or beneficial learning on unfamiliar cases.

The project has a coherent visual identity, a functioning local rules engine, and thoughtful distinctions in its copy. It is a research/demo prototype with several correctness and verification gaps. Its next investment should make the evidence and learning records trustworthy and establish whether the workflow helps users.

## Purpose: explicit evidence versus inference

Three sources need to remain distinct:

1. `src/routes/__root.tsx` calls Limen a simulated witness that classifies unknowns, challenges its readings, and learns which responses were useful. This is the clearest implemented product intention.
2. `attachments/EXPLORATION_REFERENCE.md` explores uncertainty, metacognition, adaptive memory, investigation, and action. Its opening explicitly states that no architecture, product, research claim, or implementation direction is selected. Sections 23.1–23.6 propose evaluation questions, not execution authorization.
3. `AGENTS.md` describes the original Grok App Builder environment. It is platform guidance, not a Limen product specification. This checkout is an export on macOS; several environment assumptions no longer hold.

My inference: the app is a concrete exploration of part of the reference, combining a personal decision journal with an inspectable reasoning laboratory. The reference remains broader than this implementation. The reviewer-handoff example is a useful pilot, not an authoritative narrowing of the research portfolio.

There is no README, GOAL.md, STANDARDS.md, IMPLEMENT.md, DECISIONS.md, PROGRESS.md, TASK_QUEUE.md, or AGENTS.project.md in the assessed snapshot. A future product direction needs its own explicit goal document.

## What is actually implemented

| Surface | Implemented behavior | Boundary |
|---|---|---|
| Sit | Free-text situation, claim, objective, intended move, stakes, reversibility; three examples; session history | Inputs are interpreted using a fixed set of text patterns |
| Mind | Gap categories, questions, proposed actions, correctable readings, four evidence records, rule trace, role panels | Most output is deterministic, prewritten text selected by rules |
| Attention and routing | Quiet/stirred/insisting state; choose an operation and activate relevant roles | Hand-set priorities and global feedback weights; no independent performance estimate |
| Fly-inspired memory | 26 predefined features projected into 192 cells, retaining 12 winners; similarity recall and action priors | A sparse tag experiment, not general semantic memory or demonstrated biological fidelity |
| Ledger | Candidate/kept/retired repairs and unfinished questions; generated checklists, boundary prompts, revival conditions | Two overlapping feature phrases in another session permit promotion; kept objects are not supplied to the engine for contextual application |
| Self | Feedback summaries, taught blind spots/reflexes, question panel, local-memory reset | Summaries of user marks, not validated self-knowledge |
| Model roles | Named Gemini, GPT, Claude, and Grok seats with role contracts | Gemini/GPT/Claude are local procedures, explicitly labeled disconnected; this is not a connected multi-provider ensemble |
| Optional Grok response | User-triggered server request, API key kept server-side, bounded input/output | Provider access and model availability were not tested; role and revision attribution need repair |
| Persistence | Zustand persist in browser storage under `limen-v1` | No cross-device sync, export/import, per-record deletion, schema migration, or storage recovery UX |

Auth and database are disabled in `.grok/app-env.json`. The database, auth, connector, and multiplayer folders mostly belong to the inherited platform scaffold; their presence is not evidence of those features in Limen.

## Strengths worth preserving

- Reasoning is inspectable through deterministic rule firings and explanations.
- The interface permits correction instead of treating the initial interpretation as authoritative.
- Uncertainty, context, objectives, and reversibility are first-class inputs and outputs.
- The code and copy often acknowledge that similarity is not permission to reuse an answer, generated cases are hypothetical, and named model seats may be simulated.
- The local default gives the core workflow a small operational footprint.
- Saved desktop/mobile screenshots show a consistent dark, copper, and paper visual system with responsive navigation. These were inspected as historical artifacts, not fresh browser verification.

## Findings and recommended corrections

### 1. Evidence labels overstate what a simulated check established — high priority

`store.ts:249` implements the hidden schema check by adding the literal `schema-fail` marker. It does not read a schema or validate a report. `enrich.ts:90` then describes an outdated schema as observed evidence. The UI offers this for detected handoff language as well as the canned reviewer episode.

Recommendation: separate **reported**, **inferred**, **simulated**, and **verified by a recorded check**. In demonstration mode, label the button as revealing a simulated result. For a real check, require the artifact, schema version, validator output, timestamp, and provenance. Do not let a presentation control create a real-world observation.

### 2. Revision and feedback accounting can misrepresent learning — high priority

`store.ts:183` increments global rule, operation, and role weights when feedback is recorded. `replaceActive` at line 393 overwrites the result and clears its visible feedback, while retaining earlier weight updates and the engram.

Reproduced with one session: mark it useful, answer a question, and mark it useful again. The operation weight rises from 1 to 2 and several useful counts become 2 while their recorded fire count remains 1. The visible history contains one session and one current rating. The second evaluation may be legitimate, but there is no revision record to explain it.

Recommendation: immutable run/revision IDs and append-only feedback events; define whether a correction replaces or adds an evaluation. Derive weights and summaries from that ledger. Bind marks to the exact result, role configuration, and action evaluated. Repeating the same mark should not silently add credit.

### 3. Learning can override a required check — high priority

`enrich.ts:56` allows global operation preferences to outweigh the case-specific operation. Reproduced: a case carrying `schema-fail` selects `check_source` by default, but selects `stop` with a reachable `opBias.stop = 4`, while the failure-related action remains present. The result contains conflicting directions.

Recommendation: establish admissible operations from unresolved evidence requirements first, then learn preferences within that set. Scope learning by task/context, and distinguish preference feedback from measured usefulness. Preserve an explicit path for abstention or escalation without treating a failed prerequisite as satisfied.

### 4. Text matching is fragile and sample-shaped — high priority

`fly.ts:106` uses regexes over the combined prose, claim, objective, and action. It does not resolve negation or attach a signal to its supporting sentence. Reproduced: “Several friends want lunch. There is no supplier incentive and no missing measurement.” produces evidence, strategic, and observation gaps. “Several” alone participates in the shared-ancestor detector.

Recommendation: retain these rules as a transparent baseline. Add source spans and explicit confirmation for consequential readings; distinguish a mentioned concept from an asserted fact. Keep an unknown answer visible as unresolved: currently `engine.ts:45` treats any supplied answer, including unknown, as answered and removes the question from the active list.

### 5. Memory promotion does not demonstrate transfer — high priority

`memory.ts:47` checks different session identities and two overlapping feature labels. Re-entering the identical example twice permits promotion with no outcome feedback; this was reproduced. Promotion is currently a recurrence signal, not evidence that a repair works on a distinct case.

Also, `store.ts:100` supplies engrams and taught reflexes to the engine but does not supply Ledger memory objects. Kept repairs currently support display/construction rather than an evaluated retrieval-and-application loop.

Recommendation: record origin, prerequisites, exclusions, a discriminating test, actual outcomes, and independent validation cases. Detect duplicates. Separate “seen again” from “validated for reuse.” In a later stage, retrieve candidate procedures and check applicability before proposing a construction; track whether it helped.

### 6. Live response attribution and usage controls are incomplete — high before public API use

`mind-view.tsx:448` builds a brief from derived material but omits the full situation prose and the selected role's contract. The role button does not pass a role identifier. `Sitting` stores a single Grok response; role rotation retains it. `buildHive` can assign Grok to multiple active roles, and the UI would display that shared response under each matching role.

`reflect.ts` has useful per-request length/output limits and a server-only key. It has no application-level rate limit, aggregate budget, explicit timeout, or caller admission mechanism. Hosting protections were not assessed. If exposed with a funded key, per-request token bounds do not bound aggregate spend.

Recommendation: send a typed request with run/revision ID, role ID, its work contract, selected evidence, and provenance. Store responses by that identity and reject stale returns. Show exactly what leaves the browser. Add request deduplication, timeouts, a server-side budget and appropriate admission/rate controls before exposing paid inference. Verify configured model availability separately; no paid calls were made during this assessment.

### 7. Retention and recovery need a product contract — medium priority

`store.ts:353` persists raw situations, complete results, ratings, and learning weights. The app has a whole-store reset and retirement of memory objects, but lacks per-session deletion, backup/export, migration, runtime validation, and a clear storage-failure state. An unsent draft is component state and can be lost by switching views.

Recommendation: explain local retention at first use, retain drafts deliberately, support export/import and selective deletion, and version/validate persisted data. Zustand explicitly supports migration and hydration hooks; its documentation warns that JSON persistence alone does not validate stored shape. [Zustand persist documentation](https://zustand.docs.pmnd.rs/reference/middlewares/persist).

### 8. The user journey exposes too much machinery early — medium priority

The opening paragraph introduces records, roles, model assignments, experiments, and marks before explaining a concrete benefit. Mind adds organization, Jev-style questions, a fly tag, perturbations, council text, and production rules to the core reflection.

Recommendation: lead with a plain promise such as “Find what could change this decision.” Make the default result one consequential unknown, why it matters, and one useful next check. Reveal records and reasoning on demand. Preserve the visual identity and richer laboratory view for people who want it. Replace illustrative probability decimals with qualitative labels until calibration is supported by evidence.

## Verification performed

Runtime: Node `v24.13.0`, npm `11.19.1`; the export instructions name Node 22, so this is not a Node 22 compatibility result.

| Check | Result |
|---|---|
| `npm ci --ignore-scripts --no-audit --no-fund` | Passed; locked dependencies installed; no lockfile/source edits |
| `npm run typecheck` | Passed |
| `npm run build` | Passed in an isolated copy; database migration skipped because DATABASE_URL was absent |
| Built-output HTTP request | 200; this is not browser render proof |
| `npm test` | Failed: first phase 187 passed / 8 failed, all failures in platform PWA tests; subsequent phase skipped by `&&` |
| Explicit subsequent TypeScript test phase | 55 passed |
| Limen engine tests | Excluded from npm test; direct Node invocation fails on extensionless imports; all 6 pass with an assessment-only resolver hook |
| `npm run lint` | Failed: one error in `app-data/client.server.ts:281`, one warning in `auth/use-current-user.ts:59` |
| Fresh smoke / interactive browser verification | Incomplete: smoke output is restricted to `/workspace`; no CUA browser or agent-browser CLI available |
| Saved desktop/mobile screenshots | Visually inspected; historical only |
| Behavioral probes | Confirmed text false positives, conflicting router override, feedback/revision mismatch, and duplicate memory promotion |
| Live provider calls / deployment | Not performed |

The PWA failures show test expectations being affected by the repository's Limen branding. They are a fixture/isolation issue to investigate, not proof that the Limen reasoning engine failed. The separate domain-test exclusion is more consequential to application confidence.

Build output was kept outside this checkout to avoid rewriting tracked `.vercel/output` files. Probe results concern in-memory behavior; they do not establish browser persistence correctness.

Machine-readable check outcomes and selected probe inputs/outputs are saved in [ASSESSMENT_EVIDENCE.json](ASSESSMENT_EVIDENCE.json). The temporary Node resolver only appended `.ts` to extensionless relative imports; it did not change application logic.

## Enhancement sequence

| Order | Enhancement | Completion evidence |
|---|---|---|
| 1 | Define the current product and repair verification | README/goal distinguishes implemented, simulated, and proposed behavior; portable run/QA instructions; domain tests included; build, typecheck, lint, and tests green |
| 2 | Make evidence and learning history trustworthy | Simulated checks never become verified facts; immutable revisions; idempotent evaluations; stale responses cannot attach to new results; mandatory prerequisites cannot be bypassed by preferences |
| 3 | Close the user outcome loop | Record chosen action, expected result, revisit condition, actual result, and what changed; users can correct/export/delete records; unknowns remain explicitly unresolved |
| 4 | Establish behavioral value | Held-out, independently scored cases compare a fixed checklist, current rules, and enhanced workflow on useful questions, missed issues, false alarms, harmful revisions, and time/cost |
| 5 | Add evidence-backed memory reuse and optional semantic interpretation | Prerequisites checked on distinct new cases; source-linked interpretations; measured gains over direct feature overlap and simpler alternatives |
| 6 | Expand model integrations if the prior stages justify them | Role-specific requests and outcome attribution, controlled budgets, independent evaluation, and a demonstrated benefit per additional call |

The immediate evaluation can use engineering/reviewer decisions as a bounded pilot because the app already supplies those examples. That recommendation does not replace the reference's broader research questions.

Use paired cases where one meaningful fact changes and pairs where only wording changes. The reference already recommends this. Behavioral test design such as CheckList is a useful methodological precedent, not evidence of Limen's effectiveness. [Ribeiro et al., 2020](https://aclanthology.org/2020.acl-main.442/).

For any future evaluation, keep case generation and outcome scoring separate, preserve negative results, use equal information and budget, and test whether learning improves new cases rather than merely recalling the examples. Comparisons and ablations are proposed future work, not completed research.

## Smallest safe next step

Create a bounded baseline-hardening change: add the product README, wire the six engine tests into the normal runner, isolate the branding tests, and add regression coverage for the reproduced evidence/feedback defects. Preserve the current UI and freeze the current rule engine as the comparison baseline. No framework rewrite is justified by this assessment.
