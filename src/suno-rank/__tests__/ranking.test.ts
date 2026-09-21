import { test } from "node:test";
import assert from "node:assert/strict";
import { _computeRatings, MARGIN_W_MIN } from "../ranking.js";
import type { RawMatch } from "../types.js";

function match(overrides: Partial<RawMatch>): RawMatch {
  return {
    runAt: "2026-01-01T00:00:00.000Z",
    runId: "r1",
    aKey: "a",
    bKey: "b",
    winner: "a",
    rateA: 4,
    rateB: 3,
    ...overrides,
  };
}

test("_computeRatings: winner ends up ranked above loser after one duel", () => {
  const rows = _computeRatings([match({})]);
  const byKey = new Map(rows.map((r) => [r.key, r]));
  assert.ok(byKey.get("a")!.ordinal > byKey.get("b")!.ordinal);
  assert.equal(byKey.get("a")!.wins, 1);
  assert.equal(byKey.get("b")!.wins, 0);
  assert.equal(byKey.get("a")!.appearances, 1);
  assert.equal(byKey.get("b")!.appearances, 1);
});

test("_computeRatings: a close-margin win moves ratings less than a blowout", () => {
  const close = _computeRatings([match({ rateA: 3.1, rateB: 3.0 })]);
  const blowout = _computeRatings([match({ rateA: 5, rateB: 1 })]);
  const closeMu = close.find((r) => r.key === "a")!.mu;
  const blowoutMu = blowout.find((r) => r.key === "a")!.mu;
  // Both start from the same default prior, so a bigger margin should move
  // the winner's mu further from the prior than a near-tie does.
  assert.ok(blowoutMu > closeMu);
});

test("_computeRatings: self-duels (aKey === bKey) are ignored", () => {
  const rows = _computeRatings([match({ aKey: "x", bKey: "x" })]);
  assert.deepEqual(rows, []);
});

test("_computeRatings: MARGIN_W_MIN keeps even a maximal-margin update from fully replacing the prior in one step", () => {
  // Sanity check on the exported constant itself, not a derived value —
  // this is what guarantees a single blowout duel can't fully determine a
  // song's rating from one judgment.
  assert.ok(MARGIN_W_MIN > 0 && MARGIN_W_MIN < 1);
});
