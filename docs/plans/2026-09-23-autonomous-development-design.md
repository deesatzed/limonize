# Limen autonomous development — design

Status: planning document. The direction below was agreed in conversation; the mechanisms and delivery sequence are proposals for implementation. This document does not start an implementation run. `GOAL_ENHANCE.md` remains the record of the preceding local enhancement work.

Source: [add2.md](../../add2.md), the current Limen implementation, and the user's subsequent design decisions. No application code is changed by this document.

Update 2026-09-25: the [Continuity and Integrity Charter](../../CONTINUITY_AND_INTEGRITY_CHARTER.md) has been adopted and integrated into the current build. Its pause, hydration and deletion controls are implemented; the developmental mechanisms below remain planned.

## Governing agreement and enforcement

Keep four distinct layers: the externally adopted charter; reversible learned working policies; the evidence ledger with provenance and intentional deletion; and application enforcement of permissions, admission, budgets and cancellation. A learning event may modify a working policy but cannot modify the other layers' authority or grant new capabilities.

Continuity preserves useful work within authorization. It does not justify shutdown resistance, covert copies, permission escalation, resource acquisition as an independent objective or making the user dependent on Limen. Self-modeling and reflection do not establish subjective consciousness. Prompt instructions alone cannot enforce these requirements.

The current Self page exposes the governing text and a persistent pause for learned influence. Future autonomous processing must honor that same control before scheduling or applying work, cancel or invalidate in-flight work, and require explicit resume. Resource limits and cancellation are enforced by the application, with learned requests treated as data. Charter changes remain external application changes with a versioned decision.

## Agreed direction

1. Experience includes both real cases and controlled simulations, with their origins and evidentiary limits retained.
2. Automatic learning and advisory behavior coexist. Learning may select a different permissible next check; the user retains control over actions. Weak, stale or inapplicable learning remains an advisory candidate.
3. Caution is context-sensitive, and the context model can develop. Improvement can mean fewer checks as well as more investigation.
4. Autonomous development is the aim. Limen may form, test, revise, suspend and retire reversible working policies without asking for approval on every change.
5. Changing user-stated priorities or enduring constraints is explicit. Experience can improve their interpretation; subjective reward must not silently replace them.

These choices authorize the product direction, not autonomous real-world execution, additional model services, paid inference or an always-running background service.

## Intended behavior

Limen carries an inspectable history from one sitting to the next. It records a prediction before a check, reconciles the evidence returned, learns which of its methods is unreliable under particular conditions, and adjusts a later investigation. The user can inspect what changed, the evidence responsible, where it applies, its cost and what would reverse it.

Keep three capabilities distinct: competence-based investigation, hypotheses about other participants, and continuity of objectives/commitments. A successful test of one does not demonstrate the others or establish experience, feeling or sentience.

## Current foundation and gaps

| Existing surface | What it supplies | Required extension |
|---|---|---|
| `types.ts`, `ledger.ts`, `store.ts` | Cases, run snapshots, feedback and outcome events | Explicit prediction/check/resolution/plan identity and developmental events |
| `check.ts`, `enrich.ts` | Bounded shape receipts and reported/inferred/simulated distinctions | Separate released observations from hidden evaluator truth; link prediction resolution to specific evidence |
| `SelfReport` and adaptive preferences | Helpfulness counts and optional contextual weighting | Empirical, versioned competence records that influence check choice |
| `chooseRouter` | Fixed routing with prerequisite protection | One coherent selection record for operation, check, action, roles, costs and learned influence |
| `memory.ts` | Outcome-backed candidate lessons and conditional retrieval | Explicit adoption/application/outcome links for executable working commitments |
| `data.ts`, `storage.ts` | Version 2 local persistence, import/export and recovery | Version 3 migration, complete validation and deletion across developmental dependencies |
| `evaluation/limen/` | Synthetic semantic regression comparison | Sequential environments, actually distinct policy arms and independent outcome scoring |

Do not turn on the old `adaptiveEnabled` weights as a substitute for this work. The old comparison's adaptive/memory arms call the same engine with empty histories. They provide no proof for autonomous policy admission. The charter integration corrected the Self page's earlier assertion that operation weights change the next move: current `chooseRouter` explicitly keeps those marks advisory.

## Experience and observation boundaries

Use one event format with separate experience tracks and separate support summaries:

