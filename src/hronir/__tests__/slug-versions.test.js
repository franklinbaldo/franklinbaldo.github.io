import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// RFC 0015 single-file model: listSlugVersions/listAllVersionSlugs must
// treat a flat slug (single <slug>.mdx + drafts in .routines/hronir/drafts/)
// and a legacy slug (src/content/blog/<slug>/{v-*} + versions-selected.json)
// identically from the caller's perspective — that equivalence is what lets
// consumer rewrites ship independently of flattening.

let sel;
let tmpDir, realCwd;

const FRONTMATTER = (overrides = "") => `---
title: "T"
description: "D"
date: 2026-01-01
type: "Blog Post"
${overrides}
---
Body text.
`;

beforeEach(async () => {
  tmpDir = fs.mkdtempSync(path.join(process.cwd(), ".tmp-slugver-test-"));
  realCwd = process.cwd();
  process.chdir(tmpDir);
  sel = await import(`../selection.ts?t=${Date.now()}-${Math.random()}`);
  fs.mkdirSync("src/content/blog", { recursive: true });
});

afterEach(() => {
  process.chdir(realCwd);
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("flat layout", () => {
  it("flatCanonicalPath finds a flattened slug's file", () => {
    fs.writeFileSync("src/content/blog/hello.mdx", FRONTMATTER());
    assert.equal(sel.flatCanonicalPath("hello"), "src/content/blog/hello.mdx");
    assert.equal(sel.flatCanonicalPath("nope"), null);
  });

  it("listSlugVersions returns just the canonical when there are no drafts", () => {
    fs.writeFileSync("src/content/blog/hello.mdx", FRONTMATTER());
    const versions = sel.listSlugVersions("hello");
    assert.equal(versions.length, 1);
    assert.equal(versions[0].selected, true);
    assert.equal(versions[0].slug, "hello");
    assert.equal(versions[0].path, "src/content/blog/hello.mdx");
  });

  it("listSlugVersions includes drafts from .routines/hronir/drafts/<slug>/", () => {
    // Draft body must differ from canonical's — identical content (even with
    // a different `supersedes` value, which is excluded from uuid
    // computation) hashes to the same uuid, which listDraftsForSlug's
    // self-heal logic (correctly) treats as an already-folded stray and
    // deletes. See fold-back.test.js for that behavior tested directly.
    fs.writeFileSync("src/content/blog/hello.mdx", FRONTMATTER());
    fs.mkdirSync(".routines/hronir/drafts/hello", { recursive: true });
    fs.writeFileSync(
      ".routines/hronir/drafts/hello/v-2026-01-02T00-00-00.mdx",
      FRONTMATTER('supersedes: "whatever"').replace(
        "Body text.",
        "Different draft body."
      )
    );
    const versions = sel.listSlugVersions("hello");
    assert.equal(versions.length, 2);
    const canonical = versions.find((v) => v.selected);
    const draft = versions.find((v) => !v.selected);
    assert.ok(canonical);
    assert.ok(draft);
    assert.equal(draft.slug, "hello");
    assert.equal(
      draft.path,
      ".routines/hronir/drafts/hello/v-2026-01-02T00-00-00.mdx"
    );
  });

  it("listAllVersionSlugs includes flat slugs", () => {
    fs.writeFileSync("src/content/blog/hello.mdx", FRONTMATTER());
    fs.writeFileSync("src/content/blog/world.md", FRONTMATTER());
    const slugs = sel.listAllVersionSlugs();
    assert.ok(slugs.includes("hello"));
    assert.ok(slugs.includes("world"));
  });

  it("slugForContentPath resolves a flat canonical path", () => {
    assert.equal(sel.slugForContentPath("src/content/blog/hello.mdx"), "hello");
  });

  it("slugForContentPath resolves a draft path", () => {
    assert.equal(
      sel.slugForContentPath(".routines/hronir/drafts/hello/v-x.mdx"),
      "hello"
    );
  });
});

describe("legacy layout (unchanged behavior)", () => {
  it("listSlugVersions falls back to the directory + selection.json path", () => {
    fs.mkdirSync("src/content/blog/legacy-slug", { recursive: true });
    fs.writeFileSync(
      "src/content/blog/legacy-slug/v-2026-01-01T00-00-00.mdx",
      FRONTMATTER()
    );
    fs.writeFileSync(
      "src/content/blog/legacy-slug/v-2026-01-02T00-00-00.mdx",
      FRONTMATTER('draftCreatedAt: "2026-01-02T00:00:00.000Z"')
    );
    fs.mkdirSync("src/generated", { recursive: true });
    fs.writeFileSync(
      "src/generated/versions-selected.json",
      JSON.stringify({
        _meta: { schema: "selection-v1", generatedAt: "2026-01-01T00:00:00Z" },
        "legacy-slug": {
          file: "legacy-slug/v-2026-01-01T00-00-00.mdx",
          uuid: "irrelevant-for-this-test",
        },
      })
    );
    const versions = sel.listSlugVersions("legacy-slug");
    assert.equal(versions.length, 2);
    const canonical = versions.find((v) => v.selected);
    assert.equal(canonical.file, "legacy-slug/v-2026-01-01T00-00-00.mdx");
  });

  it("slugForContentPath resolves a legacy sibling path", () => {
    assert.equal(
      sel.slugForContentPath(
        "src/content/blog/legacy-slug/v-2026-01-01T00-00-00.mdx"
      ),
      "legacy-slug"
    );
  });

  it("a root-level orphan file does not shadow a real legacy directory (regression: two real repo slugs hit this)", () => {
    // src/content/blog/delegando-para-agentes.md and
    // src/content/blog/the-art-of-delegation.md predate the version system
    // and sit at the content root *alongside* a real
    // src/content/blog/<slug>/v-*.md directory — a pre-existing, documented
    // artifact (RFC 0015 §1), not something flattening created. Naively
    // treating the root file as "the" flat canonical would make
    // listSlugVersions (and therefore select()) silently ignore the real
    // versioned content and drop the slug from versions-selected.json
    // entirely — caught live: `select` went from 207 to 205 slugs before
    // this fix.
    fs.mkdirSync("src/content/blog/orphaned-slug", { recursive: true });
    fs.writeFileSync(
      "src/content/blog/orphaned-slug/v-2026-01-01T00-00-00.md",
      FRONTMATTER()
    );
    fs.writeFileSync(
      "src/content/blog/orphaned-slug.md",
      FRONTMATTER().replace("Body text.", "Unrelated orphan content.")
    );

    assert.equal(
      sel.flatCanonicalPath("orphaned-slug"),
      null,
      "a slug with a real legacy directory must never be treated as flat"
    );

    const versions = sel.listSlugVersions("orphaned-slug");
    assert.equal(versions.length, 1);
    assert.equal(
      versions[0].path,
      "src/content/blog/orphaned-slug/v-2026-01-01T00-00-00.md",
      "must resolve to the real versioned file, not the root-level orphan"
    );
  });
});

describe("listAllVersionSlugs unions both layouts", () => {
  it("sees a flat slug and a legacy slug together", () => {
    fs.writeFileSync("src/content/blog/flat-one.mdx", FRONTMATTER());
    fs.mkdirSync("src/content/blog/legacy-one", { recursive: true });
    fs.writeFileSync(
      "src/content/blog/legacy-one/v-2026-01-01T00-00-00.mdx",
      FRONTMATTER()
    );
    const slugs = sel.listAllVersionSlugs();
    assert.ok(slugs.includes("flat-one"));
    assert.ok(slugs.includes("legacy-one"));
  });
});
