import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const pythonBin = process.platform === "win32" ? "python" : "python3";
const snapshot = "qplib:inventory-sha256:fixture123";

function qclFixture() {
  return `Fixture_QCL
QCL
minimize
2 # number of variables
2 # number of constraints
2 # number of quadratic terms in objective
1 1 2
2 1 4
0 # default linear objective coefficient
1 # number of non-default linear objective coefficients
2 3
5 # objective constant
3 # number of linear terms in all constraints
1 1 1
1 2 2
2 2 -1
1E20 # infinity
0 # default constraint lower bound
1
2 -5
10 # default constraint upper bound
1
2 7
0 # default variable lower bound
0
1E20 # default variable upper bound
0
0 # default variable primal start
0
0 # default constraint dual start
0
0 # default variable bound dual start
0
0 # variable names
1 # constraint names
2 custom_c2
`;
}

function qgqFixture() {
  return `Fixture_QGQ
QGQ
maximize
2
1
1
2 1 8
0
0
0
1
1 2 1 6
1
1 1 2
1E20
-1E20
0
5
0
0
0
10
0
0
1
2 1
0
0
0
0
0
0
0
0
`;
}

function qbnFixture() {
  return `Fixture_QBN
QBN
maximize
2
1
2 1 4
0
0
0
1E20
0
0
0
0
0
0
`;
}

function writeFixtures(root) {
  mkdirSync(root, { recursive: true });
  writeFileSync(join(root, "fixture_qcl.qplib"), qclFixture(), "utf8");
  writeFileSync(join(root, "fixture_qgq.qplib"), qgqFixture(), "utf8");
  writeFileSync(join(root, "fixture_qbn.qplib"), qbnFixture(), "utf8");
}

function run(root) {
  return spawnSync(
    pythonBin,
    [
      "scripts/science-equations/harvest-qplib.py",
      "--input",
      root,
      "--snapshot",
      snapshot,
    ],
    { encoding: "utf8" },
  );
}

function parseRows(stdout) {
  return stdout.trim().split("\n").filter(Boolean).map(JSON.parse);
}

test("QPLIB adapter reconstructs objectives and constraints without claiming attested notation", () => {
  const root = mkdtempSync(join(tmpdir(), "atlas-qplib-"));
  writeFixtures(root);
  const result = run(root);
  assert.equal(result.status, 0, result.stderr);

  const rows = parseRows(result.stdout);
  assert.equal(rows.length, 6);
  assert.ok(rows.every((row) => row.source_id === "qplib-quadratic-programs"));
  assert.ok(rows.every((row) => row.provenance_class === "reconstructed"));
  assert.ok(rows.every((row) => row.expression_original === null));
  assert.ok(rows.every((row) => row.expression_reconstructed.length > 0));
  assert.ok(rows.every((row) => row.reconstruction.rule === "qplib-native-sparse-model-v1"));

  const qcl = rows.filter((row) => row.source_document_id === "Fixture_QCL");
  assert.deepEqual(qcl.map((row) => row.source_locator), [
    "Fixture_QCL#objective",
    "Fixture_QCL#constraint:1",
    "Fixture_QCL#constraint:2",
  ]);
  assert.equal(qcl[0].expression_reconstructed, "minimize f(x) := 1/2*((2)*x_1*x_1 + (4)*x_2*x_1) + (3)*x_2 + (5)");
  assert.equal(qcl[1].expression_reconstructed, "0 <= (1)*x_1 + (2)*x_2 <= 10");
  assert.equal(qcl[2].expression_reconstructed, "-5 <= (-1)*x_2 <= 7");
  assert.equal(qcl[2].source_attested_payload.constraint_name, "custom_c2");

  const qgqConstraint = rows.find((row) => row.source_locator === "Fixture_QGQ#constraint:1");
  assert.equal(qgqConstraint.expression_reconstructed, "1/2*((6)*x_2*x_1) + (2)*x_1 <= 5");
  assert.equal(qgqConstraint.source_attested_payload.quadratic_terms, 1);

  const metrics = JSON.parse(result.stderr.trim().split("\n").at(-1));
  assert.equal(metrics.files_seen, 3);
  assert.equal(metrics.files_rejected, 0);
  assert.equal(metrics.objectives_emitted, 3);
  assert.equal(metrics.constraints_emitted, 3);
  assert.equal(metrics.records_emitted, 6);
});

test("QPLIB logical occurrence identity is independent of checkout directory", () => {
  const left = mkdtempSync(join(tmpdir(), "atlas-qplib-left-"));
  const right = mkdtempSync(join(tmpdir(), "atlas-qplib-right-"));
  writeFixtures(left);
  writeFixtures(right);

  const first = run(left);
  const second = run(right);
  assert.equal(first.status, 0, first.stderr);
  assert.equal(second.status, 0, second.stderr);

  const hashes = (stdout) => parseRows(stdout).map((row) => row.source_record_sha256);
  assert.deepEqual(hashes(first.stdout), hashes(second.stdout));
});

test("QPLIB adapter fails closed on invalid lower-triangle terms", () => {
  const root = mkdtempSync(join(tmpdir(), "atlas-qplib-invalid-"));
  writeFileSync(join(root, "bad.qplib"), qbnFixture().replace("2 1 4", "1 2 4"), "utf8");
  const result = run(root);
  assert.equal(result.status, 2);
  const metrics = JSON.parse(result.stderr.trim().split("\n").at(-1));
  assert.equal(metrics.files_rejected, 1);
  assert.equal(metrics.records_emitted, 0);
});
