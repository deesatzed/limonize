/**
 * Target checks shared by the Playwright capture scripts.
 *
 * Both run Chromium with `--no-sandbox` as root and take their URL and output
 * path from argv, so unchecked they will render `file:///root/.grok/auth.json`
 * into a PNG the agent can read, and write it anywhere.
 */
import { existsSync, realpathSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";

const LOOPBACK_HOSTNAMES = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

/** http/https loopback only, else exit 1. `BROWSER_ALLOW_EXTERNAL_HOST=1` opts out. */
export function checkedUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    fail(`not a valid URL: ${url}`);
  }
  // Rules out file:, data:, chrome:, view-source:.
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    fail(`only http/https URLs are allowed, got ${parsed.protocol} in ${url}`);
  }
  if (!LOOPBACK_HOSTNAMES.has(parsed.hostname) && process.env.BROWSER_ALLOW_EXTERNAL_HOST !== "1") {
    fail(
      `${parsed.hostname} is not a loopback host; these scripts screenshot the ` +
        `local dev server. Set BROWSER_ALLOW_EXTERNAL_HOST=1 to override.`,
    );
  }
  return url;
}

/** Absolute `target` if it is strictly inside `allowedDirs`, else exit 1. */
export function checkedOutputPath(target, allowedDirs, label = "screenshot") {
  try {
    return safeOutputPath(target, allowedDirs);
  } catch {
    fail(`${label} path must be under ${allowedDirs.join(" or ")}, got ${resolve(target)}`);
  }
}

/** Restrict writes to existing canonical directories; reject symlink escapes. */
export function safeOutputPath(target, allowedDirs) {
  // Resolve first so `..` cannot slip past the prefix check.
  const abs = resolve(target);
  const allowed = allowedDirs.some((dir) => {
    const root = realpathSync(dir);
    if (!abs.startsWith(resolve(dir) + sep)) return false;
    if (existsSync(abs) && realpathSync(abs) !== abs) return false;
    const parent = realpathSync(dirname(abs));
    return parent === root || parent.startsWith(root + sep);
  });
  if (!allowed) {
    throw new Error("output outside allowed directory");
  }
  return abs;
}

function fail(message) {
  console.error(JSON.stringify({ ok: false, error: message }, null, 2));
  process.exit(1);
}
