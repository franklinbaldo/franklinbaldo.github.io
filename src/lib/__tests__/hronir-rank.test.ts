import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { matchId } from "../../hronir/matches.js";
import type { RankRow, PerspectiveRankRow } from "../../hronir/types.js";

// hronir-rank.ts is the build-time bridge between the Hrönir OpenSkill core
// (src/hronir/ranking.ts) and the site pages. Its own responsibilities are
// deliberately narrow -- caching, id/href derivation, and duel-body parsing
// -- everything else is delegated. Ordering/tie-handling for the OpenSkill
// algorithm itself is already covered by src/hronir/__tests__/ranking.test.ts;
// these tests target what hronir-rank.ts actually adds on top of that.
//
// Every test below dynamic-imports hronir-rank.ts (never a static top-level
// import) so this mock -- registered once, up front -- is guaranteed to be in
// place before hronir-rank.ts's own top-level `import ... from "./ranking.js"`
// resolves. A static import here would be hoisted ahead of the mock.module()
// call below and load the real, unmocked ranking.ts instead.
let ratingsToReturn: RankRow[] = [];
let computeRatingsCallCount = 0;

mock.module("../../hronir/ranking.js", {
  namedExports: {
    computeRatings: () => {
      computeRatingsCallCount++;
      return ratingsToReturn;
    },
    computePerPerspectiveRatings: () => new Map<string, PerspectiveRankRow[]>(),
  },
});

// ── parseDuelContent — pure markdown/frontmatter parsing, no mocking ───────

describe("parseDuelContent", () => {
  it("parses ## Post A / ## Post B / ## Verdict sections (English)", async () => {
    const { parseDuelContent } = await import("../hronir-rank.ts");
    const body = [
      "## Post A",
      "Analysis of A.",
      "",
      "## Post B",
      "Analysis of B.",
      "",
      "## Verdict",
      "A wins.",
    ].join("\n");
    const result = parseDuelContent(body);
    assert.equal(result.postAAnalysis, "Analysis of A.");
    assert.equal(result.postBAnalysis, "Analysis of B.");
    assert.equal(result.verdict, "A wins.");
  });

  it("parses ## Veredito as the verdict section (Portuguese)", async () => {
    const { parseDuelContent } = await import("../hronir-rank.ts");
    const body = [
      "## Post A",
      "Análise de A.",
      "",
      "## Veredito",
      "A vence.",
    ].join("\n");
    const result = parseDuelContent(body);
    assert.equal(result.postAAnalysis, "Análise de A.");
    assert.equal(result.verdict, "A vence.");
  });

  it("header matching is case-insensitive", async () => {
    const { parseDuelContent } = await import("../hronir-rank.ts");
    const body = [
      "## POST A",
      "upper case header.",
      "",
      "## verdict",
      "ok.",
    ].join("\n");
    const result = parseDuelContent(body);
    assert.equal(result.postAAnalysis, "upper case header.");
    assert.equal(result.verdict, "ok.");
  });

  it("returns all-empty fields when there is neither body nor frontmatter", async () => {
    const { parseDuelContent } = await import("../hronir-rank.ts");
    assert.deepEqual(parseDuelContent(), {
      postAAnalysis: "",
      postBAnalysis: "",
      verdict: "",
    });
  });

  it("falls back to frontmatter fields when no body is given", async () => {
    const { parseDuelContent } = await import("../hronir-rank.ts");
    const result = parseDuelContent(undefined, {
      clash: "frontmatter verdict",
      review_a: "frontmatter review a",
      review_b: "frontmatter review b",
    });
    assert.equal(result.verdict, "frontmatter verdict");
    assert.equal(result.postAAnalysis, "frontmatter review a");
    assert.equal(result.postBAnalysis, "frontmatter review b");
  });

  it("falls through to frontmatter when the body has no recognizable headers", async () => {
    // A body that parses to zero non-empty fields must not be treated as a
    // successful match -- it should fall through to the frontmatter, not
    // silently return blank text when frontmatter data was available.
    const { parseDuelContent } = await import("../hronir-rank.ts");
    const result = parseDuelContent("just prose, no ## sections at all", {
      clash: "frontmatter verdict",
    });
    assert.equal(result.verdict, "frontmatter verdict");
  });

  it("does not mix body and frontmatter once the body yields any field", async () => {
    // A body with only a Post A section already satisfies the "matched"
    // check (postAAnalysis truthy), so it must return as-is even though
    // postBAnalysis/verdict stay empty -- not fall through to data for the
    // remaining fields.
    const { parseDuelContent } = await import("../hronir-rank.ts");
    const result = parseDuelContent("## Post A\nOnly A.", {
      clash: "should be ignored",
      review_b: "should also be ignored",
    });
    assert.equal(result.postAAnalysis, "Only A.");
    assert.equal(result.postBAnalysis, "");
    assert.equal(result.verdict, "");
  });
});

