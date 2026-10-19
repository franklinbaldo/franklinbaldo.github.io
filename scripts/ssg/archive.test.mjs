import test from "node:test";
import assert from "node:assert/strict";
import { archiveGroups, renderArchive, ARCHIVE_PER_PAGE } from "./archive.mjs";

const item = (id, lang, date = "2026-10-18", title = id) => ({
  route: (lang === "pt" ? "/pt/blog/" : "/blog/") + id + "/",
  lang, date, title,
});

test("bilingual archive uses one canonical source with stable 50-entry pages", () => {
  const entries = [
    ...Array.from({ length: 53 }, (_, i) => item("e" + String(i).padStart(2, "0"), "en")),
    ...Array.from({ length: 51 }, (_, i) => item("p" + String(i).padStart(2, "0"), "pt")),
  ];
  const result = renderArchive(entries);
  assert.equal(ARCHIVE_PER_PAGE, 50);
  assert.deepEqual(result.counts, { en: 53, pt: 51 });
  assert.deepEqual(result.pages.map((p) => p.route), [
    "/archive/", "/archive/page/2/", "/pt/archive/", "/pt/archive/page/2/",
  ]);
  assert.deepEqual(result.pages.map((p) => p.postRoutes.length), [50, 3, 50, 1]);
  assert.match(result.pages[0].body, /Arquivo em português/);
  assert.match(result.pages[2].body, /English archive/);
  assert.match(result.pages[0].body, /\[2\]\(\/archive\/page\/2\/\)/);
  assert.equal(result.pages[2].metadata.language, "pt");
  assert.equal(result.pages[2].metadata.translation_key, "ssg-archive");
  assert.ok(!("date" in result.pages[2].metadata), "listing must not be indexed as an article");
});

test("date descending and route ascending break ties independent of input order", () => {
  const pages = archiveGroups([
    item("z", "en", "2026-01-01"),
    item("a", "en", "2026-01-01"),
    item("b", "en", "2026-01-02"),
    item("x", "pt", "2026-01-03"),
  ], "en", 2);
  assert.deepEqual(pages.map((group) => group.map((e) => e.route)), [
    ["/blog/b/", "/blog/a/"], ["/blog/z/"],
  ]);
});

test("markdown link labels are escaped and cannot inject inline tags", () => {
  const doc = renderArchive([item("test", "en", "2026-01-02", "<script>[bad]"), item("teste", "pt")]);
  assert.ok(!doc.pages[0].body.includes("<script>"));
  assert.match(doc.pages[0].body, /\\<script\\>/);
  assert.match(doc.pages[0].body, /\\\[bad\\\]/);
});

test("bad routes, cross-language leaks, duplicate routes, malformed dates and empty locales fail closed", () => {
  const good = [item("a", "en"), item("b", "pt")];
  assert.throws(() => renderArchive([item("a", "en")]), /no entries for pt/);
  assert.throws(() => renderArchive([...good, item("a", "en")]), /Unsafe/);
  assert.throws(() => renderArchive([...good, { ...item("z", "pt"), route: "/blog/z/" }]), /Unsafe/);
  assert.throws(() => renderArchive([...good, { ...item("z", "en"), date: "tomorrow" }]), /Unsafe/);
  assert.throws(() => renderArchive([...good, { ...item("../x", "en") }]), /Unsafe/);
  assert.throws(() => archiveGroups(good, "en", 0), /Invalid/);
});
