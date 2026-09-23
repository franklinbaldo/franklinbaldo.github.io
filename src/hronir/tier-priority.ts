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
  versionAttention?: boolean;
  /** 0 = bottom of the ordinal table, 1 = top. */
  ordinalPercentile?: number | null;
  winRate?: number | null;
  absoluteQuality?: number | null;
  deconfoundedQuality?: number | null;
}

export interface ReviewPriority {
  score: number;
  signalAgreement: SignalAgreement;
  reasons: string[];
}

type DisagreementSeverity = 0 | 1 | 2;

function severityScore(severity: DisagreementSeverity): number {
  if (severity === 2) return 25;
  if (severity === 1) return 12;
  return 0;
}

function ordinalBand(value: number): 0 | 1 | 2 {
  if (value >= 2 / 3) return 2;
  if (value >= 1 / 3) return 1;
  return 0;
}

function winRateBand(value: number): 0 | 1 | 2 {
  if (value >= 0.6) return 2;
  if (value >= 0.4) return 1;
  return 0;
}

function qualityBand(value: number): 0 | 1 | 2 {
  if (value >= 4) return 2;
  if (value >= 3.5) return 1;
  return 0;
}

function deriveCrossSignalSeverity(
  input: ReviewPriorityInput,
): DisagreementSeverity {
  const bands: Array<0 | 1 | 2> = [];

  if (input.ordinalPercentile != null) {
    bands.push(ordinalBand(input.ordinalPercentile));
  }
  if (input.winRate != null) {
    bands.push(winRateBand(input.winRate));
  }
  if (input.absoluteQuality != null) {
    bands.push(qualityBand(input.absoluteQuality));
  }
  if (input.deconfoundedQuality != null) {
    bands.push(qualityBand(input.deconfoundedQuality));
  }

  if (bands.length < 2) return 0;
  const spread = Math.max(...bands) - Math.min(...bands);
  if (spread >= 2) return 2;
  if (spread >= 1) return 1;
  return 0;
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
  let disagreementSeverity: DisagreementSeverity = 0;
  if (absoluteGap >= 0.5) {
    disagreementSeverity = 2;
    score += severityScore(disagreementSeverity);
    reasons.push("large-absolute-deconfounded-gap");
  } else if (absoluteGap >= 0.3) {
    disagreementSeverity = 1;
    score += severityScore(disagreementSeverity);
    reasons.push("moderate-absolute-deconfounded-gap");
  }

  const crossSignalSeverity = deriveCrossSignalSeverity(input);
  if (crossSignalSeverity > 0) {
    reasons.push(
      crossSignalSeverity === 2
        ? "large-cross-signal-disagreement"
        : "moderate-cross-signal-disagreement",
    );
  }
  if (crossSignalSeverity > disagreementSeverity) {
    score +=
      severityScore(crossSignalSeverity) - severityScore(disagreementSeverity);
    disagreementSeverity = crossSignalSeverity;
  }

  const signalAgreement: SignalAgreement =
    disagreementSeverity === 2
      ? "low"
      : disagreementSeverity === 1
        ? "medium"
        : "high";

  if (input.versionAttention === true) {
    score += 40;
    reasons.push("version-attention");
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
