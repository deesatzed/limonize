import { LIMEN_CHARTER } from "@/lib/limen/charter";
import { useLimen } from "@/lib/limen/store";

export function CharterPanel() {
  const paused = useLimen((state) => state.learningPaused);
  const setPaused = useLimen((state) => state.setLearningPaused);
  return (
    <section className="border-t border-line pt-7" aria-labelledby="charter-title">
      <p className="text-xs font-semibold tracking-widest text-copper uppercase">The agreement behind the advice</p>
      <h2 id="charter-title" className="mt-2 font-serif text-2xl">Continuity and integrity</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Limen can develop its methods within explicit boundaries. Evidence stays attributable,
        your priorities stay yours, and useful history never takes precedence over your right to pause or delete it.
      </p>
      <details className="mt-4">
        <summary className="min-h-11 cursor-pointer text-copper">Read the charter</summary>
        <p className="mt-2 text-xs text-faint">Version {LIMEN_CHARTER.version} · Adopted {LIMEN_CHARTER.adoptedOn}</p>
        <div className="mt-5 space-y-6">
          {LIMEN_CHARTER.sections.map((section) => (
            <section key={section.title}>
              <h3 className="font-serif text-xl text-fg">{section.title}</h3>
              {section.paragraphs.map((paragraph) => <p key={paragraph} className="mt-2 text-sm leading-relaxed text-muted">{paragraph}</p>)}
            </section>
          ))}
        </div>
      </details>
      <div className="mt-4 rounded-lg bg-bg-raised p-4 text-fg">
        <p role="status" className="text-sm font-semibold">{paused ? "Learned influence is paused" : "Learned influence is available"}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Pausing makes new reflections use the baseline rules without saved lessons, taught reflexes or adaptive preferences.
          History stays inspectable, and you can keep recording cases and outcomes. The pause persists in this browser;
          importing data cannot resume it.
        </p>
        <button type="button" aria-pressed={paused} onClick={() => setPaused(!paused)} className="mt-3 min-h-11 rounded-sm border border-line-strong px-4 text-sm text-copper">
          {paused ? "Resume learned influence" : "Pause learned influence"}
        </button>
      </div>
      <p className="mt-3 text-sm text-faint">
        Current capability: local reflection and conditional lesson retrieval. Adaptive preferences remain opt-in;
        the full autonomous policy development cycle is planned. External model requests are disabled.
      </p>
    </section>
  );
}
