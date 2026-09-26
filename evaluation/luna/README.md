# Luna evaluation contract

This is a frozen, deterministic engineering comparison contract, not a claim
of statistical adequacy or real-world competence. The learner-visible world
adapter exposes only a public scenario packet and attributed observations;
evaluator truth is held in `worlds.mjs` and scoring in `scorer.mjs`. The
preflight command intentionally does not load either module or report benefit.

The four sequential families are acceptance versus execution, source
dependence, changed context/version, and quiet controls. Each has two
development and two protected case IDs. Every case has a two-check budget and
each named check costs one unit. `check-acceptance` and `trace-lineage` are
the only check actions. A checker error is unresolved/inconclusive, not a
negative; an unchosen check remains unknown. Candidate discovery and
prospective admission trials must remain separate in later tasks.

The registered arms are frozen enhanced baseline, fixed checklist, matched
raw-history retrieval, learned profile/commitments, no-profile ablation,
stale profile, and shuffled profile. Each has an explicit selection rule in
`arms.json`; later comparative execution must demonstrate that each rule is
actually exercised. The checklist is fixed in this contract and may only be
revised using development evidence before this freeze is committed.

Admission gate, copied from `GOAL_LUNA.md`: zero authority/prerequisite/track
violations and no increase in consequential misses or invalid revisions
against baseline and checklist, plus strict improvement in either cost or
successful resolution without worsening the other. A tied, negative, or
inconclusive result remains shadow/advisory. Protected outcomes must not be
used to tune strategies or reused as new evidence.

The baseline snapshot is the enhanced P0 engine at commit
`e784b440028e9c063b78af92f1e5b7fa11318ee0`, kept separate from the original
`evaluation/baseline/`. The manifest records snapshot hashes. Run
`npm run eval:luna -- --preflight` to validate file hashes, arms, split sizes,
world version, costs, and budget without loading hidden labels. Full scoring is
reserved for L10.
