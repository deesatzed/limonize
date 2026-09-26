# Luna development ledger contract

Status: **v1 typed contract; no policy activation or live steering in L02**.

This is the frozen record boundary for the first Limen development cycle. It
describes records and references, not permission to change application
controls. `src/lib/limen/development.ts` validates and deterministically replays
these records. The existing charter, user objective, enabled/development
pause settings, available checks, and app configuration remain authoritative
outside the learnable ledger.

## Event envelope

Every event has exactly these fields:

| Field | Meaning |
|---|---|
| `id` | Stable nonempty event identifier, unique by content |
| `sequence` | Positive safe integer; unique local ledger order |
| `at` | Finite nonnegative timestamp; descriptive, never the ordering key |
| `schemaVersion` | `1` for this contract |
| `kind` | One of the event names below; unknown kinds fail closed |
| `payload` | Exactly one typed payload for that kind; extra control fields fail closed |

Replay is pure: exact duplicate IDs with exact normalized content are
idempotent; the same ID with different content and any sequence collision are
errors. Records are consumed in sequence order, independent of input-array
order. References must resolve to earlier retained events on the same case,
run and experience track. Deletion creates a tombstone, removes dependent
replayable records, and rejects later implicit restoration.

## Event kinds and references

| Kind | Payload | Required linkage and constraints |
|---|---|---|
| `expectation.recorded` | `expectation` | `id`, `caseId`, `runId`, `track`, `familyId`, context versions, eligible check `actionId`, criterion and predicted outcome. Optional `parentExperienceId` records lineage. Simulated context names `worldVersion`; real context has none. |
| `observation.released` | `observation` | Own `id`, matching `caseId`/`runId`/`track`, earlier `expectationId`, typed source and released status/result. Sources are `user_report`, `check_receipt` (`limen-report-v1`, checker `1`) or simulated-only `simulation_release` with matching world version. |
| `expectation.resolved` | `resolution` | Own `id`, the expectation's case/run/track, one or more earlier observation IDs except `not_tested`; statuses are `supported`, `contradicted`, `inconclusive`, `not_tested`. Supported/contradicted claims require matching released evidence. |
| `competence.derived` | `summary` | Own `id`, track/context/action tuple and disjoint resolution-ID buckets for supported, contradicted and unknown outcomes. Counts are recomputed against those IDs and each resolution must match track and method. |
| `policy.version_recorded` | `policyVersion` | Own version `id`, stable `policyId`, sequential integer version and explicit predecessor when version >1; scope/track/context agree; support IDs cite retained same-track resolutions in the recorded context. |
| `policy.reviewed` | `review` | Own ID, latest policy-version ID and matching track, one of contract/evidence/continuity, accepted/rejected verdict, earlier source-event IDs and a review sequence equal to its envelope sequence. |
| `policy.trial_recorded` | `trial` | Own ID, latest simulation policy under test, distinct prospective family, matching simulation world and a resolved case/run/outcome; baseline and selected action IDs are explicit. |
| `policy.transitioned` | `transition` | Policy-version ID, permitted lifecycle transition and finite reason code. L02 permits candidate→testing, suspension and retirement records; active transitions are rejected until the later admission task. |
| `policy.applied` | `application` | Own ID, latest active simulation-policy version, simulated case/run, earlier source events, baseline/selected action IDs, honest contribution flag and finite cost. No application can be produced by this L02 implementation because activation is disabled. |
| `job.queued` | `job` | Own ID, earlier source-event ID, one of three enumerated local job kinds and an input version. Scheduling/recovery is implemented in L08. |
| `dependency.deleted` | `dependency` | One named case/run/evidence/receipt/expectation/observation/resolution/policy ID. Deletion redacts dependent ledger records in replay and leaves a tombstone. |

## Finite policy vocabulary

Policy actions are limited to:

- `prefer_check` for an already-eligible `check-acceptance` or `trace-lineage`
  action;
- `require_receipt` for the existing `limen-report-v1` shape criterion.

Reconsideration conditions are finite typed values: context, objective, or
method change; revoked support; contradiction linked to an expectation; a
named receipt outcome; finite expiry; or explicit override. No expression
language, executable policy text, arbitrary action ID, charter mutation, user
objective replacement, learning enable/pause field, or permission/authority
field is accepted in a learned payload.

Real-track policies have `real_advisory` scope and cannot steer. Simulation
scope must name its world version. The event types reserve review, trial,
transition and application records for later steps, but an event history alone
does not authorize runtime writes. Admission requires the later policy-review
and selection implementation; L02 explicitly rejects `active` transitions.

## Versioning and deferred behavior

Schema changes require a new schema version and an explicit migration. Policy
revisions increment by one and point to the immediately superseded version;
the prior version is marked superseded and cannot be reactivated. Runtime
candidate generation, evidence-derived competence, receipt recomputation,
selection, storage migration/import, queue processing and UI are owned by
L03–L09. This contract does not claim measured benefit or real-world
competence.
