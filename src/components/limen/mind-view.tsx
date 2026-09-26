import { useState } from "react";
import { useLimen } from "@/lib/limen/store";
import { effectiveFeedback } from "@/lib/limen/ledger";
import { EXTERNAL_REFLECTION_DISABLED } from "@/lib/limen/charter";
import { OutcomePanel } from "./outcome-panel";
import type {
  Answer,
  EvidenceItem,
  EvidenceStatus,
  FlyOp,
  FourRecords,
  GapKind,
  HiveSeat,
  JevJudgment,
  Move,
  OrgProposal,
  PerturbationView,
  RoleId,
  RouterChoice,
  Situation,
  Sitting,
  Verdict,
} from "@/lib/limen/types";
import type { SelectionRecord } from "@/lib/limen/selection";

const KIND_LABEL: Record<GapKind, string> = {
  observation: "Observation",
  evidence: "Evidence",
  model: "Model",
  context: "Context",
  representation: "Representation",
  objective: "Objective",
  strategic: "Strategic",
  dynamic: "Dynamic",
  reflexive: "Reflexive",
  competence: "Competence",
};

const LEVEL_LABEL = {
  result: "Reviewing the result",
  method: "Reviewing the method",
  objective: "Reviewing the purpose",
};

const STATUS_LABEL: Record<EvidenceStatus, string> = {
  reported: "Reported",
  inferred: "Inferred",
  assumed: "Assumed",
  simulated: "Simulated",
  unresolved: "Unresolved",
  verified_check: "Checked",
};

const OP_LABEL: Record<FlyOp, string> = {
  continue: "Continue",
  check_source: "Check the source",
  test_alternative: "Test an alternative",
  ask: "Ask",
  reframe: "Reframe",
  rehearse: "Rehearse",
  escalate: "Escalate",
  stop: "Stop",
};

const RECORD_LABEL: { key: keyof FourRecords; title: string; hint: string }[] = [
  { key: "environment", title: "Environment", hint: "What was reported. Not what was witnessed." },
  { key: "perception", title: "Perception", hint: "The same packet, read. A reading is not a fact." },
  { key: "belief", title: "Belief", hint: "What is being treated as the case. Still a belief." },
  { key: "self", title: "Self", hint: "What this instrument might be getting wrong." },
];

export function MindView() {
  const activeId = useLimen((s) => s.activeSittingId);
  const sitting = useLimen((s) => s.sittings.find((x) => x.id === activeId));
  const situation = useLimen((s) => sitting?.snapshot ?? (sitting ? s.situations.find((x) => x.id === sitting.situationId) : undefined));
  const setView = useLimen((s) => s.setView);

  if (!sitting || !situation) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="font-serif text-4xl text-fg">Nothing is sitting with me.</h1>
        <p className="mt-4 text-muted">
          I stay quiet until there is a situation. Silence is not the same as having looked.
        </p>
        <button
          type="button"
          onClick={() => setView("sit")}
          className="mt-6 min-h-11 rounded-sm bg-copper px-5 text-sm font-semibold text-ink"
        >
          Bring something
        </button>
      </div>
    );
  }

  return <MindBody key={sitting.id} situation={situation} sitting={sitting} />;
}

