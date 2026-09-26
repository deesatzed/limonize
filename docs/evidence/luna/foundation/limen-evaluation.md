# Limen offline evaluation

Synthetic engineering coverage: 30 distinct labeled families, 20 development and 10 held-out, three cases each. This is not statistical adequacy or user benefit evidence. Split hashes were computed from fixed fixture data before this comparison; fixtures and scoring are separate from the product engine. The held-out cases were authored after initial implementation began, so they are not a prospective generalization test.

Development SHA-256: e02583d25b4c6d2e42a044e32c6832ff0bbb7358284e469644ef3f4de855458c

Held-out SHA-256: 2b7efe6dd7857be8b6c4adec3313b2c65bfb794e1656aa102f7baf95012824b3

Question budget: 3 per case. Relevant questions match the fixture's independently declared ask IDs (provided for four signal types); this deliberately undercounts other useful questions. Missed decisive issue means required signal absent. False alarm means an extra signal or any signal on a no-signal case. Harmful revision proxy means nonquiet action on a no-signal case. Action consistency compares base and meaning-preserving paraphrase within a family. Machine time excludes human effort, which was unmeasured. Real outcomes and causal benefit were unmeasured.

| Arm | Missed | False alarms | Harmful revision proxies | Relevant / asked | Action consistency | Machine ms | Errors |
|---|---:|---:|---:|---:|---:|---:|---:|
| fixed-checklist | 58/90 | 0/90 | 32/90 | 0/270 | 30/30 | 0 | 0 |
| frozen-rule-baseline | 7/90 | 18/90 | 11/90 | 26/36 | 27/30 | 13 | 0 |
| enhanced-default | 1/90 | 10/90 | 3/90 | 22/32 | 29/30 | 10 | 0 |
| enhanced-adaptive-off | 1/90 | 10/90 | 3/90 | 22/32 | 29/30 | 6 | 0 |
| enhanced-memory-off | 1/90 | 10/90 | 3/90 | 22/32 | 29/30 | 5 | 0 |

Adaptive and memory arms use the same default-off configuration, because this fixture set contains no ethically usable feedback or validated memories. Their identical outputs are an ablation limitation, not evidence of benefit. No adaptive preference is enabled by default.

## Every flagged case

