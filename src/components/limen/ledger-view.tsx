import { useMemo, useState } from "react";
import { assessMemory, construct, type Construction } from "@/lib/limen/memory";
import { replayDevelopment } from "@/lib/limen/development";
import { useLimen } from "@/lib/limen/store";
import { SIMULATION_SCOPE_DISPOSITION } from "@/lib/limen/scope-disposition";
import type { MemoryObject } from "@/lib/limen/types";

const KIND: Record<MemoryObject["kind"], string> = {
  repair: "Repair",
  unfinished: "Unfinished",
  challenge: "Challenge",
  experiment: "Experiment",
};

export function LedgerView() {
  const memories = useLimen((s) => s.memories);
  const sittings = useLimen((s) => s.sittings);
  const situations = useLimen((s) => s.situations);
  const outcomes = useLimen((s) => s.outcomeEvents);
  const retire = useLimen((s) => s.retireMemory);
  const promote = useLimen((s) => s.promoteMemory);
  const deleteMemory = useLimen((s) => s.deleteMemory);
  const setView = useLimen((s) => s.setView);
  const developmentEvents = useLimen((s) => s.developmentEvents);
  const retirePolicy = useLimen((s) => s.retireDevelopmentPolicy);
  const deletePolicy = useLimen((s) => s.deleteDevelopmentPolicy);
  const development = useMemo(() => replayDevelopment(developmentEvents), [developmentEvents]);
  const [built, setBuilt] = useState<{ id: string; construction: Construction } | null>(null);

  const live = memories.filter((m) => m.status !== "retired");
  const retired = memories.filter((m) => m.status === "retired");

  if (!memories.length) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="font-serif text-4xl text-fg">The ledger is empty.</h1>
        <p className="mt-4 leading-relaxed text-muted">
          A memory here is not a paragraph I liked. It is a repair, an unfinished question, or a test, with the
          condition that would wake it. I write one only when you ask me to keep it.
        </p>
        <DevelopmentPolicyLedger replay={development} onRetire={retirePolicy} onDelete={(id) => {
          const policy = development.policies.find((row) => row.id === id);
          if (policy && window.confirm(`Delete policy version “${policy.id}” and its dependent records?`)) deletePolicy(id);
        }} />
        <button type="button" onClick={() => setView("sit")} className="mt-6 min-h-11 text-sm text-copper">
          Sit with something first
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="font-serif text-4xl text-fg">Ledger</h1>
      <p className="mt-3 max-w-2xl text-muted">
        A lesson stays a candidate until two distinct, labeled families have outcome evidence supporting the chosen action. Similarity alone is not validation. Generated checklists stay labeled as generated.
      </p>
      <DevelopmentPolicyLedger replay={development} onRetire={retirePolicy} onDelete={(id) => {
        const policy = development.policies.find((row) => row.id === id);
        if (policy && window.confirm(`Delete policy version “${policy.id}” and its dependent records?`)) deletePolicy(id);
      }} />
      <ul className="mt-8 space-y-8">
        {live.map((memory) => (
          <li key={memory.id} className="border-t border-line pt-5">
            <MemoryCard
              memory={memory}
              readiness={assessMemory(memory, situations, sittings, outcomes)}
              onRetire={() => retire(memory.id)}
              onDelete={() => { if (window.confirm(`Delete memory “${memory.title}” and its generated lesson?`)) deleteMemory(memory.id); }}
              onPromote={() => promote(memory.id)}
              onBuild={(mode) => setBuilt({ id: memory.id, construction: construct(memory, mode) })}
              construction={built?.id === memory.id ? built.construction : null}
            />
          </li>
        ))}
      </ul>
      {retired.length ? (
        <section className="mt-12">
          <h2 className="text-sm text-muted">Retired, not deleted</h2>
          <ul className="mt-3 space-y-2">
            {retired.map((memory) => (
              <li key={memory.id} className="text-sm text-faint">
                {KIND[memory.kind]} — {memory.title}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function DevelopmentPolicyLedger({ replay, onRetire, onDelete }: {
  replay: ReturnType<typeof replayDevelopment>;
  onRetire: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <section className="mt-8 border-t border-line pt-6" aria-labelledby="policy-ledger-title">
      <h2 id="policy-ledger-title" className="font-serif text-2xl text-fg">Development policies</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">Real policies stay advisory. The current comparative gate keeps simulation policies in {SIMULATION_SCOPE_DISPOSITION.status}; candidates and trials remain inspectable here. A future active scope requires a new protected evaluation.</p>
      {replay.policies.length ? (
        <ul className="mt-5 space-y-5">
          {replay.policies.map((policy) => {
            const reviews = replay.reviews.filter((review) => review.policyVersionId === policy.id);
            const trials = replay.trials.filter((trial) => trial.policyVersionId === policy.id);
            const applications = replay.applications.filter((application) => application.policyVersionId === policy.id);
            const transitions = replay.events.flatMap((event) => event.kind === "policy.transitioned" && event.payload.transition.policyVersionId === policy.id
              ? [`${event.payload.transition.toState} (${event.payload.transition.reasonCode.replaceAll("_", " ")})`]
              : []);
            const action = policy.action.kind === "prefer_check" ? `Prefer ${policy.action.actionId}` : `Require ${policy.action.criterionId}`;
            return (
              <li key={policy.id} className="rounded-lg border border-line bg-bg-raised p-4">
                <p className="text-xs font-semibold tracking-widest text-copper uppercase">{policy.track} · {policy.lifecycle}{policy.scope.kind === "real_advisory" ? " · advisory" : ` · ${policy.scope.worldVersion}`}</p>
                <h3 className="mt-2 font-serif text-xl text-fg">{action}</h3>
                <p className="mt-2 break-all text-xs text-faint">Version {policy.version} · {policy.id}</p>
                <p className="mt-2 text-sm text-muted">Support resolutions: {policy.supportResolutionIds.join(", ") || "none"}</p>
                <p className="mt-1 text-sm text-muted">Reviews: {reviews.length ? reviews.map((review) => `${review.reviewKind} ${review.verdict}`).join(" · ") : "none"} · prospective trials: {trials.map((trial) => trial.outcome).join(", ") || "none"} · applications: {applications.length}</p>
                <p className="mt-1 text-sm text-muted">Lifecycle history: {transitions.join(" · ") || "candidate"}</p>
                <p className="mt-1 text-sm text-faint">Reconsideration: {policy.reconsideration.map((condition) => condition.kind.replaceAll("_", " ")).join(" · ") || "none"}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {policy.lifecycle !== "retired" && !policy.supersededByVersionId ? <button type="button" onClick={() => onRetire(policy.id)} className="min-h-11 rounded-sm border border-line-strong px-3 text-sm text-copper">Retire this version</button> : null}
                  <button type="button" onClick={() => onDelete(policy.id)} className="min-h-11 px-3 text-sm text-faint">Delete this policy version</button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : <p className="mt-3 text-sm text-faint">No evidence-backed policy proposals yet.</p>}
    </section>
  );
}

function MemoryCard({
  memory,
  readiness,
  onRetire,
  onDelete,
  onPromote,
  onBuild,
  construction,
}: {
  memory: MemoryObject;
  readiness: ReturnType<typeof assessMemory>;
  onRetire: () => void;
  onDelete: () => void;
  onPromote: () => void;
  onBuild: (mode: "checklist" | "boundary" | "revival") => void;
  construction: Construction | null;
}) {
  const status =
    memory.status === "kept" ? "Kept" : memory.status === "candidate" ? "Candidate" : "Retired";
  return (
    <article>
      <p className="text-xs font-semibold tracking-widest text-copper uppercase">
        {KIND[memory.kind]} · {status}
      </p>
      <h2 className="mt-1 font-serif text-2xl text-fg">{memory.title}</h2>
      <p className="mt-3 leading-relaxed text-fg">{memory.body}</p>
      {memory.pattern.length ? (
        <ul className="mt-3 space-y-1 text-sm text-muted">
          {memory.pattern.map((p) => (
            <li key={p}>Pattern: {p}</li>
          ))}
        </ul>
      ) : null}
      <p className="mt-3 text-sm text-muted">Test: {memory.test}</p>
      <p className="mt-1 text-sm text-faint">{memory.caveat}</p>
      <p className="mt-2 text-sm text-faint">Validation: {memory.validationStatus ?? "legacy unvalidated"}. {readiness.reason}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => onBuild("checklist")} className="min-h-11 rounded-sm bg-bg-raised px-3 text-sm text-fg">
          Construct a checklist
        </button>
        <button type="button" onClick={() => onBuild("boundary")} className="min-h-11 rounded-sm bg-bg-raised px-3 text-sm text-fg">
          Construct a boundary
        </button>
        <button type="button" onClick={() => onBuild("revival")} className="min-h-11 rounded-sm bg-bg-raised px-3 text-sm text-fg">
          Show the revival
        </button>
        {memory.status === "candidate" ? (
          <button
            type="button"
            disabled={!readiness.ready}
            onClick={onPromote}
            className="min-h-11 rounded-sm bg-moss-deep px-3 text-sm text-fg disabled:opacity-50"
          >
            {readiness.ready ? "Promote with two outcomes" : "Needs independent outcome evidence"}
          </button>
        ) : null}
        <button type="button" onClick={onRetire} className="min-h-11 px-3 text-sm text-faint">
          This no longer holds
        </button>
        <button type="button" onClick={onDelete} className="min-h-11 px-3 text-sm text-faint">Delete this memory</button>
      </div>
      {construction ? (
        <div className="mt-4 rounded-lg bg-paper px-5 py-4 text-ink">
          <p className="text-xs font-semibold tracking-widest text-copper-deep uppercase">
            {construction.label} — generated, not remembered
          </p>
          <p className="mt-2 text-sm text-ink-soft">{construction.note}</p>
          <ul className="mt-3 space-y-2">
            {construction.lines.map((line) => (
              <li key={line} className="leading-relaxed">
                {line}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}
