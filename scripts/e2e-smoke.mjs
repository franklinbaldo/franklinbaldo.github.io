// RFC-free smoke test (issue #1086): loads a handful of key pages against a
// built `dist/` via `astro preview` and asserts each one responds OK, paints
// an <h1>, and logs no browser console errors. Not a full regression suite —
// just a cheap guard against a page-breaking change slipping through.
//
// Requires `npm run build` to have already produced `dist/` (same
// precondition as Lighthouse CI's `staticDistDir`, see .lighthouserc.cjs).
import { chromium } from "playwright";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";

const PORT = 4321;
const BASE = `http://localhost:${PORT}`;

const PAGES = [
  { id: "en-home", url: "/" },
  { id: "en-post", url: "/blog/asymmetric-evolution/" },
  { id: "en-ranking", url: "/ranking/" },
  { id: "pt-home", url: "/pt/" },
  { id: "pt-post", url: "/pt/blog/o-ovo-de-serpente/" },
  { id: "pt-ranking", url: "/pt/ranking/" },
];

if (!existsSync("dist")) {
  console.error(
    "dist/ not found — run `npm run build` before `npm run test:e2e`."
  );
  process.exit(1);
}

function waitForServer(url, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = async () => {
      try {
        const res = await fetch(url);
        if (res.ok || res.status === 404) return resolve();
      } catch {
        // server not up yet
      }
      if (Date.now() > deadline)
        return reject(new Error(`timed out waiting for ${url}`));
      setTimeout(attempt, 300);
    };
    attempt();
  });
}

const preview = spawn(
  "npx",
  ["astro", "preview", "--port", String(PORT), "--host", "localhost"],
  { stdio: "pipe" }
);
let previewOutput = "";
preview.stdout.on("data", (d) => (previewOutput += d));
preview.stderr.on("data", (d) => (previewOutput += d));

const results = [];

try {
  await waitForServer(BASE);

  const browser = await chromium.launch();
  try {
    for (const p of PAGES) {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      const consoleErrors = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });
      page.on("pageerror", (err) => consoleErrors.push(String(err)));

      let httpOk = false;
      let h1Visible = false;
      let error = null;
      try {
        const response = await page.goto(BASE + p.url, { waitUntil: "load" });
        httpOk = Boolean(response && response.ok());
        h1Visible = await page.locator("h1").first().isVisible();
      } catch (e) {
        error = e instanceof Error ? e.message : String(e);
      }

      results.push({
        id: p.id,
        url: p.url,
        pass: httpOk && h1Visible && consoleErrors.length === 0 && !error,
        httpOk,
        h1Visible,
        consoleErrors,
        error,
      });
      await ctx.close();
    }
  } finally {
    await browser.close();
  }
} finally {
  preview.kill();
}

let failed = false;
for (const r of results) {
  const status = r.pass ? "PASS" : "FAIL";
  if (!r.pass) failed = true;
  console.log(`${status}  ${r.id.padEnd(12)} ${r.url}`);
  if (!r.pass) {
    if (!r.httpOk) console.log(`       response not ok`);
    if (!r.h1Visible) console.log(`       no visible <h1>`);
    if (r.error) console.log(`       error: ${r.error}`);
    for (const e of r.consoleErrors) console.log(`       console error: ${e}`);
  }
}

if (failed) {
  console.error("\ne2e smoke: FAILED");
  console.error(previewOutput);
  process.exit(1);
}

console.log("\ne2e smoke: all pages OK");
