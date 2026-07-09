import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  getPostUuid,
  getPostUuidLegacy,
  getPostUuidPreOkfType,
  blobShaForPath,
  readBlob,
  readPostFromBlob,
  getPostUuidFromBlob,
  getPostUuidLegacyFromBlob,
  getPostUuidPreOkfTypeFromBlob,
} from "../posts.js";

// RFC 0015 (single-file model): once a version loses its duel it stops being
// a file — its identity must still resolve identically via its git blob.
// This is the load-bearing invariant every downstream piece (history.ts,
// permalinks, doctor) assumes holds; a mismatch here would silently break
// permalink resolution and rate-file matching for every archived version.

// Any already-committed content file works — the invariant doesn't depend on
// which one. Picking a small, stable existing post keeps the test fast.
const REAL_FILE = "src/content/blog/events-welcome/v-2026-06-10T05-09-44.md";

describe("blob-backed identity matches file-backed identity", () => {
  it("uuid/legacyUuid/preOkfUuid agree for a real committed file", () => {
    const sha = blobShaForPath(REAL_FILE);
    assert.match(sha, /^[0-9a-f]{40}$/, "hash-object should return a sha1");

    assert.equal(getPostUuidFromBlob(sha), getPostUuid(REAL_FILE));
    assert.equal(getPostUuidLegacyFromBlob(sha), getPostUuidLegacy(REAL_FILE));
    assert.equal(
      getPostUuidPreOkfTypeFromBlob(sha),
      getPostUuidPreOkfType(REAL_FILE)
    );
  });

  it("readBlob returns byte-identical content to the file", () => {
    const sha = blobShaForPath(REAL_FILE);
    const fromBlob = readBlob(sha);
    const fromFile = fs.readFileSync(REAL_FILE, "utf8");
    assert.equal(fromBlob, fromFile);
  });

  it("readPostFromBlob parses the same frontmatter as readPost", () => {
    const sha = blobShaForPath(REAL_FILE);
    const data = readPostFromBlob(sha);
    assert.equal(typeof data.title, "string");
    assert.ok(data.title.length > 0);
  });
});

describe("blobShaForPath -w persists the object (not just hashes it)", () => {
  const tmpDir = fs.mkdtempSync(path.join(process.cwd(), ".tmp-blob-test-"));
  const tmpFile = path.join(tmpDir, "scratch.mdx");

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("an uncommitted, never-before-seen file's blob is retrievable after hashing", () => {
    const uniqueBody = `unique-content-${Date.now()}-${Math.random()}`;
    fs.writeFileSync(
      tmpFile,
      `---\ntitle: "scratch"\ndescription: "scratch"\ndate: 2026-01-01\ntype: "Blog Post"\n---\n${uniqueBody}\n`
    );
    const sha = blobShaForPath(tmpFile);
    // Plain `git hash-object` (no -w) would compute this same sha but NOT
    // store it — readBlob would then throw "not a valid object name" for
    // content that was never committed anywhere else. This proves -w
    // actually persisted it.
    const content = readBlob(sha);
    assert.match(content, new RegExp(uniqueBody));
  });
});
