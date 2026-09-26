# RISK_NOTES.md

Assessed 2026-09-23 at `c8c89f0`. Findings distinguish reproduced behavior from static inspection and unverified deployment conditions. See [ASSESSMENT.md](ASSESSMENT.md) for evidence and proposed acceptance criteria.

## Risks

| Risk | Severity | Why It Matters | Mitigation |
|---|---|---|---|
| Simulated check becomes observed evidence | High | A literal marker creates an asserted schema failure without a validator or artifact | Separate simulated/reported/verified records; require recorded checker evidence |
| Mutable results with retained learning | High | Revisions remove visible feedback but retain weights; one session can accumulate unexplained repeated credit | Immutable run IDs, feedback events, defined correction semantics, derived statistics |
| Global feedback overrides evidence requirements | High | Reproduced `stop` operation despite a failed schema prerequisite | Constrain admissible operations before applying learned preferences |
| Keyword false positives | High for decision reliability | Negated incentives and measurements still create gaps | Source spans, polarity handling, confirmation, adversarial held-out cases |
| Duplicate sessions promote memory | High for learning claims | Identical example repeated twice qualifies with no outcome evidence | Deduplication and distinct outcome-backed validation cases |
| Paid endpoint lacks aggregate usage controls | High if publicly exposed with a funded key | Input/output caps do not limit repeated requests; hosting controls unverified | Server admission/rate/budget limits, timeouts, request deduplication |
| Response lacks role/revision identity | High before role-specific AI use | One response can be reused across changing or multiple Grok assignments | Typed role contracts and revision-bound response storage |
| Incomplete test gate | Medium | Eight platform failures; product tests absent from npm test and not directly runnable with configured Node approach | Explicit complete test inventory, compatible runner, isolated fixtures |
| Storage loss / invisible retention | Medium | Raw sessions persist without migration/recovery/export/selective deletion | Versioned validated persistence, retention notice, export and deletion |
| Prototype claims exceed evidence | Medium | Local weights, decorative probabilities, and sparse tags can look like validated competence | Capability matrix and independently scored outcome evaluation |
| Export assumptions and generated artifacts | Medium | Startup and QA require `/workspace`; built output is tracked alongside source | Document supported environments; parameterize roots while preserving original platform contracts; handle generated output deliberately |
| Dense vocabulary obscures benefit | Medium | Internal role/routing concepts dominate entry and results | Plain-language primary flow, expandable technical detail |

## Safe Next Step

Establish a reproducible application baseline and capture the confirmed evidence/feedback defects as regressions. Then repair history/provenance semantics before extending learning or adding providers. Keep the broad exploration reference open and unchanged.
