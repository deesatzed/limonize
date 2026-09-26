import type { SitInput } from "./types";

export interface SourceHit { field: "prose" | "claim" | "choice"; start: number; end: number; certainty: "asserted" | "uncertain" }

export function findAssertion(input: Pick<SitInput, "prose" | "claim" | "choice">, pattern: RegExp): SourceHit | null {
  for (const field of ["prose", "claim", "choice"] as const) {
    const source = input[field];
    const clauses = source.matchAll(/[^.!?;]+(?:[.!?;]|$)/g);
    for (const found of clauses) {
      const clause = found[0];
      const offset = found.index;
      const match = new RegExp(pattern.source, pattern.flags.replaceAll("g", "")).exec(clause);
      if (match) {
        const before = clause.slice(0, match.index);
        const prefix = before.slice(-48);
        const quoted = /["“][^"”]*$/.test(before) || /["“]/.test(match[0]);
        const negated = /\b(?:no|not|never|without|doesn't|isn't|wasn't|weren't|didn't|cannot|can't)\b[^.!?;]{0,34}$/i.test(prefix);
        const hypothetical = /\b(?:if|suppose|imagine|hypothetically|could be)\b[^.!?;]{0,80}$/i.test(prefix);
        if (!quoted && !negated && !hypothetical) {
          return { field, start: offset + match.index, end: offset + match.index + match[0].length, certainty: /\b(?:perhaps|maybe|might|possibly|probably)\b/i.test(prefix) ? "uncertain" : "asserted" };
        }
      }
    }
  }
  return null;
}
