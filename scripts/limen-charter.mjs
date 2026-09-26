import { readFileSync, writeFileSync } from "node:fs";
import { renderCharterMarkdown } from "../src/lib/limen/charter.ts";

const path = new URL("../CONTINUITY_AND_INTEGRITY_CHARTER.md", import.meta.url);
const expected = renderCharterMarkdown();
if (process.argv.includes("--check")) {
  if (readFileSync(path, "utf8") !== expected) {
    throw new Error("The charter document differs from the application charter. Run npm run charter:write after reviewing the governing change.");
  }
  console.log("Application and documented charter agree.");
} else {
  writeFileSync(path, expected);
  console.log("Wrote CONTINUITY_AND_INTEGRITY_CHARTER.md");
}
