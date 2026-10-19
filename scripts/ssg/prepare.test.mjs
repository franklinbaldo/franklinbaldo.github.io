import test from "node:test";
import assert from "node:assert/strict";
import { markdownDocument, metadataForPost, targetForRoute } from "./prepare.mjs";

test("canonical bilingual routes map to matching SSG directory indexes", () => {
  assert.equal(targetForRoute("/blog/abc/"), "blog/abc/index.md");
  assert.equal(targetForRoute("/pt/blog/abc/"), "pt/blog/abc/index.md");
});
test("route conversion rejects traversal and malformed paths", () => {
  for (const route of ["/blog/../secret/", "/blog/../../", "/blog//", "/bad/", "/pt/blog/a%2fb/", "/pt/blog/a%2Fb/", "/blog/a%5cfoo/"]) {
    assert.throws(() => targetForRoute(route));
  }
});
test("publication metadata reuses canonical translation identity", () => {
  const metadata = metadataForPost({
    title: "Ensaio", description: "Resumo", date: "2026-10-18",
    lang: "pt", tags: ["ciência"], translationKey: "shared-id"
  }, "ensaio");
  assert.equal(metadata.translation_key,"shared-id");
  assert.equal(metadata.language,"pt");
  assert.equal(metadata.layout,"post");
  assert.equal(metadata.schema,"post");
  assert.equal(metadata.date,"2026-10-18");
  assert.equal(metadata.name,"Ensaio");
  assert.equal(metadata.news_publication_date,"2026-10-18");
  assert.deepEqual(metadata.tags,["ciência"]);
  const doc = markdownDocument(metadata,"# Teste\n");
  assert.match(doc,/translation_key: shared-id/);
  assert.match(doc,/# Teste/);
});
test("missing required metadata cannot become a public page", () => {
  assert.throws(() => metadataForPost({ title:"Only title",date:"2026-10-18" },"x"));
  assert.throws(() => metadataForPost({ title:"x",description:"y",date:"broken" },"x"));
  assert.throws(() => metadataForPost({ title:"x",description:"y",date:"2026-10-18",lang:"es" },"x"));
});
