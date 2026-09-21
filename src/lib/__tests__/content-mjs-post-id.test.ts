import { test } from "node:test";
import assert from "node:assert/strict";
import { postIdFromPath, BLOG_DIR } from "../../../scripts/lib/content.mjs";
import path from "node:path";

// scripts/lib/content.mjs runs under bare `node` (no tsx/esm), so it can't
// import the TS module in src/lib/blog-id.ts and instead duplicates the
// same id-generation regex in plain JS (see the comment on postIdFromPath).
// This test guards that duplicate directly.

test("postIdFromPath: legacy folder version file strips to the slug", () => {
  assert.equal(
    postIdFromPath(path.join(BLOG_DIR, "666/v-2026-06-09T20-24-29.mdx")),
    "666"
  );
});

test("postIdFromPath: legacy folder index file strips to the slug", () => {
  assert.equal(postIdFromPath(path.join(BLOG_DIR, "666/index.md")), "666");
});

test("postIdFromPath: RFC 0015 flat file strips its extension (regression)", () => {
  assert.equal(postIdFromPath(path.join(BLOG_DIR, "666.mdx")), "666");
  assert.equal(postIdFromPath(path.join(BLOG_DIR, "666-en.mdx")), "666-en");
});
