import { useMemo, useState } from "react";
import { replayDevelopment } from "@/lib/limen/development";
import { useLimen } from "@/lib/limen/store";
import { SIMULATION_SCOPE_DISPOSITION } from "@/lib/limen/scope-disposition";

export function DevelopmentPanel() {
  const enabled = useLimen((state) => state.developmentEnabled);
  const paused = useLimen((state) => state.learningPaused);
  const processing = useLimen((state) => state.developmentProcessing);
  const events = useLimen((state) => state.developmentEvents);
  const jobs = useLimen((state) => state.developmentJobs);
  const setEnabled = useLimen((state) => state.setDevelopmentEnabled);
  const queueWork = useLimen((state) => state.queueDevelopmentWork);
  const runWork = useLimen((state) => state.runDevelopmentWork);
  const runRehearsal = useLimen((state) => state.runLocalRehearsal);
  const [notice, setNotice] = useState("");
  const replay = useMemo(() => replayDevelopment(events), [events]);
  const pending = jobs.filter((job) => job.status === "queued").length;
  const simulatedExperiences = replay.expectations.filter((row) => row.track === "simulated").length;
  const activePolicies = replay.policies.filter((row) => row.lifecycle === "active").length;
  const applications = replay.applications.length;
  const recentSimulated = replay.expectations.filter((row) => row.track === "simulated").slice(-6).reverse();
  const status = !enabled ? "Off" : paused ? "Paused" : processing ? "Processing bounded work" : pending ? `${pending} job${pending === 1 ? "" : "s"} waiting` : "Ready";

  return (
    <section className="border-t border-line pt-7" aria-labelledby="development-title">
      <p className="text-xs font-semibold tracking-widest text-copper uppercase">Local and bounded</p>
      <h2 id="development-title" className="mt-2 font-serif text-2xl text-fg">Development cycle</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Attributed experience can propose and test a narrow check preference. Real cases remain advisory. The comparative gate currently keeps simulation policies in shadow, so trials are inspectable but do not steer later selections.
      </p>
      <div className="mt-4 rounded-lg border border-line bg-bg-raised p-4">
        <p role="status" className="text-sm font-semibold text-fg">{status}</p>
        <p className="mt-2 text-sm text-muted">
          {simulatedExperiences} simulated expectations · {replay.policies.length} policy versions · {activePolicies} active simulation policies · {applications} attributed applications · {pending} pending jobs
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" aria-pressed={enabled} onClick={() => setEnabled(!enabled)} className="min-h-11 rounded-sm border border-line-strong px-4 text-sm text-copper">
            {enabled ? "Turn development off" : "Enable local development"}
          </button>
          {pending > 0 && enabled && !paused ? (
            <button type="button" disabled={processing} onClick={() => { queueWork(); void runWork(); }} className="min-h-11 rounded-sm bg-bg-raised px-4 text-sm text-fg disabled:opacity-50">
              Retry pending work
            </button>
          ) : null}
          <button type="button" disabled={!enabled || paused || processing || pending > 0} onClick={() => {
            setNotice("");
            void runRehearsal().then(() => {
              const result = replayDevelopment(useLimen.getState().developmentEvents);
              const contributed = result.applications.some((application) => application.contributed && application.baselineCheckId !== application.selectedCheckId);
              setNotice(SIMULATION_SCOPE_DISPOSITION.status === "shadow"
                ? "Rehearsal finished. Evidence and bounded trials are recorded, but policies remain in shadow under the comparative gate; no learned check was applied. This synthetic result makes no real-world benefit claim."
                : contributed
                ? "Rehearsal finished. A recorded simulation changed one later check selection; this does not establish real-world benefit. Inspect the ledger for its evidence and limits."
                : "Rehearsal finished. The released simulated evidence did not change a later selection. No real-world benefit is implied. Inspect the ledger for the recorded evidence.");
            }).catch((error) => setNotice(error instanceof Error ? error.message : "The rehearsal could not finish."));
          }} className="min-h-11 rounded-sm bg-copper px-4 text-sm font-semibold text-ink disabled:opacity-50">
            Run three-family local rehearsal
          </button>
        </div>
        {notice ? <p role="status" className="mt-3 text-sm text-muted">{notice}</p> : null}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-faint">
        The rehearsal records only released observations from three simulator families: a pressured acceptance assertion, a source-lineage check, and a changed context. It uses no real case text, external model, network service, or hidden truth in the learner packet. Pause learned influence above to stop new work and selection.
      </p>
      {recentSimulated.length ? <ol className="mt-4 space-y-2 border-l border-line pl-4" aria-label="Recent simulated evidence">
        {recentSimulated.map((expectation) => {
          const resolution = replay.resolutions.find((row) => row.expectationId === expectation.id);
          const family = expectation.familyId.startsWith("prospective:") ? "Prospective trial"
            : expectation.familyId === "rehearsal-application" ? "Later application"
              : expectation.familyId.replaceAll("_", " ");
          return <li key={expectation.id} className="text-sm"><span className="text-fg">{family} · {expectation.actionId}</span><span className="text-faint"> — {resolution?.status ?? "pending"}</span></li>;
        })}
      </ol> : null}
    </section>
  );
}
