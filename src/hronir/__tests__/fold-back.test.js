import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// The crash-injection test RFC 0015 §3.2/§4 flagged as having zero
// precedent in this repo: RFC 0010's promote/promoteFile did
// rename-then-write-then-unlink, and a crash between steps could leave a
// slug with no canonical file at all, or two files claiming the same UUID
// (achado V3). RFC 0010 sidestepped this by never physically swapping file
// content. foldBack (selection.ts) has to actually do the swap, so it has
// to actually survive a crash at every point in the sequence.
//
// A real "kill -9 mid-syscall" test isn't reproducible in a synchronous JS
// unit test, so this takes the standard alternative: construct, by hand,
// the exact on-disk state a crash at each step would leave behind, then
// assert two things about that state — (1) the canonical file exists and
// parses (the specific failure mode achado V3 described: "sem canônica"),
// and (2) the next normal read (listSlugVersions) converges to a single,
// unambiguous, non-duplicated version set (the other half: "ou com UUID
// duplicado").

let sel, history;
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
  tmpDir = fs.mkdtempSync(path.join(process.cwd(), ".tmp-foldback-test-"));
  realCwd = process.cwd();
  process.chdir(tmpDir);
  const bust = `?t=${Date.now()}-${Math.random()}`;
  sel = await import(`../selection.ts${bust}`);
  history = await import(`../history.ts${bust}`);
  fs.mkdirSync("src/content/blog", { recursive: true });
  fs.mkdirSync(".routines/hronir/drafts/hello", { recursive: true });
  fs.writeFileSync("src/content/blog/hello.mdx", post("old canonical"));
  fs.writeFileSync(
    ".routines/hronir/drafts/hello/v-2026-01-02T00-00-00.mdx",
    post("new winner", 'supersedes: "whatever"')
  );
});

