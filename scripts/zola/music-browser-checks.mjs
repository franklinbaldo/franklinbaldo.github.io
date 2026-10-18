import assert from "node:assert/strict";

// Exercise our player and navigation without relying on Suno's third-party
// iframe availability, cookies, autoplay policy, or audio service responses.
export async function checkMusic(page, base, out, width) {
  const catalogResponse = await page.request.get(`${base}/music-player.json`);
  assert.equal(catalogResponse.status(), 200, "music catalog endpoint");
  const catalog = await catalogResponse.json();
  assert.ok(Array.isArray(catalog) && catalog.length > 1, "public catalog");
  const knownIds = new Set(catalog.map((song) => song.id));
  assert.equal(knownIds.size, catalog.length, "unique catalog IDs");
  const embedPattern = /^https:\/\/suno\.com\/embed\//;
  const stubEmbed = (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<!doctype html><html><title>Suno embed test fixture</title><body>Music embed</body></html>",
    });
  await page.route(embedPattern, stubEmbed);
  let catalogRequests = 0;
  const countCatalog = (request) => {
    if (new URL(request.url()).pathname === "/music-player.json")
      catalogRequests++;
  };
  page.on("request", countCatalog);
  let releaseCatalog;
  let catalogArrived;
  const heldCatalog = new Promise((resolve) => {
    releaseCatalog = resolve;
  });
  const pendingCatalog = new Promise((resolve) => {
    catalogArrived = resolve;
  });
  const holdCatalog = async (route) => {
    catalogArrived();
    await heldCatalog;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(catalog),
    });
  };
  const catalogPattern = `${base}/music-player.json`;
  await page.route(catalogPattern, holdCatalog);
  try {
    const response = await page.goto(`${base}/music/`, {
      waitUntil: "domcontentloaded",
    });
    assert.equal(response.status(), 200, "/music/");
    await page.waitForFunction(
      () => document.getElementById("songs-grid")?.dataset.galleryInit === "1"
    );
    assert.equal(
      catalogRequests,
      0,
      "catalog is lazy before the first play request"
    );
    assert.equal(await page.locator("#gmp").isVisible(), false);
    const bootstrap = await page.locator("#gmp").getAttribute("data-songs");
    assert.ok(Buffer.byteLength(bootstrap) <= 2048, "player bootstrap budget");
    const cardIds = await page
      .locator("#songs-grid .song-card")
      .evaluateAll((cards) => cards.map((card) => card.dataset.sunoId));
    assert.equal(cardIds.length, catalog.length, "gallery/catalog parity");
    assert.ok(
      cardIds.every((id) => knownIds.has(id)),
      "only catalog songs are rendered"
    );
    const firstId = cardIds[0];
    const secondId = cardIds[1];
    await page.evaluate(() => {
      for (const key of ["gmp-favorites", "gmp-history", "gmp-suno-id"])
        localStorage.removeItem(key);
      document.dispatchEvent(new Event("zola:page-load"));
    });

    // Cancel a queued play while the lazy fetch is held. Invoking the close
    // control directly also covers the interval before the iframe is visible.
    await page.locator("#gmp-play-all").click();
    await Promise.race([
      pendingCatalog,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Lazy catalog request did not start")),
          10000
        )
      ),
    ]);
    await page.evaluate(() => document.getElementById("gmp-close").click());
    const catalogFinished = page.waitForResponse(
      (response) => new URL(response.url()).pathname === "/music-player.json"
    );
    releaseCatalog();
    await catalogFinished;
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 0)));
    assert.equal(
      await page.locator("#gmp").isVisible(),
      false,
      "cancelled play stays closed"
    );
    assert.equal(
      await page.locator("#gmp-embed").getAttribute("src"),
      "about:blank"
    );
    await page.unroute(catalogPattern, holdCatalog);

    await page.locator("#songs-grid .song-play").first().click();
    await page.waitForFunction(
      (id) => document.getElementById("gmp")?.dataset.playingId === id,
      firstId
    );
    assert.equal(
      await page.locator("#gmp-embed").getAttribute("src"),
      `https://suno.com/embed/${firstId}`
    );
    assert.equal(catalogRequests, 1, "catalog fetched only once");
    await page.locator("#gmp-fav").click();
    await page.waitForFunction(
      (id) =>
        document
          .querySelector(`#songs-grid [data-suno-id="${id}"] .fav-btn`)
          ?.getAttribute("aria-pressed") === "true",
      firstId
    );
    assert.equal(await page.locator("#favorites-grid .mini-card").count(), 1);
    assert.equal(await page.locator("#history-rail .history-item").count(), 1);
    await page
      .locator(`#songs-grid [data-suno-id="${firstId}"] .fav-btn`)
      .click();
    assert.equal(
      await page.locator("#gmp-fav").getAttribute("aria-pressed"),
      "false",
      "card favorite updates the global player"
    );
    assert.equal(await page.locator("#favorites-section").isVisible(), false);
    await page
      .locator(`#songs-grid [data-suno-id="${secondId}"] .fav-btn`)
      .click();
    await page.locator("#favorites-grid button").click();
    await page.waitForFunction(
      (id) => document.getElementById("gmp")?.dataset.playingId === id,
      secondId
    );

    for (const mode of ["oldest", "newest", "duration-desc", "duration-asc"]) {
      await page.locator("#sort-songs").selectOption(mode);
      const values = await page
        .locator("#songs-grid .song-card")
        .evaluateAll(
          (cards, mode) =>
            cards.map((card) =>
              mode.startsWith("duration")
                ? Number(card.dataset.duration)
                : Date.parse(card.dataset.date)
            ),
          mode
        );
      const ascending = mode === "oldest" || mode === "duration-asc";
      assert.ok(
        values.every(
          (value, index) =>
            index === 0 ||
            (ascending
              ? value >= values[index - 1]
              : value <= values[index - 1])
        ),
        `song sort: ${mode}`
      );
    }
    const genreButtons = page.locator("#genre-chips button");
    if ((await genreButtons.count()) > 1) {
      const genre = await genreButtons.nth(1).getAttribute("data-genre");
      await genreButtons.nth(1).click();
      assert.equal(new URL(page.url()).searchParams.get("genre"), genre);
      const visibleGenres = await page
        .locator("#songs-grid .song-card:visible")
        .evaluateAll((cards) =>
          cards.map((card) => (card.dataset.genres || "").split(","))
        );
      assert.ok(
        visibleGenres.length > 0 &&
          visibleGenres.every((genres) => genres.includes(genre)),
        "genre filter"
      );
    }
    const queue = await page
      .locator("#songs-grid .song-card:visible")
      .evaluateAll((cards) => cards.map((card) => card.dataset.sunoId));
    await page.locator("#gmp-play-all").click();
    await page.waitForFunction(
      (id) => document.getElementById("gmp")?.dataset.playingId === id,
      queue[0]
    );
    await page.locator("#gmp-next").click();
    await page.waitForFunction(
      (id) => document.getElementById("gmp")?.dataset.playingId === id,
      queue[1 % queue.length]
    );
    await page.locator("#gmp-prev").click();
    await page.waitForFunction(
      (id) => document.getElementById("gmp")?.dataset.playingId === id,
      queue[0]
    );
    await page.locator("#gmp-shuffle-all").click();
    await page.waitForFunction(
      (ids) => ids.includes(document.getElementById("gmp")?.dataset.playingId),
      queue
    );
    if ((await genreButtons.count()) > 1) await genreButtons.first().click();

    await page.evaluate(() => {
      window.__musicTestIframe = document.getElementById("gmp-embed");
    });
    const playingId = await page
      .locator("#gmp")
      .getAttribute("data-playing-id");
    const assertPreserved = async () => {
      assert.equal(
        await page.evaluate(
          () =>
            window.__musicTestIframe === document.getElementById("gmp-embed")
        ),
        true,
        "same mounted iframe survives native navigation"
      );
      assert.equal(
        await page.locator("#gmp").getAttribute("data-playing-id"),
        playingId
      );
      assert.equal(
        catalogRequests,
        1,
        "navigation does not reload the catalog"
      );
    };
    await page.locator('header .language-link[href="/pt/musicas/"]').click();
    await page.waitForFunction(
      () =>
        location.pathname === "/pt/musicas/" &&
        document.getElementById("gmp-close")?.getAttribute("aria-label") ===
          "Fechar player"
    );
    await assertPreserved();
    assert.equal(
      await page.locator("#songs-grid .song-card").count(),
      catalog.length
    );
    assert.equal(await page.locator("#favorites-grid .mini-card").count(), 1);
    await page.goBack();
    await page.waitForFunction(
      () =>
        location.pathname === "/music/" &&
        document.getElementById("gmp-close")?.getAttribute("aria-label") ===
          "Close player"
    );
    await assertPreserved();
    await page.goForward();
    await page.waitForFunction(
      () =>
        location.pathname === "/pt/musicas/" &&
        document.getElementById("gmp-close")?.getAttribute("aria-label") ===
          "Fechar player"
    );
    await assertPreserved();
    await page.locator("#gmp-close").click();
    assert.equal(await page.locator("#gmp").isVisible(), false);
    assert.equal(
      await page.locator("#gmp-embed").getAttribute("src"),
      "about:blank"
    );
    assert.equal(
      await page
        .locator("body")
        .evaluate((body) => body.classList.contains("gmp-active")),
      false
    );
    // Reopening through history must reuse the catalog and existing player.
    await page.locator("#history-rail button").first().click();
    await page.locator("#gmp").waitFor({ state: "visible" });
    assert.equal(catalogRequests, 1);
    await page.locator("#gmp-close").click();
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1
      ),
      false,
      "music horizontal overflow"
    );
    await page.screenshot({
      path: `${out}/music-${width}.png`,
      fullPage: false,
    });
    return [
      {
        path: "/music/",
        viewport: width,
        status: response.status(),
        songs: catalog.length,
        catalogRequests,
        controls: "passed",
      },
      {
        path: "/pt/musicas/",
        viewport: width,
        status: 200,
        persistentNavigation: "passed",
        cancellation: "passed",
      },
    ];
  } finally {
    releaseCatalog();
    await page.unroute(catalogPattern, holdCatalog);
    await page.unroute(embedPattern, stubEmbed);
    page.off("request", countCatalog);
  }
}
