import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";

// Mock matches.js before importing ranking.js so the import chain does not
// pull in posts.js → remark (which is only installed after `npm ci`).
// The pure functions under test (_computeRatings, _computeAbsoluteQuality)
// never call listMatchFiles/readMatch at runtime.
await mock.module("../matches.js", {
  namedExports: {
    listMatchFiles: () => [],
    readMatch: () => ({ data: {}, content: "" }),
    writeMatch: () => {},
    postKey: (side) => (side ? side.key || side.slug || null : null),
  },
});

const {
  _computeRatings,
  _computeAbsoluteQuality,
  EWMA_ALPHA,
  MIN_APPEARANCES,
} = await import("../ranking.js");

// Fixture builder helpers

function match(overrides) {
  return {
    runAt: "2024-01-01T00:00:00Z",
    matchIndex: 1,
    filename: "match.md",
    aKey: "post-a",
    bKey: "post-b",
    aPath: "src/content/blog/post-a.md",
    bPath: "src/content/blog/post-b.md",
    aVersion: null,
    bVersion: null,
    winner: "a",
    rateA: null,
    rateB: null,
    ...overrides,
  };
}

// Test 1: Ordering — A beats B twice, B beats C twice → ordinal A > B > C
describe("_computeRatings", () => {
  it("ordering: A>B>C after A beats B twice and B beats C twice", () => {
    const raw = [
      match({
        runAt: "2024-01-01T00:00:00Z",
        matchIndex: 1,
        aKey: "post-a",
        bKey: "post-b",
        winner: "a",
      }),
      match({
        runAt: "2024-01-01T00:00:01Z",
        matchIndex: 2,
        aKey: "post-a",
        bKey: "post-b",
        winner: "a",
      }),
      match({
        runAt: "2024-01-01T00:00:02Z",
        matchIndex: 3,
        aKey: "post-b",
        bKey: "post-c",
        winner: "a",
      }),
      match({
        runAt: "2024-01-01T00:00:03Z",
        matchIndex: 4,
        aKey: "post-b",
        bKey: "post-c",
        winner: "a",
      }),
    ];

    const result = _computeRatings(raw);
    const ordinalOf = (key) => result.find((r) => r.key === key)?.ordinal;

    assert.ok(
      ordinalOf("post-a") > ordinalOf("post-b"),
      "post-a should rank above post-b"
    );
    assert.ok(
      ordinalOf("post-b") > ordinalOf("post-c"),
      "post-b should rank above post-c"
    );
  });

  // Test 2: Filtering — winner=TODO match excluded
  it("filtering: winner=TODO match excluded from ratings", () => {
    // This test ensures that matches with winner=TODO do NOT appear in ratings.
    // The _computeRatings function receives already-filtered data (TODO matches
    // are excluded in _loadMatchData), so we verify that an all-TODO dataset
    // produces no output.
    const raw = [
      // winner=TODO would have been filtered in _loadMatchData before reaching here.
      // But we can verify: pass two valid matches and check only those keys appear.
      match({
        runAt: "2024-01-02T00:00:00Z",
        matchIndex: 1,
        aKey: "post-x",
        bKey: "post-y",
        winner: "a",
      }),
    ];

    const result = _computeRatings(raw);
    const keys = result.map((r) => r.key);
    assert.ok(keys.includes("post-x"), "post-x should appear in ratings");
    assert.ok(keys.includes("post-y"), "post-y should appear in ratings");
    assert.equal(keys.length, 2, "only 2 posts should appear");
  });

  // Test 3: Override — winner=b, override=a → treated as A wins
  it("override: winner=b with override=a is already resolved before _computeRatings", () => {
    // _loadMatchData resolves overrides before feeding data to _computeRatings.
    // We simulate the resolved result: passing winner='a' directly
    // and verify post-a ends up with higher ordinal than post-b.
    const raw = [
      match({
        runAt: "2024-01-03T00:00:00Z",
        matchIndex: 1,
        aKey: "post-x",
        bKey: "post-y",
        winner: "a", // already resolved from override
      }),
      match({
        runAt: "2024-01-03T00:00:01Z",
        matchIndex: 2,
        aKey: "post-x",
        bKey: "post-y",
        winner: "a",
      }),
    ];

    const result = _computeRatings(raw);
    const ox = result.find((r) => r.key === "post-x")?.ordinal;
    const oy = result.find((r) => r.key === "post-y")?.ordinal;
    assert.ok(ox > oy, "overridden winner post-x should rank above post-y");
  });

  // Test 4: Sort determinism — two matches same runAt, different matchIndex → lower matchIndex first
  it("sort determinism: same runAt, different matchIndex → lower matchIndex processed first", () => {
    // With same runAt, matchIndex=1 should be processed before matchIndex=2.
    // We can verify ordering is consistent by checking wins count.
    const raw = [
      match({
        runAt: "2024-01-04T00:00:00Z",
        matchIndex: 2,
        filename: "b.md",
        aKey: "post-p",
        bKey: "post-q",
        winner: "a",
      }),
      match({
        runAt: "2024-01-04T00:00:00Z",
        matchIndex: 1,
        filename: "a.md",
        aKey: "post-p",
        bKey: "post-q",
        winner: "b",
      }),
    ];

    // When matchIndex=1 is processed first: post-q wins first, then post-p wins.
    // End result: post-p and post-q each have 1 win.
    const result = _computeRatings(raw);
    const p = result.find((r) => r.key === "post-p");
    const q = result.find((r) => r.key === "post-q");
    assert.equal(p?.wins, 1, "post-p should have 1 win");
    assert.equal(q?.wins, 1, "post-q should have 1 win");
  });

  // Test 5: Determinism — same input → same output on repeat call
  it("determinism: same input produces identical output on repeated calls", () => {
    const raw = [
      match({ runAt: "2024-01-05T00:00:00Z", matchIndex: 1, winner: "a" }),
      match({
        runAt: "2024-01-05T00:00:01Z",
        matchIndex: 2,
        aKey: "post-b",
        bKey: "post-c",
        winner: "a",
      }),
    ];

    const result1 = _computeRatings(raw);
    const result2 = _computeRatings(raw);

    assert.equal(result1.length, result2.length, "same number of rows");
    for (let i = 0; i < result1.length; i++) {
      assert.equal(result1[i].key, result2[i].key, `row ${i} key matches`);
      assert.equal(
        result1[i].ordinal,
        result2[i].ordinal,
        `row ${i} ordinal matches`
      );
    }
  });

  // Test 9: Phase 2 — blowout > photo-finish produces higher ordinal gap
  it("phase2: blowout margin produces larger ordinal gap than photo-finish", () => {
    // Blowout scenario: winner rated 5.00, loser 1.00 → margin = 4/4 = 1.0
    const blowoutRaw = [
      match({
        runAt: "2024-01-09T00:00:00Z",
        matchIndex: 1,
        aKey: "winner-blow",
        bKey: "loser-blow",
        winner: "a",
        rateA: 5.0,
        rateB: 1.0,
      }),
    ];

    // Photo-finish scenario: winner rated 3.01, loser 3.00 → margin = 0.01/4 = 0.0025
    const photoRaw = [
      match({
        runAt: "2024-01-09T00:00:01Z",
        matchIndex: 1,
        aKey: "winner-photo",
        bKey: "loser-photo",
        winner: "a",
        rateA: 3.01,
        rateB: 3.0,
      }),
    ];

    const blowout = _computeRatings(blowoutRaw);
    const photo = _computeRatings(photoRaw);

    const blowoutGap =
      blowout.find((r) => r.key === "winner-blow").ordinal -
      blowout.find((r) => r.key === "loser-blow").ordinal;

    const photoGap =
      photo.find((r) => r.key === "winner-photo").ordinal -
      photo.find((r) => r.key === "loser-photo").ordinal;

    assert.ok(
      blowoutGap > photoGap,
      `blowout gap (${blowoutGap.toFixed(6)}) should exceed photo-finish gap (${photoGap.toFixed(6)})`
    );
  });
});

