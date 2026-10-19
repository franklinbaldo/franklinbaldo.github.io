import assert from "node:assert/strict";

// Uses the smoke suite's browser and error recorder. A failed public Goodreads
// request is a supported state, so CI checks the fallback rather than the feed.
export async function checkBooks(page, base, out, width) {
  const results = [];
  const visibleBooks = () =>
    page.locator(".book-card:not([hidden])").evaluateAll((cards) =>
      cards.map((card) => ({
        title: card.dataset.title,
        rating: Number(card.dataset.rating) || 0,
        date: card.dataset.date,
        year: Number(card.dataset.year) || 0,
      }))
    );
  const readDate = (value) =>
    Date.parse((value || "").replace(/\//g, "-")) || 0;
  for (const [lang, path, title, countSuffix] of [
    ["en", "/books/", "Books", "books"],
    ["pt", "/pt/livros/", "Livros", "livros"],
  ]) {
    const response = await page.goto(base + path, {
      waitUntil: "domcontentloaded",
    });
    assert.equal(response.status(), 200, path);
    assert.equal(await page.locator("h1").innerText(), title, path);
    assert.equal(
      await page.locator("#books-page").getAttribute("data-lang"),
      lang,
      path
    );
    assert.equal(
      await page.locator('meta[name="generator"]').getAttribute("content"),
      "Zola",
      path
    );
    const count = await page.locator(".book-card").count();
    if (!count) {
      assert.equal(await page.locator(".books-fallback").isVisible(), true);
      assert.match(
        await page.locator(".books-fallback").innerText(),
        lang === "pt"
          ? /Não foi possível carregar os livros|Nenhum livro disponível/
          : /Couldn't load books|No books are available/
      );
      assert.equal(
        await page.locator(".books-fallback a").getAttribute("href"),
        "https://www.goodreads.com/user/show/5942034"
      );
      assert.equal(await page.locator("#sort-select").count(), 0);
    } else {
      await page.waitForFunction(
        () => document.getElementById("books-filter-status")?.textContent
      );
      const liked = (await visibleBooks()).length;
      const expectedLiked = await page
        .locator(".book-card")
        .evaluateAll(
          (cards) =>
            cards.filter((card) => Number(card.dataset.rating) >= 4).length
        );
      assert.equal(liked, expectedLiked, `${path}: favorites shown first`);
      await page.locator('[data-filter="all"]').click();
      const all = await visibleBooks();
      assert.equal(all.length, count, `${path}: all books`);
      assert.equal(
        await page.locator("#books-filter-status").innerText(),
        `${count} ${countSuffix}`
      );
      assert.equal(
        await page.locator('[data-filter="all"]').getAttribute("aria-pressed"),
        "true"
      );
      assert.equal(await page.locator(".book-card h2 a").count(), count);
      assert.equal(await page.locator(".book-card .author").count(), count);
      assert.equal(await page.locator(".book-card .cover-link").count(), count);
      const collator = new Intl.Collator(lang);
      for (const sort of [
        "rating-desc",
        "date-desc",
        "year-desc",
        "title-asc",
      ]) {
        const expected = [...all].sort((a, b) => {
          const primary =
            sort === "rating-desc"
              ? b.rating - a.rating
              : sort === "date-desc"
                ? readDate(b.date) - readDate(a.date)
                : sort === "year-desc"
                  ? b.year - a.year
                  : 0;
          return primary || collator.compare(a.title, b.title);
        });
        await page.locator("#sort-select").selectOption(sort);
        assert.deepEqual(await visibleBooks(), expected, `${path}: ${sort}`);
      }
      await page.evaluate(() => {
        document.dispatchEvent(new Event("zola:page-load"));
        document.dispatchEvent(new Event("zola:page-load"));
      });
      await page.addScriptTag({ url: `${base}/js/books.js` });
      assert.equal(
        await page.locator("#visible-count").innerText(),
        String(count),
        `${path}: repeated scripts/events preserve the selected filter`
      );
      await page.locator('[data-filter="liked"]').click();
      await page.locator("#sort-select").selectOption("rating-desc");
      assert.equal((await visibleBooks()).length, expectedLiked);
      assert.equal(
        await page.locator('[data-filter="all"]').getAttribute("aria-pressed"),
        "false"
      );
      const jsonLd = await page
        .locator('script[type="application/ld+json"]')
        .first()
        .textContent();
      assert.equal(JSON.parse(jsonLd).numberOfItems, expectedLiked);
    }
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1
      ),
      false,
      `${path}: horizontal overflow`
    );
    await page.screenshot({
      path: `${out}/books-${lang}-${width}.png`,
      fullPage: true,
    });
    results.push({
      path,
      viewport: width,
      status: response.status(),
      books: count,
      fallback: count === 0,
    });
  }

  // Traverse the existing native language switcher twice. A document property
  // confirms these are soft navigations, and shelf controls must rebind on return.
  await page.evaluate(() => {
    window.__booksSmokeNavigation = true;
  });
  for (const [lang, path] of [
    ["en", "/books/"],
    ["pt", "/pt/livros/"],
  ]) {
    await page.locator(".language-link").click();
    await page.waitForURL(new URL(path, base).href);
    await page.waitForFunction(
      (expected) =>
        document.getElementById("books-page")?.dataset.lang === expected,
      lang
    );
    assert.equal(
      await page.evaluate(() => window.__booksSmokeNavigation),
      true
    );
    if (await page.locator(".book-card").count()) {
      await page.waitForFunction(
        () => document.getElementById("books-filter-status")?.textContent
      );
      await page.locator('[data-filter="all"]').click();
      assert.equal(
        (await visibleBooks()).length,
        await page.locator(".book-card").count()
      );
      await page.locator("#sort-select").selectOption("title-asc");
      const titles = (await visibleBooks()).map((book) => book.title);
      assert.deepEqual(
        titles,
        [...titles].sort(new Intl.Collator(lang).compare)
      );
    } else
      assert.equal(await page.locator(".books-fallback").isVisible(), true);
  }
  await page.evaluate(() => {
    delete window.__booksSmokeNavigation;
  });
  return results;
}
