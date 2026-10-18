import assert from "node:assert/strict";

// Reuses the smoke suite's browser, viewport, local server, and error recorder.
// Expected counts come from the native payload, not frozen content totals.
export async function checkSciencePages(page, base, out, width) {
  const payloadResponse = await page.request.get(
    `${base}/data/science-pages.json`
  );
  assert.equal(payloadResponse.status(), 200, "science payload");
  const payload = await payloadResponse.json();
  const collections = payload.collections;
  const routes = [
    ["papers", "/papers/", collections.papers],
    ["malecns", "/malecns/", collections.malecns],
    ["malecns-pt", "/pt/malecns/", collections.malecns],
    ["toe-arena", "/pt/toe-arena/", collections.theories],
    ["epistemic-worlds", "/pt/ai-epistemic-worlds/", collections.worlds],
    ["ai-slop", "/pt/awesome-ai-slop/", collections.slop],
    ["blog-tiers", "/pt/blog-tiers/", collections.postTiers],
    ["projects", "/projects/", collections.projects],
    ["projects-pt", "/pt/projects/", collections.projects],
  ];
  assert.ok(
    collections.postTiers.every(
      (card) => !card.data.translation_key.startsWith("music-")
    ),
    "Music must not enter editorial post tiers"
  );
  const results = [];
  for (const [name, path, expected] of routes) {
    const response = await page.goto(base + path, {
      waitUntil: "domcontentloaded",
    });
    assert.equal(response.status(), 200, path);
    await page.waitForSelector("[data-science-ready]");
    assert.equal(
      await page.locator("h1").count(),
      1,
      `${path}: one page title`
    );
    assert.equal(
      await page.locator("[data-science-card]").count(),
      expected.length,
      `${path}: all canonical cards`
    );
    assert.equal(
      await page.locator(".science-controls:visible").count(),
      1,
      `${path}: enhanced controls`
    );
    const audit = await page.evaluate(() => {
      const root = document.querySelector(".science-content");
      const ids = [...root.querySelectorAll("[id]")].map(
        (element) => element.id
      );
      return {
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        duplicateIds: ids.filter((id, index) => ids.indexOf(id) !== index),
        brokenFragments: [...root.querySelectorAll('a[href^="#"]')]
          .map((anchor) => anchor.getAttribute("href"))
          .filter(
            (href) =>
              href.length > 1 &&
              !document.getElementById(decodeURIComponent(href.slice(1)))
          ),
      };
    });
    assert.equal(audit.overflow, false, `${path}: horizontal overflow`);
    assert.deepEqual(audit.duplicateIds, [], `${path}: duplicate IDs`);
    assert.deepEqual(audit.brokenFragments, [], `${path}: broken card links`);
    const board = page.locator("[data-science-board]").first();
    const boardCount = await board.locator("[data-science-card]").count();
    await board
      .locator("[data-card-search]")
      .fill("zzzz-no-such-science-record");
    assert.equal(
      await board.locator("[data-science-card]:visible").count(),
      0,
      `${path}: search`
    );
    assert.match(
      await board.locator("[data-card-count]").innerText(),
      /^0 /,
      `${path}: accessible result count`
    );
    await board.locator("[data-reset-cards]").click();
    assert.equal(
      await board.locator("[data-science-card]:visible").count(),
      boardCount,
      `${path}: reset`
    );
    await board.locator("[data-tier-filter]").selectOption("B");
    assert.ok(
      await board
        .locator("[data-science-card]:visible")
        .evaluateAll((items) =>
          items.every((item) => item.dataset.tier === "B")
        ),
      `${path}: primary tier filter`
    );
    await board.locator("[data-reset-cards]").click();
    await board.locator("[data-interest-filter]").selectOption("S");
    assert.ok(
      await board
        .locator("[data-science-card]:visible")
        .evaluateAll((items) =>
          items.every((item) => item.dataset.interest === "S")
        ),
      `${path}: interest filter`
    );
    await board.locator("[data-reset-cards]").click();
    await board.locator("[data-expand-cards]").click();
    assert.equal(
      await board.locator("details.science-evidence[open]").count(),
      boardCount,
      `${path}: expand evidence`
    );
    await board.locator("[data-expand-cards]").click();
    assert.equal(
      await board.locator("details.science-evidence[open]").count(),
      0,
      `${path}: collapse evidence`
    );
    if (path === "/pt/ai-epistemic-worlds/") {
      assert.equal(
        await page.locator("#convergence-heading .science-card").count(),
        collections.convergences.length
      );
      assert.equal(
        await page.locator("#intervention-heading .science-card").count(),
        collections.interventions.length
      );
    }
    if (path.includes("projects/")) {
      assert.equal(
        await page.locator("[data-project-repository]").count(),
        payload.projectCatalog.repositories.length
      );
      assert.ok(
        (await page.locator("[data-project-freshness]").innerText()).includes(
          payload.projectCatalog.fetched_at ?? ""
        )
      );
    }
    if (out) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({
        path: `${out}/science-${name}-${width}.png`,
        fullPage: false,
      });
    }
    results.push({
      path,
      viewport: width,
      status: response.status(),
      cards: expected.length,
      scienceControls: "passed",
    });
  }

  // Verify the runtime after native navigation, including a return visit. A
  // doubled click listener would immediately undo the expand operation.
  await page.goto(`${base}/malecns/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("[data-science-ready]");
  await page.locator("a.language-link").click();
  await page.waitForURL("**/pt/malecns/");
  await page.waitForSelector("[data-science-ready]");
  await page.locator("[data-card-search]").fill("zzzz-no-such-science-record");
  assert.equal(
    await page.locator("[data-science-card]:visible").count(),
    0,
    "science filters after native navigation"
  );
  await page.locator("a.language-link").click();
  await page.waitForURL("**/malecns/");
  await page.waitForSelector("[data-science-ready]");
  await page.locator("[data-expand-cards]").click();
  assert.equal(
    await page.locator("details.science-evidence[open]").count(),
    collections.malecns.length,
    "science lifecycle after return navigation"
  );
  return results;
}