afterEach(() => {
  process.chdir(realCwd);
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function assertCanonicalIsWellFormed(slug, expectTitle) {
  const p = sel.flatCanonicalPath(slug);
  assert.ok(
    p,
    `${slug} must have a canonical file — this is the achado V3 failure mode`
  );
  const raw = fs.readFileSync(p, "utf8");
  assert.match(
    raw,
    /^---\n/,
    "canonical content must be well-formed frontmatter"
  );
  if (expectTitle) assert.match(raw, new RegExp(`title: "${expectTitle}"`));
}

function assertNoDuplicateUuids(slug) {
  const versions = sel.listSlugVersions(slug);
  const uuids = versions.map((v) => v.uuid);
  assert.equal(
    new Set(uuids).size,
    uuids.length,
    "no two live versions of a slug may share a uuid — this is the other achado V3 failure mode"
  );
  assert.equal(
    versions.filter((v) => v.selected).length,
    1,
    "exactly one version must be canonical"
  );
}

describe("foldBack — happy path", () => {
  it("winner's content becomes canonical, old canonical is archived, draft is gone", () => {
    const winner = sel.listSlugVersions("hello").find((v) => !v.selected);
    const oldCanonicalUuid = sel
      .listSlugVersions("hello")
      .find((v) => v.selected).uuid;

    sel.foldBack("hello", winner);

    assertCanonicalIsWellFormed("hello", "new winner");
    assertNoDuplicateUuids("hello");
    assert.equal(
      fs.existsSync(winner.path),
      false,
      "draft file must be removed"
    );

    const archived = history.historyEntryForUuid(oldCanonicalUuid);
    assert.ok(archived, "the outgoing canonical must be archived to history");
    assert.equal(archived.title, "old canonical");
  });

  it("is idempotent when winner is already selected (no-op, not an error)", () => {
    const canonical = sel.listSlugVersions("hello").find((v) => v.selected);
    assert.doesNotThrow(() => sel.foldBack("hello", canonical));
    assertCanonicalIsWellFormed("hello", "old canonical");
  });

  it("throws instead of silently no-oping when the slug isn't flattened", () => {
    fs.mkdirSync("src/content/blog/legacy-slug", { recursive: true });
    fs.writeFileSync(
      "src/content/blog/legacy-slug/v-2026-01-01T00-00-00.mdx",
      post("x")
    );
    const fakeWinner = {
      slug: "legacy-slug",
      path: "src/content/blog/legacy-slug/v-2026-01-01T00-00-00.mdx",
      file: "legacy-slug/v-2026-01-01T00-00-00.mdx",
      uuid: "x",
      legacyUuid: "x",
      preOkfUuid: "x",
      selected: false,
      published: true,
      draftCreatedAt: null,
      translationKey: null,
      lang: "en",
    };
    assert.throws(
      () => sel.foldBack("legacy-slug", fakeWinner),
      /não está achatado/
    );
  });
});

describe("foldBack — crash-injected intermediate states", () => {
  it("crash before any write: canonical and draft are both untouched, no phantom temp file confuses readers", () => {
    // Simulates a crash during registerHistory (the very first mutation) —
    // nothing filesystem-visible related to the swap has happened yet,
    // except possibly a leftover temp file from a *different* earlier
    // attempt. Prove a stray temp file doesn't get mistaken for a real
    // canonical or draft.
    fs.writeFileSync(
      "src/content/blog/.hello.mdx.tmp-12345-999",
      post("half-written garbage")
    );
    assertCanonicalIsWellFormed("hello", "old canonical");
    assertNoDuplicateUuids("hello");
    const versions = sel.listSlugVersions("hello");
    assert.equal(
      versions.length,
      2,
      "stray temp file must not appear as a version"
    );
  });

  it("crash after atomic rename, before unlinking the draft: reader self-heals the stray draft", () => {
    // Hand-construct exactly what foldBack's rename step leaves behind if
    // the process dies right after it: canonical already has the winner's
    // content, but the draft file — untouched by the rename, which only
    // touches the temp file and the canonical path — still sits there with
    // the same content, so it now has the same uuid as the canonical.
    const winnerContent = post("new winner", 'supersedes: "whatever"');
    fs.writeFileSync("src/content/blog/hello.mdx", winnerContent); // simulates the completed rename
    // draft file at .routines/hronir/drafts/hello/v-...mdx already has this
    // exact content from beforeEach — matching the real sequence, where the
    // draft's content is what got copied into the canonical.

    assertCanonicalIsWellFormed("hello", "new winner");
    assertNoDuplicateUuids("hello");

    const versions = sel.listSlugVersions("hello");
    assert.equal(
      versions.length,
      1,
      "the stray identical-uuid draft must be cleaned up, not surfaced"
    );
    assert.equal(
      fs.existsSync(".routines/hronir/drafts/hello/v-2026-01-02T00-00-00.mdx"),
      false,
      "listSlugVersions must have deleted the stray draft as a side effect of self-healing"
    );
  });

  it("crash after registerHistory, before the write: canonical still has old content, history has an entry, re-running foldBack still succeeds", () => {
    // Hand-construct: history already recorded the outgoing canonical
    // (first mutation in foldBack), but the write/rename never happened.
    const oldCanonical = sel.listSlugVersions("hello").find((v) => v.selected);
    const sha = "0".repeat(40);
    history.registerHistory([
      {
        slug: "hello",
        uuid: oldCanonical.uuid,
        legacyUuid: oldCanonical.legacyUuid,
        preOkfUuid: oldCanonical.preOkfUuid,
        lang: "en",
        sha,
        path: oldCanonical.path,
        title: "old canonical",
        description: "D",
        date: "2026-01-01",
        draftCommittedAt: null,
        draftMsg: null,
        commitSha: null,
        archivedAt: new Date().toISOString(),
      },
    ]);

    // Canonical is untouched — still the pre-crash content.
    assertCanonicalIsWellFormed("hello", "old canonical");
    assertNoDuplicateUuids("hello");

    // Re-running the real operation from this state must still work
    // (registerHistory is append-only-dedup, so re-registering the same
    // slug@uuid is a harmless no-op, not a duplicate or an error).
    const winner = sel.listSlugVersions("hello").find((v) => !v.selected);
    assert.doesNotThrow(() => sel.foldBack("hello", winner));
    assertCanonicalIsWellFormed("hello", "new winner");
    assertNoDuplicateUuids("hello");
  });
});

describe("foldBack — multiple concurrent drafts (RFC 0015 §3.2 gap)", () => {
  it("folding one draft leaves the other untouched as a live competitor", () => {
    fs.writeFileSync(
      ".routines/hronir/drafts/hello/v-2026-01-03T00-00-00.mdx",
      post("second challenger")
    );
    const versionsBefore = sel.listSlugVersions("hello");
    assert.equal(versionsBefore.length, 3);

    const winner = versionsBefore.find((v) => v.file.includes("2026-01-02"));
    sel.foldBack("hello", winner);

    const versionsAfter = sel.listSlugVersions("hello");
    assert.equal(
      versionsAfter.length,
      2,
      "canonical + the still-losing second challenger"
    );
    assertNoDuplicateUuids("hello");
    const remaining = versionsAfter.find((v) => !v.selected);
    assert.match(fs.readFileSync(remaining.path, "utf8"), /second challenger/);
  });
});
