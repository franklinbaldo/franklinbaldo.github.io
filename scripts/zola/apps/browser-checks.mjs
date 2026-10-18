import assert from "node:assert/strict";

// Called by the browser smoke suite on both desktop and mobile viewports.
export async function checkNativeApps(page, base, screenshotDirectory, width) {
  const results = [];
  async function visit(id, path) {
    const response = await page.goto(base + path, {
      waitUntil: "domcontentloaded",
    });
    assert.equal(response.status(), 200, path);
    assert.equal(
      await page.locator('meta[name="generator"]').getAttribute("content"),
      "Zola"
    );
    assert.ok(await page.locator('link[rel="canonical"]').getAttribute("href"));
    results.push({ path, viewport: width, status: response.status() });
    return async () => {
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1
        ),
        false,
        `${path}: horizontal overflow`
      );
      if (screenshotDirectory)
        await page.screenshot({
          path: `${screenshotDirectory}/${id}-${width}.png`,
          fullPage: true,
        });
    };
  }
  let finish = await visit("repo-factory", "/games/repo-factory/");
  await page.waitForSelector('.factory-shell[data-initialized="true"]');
  const snapshot = await page
    .locator("#repo-factory-data")
    .evaluate((element) => JSON.parse(element.textContent));
  assert.equal(
    await page.locator(".factory-node").count(),
    snapshot.repositories.length
  );
  if (snapshot.repositories.length) {
    const selected = snapshot.repositories.at(-1);
    await page.locator("#factory-search").fill(selected.name);
    await page
      .locator(`.factory-node[data-repo=${JSON.stringify(selected.name)}]`)
      .click();
    assert.equal(
      await page.locator("#inspector-name").innerText(),
      selected.name
    );
    await page
      .locator("#factory-search")
      .fill("no-repository-matches-this-test");
    assert.equal(await page.locator(".factory-node:visible").count(), 0);
    await page.locator("#factory-search").fill("");
    await page.locator("#factory-status").selectOption(selected.status);
    assert.equal(
      await page.locator(".factory-node:visible").count(),
      snapshot.repositories.filter((repo) => repo.status === selected.status)
        .length
    );
    await page.locator("#factory-status").selectOption("all");
    await page.locator("#factory-belts").uncheck();
    assert.equal(await page.locator("[data-belt]:visible").count(), 0);
    await page.locator("#factory-belts").check();
    const pressed = await page
      .locator("#factory-motion")
      .getAttribute("aria-pressed");
    await page.locator("#factory-motion").click();
    assert.notEqual(
      await page.locator("#factory-motion").getAttribute("aria-pressed"),
      pressed
    );
  }
  await finish();

  finish = await visit("atlas-das-equacoes", "/pt/atlas-das-equacoes/");
  await page.waitForSelector(".graph-node.formula");
  const graph = await page
    .locator("#uekg-universe")
    .evaluate((element) => JSON.parse(element.dataset.graph));
  assert.equal(
    await page.locator(".graph-node.formula").count(),
    graph.formulas.length
  );
  assert.equal(
    await page.locator(".formula-card").count(),
    graph.formulas.length
  );
  await page.locator('.mode-button[data-mode="structure"]').click();
  assert.equal(
    await page
      .locator('.mode-button[data-mode="structure"]')
      .getAttribute("aria-pressed"),
    "true"
  );
  if (graph.families.length) {
    await page.locator("[data-focus-family]").first().click();
    await page.waitForSelector(".graph-node.family.is-focused");
    assert.equal(
      await page.locator("[data-panel-title]").innerText(),
      graph.families[0].label
    );
  }
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("[data-panel].is-open").count(), 0);
  await page.locator('.mode-button[data-mode="discipline"]').click();
  assert.equal(
    await page
      .locator('.mode-button[data-mode="discipline"]')
      .getAttribute("aria-pressed"),
    "true"
  );
  await finish();

  for (const id of ["nathan-holmes", "theranos-nathan"]) {
    finish = await visit(id, `/powerpoint-club/${id}/`);
    assert.equal(
      await page.locator("body").getAttribute("data-native-app"),
      "standalone"
    );
    await page.waitForSelector(".reveal.ready");
    assert.ok((await page.locator(".slides > section").count()) > 20);
    assert.ok((await page.locator("aside.notes").count()) > 20);
    const first = await page.locator(".slides > section.present").innerText();
    await page.keyboard.press("ArrowRight");
    await page.waitForFunction(
      (before) =>
        document.querySelector(".slides > section.present")?.innerText !==
        before,
      first
    );
    await page.keyboard.press("ArrowLeft");
    await page.waitForFunction(
      (before) =>
        document.querySelector(".slides > section.present")?.innerText ===
        before,
      first
    );
    await page.keyboard.press("Escape");
    await page.waitForSelector(".reveal.overview");
    await page.keyboard.press("Escape");
    await finish();
  }
  return results;
}
