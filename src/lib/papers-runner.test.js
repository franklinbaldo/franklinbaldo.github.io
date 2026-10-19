import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import * as yaml from "js-yaml";

const workflow = yaml.load(
  readFileSync(
    new URL(
      "../../.github/workflows/papers-experiment-runner.yml",
      import.meta.url
    ),
    "utf8"
  )
);
const job = workflow.jobs.experiment;

test("papers runner remains manual and read-only", () => {
  assert.deepEqual(Object.keys(workflow.on), ["workflow_dispatch"]);
  assert.deepEqual(workflow.permissions, { contents: "read" });
  assert.equal(
    job.steps.find((s) => s.name === "Checkout exact papers source").with[
      "persist-credentials"
    ],
    false
  );
});

test("job environment uses only available expression contexts", () => {
  const allowed = new Set([
    "github",
    "needs",
    "strategy",
    "matrix",
    "vars",
    "secrets",
    "inputs",
  ]);
  for (const value of Object.values(job.env)) {
    for (const match of value.matchAll(/\$\{\{\s*(\w+)\./g))
      assert.ok(allowed.has(match[1]), `${match[1]} is unavailable in job env`);
  }
});

test("bundle directory is initialized for later steps using runner temp", () => {
  const dir = mkdtempSync(join(tmpdir(), "papers-runner-"));
  try {
    const step = job.steps.find(
      (s) => s.name === "Initialize bundle directory"
    );
    assert.ok(step);
    const envFile = join(dir, "env");
    const result = spawnSync("bash", ["-euo", "pipefail", "-c", step.run], {
      env: { ...process.env, RUNNER_TEMP: dir, GITHUB_ENV: envFile },
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(
      readFileSync(envFile, "utf8"),
      `BUNDLE_DIR=${dir}/papers-experiment-bundle\n`
    );
    assert.equal(job.steps[0], step);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

for (const exitCode of ["0", "7", ""]) {
  test(`summary preserves literal inputs and exit code ${exitCode || "not-run"}`, () => {
    const dir = mkdtempSync(join(tmpdir(), "papers-summary-"));
    try {
      const run = job.steps.find(
        (s) => s.name === "Collect result payload and provenance"
      ).run;
      const summary = run.slice(run.lastIndexOf("\n{"));
      const summaryFile = join(dir, "summary");
      const result = spawnSync("bash", ["-euo", "pipefail", "-c", summary], {
        env: {
          ...process.env,
          BUNDLE_DIR: dir,
          GITHUB_STEP_SUMMARY: summaryFile,
          EXPERIMENT_ID: "printf INJECTED",
          WORKDIR: "dir with spaces",
          ARTIFACT_PATH: "results/**",
          RESOLVED_SOURCE_SHA: "",
          EXPERIMENT_EXIT_CODE: exitCode,
        },
        encoding: "utf8",
      });
      assert.equal(result.status, 0, result.stderr);
      assert.equal(result.stderr, "");
      const text = readFileSync(summaryFile, "utf8");
      assert.ok(text.includes("- experiment: `printf INJECTED`"));
      assert.ok(text.includes("- source: `franklinbaldo/papers@unresolved`"));
      assert.ok(text.includes("- workdir: `dir with spaces`"));
      assert.ok(text.includes(`- exit code: \`${exitCode || "not-run"}\``));
      assert.ok(text.includes("- payload: no files matched `results/**`"));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
}
