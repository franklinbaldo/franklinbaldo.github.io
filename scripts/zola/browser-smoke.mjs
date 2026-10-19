import { checkProprioception } from "./proprioception-browser-checks.mjs";
import { checkNativeApps } from "./apps/browser-checks.mjs";
import { checkSciencePages } from "./science-browser-checks.mjs";
import { checkMusic } from "./music-browser-checks.mjs";
import { checkBooks } from "./books-browser-checks.mjs";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
const base = process.env.ZOLA_PREVIEW_URL || "http://127.0.0.1:8000";
const out = ".cache/zola-screenshots";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const results = [];
const failures = [];
try {
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 390, height: 844 },
  ]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const errors = [];
    page.on("response", (response) => {
      if (response.url().startsWith(base) && response.status() >= 400)
        errors.push(`${response.status()} ${response.url()}`);
    });
    page.on("pageerror", (error) => errors.push(error.message));
    for (const [name, path] of [
      ["home", "/"],
      ["home-pt", "/pt/"],
      ["migration", "/pt/blog/migracao-do-blog-para-zola/"],
      ["reviewed-post", "/pt/blog/vos/"],
      ["search", "/pt/search/?q=migra%C3%A7%C3%A3o"],
      ["archive", "/archive/"],
      ["archive-pt", "/pt/archive/"],
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
      assert.ok(
        await page.evaluate(() =>
          [...document.styleSheets].some(
            (sheet) =>
              sheet.href?.endsWith("/css/site.css") && sheet.cssRules.length > 0
          )
        ),
        `${path} native stylesheet`
      );
      if (name === "migration") {
        assert.ok(await page.locator("[data-article-toc]").count());
        assert.ok(await page.locator("[data-article-share]").count());
        assert.ok(await page.locator("[data-zola-content]").innerText());
        const html = await page.content();
        assert.ok(!html.includes("data-astro-cid"));
      }
      if (name === "reviewed-post") {
        const review = page.locator("details[data-hronir-duel]").first();
        assert.ok(await review.count());
        await review.locator("summary").first().click();
        assert.equal(await review.getAttribute("open"), "");
        await review.locator("summary").first().click();
        assert.equal(await review.getAttribute("open"), null);
        assert.ok(await page.locator(".article-related").count());
        const schemas = await page
          .locator('script[type="application/ld+json"]')
          .allTextContents();
        assert.ok(schemas.some((text) => text.includes("BlogPosting")));
      }
      if (name === "search") {
        await page.waitForFunction(
          () =>
            document.querySelector(".pagefind-ui__search-input")?.value ===
            "migração"
        );
        await page.waitForSelector(".pagefind-ui__result");
        const searchInput = page.locator(".pagefind-ui__search-input");
        await searchInput.fill("Fourier");
        await page.waitForURL("**/pt/search/?q=Fourier");
        assert.equal(
          await page.locator(".language-link").getAttribute("href"),
          base + "/search/?q=Fourier"
        );
        await page.reload({ waitUntil: "networkidle" });
        await page.waitForFunction(
          () =>
            document.querySelector(".pagefind-ui__search-input")?.value ===
            "Fourier"
        );
        await page.waitForSelector(".pagefind-ui__result-link");
        await page.locator(".pagefind-ui__result-link").first().click();
        await page.waitForURL((url) => !url.pathname.endsWith("/search/"));
        await page.goBack();
        await page.waitForFunction(
          () =>
            document.querySelector(".pagefind-ui__search-input")?.value ===
            "Fourier"
        );
        await page.locator(".pagefind-ui__search-clear").click();
        await page.waitForURL("**/pt/search/");
        assert.equal(
          await page.locator(".language-link").getAttribute("href"),
          base + "/search/"
        );
      }
      if (name === "home" || name === "home-pt") {
        const menu = page.locator(".more-menu");
        await menu.locator("summary").focus();
        await page.keyboard.press("Enter");
        assert.equal(await menu.locator("section").count(), 3);
        assert.equal(await menu.locator("section a").count(), 14);
        assert.ok(await menu.locator("section h2").first().isVisible());
        await page.keyboard.press("Enter");
        assert.equal(await menu.getAttribute("open"), null);
        const cards = page.locator(".reading-path-card");
        assert.equal(await cards.count(), 3, `${path} curated reading paths`);
        for (const card of await cards.all()) {
          assert.ok(await card.isVisible());
          const box = await card.boundingBox();
          assert.ok(box.width >= 44 && box.height >= 44, "card touch target");
          await card.focus();
          assert.equal(
            await card.evaluate((el) => el === document.activeElement),
            true
          );
        }
        for (const link of await page.locator(".discovery-links a").all()) {
          const box = await link.boundingBox();
          assert.ok(box.height >= 44, "archive shortcut touch target");
        }
      }
      if (name === "home") {
        const toggle = page.locator("[data-theme-toggle]");
        await toggle.check();
        assert.equal(
          await page.locator("html").getAttribute("data-theme"),
          "dark"
        );
        await toggle.uncheck();
        assert.equal(
          await page.locator("html").getAttribute("data-theme"),
          "light"
        );
      }
      if (name === "archive" || name === "archive-pt") {
        assert.equal(await page.locator("[data-archive-type]").count(), 50);
        await page.locator("[data-archive-filter]").selectOption({ index: 1 });
        assert.ok(
          (await page.locator("[data-archive-type]:not([hidden])").count()) > 0
        );
        await page.locator("[data-archive] nav a").first().click();
        await page.waitForURL("**/archive/page/2/");
        const prefix = name === "archive-pt" ? "/pt" : "";
        assert.equal(
          await page.locator(".language-link").getAttribute("href"),
          prefix ? "/archive/" : "/pt/archive/"
        );
        await page.locator("#archive-query").fill("Fourier");
        await page.locator(".archive-search button").click();
        await page.waitForURL(`**${prefix}/search/?q=Fourier`);
        await page.waitForFunction(
          () =>
            document.querySelector(".pagefind-ui__search-input")?.value ===
            "Fourier"
        );
        await page.goto(base + prefix + "/archive/page/2/", {
          waitUntil: "networkidle",
        });
        assert.ok((await page.locator("[data-archive-type]").count()) > 0);
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
    for (const [name, check] of [
      ["proprioception", checkProprioception],
      ["music", checkMusic],
      ["books", checkBooks],
      ["science", checkSciencePages],
      ["apps", checkNativeApps],
    ]) {
      try {
        results.push(...(await check(page, base, out, viewport.width)));
      } catch (error) {
        failures.push(`${name}/${viewport.width}: ${error.stack}`);
        console.error(failures.at(-1));
        await page.screenshot({
          path: `${out}/failure-${name}-${viewport.width}.png`,
        });
      }
    }
    if (errors.length)
      failures.push(`browser/${viewport.width}: ${errors.join("; ")}`);
    await context.close();
  }
  writeFileSync(
    `${out}/report.json`,
    JSON.stringify(
      { head: process.env.GITHUB_HEAD_SHA ?? null, results, failures },
      null,
      2
    ) + "\n"
  );
  assert.deepEqual(failures, [], "All browser checks must pass");
} finally {
  await browser.close();
}
console.log(
  `Zola browser smoke: ${results.length} route/viewport checks passed`
);
