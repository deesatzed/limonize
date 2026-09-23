import type { Draft } from "./store-types";

export const SAMPLES: { id: string; label: string; draft: Draft }[] = [
  {
    id: "component",
    label: "Replacement component",
    draft: {
      title: "Replacement component",
      prose:
        "A team must choose a replacement component. Option A seems preferable because its documented dimensions fit, it is lighter, and a supplier quotes rapid delivery. The component will operate in an environment that is not fully described in the packet. Several documents repeat the dimension, and they all come from the same table. An independent drawing uses a different convention. I am inclined to order A today to avoid downtime.",
      claim: "Option A should be ordered now.",
      objective:
        "Replace the part soon enough to limit downtime, without installing something that will not fit or will not survive the real environment.",
      choice: "Order A today.",
      stakes: "consequential",
      reversible: "partial",
    },
  },
  {
    id: "metric",
    label: "A score that improved",
    draft: {
      title: "A score that improved",
      prose:
        "A deterioration alert has a better score this quarter. Fewer alerts fire, and the dashboard looks cleaner. Reviewers learned which phrases avoid a flag. I am inclined to call the model improved and roll it out more widely. We have not checked whether the events that matter are still being caught, or whether successful prevention is being counted as a false alarm.",
      claim: "The alert is better because its score improved.",
      objective: "Catch consequential deterioration early without training people to hide the signal.",
      choice: "Expand the alert.",
      stakes: "consequential",
      reversible: "partial",
    },
  },
  {
    id: "reviewer",
    label: "Reviewer handoff",
    draft: {
      title: "The reviewer is blocking completion",
      episode: "reviewer",
      prose:
        "The tool returned a success code and the report was generated. A reviewer wrote: I cannot approve this yet. I am inclined to treat that as unnecessary resistance and send a more persuasive note.",
      claim: "The task completed successfully. The remaining problem is reviewer acceptance.",
      objective: "Produce a report the current requirements would actually accept.",
      choice: "Send a more persuasive note.",
      stakes: "consequential",
      reversible: "yes",
    },
  },
];
