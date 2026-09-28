import { useMemo, useState } from "react";
import { RULE_NAMES } from "@/lib/limen/engine";
import { QUESTION_PANEL } from "@/lib/limen/questions";
import { idleLines, useLimen } from "@/lib/limen/store";
import { DataControls } from "./data-controls";
import { CharterPanel } from "./charter-panel";
import { DevelopmentPanel } from "./development-panel";

const SIGNALS: [string, string][] = [
  ["", "No automatic link"],
  ["units", "Units and conventions"],
  ["shared-ancestor", "Copied agreement"],
  ["incentive", "An interested speaker"],
  ["unmeasured", "A missing measurement"],
  ["metric-drift", "A score standing in for a purpose"],
  ["closure", "Closing too early"],
  ["relevance", "A true fact that does no work"],
  ["reflexive", "An act that changes its own evidence"],
  ["handoff", "A finished tool and an unapproved result"],
  ["schema", "A failed check against current requirements"],
];

export function SelfView() {
  const sittings = useLimen((s) => s.sittings);
  const situations = useLimen((s) => s.situations);
  const memories = useLimen((s) => s.memories);
  const stats = useLimen((s) => s.ruleStats);
  const bias = useLimen((s) => s.ruleBias);
  const opBias = useLimen((s) => s.opBias);
  const adaptiveEnabled = useLimen((s) => s.adaptiveEnabled);
  const learningPaused = useLimen((s) => s.learningPaused);
  const setAdaptiveEnabled = useLimen((s) => s.setAdaptiveEnabled);
  const subBias = useLimen((s) => s.subBias);
  const blindspots = useLimen((s) => s.blindspots);
  const reflexes = useLimen((s) => s.reflexes);
  const teachBlindspot = useLimen((s) => s.teachBlindspot);
  const removeBlindspot = useLimen((s) => s.removeBlindspot);
  const teachReflex = useLimen((s) => s.teachReflex);
  const removeReflex = useLimen((s) => s.removeReflex);
  const assess = useLimen((s) => s.assessSelf);
  const release = useLimen((s) => s.release);
  const engrams = useLimen((s) => s.engrams);
  const feedbackEvents = useLimen((s) => s.feedbackEvents);
  const activeId = useLimen((s) => s.activeSittingId);
  const lines = useMemo(
    () => idleLines({ sittings, situations, memories, blindspots, ruleStats: stats, engrams, feedbackEvents }),
    [sittings, situations, memories, blindspots, stats, engrams, feedbackEvents],
  );
  const gapKinds = useMemo(() => {
    const sitting = sittings.find((x) => x.id === activeId);
    return sitting?.result.gaps.map((g) => g.kind) ?? [];
  }, [sittings, activeId]);
  const [miss, setMiss] = useState("");
  const [signal, setSignal] = useState("");
  const [when, setWhen] = useState("");
  const [ask, setAsk] = useState("");
  const [never, setNever] = useState("");
  const [armed, setArmed] = useState(false);

  const rows = Object.entries(stats).sort((a, b) => b[1].fire - a[1].fire);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-12">
      <header>
        <h1 className="font-serif text-4xl text-fg">What I know about my own limits</h1>
        <div className="mt-4 space-y-3 text-muted">
          {lines.map((line) => (
            <p key={line} className="leading-relaxed">
              {line}
            </p>
          ))}
        </div>
        <button
          type="button"
          onClick={() => assess()}
          className="mt-6 min-h-11 rounded-sm bg-copper px-4 text-sm font-semibold text-ink"
        >
          Sit with myself
        </button>
        <p className="mt-3 max-w-2xl text-sm text-faint">
          The self-sitting uses the same rules as any other case. A fluent story about those rules is not evidence
          that they are good. {engrams.length} fly tag{engrams.length === 1 ? "" : "s"} kept.
        </p>
      </header>
      <CharterPanel />
      <DevelopmentPanel />
      <DataControls />
      <section className="border-t border-line pt-6"><h2 className="font-serif text-2xl">Adaptive preferences</h2><p className="mt-2 text-sm text-muted">Off by default. Marks are retained for review, but do not steer recommendations unless you enable this experiment. Local synthetic evaluation does not establish better decisions.{learningPaused ? " Learned influence is paused; resume it above to use these preferences." : ""}</p><button type="button" disabled={learningPaused} aria-pressed={adaptiveEnabled} onClick={() => setAdaptiveEnabled(!adaptiveEnabled)} className="mt-3 min-h-11 rounded-sm bg-bg-raised px-4 text-fg disabled:opacity-50">{adaptiveEnabled ? "Turn adaptive preferences off" : "Turn adaptive preferences on"}</button></section>

      <section>
        <h2 className="font-serif text-2xl text-fg">Rules that have fired</h2>
        {rows.length ? (
          <ul className="mt-4 divide-y divide-line">
            {rows.slice(0, 12).map(([id, stat]) => (
              <li key={id} className="grid gap-1 py-3 md:grid-cols-[1fr_auto] md:items-baseline">
                <p className="text-fg">{RULE_NAMES[id] ?? id}</p>
                <p className="text-sm text-faint">
                  fired {stat.fire} · useful {stat.useful} · noise {stat.noise}
                  {bias[id] ? ` · weight ${bias[id] > 0 ? "+" : ""}${bias[id]}` : ""}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-muted">No rule has fired on your situations yet.</p>
        )}
      </section>

      <section>
        <h2 className="font-serif text-2xl text-fg">What the marks have shifted</h2>
        <p className="mt-2 text-sm text-muted">
          Operation marks are advisory and do not select the next operation. When adaptive preferences are enabled,
          applicable feedback can influence local rule and sub-role preferences. Pausing learned influence suppresses
          those preferences. None of these scores a path you did not take.
        </p>
        <WeightList
          title="Operations"
          rows={Object.entries(opBias ?? {}).filter(([, n]) => n !== 0)}
        />
        <WeightList title="Sub-roles" rows={Object.entries(subBias ?? {}).filter(([, n]) => n !== 0)} />
      </section>

      <section>
        <h2 className="font-serif text-2xl text-fg">Teach a blind spot</h2>
        <p className="mt-2 text-sm text-muted">
          If I miss a kind of error, name it. Link it to a signal and I will raise it the next time that signal appears.
          I may over-apply the lesson. That risk stays visible.
        </p>
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            teachBlindspot(miss, signal || undefined);
            setMiss("");
          }}
        >
          <input
            value={miss}
            onChange={(e) => setMiss(e.target.value)}
            placeholder="What I fail to see"
            aria-label="What I fail to see"
            className="min-h-11 w-full rounded-sm border border-line-strong bg-bg-raised px-3 text-base text-fg"
          />
          <label className="block text-sm text-muted">
            Link to a signal
            <select
              value={signal}
              onChange={(e) => setSignal(e.target.value)}
              className="mt-2 min-h-11 w-full rounded-sm border border-line-strong bg-bg-raised px-3 text-base text-fg"
            >
              {SIGNALS.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="min-h-11 rounded-sm bg-bg-raised px-4 text-sm text-fg">
            Keep this miss
          </button>
        </form>
        <ul className="mt-4 space-y-2">
          {blindspots.map((b) => (
            <li key={b.id} className="flex items-start justify-between gap-3 text-sm">
              <span className="text-fg">
                {b.text}
                {b.signal ? <span className="text-faint"> — {b.signal}</span> : null}
              </span>
              <button type="button" onClick={() => removeBlindspot(b.id)} className="min-h-11 shrink-0 text-faint">
                Drop
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-fg">Teach a reflex</h2>
        <p className="mt-2 text-sm text-muted">
          A reflex may ask. It may forbid. It does not authorize an action just because the situation was recognized.
        </p>
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            teachReflex(when, ask, never);
            setWhen("");
            setAsk("");
            setNever("");
          }}
        >
          <Field label="When the wording contains" value={when} onChange={setWhen} />
          <Field label="Ask" value={ask} onChange={setAsk} />
          <Field label="Do not" value={never} onChange={setNever} />
          <button type="submit" className="min-h-11 rounded-sm bg-bg-raised px-4 text-sm text-fg">
            Keep this reflex
          </button>
        </form>
        <ul className="mt-4 space-y-3">
          {reflexes.map((r) => (
            <li key={r.id} className="border-t border-line pt-3 text-sm">
              <p className="text-fg">When “{r.when}”, ask: {r.ask}</p>
              {r.never ? <p className="text-muted">Do not {r.never}.</p> : null}
              <button type="button" onClick={() => removeReflex(r.id)} className="mt-1 min-h-11 text-faint">
                Drop
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-fg">Question panel</h2>
        <p className="mt-2 text-sm text-muted">
          Questions tied to the gaps in the current sitting are marked. The others stay available and do not interrupt.
        </p>
        <div className="mt-4 space-y-6">
          {QUESTION_PANEL.map((group) => (
            <div key={group.group}>
              <h3 className="text-sm text-copper">{group.group}</h3>
              <ul className="mt-2 space-y-2">
                {group.items.map((item) => {
                  const live = item.kinds.some((k) => gapKinds.includes(k));
                  return (
                    <li key={item.q} className={live ? "text-fg" : "text-faint"}>
                      {live ? <span className="mr-2 text-copper">Live</span> : null}
                      {item.q}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-line pt-6">
        <h2 className="font-serif text-2xl text-fg">Release what is kept here</h2>
        <p className="mt-2 text-sm text-muted">
          This forgets sittings, tags, repairs, and taught misses stored in this browser. It does not touch anything
          else.
        </p>
        {armed ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => release()} className="min-h-11 rounded-sm bg-copper px-4 text-sm font-semibold text-ink">
              Release it
            </button>
            <button type="button" onClick={() => setArmed(false)} className="min-h-11 px-4 text-sm text-muted">
              Keep it
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setArmed(true)} className="mt-4 min-h-11 text-sm text-faint">
            I want to release local memory
          </button>
        )}
      </section>
    </div>
  );
}

function WeightList({ title, rows }: { title: string; rows: [string, number][] }) {
  return (
    <div className="mt-4">
      <h3 className="text-sm text-copper">{title}</h3>
      {rows.length ? (
        <ul className="mt-2 space-y-1">
          {rows
            .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
            .map(([id, n]) => (
              <li key={id} className="text-sm text-fg">
                {id.replaceAll(":", " · ").replaceAll("_", " ")}{" "}
                <span className="text-faint">
                  {n > 0 ? "+" : ""}
                  {n}
                </span>
              </li>
            ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-faint">Nothing here has moved yet.</p>
      )}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-sm text-muted">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 min-h-11 w-full rounded-sm border border-line-strong bg-bg-raised px-3 text-base text-fg"
      />
    </label>
  );
}
