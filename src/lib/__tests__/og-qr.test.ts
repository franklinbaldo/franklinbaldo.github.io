import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// getQrPng's fallback chain (own slug -> language-home fallback -> null) is
// what keeps every OG card renderable even when a page's artistic QR hasn't
// been generated yet (generation happens out-of-band in a GitHub Action) --
// a broken fallback here would 404 or crash og-card.ts's build-time render
// for any page missing its own cached QR.
//
// CACHE_DIR is computed once at module-eval time from process.cwd(), so each
// test chdirs into a fresh tmp dir *before* a cache-busted import, matching
// the isolation pattern used throughout src/hronir/__tests__/.

let mod: typeof import("../og-qr.ts");
let tmpDir: string;
let realCwd: string;

beforeEach(async () => {
  tmpDir = fs.mkdtempSync(path.join(process.cwd(), ".tmp-og-qr-test-"));
  realCwd = process.cwd();
  process.chdir(tmpDir);
  fs.mkdirSync(".cache/qr", { recursive: true });
  mod = await import(`../og-qr.ts?t=${Date.now()}-${Math.random()}`);
});

afterEach(() => {
  process.chdir(realCwd);
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("getQrPng", () => {
  it("returns null when neither the slug nor the fallback has a cached QR", () => {
    assert.equal(
      mod.getQrPng({ slug: "missing", fallbackSlug: "also-missing" }),
      null
    );
  });

  it("returns the post's own cached QR when present", () => {
    const png = Buffer.from([1, 2, 3, 4]);
    fs.writeFileSync(".cache/qr/hello.png", png);
    const result = mod.getQrPng({ slug: "hello", fallbackSlug: "home" });
    assert.deepEqual(result, png);
  });

  it("falls back to the fallbackSlug's QR when the post has none of its own", () => {
    const homePng = Buffer.from([9, 9, 9]);
    fs.writeFileSync(".cache/qr/home.png", homePng);
    const result = mod.getQrPng({ slug: "no-qr-post", fallbackSlug: "home" });
    assert.deepEqual(result, homePng);
  });

  it("prefers the post's own QR over the fallback when both exist", () => {
    const ownPng = Buffer.from([1]);
    const homePng = Buffer.from([2]);
    fs.writeFileSync(".cache/qr/hello.png", ownPng);
    fs.writeFileSync(".cache/qr/home.png", homePng);
    const result = mod.getQrPng({ slug: "hello", fallbackSlug: "home" });
    assert.deepEqual(result, ownPng);
  });
});
