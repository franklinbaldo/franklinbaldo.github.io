import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { createAssignment } from "../assignment.js";
import { evaluationId } from "../evaluation.js";
import {
  OKF_PARSER_SOURCE,
  OkfWriter,
  type CommandExecutor,
} from "../okf-writer.js";
import { EDITORIAL_CALIBRATION_PLAN } from "../plans.js";
import { runTurn } from "../run.js";
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

function turn() {
  const assignment = createAssignment({
    plan: EDITORIAL_CALIBRATION_PLAN,
    seed: "round-1:pair-1",
    evaluatorId: "codex-test",
    createdAt: "2026-08-08T00:00:00Z",
    sideA: revision("a"),
    sideB: revision("b"),
  });
  const identity = {
    assignmentId: assignment.id,
    evaluatorId: assignment.evaluatorId,
    planId: assignment.planId,
    planVersion: assignment.planVersion,
    planDigest: assignment.planDigest,
  };
  const evaluation: Evaluation = {
    type: "Evaluation",
    id: evaluationId(identity),
    ...identity,
    modelId: "test-model",
    promptVersion: "evaluation-v4",
    submittedAt: "2026-08-08T00:10:00Z",
    preference: "a",
    confidence: 0.8,
    ratings: {
      a: { editorialQuality: 4.5 },
      b: { editorialQuality: 3.75 },
    },
    evidence: [
      { side: "a", anchor: "seção A", observation: "evidência A" },
      { side: "b", anchor: "seção B", observation: "evidência B" },
    ],
    critiqueA: "crítica A",
    critiqueB: "crítica B",
    comparison: "comparação",
  };
  return { plan: EDITORIAL_CALIBRATION_PLAN, assignment, evaluation };
}

describe("OKF writer", () => {
  it(
    "replays a completed turn against the bundle produced by its first run",
    { timeout: 120_000 },
    () => {
      const bundle = mkdtempSync(join(tmpdir(), "hronir-replay-"));
      try {
        const input = turn();
        const first = runTurn(input, { bundlePath: bundle, write: true });
        const replay = runTurn(input, { bundlePath: bundle, write: true });

        assert.deepEqual(first.assignment.created, [
          `assignment/${input.assignment.id}.md`,
        ]);
        assert.deepEqual(replay.assignment.matched_existing, [
          `assignment/${input.assignment.id}.md`,
        ]);
        assert.deepEqual(replay.evaluation?.matched_existing, [
          `evaluation/${input.evaluation.id}.md`,
        ]);
        assert.deepEqual(replay.assignmentState.skipped_existing, [
          `assignment-state/assignment-state-${input.assignment.id}.md`,
        ]);
        assert.equal(replay.transition?.succeeded, true);
        assert.deepEqual(replay.transition?.changed_paths, []);
      } finally {
        rmSync(bundle, { recursive: true, force: true });
      }
    }
  );

  it("uses replay-safe import and apply as the only write surfaces", () => {
    const calls: Array<{ command: string; args: string[]; row?: unknown }> = [];
    const execute: CommandExecutor = (command, args) => {
      const sourceIndex = args.indexOf("import") + 1;
      calls.push({
        command,
        args: [...args],
        row:
          sourceIndex > 0
            ? JSON.parse(readFileSync(args[sourceIndex], "utf8"))[0]
            : undefined,
      });
      return { status: 0, stdout: '{"succeeded":true}', stderr: "" };
    };
    const writer = new OkfWriter(".routines/hronir-v3", execute);

    runTurn(turn(), {
      bundlePath: ".routines/hronir-v3",
      write: true,
      writer,
    });

    assert.equal(calls.length, 5);
    assert.deepEqual(
      calls.map((call) => call.args[3]),
      ["import", "import", "import", "import", "apply"]
    );
    for (const call of calls) {
      assert.equal(call.command, "uvx");
      assert.equal(call.args[1], OKF_PARSER_SOURCE);
      assert.ok(call.args.includes("--write"));
    }
    for (const call of [calls[0], calls[1], calls[3]]) {
      assert.ok(call.args.includes("verify-identical"));
    }
    assert.ok(calls[2].args.includes("skip"));
    assert.match(calls[4].args.join("\n"), /EXISTS/);
    assert.match(calls[4].args.join("\n"), /evaluation\.assignment_id/);
    assert.equal(
      (calls[1].row as Record<string, unknown>).side_a_revision_id,
      "revision-a"
    );
    assert.equal(
      (calls[3].row as Record<string, unknown>).assignment_id,
      turn().assignment.id
    );
  });

  it("previews the same pipeline without write flags", () => {
    const calls: string[][] = [];
    const writer = new OkfWriter("bundle", (_command, args) => {
      calls.push(args);
      return { status: 0, stdout: "{}", stderr: "" };
    });
    const result = runTurn(turn(), {
      bundlePath: "bundle",
      write: false,
      writer,
    });
    assert.equal(result.written, false);
    assert.equal(calls.length, 5);
    assert.ok(calls.every((args) => !args.includes("--write")));
  });

  it("does not invoke OKF for an invalid evaluation", () => {
    let calls = 0;
    const writer = new OkfWriter("bundle", () => {
      calls += 1;
      return { status: 0, stdout: "{}", stderr: "" };
    });
    const input = turn();
    input.evaluation.evidence = [];
    assert.throws(
      () =>
        runTurn(input, {
          bundlePath: "bundle",
          write: true,
          writer,
        }),
      /evaluation is invalid/
    );
    assert.equal(calls, 0);
  });
});
