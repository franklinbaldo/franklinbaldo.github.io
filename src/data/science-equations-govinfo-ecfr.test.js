import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const pythonBin = process.platform === "win32" ? "python" : "python3";

function runPython(args) {
  return spawnSync(pythonBin, args, { encoding: "utf8" });
}

test("GovInfo eCFR adapter preserves attested MATH XML without OCR", () => {
  const root = mkdtempSync(join(tmpdir(), "atlas-ecfr-"));
  const titleDir = join(root, "title-15");
  mkdirSync(titleDir, { recursive: true });
  const xmlPath = join(titleDir, "ECFR-title15.xml");
  writeFileSync(
    xmlPath,
    `<?xml version="1.0"?>
<ECFR>
  <TITLE>Title 15 — Commerce and Foreign Trade</TITLE>
  <DIV8 TYPE="SECTION" N="§ 99.1" NODE="15:1.0.1.1.1.1">
    <HEAD>§ 99.1 Formula test.</HEAD>
    <P>Before the equation.</P>
    <MATH DEEP="18"><img src="/graphics/eq-001.gif"/></MATH>
    <P>Where x is the measured quantity.</P>
  </DIV8>
  <DIV8 TYPE="SECTION" N="§ 99.2" NODE="15:1.0.1.1.1.2">
    <HEAD>§ 99.2 Text math.</HEAD>
    <MATH>x + y = z</MATH>
  </DIV8>
</ECFR>`,
    "utf8",
  );

  const result = runPython([
    "scripts/science-equations/harvest-govinfo-ecfr-math.py",
    "--mirror",
    root,
    "--snapshot",
    "inventory-sha256:fixture",
  ]);
  assert.equal(result.status, 0, result.stderr);
  const rows = result.stdout.trim().split("\n").filter(Boolean).map(JSON.parse);
  assert.equal(rows.length, 2);
  assert.ok(rows.every((row) => row.provenance_class === "attested"));
  assert.ok(rows.every((row) => row.source_id === "govinfo-ecfr-math-blocks"));
  assert.ok(rows.every((row) => row.source_attested_payload.ocr_performed === false));
  assert.ok(rows.every((row) => row.source_attested_payload.reconstruction_performed === false));
  assert.match(rows[0].expression_original, /<MATH/);
  assert.deepEqual(rows[0].source_attested_payload.graphic_sources, ["/graphics/eq-001.gif"]);
  assert.equal(rows[0].source_cfr_title, "15");

  const metrics = JSON.parse(result.stderr.trim().split("\n").at(-1));
  assert.equal(metrics.records_written, 2);
  assert.equal(metrics.math_image_backed, 1);
  assert.equal(metrics.ocr_performed, 0);
  assert.equal(metrics.reconstructions, 0);
});

test("source inventory is deterministic and content-addressed", () => {
  const root = mkdtempSync(join(tmpdir(), "atlas-inventory-"));
  mkdirSync(join(root, "b"));
  mkdirSync(join(root, "a"));
  writeFileSync(join(root, "a", "x.xml"), "hello", "utf8");
  writeFileSync(join(root, "b", "y.xml"), "world", "utf8");
  const output1 = join(root, "manifest-1.json");
  const output2 = join(root, "manifest-2.json");

  for (const output of [output1, output2]) {
    const result = runPython([
      "scripts/science-equations/build-source-inventory.py",
      "--root",
      root,
      "--glob",
      "*.xml",
      "--source-id",
      "fixture",
      "--output",
      output,
    ]);
    assert.equal(result.status, 0, result.stderr);
  }

  assert.equal(readFileSync(output1, "utf8"), readFileSync(output2, "utf8"));
  const manifest = JSON.parse(readFileSync(output1, "utf8"));
  assert.equal(manifest.file_count, 2);
  assert.deepEqual(manifest.files.map((entry) => entry.path), ["a/x.xml", "b/y.xml"]);
  assert.match(manifest.inventory_sha256, /^[a-f0-9]{64}$/);
});
