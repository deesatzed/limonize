# Hive Lineage repository map

Read-only donor assessment, 2026-09-25. [Assessment and snapshot boundary](ASSESSMENT.md), [file hashes](source-manifest.json).

## Project type

Movie/roleplay prompt pack plus a newer single-character decision engine with persistent commitments and adversarial review.

## Tech stack

Python 3.13 requirement, Pydantic v2, PyYAML, OpenAI-compatible client, python-dotenv. JSONL local persistence. Root assets are Markdown/text. No deployed UI is implemented in this engine.

## Package manager

`engine/pyproject.toml`, Hatchling build backend, existing `engine/.venv`. Dependencies were already available; this assessment installed nothing. No lint/typecheck tool or project script is configured in that file.

## Commands

| Purpose | Command | Verified |
|---|---|---|
| Unit tests | `.venv/bin/python -m pytest tests -q -p no:cacheprovider` with bytecode off and temporary base directory | 54 pass on snapshot; 54 also passed during initial live-tree read |
| Offline acceptance | `python -m hive.eval_suite --replay <recordings> --state-dir <temporary-state>` | Exit 1, four missing-key failures in snapshot |
| Diagnostic replay | Direct `Rack`/`ReplayClient` with recorded model IDs | Recordings found; four fixtures still fail snapshot assertions |
| Scripted boundary probes | `python probe.py --source <snapshot>` | Exit 0; reproduced findings in `probe-results.json` |
| Live CLI | `python -m hive "question" --topic <topic>` | Not run; loads provider credentials and makes paid calls |
| Live recording | `python -m hive.eval_suite --record <path>` | Not run |
| Wheel/build/install | Hatchling project | Not run; unnecessary for source contribution assessment |

Full invocation context and limits: [EVIDENCE.json](EVIDENCE.json). All test/probe state was directed to temporary paths. No source `.env` or user state was inspected.

## Entry points

- `engine/src/hive/__main__.py` → `cli.main`: one-shot live cycle.
- `engine/src/hive/eval_suite.py`: sequential record/replay fixtures.
- `engine/src/hive/rack.py`: deterministic orchestration and persistence.
- `README.md`: movie pack entry and hat-loading guidance; does not comprehensively document the newer engine.

## Major folders

| Folder | Role |
|---|---|
| `shared/`, `agents/`, `examples/` | Fictional-world constitution, bounded role prompts, harness/communication design and sample scene |
| `constitution/` | Engine protocol pinned by SHA-256 |
| `engine/src/hive/` | Schemas, orchestration, ledger, memory, review, prompt assembly, client and CLI |
| `engine/tests/` | Local unit/integration tests using scripted model outputs and temporary files |
| `engine/eval/fixtures/` | Four-turn moral-dilemma acceptance sequence; source labels distinguish captured outputs and authored/reconstructed inputs |
| `engine/eval/recordings/` | Existing model-response JSONL; untracked at capture |
| `docs/plans/` | Detailed design and implementation instructions; broader than current code |
| `Hi5er/` | Reference design corpus; not treated as implemented behavior in this review |

## Existing patterns to preserve

Typed inter-component contracts, declared revision conditions, no silent return to superseded commitments, strict malformed-critic handling, governing-text drift detection, explicit separation of replay instrumentation from live behavior evidence. Movie fiction remains separate from runtime permissions.

## Tests and verification

Existing tests cover protocol checksum, schemas, condition-ID validation, record/replay unit roundtrip, bounded retry followed by hold, persistence loading, novelty and malformed critic output. They do not establish evidence authenticity, atomic policy admission, critic enforcement, full gap disclosure, causal learning benefit or a green end-to-end acceptance run.

## Likely files for contribution work

`schemas.py`, `ledger.py`, `rack.py`, `mirror.py`, `llm.py`, `eval_suite.py`, `test_persistence.py`; design-only contributions from `shared/KERNEL.md`, `agents/IRIS.md`, `agents/MNEMOS.md`.

Limen destinations already planned: `development.ts`, `commitments.ts`, `development-cycle.ts`, `competence.ts`, `evaluation/development/`; existing foundations in `types.ts`, `ledger.ts`, `data.ts`, `check.ts` and the charter. No new application files were implemented in this assessment.

## Unknowns

Live-model reliability/calibration, independent provenance of captured responses, current paid-run status and later source changes. The inspected code does not enforce distinct model families. No explicit license file appeared in the inventory; this recommendation concerns design adaptation, not redistribution of donor code.
