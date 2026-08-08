import { createHash } from "node:crypto";
import type {
  Assignment,
  EvaluationPlan,
  EvaluationTarget,
} from "./types.js";

function stableTarget(target: EvaluationTarget) {
  if (target.kind === "media") {
    return {
      kind: target.kind,
      mediaId: target.mediaId,
      revisionId: target.revisionId,
      contentDigest: target.contentDigest,
    };
  }
  return {
    kind: target.kind,
    workId: target.workId,
    expressionId: target.expressionId,
    revisionId: target.revisionId,
    contentDigest: target.contentDigest,
  };
}

export function assignmentId(input: {
  plan: Pick<EvaluationPlan, "id" | "version">;
  seed: string;
  evaluatorId: string;
  sideA: EvaluationTarget;
  sideB: EvaluationTarget;
}): string {
  const canonical = JSON.stringify({
    planId: input.plan.id,
    planVersion: input.plan.version,
    seed: input.seed,
    evaluatorId: input.evaluatorId,
    sideA: stableTarget(input.sideA),
    sideB: stableTarget(input.sideB),
  });
  return `assignment-${createHash("sha256").update(canonical).digest("hex").slice(0, 24)}`;
}

export function createAssignment(input: {
  plan: EvaluationPlan;
  seed: string;
  evaluatorId: string;
  createdAt: string;
  sideA: EvaluationTarget;
  sideB: EvaluationTarget;
}): Assignment {
  const id = assignmentId(input);
  return {
    type: "Assignment",
    id,
    planId: input.plan.id,
    planVersion: input.plan.version,
    seed: input.seed,
    evaluatorId: input.evaluatorId,
    status: "pending",
    createdAt: input.createdAt,
    sideA: input.sideA,
    sideB: input.sideB,
  };
}

export function validateAssignment(
  assignment: Assignment,
  plan: EvaluationPlan
): string[] {
  const errors: string[] = [];
  if (assignment.planId !== plan.id || assignment.planVersion !== plan.version) {
    errors.push("assignment plan does not match the materialized plan");
  }
  if (assignment.sideA.kind !== assignment.sideB.kind) {
    errors.push("assignment sides must have the same target kind");
  }
  const mediaPlan = plan.population.mediaKind === "audio";
  if (mediaPlan !== (assignment.sideA.kind === "media")) {
    errors.push("assignment targets are incompatible with plan media kind");
  }
  for (const [name, target] of [
    ["side A", assignment.sideA],
    ["side B", assignment.sideB],
  ] as const) {
    if (!target.revisionId.trim()) errors.push(`${name} revision id is required`);
    if (!target.contentDigest.trim()) {
      errors.push(`${name} content digest is required`);
    }
    if (target.kind === "revision") {
      if (!target.workId.trim()) errors.push(`${name} work id is required`);
      if (!target.expressionId.trim()) {
        errors.push(`${name} expression id is required`);
      }
      if (!target.pathAtAssignment.trim()) {
        errors.push(`${name} path at assignment is required`);
      }
    }
  }
  return errors;
}