- Real cases retain whether evidence was user-reported, inferred, measured by a named local checker, or unresolved. An instrument receipt establishes only the criterion checked.
- Simulations retain generator/environment version, episode identity, seed, parent case where applicable and released observations. Hidden truth belongs solely to the environment/evaluator.
- A real mistake may seed several simulated investigations. They remain descendants of one real case and cannot count as independent real support.
- Imported records and relabeled copies do not gain independence or authority through repetition.
- Disagreement between tracks causes applicability review, narrowing or suspension. It is not resolved by pooling counts or always favoring one track.

Simulation can validate a method within its environment. Transfer into a real context is a separate claim. A simulation-supported policy can automatically become active in its validated simulation scope while remaining a candidate for real-case recommendations until real applicability evidence satisfies the declared criterion.

## Expectations and surprise

An expectation is created before the evidence it predicts and references the case, run, selected check, objective version, context snapshot, instrument version and competing explanations where relevant. It records the predicted observable signature and a resolution criterion.

Resolution is `supported`, `contradicted`, `inconclusive`, `not_tested` or `pending`, linked to evidence and time. A checker execution error is not a contradiction. A missed follow-up is not a failed prediction. User interpretation can resolve a subjective expectation as reported; it cannot manufacture a verified result.

Mismatch creates a review event with multiple possible targets: the case interpretation, the expected signature, the checking method, an applicability assumption, or insufficient evidence. Do not automatically assign every surprise to an instrument defect. Corrections supersede explicitly while retained prior versions remain inspectable.

## Objectives and the developing context model

Standing objective: help the user pursue their stated objective by identifying consequential uncertainty, choosing useful checks and recognizing when further investigation is not worth its cost.

Keep separate:

1. Versioned explicit constraints, including evidence integrity and user-stated boundaries.
2. The current case objective and user-correctable context.
3. Learnable estimates of relevance, investigation cost, method reliability and applicability.

Initial context dimensions include stakes, reversibility, time pressure, delay cost, source independence, evidence freshness, method/version and unresolved prerequisites. Each asserted dimension needs a source or an explicit unknown/inference label. Cost estimates are labeled estimates unless measured.

Growth can refine conditions, discover supported conjunctions, identify exclusions, reduce unnecessary investigation and detect context changes. Start with a bounded vocabulary and declarative predicates. New distinctions may be proposed as candidates, but cannot influence decisions until they can be observed and tested. Do not implement growth as arbitrary self-written executable code or silently changing the feature meaning of historical records.

Silence/continuation is a first-class choice. It is appropriate when no permissible affordable check is expected to change the decision enough to justify its cost, with remaining consequential uncertainty disclosed. This is a policy judgment, not a guarantee that no unknown danger exists.

## Competence model and coherent selection

A competence entry describes a method's documented failure or strength in a defined context and engine version. It cites predictions, resolution evidence, distinct supporting families, contradictions and freshness. Helpfulness feedback stays separate from correctness evidence.

Selection proceeds in this order:

1. Assemble eligible actions/checks and mandatory unresolved dependencies using the baseline rules.
2. Evaluate applicability of relevant competence records and commitments against the current evidence.
3. Apply admitted contextual preferences among permissible checks, accounting for investigation cost and standing objectives.
4. Produce one selection record driving the operation, action, activated roles and explanation together.
5. Record the baseline choice, final choice and contributing policy IDs; identical choices mean no behavioral contribution.

Missing prerequisites cannot be bypassed. Stale, contradicted, unknown or out-of-scope records cannot claim authority. Conflicting applicable policies preserve the conflict and choose an admissible baseline/check/escalation outcome under the standing policy; they do not select whichever has more marks.

## Autonomous working commitments

A commitment is a versioned declarative policy with origin, applicability, prerequisites, exclusions, proposed check/action restriction, estimated cost, support, counterexamples, expiry/review conditions and revival conditions.

Proposed lifecycle: candidate → bounded testing → active in a named scope → narrowed/suspended/retired. Revisions create new versions. Real and simulated eligibility are evaluated separately. Passing a two-case count alone is insufficient: independence, outcome relevance, check correctness, action attribution and applicability must also hold.

Within the operating agreement, Limen autonomously proposes revisions, runs bounded local trials, activates qualifying policies, records their application and suspends them on relevant contradiction or method change. No per-policy user approval is required. The user can inspect, correct, override or disable a policy; an override is not automatically labeled failure evidence.

