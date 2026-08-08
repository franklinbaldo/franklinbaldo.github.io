import { createHash } from "node:crypto";
import type {
  ProjectionSnapshot,
  RevisionRecommendation,
} from "./types.js";

export function recommendRevisionAttention(
  snapshot: ProjectionSnapshot,
  options: { bottomFraction?: number; minimumComparisons?: number } = {}
): RevisionRecommendation[] {
  const bottomFraction = options.bottomFraction ?? 0.2;
  const minimumComparisons = options.minimumComparisons ?? 3;
  if (bottomFraction <= 0 || bottomFraction > 1) {
    throw new Error("bottom fraction must be greater than 0 and at most 1");
  }
  if (!Number.isInteger(minimumComparisons) || minimumComparisons < 1) {
    throw new Error("minimum comparisons must be a positive integer");
  }
  const eligible = snapshot.entries.filter(
    (entry) => entry.comparisons >= minimumComparisons
  );
  const count = Math.ceil(eligible.length * bottomFraction);
  return eligible
    .slice()
    .sort(
      (left, right) =>
        left.score - right.score || left.workId.localeCompare(right.workId)
    )
    .slice(0, count)
    .map((entry) => {
      const id = `revision-recommendation-${createHash("sha256")
        .update(`${snapshot.id}:${entry.workId}`)
        .digest("hex")
        .slice(0, 24)}`;
      return {
        type: "Revision Recommendation",
        id,
        workId: entry.workId,
        projectionSnapshotId: snapshot.id,
        status: "proposed",
        priority: 1 - entry.score,
        basis: {
          rank: entry.rank,
          score: entry.score,
          comparisons: entry.comparisons,
        },
        reason: `Baixo desempenho relativo com suporte de ${entry.comparisons} comparações.`,
      };
    });
}
