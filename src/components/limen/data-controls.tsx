import { useState } from "react";
import { exportData, parseImport } from "@/lib/limen/data";
import { recoveryData, storageIssue } from "@/lib/limen/storage";
import { useLimen } from "@/lib/limen/store";

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function DataControls() {
  const [raw, setRaw] = useState("");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<ReturnType<typeof parseImport>["preview"] | null>(null);
  const [selected, setSelected] = useState("");
  const situations = useLimen((s) => s.situations);
  const deleteCase = useLimen((s) => s.deleteCase);
  const importData = useLimen((s) => s.importData);
  const issue = storageIssue();
  return <section className="border-t border-line pt-7">
    <h2 className="font-serif text-2xl">Your local data</h2>
    <p className="mt-2 text-sm text-muted">Drafts, cases, revisions, outcomes, and lessons stay in this browser. They are not encrypted or synced. Clearing browser data can remove them. Export a copy before clearing or changing devices.</p>
    {issue ? <div className="mt-4 rounded-lg border border-copper p-4"><p className="text-copper">Storage needs attention: {issue}. New changes may exist only in memory; the original stored value is preserved.</p>{recoveryData() ? <button type="button" onClick={() => download("limen-recovery-raw.json", recoveryData()!)} className="mt-3 min-h-11 text-copper">Download original raw data</button> : null}<button type="button" onClick={() => { if (window.confirm("Discard the unreadable local data? Download it first if you may need recovery.")) { void useLimen.persist.clearStorage(); location.reload(); } }} className="ml-3 min-h-11 text-copper">Discard unreadable data</button></div> : null}
    <div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={() => { try { download("limen-export.json", exportData(useLimen.getState())); setMessage("Export prepared."); } catch (error) { setMessage(error instanceof Error ? error.message : "Export failed."); } }} className="min-h-11 rounded-sm bg-bg-raised px-4">Export all data</button>{selected ? <button type="button" onClick={() => { try { download("limen-selected-case.json", exportData(useLimen.getState(), [selected])); setMessage("Selected case export prepared."); } catch (error) { setMessage(error instanceof Error ? error.message : "Export failed."); } }} className="min-h-11 rounded-sm bg-bg-raised px-4">Export selected case</button> : null}</div>
    <details className="mt-5"><summary className="min-h-11 cursor-pointer text-copper">Import a Limen export</summary><p className="mt-1 text-sm text-muted">Only version 2 Limen JSON, up to 2 MB. IDs that conflict with different content are rejected before anything changes. Imports merge records; your current pause and adaptive settings stay in control.</p><input type="file" accept="application/json,.json" aria-label="Choose Limen export" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 2_000_000) { setMessage("Import exceeds 2 MB."); return; } setRaw(await file.text()); setPreview(null); }} className="mt-3 block max-w-full text-sm" /><button type="button" disabled={!raw} onClick={() => { try { const result = parseImport(raw, useLimen.getState()); setPreview(result.preview); setMessage(""); } catch (error) { setPreview(null); setMessage(error instanceof Error ? error.message : "Import is invalid."); } }} className="mt-3 min-h-11 rounded-sm bg-bg-raised px-4 disabled:opacity-50">Preview import</button>{preview ? <div className="mt-3 text-sm"><p>{preview.cases} cases, {preview.runs} runs, {preview.outcomes} outcome events, {preview.memories} memories. Matching IDs are deduplicated.</p><button type="button" onClick={() => { try { importData(raw); setPreview(null); setMessage("Import applied."); } catch (error) { setMessage(error instanceof Error ? error.message : "Import failed."); } }} className="mt-3 min-h-11 rounded-sm bg-copper px-4 text-ink">Apply import</button></div> : null}</details>
    {situations.length ? <details className="mt-5"><summary className="min-h-11 cursor-pointer text-copper">Delete one case</summary><label className="mt-2 block text-sm">Case<select value={selected} onChange={(e) => setSelected(e.target.value)} className="mt-2 block min-h-11 max-w-full bg-bg-raised p-2 text-fg"><option value="">Select a case</option>{situations.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select></label>{selected ? <p className="mt-2 text-sm text-muted">This removes its source text, all runs, provider responses, outcomes, and feedback. Memories originating here are deleted; dependent validation is revoked.</p> : null}<button type="button" disabled={!selected} onClick={() => { const row = situations.find((s) => s.id === selected); if (row && window.confirm(`Delete “${row.title}” and all its dependent records?`)) { deleteCase(selected); setSelected(""); } }} className="mt-3 min-h-11 rounded-sm bg-copper px-4 text-ink disabled:opacity-50">Delete selected case</button></details> : null}
    {message ? <p role="status" className="mt-3 text-sm text-copper">{message}</p> : null}
  </section>;
}
