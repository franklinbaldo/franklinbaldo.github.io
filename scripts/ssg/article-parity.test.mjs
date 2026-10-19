import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { readArticleHtml, compareArticle, compareCorpus } from "./article-parity.mjs";

const wrap = (kind, body, title = "Test Article", lang = "en") =>
  '<!doctype html><html lang="' + lang + '"><head><title>test</title></head><body>' +
  '<header><nav>Other content</nav></header><main><article class="reading-page">' +
  "<h1>" + title + "</h1>" +
  (kind === "zola" ? '<div data-zola-content>' : '<div class="prose">') +
  body + "</div></article></main></body></html>";
const base = wrap("zola", '<p>Hello world, real research!</p>');
const candidate = wrap("ssg", "<p>Hello world, real research!</p>");

test("compare normalized article content, not headers/navigation", () => {
  const result = compareArticle(base, candidate, "en");
  assert.equal(result.title_match, true);
  assert.equal(result.language_match, true);
  assert.equal(result.token_overlap, 1);
  assert.equal(result.baseline_words, 4);
});
test("HTML inside code and scripts is not treated as article prose", () => {
  const input = wrap("ssg", '<script>secretToken()</script><style>.abc{}</style><p>Good &amp; well</p>');
  const details = readArticleHtml(input, "ssg");
  assert.deepEqual(details.words, ["good", "well"]);
});
test("incorrect body, title and language are independently observable", () => {
  const input = wrap("ssg", "<p>Different publication!</p>", "Wrong", "pt-BR");
  const result = compareArticle(base, input, "en");
  assert.equal(result.title_match, false);
  assert.equal(result.language_match, false);
  assert.ok(result.token_overlap < 1);
});
test("missing body wrapper fails hard rather than reporting 100% parity", () => {
  assert.throws(() => readArticleHtml("<html><body><h1>X</h1></body></html>", "ssg"), /Missing/);
});
test("corpus reports missing, invalid and good outputs separately", () => {
  const root = mkdtempSync(join(tmpdir(), "ssg-article-parity-"));
  const zola = join(root, "zola");
  const ssg = join(root, "ssg");
  const manifest = { entries: [
    { route: "/blog/good/", lang: "en" },
    { route: "/pt/blog/missing/", lang: "pt" },
    { route: "/blog/malformed/", lang: "en" },
  ] };
  try {
    for (const route of manifest.entries) {
      const z = join(zola, route.route.slice(1));
      const s = join(ssg, route.route.slice(1));
      mkdirSync(z, { recursive: true });
      mkdirSync(s, { recursive: true });
      writeFileSync(join(z, "index.html"), base);
      if (route.route.endsWith("good/")) writeFileSync(join(s, "index.html"), candidate);
      else if (route.route.endsWith("malformed/")) writeFileSync(join(s, "index.html"), "<html><body>No article</body></html>");
    }
    const result = compareCorpus(manifest, zola, ssg);
    assert.equal(result.source_posts, 3);
    assert.equal(result.valid_articles_in_both_generators, 1);
    assert.equal(result.matching_title_and_language, 1);
    assert.deepEqual(result.missing_html, ["/pt/blog/missing/"]);
    assert.equal(result.invalid_html.length, 1);
    assert.equal(result.average_token_overlap, 1);
    assert.equal(result.public_cutover_allowed, false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
test("unsafe or duplicated source routes block a misleading report", () => {
  assert.throws(() => compareCorpus({ entries: [{route: "/blog/../bad/"}] }, "x", "y"), /Duplicate\/unsafe/);
  assert.throws(() => compareCorpus({ entries: [{route: "/blog/a/"}, {route: "/blog/a/"}] }, "x", "y"), /Duplicate\/unsafe/);
});
