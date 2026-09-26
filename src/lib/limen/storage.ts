import type { StateStorage } from "zustand/middleware";
import { MAX_DATA_BYTES, migrateLegacy, validateData } from "./data";

let issue: string | null = null;
let recoverableRaw: string | null = null;
function fault(message: string, raw?: string) {
  issue = message;
  if (raw) recoverableRaw = raw;
  if (typeof window !== "undefined") window.dispatchEvent(new Event("limen-storage-issue"));
}
export function storageIssue() { return issue; }
export function recoveryData() { return recoverableRaw; }
export function clearStorageIssue() { issue = null; recoverableRaw = null; }

export const guardedStorage: StateStorage = {
  getItem(name) {
    try {
      const raw = window.localStorage.getItem(name);
      if (!raw) return null;
      if (raw.length > MAX_DATA_BYTES) throw new Error("Stored data exceeds the supported size.");
      const envelope: unknown = JSON.parse(raw);
      if (!envelope || typeof envelope !== "object" || !("state" in envelope)) throw new Error("Stored data has no state.");
      const record = envelope as { state: unknown; version?: number };
      if (record.version === 2) return JSON.stringify({ version: 2, state: validateData(record.state) });
      else if (record.version === 0 || record.version === undefined) migrateLegacy(record.state);
      else throw new Error("Stored data has a newer, unsupported version.");
      return raw;
    } catch (error) {
      let raw: string | null = null;
      try { raw = window.localStorage.getItem(name); } catch { /* storage unavailable */ }
      fault(error instanceof Error ? error.message : "Browser storage is unavailable.", raw ?? undefined);
      throw error;
    }
  },
  setItem(name, value) {
    if (issue) return;
    if (value.length > MAX_DATA_BYTES) { fault("Browser data exceeds the 2 MB limit."); return; }
    try { window.localStorage.setItem(name, value); }
    catch (error) { fault(error instanceof Error ? error.message : "Browser storage is unavailable."); }
  },
  removeItem(name) {
    try { window.localStorage.removeItem(name); clearStorageIssue(); }
    catch (error) { fault(error instanceof Error ? error.message : "Browser storage is unavailable."); throw error; }
  },
};
