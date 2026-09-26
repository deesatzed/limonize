# Limen implementation contract

Status: implemented locally under [GOAL_ENHANCE.md](GOAL_ENHANCE.md); proof and remaining limitations are in [ENHANCEMENT_REPORT.md](ENHANCEMENT_REPORT.md).

## Continuity and integrity charter

The subsequent [charter](CONTINUITY_AND_INTEGRITY_CHARTER.md) is versioned application policy in `src/lib/limen/charter.ts`. The Self page and generated Markdown consume one source; `npm test` checks for document drift. Browser records, learned content and imports cannot replace this source or store action methods. Charter amendments require an authorized application change, not a learned-policy event. This separation is an application boundary, not a tamper-proof guarantee against someone who controls the device or source code.

`learningPaused` suspends saved lesson retrieval, taught reflexes/blind spots, contextual feedback weights and role preferences for new reflections. A toggle appends a revision when a case is active; prior retained runs remain inspectable. Reload preserves the flag and imports preserve current control settings. The existing adaptive toggle stays opt-in and cannot bypass the pause. Clear-all deliberately returns to empty default settings.

The six-mechanism autonomous cycle remains in `docs/plans/2026-09-23-autonomous-development-*.md`. No policy scheduler, external permission grant, background process, new provider or resource budget service was added by the charter integration. Future policy admission, resource limits and cancellation must be enforced independently of learned records.

## Identity and immutable revisions

`Situation.id` is the stable case ID. `Sitting.id` is the run ID; its `snapshot`, result, parent run, timestamp, and revision reason preserve the original interpretation. Editing fields, answering a question, correcting a reading, applying a local check, changing a role, or changing taught configuration appends a run. Legacy runs without snapshots remain labeled as such. `FeedbackEvent` references a case, run, action target, event ID, and optional superseded event; the latest effective mark per case determines rule and operation statistics. Role marks have their own events. Duplicate IDs and identical repeated marks are idempotent. Old events stay inspectable until deliberate deletion.

Intentional deletion takes precedence over revision retention. Deleting a lesson removes its copied candidate checklists from retained results. Deleting a case also redacts affected lesson constructions and clears cached recall summaries, whose historical representation lacks an exact source ID. Changed results carry a retention note; remaining case evidence is not rewritten. This is versioned provenance, not cryptographic tamper evidence.

## Evidence and outcomes

Evidence is `reported`, `inferred`, `assumed`, `simulated`, `unresolved`, or `verified_check`. Each new item has an origin, case/run/time, and source span or receipt when available. User confirmation is reported, not independently verified. The reviewer reveal is simulated and restricted to its named demo. The bounded local JSON checker records artifact, FNV-1a fingerprint (noncryptographic), criterion and checker versions, time, and pass/fail/error; it makes no truth claim about the summary.

An outcome plan records the action actually chosen, expectation, revision condition, optional date/condition, and the proposed action ID only when the user chose that exact suggestion. Later result, correction, trigger, and deferral events are append-only. `unknown` and `ongoing` remain pending. Follow-ups are local and appear when the browser app is opened; there is no scheduler or message service. Outcome support is a reported judgment about applicability, not causal attribution.

## Learning and memory

Learning statistics are derived from effective feedback events. Operation marks remain advisory because the router's current operation must align with unresolved prerequisites and actions. Adaptive rule/role preferences are off by default; when explicitly enabled, only marks from same-stakes cases sharing two active signals are applied. This is experimental, not shown to improve outcomes.

A memory contains its origin run/family, pattern, test, revival condition, prerequisites, exclusions, support case IDs, status, and counterexamples. Promotion checks an outcome supporting the selected proposed action in the origin and one other labeled, distinct family; near duplicates are flagged. Unknown outcomes, repeated revisions, identical families, and mere pattern overlap do not pass. Eligible memories generate candidate checklists only when recorded prerequisites are present and exclusions absent; unknown prerequisites abstain. Counterevidence revokes eligibility. The family screen and support assessment are user-reported, not independent causal validation.

## Persistence and provider boundary

Zustand persists version 2 data under `limen-v1`; a guarded adapter validates on load and pauses writes on corrupt, unsupported, unavailable, or quota-failed storage. The original raw value remains available for deliberate download when readable. Legacy version 0 migration preserves valid cases and subjective marks, demotes old observed labels and kept lessons, and leaves adaptive mode off. JSON export/import has a 2 MB bound, relationship and ID validation, conflict preview, deduplication, and atomic apply. Case deletion removes its text, runs, responses, outcomes, feedback, and learning contributions; dependent memory validation is revoked. Memory deletion removes the object. Clear-all removes the storage key.

The server reflection endpoint is disabled regardless of API key until shared server-side aggregate usage controls exist. No provider call or paid inference is part of this goal. Synthetic responses are attributed by request, role, case, and run; late responses to deleted cases are discarded. Auth and database remain off.

The pause field is an optional additive version 2 setting: older v2 records default to unpaused, preserving their prior behavior; malformed flags trigger recoverable storage failure. Hydration admits only named data fields and recomputes cached learning from retained events. Import merges records and recomputes learning while preserving current pause, adaptive and role settings. This does not establish independent truth for imported assertions or fully validate every nested legacy field; deeper validation remains part of the planned v3 work.

## Evaluation

`evaluation/baseline/` freezes the pre-enhancement engine from `c8c89f0`. `npm run eval:limen` runs a separate fixed checklist, frozen baseline, and enhanced workflow against 30 synthetic families with three variants each. Development and held-out IDs and hashes, a separately authored scoring rubric, all run records, and failure rows are in `evaluation/limen/results/latest.*`. The held-out set was authored during implementation before evaluation-driven tuning and is not a prospective generalization test. Human effort and real-world outcomes were not measured. No adaptive benefit claim is made.
