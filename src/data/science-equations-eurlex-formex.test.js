import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const pythonBin = process.platform === "win32" ? "python" : "python3";

function runPython(args) {
  return spawnSync(pythonBin, args, { encoding: "utf8" });
}

const fixtureXml = `<?xml version="1.0" encoding="UTF-8"?>
<DOC>
  <BIB.DATA>
    <LG.DOC>EN</LG.DOC>
    <NO.CELEX>32026R1234</NO.CELEX>
    <TITLE><TI>Example regulation</TI></TITLE>
  </BIB.DATA>
  <ARTICLE ID="A1">
    <P>Before the formula.</P>
    <FORMULA TYPE="INLINE"><EXPR>x</EXPR><OP.CMP TYPE="EQ"> </OP.CMP><EXPR>1 &amp; 2</EXPR></FORMULA>
    <FORMULA TYPE="OUTLINE">
      <EXPR><FRACTION><DIVIDEND>a</DIVIDEND><DIVISOR>b</DIVISOR></FRACTION></EXPR>
    </FORMULA>
    <FORMULA TYPE="INLINE"></FORMULA>
    <P>After the formula.</P>
  </ARTICLE>
</DOC>`;

test("EUR-Lex Formex adapter preserves attested FORMULA XML and CELEX provenance", () => {
  const root = mkdtempSync(join(tmpdir(), "atlas-eurlex-formex-"));
  const xmlPath = join(root, "fixture.xml");
  writeFileSync(xmlPath, fixtureXml, "utf8");

  const result = runPython([
    "scripts/science-equations/harvest-eurlex-formex.py",
    "--input",
    xmlPath,
    "--snapshot",
    "inventory-sha256:fixture",
  ]);
  assert.equal(result.status, 0, result.stderr);

  const rows = result.stdout.trim().split("\n").filter(Boolean).map(JSON.parse);
  assert.equal(rows.length, 2);
  assert.ok(rows.every((row) => row.source_id === "eurlex-formex-formulas"));
  assert.ok(rows.every((row) => row.provenance_class === "attested"));
  assert.ok(rows.every((row) => row.source_document_id === "celex:32026R1234"));
  assert.ok(rows.every((row) => row.source_celex === "32026R1234"));
  assert.ok(rows.every((row) => row.source_language === "EN"));
  assert.ok(rows.every((row) => row.source_attested_payload.raw_formula_xml_preserved === true));
  assert.ok(rows.every((row) => row.source_attested_payload.ocr_performed === false));
  assert.ok(rows.every((row) => row.source_attested_payload.reconstruction_performed === false));
  assert.equal(
    rows[0].expression_original,
    '<FORMULA TYPE="INLINE"><EXPR>x</EXPR><OP.CMP TYPE="EQ"> </OP.CMP><EXPR>1 &amp; 2</EXPR></FORMULA>',
  );
  assert.match(rows[1].expression_original, /<FRACTION>/);
  assert.equal(
    rows[0].source_document_url,
    "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32026R1234",
  );

  const metrics = JSON.parse(result.stderr.trim().split("\n").at(-1));
  assert.equal(metrics.documents_parsed, 1);
  assert.equal(metrics.formula_seen, 3);
  assert.equal(metrics.formula_empty, 1);
  assert.equal(metrics.formula_inline, 1);
  assert.equal(metrics.formula_outline, 1);
  assert.equal(metrics.records_written, 2);
  assert.equal(metrics.ocr_performed, 0);
  assert.equal(metrics.reconstructions, 0);
});

test("EUR-Lex Formex source record identity is independent of bulk package path", () => {
  const left = mkdtempSync(join(tmpdir(), "atlas-eurlex-left-"));
  const right = mkdtempSync(join(tmpdir(), "atlas-eurlex-right-"));
  const leftPath = join(left, "a.xml");
  const rightPath = join(right, "different-name.xml");
  writeFileSync(leftPath, fixtureXml, "utf8");
  writeFileSync(rightPath, fixtureXml, "utf8");

  const args = ["--snapshot", "inventory-sha256:same"];
  const first = runPython([
    "scripts/science-equations/harvest-eurlex-formex.py",
    "--input",
    leftPath,
    ...args,
  ]);
  const second = runPython([
    "scripts/science-equations/harvest-eurlex-formex.py",
    "--input",
    rightPath,
    ...args,
  ]);
  assert.equal(first.status, 0, first.stderr);
  assert.equal(second.status, 0, second.stderr);

  const hashes = (stdout) =>
    stdout.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line).source_record_sha256);
  assert.deepEqual(hashes(first.stdout), hashes(second.stdout));
});
