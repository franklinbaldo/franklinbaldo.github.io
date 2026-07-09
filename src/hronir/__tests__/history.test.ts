import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// Isolate each test from the real src/generated/versions-history.json and
// from every other test file's module cache: history.ts memoizes its read
// in a module-level variable, so re-importing with a fresh query string
// forces a fresh module instance (and fresh cache) per test.
let historyMod: typeof import("../history.ts");
let tmpDir: string;
let realCwd: string;

type HistoryEntry = import("../history.ts").HistoryEntry;

beforeEach(async () => {
  tmpDir = fs.mkdtempSync(path.join(process.cwd(), ".tmp-history-test-"));
  realCwd = process.cwd();
  process.chdir(tmpDir);
  historyMod = await import(`../history.ts?t=${Date.now()}-${Math.random()}`);
});

afterEach(() => {
  process.chdir(realCwd);
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

const entry = (overrides: Partial<HistoryEntry> = {}): HistoryEntry => ({
  slug: "some-slug",
  uuid: "11111111-1111-5111-8111-111111111111",
  legacyUuid: "22222222-2222-5222-8222-222222222222",
  preOkfUuid: "33333333-3333-5333-8333-333333333333",
  lang: "en",
  sha: "a".repeat(40),
  path: "src/content/blog/some-slug.mdx",
  title: "Some title",
  description: "Some description",
  date: "2026-01-01T00:00:00.000Z",
  draftCommittedAt: null,
  draftMsg: null,
  commitSha: null,
  archivedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

describe("history.ts", () => {
  it("readHistory returns [] when the file doesn't exist yet", () => {
    assert.deepEqual(historyMod.readHistory(), []);
  });

  it("registerHistory writes and readHistory reads it back", () => {
    historyMod.registerHistory([entry()]);
    const all = historyMod.readHistory();
    assert.equal(all.length, 1);
    assert.equal(all[0].slug, "some-slug");
    assert.ok(fs.existsSync(historyMod.HISTORY_PATH));
  });

  it("is append-only: registering the same slug@uuid twice doesn't duplicate", () => {
    historyMod.registerHistory([entry()]);
    historyMod.registerHistory([entry({ title: "changed title" })]);
    const all = historyMod.readHistory();
    assert.equal(all.length, 1);
    // First write wins — an archived blob's metadata doesn't change after
    // the fact, even if a caller (bug or not) tries to re-register it.
    assert.equal(all[0].title, "Some title");
  });

  it("different uuids for the same slug both persist", () => {
    historyMod.registerHistory([
      entry({ uuid: "11111111-1111-5111-8111-111111111111" }),
      entry({ uuid: "44444444-4444-5444-8444-444444444444" }),
    ]);
    assert.equal(historyMod.readHistory().length, 2);
  });

  it("historyEntryForUuid resolves current, legacy, and pre-OKF uuids", () => {
    historyMod.registerHistory([entry()]);
    assert.ok(
      historyMod.historyEntryForUuid("11111111-1111-5111-8111-111111111111")
    );
    assert.ok(
      historyMod.historyEntryForUuid("22222222-2222-5222-8222-222222222222")
    );
    assert.ok(
      historyMod.historyEntryForUuid("33333333-3333-5333-8333-333333333333")
    );
    assert.equal(historyMod.historyEntryForUuid("does-not-exist"), null);
  });

  it("historyEntriesForSlug filters by slug", () => {
    historyMod.registerHistory([
      entry({ slug: "a", uuid: "11111111-1111-5111-8111-111111111111" }),
      entry({ slug: "b", uuid: "44444444-4444-5444-8444-444444444444" }),
    ]);
    assert.equal(historyMod.historyEntriesForSlug("a").length, 1);
    assert.equal(historyMod.historyEntriesForSlug("a")[0].slug, "a");
  });

  it("historyKeySet includes uuid, legacyUuid, and preOkfUuid as slug@uuid keys", () => {
    historyMod.registerHistory([entry()]);
    const keys = historyMod.historyKeySet();
    assert.ok(keys.has("some-slug@11111111-1111-5111-8111-111111111111"));
    assert.ok(keys.has("some-slug@22222222-2222-5222-8222-222222222222"));
    assert.ok(keys.has("some-slug@33333333-3333-5333-8333-333333333333"));
  });

  it("stampHistoryCommit fills in commitSha only for entries still missing it", () => {
    historyMod.registerHistory([
      entry({ uuid: "11111111-1111-5111-8111-111111111111" }),
    ]);
    historyMod.stampHistoryCommit("deadbeef".repeat(5));
    const [e1] = historyMod.readHistory();
    assert.equal(e1.commitSha, "deadbeef".repeat(5));

    historyMod.registerHistory([
      entry({ uuid: "44444444-4444-5444-8444-444444444444" }),
    ]);
    historyMod.stampHistoryCommit("cafebabe".repeat(5));
    const all = historyMod.readHistory();
    const first = all.find(
      (e) => e.uuid === "11111111-1111-5111-8111-111111111111"
    );
    const second = all.find(
      (e) => e.uuid === "44444444-4444-5444-8444-444444444444"
    );
    assert.ok(first && second, "both entries must be present");
    // The first entry's commit must not be overwritten by the second stamp.
    assert.equal(first.commitSha, "deadbeef".repeat(5));
    assert.equal(second.commitSha, "cafebabe".repeat(5));
  });

  it("throws on a present-but-corrupt history file instead of silently treating it as empty", () => {
    fs.mkdirSync(path.dirname(historyMod.HISTORY_PATH), { recursive: true });
    fs.writeFileSync(historyMod.HISTORY_PATH, "{not json");
    assert.throws(() => historyMod.readHistory(), /não parseia/);
  });

  it("throws on a schema-mismatched history file", () => {
    fs.mkdirSync(path.dirname(historyMod.HISTORY_PATH), { recursive: true });
    fs.writeFileSync(
      historyMod.HISTORY_PATH,
      JSON.stringify({ _meta: { schema: "wrong-v0" }, entries: [] })
    );
    assert.throws(() => historyMod.readHistory(), /schema inesperado/);
  });
});
