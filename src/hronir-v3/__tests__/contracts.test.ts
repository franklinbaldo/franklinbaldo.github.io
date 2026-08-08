import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createAssignment, validateAssignment } from "../assignment.js";
import { evaluationId, validateEvaluation } from "../evaluation.js";
import {
  AFFECTIVE_EXPERIMENT_PLAN,
  EDITORIAL_CALIBRATION_PLAN,
  EDITORIAL_WORK_PROJECTION,
  MEDIA_AUDIO_PLAN,
  planCanFeedProjection,
  validatePlan,
} from "../plans.js";
import type { Evaluation, RevisionTarget } from "../types.js";

const revision = (suffix: string): RevisionTarget => ({
  kind: "revision",
  workId: `work-${suffix}`,
  expressionId: `expression-${suffix}-pt`,
  revisionId: `revision-${suffix}`,
  language: "pt",
  contentDigest: `sha256:${suffix}`,
  blobOid: `blob-${suffix}`,
  observedInCommits: [`commit-${suffix}`],
  pathAtAssignment: `src/content/blog/${suffix}.mdx`,
});

describe("EvaluationPlan effects", () => {
  it("accepts all built-in plans", () => {
    assert.deepEqual(validatePlan(EDITORIAL_CALIBRATION_PLAN), []);
    assert.deepEqual(validatePlan(AFFECTIVE_EXPERIMENT_PLAN), []);
    assert.deepEqual(validatePlan(MEDIA_AUDIO_PLAN), []);
  });

  it("keeps affective readings out of the editorial ranking", () => {
    assert.equal(
      planCanFeedProjection(
        AFFECTIVE_EXPERIMENT_PLAN,
        EDITORIAL_WORK_PROJECTION
      ),
      false
    );
    assert.equal(
      planCanFeedProjection(
        EDITORIAL_CALIBRATION_PLAN,
        EDITORIAL_WORK_PROJECTION
      ),
      true
    );
  });

  it("rejects an affective plan that claims a global ranking effect", () => {
    const invalid = {
      ...AFFECTIVE_EXPERIMENT_PLAN,
      effects: ["editorial-work-ranking" as const],
    };
    assert.match(validatePlan(invalid).join("\n"), /affective-chain/);
  });
});

describe("Assignment identity", () => {
  it("is deterministic and preserves exact revisions", () => {
    const input = {
      plan: EDITORIAL_CALIBRATION_PLAN,
      seed: "round-1:pair-1",
      evaluatorId: "codex-test",
      createdAt: "2026-08-08T00:00:00Z",
      sideA: revision("a"),
      sideB: revision("b"),
    };
    const first = createAssignment(input);
    const resumed = createAssignment(input);
    assert.equal(first.id, resumed.id);
    assert.equal(first.sideA.revisionId, "revision-a");
    assert.deepEqual(
      validateAssignment(first, EDITORIAL_CALIBRATION_PLAN),
      []
    );
    assert.match(
      validateAssignment(
        { ...first, id: "assignment-forged" },
        EDITORIAL_CALIBRATION_PLAN
      ).join("\n"),
      /canonical identity/
    );
  });
});

describe("Evaluation", () => {
  it("accepts tie independently from absolute ratings", () => {
    const assignment = createAssignment({
      plan: EDITORIAL_CALIBRATION_PLAN,
      seed: "round-1:pair-1",
      evaluatorId: "codex-test",
      createdAt: "2026-08-08T00:00:00Z",
      sideA: revision("a"),
      sideB: revision("b"),
    });
    const base = {
      assignmentId: assignment.id,
      evaluatorId: assignment.evaluatorId,
      planId: assignment.planId,
      planVersion: assignment.planVersion,
      planDigest: assignment.planDigest,
    };
    const evaluation: Evaluation = {
      type: "Evaluation",
      id: evaluationId(base),
      ...base,
      modelId: "test-model",
      promptVersion: "evaluation-v4",
      submittedAt: "2026-08-08T00:10:00Z",
      preference: "tie",
      confidence: 0.7,
      ratings: {
        a: { editorialQuality: 4.25 },
        b: { editorialQuality: 4 },
      },
      evidence: [
        { side: "a", anchor: "seção A", observation: "evidência A" },
        { side: "b", anchor: "seção B", observation: "evidência B" },
      ],
      critiqueA: "crítica A",
      critiqueB: "crítica B",
      comparison: "comparação",
    };
    assert.deepEqual(
      validateEvaluation({
        evaluation,
        assignment,
        plan: EDITORIAL_CALIBRATION_PLAN,
      }),
      []
    );
    assert.match(
      validateEvaluation({
        evaluation: { ...evaluation, id: "evaluation-forged" },
        assignment,
        plan: EDITORIAL_CALIBRATION_PLAN,
      }).join("\n"),
      /canonical identity/
    );
  });

  it("requires anchored evidence for both sides", () => {
    const assignment = createAssignment({
      plan: EDITORIAL_CALIBRATION_PLAN,
      seed: "round-1:pair-2",
      evaluatorId: "codex-test",
      createdAt: "2026-08-08T00:00:00Z",
      sideA: revision("a"),
      sideB: revision("b"),
    });
    const base = {
      assignmentId: assignment.id,
      evaluatorId: assignment.evaluatorId,
      planId: assignment.planId,
      planVersion: assignment.planVersion,
      planDigest: assignment.planDigest,
    };
    const evaluation: Evaluation = {
      type: "Evaluation",
      id: evaluationId(base),
      ...base,
      modelId: "test-model",
      promptVersion: "evaluation-v4",
      submittedAt: "2026-08-08T00:10:00Z",
      preference: "a",
      confidence: 0.8,
      ratings: {
        a: { editorialQuality: 4 },
        b: { editorialQuality: 3 },
      },
      evidence: [
        { side: "a", anchor: "", observation: "evidência genérica" },
      ],
      critiqueA: "crítica A",
      critiqueB: "crítica B",
      comparison: "comparação",
    };
    const errors = validateEvaluation({
      evaluation,
      assignment,
      plan: EDITORIAL_CALIBRATION_PLAN,
    });
    assert.ok(errors.includes("evidence for side b is required"));
    assert.ok(errors.includes("evidence a anchor is required"));
  });
});