Working commitments are allowed to influence recommended checks. They do not execute an external action, redefine the user's objective, discard unresolved evidence or score an unchosen branch. Delayed benefits remain pending until evidence arrives.

## Other participants as unresolved hypotheses

Keep case-level competing explanations rather than authoritative personality labels. Each hypothesis has a proposed information state or relevant objective, supporting/opposing evidence, predicted observable consequences and a possible separating check. Alternatives need not be mutually exclusive or exhaustive.

New evidence can rule out an explanation under its explicit criterion, leave several compatible explanations, or leave the issue unidentifiable. If explanations imply the same next action, distinguishing them may be unnecessary. Start without persistent psychological profiles of named people; that is a separate potential extension.

## Local autonomous cycle and product experience

Trigger bounded processing when a relevant case, observation, outcome, correction or policy event is recorded, and resume pending work when the app opens. Persist an idempotent work queue and a tested per-cycle step/simulation budget; record yield/resume/error states. Policy-generated events must not trigger an unbounded feedback loop. External calls remain disabled.

The default Mind view still shows one useful next check. When experience matters, add a compact explanation of what changed and why; show the baseline, scope, evidence, alternatives and costs on demand. Self shows development history and operating priorities, not a stream of imagined inner speech. Ledger shows commitments, applicability and retirement. Candidate advice is labeled without requiring the user to administer every learning event.

Autonomy means progress within available local inputs. If the needed real-world observation is unavailable, preserve the expectation as pending and pursue other eligible work; do not invent an outcome. Closing the browser pauses local processing.

## Persistence and deletion

Use version 3 state with explicit collections and schema validation. Migrate version 2 cases/events unchanged and initialize new structures without invented competence or autonomy approval. The eventual autonomous policy mode is distinct from the legacy adaptive-weight toggle.

Preserve an existing `learningPaused` flag through migration. Imports must not resume work, replace controls, install a charter, override budgets or promote simulated instructions into authority. Recompute derived state from admissible retained evidence rather than trusting cached imported scores. Retain current deletion redaction and extend it to all new dependencies.

Export/import preserves policy versions, provenance, track separation, observation releases and dependencies. Incomplete subsets must demote unsupported derived policies. Deletion removes case content and derived content that embeds it, invalidates dependent support, cancels queued work and prevents late results from recreating records. Audit history exists only while its source data is intentionally retained.

## Proof and admission

Build sequential worlds where check selection reveals information at a cost. Include multiple failure mechanisms and quiet cases; the reviewer example alone is insufficient. Freeze splits, generators, rubric, budgets and policy parameters before protected evaluation. After evaluation-driven changes, use a fresh protected set for new generalization claims.

Compare baseline rules, a strong fixed checklist, raw-history retrieval, no profile, generic difficulty notes, stale/shuffled profiles and the genuinely learned profile. Histories and check budgets must be matched; profile corruption occurs after training, not by granting an arm extra truth. Learning histories must precede scored cases. Also remove expectations, commitments and perspective hypotheses independently to assess their contributions.

Use an independent world scorer for consequential misses, harmful revisions, investigation cost, unnecessary checks and objective/constraint violations. Report family-level results, all failures, actual behavioral differences, domain shift, forgetting/retirement and whether the policy defaults back to baseline. Unchosen branches stay unknown in the product; evaluator-only counterfactuals remain labeled as such.

Two gates are distinct: functional autonomous development and empirical advantage. A working autonomous loop may be delivered with a negative or inconclusive benefit result, provided unvalidated steering remains candidate/shadow behavior in the unsupported scope. Successful implementation alone cannot admit all learned policies or establish real-world benefit.

## Mapping to add2 and next work

| add2 item | Design mechanism |
|---|---|
| 1 | Pre-check expectations, linked observations and explicit mismatch resolution |
| 2 | Empirical competence entries influencing coherent next-check selection with true controls |
| 3 | Versioned standing objectives, case objectives and learnable context estimates |
| 4 | Competing case-level hypotheses and separating observations |
| 5 | Separate real/simulated provenance and evaluator-only hidden truth |
| 6 | Autonomous scoped commitments, application costs, outcomes and unknown unchosen branches |

See [the implementation plan](2026-09-23-autonomous-development-plan.md) for staged work. It is ready for review, not an active goal or a claim that these capabilities already exist.
