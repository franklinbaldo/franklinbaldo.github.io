import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deriveReviewPriority } from "../tier-priority.js";

describe("deriveReviewPriority", () => {
  it("prioritizes unrated work without turning uncertainty into a low tier", () => {
    const result = deriveReviewPriority({
      tiered: false,
      confidence: null,
      appearances: 40,
      absoluteN: 8,
      gap: 0.1,
      perspectiveCount: 14,
      perspectiveUniverse: 14,
    });

    assert.equal(result.score, 100);
    assert.equal(result.signalAgreement, "high");
    assert.deepEqual(result.reasons, ["unrated"]);
  });

  it("separates strong evidence coverage from signal disagreement", () => {
    const result = deriveReviewPriority({
      tiered: true,
      confidence: "high",
      appearances: 60,
      absoluteN: 20,
      gap: 0.67,
      perspectiveCount: 14,
      perspectiveUniverse: 14,
    });

    assert.equal(result.score, 25);
    assert.equal(result.signalAgreement, "low");
    assert.deepEqual(result.reasons, ["large-absolute-deconfounded-gap"]);
  });

  it("raises review priority for low confidence and missing perspectives", () => {
    const result = deriveReviewPriority({
      tiered: true,
      confidence: "low",
      appearances: 18,
      absoluteN: 2,
      gap: 0.35,
      perspectiveCount: 11,
      perspectiveUniverse: 14,
    });

    assert.equal(result.score, 117);
    assert.equal(result.signalAgreement, "medium");
    assert.deepEqual(result.reasons, [
      "low-confidence",
      "missing-perspectives:3",
      "moderate-absolute-deconfounded-gap",
      "limited-pairwise-coverage",
      "light-absolute-coverage",
    ]);
  });
});
