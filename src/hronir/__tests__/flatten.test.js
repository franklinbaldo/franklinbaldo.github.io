import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// RFC 0015 §4 Fase 1, redesigned as an incremental per-slug command
// (flatten) rather than a one-shot cutover. These tests exercise it
// directly against hand-built legacy-layout fixtures — a real rate-file
// corpus isn't needed since flatten only reads ranking data to classify
// challengers as "pending" vs "already decided" (mirroring prune()'s own
// PRUNE_MIN_DUELS/PRUNE_MARGIN thresholds), and computeVersionRatings()
// against zero rate files just returns an empty map, which correctly
// classifies every challenger as pending (n=0 never clears PRUNE_MIN_DUELS).

let cmds, sel, history;
let tmpDir, realCwd;

const post = (title, extra = "") => `---
title: "${title}"
description: "D"
date: 2026-01-01
type: "Blog Post"
${extra}
---
Body of ${title}.
`;

beforeEach(async () => {
  tmpDir = fs.mkdtempSync(path.join(process.cwd(), ".tmp-flatten-test-"));
  realCwd = process.cwd();
  process.chdir(tmpDir);
  const bust = `?t=${Date.now()}-${Math.random()}`;
  cmds = await import(`../commands.ts${bust}`);
  sel = await import(`../selection.ts${bust}`);
  history = await import(`../history.ts${bust}`);
  fs.mkdirSync("src/content/blog", { recursive: true });
});