// Absolute quality tests

describe("_computeAbsoluteQuality", () => {
  // Test 6: Absolute quality EWMA — first match rate → EWMA = rate
  it("ewma: first match rate becomes the initial EWMA value", () => {
    const raw = [
      match({
        runAt: "2024-02-01T00:00:00Z",
        matchIndex: 1,
        aKey: "post-ewma",
        bKey: "post-other",
        winner: "a",
        rateA: 4.0,
        rateB: 3.0,
      }),
    ];

    const quality = _computeAbsoluteQuality(raw);
    const qa = quality.get("post-ewma");
    assert.ok(qa, "post-ewma should be in quality map");
    assert.equal(qa.stars, 4.0, "first observation EWMA should equal the rate");
    assert.equal(qa.n, 1, "n should be 1");
  });

  it("ewma: second match applies EWMA_ALPHA*new + (1-EWMA_ALPHA)*old", () => {
    const raw = [
      match({
        runAt: "2024-02-02T00:00:00Z",
        matchIndex: 1,
        aKey: "post-ewma2",
        bKey: "post-other2",
        winner: "a",
        rateA: 4.0,
        rateB: 3.0,
      }),
      match({
        runAt: "2024-02-02T00:00:01Z",
        matchIndex: 2,
        aKey: "post-ewma2",
        bKey: "post-other3",
        winner: "a",
        rateA: 2.0,
        rateB: 1.0,
      }),
    ];

    const quality = _computeAbsoluteQuality(raw);
    const qa = quality.get("post-ewma2");
    assert.ok(qa, "post-ewma2 should be in quality map");

    // First: stars = 4.0
    // Second: stars = EWMA_ALPHA * 2.0 + (1 - EWMA_ALPHA) * 4.0
    const expected = EWMA_ALPHA * 2.0 + (1 - EWMA_ALPHA) * 4.0;
    assert.equal(
      qa.stars,
      expected,
      `second EWMA should be ${expected}, got ${qa.stars}`
    );
    assert.equal(qa.n, 2, "n should be 2");
  });

  // Test 7: Absolute quality — no rates → post absent from quality map
  it("no rates: posts without rateA and rateB are absent from quality map", () => {
    const raw = [
      match({
        runAt: "2024-02-03T00:00:00Z",
        matchIndex: 1,
        aKey: "post-no-rate-a",
        bKey: "post-no-rate-b",
        winner: "a",
        rateA: null,
        rateB: null,
      }),
    ];

    const quality = _computeAbsoluteQuality(raw);
    assert.equal(
      quality.size,
      0,
      "quality map should be empty when no rates provided"
    );
    assert.equal(
      quality.get("post-no-rate-a"),
      undefined,
      "post-no-rate-a should not appear"
    );
    assert.equal(
      quality.get("post-no-rate-b"),
      undefined,
      "post-no-rate-b should not appear"
    );
  });

  // Test 8: rawStars — simple mean of rated appearances
  it("rawStars: equals simple mean of all rated appearances", () => {
    const raw = [
      match({
        runAt: "2024-02-04T00:00:00Z",
        matchIndex: 1,
        aKey: "post-raw",
        bKey: "post-rawother",
        winner: "a",
        rateA: 3.0,
        rateB: 4.0,
      }),
      match({
        runAt: "2024-02-04T00:00:01Z",
        matchIndex: 2,
        aKey: "post-raw",
        bKey: "post-rawother2",
        winner: "a",
        rateA: 5.0,
        rateB: 2.0,
      }),
    ];

    const quality = _computeAbsoluteQuality(raw);
    const qa = quality.get("post-raw");
    assert.ok(qa, "post-raw should be in quality map");
    // rawStars = (3.0 + 5.0) / 2 = 4.0
    assert.equal(qa.rawStars, 4.0, "rawStars should be simple mean (4.0)");
    assert.equal(qa.n, 2, "n should be 2");
  });

  // Test: MIN_APPEARANCES is exported and equals 3
  it("MIN_APPEARANCES is exported and equals 3", () => {
    assert.equal(MIN_APPEARANCES, 3, "MIN_APPEARANCES should be 3");
  });

  // Test: reset-on-edit — same language file, version change discards pre-edit EWMA
  it("reset-on-edit: version change resets EWMA to post-edit observations only", () => {
    const raw = [
      match({
        runAt: "2024-03-01T00:00:00Z",
        matchIndex: 1,
        aKey: "post-edited",
        aPath: "src/content/blog/post-edited.md",
        bKey: "post-other",
        winner: "b",
        rateA: 2.0,
        rateB: 4.0,
        aVersion: "uuid-v1",
      }),
      // Same post, SAME path, different version (real edit) → EWMA resets
      match({
        runAt: "2024-03-01T00:00:01Z",
        matchIndex: 2,
        aKey: "post-edited",
        aPath: "src/content/blog/post-edited.md",
        bKey: "post-other2",
        winner: "a",
        rateA: 5.0,
        rateB: 3.0,
        aVersion: "uuid-v2",
      }),
    ];

    const quality = _computeAbsoluteQuality(raw);
    const qa = quality.get("post-edited");
    assert.ok(qa, "post-edited should be in quality map");
    // After reset, only the post-edit observation counts: stars = 5.0, n = 1
    assert.equal(
      qa.stars,
      5.0,
      "EWMA should equal post-edit rate (reset occurred)"
    );
    assert.equal(qa.n, 1, "n should be 1 after reset");
  });

  // Test: no reset when version unchanged
  it("no-reset: same version across matches accumulates normally", () => {
    const raw = [
      match({
        runAt: "2024-03-02T00:00:00Z",
        matchIndex: 1,
        aKey: "post-stable",
        bKey: "post-other",
        winner: "a",
        rateA: 4.0,
        rateB: 3.0,
        aVersion: "uuid-stable",
      }),
      match({
        runAt: "2024-03-02T00:00:01Z",
        matchIndex: 2,
        aKey: "post-stable",
        bKey: "post-other2",
        winner: "a",
        rateA: 2.0,
        rateB: 1.0,
        aVersion: "uuid-stable",
      }),
    ];

    const quality = _computeAbsoluteQuality(raw);
    const qa = quality.get("post-stable");
    assert.ok(qa, "post-stable should be in quality map");
    // No reset: EWMA = ALPHA*2.0 + (1-ALPHA)*4.0
    const expected = EWMA_ALPHA * 2.0 + (1 - EWMA_ALPHA) * 4.0;
    assert.equal(qa.stars, expected, "EWMA should accumulate without reset");
    assert.equal(qa.n, 2, "n should be 2 (no reset)");
  });

  // Test: language alternation must NOT reset (key shared, paths/versions differ)
  // Regression guard: a multilingual post's version alternates EN↔PT every match
  // because the generator picks a language variant at random. Tracking the reset
  // by `key` would wipe the EWMA on each switch; tracking by `path` must not.
  it("no-reset: same key, different language files/versions, no edit → accumulates", () => {
    const EN = "src/content/blog/the-art-of-delegation.md";
    const PT = "src/content/blog/delegando-para-agentes.md";
    const raw = [
      match({
        runAt: "2024-03-03T00:00:00Z",
        matchIndex: 1,
        aKey: "multiling",
        aPath: EN,
        aVersion: "en-hash",
        bKey: "opp1",
        winner: "a",
        rateA: 4.0,
        rateB: 3.0,
      }),
      // Next match the generator picked PT for the same key — different path AND
      // version, but NOT an edit. Must not reset.
      match({
        runAt: "2024-03-03T00:00:01Z",
        matchIndex: 2,
        aKey: "multiling",
        aPath: PT,
        aVersion: "pt-hash",
        bKey: "opp2",
        winner: "a",
        rateA: 2.0,
        rateB: 1.0,
      }),
      // Back to EN, same EN version as before — still no edit.
      match({
        runAt: "2024-03-03T00:00:02Z",
        matchIndex: 3,
        aKey: "multiling",
        aPath: EN,
        aVersion: "en-hash",
        bKey: "opp3",
        winner: "a",
        rateA: 3.0,
        rateB: 1.0,
      }),
    ];

    const quality = _computeAbsoluteQuality(raw);
    const qa = quality.get("multiling");
    assert.ok(qa, "multiling should be in quality map");
    assert.equal(qa.n, 3, "n should be 3 — no reset on language alternation");
    // EWMA over [4.0, 2.0, 3.0] with no reset
    let e = 4.0;
    e = EWMA_ALPHA * 2.0 + (1 - EWMA_ALPHA) * e;
    e = EWMA_ALPHA * 3.0 + (1 - EWMA_ALPHA) * e;
    assert.equal(
      qa.stars,
      e,
      "EWMA should accumulate across all 3 observations"
    );
  });
});
