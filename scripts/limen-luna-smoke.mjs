#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdir, realpath } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const screenshots = resolve(repo, "screenshots");
const url = process.argv[2] || "http://127.0.0.1:8080/";
const name = process.argv[3] || `luna-journey-${Date.now()}`;
if (!/^[a-zA-Z0-9._-]+$/.test(name)) throw new Error("Screenshot name must contain only letters, numbers, dot, dash, and underscore.");
await mkdir(screenshots, { recursive: true });
const errors = [];
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  const response = await page.goto(url, { waitUntil: "domcontentloaded" });
  assert.equal(response?.status(), 200, "application root must render successfully");
  await page.locator('[data-limen-ready="true"]').waitFor();
  await page.getByRole("heading", { name: "Find what could change this decision." }).waitFor();

  await page.getByRole("button", { name: "Self", exact: true }).click();
  await page.getByRole("button", { name: "Enable local development" }).click();
  await page.getByRole("button", { name: "Run three-family local rehearsal" }).click();
  const rehearsal = page.getByRole("status").filter({ hasText: "Rehearsal finished." });
  await rehearsal.waitFor({ timeout: 20000 });
  assert.match(await rehearsal.innerText(), /remain in shadow under the comparative gate/);
  assert.match(await page.locator("#development-title").locator("..").innerText(), /0 active simulation policies/);
  await page.screenshot({ path: join(screenshots, `${name}-self.png`), fullPage: true });

  await page.getByRole("button", { name: "Ledger" }).click();
  const ledger = await page.locator("body").innerText();
  assert.match(ledger, /Development policies/);
  assert.match(ledger, /SIMULATED · TESTING/);
  assert.match(ledger, /applications: 0/);
  await page.screenshot({ path: join(screenshots, `${name}-ledger.png`), fullPage: true });

  await page.getByRole("button", { name: "Self", exact: true }).click();
  await page.getByRole("button", { name: "Pause learned influence" }).click();
  await page.getByRole("button", { name: "Resume learned influence" }).waitFor();
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator('[data-limen-ready="true"]').waitFor();
  await page.getByRole("button", { name: "Self", exact: true }).click();
  await page.getByRole("button", { name: "Resume learned influence" }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  const mobile = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  assert.ok(mobile.width <= mobile.client + 1, "mobile layout must not overflow horizontally");
  await page.screenshot({ path: join(screenshots, `${name}-mobile.png`), fullPage: true });
  assert.deepEqual(errors, [], "browser console and page must remain error-free");

  const outputs = await Promise.all([`${name}-self.png`, `${name}-ledger.png`, `${name}-mobile.png`].map(async (file) => relative(screenshots, await realpath(join(screenshots, file)))));
  console.log(JSON.stringify({ ok: true, url, rehearsal: "recorded; policies remain shadow", pausePersists: true, mobile, errors, screenshots: outputs }, null, 2));
  await context.close();
} finally {
  await browser.close();
}