// ── duelId — thin pure wrapper around matches.matchId ───────────────────────

describe("duelId", () => {
  it("delegates to matchId(postAKey, postBKey, runAt)", async () => {
    const { duelId } = await import("../hronir-rank.ts");
    const d = {
      postAKey: "alpha",
      postBKey: "beta",
      runAt: "2024-01-01T00:00:00Z",
    };
    assert.equal(duelId(d), matchId("alpha", "beta", "2024-01-01T00:00:00Z"));
  });

  it("defaults a missing key to an empty string rather than throwing", async () => {
    const { duelId } = await import("../hronir-rank.ts");
    const d = {
      postAKey: undefined,
      postBKey: "beta",
      runAt: "2024-01-01T00:00:00Z",
    };
    assert.equal(duelId(d), matchId("", "beta", "2024-01-01T00:00:00Z"));
  });

  it("returns an 8-character hex id", async () => {
    const { duelId } = await import("../hronir-rank.ts");
    const id = duelId({
      postAKey: "a",
      postBKey: "b",
      runAt: "2024-01-01T00:00:00Z",
    });
    assert.match(id, /^[0-9a-f]{8}$/);
  });
});

// ── getRanking / getRankByKey — mock the OpenSkill core, exercise the ─────
// caching + rank-index logic that is actually hronir-rank.ts's own.

function row(overrides: Partial<RankRow>): RankRow {
  return {
    key: "post",
    mu: 25,
    sigma: 8.33,
    ordinal: 0,
    appearances: 1,
    wins: 1,
    path: "src/content/blog/post.md",
    ...overrides,
  };
}

describe("getRanking / getRankByKey", () => {
  it("returns computeRatings' rows unmodified, preserving order", async () => {
    ratingsToReturn = [
      row({ key: "a", ordinal: 10 }),
      row({ key: "b", ordinal: 5 }),
    ];
    const mod = await import(
      `../hronir-rank.ts?t=${Date.now()}-${Math.random()}`
    );
    assert.deepEqual(mod.getRanking(), ratingsToReturn);
  });

  it("caches: computeRatings is invoked exactly once across repeated calls", async () => {
    ratingsToReturn = [row({ key: "a" })];
    computeRatingsCallCount = 0;
    const mod = await import(
      `../hronir-rank.ts?t=${Date.now()}-${Math.random()}`
    );
    mod.getRanking();
    mod.getRanking();
    mod.getRanking();
    assert.equal(computeRatingsCallCount, 1);
  });

  it("empty corpus: computeRatings returning [] yields an empty ranking", async () => {
    ratingsToReturn = [];
    const mod = await import(
      `../hronir-rank.ts?t=${Date.now()}-${Math.random()}`
    );
    assert.deepEqual(mod.getRanking(), []);
    assert.equal(mod.getRankByKey().size, 0);
  });

  it("getRankByKey assigns rank = index + 1, preserving computeRatings' order", async () => {
    ratingsToReturn = [
      row({ key: "first", ordinal: 30 }),
      row({ key: "second", ordinal: 20 }),
      row({ key: "third", ordinal: 10 }),
    ];
    const mod = await import(
      `../hronir-rank.ts?t=${Date.now()}-${Math.random()}`
    );
    const byKey = mod.getRankByKey();
    assert.equal(byKey.size, 3);
    assert.equal(byKey.get("first").rank, 1);
    assert.equal(byKey.get("second").rank, 2);
    assert.equal(byKey.get("third").rank, 3);
    // total reflects the whole corpus size on every entry, not just its own rank.
    assert.equal(byKey.get("first").total, 3);
    assert.equal(byKey.get("third").total, 3);
  });

  it("getRankByKey does not silently dedupe two rows sharing the same key", async () => {
    // computeRatings is contractually one row per key, but if that ever broke,
    // a Map-based index would silently keep only the *last* one -- pin that
    // down rather than let it be a surprise discovered on the live ranking page.
    ratingsToReturn = [
      row({ key: "dup", ordinal: 1 }),
      row({ key: "dup", ordinal: 2 }),
    ];
    const mod = await import(
      `../hronir-rank.ts?t=${Date.now()}-${Math.random()}`
    );
    const byKey = mod.getRankByKey();
    assert.equal(byKey.size, 1);
    assert.equal(byKey.get("dup").rank, 2, "later row for the same key wins");
  });
});
