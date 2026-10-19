import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const pythonBin = process.platform === "win32" ? "python" : "python3";
const snapshot = "biomodels:inventory-sha256:fixture123";

function fixtureXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sbml xmlns="http://www.sbml.org/sbml/level3/version2/core" level="3" version="2">
  <model id="m1" name="Fixture model">
    <listOfSpecies><species id="S" compartment="c" substanceUnits="mole"/></listOfSpecies>
    <listOfCompartments><compartment id="c" size="1" units="litre"/></listOfCompartments>
    <listOfParameters><parameter id="k" value="2" units="per_second"/></listOfParameters>
    <listOfRules>
      <assignmentRule variable="k"><math xmlns="http://www.w3.org/1998/Math/MathML"><cn>2</cn></math></assignmentRule>
      <rateRule variable="S"><math xmlns="http://www.w3.org/1998/Math/MathML"><apply><minus/><ci>S</ci></apply></math></rateRule>
      <algebraicRule><math xmlns="http://www.w3.org/1998/Math/MathML"><apply><lt/><ci>S</ci><cn>10</cn></apply></math></algebraicRule>
    </listOfRules>
    <listOfReactions>
      <reaction id="r1" name="decay"><kineticLaw><math xmlns="http://www.w3.org/1998/Math/MathML"><apply><times/><ci>k</ci><ci>S</ci></apply></math></kineticLaw></reaction>
    </listOfReactions>
    <listOfEvents>
      <event id="e1"><listOfEventAssignments><eventAssignment variable="S"><math xmlns="http://www.w3.org/1998/Math/MathML"><cn>0</cn></math></eventAssignment></listOfEventAssignments></event>
    </listOfEvents>
  </model>
</sbml>`;
}

function writeFixture(root) {
  const accessionDir = join(root, "BIOMD0000000001");
  mkdirSync(accessionDir, { recursive: true });
  writeFileSync(join(accessionDir, "model.xml"), fixtureXml(), "utf8");
}

function run(root) {
  return spawnSync(
    pythonBin,
    [
      "scripts/science-equations/harvest-biomodels-sbml.py",
      "--input",
      root,
      "--snapshot",
      snapshot,
    ],
    { encoding: "utf8" },
  );
}

test("BioModels SBML adapter preserves explicit MathML and semantic context", () => {
  const root = mkdtempSync(join(tmpdir(), "atlas-biomodels-"));
  writeFixture(root);
  const result = run(root);
  assert.equal(result.status, 0, result.stderr);

  const rows = result.stdout.trim().split("\n").filter(Boolean).map(JSON.parse);
  assert.equal(rows.length, 5);
  assert.deepEqual(rows.map((row) => row.math_parent), ["assignmentRule", "rateRule", "algebraicRule", "kineticLaw", "eventAssignment"]);
  assert.ok(rows.every((row) => row.source_id === "biomodels-sbml-math"));
  assert.ok(rows.every((row) => row.provenance_class === "attested"));
  assert.ok(rows.every((row) => row.expression_encoding === "MathML"));
  assert.ok(rows.every((row) => row.source_license === "CC0-1.0"));
  assert.ok(rows.every((row) => row.source_attested_payload.lexical_mathml_preserved === true));
  assert.ok(rows.every((row) => row.source_attested_payload.reconstruction_performed === false));
  assert.ok(rows.every((row) => row.source_attested_payload.ocr_performed === false));
  assert.equal(rows[0].expression_original, '<math xmlns="http://www.w3.org/1998/Math/MathML"><cn>2</cn></math>');
  assert.equal(rows[1].target_symbol, "S");
  assert.equal(rows[1].target_units, "mole");
  assert.equal(rows[3].reaction_id, "r1");
  assert.equal(rows[4].event_id, "e1");

  const metrics = JSON.parse(result.stderr.trim().split("\n").at(-1));
  assert.equal(metrics.files_seen, 1);
  assert.equal(metrics.math_seen, 5);
  assert.equal(metrics.records_written, 5);
  assert.equal(metrics.documents_rejected, 0);
  assert.equal(metrics.ocr_performed, 0);
  assert.equal(metrics.reconstructions, 0);
});

test("BioModels logical occurrence identity is independent of checkout directory", () => {
  const left = mkdtempSync(join(tmpdir(), "atlas-biomodels-left-"));
  const right = mkdtempSync(join(tmpdir(), "atlas-biomodels-right-"));
  writeFixture(left);
  writeFixture(right);

  const first = run(left);
  const second = run(right);
  assert.equal(first.status, 0, first.stderr);
  assert.equal(second.status, 0, second.stderr);

  const hashes = (stdout) => stdout.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line).source_record_sha256);
  assert.deepEqual(hashes(first.stdout), hashes(second.stdout));
});
