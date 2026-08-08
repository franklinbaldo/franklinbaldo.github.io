import { createHash } from "node:crypto";
import type { Assignment, Evaluation, EvaluationPlan } from "./types.js";
import { planDigest } from "./plans.js";

export function evaluationId(input: {
  assignmentId: string;
  evaluatorId: string;
  planId: string;
  planVersion: number;
  planDigest: string;
}): string {
  const canonical = JSON.stringify(input);
  return `evaluation-${createHash("sha256").update(canonical).digest("hex").slice(0, 24)}`;
}

export function validateEvaluation(input: {
  evaluation: Evaluation;
  assignment: Assignment;
  plan: EvaluationPlan;
}): string[] {
  const { evaluation, assignment, plan } = input;
  const errors: string[] = [];
  if (evaluation.assignmentId !== assignment.id) {
    errors.push("evaluation must reference its exact assignment");
  }
  if (evaluation.planId !== plan.id || evaluation.planVersion !== plan.version) {
    errors.push("evaluation plan does not match the materialized plan");
  }
  const digest = planDigest(plan);
  if (assignment.planDigest !== digest || evaluation.planDigest !== digest) {
    errors.push("evaluation plan digest does not match the materialized plan");
  }
  const expectedId = evaluationId({
    assignmentId: evaluation.assignmentId,
    evaluatorId: evaluation.evaluatorId,
    planId: evaluation.planId,
    planVersion: evaluation.planVersion,
    planDigest: evaluation.planDigest,
  });
  if (evaluation.id !== expectedId) {
    errors.push("evaluation id does not match its canonical identity");
  }
  if (evaluation.evaluatorId !== assignment.evaluatorId) {
    errors.push("evaluation must be submitted by the assigned evaluator");
  }
  if (evaluation.confidence < 0 || evaluation.confidence > 1) {
    errors.push("evaluation confidence must be between 0 and 1");
  }
  for (const [side, value] of [
    ["a", evaluation.ratings.a.editorialQuality],
    ["b", evaluation.ratings.b.editorialQuality],
  ] as const) {
    if (value !== null && (value < 1 || value > 5)) {
      errors.push(`side ${side} editorial quality must be between 1 and 5`);
    }
  }
  const evidenceSides = new Set(evaluation.evidence.map((item) => item.side));
  for (const side of ["a", "b"] as const) {
    if (!evidenceSides.has(side)) errors.push(`evidence for side ${side} is required`);
  }
  for (const item of evaluation.evidence) {
    if (!item.anchor.trim()) errors.push(`evidence ${item.side} anchor is required`);
    if (!item.observation.trim()) {
      errors.push(`evidence ${item.side} observation is required`);
    }
  }
  if (!evaluation.critiqueA.trim()) errors.push("critique A is required");
  if (!evaluation.critiqueB.trim()) errors.push("critique B is required");
  if (!evaluation.comparison.trim()) errors.push("comparison is required");
  return errors;
}
