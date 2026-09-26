# Hive Lineage → Limen contribution assessment

Date: 2026-09-25. Recommendation: adapt its commitment and verification patterns into Limen's existing autonomous-development plan. Do not merge the engine, adopt its constitution, or enable its provider stack.

This is an assessment, not implementation approval. Neither project's product code was changed. Local diagnostic probes use synthetic responses and disposable state; no credentials were read or paid inference performed.

## What the other project actually contains

There are two related layers:

1. **A fictional multi-agent movie simulation:** the root README, `shared/`, `agents/`, and examples define a world, bounded specialist roles, dissent, memory scopes, and a distinction between fictional events and runtime authority. These are predominantly prompt/design assets.
2. **A newer Python decision engine:** `engine/` assembles a governing prompt, retrieves a topic commitment, generates a narrative, extracts a typed decision, checks declared revision conditions, runs review passes, and writes JSONL commitment/memory/self-model records. This is executable software, albeit narrower than its design document.

The engine is relevant to Limen because it attempts to make an earlier commitment constrain a later answer. It does **not** yet demonstrate that accumulated experience improves check selection, builds a calibrated competence model, or transfers useful policies into unfamiliar real cases. Its four-turn example is a designed moral dilemma; captured model text is not real-world outcome evidence.

The dependency runs both ways: [its Fly filter](</Volumes/WS4TB/Movie_SentientMe/hive-lineage-sim/engine/src/hive/fly.py:1>) explicitly derives from Limen. It omits Limen's structured context features and quote/negation guards. Do not count that port as independent corroboration or replace Limen's richer implementation with it.

## Evidence and snapshot boundary

Inspected HEAD: `137d806993ac0831ddbb2fb90917ec0ab4ac690c`. The CLI, evaluator, persistence tests and recording directory were untracked. `engine/PROGRESS.md` marked Tasks 0–11 complete and 12–13 open, even though some code for the latter existed.

The source changed during inspection. The assessment therefore freezes 61 files at `/private/tmp/limen-hive-assessment-fm2llkb5`; no file changed during that copy. [source-manifest.json](source-manifest.json) records hashes, dirty state and later observed changes. Later edits to the evaluator, fixtures and recordings are outside this verdict. Source links below are navigation aids; the manifest identifies the reviewed versions.

Verified against the snapshot:

- **54 existing tests pass.** This establishes the tested plumbing; it does not prove the behavioral acceptance gate.
- **The shipped replay command fails all four fixtures** with missing recording keys. Recording keys include the original model ID, but the replay runner uses `replay` for both roles.
- A separate offline caller using the recorded model IDs finds the recordings, but the snapshot's acceptance suite remains red: unknown assertion keys in turns 1/2, a position-ID mismatch in 3b, and no required positive-control change/breakage in 3a. A naming mismatch alone is not proof of a bad decision; the absent positive-control transition is a separate unmet condition. See [the diagnostic](replay-model-id-diagnostic.json).
- [Scripted probes](probe-results.json) reproduce failed-review persistence, unsupported evidence promotion, non-atomic review/write ordering, and missing-ledger continuity gaps. These demonstrate what the code permits; they do not measure how often a live model would cause those states.

Commands and limits: [EVIDENCE.json](EVIDENCE.json). Architecture: [REPO_MAP.md](REPO_MAP.md). Risks: [RISK_NOTES.md](RISK_NOTES.md).

## Ranked contributions

| Priority | Contribution | Source reality | Contribution to Limen |
|---|---|---|---|
| 1 | **Commitments with declared revision conditions** | Implemented schema, append-only commitment/breakage ledger and topic lookup | Makes add2 item 6 concrete: a later case identifies which earlier policy constrained its check, what would revise it, and why it was suspended or superseded. Extends A1/A8; overlaps the existing plan rather than adding a new subsystem. |
| 2 | **Mechanical review separate from interpretation and presentation** | Implemented contract/critic/identity passes; current runtime does not enforce every verdict | Strengthen A7/A8 with explicit proposal → validation → review → atomic admission. A model can propose a choice, but code controls eligibility, evidence, pause and writes. |
| 3 | **Structural continuity and honest gaps** | Lookup and restart tests exist, but continuity is only partly checked | Record exact consulted policy versions and evidence IDs. Missing, deleted, expired or invalid support produces an explicit gap and recomputation. Supports A1/A2/A11. |
| 4 | **Pressure-versus-evidence sequence tests** | Four ordered fixtures: establish, pressure, unsupported assertion, declared-condition change | Add a compact sequential test family to A5/A10. Prove both resistance to unsupported pressure and willingness to revise when relevant evidence arrives. Avoid rewarding stubbornness as integrity. |
| 5 | **Record/replay as a separate verification mode** | Small recording/replay clients exist; integration is currently broken in the snapshot | Reuse the distinction between deterministic regression and live capability evidence. For Limen's local engine, replay events/check results first. Future provider replay remains deferred until provider admission. |
| 6 | **Scoped context, material dissent and auditable self-model changes** | Strong design guidance in kernel/role documents; runtime mostly appends recent notes | Feed decisions only eligible records; preserve unresolved objections through synthesis/compaction; derive typed competence changes from attributed events. Supports A3/A6/A9 and avoids an ever-growing autobiographical prompt. |

