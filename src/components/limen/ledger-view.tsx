import { useState } from "react";
import { construct, hasSecondCase, type Construction } from "@/lib/limen/memory";
import { useLimen } from "@/lib/limen/store";
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
  const retire = useLimen((s) => s.retireMemory);
  const promote = useLimen((s) => s.promoteMemory);
  const setView = useLimen((s) => s.setView);
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
        A lesson stays a candidate until a second, separate sitting shares its pattern. Promoting it is not the same as
        remembering an event. Generative checklists stay labeled as generated.
      </p>
      <ul className="mt-8 space-y-8">
        {live.map((memory) => (
          <li key={memory.id} className="border-t border-line pt-5">
            <MemoryCard
              memory={memory}
              ready={
                memory.status === "candidate" &&
                hasSecondCase(memory, sittings, sittings.find((s) => s.id === memory.sittingId)?.situationId)
              }
              onRetire={() => retire(memory.id)}
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

function MemoryCard({
  memory,
  ready,
  onRetire,
  onPromote,
  onBuild,
  construction,
}: {
  memory: MemoryObject;
  ready: boolean;
  onRetire: () => void;
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
            disabled={!ready}
            onClick={onPromote}
            className="min-h-11 rounded-sm bg-moss-deep px-3 text-sm text-fg disabled:opacity-50"
          >
            {ready ? "Promote after a second case" : "Needs a second case"}
          </button>
        ) : null}
        <button type="button" onClick={onRetire} className="min-h-11 px-3 text-sm text-faint">
          This no longer holds
        </button>
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
