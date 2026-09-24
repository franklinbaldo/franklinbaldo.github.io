import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const pythonBin = process.platform === "win32" ? "python" : "python3";
const commit = "a".repeat(40);
const snapshot = `modelica-msl:git:${commit}:inventory-sha256:${"b".repeat(64)}`;

function fixtureSource() {
  return `within Modelica.Test;
model Example
  Real x;
  Real y;
initial equation
  x = 1;
equation
  der(x) = -x;
  y = 2*x;
  if x > 0 then
    y = x + 1;
    connect(port_a, port_b);
  else
    y = 0;
  end if;
  when x < -1 then
    reinit(x, 0);
  end when;
algorithm
  y := 3;
  // equation fake = 1;
  annotation(Documentation(info="equation fake = 2;"));
end Example;
`;
}

function writeFixture(root) {
  const modelica = join(root, "Modelica");
  const dir = join(modelica, "Test");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "Example.mo"), fixtureSource(), "utf8");
  return modelica;
}

function run(input) {
  return spawnSync(
    pythonBin,
    [
      "scripts/science-equations/harvest-modelica-msl.py",
      "--input",
      input,
      "--commit",
      commit,
      "--snapshot",
      snapshot,
    ],
    { encoding: "utf8" },
  );
}

test("Modelica MSL adapter preserves explicit equation statements and control context", () => {
  const root = mkdtempSync(join(tmpdir(), "atlas-modelica-"));
  const modelica = writeFixture(root);
  const result = run(modelica);
  assert.equal(result.status, 0, result.stderr);

  const rows = result.stdout.trim().split("\n").filter(Boolean).map(JSON.parse);
  assert.equal(rows.length, 7);
  assert.deepEqual(
    rows.map((row) => row.expression_original),
    [
      "x = 1;",
      "der(x) = -x;",
      "y = 2*x;",
      "y = x + 1;",
      "connect(port_a, port_b);",
      "y = 0;",
      "reinit(x, 0);",
    ],
  );
  assert.deepEqual(
    rows.map((row) => row.equation_form),
    [
      "equality-equation",
      "equality-equation",
      "equality-equation",
      "equality-equation",
      "connect-equation",
      "equality-equation",
      "reinit-equation",
    ],
  );
  assert.ok(rows.every((row) => row.source_id === "modelica-msl-equations"));
  assert.ok(rows.every((row) => row.provenance_class === "attested"));
  assert.ok(rows.every((row) => row.expression_encoding === "Modelica"));
  assert.ok(rows.every((row) => row.source_license === "BSD-3-Clause"));
  assert.ok(rows.every((row) => row.source_document_id === "Modelica/Test/Example.mo"));
  assert.ok(rows.every((row) => row.modelica_qualified_class === "Modelica.Test.Example"));
  assert.ok(rows.every((row) => row.source_attested_payload.lexical_modelica_preserved === true));
  assert.ok(rows.every((row) => row.source_attested_payload.reconstruction_performed === false));
  assert.ok(rows.every((row) => row.source_attested_payload.ocr_performed === false));
  assert.ok(rows.every((row) => row.source_attested_payload.flattening_performed === false));
  assert.deepEqual(rows[3].control_context, ["if x > 0 then"]);
  assert.deepEqual(rows[4].control_context, ["if x > 0 then"]);
  assert.deepEqual(rows[5].control_context, ["else"]);
  assert.deepEqual(rows[6].control_context, ["when x < -1 then"]);
  assert.equal(rows[0].equation_section, "initial equation");
  assert.equal(rows[1].equation_section, "equation");

  const metrics = JSON.parse(result.stderr.trim().split("\n").at(-1));
  assert.equal(metrics.files_seen, 1);
  assert.equal(metrics.equation_sections_seen, 2);
  assert.equal(metrics.records_written, 7);
  assert.equal(metrics.ocr_performed, 0);
  assert.equal(metrics.reconstructions, 0);
  assert.equal(metrics.flattening_performed, 0);
});

test("Modelica logical occurrence identity is independent of checkout directory", () => {
  const left = mkdtempSync(join(tmpdir(), "atlas-modelica-left-"));
  const right = mkdtempSync(join(tmpdir(), "atlas-modelica-right-"));
  const first = run(writeFixture(left));
  const second = run(writeFixture(right));
  assert.equal(first.status, 0, first.stderr);
  assert.equal(second.status, 0, second.stderr);

  const hashes = (stdout) =>
    stdout.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line).source_record_sha256);
  assert.deepEqual(hashes(first.stdout), hashes(second.stdout));
});

test("Modelica adapter fails closed when snapshot commit and pinned commit disagree", () => {
  const root = mkdtempSync(join(tmpdir(), "atlas-modelica-bad-snapshot-"));
  const modelica = writeFixture(root);
  const result = spawnSync(
    pythonBin,
    [
      "scripts/science-equations/harvest-modelica-msl.py",
      "--input",
      modelica,
      "--commit",
      commit,
      "--snapshot",
      `modelica-msl:git:${"c".repeat(40)}:inventory-sha256:${"b".repeat(64)}`,
    ],
    { encoding: "utf8" },
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /snapshot commit must match/);
});
