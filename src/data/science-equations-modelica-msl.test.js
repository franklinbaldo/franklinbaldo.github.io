import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const pythonBin = process.platform === "win32" ? "python" : "python3";
const snapshot = "modelica-msl:release:v4.1.0:git:fixturecommit:inventory-sha256:fixture123";
const releaseTag = "v4.1.0";
const commit = "fixturecommit";

function fixtureModel() {
  return `within Modelica.Electrical.Analog.Basic;
model Fixture
  Real x;
  Real y;
  Real z;
  Real q;
equation
  // exact source equality
  x = 1;
  assert(x > 0, "x; must stay positive");
  connect(a, b);
  y = if x > 0 then x else -x;
  m = [1,2;3,4];
  if x > 1 then
    z = x;
    q = z + 1;
  else
    z = 0;
    q = 0;
  end if;
initial equation
  x = 0;
algorithm
  x := 2;
end Fixture;
`;
}

function writeFixture(root) {
  const dir = join(root, "Modelica", "Electrical", "Analog", "Basic");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "Fixture.mo"), fixtureModel(), "utf8");
}

function run(root) {
  return spawnSync(
    pythonBin,
    [
      "scripts/science-equations/harvest-modelica-msl.py",
      "--input",
      root,
      "--snapshot",
      snapshot,
      "--release-tag",
      releaseTag,
      "--commit",
      commit,
    ],
    { encoding: "utf8" },
  );
}

test("Modelica MSL adapter emits attested equality equations and preserves control context", () => {
  const root = mkdtempSync(join(tmpdir(), "atlas-modelica-msl-"));
  writeFixture(root);
  const result = run(root);
  assert.equal(result.status, 0, result.stderr);

  const rows = result.stdout.trim().split("\n").filter(Boolean).map(JSON.parse);
  assert.equal(rows.length, 8);
  assert.deepEqual(rows.map((row) => row.expression_original), [
    "x = 1;",
    "y = if x > 0 then x else -x;",
    "m = [1,2;3,4];",
    "z = x;",
    "q = z + 1;",
    "z = 0;",
    "q = 0;",
    "x = 0;",
  ]);
  assert.ok(rows.every((row) => row.source_id === "modelica-msl-equations"));
  assert.ok(rows.every((row) => row.provenance_class === "attested"));
  assert.ok(rows.every((row) => row.expression_encoding === "Modelica equation syntax"));
  assert.ok(rows.every((row) => row.source_license === "BSD-3-Clause"));
  assert.ok(rows.every((row) => row.source_attested_payload.reconstruction_performed === false));
  assert.ok(rows.every((row) => row.source_attested_payload.ocr_performed === false));
  assert.equal(rows[0].source_document_id, "Modelica/Electrical/Analog/Basic/Fixture.mo");
  assert.equal(rows[0].source_class_path, "Modelica.Electrical.Analog.Basic.Fixture");
  assert.equal(rows[0].source_domain_path, "Electrical");
  assert.equal(rows[3].modelica_control_context[0], "if x > 1 then");
  assert.equal(rows[5].modelica_control_context[0], "else");
  assert.equal(rows.at(-1).modelica_section, "initial-equation");
  assert.equal(rows[2].modelica_rhs, "[1,2;3,4]");

  const metrics = JSON.parse(result.stderr.trim().split("\n").at(-1));
  assert.equal(metrics.files_seen, 1);
  assert.equal(metrics.records_written, 8);
  assert.equal(metrics.skipped_calls, 2);
  assert.equal(metrics.documents_rejected, 0);
  assert.equal(metrics.ocr_performed, 0);
  assert.equal(metrics.reconstructions, 0);
});

test("Modelica occurrence identity is independent of checkout directory", () => {
  const left = mkdtempSync(join(tmpdir(), "atlas-modelica-msl-left-"));
  const right = mkdtempSync(join(tmpdir(), "atlas-modelica-msl-right-"));
  writeFixture(left);
  writeFixture(right);

  const first = run(left);
  const second = run(right);
  assert.equal(first.status, 0, first.stderr);
  assert.equal(second.status, 0, second.stderr);

  const hashes = (stdout) => stdout.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line).source_record_sha256);
  assert.deepEqual(hashes(first.stdout), hashes(second.stdout));
});