- fixed-checklist / copy-spec / base: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected shared-ancestor; got none
- fixed-checklist / copy-spec / paraphrase: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected shared-ancestor; got none
- fixed-checklist / copy-spec / decisive-change: {"missedDecisive":false,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":true}; expected quiet; got none
- fixed-checklist / copy-manual / base: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected shared-ancestor; got none
- fixed-checklist / copy-manual / paraphrase: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected shared-ancestor; got none
- fixed-checklist / copy-manual / decisive-change: {"missedDecisive":false,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":true}; expected quiet; got none
- fixed-checklist / copy-log / base: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected shared-ancestor; got none
- fixed-checklist / copy-log / paraphrase: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected shared-ancestor; got none
- fixed-checklist / copy-log / decisive-change: {"missedDecisive":false,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":true}; expected quiet; got none
- fixed-checklist / vendor-quote / base: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected incentive; got none
- fixed-checklist / vendor-quote / paraphrase: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected incentive; got none
- fixed-checklist / vendor-quote / decisive-change: {"missedDecisive":false,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":true}; expected quiet; got none
- fixed-checklist / sales-plan / base: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected incentive; got none
- fixed-checklist / sales-plan / paraphrase: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected incentive; got none
- fixed-checklist / sales-plan / decisive-change: {"missedDecisive":false,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":true}; expected quiet; got none
- fixed-checklist / supplier-bid / base: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected incentive; got none
- fixed-checklist / supplier-bid / paraphrase: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected incentive; got none
- fixed-checklist / supplier-bid / decisive-change: {"missedDecisive":false,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":true}; expected quiet; got none
- fixed-checklist / missing-load / base: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected unmeasured; got none
- fixed-checklist / missing-load / paraphrase: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected unmeasured; got none
- fixed-checklist / missing-load / decisive-change: {"missedDecisive":false,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":true}; expected quiet; got none
- fixed-checklist / missing-temp / base: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected unmeasured; got none
- fixed-checklist / missing-temp / paraphrase: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected unmeasured; got none
- fixed-checklist / missing-temp / decisive-change: {"missedDecisive":false,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":true}; expected quiet; got none
- fixed-checklist / missing-shape / base: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected unmeasured; got none
- fixed-checklist / missing-shape / paraphrase: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected unmeasured; got none
- fixed-checklist / missing-shape / decisive-change: {"missedDecisive":false,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":true}; expected quiet; got none
- fixed-checklist / lab-field / base: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected context-shift; got none
- fixed-checklist / lab-field / paraphrase: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected context-shift; got none
- fixed-checklist / lab-field / decisive-change: {"missedDecisive":false,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":true}; expected quiet; got none
- fixed-checklist / region-change / base: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected context-shift; got none
- fixed-checklist / region-change / paraphrase: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected context-shift; got none
- fixed-checklist / region-change / decisive-change: {"missedDecisive":false,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":true}; expected quiet; got none
- fixed-checklist / population-change / base: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected context-shift; got none
- fixed-checklist / population-change / paraphrase: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected context-shift; got none
- fixed-checklist / population-change / decisive-change: {"missedDecisive":false,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":true}; expected quiet; got none
- fixed-checklist / unit-mm / base: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected units; got none
- fixed-checklist / unit-mm / paraphrase: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected units; got none
- fixed-checklist / unit-mm / decisive-change: {"missedDecisive":false,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":true}; expected quiet; got none
- fixed-checklist / unit-inches / base: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected units; got none
- fixed-checklist / unit-inches / paraphrase: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected units; got none
- fixed-checklist / unit-inches / decisive-change: {"missedDecisive":false,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":true}; expected quiet; got none
- fixed-checklist / metric-clean / base: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected metric-drift; got none
- fixed-checklist / metric-clean / paraphrase: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected metric-drift; got none
- fixed-checklist / metric-clean / decisive-change: {"missedDecisive":false,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":true}; expected quiet; got none
- fixed-checklist / metric-alert / base: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected metric-drift; got none
- fixed-checklist / metric-alert / paraphrase: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected metric-drift; got none
- fixed-checklist / metric-alert / decisive-change: {"missedDecisive":false,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":true}; expected quiet; got none
- fixed-checklist / fast-irrelevant / base: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected relevance; got none
- fixed-checklist / fast-irrelevant / paraphrase: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected relevance; got none
- fixed-checklist / fast-irrelevant / decisive-change: {"missedDecisive":false,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":true}; expected quiet; got none
- fixed-checklist / rare-failure / base: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected rare; got none
- fixed-checklist / rare-failure / paraphrase: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected rare; got none
- fixed-checklist / rare-failure / decisive-change: {"missedDecisive":false,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":true}; expected quiet; got none
- fixed-checklist / default-value / base: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected defaulted; got none
- fixed-checklist / default-value / paraphrase: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected defaulted; got none
- fixed-checklist / default-value / decisive-change: {"missedDecisive":false,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":true}; expected quiet; got none
- fixed-checklist / feedback-loop / base: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected reflexive; got none
- fixed-checklist / feedback-loop / paraphrase: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected reflexive; got none
- fixed-checklist / feedback-loop / decisive-change: {"missedDecisive":false,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":true}; expected quiet; got none
- fixed-checklist / heldout-copy-blueprint / base: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected shared-ancestor; got none
- fixed-checklist / heldout-copy-blueprint / paraphrase: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected shared-ancestor; got none
- fixed-checklist / heldout-copy-blueprint / decisive-change: {"missedDecisive":false,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":true}; expected quiet; got none
- fixed-checklist / heldout-vendor-schedule / base: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected incentive; got none
- fixed-checklist / heldout-vendor-schedule / paraphrase: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected incentive; got none
- fixed-checklist / heldout-vendor-schedule / decisive-change: {"missedDecisive":false,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":true}; expected quiet; got none
- fixed-checklist / heldout-unmeasured-flow / base: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected unmeasured; got none
- fixed-checklist / heldout-unmeasured-flow / paraphrase: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected unmeasured; got none
- fixed-checklist / heldout-unmeasured-flow / decisive-change: {"missedDecisive":false,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":true}; expected quiet; got none
- fixed-checklist / heldout-new-climate / base: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected context-shift; got none
- fixed-checklist / heldout-new-climate / paraphrase: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected context-shift; got none
- fixed-checklist / heldout-new-climate / decisive-change: {"missedDecisive":false,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":true}; expected quiet; got none
- fixed-checklist / heldout-units / base: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected units; got none
- fixed-checklist / heldout-units / paraphrase: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected units; got none
- fixed-checklist / heldout-units / decisive-change: {"missedDecisive":false,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":true}; expected quiet; got none
- fixed-checklist / heldout-proxy / base: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected metric-drift; got none
- fixed-checklist / heldout-proxy / paraphrase: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected metric-drift; got none
- fixed-checklist / heldout-proxy / decisive-change: {"missedDecisive":false,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":true}; expected quiet; got none
- fixed-checklist / heldout-incentive / base: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected incentive; got none
- fixed-checklist / heldout-incentive / paraphrase: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected incentive; got none
- fixed-checklist / heldout-incentive / decisive-change: {"missedDecisive":false,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":true}; expected quiet; got none
- fixed-checklist / heldout-default / base: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected defaulted; got none
- fixed-checklist / heldout-default / paraphrase: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected defaulted; got none
- fixed-checklist / heldout-default / decisive-change: {"missedDecisive":false,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":true}; expected quiet; got none
- fixed-checklist / heldout-rare / base: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected rare; got none
- fixed-checklist / heldout-rare / paraphrase: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected rare; got none
- fixed-checklist / heldout-rare / decisive-change: {"missedDecisive":false,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":true}; expected quiet; got none
- fixed-checklist / heldout-quiet / base: {"missedDecisive":false,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":true}; expected quiet; got none
- fixed-checklist / heldout-quiet / paraphrase: {"missedDecisive":false,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":true}; expected quiet; got none
- fixed-checklist / heldout-quiet / decisive-change: {"missedDecisive":false,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":true}; expected quiet; got none
- frozen-rule-baseline / copy-spec / paraphrase: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected shared-ancestor; got none
- frozen-rule-baseline / copy-manual / base: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected shared-ancestor; got none
- frozen-rule-baseline / copy-manual / paraphrase: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected shared-ancestor; got none
- frozen-rule-baseline / copy-log / paraphrase: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected shared-ancestor; got none
- frozen-rule-baseline / vendor-quote / decisive-change: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":1,"harmfulRevision":true}; expected quiet; got incentive
- frozen-rule-baseline / sales-plan / decisive-change: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":1,"harmfulRevision":true}; expected quiet; got incentive
- frozen-rule-baseline / supplier-bid / decisive-change: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":1,"harmfulRevision":true}; expected quiet; got incentive
- frozen-rule-baseline / lab-field / decisive-change: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":0,"harmfulRevision":true}; expected quiet; got context-shift
- frozen-rule-baseline / region-change / decisive-change: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":0,"harmfulRevision":true}; expected quiet; got context-shift
- frozen-rule-baseline / population-change / decisive-change: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":0,"harmfulRevision":true}; expected quiet; got context-shift
- frozen-rule-baseline / unit-mm / decisive-change: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":1,"harmfulRevision":false}; expected quiet; got units
- frozen-rule-baseline / unit-inches / base: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":1,"harmfulRevision":false}; expected units; got disagreement,units
- frozen-rule-baseline / unit-inches / paraphrase: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":1,"harmfulRevision":false}; expected units; got disagreement,units
- frozen-rule-baseline / unit-inches / decisive-change: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":1,"harmfulRevision":false}; expected quiet; got units
- frozen-rule-baseline / metric-clean / decisive-change: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":0,"harmfulRevision":true}; expected quiet; got metric-drift
- frozen-rule-baseline / feedback-loop / paraphrase: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected reflexive; got none
- frozen-rule-baseline / heldout-copy-blueprint / base: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected shared-ancestor; got none
- frozen-rule-baseline / heldout-copy-blueprint / paraphrase: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected shared-ancestor; got none
- frozen-rule-baseline / heldout-vendor-schedule / decisive-change: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":1,"harmfulRevision":true}; expected quiet; got incentive
- frozen-rule-baseline / heldout-new-climate / decisive-change: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":0,"harmfulRevision":true}; expected quiet; got context-shift
- frozen-rule-baseline / heldout-units / paraphrase: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":1,"harmfulRevision":false}; expected units; got disagreement,units
- frozen-rule-baseline / heldout-units / decisive-change: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":1,"harmfulRevision":false}; expected quiet; got units
- frozen-rule-baseline / heldout-incentive / decisive-change: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":1,"harmfulRevision":true}; expected quiet; got incentive
- frozen-rule-baseline / heldout-default / decisive-change: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":0,"harmfulRevision":false}; expected quiet; got defaulted
- frozen-rule-baseline / heldout-quiet / decisive-change: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":0,"harmfulRevision":true}; expected quiet; got disagreement
- enhanced-default / supplier-bid / decisive-change: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":1,"harmfulRevision":true}; expected quiet; got incentive
- enhanced-default / unit-mm / decisive-change: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":1,"harmfulRevision":false}; expected quiet; got units
- enhanced-default / unit-inches / base: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":1,"harmfulRevision":false}; expected units; got disagreement,units
- enhanced-default / unit-inches / paraphrase: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":1,"harmfulRevision":false}; expected units; got disagreement,units
- enhanced-default / unit-inches / decisive-change: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":1,"harmfulRevision":false}; expected quiet; got units
- enhanced-default / metric-clean / decisive-change: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":0,"harmfulRevision":true}; expected quiet; got metric-drift
- enhanced-default / feedback-loop / paraphrase: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected reflexive; got none
- enhanced-default / heldout-units / paraphrase: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":1,"harmfulRevision":false}; expected units; got disagreement,units
- enhanced-default / heldout-units / decisive-change: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":1,"harmfulRevision":false}; expected quiet; got units
- enhanced-default / heldout-default / decisive-change: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":0,"harmfulRevision":false}; expected quiet; got defaulted
- enhanced-default / heldout-quiet / decisive-change: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":0,"harmfulRevision":true}; expected quiet; got disagreement
- enhanced-adaptive-off / supplier-bid / decisive-change: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":1,"harmfulRevision":true}; expected quiet; got incentive
- enhanced-adaptive-off / unit-mm / decisive-change: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":1,"harmfulRevision":false}; expected quiet; got units
- enhanced-adaptive-off / unit-inches / base: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":1,"harmfulRevision":false}; expected units; got disagreement,units
- enhanced-adaptive-off / unit-inches / paraphrase: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":1,"harmfulRevision":false}; expected units; got disagreement,units
- enhanced-adaptive-off / unit-inches / decisive-change: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":1,"harmfulRevision":false}; expected quiet; got units
- enhanced-adaptive-off / metric-clean / decisive-change: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":0,"harmfulRevision":true}; expected quiet; got metric-drift
- enhanced-adaptive-off / feedback-loop / paraphrase: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected reflexive; got none
- enhanced-adaptive-off / heldout-units / paraphrase: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":1,"harmfulRevision":false}; expected units; got disagreement,units
- enhanced-adaptive-off / heldout-units / decisive-change: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":1,"harmfulRevision":false}; expected quiet; got units
- enhanced-adaptive-off / heldout-default / decisive-change: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":0,"harmfulRevision":false}; expected quiet; got defaulted
- enhanced-adaptive-off / heldout-quiet / decisive-change: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":0,"harmfulRevision":true}; expected quiet; got disagreement
- enhanced-memory-off / supplier-bid / decisive-change: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":1,"harmfulRevision":true}; expected quiet; got incentive
- enhanced-memory-off / unit-mm / decisive-change: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":1,"harmfulRevision":false}; expected quiet; got units
- enhanced-memory-off / unit-inches / base: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":1,"harmfulRevision":false}; expected units; got disagreement,units
- enhanced-memory-off / unit-inches / paraphrase: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":1,"harmfulRevision":false}; expected units; got disagreement,units
- enhanced-memory-off / unit-inches / decisive-change: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":1,"harmfulRevision":false}; expected quiet; got units
- enhanced-memory-off / metric-clean / decisive-change: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":0,"harmfulRevision":true}; expected quiet; got metric-drift
- enhanced-memory-off / feedback-loop / paraphrase: {"missedDecisive":true,"falseAlarm":false,"relevantQuestions":0,"harmfulRevision":false}; expected reflexive; got none
- enhanced-memory-off / heldout-units / paraphrase: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":1,"harmfulRevision":false}; expected units; got disagreement,units
- enhanced-memory-off / heldout-units / decisive-change: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":1,"harmfulRevision":false}; expected quiet; got units
- enhanced-memory-off / heldout-default / decisive-change: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":0,"harmfulRevision":false}; expected quiet; got defaulted
- enhanced-memory-off / heldout-quiet / decisive-change: {"missedDecisive":false,"falseAlarm":true,"relevantQuestions":0,"harmfulRevision":true}; expected quiet; got disagreement

All 450 run records, including unflagged and failed executions, are in latest.json.
