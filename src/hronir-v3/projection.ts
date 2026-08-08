import { createHash } from "node:crypto";
import { validateAssignment } from "./assignment.js";
import { validateEvaluation } from "./evaluation.js";
import { planCanFeedProjection } from "./plans.js";
import type {
  Assignment,
  Evaluation,
  EvaluationPlan,
  ProjectedWork,
  ProjectionDefinition,
  ProjectionSnapshot,
  RevisionTarget,
} from "./types.js";

export interface ProjectionObservation {
  plan: EvaluationPlan;
  assignment: Assignment;
  evaluation: Evaluation;
}

interface Accumulator {
  points: number;
  weight: number;
  comparisons: number;
}

function outcome(preference: Evaluation["preference"]): [number, number] | null {
  if (preference === "incomparable") return null;
  if (preference === "tie") return [0.5, 0.5];
  return preference === "a" ? [1, 0] : [0, 1];
}

function assertObservation(observation: ProjectionObservation): void {
  const assignmentErrors = validateAssignment(
    observation.assignment,
    observation.plan
  );
  const evaluationErrors = validateEvaluation({
    evaluation: observation.evaluation,
    assignment: observation.assignment,
    plan: observation.plan,
  });
  const errors = [...assignmentErrors, ...evaluationErrors];
  if (errors.length > 0) {
    throw new Error(`invalid projection observation:\n- ${errors.join("\n- ")}`);
  }
}

export function projectEditorialWorkRanking(
  projection: ProjectionDefinition,
  observations: ProjectionObservation[],
  options: { generatedAt: string }
): ProjectionSnapshot {
  const accepted = observations.filter((observation) => {
    assertObservation(observation);
    return planCanFeedProjection(observation.plan, projection);
  });
  const totals = new Map<string, Accumulator>();
  for (const { assignment, evaluation } of accepted) {
    if (assignment.sideA.kind !== "revision") {
      throw new Error("text projection received a media assignment");
    }
    const result = outcome(evaluation.preference);
    if (!result) continue;
    const sides = [assignment.sideA, assignment.sideB] as [
      RevisionTarget,
      RevisionTarget,
    ];
    for (const [index, target] of sides.entries()) {
      const total = totals.get(target.workId) ?? {
        points: 0,
        weight: 0,
        comparisons: 0,
      };
      total.points += result[index] * evaluation.confidence;
      total.weight += evaluation.confidence;
      total.comparisons += 1;
      totals.set(target.workId, total);
    }
  }
  const ranked = [...totals.entries()]
    .map(([workId, total]) => ({
      workId,
      score: total.weight === 0 ? 0.5 : total.points / total.weight,
      comparisons: total.comparisons,
      confidenceWeight: total.weight,
    }))
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.comparisons - left.comparisons ||
        left.workId.localeCompare(right.workId)
    );
  const entries: ProjectedWork[] = ranked.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
  const evaluationIds = accepted
    .map(({ evaluation }) => evaluation.id)
    .sort();
  const identity = JSON.stringify({
    projectionId: projection.id,
    projectionVersion: projection.version,
    observations: accepted
      .map(({ assignment, evaluation }) => [assignment.id, evaluation.id])
      .sort(),
  });
  const id = `projection-snapshot-${createHash("sha256")
    .update(identity)
    .digest("hex")
    .slice(0, 24)}`;
  return {
    type: "Projection Snapshot",
    id,
    projectionId: projection.id,
    projectionVersion: projection.version,
    generatedAt: options.generatedAt,
    evaluationIds,
    entries,
  };
}
