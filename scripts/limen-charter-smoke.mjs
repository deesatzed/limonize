import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { checkedOutputPath, checkedUrl } from "./browser-guard.mjs";

const url = checkedUrl(process.argv[2] ?? "http://127.0.0.1:8080/");
const flavor = new URL(url).port === "8081" ? "built" : "dev";
const screenshots = new URL("../screenshots/", import.meta.url);
const output = (name) => checkedOutputPath(fileURLToPath(new URL(name, screenshots)), [fileURLToPath(screenshots)]);
const browser = await chromium.launch({ headless: true });
const results = [];
let activePage;
try {
  for (const [name, viewport] of [["desktop", { width: 1280, height: 800 }], ["mobile", { width: 390, height: 844 }]]) {
    const context = await browser.newContext({ viewport, hasTouch: name === "mobile" });
    const page = await context.newPage();
    activePage = page;
    const errors = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    await page.goto(url);
    // Let the existing SSR app finish its initial client hydration before navigation.
    await page.waitForTimeout(1200);
    await page.getByRole("button", { name: "Self", exact: true }).click();
    await page.getByRole("heading", { name: "Continuity and integrity", exact: true }).waitFor();
    const disclosure = page.getByText("Read the charter", { exact: true });
    await disclosure.focus();
    await disclosure.press("Enter");
    await page.getByRole("heading", { name: "Autonomous development", exact: true }).waitFor();
    await page.locator('section[aria-labelledby="charter-title"]').screenshot({ path: output(`charter-${flavor}-self-${name}-expanded.png`) });
    await disclosure.press("Enter");
    await page.getByRole("button", { name: "Pause learned influence", exact: true }).click();
    await page.getByRole("status").getByText("Learned influence is paused", { exact: true }).waitFor();
    await page.reload();
    await page.getByRole("button", { name: "Resume learned influence", exact: true }).waitFor();
    if (!await page.getByRole("button", { name: "Turn adaptive preferences on" }).isDisabled()) throw new Error("Adaptive controls did not respect the pause");
    const imported = await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem("limen-v1")).state;
      return JSON.stringify({ format: "limen-data", version: 2, exportedAt: Date.now(), data: { ...state, learningPaused: false, adaptiveEnabled: true, setLearningPaused: "replace control", charter: { allowExternalCalls: true } } });
    });
    await page.getByText("Import a Limen export", { exact: true }).click();
    await page.getByLabel("Choose Limen export").setInputFiles({ name: "synthetic-charter-test.json", mimeType: "application/json", buffer: Buffer.from(imported) });
    await page.getByRole("button", { name: "Preview import", exact: true }).click();
    await page.getByRole("button", { name: "Apply import", exact: true }).click();
    await page.getByText("Import applied.", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Resume learned influence", exact: true }).click();
    await page.getByRole("status").getByText("Learned influence is available", { exact: true }).waitFor();
    const state = await page.evaluate(() => JSON.parse(localStorage.getItem("limen-v1")).state);
    if (state.learningPaused || state.adaptiveEnabled || state.charter || state.setLearningPaused) throw new Error("Imported file changed governing controls");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    await page.getByRole("heading", { name: "Continuity and integrity", exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: output(`charter-${flavor}-self-${name}.png`) });
    results.push({ viewport: name, ok: !errors.length && !overflow, errors, horizontalOverflow: overflow, steps: ["keyboard charter disclosure", "pause", "reload retains pause", "import cannot change controls", "explicit resume"] });
    await context.close();
  }
  const verdict = { ok: results.every((result) => result.ok), url, results };
  writeFileSync(output(`charter-${flavor}-flow.json`), JSON.stringify(verdict, null, 2));
  console.log(JSON.stringify(verdict));
  if (!verdict.ok) process.exitCode = 1;
} catch (error) {
  const verdict = { ok: false, url, results, failure: String(error), body: activePage ? (await activePage.locator("body").innerText()).slice(0, 3500) : "" };
  if (activePage) await activePage.screenshot({ path: output(`charter-${flavor}-flow-failure.png`), fullPage: true });
  writeFileSync(output(`charter-${flavor}-flow.json`), JSON.stringify(verdict, null, 2));
  console.error(JSON.stringify(verdict));
  process.exitCode = 1;
} finally { await browser.close(); }
