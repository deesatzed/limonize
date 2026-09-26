import { useState, type FormEvent } from "react";
import { SAMPLES } from "@/lib/limen/samples";
import { useLimen } from "@/lib/limen/store";

export function SitView() {
  const sit = useLimen((s) => s.sit);
  const sittings = useLimen((s) => s.sittings);
  const situations = useLimen((s) => s.situations);
  const open = useLimen((s) => s.open);
  const draft = useLimen((s) => s.draft);
  const setDraft = useLimen((s) => s.setDraft);
  const dueCaseIds = useLimen((s) => s.dueCaseIds);
  const due = dueCaseIds(Date.now());
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (draft.prose.trim().length < 20) {
      setError("Give it a situation, not a title. A few sentences are enough.");
      return;
    }
    setError("");
    sit({ ...draft, title: draft.title.trim() || draft.prose.trim().slice(0, 72) });
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="font-serif text-4xl leading-tight text-fg md:text-5xl">Find what could change this decision.</h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
        Describe the situation, the goal, and the move you are considering. Limen suggests one useful next check,
        keeps the evidence behind it visible, and helps you revisit what happened. The roles here are local procedures;
        external model requests are disabled.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-6">
        <label className="block">
          <span className="mb-2 block text-sm text-muted">The situation</span>
          <textarea
            suppressHydrationWarning
            value={draft.prose}
            onChange={(e) => setDraft({ ...draft, prose: e.target.value })}
            rows={8}
            className="min-h-48 w-full resize-y rounded-lg bg-paper px-5 py-4 font-serif text-lg leading-relaxed text-ink placeholder:text-ink-soft"
            placeholder="What is being decided, what is being treated as known, and what you feel ready to do."
          />
        </label>

        <div className="flex flex-wrap gap-2">
          {SAMPLES.map((sample) => (
            <button
              key={sample.id}
              type="button"
              className="min-h-11 rounded-sm border border-line-strong px-3 text-sm text-muted"
              onClick={() => {
                setDraft(sample.draft);
                setError("");
              }}
            >
              Try: {sample.label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="The claim I am tempted to accept"
            value={draft.claim}
            onChange={(claim) => setDraft({ ...draft, claim })}
          />
          <Field
            label="The move I am inclined to make"
            value={draft.choice}
            onChange={(choice) => setDraft({ ...draft, choice })}
          />
        </div>
        <Field
          label="What better would mean"
          value={draft.objective}
          onChange={(objective) => setDraft({ ...draft, objective })}
        />
        <Field label="Case family or project (optional; helps review whether lessons transfer)" value={draft.familyId ?? ""} onChange={(familyId) => setDraft({ ...draft, familyId })} />

        <div className="grid gap-4 md:grid-cols-2">
          <Segment
            label="What depends on this"
            value={draft.stakes}
            onChange={(stakes) => setDraft({ ...draft, stakes })}
            options={[
              ["low", "Little"],
              ["consequential", "Real stakes"],
              ["irreversible", "Hard to undo"],
            ]}
          />
          <Segment
            label="Can the next step be taken back"
            value={draft.reversible}
            onChange={(reversible) => setDraft({ ...draft, reversible })}
            options={[
              ["yes", "Yes"],
              ["partial", "Partly"],
              ["no", "No"],
            ]}
          />
        </div>

        {error ? <p className="text-sm text-copper">{error}</p> : null}

        <button type="submit" className="min-h-11 rounded-sm bg-copper px-5 text-sm font-semibold text-ink">
          Sit with this
        </button>
      </form>

      {due.length ? <section className="mt-10 rounded-lg border border-copper p-4"><h2 className="font-serif text-xl">Ready to revisit</h2><p className="mt-2 text-sm text-muted">These local follow-ups are due. You can record an outcome or defer them.</p>{due.map((id) => { const situation = situations.find((s) => s.id === id); const sitting = sittings.find((s) => s.situationId === id); return sitting ? <button key={id} type="button" onClick={() => open(sitting.id)} className="mt-3 block min-h-11 text-left text-copper">{situation?.title ?? "Untitled case"}</button> : null; })}</section> : null}

      {sittings.length ? (
        <section className="mt-12 border-t border-line pt-6">
          <h2 className="text-sm text-muted">Earlier sittings</h2>
          <ul className="mt-3 divide-y divide-line">
            {sittings.slice(0, 8).map((sitting) => {
              const situation = situations.find((s) => s.id === sitting.situationId);
              return (
                <li key={sitting.id}>
                  <button
                    type="button"
                    onClick={() => open(sitting.id)}
                    className="flex min-h-11 w-full items-baseline justify-between gap-4 py-2 text-left"
                  >
                    <span className="text-fg">{situation?.title ?? "Untitled"}</span>
                    <span className="shrink-0 text-sm text-faint">{sitting.result.attention}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-muted">{label}</span>
      <input
        suppressHydrationWarning
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-11 w-full rounded-sm border border-line-strong bg-bg-raised px-3 text-base text-fg"
      />
    </label>
  );
}

function Segment<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: [T, string][];
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm text-muted">{label}</legend>
      <div className="grid grid-cols-3 gap-2">
        {options.map(([id, name]) => (
          <button
            key={id}
            type="button"
            aria-pressed={value === id}
            onClick={() => onChange(id)}
            className={`min-h-11 rounded-sm px-2 text-sm ${value === id ? "bg-copper text-ink" : "bg-bg-raised text-fg"}`}
          >
            {name}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
