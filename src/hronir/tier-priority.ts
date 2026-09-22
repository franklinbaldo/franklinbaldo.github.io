export type TierConfidence = "low" | "medium" | "high" | null;
export type SignalAgreement = "low" | "medium" | "high";

export interface ReviewPriorityInput {
  tiered: boolean;
  confidence: TierConfidence;
  appearances: number;
  absoluteN: number;
  gap: number | null;
  perspectiveCount: number;
  perspectiveUniverse: number;
}

export interface ReviewPriority {
  score: number;
  signalAgreement: SignalAgreement;
  reasons: string[];
}

/**
 * Read-only triage heuristic for editorial review. The score ranks uncertainty,
 * not literary quality: canonical judgments remain in OKF blog-post-tier cards.
 */
export function deriveReviewPriority(input: ReviewPriorityInput): ReviewPriority {
  let score = 0;
  const reasons: string[] = [];

  if (!input.tiered) {
    score += 100;
    reasons.push("unrated");
  }

  if (input.confidence === "low") {
    score += 60;
    reasons.push("low-confidence");
  } else if (input.confidence === "medium") {
    score += 30;
    reasons.push("medium-confidence");
  }

  const missingPerspectives = Math.max(
    0,
    input.perspectiveUniverse - input.perspectiveCount,
  );
  if (missingPerspectives > 0) {
    score += Math.min(30, missingPerspectives * 6);
    reasons.push(`missing-perspectives:${missingPerspectives}`);
  }

  const absoluteGap = Math.abs(input.gap ?? 0);
  let signalAgreement: SignalAgreement = "high";
  if (absoluteGap >= 0.5) {
    signalAgreement = "low";
    score += 25;
    reasons.push("large-absolute-deconfounded-gap");
  } else if (absoluteGap >= 0.3) {
    signalAgreement = "medium";
    score += 12;
    reasons.push("moderate-absolute-deconfounded-gap");
  }

  if (input.appearances < 12) {
    score += 30;
    reasons.push("light-pairwise-coverage");
  } else if (input.appearances < 25) {
    score += 15;
    reasons.push("limited-pairwise-coverage");
  }

  if (input.absoluteN < 4) {
    score += 12;
    reasons.push("light-absolute-coverage");
  }

  if (reasons.length === 0) reasons.push("stable");

  return { score, signalAgreement, reasons };
}
