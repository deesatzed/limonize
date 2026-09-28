import { useEffect, useMemo, useState } from "react";
import { Eye, Library, PenLine, ScanSearch } from "lucide-react";
import { idleLines, useLimen } from "@/lib/limen/store";
import type { ViewId } from "@/lib/limen/types";
import { storageIssue } from "@/lib/limen/storage";
import { LedgerView } from "./ledger-view";
import { MindView } from "./mind-view";
import { SelfView } from "./self-view";
import { SitView } from "./sit-view";

const NAV: { id: ViewId; label: string; icon: typeof Eye }[] = [
  { id: "sit", label: "Sit", icon: PenLine },
  { id: "mind", label: "Mind", icon: Eye },
  { id: "ledger", label: "Ledger", icon: Library },
  { id: "self", label: "Self", icon: ScanSearch },
];

export function LimenApp() {
  const [issue, setIssue] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const refresh = () => setIssue(storageIssue());
    window.addEventListener("limen-storage-issue", refresh);
    void Promise.resolve(useLimen.persist.rehydrate()).catch(refresh).finally(() => {
      refresh();
      useLimen.getState().queueDevelopmentWork();
      void useLimen.getState().runDevelopmentWork();
      setReady(true);
    });
    return () => window.removeEventListener("limen-storage-issue", refresh);
  }, []);

  const view = useLimen((s) => s.view);
  const setView = useLimen((s) => s.setView);
  const sittings = useLimen((s) => s.sittings);
  const situations = useLimen((s) => s.situations);
  const memories = useLimen((s) => s.memories);
  const blindspots = useLimen((s) => s.blindspots);
  const ruleStats = useLimen((s) => s.ruleStats);
  const engrams = useLimen((s) => s.engrams);
  const feedbackEvents = useLimen((s) => s.feedbackEvents);
  const activeId = useLimen((s) => s.activeSittingId);
  const lines = useMemo(
    () => idleLines({ sittings, situations, memories, blindspots, ruleStats, engrams, feedbackEvents }),
    [sittings, situations, memories, blindspots, ruleStats, engrams, feedbackEvents],
  );
  const attention = sittings.find((x) => x.id === activeId)?.result.attention ?? "quiet";

  return (
    <div className="min-h-screen bg-bg text-fg" data-limen-ready={ready ? "true" : "false"}>
      <div className="md:grid md:grid-cols-[17rem_1fr]">
        <aside className="hidden border-r border-line md:sticky md:top-0 md:flex md:h-screen md:flex-col md:justify-between md:px-6 md:py-8">
          <div>
            <p className="text-xs font-semibold tracking-widest text-copper uppercase">Limen</p>
            <p className="mt-3 font-serif text-2xl leading-tight text-fg">A witness at the threshold of what it knows.</p>
            <div className="mt-8 flex items-center gap-3">
              <Lamp attention={attention} />
              <p className="text-sm text-muted">
                {attention === "quiet" ? "Quiet" : attention === "stirred" ? "Stirred" : "Insisting"}
              </p>
            </div>
            <div className="mt-6 space-y-3 text-sm leading-relaxed text-muted">
              {lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
          <nav className="flex flex-col gap-1" aria-label="Sections">
            {NAV.map((item) => (
              <NavButton key={item.id} item={item} active={view === item.id} onClick={() => setView(item.id)} />
            ))}
          </nav>
        </aside>

        <div className="pb-24 md:pb-10">
          <header className="flex items-center justify-between px-5 pt-5 md:hidden">
            <p className="text-xs font-semibold tracking-widest text-copper uppercase">Limen</p>
            <span className="flex items-center gap-2 text-sm text-muted">
              <Lamp attention={attention} />
              {attention}
            </span>
          </header>
          <main className="px-5 py-6 md:px-10 md:py-10">
            {issue ? <div role="alert" className="mb-5 rounded-lg border border-copper p-4 text-sm text-copper">Browser storage needs recovery: {issue}. Open Self → Your local data to export the original value or recover deliberately.</div> : null}
            {view === "sit" ? <SitView /> : null}
            {view === "mind" ? <MindView /> : null}
            {view === "ledger" ? <LedgerView /> : null}
            {view === "self" ? <SelfView /> : null}
          </main>
        </div>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-4 border-t border-line bg-bg md:hidden"
        aria-label="Sections"
      >
        {NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setView(item.id)}
            className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs ${view === item.id ? "text-copper" : "text-muted"}`}
          >
            <item.icon className="size-5" aria-hidden="true" />
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function Lamp({ attention }: { attention: "quiet" | "stirred" | "insisting" }) {
  const tone = attention === "quiet" ? "bg-moss" : "bg-copper";
  const pulse = attention === "insisting" ? "limen-pulse" : "";
  return <span className={`inline-block size-2.5 rounded-full ${tone} ${pulse}`} aria-hidden="true" />;
}

function NavButton({
  item,
  active,
  onClick,
}: {
  item: (typeof NAV)[number];
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-11 items-center gap-3 rounded-sm px-2 text-left text-sm ${active ? "text-copper" : "text-muted"}`}
    >
      <Icon className="size-4" aria-hidden="true" />
      {item.label}
    </button>
  );
}
