import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:4321";
const OUT = "/tmp/screenshots";
mkdirSync(OUT, { recursive: true });

const desktop = { width: 1440, height: 900, deviceScaleFactor: 1 };
const mobile = { width: 390, height: 844, deviceScaleFactor: 2 };

const pages = [
  { id: "01-en-home", url: "/" },
  { id: "02-pt-home", url: "/pt/" },
  {
    id: "03-en-post-delphi",
    url: "/blog/2026-05-04-the-three-imperatives-at-delphi/",
  },
  { id: "04-en-path-agency", url: "/paths/agency-and-constraint/" },
  { id: "05-en-archive", url: "/archive/" },
  { id: "06-en-repo-factory", url: "/games/repo-factory/" },
];

const themeKeyPages = ["01-en-home", "03-en-post-delphi", "06-en-repo-factory"];

const browser = await chromium.launch();

async function shoot(p, viewport, theme) {
  const ctx = await browser.newContext({
    viewport,
    deviceScaleFactor: viewport.deviceScaleFactor,
    reducedMotion: "reduce",
  });
  // Pre-seed theme + lang so the page doesn't bounce around.
  await ctx.addInitScript((t) => {
    try {
      localStorage.setItem("theme", t);
      localStorage.setItem("lang", "en");
      sessionStorage.setItem("visited:" + location.pathname, "1");
    } catch {}
  }, theme);

  const page = await ctx.newPage();
  await page.goto(BASE + p.url, { waitUntil: "networkidle" });
  // Settle web fonts + lazy images.
  await page.evaluate(() => (document.fonts ? document.fonts.ready : null));
  await page.waitForTimeout(300);

  const vpLabel = viewport.width >= 1000 ? "desktop" : "mobile";
  const themeLabel = theme === "dark" ? "-dark" : "";
  const file = `${OUT}/${p.id}-${vpLabel}${themeLabel}.png`;
  await page.screenshot({ path: file, fullPage: true });
  console.log(file);
  await ctx.close();
}

for (const p of pages) {
  await shoot(p, desktop, "light");
  await shoot(p, mobile, "light");
  if (themeKeyPages.includes(p.id)) {
    await shoot(p, desktop, "dark");
  }
}

await browser.close();