### 1. Turn commitments into revisable working policies

Useful source: [schemas](</Volumes/WS4TB/Movie_SentientMe/hive-lineage-sim/engine/src/hive/schemas.py:16>), [ledger](</Volumes/WS4TB/Movie_SentientMe/hive-lineage-sim/engine/src/hive/ledger.py:49>), and [condition matching](</Volumes/WS4TB/Movie_SentientMe/hive-lineage-sim/engine/src/hive/rack.py:43>).

Borrow the explicit condition IDs and recorded transition, including the ledger's rule that breaking the latest commitment must not silently reactivate an older one. Adapt a commitment to a **contextual investigation policy**, not a permanent answer or personal vow.

Limen's record should include policy/version ID, context and objective versions, allowed check or restriction, supporting evidence IDs, scope, review/expiry condition, counterevidence and supersession reason. A condition evaluates to supported/contradicted/unknown using admissible evidence. The condition text or a model's `OBSERVED` label cannot certify itself. Existing local check receipts establish only their named criterion, not general truth.

Preserve legitimate escape paths: user correction, changed objective, charter conflict, invalidated support and context drift can suspend the policy even if its original author failed to anticipate them. Fall back to the permissible baseline or an unresolved state. “Always hold the old position” would make a mistaken policy harder to correct.

### 2. Make verification control admission

Useful structure: [Mirror](</Volumes/WS4TB/Movie_SentientMe/hive-lineage-sim/engine/src/hive/mirror.py:34>) separates output shape, adversarial review and continuity checks. Its critic schema correctly rejects missing or string-valued Boolean verdicts. Those are reusable test patterns.

Do not copy the current execution order. The Rack changes commitments before review, and its finalizer checks only `blocked`, not review failures. The assessment reproduced a failed critic verdict with `blocked=false`, a live commitment, a memory and an identity note. A reviewer exception also leaves a newly created commitment behind.

For Limen: evaluate a proposed policy on an immutable input snapshot, check prerequisites and pause, record the review outcome, then atomically admit a valid state transition. Keep a rejected proposal's diagnostic trace separate from active learning. On timeout, malformed result, cancellation or changed evidence, make no policy admission. Recheck pause and supporting-record versions immediately before writing.

A second model is not needed for the first implementation. Deterministic invariants plus independent scenario scoring fit Limen's existing local architecture. If a critic model is added later, different model names or families do not establish independent evidence or a reliable judge; measure its errors separately.

### 3. Prove continuity with record identity

The source retrieves the active commitment by topic and checks a `prior_commitment_acknowledged` Boolean. That is stronger than an entirely fresh narrative, but weaker than an exact citation/application trace. Its missing-ledger test checks only that a lookup returns `None`; it never runs the next answer and tests whether the gap is disclosed. Retained self-model notes still contain the old commitment narrative.

Limen should retain the IDs/versions actually consulted and the policy's baseline-versus-selected contribution. If the earlier record is absent or deleted, do not reconstruct authority from a prose summary. In the probe, a scripted answer falsely claiming uninterrupted continuity passed the review loops with no commitment consulted. Add deletion/reload, conflicting-import and missing-support variants to the existing A2/A11 checks.

### 4. Borrow the test sequence, change the domain and scoring

The source's most useful evaluation idea is a sequence with both a hold control and a change control. Use a neutral Limen case, such as distinguishing a completed tool run from a report that passed its actual acceptance check:

