import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// versions.ts resolves a content "id" (a bare slug, or a legacy "<slug>/v-<ts>"
// version id) to the on-disk file backing it -- the load-bearing lookup behind
// every /blog/<slug>/ and /blog/<slug>/v/<uuid>/ permalink. A regression here
// breaks permalinks sitewide, so it's tested against real fixture files rather
// than mocked: fileForId's own logic IS the file-resolution priority order
// (flat file -> versions-selected.json entry -> pre-migration index.* -> null),
// so mocking flatCanonicalPath away would test nothing.
//
// Isolated the same way src/hronir/__tests__/slug-versions.test.ts isolates
// selection.ts: a fresh tmp cwd + a cache-busted dynamic import per test,
// since versions.ts's private `selection()` cache (like history.ts's) is
// memoized per module instance.

let mod: typeof import("../versions.ts");
let tmpDir: string;
let realCwd: string;

const FRONTMATTER = `---
title: "T"
description: "D"
date: 2026-01-01
type: "Blog Post"
---
Body text.
`;

beforeEach(async () => {
  tmpDir = fs.mkdtempSync(path.join(process.cwd(), ".tmp-versions-test-"));
  realCwd = process.cwd();
  process.chdir(tmpDir);
  mod = await import(`../versions.ts?t=${Date.now()}-${Math.random()}`);
  fs.mkdirSync("src/content/blog", { recursive: true });
});

afterEach(() => {
  process.chdir(realCwd);
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("slugOf", () => {
  it("returns the id itself when there is no version suffix", () => {
    assert.equal(mod.slugOf("hello"), "hello");
  });

  it("strips a /v-<timestamp> version suffix", () => {
    assert.equal(mod.slugOf("hello/v-2026-01-01T00-00-00"), "hello");
  });

  it("takes only the first path segment for a malformed multi-slash id", () => {
    assert.equal(mod.slugOf("a/b/c"), "a");
  });

  it("returns an empty string for an empty id rather than throwing", () => {
    assert.equal(mod.slugOf(""), "");
  });
});

describe("liveHref / versionHref", () => {
  it("liveHref defaults to the unprefixed (English) URL", () => {
    assert.equal(mod.liveHref("hello"), "/blog/hello/");
  });

  it("liveHref prefixes /pt for Portuguese", () => {
    assert.equal(mod.liveHref("hello", "pt"), "/pt/blog/hello/");
  });

  it("liveHref treats any non-pt lang as the default, not just 'en'", () => {
    assert.equal(mod.liveHref("hello", "en"), "/blog/hello/");
    assert.equal(mod.liveHref("hello", "fr"), "/blog/hello/");
  });

  it("versionHref embeds the uuid and respects lang the same way", () => {
    assert.equal(mod.versionHref("hello", "uuid-1"), "/blog/hello/v/uuid-1/");
    assert.equal(
      mod.versionHref("hello", "uuid-1", "pt"),
      "/pt/blog/hello/v/uuid-1/"
    );
  });
});

describe("fileForId", () => {
  it("resolves a flat canonical file for a bare slug", () => {
    fs.writeFileSync("src/content/blog/hello.mdx", FRONTMATTER);
    assert.equal(mod.fileForId("hello"), "src/content/blog/hello.mdx");
  });

  it("resolves a legacy per-version sibling file for a <slug>/v-<ts> id", () => {
    fs.mkdirSync("src/content/blog/hello", { recursive: true });
    fs.writeFileSync(
      "src/content/blog/hello/v-2026-01-01T00-00-00.mdx",
      FRONTMATTER
    );
    assert.equal(
      mod.fileForId("hello/v-2026-01-01T00-00-00"),
      "src/content/blog/hello/v-2026-01-01T00-00-00.mdx"
    );
  });

  it("falls back to versions-selected.json when there is no flat file", () => {
    fs.mkdirSync("src/content/blog/legacy-slug", { recursive: true });
    fs.writeFileSync(
      "src/content/blog/legacy-slug/v-2026-01-01T00-00-00.mdx",
      FRONTMATTER
    );
    fs.mkdirSync("src/generated", { recursive: true });
    fs.writeFileSync(
      "src/generated/versions-selected.json",
      JSON.stringify({
        "legacy-slug": { file: "legacy-slug/v-2026-01-01T00-00-00.mdx" },
      })
    );
    assert.equal(
      mod.fileForId("legacy-slug"),
      "src/content/blog/legacy-slug/v-2026-01-01T00-00-00.mdx"
    );
  });

  it("ignores the _meta key in versions-selected.json", () => {
    fs.mkdirSync("src/generated", { recursive: true });
    fs.writeFileSync(
      "src/generated/versions-selected.json",
      JSON.stringify({ _meta: { file: "should-not-resolve.mdx" } })
    );
    assert.equal(mod.fileForId("_meta"), null);
  });

  it("falls back to the pre-migration <slug>/index.* layout", () => {
    fs.mkdirSync("src/content/blog/old-slug", { recursive: true });
    fs.writeFileSync("src/content/blog/old-slug/index.md", FRONTMATTER);
    assert.equal(
      mod.fileForId("old-slug"),
      "src/content/blog/old-slug/index.md"
    );
  });

  it("returns null for an id that resolves through none of the layouts", () => {
    assert.equal(mod.fileForId("does-not-exist"), null);
    assert.equal(mod.fileForId("does-not-exist/v-2026-01-01T00-00-00"), null);
  });
});

describe("uuidForId / legacyUuidForId / preOkfUuidForId", () => {
  it("return null when the id does not resolve to a file", () => {
    assert.equal(mod.uuidForId("does-not-exist"), null);
    assert.equal(mod.legacyUuidForId("does-not-exist"), null);
    assert.equal(mod.preOkfUuidForId("does-not-exist"), null);
  });

  it("return a stable, well-formed uuid for a resolvable file", () => {
    fs.writeFileSync("src/content/blog/hello.mdx", FRONTMATTER);
    const uuid = mod.uuidForId("hello");
    assert.match(
      uuid ?? "",
      /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      "expected a v5 uuid"
    );
    // Same content, same id -> same uuid (content-addressed identity).
    assert.equal(mod.uuidForId("hello"), uuid);
  });
});

describe("archivedContentUrls", () => {
  it("returns null/null when the id does not resolve", () => {
    assert.deepEqual(mod.archivedContentUrls("does-not-exist"), {
      rawUrl: null,
      githubUrl: null,
    });
  });

  it("builds raw and github URLs rooted at the resolved path", () => {
    fs.writeFileSync("src/content/blog/hello.mdx", FRONTMATTER);
    const urls = mod.archivedContentUrls("hello");
    assert.equal(
      urls.rawUrl,
      `https://raw.githubusercontent.com/${mod.GITHUB_REPO}/${mod.GITHUB_BRANCH}/src/content/blog/hello.mdx`
    );
    assert.equal(
      urls.githubUrl,
      `https://github.com/${mod.GITHUB_REPO}/blob/${mod.GITHUB_BRANCH}/src/content/blog/hello.mdx`
    );
  });
});
