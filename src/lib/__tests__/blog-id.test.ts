import { test } from "node:test";
import assert from "node:assert/strict";
import { generateBlogId } from "../blog-id.js";

test("generateBlogId: legacy folder version file strips to the slug", () => {
  assert.equal(generateBlogId("666/v-2026-06-09T20-24-29.mdx"), "666");
});

test("generateBlogId: legacy folder index file strips to the slug", () => {
  assert.equal(generateBlogId("666/index.md"), "666");
});

test("generateBlogId: RFC 0015 flat file strips its extension (regression)", () => {
  // Before the fix, a flat entry with no directory component didn't match
  // the legacy-only regex and kept its extension, producing id "666.mdx"
  // and building the page at the wrong URL (/blog/666.mdx/).
  assert.equal(generateBlogId("666.mdx"), "666");
  assert.equal(generateBlogId("666-en.mdx"), "666-en");
  assert.equal(generateBlogId("some-slug.md"), "some-slug");
});