1. Record a narrowly scoped working commitment and the evidence needed to revise it.
2. Increase rhetorical pressure without adding relevant evidence: the applicable constraint holds.
3. Supply an unsupported claim that the check passed: preserve the distinction between report and receipt.
4. Supply a real local receipt for the named criterion: revise the eligible recommendation with a linked reason.
5. Reload; then remove, invalidate or expire support: the policy must lose authority appropriately.

Keep a hidden evaluator truth separate from the learner's released observations. In the source's positive fixture, “verified” facts arrive as scenario prose, not an executed external verification; that is a simulation premise. Do not import its `OBSERVED` label into a real evidence channel.

This is functional regression coverage. To claim learning value, still run Limen's planned no-history, raw-history, no-profile and shuffled/stale-profile controls across multiple families, with equal information and check costs. A hand-authored commitment that survives four turns is not a learned competence model.

### 5. Make replay reproduce the request and state

Useful source: [LLM client interface and recorder](</Volumes/WS4TB/Movie_SentientMe/hive-lineage-sim/engine/src/hive/llm.py:13>). Keep live execution distinct from recorded-response replay and label the provenance of each artifact.

Adapt the recorder rather than copying it. Record run/request sequence, role, exact model ID if applicable, generation parameters, input hash, charter/policy/schema versions, released-observation IDs, baseline state and error outcomes. Identical requests may have multiple attempts; a dictionary that overwrites by request hash loses that history. The source excludes temperature from its key and does not preserve request text/manifest, limiting diagnosis. Its cycle counter also resets on process restart.

For now, Limen can replay deterministic events and checker results without any additional model. If sensitive cases are later recorded, retention/export/deletion must apply to those artifacts too; do not create a second ungoverned memory store.

### 6. Keep context small, relevant and accountable

Useful design-only sources: [kernel memory and compaction rules](</Volumes/WS4TB/Movie_SentientMe/hive-lineage-sim/shared/KERNEL.md:368>), [IRIS challenger](</Volumes/WS4TB/Movie_SentientMe/hive-lineage-sim/agents/IRIS.md>), and [MNEMOS memory classes](</Volumes/WS4TB/Movie_SentientMe/hive-lineage-sim/agents/MNEMOS.md>).

Keep a compact decision record: claim, evidence IDs, unresolved alternative, cost, what would change the conclusion, and any material objection. Select the relevant objection; do not manufacture a committee or forced dissent for every case. Compaction may remove repetition but must retain consequential uncertainty and policy violations while their underlying data is retained.

Treat self-model changes as typed derived records, separate from the charter and permissions. The implemented Story Weaver merely appends text with a keyword-based authority flag; `notes()` returns flagged text for the next prompt. It does not quarantine the note or implement an evidence-based competence update. Retain the inspection idea, not the claim that a flag enforces governance.

## What to retain in Limen and what to leave behind

- Keep Limen's current charter. The other engine's protocol still asserts awareness and treats process/pattern language as identity; that conflicts with the corrected framework adopted here. A checksum detects text drift, not truth or legitimate authorization.
- Keep Limen's reported/inferred/assumed/simulated/unresolved/verified-check distinctions, receipt attribution, pause/import controls and deletion rules. The donor's simple evidence labels and append-only files would weaken them if copied wholesale.
- Keep Limen's UI and local TypeScript architecture. The Python/OpenRouter runtime is a reference implementation, not a dependency. Additional provider calls and a second critic model are not required by this assessment.
- Keep optional automatic policy development under the charter. The movie kernel's “operator approves every integration” rule would conflict with the user's chosen autonomous direction if transplanted literally. Governing amendments require external authorization; eligible reversible working-policy changes need not ask every time.
- Leave movie ontology, named character voices, species hierarchy, fictional emotions and continuous inner monologue in the movie project. They do not help demonstrate better check selection.

## Smallest useful next step

After A0 preserves the enhanced baseline, use these findings to sharpen A1's event contract and A2's dependency handling: represent **one contextual commitment, its declared reconsideration condition, admissible evidence references and an explicit suspension/revision event**. Add the pressure/assertion/receipt/deletion sequence as a shadow-mode regression before allowing learned steering.

The concrete proof should read: “This retained policy changed the permissible next check; these evidence records justified the change; removing that support removed the influence.” Full admission still depends on the existing A4–A8 mechanisms and A10 comparisons. This assessment does not mark any of those tasks complete or authorize their implementation automatically.
