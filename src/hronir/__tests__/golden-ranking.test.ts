import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import type { RateFile } from "../types.js";

// RFC 0012 Fase 0 — golden snapshot.
//
// This test freezes the *current* (pre-normalizer) behavior of the ranking
// core so Fase 1 (the single normalizer + `getDuels({ kind })`) can prove it
// is behavior-preserving: the assertions here must stay green unchanged after
// consumers migrate to loadNormalizedMatches(). It also locks the structural
// classification rule (kind = aKey === bKey ? "version" : "work") against the
// on-disk rate-file fixtures the normalizer will consume.

// Mock matches before importing ranking (same reason as ranking.test.ts: avoid
// pulling posts.ts → remark, which is only present after `npm ci`). The pure
// _compute* functions under test take their raw array as an argument.
// mock.module() is synchronous (returns a MockModuleContext, not a Promise);
// no await needed before the subsequent import() below.
mock.module("../matches.js", {
  namedExports: {
    listMatchFiles: () => [],
    readMatch: () => ({ data: {}, content: "" }),
    writeMatch: () => {},
    postKey: (side: { key?: string; slug?: string } | null | undefined) =>
      side ? side.key || side.slug || null : null,
    matchesDataVersion: () => 0,
    loadMatches: () => [],
    loadNormalizedMatches: () => [],
  },
});

const { _computeRatings, _computeVersionRatings } =
  await import("../ranking.js");

type RawMatch = Parameters<typeof _computeRatings>[0][number];

function match(overrides: Partial<RawMatch> = {}): RawMatch {
  return {
    runAt: "2024-01-01T00:00:00Z",
    filename: "match.md",
    aKey: "alpha-essay",
    bKey: "beta-essay",
    aPath: "src/content/blog/alpha-essay.md",
    bPath: "src/content/blog/beta-essay.md",
    aVersion: null,
    bVersion: null,
    agentId: null,
    perspectiveId: null,
    winner: "a",
    rateA: null,
    rateB: null,
    ...overrides,
  };
}

// A fixed editorial (work) corpus: alpha > beta > gamma.
const WORK_CORPUS = [
  match({
    runAt: "2024-01-01T00:00:00Z",
    aKey: "alpha-essay",
    bKey: "beta-essay",
    winner: "a",
  }),
  match({
    runAt: "2024-01-02T00:00:00Z",
    aKey: "alpha-essay",
    bKey: "beta-essay",
    winner: "a",
  }),
  match({
    runAt: "2024-01-03T00:00:00Z",
    aKey: "beta-essay",
    bKey: "gamma-essay",
    winner: "a",
  }),
  match({
    runAt: "2024-01-04T00:00:00Z",
    aKey: "beta-essay",
    bKey: "gamma-essay",
    winner: "a",
  }),
  match({
    runAt: "2024-01-05T00:00:00Z",
    aKey: "alpha-essay",
    bKey: "gamma-essay",
    winner: "a",
  }),
];

// The same corpus plus version duels of alpha-essay (same key both sides).
const VERSION_DUELS = [
  match({
    runAt: "2024-01-06T00:00:00Z",
    filename: "version-1.md",
    aKey: "alpha-essay",
    bKey: "alpha-essay",
    aPath: "src/content/blog/alpha-essay/v-old.md",
    bPath: "src/content/blog/alpha-essay/v-new.md",
    aVersion: "v-old",
    bVersion: "v-new",
    winner: "b",
    rateA: 3.25,
    rateB: 4.5,
  }),
  match({
    runAt: "2024-01-07T00:00:00Z",
    filename: "version-2.md",
    aKey: "alpha-essay",
    bKey: "alpha-essay",
    aPath: "src/content/blog/alpha-essay/v-old.md",
    bPath: "src/content/blog/alpha-essay/v-new.md",
    aVersion: "v-old",
    bVersion: "v-new",
    winner: "b",
    rateA: 3,
    rateB: 4.75,
  }),
];

const orderOf = (rows: ReturnType<typeof _computeRatings>) =>
  [...rows].sort((a, b) => b.ordinal - a.ordinal).map((r) => r.key);

describe("RFC 0012 golden — work/version separation", () => {
  it("editorial ordering is alpha > beta > gamma", () => {
    assert.deepEqual(orderOf(_computeRatings(WORK_CORPUS)), [
      "alpha-essay",
      "beta-essay",
      "gamma-essay",
    ]);
  });

  it("version duels never alter work ratings (the load-bearing invariant)", () => {
    const withoutVersions = _computeRatings(WORK_CORPUS);
    const withVersions = _computeRatings([...WORK_CORPUS, ...VERSION_DUELS]);
    // Same keys, same ordinals, same appearance counts — a version duel must
    // be invisible to the editorial ranking.
    assert.deepEqual(withVersions, withoutVersions);
  });

  it("work duels never feed version ratings", () => {
    assert.equal(_computeVersionRatings(WORK_CORPUS).size, 0);
  });

  it("version ratings rank the better-rated UUID higher, by key", () => {
    const v = _computeVersionRatings([...WORK_CORPUS, ...VERSION_DUELS]);
    assert.deepEqual([...v.keys()].sort(), ["v-new", "v-old"]);
    const vNew = v.get("v-new");
    const vOld = v.get("v-old");
    assert.ok(vNew && vOld, "both v-new and v-old ratings must exist");
    assert.ok(vNew.stars > vOld.stars);
    assert.equal(vNew.key, "alpha-essay");
    assert.equal(vOld.key, "alpha-essay");
  });
});

// Structural classification rule (RFC 0012 §4.1) against the on-disk fixtures.
const FIXdir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "fixtures",
  "rate-files"
);
const readFixture = (name: string): RateFile =>
  matter(fs.readFileSync(path.join(FIXdir, name), "utf8")).data as RateFile;
const kindOf = (data: RateFile) =>
  data.post_a.key === data.post_b.key ? "version" : "work";

describe("RFC 0012 golden — fixture classification & schema", () => {
  it("work fixtures classify as work; version fixture as version", () => {
    assert.equal(kindOf(readFixture("work-stars-v1.md")), "work");
    assert.equal(kindOf(readFixture("work-stars-v2.md")), "work");
    assert.equal(kindOf(readFixture("work-stars-v3.md")), "work");
    assert.equal(kindOf(readFixture("version-stars-v3.md")), "version");
  });

  it("persisted match_kind, when present, agrees with the derived rule", () => {
    for (const f of ["work-stars-v3.md", "version-stars-v3.md"]) {
      const data = readFixture(f);
      assert.equal(data.match_kind, kindOf(data));
    }
  });

  it("stars-v3 records review_lang and per-side content_lang", () => {
    const work = readFixture("work-stars-v3.md");
    assert.equal(work.review_lang, "pt");
    assert.equal(work.post_a.content_lang, "en");
    assert.equal(work.post_b.content_lang, "pt");

    // Version duel: both sides are the same linguistic version, so the review
    // is written in that language (RFC 0012 §6, rule 3).
    const ver = readFixture("version-stars-v3.md");
    assert.equal(ver.review_lang, ver.post_a.content_lang);
    assert.equal(ver.post_a.content_lang, ver.post_b.content_lang);
  });

  it("legacy fixtures stay readable with no review_lang", () => {
    assert.equal(readFixture("work-stars-v1.md").review_lang, undefined);
    assert.equal(readFixture("work-stars-v2.md").review_lang, undefined);
    // stars-v2 carries eval_lang, the legacy fallback the normalizer will use.
    assert.equal(readFixture("work-stars-v2.md").eval_lang, "en");
  });
});
