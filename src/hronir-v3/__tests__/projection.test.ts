import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createAssignment } from "../assignment.js";
import { evaluationId } from "../evaluation.js";
import { OkfWriter } from "../okf-writer.js";
import {
  AFFECTIVE_EXPERIMENT_PLAN,
  EDITORIAL_CALIBRATION_PLAN,
  EDITORIAL_WORK_PROJECTION,
} from "../plans.js";
import { projectEditorialWorkRanking } from "../projection.js";
import { projectAndPersist } from "../project.js";
import { recommendRevisionAttention } from "../recommendation.js";
import type {
  Evaluation,
  EvaluationPlan,
  RevisionTarget,
} from "../types.js";

const revision = (workId: string): RevisionTarget => ({
  kind: "revision",
  workId,
  expressionId: `${workId}-pt`,
  revisionId: `${workId}-revision`,
  language: "pt",
  contentDigest: `sha256:${workId}`,
  blobOid: `blob-${workId}`,
  observedInCommits: [`commit-${workId}`],
  pathAtAssignment: `src/content/blog/${workId}.mdx`,
});

function observation(
  suffix: string,
  sideA: string,
  sideB: string,
  preference: Evaluation["preference"],
  plan: EvaluationPlan = EDITORIAL_CALIBRATION_PLAN
) {
  const assignment = createAssignment({
    plan,
    seed: `seed-${suffix}`,
    evaluatorId: "evaluator",
    createdAt: "2026-08-08T00:00:00Z",
    sideA: revision(sideA),
    sideB: revision(sideB),
  });
  const identity = {
    assignmentId: assignment.id,
    evaluatorId: assignment.evaluatorId,
    planId: assignment.planId,
    planVersion: assignment.planVersion,
  };
  const evaluation: Evaluation = {
    type: "Evaluation",
    id: evaluationId(identity),
    ...identity,
    modelId: "model",
    promptVersion: "v1",
    submittedAt: "2026-08-08T00:01:00Z",
    preference,
    confidence: 1,
    ratings: {
      a: { editorialQuality: 4 },
      b: { editorialQuality: 3 },
    },
    evidence: [
      { side: "a", anchor: "A", observation: "evidence A" },
      { side: "b", anchor: "B", observation: "evidence B" },
    ],
    critiqueA: "critique A",
    critiqueB: "critique B",
    comparison: "comparison",
  };
  return { plan, assignment, evaluation };
}

describe("editorial work projection", () => {
  it("is deterministic, versioned, and excludes incompatible effects", () => {
    const inputs = [
      observation("1", "work-a", "work-b", "a"),
      observation("2", "work-a", "work-c", "tie"),
      observation(
        "3",
        "work-b",
        "work-c",
        "b",
        AFFECTIVE_EXPERIMENT_PLAN
      ),
    ];
    const first = projectEditorialWorkRanking(
      EDITORIAL_WORK_PROJECTION,
      inputs,
      { generatedAt: "2026-08-08T01:00:00Z" }
    );
    const replay = projectEditorialWorkRanking(
      EDITORIAL_WORK_PROJECTION,
      inputs.slice().reverse(),
      { generatedAt: "2026-08-09T01:00:00Z" }
    );
    assert.equal(first.id, replay.id);
    assert.deepEqual(
      first.entries.map((entry) => entry.workId),
      ["work-a", "work-c", "work-b"]
    );
    assert.equal(first.evaluationIds.length, 2);
  });

  it("produces recommendations without mutating or selecting revisions", () => {
    const inputs = [
      observation("1", "work-a", "work-b", "a"),
      observation("2", "work-a", "work-b", "a"),
      observation("3", "work-a", "work-b", "a"),
    ];
    const snapshot = projectEditorialWorkRanking(
      EDITORIAL_WORK_PROJECTION,
      inputs,
      { generatedAt: "2026-08-08T01:00:00Z" }
    );
    const recommendations = recommendRevisionAttention(snapshot, {
      bottomFraction: 0.5,
      minimumComparisons: 3,
    });
    assert.equal(recommendations.length, 1);
    assert.equal(recommendations[0].workId, "work-b");
    assert.equal(recommendations[0].status, "proposed");
    assert.equal(recommendations[0].basis.comparisons, 3);
    assert.ok(!("revisionId" in recommendations[0]));
  });

  it("does not recommend low-support entries", () => {
    const snapshot = projectEditorialWorkRanking(
      EDITORIAL_WORK_PROJECTION,
      [observation("1", "work-a", "work-b", "a")],
      { generatedAt: "2026-08-08T01:00:00Z" }
    );
    assert.deepEqual(recommendRevisionAttention(snapshot), []);
  });

  it("persists snapshots and recommendations through replay-safe import", () => {
    const conceptTypes: string[] = [];
    const writer = new OkfWriter("bundle", (_command, args) => {
      conceptTypes.push(args[args.indexOf("--type") + 1]);
      assert.ok(args.includes("verify-identical"));
      return { status: 0, stdout: "{}", stderr: "" };
    });
    const inputs = [
      observation("1", "work-a", "work-b", "a"),
      observation("2", "work-a", "work-b", "a"),
      observation("3", "work-a", "work-b", "a"),
    ];
    const result = projectAndPersist(
      {
        projection: EDITORIAL_WORK_PROJECTION,
        observations: inputs,
        generatedAt: "2026-08-08T01:00:00Z",
      },
      {
        bundlePath: "bundle",
        write: true,
        bottomFraction: 0.5,
        minimumComparisons: 3,
        writer,
      }
    );
    assert.equal(result.recommendations.length, 1);
    assert.deepEqual(conceptTypes, [
      "Projection Snapshot",
      "Revision Recommendation",
    ]);
  });
});
