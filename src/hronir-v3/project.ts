import { OkfWriter, type OkfResult } from "./okf-writer.js";
import {
  projectEditorialWorkRanking,
  type ProjectionObservation,
} from "./projection.js";
import { recommendRevisionAttention } from "./recommendation.js";
import {
  projectionSnapshotImportRow,
  revisionRecommendationImportRow,
} from "./serialization.js";
import type {
  ProjectionDefinition,
  ProjectionSnapshot,
  RevisionRecommendation,
} from "./types.js";

export interface ProjectResult {
  snapshot: ProjectionSnapshot;
  recommendations: RevisionRecommendation[];
  persistence: {
    snapshot: OkfResult;
    recommendations: OkfResult[];
  };
}

export function projectAndPersist(
  input: {
    projection: ProjectionDefinition;
    observations: ProjectionObservation[];
  },
  options: {
    bundlePath: string;
    write: boolean;
    minimumComparisons?: number;
    bottomFraction?: number;
    writer?: OkfWriter;
  }
): ProjectResult {
  const snapshot = projectEditorialWorkRanking(
    input.projection,
    input.observations
  );
  const recommendations = recommendRevisionAttention(snapshot, options);
  const writer = options.writer ?? new OkfWriter(options.bundlePath);
  const persistedSnapshot = writer.importConcept(
    "Projection Snapshot",
    projectionSnapshotImportRow(snapshot),
    options
  );
  const persistedRecommendations = recommendations.map((recommendation) =>
    writer.importConcept(
      "Revision Recommendation",
      revisionRecommendationImportRow(recommendation),
      options
    )
  );
  return {
    snapshot,
    recommendations,
    persistence: {
      snapshot: persistedSnapshot,
      recommendations: persistedRecommendations,
    },
  };
}
