import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { safeOutputPath } from "./browser-guard.mjs";

test("screenshot guard confines new and existing output to the canonical screenshot root", () => {
  const root = mkdtempSync(join(tmpdir(), "limen-screenshot-guard-"));
  const shots = join(root, "screenshots");
  const outside = join(root, "outside");
  mkdirSync(shots);
  mkdirSync(outside);
  assert.equal(safeOutputPath(join(shots, "desktop.png"), [shots]), join(shots, "desktop.png"));
  assert.throws(() => safeOutputPath(join(shots, "..", "outside", "leak.png"), [shots]));
  assert.throws(() => safeOutputPath(join(root, "screenshots-trap", "leak.png"), [shots]));
  symlinkSync(outside, join(shots, "escape"));
  assert.throws(() => safeOutputPath(join(shots, "escape", "leak.png"), [shots]));
  writeFileSync(join(outside, "target.png"), "x");
  symlinkSync(join(outside, "target.png"), join(shots, "old.png"));
  assert.throws(() => safeOutputPath(join(shots, "old.png"), [shots]));
});
