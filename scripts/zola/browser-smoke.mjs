import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
const base = process.env.ZOLA_PREVIEW_URL || "http://127.0.0.1:8000";
const out = ".cache/zola-screenshots";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const results = [];
try {
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 390, height: 844 },
  ]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const [name, path] of [
      ["home", "/"],
      ["home-pt", "/pt/"],
      ["migration", "/pt/blog/migracao-do-blog-para-zola/"],
      ["search", "/pt/search/"],
      ["ranking", "/ranking/"],
      ["battles", "/ranking/battles/"],
      ["rug-pull", "/games/rug-pull/"],
    ]) {
      const response = await page.goto(base + path, {
        waitUntil: "networkidle",
      });
      assert.equal(response.status(), 200, path);
      assert.equal(
        await page.locator('meta[name="generator"]').getAttribute("content"),
        "Zola",
        path
      );
      assert.ok(await page.locator("h1").first().isVisible(), path);
      if (name === "migration") {
        assert.ok(await page.locator("[data-zola-content]").innerText());
        const html = await page.content();
        assert.ok(!html.includes("data-astro-cid"));
      }
      if (name === "search") {
        await page.locator('input[type="search"]').fill("migração");
        await page.waitForSelector(".pagefind-ui__result");
      }
      if (name === "rug-pull") {
        await page.locator("#rug-start").click();
        await page.locator("#rug-game").waitFor({ state: "visible" });
        assert.equal(await page.locator("#rug-intro").isVisible(), false);
      }
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth + 1
        ),
        false,
        `${path} horizontal overflow`
      );
      await page.screenshot({
        path: `${out}/${name}-${viewport.width}.png`,
        fullPage: true,
      });
      results.push({
        path,
        viewport: viewport.width,
        status: response.status(),
      });
    }
    assert.deepEqual(errors, [], "browser console errors");
    await context.close();
  }
  writeFileSync(
    `${out}/report.json`,
    JSON.stringify(
      { head: process.env.GITHUB_HEAD_SHA ?? null, results },
      null,
      2
    ) + "\n"
  );
} finally {
  await browser.close();
}
console.log(
  `Zola browser smoke: ${results.length} route/viewport checks passed`
);
