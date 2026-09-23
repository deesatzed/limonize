import type { GapKind } from "./types";

export interface PanelQuestion {
  q: string;
  kinds: GapKind[];
}

export const QUESTION_PANEL: { group: string; items: PanelQuestion[] }[] = [
  {
    group: "Unknowns",
    items: [
      { q: "What kind of not-knowing is this?", kinds: ["observation", "evidence", "model", "context", "representation", "competence"] },
      { q: "Is the right outcome missing from the choices?", kinds: ["representation", "objective"] },
      { q: "Are two different situations being treated as the same?", kinds: ["representation", "context"] },
      { q: "What assumption defines the edge of the search?", kinds: ["model", "competence"] },
    ],
  },
  {
    group: "What would change the move",
    items: [
      { q: "What missing fact would reverse the choice?", kinds: ["observation", "representation", "evidence"] },
      { q: "Which unknown is large but irrelevant here?", kinds: ["objective", "evidence"] },
      { q: "Could several small uncertainties change the result together?", kinds: ["model", "observation"] },
      { q: "When would waiting do more harm than acting?", kinds: ["dynamic"] },
    ],
  },
  {
    group: "Truth, evidence, context",
    items: [
      { q: "Was this value observed, inferred, assumed, or copied?", kinds: ["evidence"] },
      { q: "How many sources share one ancestor?", kinds: ["evidence"] },
      { q: "What context changed since the evidence was gathered?", kinds: ["context"] },
      { q: "Which accepted premise has the most downstream influence?", kinds: ["evidence", "model"] },
    ],
  },
  {
    group: "Criticism",
    items: [
      { q: "Could a correct answer be correct by accident?", kinds: ["competence"] },
      { q: "What nearby case would expose the method?", kinds: ["competence", "representation"] },
      { q: "Is the critic finding evidence, or a persuasive story?", kinds: ["competence"] },
      { q: "What would justify stopping the review?", kinds: ["dynamic", "competence"] },
    ],
  },
  {
    group: "Incentives and feedback",
    items: [
      { q: "Who benefits if this claim is accepted?", kinds: ["strategic"] },
      { q: "How will people adapt to the score or the alert?", kinds: ["reflexive", "objective"] },
      { q: "Could successful prevention look like a false alarm?", kinds: ["reflexive"] },
      { q: "Which competence disappears if automation succeeds?", kinds: ["reflexive", "competence"] },
    ],
  },
  {
    group: "Action",
    items: [
      { q: "What is the useful horizon of this prediction?", kinds: ["dynamic"] },
      { q: "Which action stays acceptable across the competing explanations?", kinds: ["model", "strategic"] },
      { q: "Does the instrument understand the gap but lack a response?", kinds: ["competence"] },
    ],
  },
];
