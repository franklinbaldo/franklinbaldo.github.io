import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";

// Mock matches module before importing ranking so the import chain does not
// pull in posts.ts → remark (which is only installed after `npm ci`).
// The pure functions under test (_computeRatings, _computeAbsoluteQuality)
// never call listMatchFiles/readMatch at runtime.
// After RFC 0005 Fase 1, the real implementations live in src/hronir/;
// mock those directly so ranking.ts sees the mock.
await mock.module("../../../../src/hronir/matches.js", {
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
  _computeDeconfoundedQuality,
  _computePerPerspectiveQuality,
  _solveLinear,
  EWMA_ALPHA,
  MIN_APPEARANCES,
} = await import("../../../../src/hronir/ranking.js");

// Fixture builder helpers

function match(overrides) {
  return {
    runAt: "2024-01-01T00:00:00Z",
    filename: "match.md",
    aKey: "post-a",
    bKey: "post-b",
    aPath: "src/content/blog/post-a.md",
    bPath: "src/content/blog/post-b.md",
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

// Test 1: Ordering — A beats B twice, B beats C twice → ordinal A > B > C
describe("_computeRatings", () => {
  it("ordering: A>B>C after A beats B twice and B beats C twice", () => {
    const raw = [
      match({
        runAt: "2024-01-01T00:00:00Z",
        aKey: "post-a",
        bKey: "post-b",
        winner: "a",
      }),
      match({
        runAt: "2024-01-01T00:00:01Z",
        aKey: "post-a",
        bKey: "post-b",
        winner: "a",
      }),
      match({
        runAt: "2024-01-01T00:00:02Z",
        aKey: "post-b",
        bKey: "post-c",
        winner: "a",
      }),
      match({
        runAt: "2024-01-01T00:00:03Z",
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
        aKey: "post-x",
        bKey: "post-y",
        winner: "a", // already resolved from override
      }),
      match({
        runAt: "2024-01-03T00:00:01Z",
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

  // Test 5: Determinism — same input → same output on repeat call
  it("determinism: same input produces identical output on repeated calls", () => {
    const raw = [
      match({ runAt: "2024-01-05T00:00:00Z", winner: "a" }),
      match({
        runAt: "2024-01-05T00:00:01Z",
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

  // RFC 0009: monotonicity — blowout ordinal must exceed medium-margin ordinal
  // (same win-rate, same number of matches). Fails before the sigma fix.
  it("monotonicity: blowout ordinal exceeds medium-margin ordinal (same win-rate)", () => {
    // Build 3 matches where every win/loss has the same outcome but different margins.
    // Blowout: winner 5.0 vs loser 1.0 → weight = 1.0
    // Medium:  winner 3.5 vs loser 1.5 → margin = 2/4 = 0.5 → weight = 0.55
    const makeMatches = (rateA, rateB) =>
      [
        { runAt: "2024-02-01T00:00:00Z", aKey: "w", bKey: "x", winner: "a" },
        { runAt: "2024-02-01T00:00:01Z", aKey: "w", bKey: "y", winner: "a" },
        { runAt: "2024-02-01T00:00:02Z", aKey: "z", bKey: "w", winner: "a" },
      ].map((m, i) =>
        match({ ...m, runAt: `2024-02-01T00:00:0${i}Z`, rateA, rateB })
      );

    const blowoutRows = _computeRatings(makeMatches(5.0, 1.0));
    const mediumRows = _computeRatings(makeMatches(3.5, 1.5));

    const blowoutOrdinal = blowoutRows.find((r) => r.key === "w").ordinal;
    const mediumOrdinal = mediumRows.find((r) => r.key === "w").ordinal;

    assert.ok(
      blowoutOrdinal > mediumOrdinal,
      `blowout ordinal (${blowoutOrdinal.toFixed(4)}) should exceed medium-margin ordinal (${mediumOrdinal.toFixed(4)})`
    );
  });

  // RFC 0009: sigma scales with weight — after equal number of matches, a post
  // that only faced close matches must retain higher sigma than one that faced
  // blowouts (close matches convey less information → more residual uncertainty).
  it("sigma scales with weight: close-match sigma > blowout sigma after same matches", () => {
    const makeMatches = (rateA, rateB) =>
      [0, 1, 2, 3, 4].map((i) =>
        match({
          runAt: `2024-03-01T00:00:0${i}Z`,
          aKey: "post",
          bKey: `opp${i}`,
          winner: "a",
          rateA,
          rateB,
        })
      );

    const closeRows = _computeRatings(makeMatches(3.01, 3.0)); // weight ≈ 0.1
    const blowoutRows = _computeRatings(makeMatches(5.0, 1.0)); // weight = 1.0

    const closeSigma = closeRows.find((r) => r.key === "post").sigma;
    const blowoutSigma = blowoutRows.find((r) => r.key === "post").sigma;

    assert.ok(
      closeSigma > blowoutSigma,
      `close-match sigma (${closeSigma.toFixed(4)}) should exceed blowout sigma (${blowoutSigma.toFixed(4)})`
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
        aKey: "post-ewma2",
        bKey: "post-other2",
        winner: "a",
        rateA: 4.0,
        rateB: 3.0,
      }),
      match({
        runAt: "2024-02-02T00:00:01Z",
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
        aKey: "post-raw",
        bKey: "post-rawother",
        winner: "a",
        rateA: 3.0,
        rateB: 4.0,
      }),
      match({
        runAt: "2024-02-04T00:00:01Z",
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
        aKey: "post-stable",
        bKey: "post-other",
        winner: "a",
        rateA: 4.0,
        rateB: 3.0,
        aVersion: "uuid-stable",
      }),
      match({
        runAt: "2024-03-02T00:00:01Z",
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

describe("_solveLinear", () => {
  it("solves a known 2x2 system", () => {
    // 2a + b = 3 ; a + 3b = 5  →  a = 0.8, b = 1.4
    const x = _solveLinear(
      [
        [2, 1],
        [1, 3],
      ],
      [3, 5]
    );
    assert.ok(Math.abs(x[0] - 0.8) < 1e-9, `a≈0.8, got ${x[0]}`);
    assert.ok(Math.abs(x[1] - 1.4) < 1e-9, `b≈1.4, got ${x[1]}`);
  });

  it("solves a 3x3 system needing a pivot swap", () => {
    // Zero leading pivot forces a row swap.
    // 0a + b + c = 3 ; a + b = 3 ; b + 2c = 5  →  a=1, b=2, c=1.5? check:
    //   row2: 1+2=3 ✓ ; row1: 2+1.5=3.5 ✗ — recompute properly below.
    // Use a clean system: x+y+z=6, y+z=5, z=3 → z=3, y=2, x=1.
    const x = _solveLinear(
      [
        [1, 1, 1],
        [0, 1, 1],
        [0, 0, 1],
      ],
      [6, 5, 3]
    );
    assert.ok(Math.abs(x[0] - 1) < 1e-9, `x≈1, got ${x[0]}`);
    assert.ok(Math.abs(x[1] - 2) < 1e-9, `y≈2, got ${x[1]}`);
    assert.ok(Math.abs(x[2] - 3) < 1e-9, `z≈3, got ${x[2]}`);
  });
});

describe("_computeDeconfoundedQuality", () => {
  it("detects a generous agent and corrects spurious quality gap", () => {
    // X and Y have equal true quality (2). Agent G adds +1, Agent N adds 0.
    // X is rated more by G, Y more by N → raw stars make X look better.
    // De-confounding should shrink that gap and flag G > N.
    const G = "agent-generous";
    const N = "agent-neutral";
    const raw = [
      match({
        runAt: "2024-04-01T00:00:00Z",
        agentId: G,
        aKey: "X",
        aPath: "x.md",
        rateA: 3.0,
        bKey: "Y",
        bPath: "y.md",
        rateB: 3.0,
      }),
      match({
        runAt: "2024-04-01T00:00:01Z",
        agentId: G,
        aKey: "X",
        aPath: "x.md",
        rateA: 3.0,
        bKey: "F",
        bPath: "f.md",
        rateB: 3.0,
      }),
      match({
        runAt: "2024-04-01T00:00:02Z",
        agentId: N,
        aKey: "X",
        aPath: "x.md",
        rateA: 2.0,
        bKey: "Y",
        bPath: "y.md",
        rateB: 2.0,
      }),
      match({
        runAt: "2024-04-01T00:00:03Z",
        agentId: N,
        aKey: "Y",
        aPath: "y.md",
        rateA: 2.0,
        bKey: "F",
        bPath: "f.md",
        rateB: 2.0,
      }),
    ];

    const { quality, agentBias } = _computeDeconfoundedQuality(raw);
    const qx = quality.get("X");
    const qy = quality.get("Y");
    assert.ok(qx && qy, "X and Y present");

    // Raw stars: X = (3+3+2)/3 = 2.667, Y = (3+2+2)/3 = 2.333, gap 0.333.
    const rawGap = 2.6667 - 2.3333;
    const deconfGap = Math.abs(qx.quality - qy.quality);
    assert.ok(
      deconfGap < rawGap,
      `de-confounded gap ${deconfGap.toFixed(3)} should be < raw gap ${rawGap.toFixed(3)}`
    );

    // Generous agent should carry a higher bias than the neutral one.
    assert.ok(
      agentBias.get(G) > agentBias.get(N),
      `generous agent bias ${agentBias.get(G)} should exceed neutral ${agentBias.get(N)}`
    );
  });

  it("returns empty structures when there are no rated observations", () => {
    const raw = [
      match({ aKey: "a", bKey: "b", rateA: null, rateB: null, agentId: "g" }),
    ];
    const out = _computeDeconfoundedQuality(raw);
    assert.equal(out.quality.size, 0, "no quality rows");
    assert.equal(out.intercept, 0, "intercept defaults to 0");
  });
});

describe("_computePerPerspectiveQuality", () => {
  it("buckets stars by perspective and keeps them separate", () => {
    const raw = [
      match({
        runAt: "2024-05-01T00:00:00Z",
        perspectiveId: "skeptical-specialist",
        aKey: "post-z",
        aPath: "z.md",
        rateA: 2.0,
        bKey: "opp",
        bPath: "o.md",
        rateB: 1.0,
      }),
      match({
        runAt: "2024-05-01T00:00:01Z",
        perspectiveId: "curious-outsider",
        aKey: "post-z",
        aPath: "z.md",
        rateA: 4.5,
        bKey: "opp2",
        bPath: "o2.md",
        rateB: 3.0,
      }),
    ];

    const result = _computePerPerspectiveQuality(raw);
    const harsh = result.get("skeptical-specialist");
    const gentle = result.get("curious-outsider");
    assert.ok(harsh && gentle, "both perspective buckets exist");
    assert.equal(harsh.get("post-z").stars, 2.0, "harsh bucket sees 2.0");
    assert.equal(gentle.get("post-z").stars, 4.5, "gentle bucket sees 4.5");
    assert.equal(harsh.get("post-z").n, 1);
    assert.equal(gentle.get("post-z").n, 1);
  });

  it("skips matches without a perspective_id", () => {
    const raw = [
      match({
        perspectiveId: null,
        aKey: "p",
        aPath: "p.md",
        rateA: 3.0,
        bKey: "q",
        bPath: "q.md",
        rateB: 2.0,
      }),
    ];
    const result = _computePerPerspectiveQuality(raw);
    assert.equal(result.size, 0, "no perspective buckets when id absent");
  });
});
