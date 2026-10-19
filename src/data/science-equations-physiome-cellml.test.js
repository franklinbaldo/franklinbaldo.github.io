import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const pythonBin = process.platform === "win32" ? "python" : "python3";
const snapshot = "physiome-cellml:inventory-sha256:fixture123";

function fixtureCellml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<model xmlns="http://www.cellml.org/cellml/2.0#" name="Fixture model">
  <component name="dynamics">
    <variable name="t" units="second"/>
    <variable name="x" units="dimensionless" initial_value="1"/>
    <variable name="k" units="per_second"/>
    <math xmlns="http://www.w3.org/1998/Math/MathML">
      <apply><eq/><apply><diff/><bvar><ci>t</ci></bvar><ci>x</ci></apply><apply><times/><ci>k</ci><ci>x</ci></apply></apply>
    </math>
    <math xmlns="http://www.w3.org/1998/Math/MathML"><apply><lt/><ci>x</ci><cn xmlns:cellml="http://www.cellml.org/cellml/2.0#" cellml:units="dimensionless">10</cn></apply></math>
  </component>
</model>`;
}

function writeFixture(root, rightsStatus = "redistributable") {
  const workspace = join(root, "wsA");
  mkdirSync(workspace, { recursive: true });
  writeFileSync(join(workspace, "model.cellml"), fixtureCellml(), "utf8");
  const manifest = {
    schema_version: 1,
    workspaces: [
      {
        workspace_id: "abc123",
        relative_path: "wsA",
        commit: "0123456789abcdef",
        git_url: "https://models.physiomeproject.org/workspace/abc123",
        exposure_url: "https://models.physiomeproject.org/e/abc/",
        rights_status: rightsStatus,
        ...(rightsStatus === "redistributable"
          ? {
              license: "CC-BY-3.0",
              license_url: "https://creativecommons.org/licenses/by/3.0/",
            }
          : {}),
      },
    ],
  };
  const manifestPath = join(root, "workspaces.json");
  writeFileSync(manifestPath, JSON.stringify(manifest), "utf8");
  return manifestPath;
}

function run(root, manifestPath) {
  return spawnSync(
    pythonBin,
    [
      "scripts/science-equations/harvest-physiome-cellml.py",
      "--input",
      root,
      "--workspace-manifest",
      manifestPath,
      "--snapshot",
      snapshot,
    ],
    { encoding: "utf8" },
  );
}

function rows(stdout) {
  return stdout.trim().split("\n").filter(Boolean).map(JSON.parse);
}

test("Physiome CellML adapter preserves exact MathML, component context, units and rights", () => {
  const root = mkdtempSync(join(tmpdir(), "atlas-cellml-"));
  const manifest = writeFixture(root);
  const result = run(root, manifest);
  assert.equal(result.status, 0, result.stderr);

  const output = rows(result.stdout);
  assert.equal(output.length, 2);
  assert.ok(output.every((row) => row.source_id === "physiome-cellml-math"));
  assert.ok(output.every((row) => row.provenance_class === "attested"));
  assert.ok(output.every((row) => row.expression_encoding === "MathML"));
  assert.ok(output.every((row) => row.source_license === "CC-BY-3.0"));
  assert.ok(output.every((row) => row.redistribution_allowed === true));
  assert.ok(output.every((row) => row.source_attested_payload.reconstruction_performed === false));
  assert.ok(output.every((row) => row.source_attested_payload.ocr_performed === false));
  assert.equal(output[0].component_name, "dynamics");
  assert.match(output[0].expression_original, /<math xmlns="http:\/\/www\.w3\.org\/1998\/Math\/MathML">\n/);
  assert.deepEqual(output[0].referenced_variables, ["t", "x", "k"]);
  assert.equal(output[0].referenced_variable_metadata.find((item) => item.name === "t").units, "second");
  assert.equal(output[1].referenced_variable_metadata.find((item) => item.name === "x").units, "dimensionless");

  const metrics = JSON.parse(result.stderr.trim().split("\n").at(-1));
  assert.equal(metrics.workspaces_seen, 1);
  assert.equal(metrics.files_seen, 1);
  assert.equal(metrics.math_seen, 2);
  assert.equal(metrics.records_written, 2);
  assert.equal(metrics.redistributable_records, 2);
  assert.equal(metrics.documents_rejected, 0);
  assert.equal(metrics.ocr_performed, 0);
  assert.equal(metrics.reconstructions, 0);
});

test("Physiome logical occurrence identity is independent of checkout directory and unverified rights fail closed", () => {
  const left = mkdtempSync(join(tmpdir(), "atlas-cellml-left-"));
  const right = mkdtempSync(join(tmpdir(), "atlas-cellml-right-"));
  const leftManifest = writeFixture(left, "unverified");
  const rightManifest = writeFixture(right, "unverified");

  const first = run(left, leftManifest);
  const second = run(right, rightManifest);
  assert.equal(first.status, 0, first.stderr);
  assert.equal(second.status, 0, second.stderr);

  const firstRows = rows(first.stdout);
  const secondRows = rows(second.stdout);
  assert.deepEqual(
    firstRows.map((row) => row.source_record_sha256),
    secondRows.map((row) => row.source_record_sha256),
  );
  assert.ok(firstRows.every((row) => row.redistribution_allowed === false));
  assert.ok(firstRows.every((row) => row.source_license === "UNVERIFIED"));
});
