import test from "node:test";
import assert from "node:assert/strict";
import { renderArchive } from "./archive.mjs";
import { verifyArchiveHtml } from "./verify-archive.mjs";

const sample = renderArchive([
  { route: "/blog/one/", lang: "en", title: "One", date: "2026-10-18" },
  { route: "/pt/blog/um/", lang: "pt", title: "Um", date: "2026-10-18" },
]);
const en = sample.pages[0];
const wrap = (inner, lang = "en") =>
  '<!doctype html><html lang="' + lang + '"><body><main>' + inner + "</main></body></html>";
const body = '<h1>Archive</h1><p>English publications: 1.</p><ul><li><a href="/blog/one/">One</a></li></ul>';

test("native archive verifies real HTML links, heading, locale and count", () => {
  assert.deepEqual(verifyArchiveHtml(wrap(body), en, 1), {
    route: "/archive/", language: "en", published_links: 1,
  });
});
test("empty stub, duplicate/incorrect route, locale and heading fail", () => {
  assert.throws(() => verifyArchiveHtml(wrap("<h1>Archive</h1>"), en, 1), /links/);
  assert.throws(() => verifyArchiveHtml(wrap(body.replace("/blog/one/", "/blog/fake/")), en, 1), /links/);
  assert.throws(() => verifyArchiveHtml(wrap(body, "pt"), en, 1), /language/);
  assert.throws(() => verifyArchiveHtml(wrap(body.replace("<h1>Archive</h1>", "<h1>Other</h1>")), en, 1), /heading/);
  assert.throws(() => verifyArchiveHtml(wrap(body.replace("publications: 1", "publications: 2")), en, 1), /count/);
});
