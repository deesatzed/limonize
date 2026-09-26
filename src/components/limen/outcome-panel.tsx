import { useState } from "react";
import { currentOutcome } from "@/lib/limen/ledger";
import { useLimen } from "@/lib/limen/store";
import type { Sitting, Situation } from "@/lib/limen/types";

export function OutcomePanel({ situation, sitting }: { situation: Situation; sitting: Sitting }) {
  const events = useLimen((state) => state.outcomeEvents);
  const planOutcome = useLimen((state) => state.planOutcome);
  const recordOutcome = useLimen((state) => state.recordOutcome);
  const deferOutcome = useLimen((state) => state.deferOutcome);
  const triggerCondition = useLimen((state) => state.triggerOutcomeCondition);
  const current = currentOutcome(events, situation.id);
  const [action, setAction] = useState(sitting.result.actions[0]?.title ?? "Wait");
  const [expectation, setExpectation] = useState("");
  const [condition, setCondition] = useState("");
  const [revisitCondition, setRevisitCondition] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<"observed" | "reported" | "unknown" | "ongoing">("reported");
  const [evidence, setEvidence] = useState("");
  const [changed, setChanged] = useState("");
  const [assessment, setAssessment] = useState<"supports" | "contradicts" | "unclear">("unclear");
  const [deferDate, setDeferDate] = useState("");
  return <section className="border-t border-line pt-6">
    <h2 className="font-serif text-2xl">What happened next?</h2>
    <p className="mt-2 text-sm text-muted">Your chosen action can differ from the suggestion. An outcome is not proof that this suggestion caused it.</p>
    {current.plan ? <div className="mt-4 rounded-lg bg-bg-raised p-4 text-sm">
      <p>Chosen: {current.plan.action}</p><p className="mt-1">Expected: {current.plan.expectation}</p>
      {current.plan.revisionCondition ? <p className="mt-1">Reconsider if: {current.plan.revisionCondition}</p> : null}
      {current.result ? <p className="mt-2">Outcome {current.result.status}: {current.result.evidence || "No evidence recorded"}. {current.result.changed}</p> : <p className="mt-2 text-copper">Outcome pending.</p>}
    </div> : null}
    <details className="mt-4"><summary className="min-h-11 cursor-pointer text-copper">{current.plan ? "Revise the plan" : "Record the action and expectation"}</summary>
      <div className="mt-3 space-y-3">
        <label className="block text-sm">Action actually chosen<input value={action} onChange={(e) => setAction(e.target.value)} className="mt-1 min-h-11 w-full rounded-sm bg-bg-raised px-3 text-fg" /></label>
        <label className="block text-sm">Expected result<input value={expectation} onChange={(e) => setExpectation(e.target.value)} className="mt-1 min-h-11 w-full rounded-sm bg-bg-raised px-3 text-fg" /></label>
        <label className="block text-sm">Reconsider if<input value={condition} onChange={(e) => setCondition(e.target.value)} className="mt-1 min-h-11 w-full rounded-sm bg-bg-raised px-3 text-fg" /></label>
        <label className="block text-sm">Revisit when this happens<input value={revisitCondition} onChange={(e) => setRevisitCondition(e.target.value)} className="mt-1 min-h-11 w-full rounded-sm bg-bg-raised px-3 text-fg" /></label>
        <label className="block text-sm">Revisit date, if useful<input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 min-h-11 rounded-sm bg-bg-raised px-3 text-fg" /></label>
        <button type="button" disabled={!action.trim() || !expectation.trim()} onClick={() => planOutcome(action, expectation, condition, date ? new Date(`${date}T12:00:00`).getTime() : undefined, revisitCondition)} className="min-h-11 rounded-sm bg-copper px-4 text-ink disabled:opacity-50">Keep this plan</button>
      </div>
    </details>
    {current.plan?.revisitCondition ? <button type="button" onClick={triggerCondition} className="mt-3 min-h-11 text-copper">Condition met: {current.plan.revisitCondition}</button> : null}
    {current.plan ? <details className="mt-4"><summary className="min-h-11 cursor-pointer text-copper">Record or correct an outcome</summary>
      <div className="mt-3 space-y-3">
        <label className="block text-sm">Status<select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="mt-1 min-h-11 w-full bg-bg-raised p-2 text-fg"><option value="reported">Reported</option><option value="observed">Observed by me</option><option value="unknown">Still unknown</option><option value="ongoing">Ongoing</option></select></label>
        <label className="block text-sm">What happened, and what supports it?<textarea value={evidence} onChange={(e) => setEvidence(e.target.value)} rows={3} className="mt-1 w-full rounded-sm bg-bg-raised p-3 text-fg" /></label>
        <label className="block text-sm">What changed in your view?<input value={changed} onChange={(e) => setChanged(e.target.value)} className="mt-1 min-h-11 w-full rounded-sm bg-bg-raised px-3 text-fg" /></label>
        <label className="block text-sm">Does this outcome support the lesson?<select value={assessment} onChange={(e) => setAssessment(e.target.value as typeof assessment)} className="mt-1 min-h-11 w-full bg-bg-raised p-2 text-fg"><option value="unclear">Unclear</option><option value="supports">Supports its use here</option><option value="contradicts">Counts against it</option></select></label>
        <button type="button" onClick={() => recordOutcome(status, evidence, changed, assessment)} className="min-h-11 rounded-sm bg-copper px-4 text-ink">Keep this outcome</button>
      </div>
    </details> : null}
    {current.plan && (!current.result || current.result.status === "unknown" || current.result.status === "ongoing") ? <div className="mt-4 flex flex-wrap items-end gap-3"><label className="text-sm">Defer follow-up until<input type="date" value={deferDate} onChange={(e) => setDeferDate(e.target.value)} className="mt-1 block min-h-11 rounded-sm bg-bg-raised px-3 text-fg" /></label><button type="button" disabled={!deferDate} onClick={() => deferOutcome(new Date(`${deferDate}T12:00:00`).getTime())} className="min-h-11 rounded-sm bg-bg-raised px-4 disabled:opacity-50">Defer</button></div> : null}
  </section>;
}
