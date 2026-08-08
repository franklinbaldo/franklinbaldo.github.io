import type {
  Assignment,
  Evaluation,
  EvaluationTarget,
} from "./types.js";

export type ImportRow = Record<string, string | number | null>;

function targetFields(prefix: "side_a" | "side_b", target: EvaluationTarget) {
  if (target.kind === "media") {
    return {
      [`${prefix}_kind`]: target.kind,
      [`${prefix}_work_id`]: target.workId,
      [`${prefix}_media_id`]: target.mediaId,
      [`${prefix}_revision_id`]: target.revisionId,
      [`${prefix}_media_kind`]: target.mediaKind,
      [`${prefix}_content_digest`]: target.contentDigest,
    };
  }
  return {
    [`${prefix}_kind`]: target.kind,
    [`${prefix}_work_id`]: target.workId,
    [`${prefix}_expression_id`]: target.expressionId,
    [`${prefix}_revision_id`]: target.revisionId,
    [`${prefix}_language`]: target.language,
    [`${prefix}_content_digest`]: target.contentDigest,
    [`${prefix}_blob_oid`]: target.blobOid,
    [`${prefix}_observed_in_commits_json`]: JSON.stringify(
      target.observedInCommits
    ),
    [`${prefix}_path_at_assignment`]: target.pathAtAssignment,
  };
}

export function assignmentImportRow(assignment: Assignment): ImportRow {
  return {
    id: assignment.id,
    plan_id: assignment.planId,
    plan_version: assignment.planVersion,
    seed: assignment.seed,
    evaluator_id: assignment.evaluatorId,
    status: assignment.status,
    created_at: assignment.createdAt,
    ...targetFields("side_a", assignment.sideA),
    ...targetFields("side_b", assignment.sideB),
  };
}

export function evaluationImportRow(evaluation: Evaluation): ImportRow {
  return {
    id: evaluation.id,
    assignment_id: evaluation.assignmentId,
    plan_id: evaluation.planId,
    plan_version: evaluation.planVersion,
    evaluator_id: evaluation.evaluatorId,
    model_id: evaluation.modelId,
    prompt_version: evaluation.promptVersion,
    submitted_at: evaluation.submittedAt,
    preference: evaluation.preference,
    confidence: evaluation.confidence,
    rating_a_editorial_quality: evaluation.ratings.a.editorialQuality,
    rating_b_editorial_quality: evaluation.ratings.b.editorialQuality,
    evidence_json: JSON.stringify(evaluation.evidence),
    critique_a: evaluation.critiqueA,
    critique_b: evaluation.critiqueB,
    comparison: evaluation.comparison,
  };
}