afterEach(() => {
  process.chdir(realCwd);
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// Populates versions-selected.json via the real select() call rather than
// hand-writing the JSON: select()'s writeSelection() refreshes selection.ts's
// module-level _selectionCache as a side effect of writing, but only for
// whichever selection.ts instance select() itself resolved to (Node caches
// commands.ts's fixed `./selection.js` import per-process — cache-busting
// commands.ts itself, as beforeEach does, doesn't cache-bust its
// dependencies). Routing every fixture write through cmds.select() instead
// of a side-channel fs write keeps flatten()'s later read consistent with
// whatever selection.js instance is currently live, regardless of what any
// earlier test in this file happened to touch first.
function selectAll() {
  cmds.select({});
}

describe("flatten — happy path, single unopposed slug", () => {
  it("moves the selected file to <slug>.mdx and removes the empty directory", () => {
    fs.mkdirSync("src/content/blog/hello", { recursive: true });
    fs.writeFileSync(
      "src/content/blog/hello/v-2026-01-01T00-00-00.mdx",
      post("hello")
    );
    selectAll();

    cmds.flatten("hello", {});

    assert.equal(sel.flatCanonicalPath("hello"), "src/content/blog/hello.mdx");
    assert.equal(fs.existsSync("src/content/blog/hello"), false);
    const versions = sel.listSlugVersions("hello");
    assert.equal(versions.length, 1);
    assert.equal(versions[0].selected, true);
  });

  it("is idempotent: flattening an already-flat slug is a safe no-op", () => {
    fs.writeFileSync("src/content/blog/hello.mdx", post("hello"));
    assert.doesNotThrow(() => cmds.flatten("hello", {}));
    assert.equal(sel.flatCanonicalPath("hello"), "src/content/blog/hello.mdx");
  });

  it("dry-run changes nothing on disk", () => {
    fs.mkdirSync("src/content/blog/hello", { recursive: true });
    fs.writeFileSync(
      "src/content/blog/hello/v-2026-01-01T00-00-00.mdx",
      post("hello")
    );
    selectAll();

    cmds.flatten("hello", { dryRun: true });

    assert.equal(sel.flatCanonicalPath("hello"), null);
    assert.equal(fs.existsSync("src/content/blog/hello"), true);
    assert.equal(
      fs.existsSync("src/content/blog/hello/v-2026-01-01T00-00-00.mdx"),
      true
    );
  });
});

describe("flatten — pending vs. already-decided challengers", () => {
  it("a challenger with zero duels migrates to .routines/hronir/drafts/<slug>/, not deleted", () => {
    fs.mkdirSync("src/content/blog/hello", { recursive: true });
    fs.writeFileSync(
      "src/content/blog/hello/v-2026-01-01T00-00-00.mdx",
      post("selected")
    );
    fs.writeFileSync(
      "src/content/blog/hello/v-2026-01-02T00-00-00.mdx",
      post("untested challenger")
    );
    selectAll();

    cmds.flatten("hello", {});

    const after = sel.listSlugVersions("hello");
    assert.equal(
      after.length,
      2,
      "pending challenger must survive, not be deleted"
    );
    const draft = after.find((v) => !v.selected);
    assert.equal(
      draft.path,
      ".routines/hronir/drafts/hello/v-2026-01-02T00-00-00.mdx"
    );
    assert.match(fs.readFileSync(draft.path, "utf8"), /untested challenger/);
  });
});

describe("flatten — guards", () => {
  it("refuses a slug with no selection entry", () => {
    fs.mkdirSync("src/content/blog/no-selection", { recursive: true });
    fs.writeFileSync(
      "src/content/blog/no-selection/v-2026-01-01T00-00-00.mdx",
      post("x")
    );
    cmds.flatten("no-selection", {});
    assert.equal(sel.flatCanonicalPath("no-selection"), null);
    assert.equal(fs.existsSync("src/content/blog/no-selection"), true);
  });

  it("a slug whose only version is draft:true never gets flattened (RFC 0015 §1 case)", () => {
    // select()'s own fallbackIncumbent only considers published versions
    // (`published.length === 0` → returns null), so a draft-only slug
    // never gets a selection entry in the first place — this exercises
    // flatten()'s first guard ("no selection entry"), the real-world path
    // this scenario actually takes. flatten() also carries a second,
    // defense-in-depth guard directly on `!selected.published` for a
    // hand-edited or otherwise-corrupted selection.json that isn't
    // reachable through the normal select() flow, so it has no fixture
    // here — there's no legitimate way to construct the state it guards.
    fs.mkdirSync("src/content/blog/still-draft", { recursive: true });
    fs.writeFileSync(
      "src/content/blog/still-draft/v-2026-01-01T00-00-00.mdx",
      post("x", "draft: true")
    );
    selectAll();

    cmds.flatten("still-draft", {});

    assert.equal(sel.flatCanonicalPath("still-draft"), null);
    assert.equal(fs.existsSync("src/content/blog/still-draft"), true);
  });

  it("refuses a slug with a root-level orphan file instead of silently overwriting it (RFC 0015 §1 case)", () => {
    fs.mkdirSync("src/content/blog/orphaned", { recursive: true });
    fs.writeFileSync(
      "src/content/blog/orphaned/v-2026-01-01T00-00-00.mdx",
      post("real versioned content")
    );
    fs.writeFileSync(
      "src/content/blog/orphaned.md",
      post("unrelated pre-existing orphan")
    );
    selectAll();

    cmds.flatten("orphaned", {});

    // Neither file was touched — the real versioned content is still in
    // its directory, and the pre-existing orphan is untouched.
    assert.equal(fs.existsSync("src/content/blog/orphaned"), true);
    assert.equal(
      fs.existsSync("src/content/blog/orphaned/v-2026-01-01T00-00-00.mdx"),
      true
    );
    assert.match(
      fs.readFileSync("src/content/blog/orphaned.md", "utf8"),
      /unrelated pre-existing orphan/
    );
  });
});

describe("flatten — batch mode (no --slug)", () => {
  it("flattens every eligible legacy slug, skipping ineligible ones", () => {
    fs.mkdirSync("src/content/blog/ready-one", { recursive: true });
    fs.writeFileSync(
      "src/content/blog/ready-one/v-2026-01-01T00-00-00.mdx",
      post("a")
    );
    fs.mkdirSync("src/content/blog/ready-two", { recursive: true });
    fs.writeFileSync(
      "src/content/blog/ready-two/v-2026-01-01T00-00-00.mdx",
      post("b")
    );
    // draft:true so select() never gives it a selection entry — the
    // realistic way for a slug to be ineligible for flattening.
    fs.mkdirSync("src/content/blog/not-selected", { recursive: true });
    fs.writeFileSync(
      "src/content/blog/not-selected/v-2026-01-01T00-00-00.mdx",
      post("c", "draft: true")
    );
    selectAll();

    cmds.flatten(null, {});

    assert.ok(sel.flatCanonicalPath("ready-one"));
    assert.ok(sel.flatCanonicalPath("ready-two"));
    assert.equal(sel.flatCanonicalPath("not-selected"), null);
    assert.equal(fs.existsSync("src/content/blog/not-selected"), true);
  });
});