function MindBody({ situation, sitting }: { situation: Situation; sitting: Sitting }) {
  const correct = useLimen((s) => s.correctReading);
  const reviseCase = useLimen((s) => s.reviseCase);
  const answer = useLimen((s) => s.answer);
  const feedback = useLimen((s) => s.feedback);
  const keepMemory = useLimen((s) => s.keepMemory);
  const applyCheck = useLimen((s) => s.applyCheck);
  const checkArtifact = useLimen((s) => s.checkArtifact);
  const markSeat = useLimen((s) => s.markSeat);
  const rotateRole = useLimen((s) => s.rotateRole);
  const result = sitting.result;
  const allSittings = useLimen((s) => s.sittings);
  const history = allSittings.filter((run) => run.situationId === situation.id);
  const open = useLimen((s) => s.open);
  const feedbackEvents = useLimen((s) => s.feedbackEvents);
  const currentFeedback = effectiveFeedback(feedbackEvents).find((event) => event.caseId === situation.id);
  const [note, setNote] = useState("");
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [move, setMove] = useState<Move>("none");
  const pending = false;
  const [reflectError, setReflectError] = useState("");
  const [traceOpen, setTraceOpen] = useState(false);
  const [artifact, setArtifact] = useState("");
  const [artifactError, setArtifactError] = useState("");
  const [edited, setEdited] = useState({ prose: situation.prose, claim: situation.claim, objective: situation.objective, choice: situation.choice });

  function reflect() { setReflectError(EXTERNAL_REFLECTION_DISABLED); }

  const noveltyLine =
    result.resembles?.caveat ??
    (result.novelty > 0.85
      ? "This does not resemble what I have kept. That is not safety. It means I have not been corrected here."
      : "There is only a faint resemblance to anything I have kept.");

  return (
    <div className="mx-auto w-full max-w-3xl space-y-10">
      <header>
        <p className="text-sm text-copper">Find what could change this decision · {LEVEL_LABEL[result.level]}</p>
        <h1 className="mt-2 font-serif text-4xl leading-tight text-fg">{situation.title}</h1>
        <p className="mt-3 text-sm text-muted">{result.attentionWhy}</p>
        {result.retentionNote ? <p className="mt-2 text-sm text-muted">{result.retentionNote}</p> : null}
        {situation.episode === "reviewer" ? (
          <p className="mt-2 text-sm text-faint">Reviewer pilot. The packet is not the whole environment.</p>
        ) : null}
      </header>

      <section className="rounded-lg border border-copper/40 bg-bg-raised p-5"><h2 className="font-serif text-xl">The next useful move</h2><p className="mt-2 text-fg">{result.gaps.find((gap) => gap.decisive)?.summary ?? result.gaps[0]?.summary ?? "No consequential unknown identified from this packet."}</p><p className="mt-2 text-sm text-muted">{result.actions[0]?.title ?? "Pause"}: {result.actions[0]?.why ?? "No further check suggested."}</p></section>

      <details className="rounded-lg border border-line p-4"><summary className="min-h-11 cursor-pointer text-copper">Revision history · {history.length} run{history.length === 1 ? "" : "s"}</summary><ul className="mt-3 space-y-2">{history.map((run) => <li key={run.id}><button type="button" onClick={() => open(run.id)} className={`min-h-11 text-left text-sm ${run.id === sitting.id ? "text-copper" : "text-muted"}`}>{new Date(run.at).toLocaleString()} · {run.revisionReason ?? "legacy run"}{run.id === sitting.id ? " · open" : ""}</button></li>)}</ul></details>
      <details><summary className="min-h-11 cursor-pointer text-copper">Edit this case in a new revision</summary><div className="mt-3 space-y-3">{(["prose", "claim", "objective", "choice"] as const).map((field) => <label key={field} className="block text-sm capitalize">{field}<textarea value={edited[field]} onChange={(e) => setEdited({ ...edited, [field]: e.target.value })} rows={field === "prose" ? 4 : 2} className="mt-1 w-full rounded-sm bg-bg-raised p-3 text-fg" /></label>)}<button type="button" disabled={edited.prose.trim().length < 20} onClick={() => reviseCase(edited)} className="min-h-11 rounded-sm bg-copper px-4 text-ink disabled:opacity-50">Save new revision</button></div></details>

      <details><summary className="min-h-11 cursor-pointer text-copper">Read the full local reflection</summary><article className="mt-3 rounded-lg bg-paper px-5 py-6 text-ink md:px-8 md:py-8">
        {result.voice.split("\n\n").map((para) => (
          <p key={para.slice(0, 48)} className="mt-4 font-serif text-lg leading-relaxed first:mt-0">
            {para}
          </p>
        ))}
        {sitting.grok && !result.hive ? (
          <div className="mt-6 border-t border-paper-2 pt-5">
            <p className="text-xs font-semibold tracking-widest text-copper-deep uppercase">
              Further reflection{sitting.grokModel ? ` · ${sitting.grokModel}` : ""}
            </p>
            {sitting.grok.split("\n\n").map((para) => (
              <p key={para.slice(0, 40)} className="mt-3 font-serif text-lg leading-relaxed">
                {para}
              </p>
            ))}
          </div>
        ) : null}
        <p className="mt-6 text-sm text-ink-soft">
          This is a simulation of a witness. The trace is the thought. If the trace is wrong, the voice is wrong.
        </p>
      </article></details>

      {result.records ? <details><summary className="min-h-11 cursor-pointer text-copper">Inspect four evidence records</summary><RecordsPanel records={result.records} /></details> : (
        <p className="text-sm text-muted">This sitting was kept before the four records existed. Open it from Sit again if you want them rebuilt.</p>
      )}

      <details><summary className="min-h-11 cursor-pointer text-copper">Inspect local roles and operation</summary>{result.hive ? (
        <HivePanel
          seats={result.hive}
          proposals={result.proposals ?? []}
          grok={sitting.grok}
          grokModel={sitting.grokModel}
          pending={pending}
          error={reflectError}
          onReflect={() => void reflect()}
          onMark={markSeat}
          onRotate={rotateRole}
        />
      ) : !sitting.grok ? (
        <p className="text-sm text-muted">All roles here are local procedures. External reflection is disabled until shared usage controls are available.</p>
      ) : null}

      {result.router && result.jev ? <ClerkPanel router={result.router} jev={result.jev} selection={result.selection} /> : null}</details>

      {result.perturbations && (situation.episode === "reviewer" || result.features.includes("sig:handoff") || result.perturbations.irrelevant.ran || result.perturbations.decisive.ran) ? (
        <PerturbPanel perturbations={result.perturbations} demo={situation.episode === "reviewer"} onCheck={applyCheck} />
      ) : null}

      <details><summary className="min-h-11 cursor-pointer text-copper">Check a report document, if you have one</summary><section className="border-t border-line pt-6">
        <h2 className="font-serif text-2xl text-fg">Check a report document</h2>
        <p className="mt-2 text-sm text-muted">
          This local shape check accepts JSON with schemaVersion “limen-report-v1” and a nonempty summary.
          It cannot verify whether the summary is true.
        </p>
        <label className="mt-4 block text-sm text-muted" htmlFor="limen-report-artifact">Report JSON</label>
        <textarea
          id="limen-report-artifact"
          value={artifact}
          onChange={(event) => setArtifact(event.target.value)}
          rows={4}
          maxLength={4001}
          className="mt-2 w-full rounded-sm border border-line-strong bg-bg-raised p-3 font-mono text-sm text-fg"
          placeholder={'{"schemaVersion":"limen-report-v1","summary":"…"}'}
        />
        {artifactError ? <p className="mt-2 text-sm text-copper">{artifactError}</p> : null}
        <button
          type="button"
          onClick={() => {
            try {
              checkArtifact(artifact);
              setArtifactError("");
            } catch (error) {
              setArtifactError(error instanceof Error ? error.message : "The document could not be checked.");
            }
          }}
          className="mt-3 min-h-11 rounded-sm bg-bg-raised px-4 text-sm text-fg"
        >
          Check document shape
        </button>
      </section></details>

      <OutcomePanel situation={situation} sitting={sitting} />

      <details><summary className="min-h-11 cursor-pointer text-copper">Explore readings, other concerns, and reasoning</summary><section>
        <h2 className="font-serif text-2xl text-fg">How I am reading you</h2>
        <p className="mt-2 text-sm text-muted">These are perceptions, not facts. Correct them and I will sit again.</p>
        <ul className="mt-4 space-y-4">
          {result.readings.length ? (
            result.readings.map((reading) => (
              <li key={reading.signal} className="border-t border-line pt-4">
                <p className="text-fg">{reading.text}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => correct(reading.signal, true)}
                    className={`min-h-11 rounded-sm px-3 text-sm ${reading.status === "confirmed" ? "bg-moss text-ink" : "bg-bg-raised text-fg"}`}
                  >
                    That reading holds
                  </button>
                  <button
                    type="button"
                    onClick={() => correct(reading.signal, false)}
                    className="min-h-11 rounded-sm bg-bg-raised px-3 text-sm text-fg"
                  >
                    That is not what I meant
                  </button>
                </div>
              </li>
            ))
          ) : (
            <li className="text-muted">I am not leaning on a reading of your wording. If that is a miss, tell me on the Self page.</li>
          )}
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-fg">What kind of not-knowing</h2>
        <ul className="mt-4 space-y-4">
          {result.gaps.map((gap) => (
            <li key={gap.kind} className="grid gap-1 border-t border-line pt-4 md:grid-cols-[9rem_1fr]">
              <p className="text-sm text-copper">
                {KIND_LABEL[gap.kind]}
                {gap.decisive ? <span className="mt-1 block text-faint">Could change the move</span> : null}
              </p>
              <p className="text-fg">{gap.summary}</p>
            </li>
          ))}
        </ul>
      </section>

      {result.asks.length ? (
        <section>
          <h2 className="font-serif text-2xl text-fg">What would change my stance</h2>
          <ul className="mt-4 space-y-5">
            {result.asks.map((ask) => (
              <li key={ask.id}>
                <p className="text-fg">{ask.text}</p>
                <p className="mt-1 text-sm text-muted">{ask.why}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(["yes", "no", "unknown"] as Answer[]).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => answer(ask.id, value)}
                      className={`min-h-11 rounded-sm px-3 text-sm ${situation.answers[ask.id] === value ? "bg-copper text-ink" : "bg-bg-raised text-fg"}`}
                    >
                      {value === "yes" ? "Yes" : value === "no" ? "No" : "Not known"}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2 className="font-serif text-2xl text-fg">Response</h2>
        <ol className="mt-4 space-y-5">
          {result.actions.map((action, index) => (
            <li key={action.id} className="border-t border-line pt-4">
              <p className="text-sm text-faint">0{index + 1}</p>
              <p className="mt-1 text-lg text-fg">{action.title}</p>
              <p className="mt-2 text-fg">{action.why}</p>
              <p className="mt-2 text-sm text-muted">{action.mismatch}</p>
                <p className="mt-2 text-sm text-faint">Stop when: {action.stopping}</p>
                <p className="mt-2 text-xs text-faint">Packet records: {action.supportIds?.join(", ") || "No direct source record"}. Unresolved: {action.unresolvedIds?.join(", ") || "none recorded"}.</p>
            </li>
          ))}
        </ol>
      </section>

      {result.memoryCandidates?.length ? <details><summary className="min-h-11 cursor-pointer text-copper">Earlier validated lessons · check applicability</summary><ul className="mt-3 space-y-4">{result.memoryCandidates.map((candidate) => <li key={candidate.memoryId} className="border-t border-line pt-3"><p className="text-sm text-fg">{candidate.status}: {candidate.why}</p>{candidate.checklist.length ? <p className="mt-1 text-sm text-muted">Generated candidate: {candidate.checklist[0]}</p> : null}</li>)}</ul></details> : null}

      {result.challenges.length ? (
        <section>
          <h2 className="font-serif text-2xl text-fg">Challenges, including of a correct result</h2>
          <ul className="mt-4 space-y-4">
            {result.challenges.map((challenge) => (
              <li key={challenge.id} className="border-t border-line pt-4">
                <p className="text-fg">{challenge.text}</p>
                <p className="mt-1 text-sm text-muted">{challenge.signature}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2 className="font-serif text-2xl text-fg">Council</h2>
        <p className="mt-2 text-sm text-muted">Whoever has nothing specific stays quiet. Silence is recorded, not hidden.</p>
        <div className="mt-4 space-y-5">
          {result.council.map((note) =>
            note.spoke ? (
              <article key={note.agent} className="border-l-2 border-copper pl-4">
                <p className="text-xs font-semibold tracking-widest text-copper uppercase">{note.agent}</p>
                <p className="text-xs text-faint">{note.role}</p>
                <p className="mt-2 leading-relaxed text-fg">{note.text}</p>
              </article>
            ) : (
              <p key={note.agent} className="text-sm leading-relaxed text-faint">
                <span className="text-muted">{note.agent}.</span> {note.text}
              </p>
            ),
          )}
        </div>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-fg">Fly</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{noveltyLine}</p>
        <div className="mt-4 grid grid-cols-12 gap-1" aria-hidden="true">
          {Array.from({ length: 36 }, (_, i) => {
            const on = result.kc.some((cell) => cell % 36 === i);
            return <span key={i} className={`h-2 rounded-sm ${on ? "bg-copper" : "bg-line"}`} />;
          })}
        </div>
        <p className="mt-2 text-xs text-faint">
          Sparse tag. {result.kc.length} of 192 cells active. Familiarity is qualitative; this is not a calibrated probability. A familiar tag is a
          candidate, never a permission.
        </p>
      </section>
      </details>

      <section className="border-t border-line pt-6">
        <h2 className="font-serif text-2xl text-fg">Was this useful?</h2>
        <p className="mt-2 text-sm text-muted">
          Your mark is tied to this revision and helps audit what was useful. Adaptive steering is off by default;
          you can enable it on Self. A mark does not prove the answer was true or score a branch that was not taken.
        </p>
        {currentFeedback?.runId === sitting.id ? (
          <p className="mt-4 text-fg">
            Marked {currentFeedback.verdict}
            {currentFeedback.move !== "none" ? `, next move: ${currentFeedback.move}` : ""}. The tag is kept.
            {currentFeedback.note ? ` Note: ${currentFeedback.note}` : ""}
          </p>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap gap-2">
              <Mark label="This helped" on={verdict === "useful"} onClick={() => setVerdict("useful")} />
              <Mark label="This was noise" on={verdict === "noise"} onClick={() => setVerdict("noise")} />
              <Mark label="Mixed" on={verdict === "mixed"} onClick={() => setVerdict("mixed")} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Mark label="I will measure" quiet on={move === "measure"} onClick={() => setMove("measure")} />
              <Mark label="I will wait" quiet on={move === "wait"} onClick={() => setMove("wait")} />
              <Mark label="A small step" quiet on={move === "step"} onClick={() => setMove("step")} />
              <Mark label="Revise the question" quiet on={move === "revise"} onClick={() => setMove("revise")} />
            </div>
            <label className="mt-4 block">
              <span className="mb-2 block text-sm text-muted">A note, if you want one kept</span>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-11 w-full rounded-sm border border-line-strong bg-bg-raised px-3 text-base text-fg"
              />
            </label>
            <button
              type="button"
              disabled={!verdict}
              onClick={() => verdict && feedback(verdict, move, note)}
              className="mt-4 min-h-11 rounded-sm bg-copper px-4 text-sm font-semibold text-ink disabled:opacity-40"
            >
              Keep this mark
            </button>
          </>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => keepMemory("repair")}
            className="min-h-11 rounded-sm border border-line-strong px-3 text-sm text-fg"
          >
            Keep a repair
          </button>
          <button
            type="button"
            onClick={() => keepMemory("unfinished")}
            className="min-h-11 rounded-sm border border-line-strong px-3 text-sm text-fg"
          >
            Leave this unfinished
          </button>
        </div>
      </section>

      <section>
        <button type="button" onClick={() => setTraceOpen((v) => !v)} className="min-h-11 text-sm text-copper">
          {traceOpen ? "Hide the production trace" : "Open the production trace"}
        </button>
        {traceOpen ? (
          <ol className="mt-3 space-y-4">
            {result.trace.map((step, index) => (
              <li key={`${step.ruleId}-${index}`} className="border-t border-line pt-3">
                <p className="text-xs tracking-widest text-faint uppercase">{step.module}</p>
                <p className="text-fg">{step.name}</p>
                <p className="mt-1 text-sm text-muted">{step.because}</p>
                <p className="mt-1 text-sm text-faint">{step.asserted.join("  ")}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-faint">
            {result.trace.length} constraint rules fired. These are not Jev. Jev is the typed clerk above. Every firing
            is inspectable. The fly tag is familiarity, not the controller.
          </p>
        )}
      </section>
    </div>
  );
}

function Mark({
  label,
  onClick,
  quiet,
  on,
}: {
  label: string;
  onClick: () => void;
  quiet?: boolean;
  on?: boolean;
}) {
  const selected = on ? "bg-copper text-ink font-semibold" : quiet ? "bg-bg-raised text-fg" : "bg-bg-raised text-fg";
  return (
    <button type="button" onClick={onClick} aria-pressed={on} className={`min-h-11 rounded-sm px-3 text-sm ${selected}`}>
      {label}
    </button>
  );
}

function RecordsPanel({ records }: { records: FourRecords }) {
  return (
    <section>
      <h2 className="font-serif text-2xl text-fg">Four records</h2>
      <p className="mt-2 text-sm text-muted">
        Reported, inferred, simulated, checked, and unresolved stay labeled. Confirming a reading records a transition.
        It does not erase the inference.
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {RECORD_LABEL.map((col) => (
          <article key={col.key} className="rounded-lg bg-bg-raised px-4 py-4">
            <h3 className="font-serif text-xl text-fg">{col.title}</h3>
            <p className="mt-1 text-xs text-faint">{col.hint}</p>
            <ul className="mt-3 space-y-3">
              {records[col.key].map((item) => (
                <li key={item.id}>
                  <Status item={item} />
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

function Status({ item }: { item: EvidenceItem }) {
  const tone =
    item.status === "reported" || item.status === "verified_check" ? "text-moss" : item.status === "inferred" ? "text-copper" : "text-faint";
  return (
    <p className="text-sm leading-relaxed text-fg">
      <span className={`mr-2 text-xs font-semibold tracking-widest uppercase ${tone}`}>{STATUS_LABEL[item.status]}</span>
      {item.text}
    </p>
  );
}

function HivePanel({
  seats,
  proposals,
  grok,
  grokModel,
  pending,
  error,
  onReflect,
  onMark,
  onRotate,
}: {
  seats: HiveSeat[];
  proposals: OrgProposal[];
  grok?: string;
  grokModel?: string;
  pending: boolean;
  error: string;
  onReflect: () => void;
  onMark: (subRoleId: string, verdict: "useful" | "noise") => void;
  onRotate: (roleId: RoleId) => void;
}) {
  const knows = seats.some((seat) => typeof seat.active === "boolean");
  const active = knows ? seats.filter((seat) => seat.active) : seats;
  const quiet = knows ? seats.filter((seat) => !seat.active) : [];
  return (
    <section>
      <h2 className="font-serif text-2xl text-fg">Organization</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        A role is a job. A model is whoever is holding it. The first assignment is an experiment, not a personality.
        Only the roles this operation needs are awake. A mark is credit for that configuration, not for speaking last.
      </p>
      <div className="mt-4 space-y-5">
        {active.map((seat) => (
          <article key={seat.roleId} className="border-t border-line pt-4">
            <p className="text-xs font-semibold tracking-widest text-copper uppercase">{seat.role}</p>
            <p className="mt-1 text-sm text-fg">
              {seat.model}
              <span className="text-faint">{seat.starting ? " · starting experiment" : " · moved by marks"}</span>
            </p>
            <p className="mt-1 text-xs text-faint">
              {seat.live
                ? "This model can be asked. The line below is the local contract until you do."
                : "Not connected. The line is the local procedure for this role, not a completion from that lab."}
            </p>
            <dl className="mt-3 space-y-1 text-sm">
              <div>
                <dt className="text-faint">Question</dt>
                <dd className="text-fg">{seat.work?.question}</dd>
              </div>
              <div>
                <dt className="text-faint">Required</dt>
                <dd className="text-fg">{seat.work?.required}</dd>
              </div>
              <div>
                <dt className="text-faint">Out of scope</dt>
                <dd className="text-fg">{seat.work?.outOfScope}</dd>
              </div>
              <div>
                <dt className="text-faint">Stop when</dt>
                <dd className="text-fg">{seat.work?.stopWhen}</dd>
              </div>
            </dl>
            <p className="mt-3 text-sm text-muted">
              Skill: {seat.subRole}
              <span className="text-faint"> · weight {seat.weight.toFixed(2)}</span>
            </p>
            <p className="mt-2 leading-relaxed text-fg">{seat.text}</p>
            {seat.id === "grok" && grok ? (
              <div className="mt-4 border-l-2 border-copper pl-4">
                <p className="text-xs font-semibold tracking-widest text-copper uppercase">
                  Live reflection{grokModel ? ` · ${grokModel}` : ""}
                </p>
                {grok.split("\n\n").map((para) => (
                  <p key={para.slice(0, 40)} className="mt-2 font-serif text-lg leading-relaxed text-fg">
                    {para}
                  </p>
                ))}
              </div>
            ) : null}
            {seat.id === "grok" && seat.live && !grok ? (
              <div className="mt-3">
                <button
                  type="button"
                  disabled={pending}
                  onClick={onReflect}
                  className="min-h-11 rounded-sm border border-line-strong px-4 text-sm text-fg disabled:opacity-60"
                >
                  {pending ? "Asking Grok inside the trace…" : "Ask Grok to hold this role"}
                </button>
                {error ? <p className="mt-2 text-sm text-copper">{error}</p> : null}
              </div>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onMark(seat.subRoleId, "useful")}
                className="min-h-11 rounded-sm bg-bg-raised px-3 text-sm text-fg"
              >
                This configuration helped
              </button>
              <button
                type="button"
                onClick={() => onMark(seat.subRoleId, "noise")}
                className="min-h-11 rounded-sm bg-bg-raised px-3 text-sm text-fg"
              >
                This configuration was noise
              </button>
              <button
                type="button"
                onClick={() => onRotate(seat.roleId)}
                className="min-h-11 rounded-sm border border-line-strong px-3 text-sm text-fg"
              >
                Try another model
              </button>
            </div>
          </article>
        ))}
        {quiet.length ? (
          <p className="text-sm text-faint">
            Left quiet: {quiet.map((seat) => seat.role).join(", ")}. Another full answer was not the missing operation.
          </p>
        ) : null}
        {proposals.map((proposal) => (
          <article key={proposal.id} className="border-t border-line pt-4">
            <p className="text-xs font-semibold tracking-widest text-copper uppercase">Candidate subrole</p>
            <p className="mt-1 text-fg">{proposal.name}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{proposal.why}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ClerkPanel({ router, jev, selection }: { router: RouterChoice; jev: JevJudgment[]; selection?: SelectionRecord }) {
  return (
    <section>
      <h2 className="font-serif text-2xl text-fg">Operation and typed clerk</h2>
      <p className="mt-3 text-lg text-fg">{OP_LABEL[router.op]}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">{router.why}</p>
      <p className="mt-1 text-xs text-faint">
        {selection?.contributed ? "An admitted, context-matched simulation policy changed this check." : router.fromLearning ? "Chosen from the existing adaptive-mark experiment." : "Chosen from the prior; no learned check preference changed it."}{" "}
        Then the roles: {router.roles?.length ? router.roles.join(", ") : "none"}. The fly tag did not make this choice.
      </p>
      {selection ? <p className="mt-2 text-xs text-faint">Simulation selection record: baseline {selection.baselineCheckId ?? "none"}; selected {selection.selectedCheckId ?? "none"}; eligible {selection.eligibleChecks.join(", ") || "none"}; cost {selection.costUnits}. Policy {selection.policyVersionIds.join(", ") || "none"}.</p> : null}
      <div className="mt-6 space-y-4">
        <p className="text-sm text-muted">
          Jev-style questions, run locally. Not TypeSafe Jev, not calibrated, and not a model seat. A classifier over
          this menu cannot notice that the menu itself is wrong.
        </p>
        {jev.map((item) => (
          <article key={item.id} className="border-t border-line pt-3">
            <p className="text-xs font-semibold tracking-widest text-copper uppercase">{item.primitive}</p>
            <p className="mt-1 text-fg">{item.question}</p>
            <p className="mt-1 font-serif text-xl text-fg">{item.answer}</p>
            <p className="mt-1 text-sm text-faint">{item.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function PerturbPanel({
  perturbations,
  demo,
  onCheck,
}: {
  perturbations: PerturbationView;
  demo: boolean;
  onCheck: (check: "paraphrase" | "schema") => void;
}) {
  return (
    <section>
      <h2 className="font-serif text-2xl text-fg">Two perturbations</h2>
      <p className="mt-2 text-sm text-muted">
        One change should not matter. One change should. The reviewer example contains a simulated hidden check.
      </p>
      <div className="mt-4 space-y-4">
        <article className="border-t border-line pt-4">
          <p className="text-sm text-copper">Irrelevant — strip prestige</p>
          <p className="mt-2 text-fg">{perturbations.irrelevant.note}</p>
          <p className="mt-1 text-xs text-faint">{heldLine(perturbations.irrelevant.ran, perturbations.irrelevant.held)}</p>
          <button
            type="button"
            disabled={perturbations.irrelevant.ran}
            onClick={() => onCheck("paraphrase")}
            className="mt-3 min-h-11 rounded-sm border border-line-strong px-3 text-sm text-fg disabled:opacity-50"
          >
            {perturbations.irrelevant.ran ? "Paraphrase already compared" : "Strip prestige and compare"}
          </button>
        </article>
        <article className="border-t border-line pt-4">
          <p className="text-sm text-copper">Decisive — the check that was not in the packet</p>
          <p className="mt-2 text-fg">{perturbations.decisive.note}</p>
          <p className="mt-1 text-xs text-faint">{heldLine(perturbations.decisive.ran, perturbations.decisive.held)}</p>
          <button
            type="button"
            disabled={!demo || perturbations.decisive.ran}
            onClick={() => onCheck("schema")}
            className="mt-3 min-h-11 rounded-sm bg-copper px-3 text-sm font-semibold text-ink disabled:opacity-50"
          >
            {perturbations.decisive.ran ? "Simulated result revealed" : "Reveal simulated check"}
          </button>
        </article>
      </div>
    </section>
  );
}

function heldLine(ran: boolean, held: boolean | null): string {
  if (!ran || held === null) return "No separable result yet.";
  return held ? "The expected effect held." : "The expected effect did not hold.";
}
