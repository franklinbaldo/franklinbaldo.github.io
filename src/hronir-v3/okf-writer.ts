import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import type { ImportRow } from "./serialization.js";

export const OKF_PARSER_SOURCE =
  "git+https://github.com/franklinbaldo/okf-parser@e3ca11c820aa93357f6f37f607c17b5a1f99866e";

export interface CommandResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

export type CommandExecutor = (command: string, args: string[]) => CommandResult;

export interface OkfResult {
  [key: string]: unknown;
}

const defaultExecutor: CommandExecutor = (command, args) => {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    env: {
      ...process.env,
      UV_CACHE_DIR:
        process.env.UV_CACHE_DIR ?? join(tmpdir(), "hronir-uv-cache"),
      UV_TOOL_DIR:
        process.env.UV_TOOL_DIR ?? join(tmpdir(), "hronir-uv-tools"),
    },
  });
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
};

function parseResult(result: CommandResult, operation: string): OkfResult {
  if (result.status !== 0) {
    throw new Error(
      `${operation} failed (${result.status ?? "signal"}): ${result.stderr || result.stdout}`
    );
  }
  try {
    return JSON.parse(result.stdout) as OkfResult;
  } catch (error) {
    throw new Error(`${operation} returned invalid JSON`, { cause: error });
  }
}

export class OkfWriter {
  private readonly bundlePath: string;
  private readonly execute: CommandExecutor;

  constructor(
    bundlePath: string,
    execute: CommandExecutor = defaultExecutor
  ) {
    this.bundlePath = bundlePath;
    this.execute = execute;
  }

  importConcept(
    conceptType:
      | "Assignment"
      | "Assignment State"
      | "Evaluation"
      | "Evaluation Plan"
      | "Projection Snapshot"
      | "Revision Recommendation",
    row: ImportRow,
    options: { write: boolean; onConflict?: "skip" | "verify-identical" }
  ): OkfResult {
    const scratch = mkdtempSync(join(tmpdir(), "hronir-import-"));
    const source = join(scratch, "concept.json");
    try {
      writeFileSync(source, JSON.stringify([row]), "utf8");
      const args = [
        "--from",
        OKF_PARSER_SOURCE,
        "okf-parser",
        "import",
        source,
        this.bundlePath,
        "--type",
        conceptType,
        "--id-column",
        "id",
        "--on-conflict",
        options.onConflict ?? "verify-identical",
      ];
      if (options.write) args.push("--write");
      return parseResult(
        this.execute("uvx", args),
        `import ${conceptType}`
      );
    } finally {
      rmSync(scratch, { recursive: true, force: true });
    }
  }

  ensureAssignmentState(
    row: ImportRow,
    options: { write: boolean }
  ): OkfResult {
    return this.importConcept("Assignment State", row, {
      ...options,
      onConflict: "skip",
    });
  }

  completeEvaluatedAssignments(options: { write: boolean }): OkfResult {
    const sql = [
      'UPDATE "Assignment State" AS assignment_state',
      "SET status = 'completed'",
      "WHERE status = 'pending'",
      "AND EXISTS (",
      '  SELECT 1 FROM "Evaluation" AS evaluation',
      "  WHERE evaluation.assignment_id = assignment_state.assignment_id",
      ")",
    ].join("\n");
    const args = [
      "--from",
      OKF_PARSER_SOURCE,
      "okf-parser",
      "apply",
      this.bundlePath,
      "--sql",
      sql,
    ];
    if (options.write) args.push("--write");
    return parseResult(this.execute("uvx", args), "complete assignments");
  }
}
