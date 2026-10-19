import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const pythonBin = process.platform === "win32" ? "python" : "python3";

function runPython(args) {
  return spawnSync(pythonBin, args, { encoding: "utf8" });
}

const fixtureCnxml = `<?xml version="1.0" encoding="UTF-8"?>
<document xmlns="http://cnx.rice.edu/cnxml" xmlns:m="http://www.w3.org/1998/Math/MathML">
  <title>Fixture physics</title>
  <metadata xmlns:md="http://cnx.rice.edu/mdml">
    <md:content-id>m-fixture</md:content-id>
  </metadata>
  <content>
    <para>Velocity is <m:math><m:mi>v</m:mi><m:mo>=</m:mo><m:mfrac><m:mi>d</m:mi><m:mi>t</m:mi></m:mfrac></m:math> in this example.</para>
    <equation id="eq-energy"><m:math display="block"><m:mi>E</m:mi><m:mo>=</m:mo><m:mi>m</m:mi><m:msup><m:mi>c</m:mi><m:mn>2</m:mn></m:msup></m:math></equation>
  </content>
</document>`;

function writeFixture(root, fileName = "index.cnxml") {
  const moduleDir = join(root, "modules", "m-fixture");
  mkdirSync(moduleDir, { recursive: true });
  const path = join(moduleDir, fileName);
  writeFileSync(path, fixtureCnxml, "utf8");
  return path;
}

function args(root) {
  return [
    "scripts/science-equations/harvest-openstax-cnxml.py",
    "--input",
    root,
    "--snapshot",
    "openstax:openstax-osbooks-physics:git:abc123:inventory-sha256:fixture",
    "--repository",
    "openstax/osbooks-physics",
    "--commit",
    "abc123",
    "--license",
    "CC-BY-4.0",
    "--license-url",
    "https://github.com/openstax/osbooks-physics/blob/abc123/LICENSE",
  ];
}

test("OpenStax adapter preserves exact attested MathML and module provenance", () => {
  const root = mkdtempSync(join(tmpdir(), "atlas-openstax-"));
  writeFixture(root);

  const result = runPython(args(root));
  assert.equal(result.status, 0, result.stderr);
  const rows = result.stdout.trim().split("\n").filter(Boolean).map(JSON.parse);

  assert.equal(rows.length, 2);
  assert.ok(rows.every((row) => row.source_id === "openstax-osbooks-mathml"));
  assert.ok(rows.every((row) => row.provenance_class === "attested"));
  assert.ok(rows.every((row) => row.source_repository === "openstax/osbooks-physics"));
  assert.ok(rows.every((row) => row.source_commit === "abc123"));
  assert.ok(rows.every((row) => row.source_module_id === "m-fixture"));
  assert.ok(rows.every((row) => row.source_module_title === "Fixture physics"));
  assert.ok(rows.every((row) => row.source_attested_payload.raw_mathml_preserved === true));
  assert.ok(rows.every((row) => row.source_attested_payload.ocr_performed === false));
  assert.ok(rows.every((row) => row.source_attested_payload.reconstruction_performed === false));
  assert.equal(
    rows[0].expression_original,
    "<m:math><m:mi>v</m:mi><m:mo>=</m:mo><m:mfrac><m:mi>d</m:mi><m:mi>t</m:mi></m:mfrac></m:math>",
  );
  assert.equal(rows[1].math_display, "block");
  assert.match(rows[0].source_context, /Velocity is/);
  assert.equal(
    rows[0].source_document_url,
    "https://github.com/openstax/osbooks-physics/blob/abc123/modules/m-fixture/index.cnxml",
  );

  const metrics = JSON.parse(result.stderr.trim().split("\n").at(-1));
  assert.equal(metrics.documents_parsed, 1);
  assert.equal(metrics.documents_rejected, 0);
  assert.equal(metrics.math_seen, 2);
  assert.equal(metrics.records_written, 2);
  assert.equal(metrics.ocr_performed, 0);
  assert.equal(metrics.reconstructions, 0);
});

test("OpenStax logical occurrence identity is independent of checkout location", () => {
  const left = mkdtempSync(join(tmpdir(), "atlas-openstax-left-"));
  const right = mkdtempSync(join(tmpdir(), "atlas-openstax-right-"));
  writeFixture(left);
  writeFixture(right);

  const first = runPython(args(left));
  const second = runPython(args(right));
  assert.equal(first.status, 0, first.stderr);
  assert.equal(second.status, 0, second.stderr);

  const hashes = (stdout) =>
    stdout.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line).source_record_sha256);
  assert.deepEqual(hashes(first.stdout), hashes(second.stdout));
});
