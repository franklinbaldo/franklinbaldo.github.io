import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const pythonBin = process.platform === "win32" ? "python" : "python3";

function runPython(args) {
  return spawnSync(pythonBin, args, { encoding: "utf8" });
}

test("EUR-Lex Formex adapter preserves attested FORMULA XML", () => {
  const root = mkdtempSync(join(tmpdir(), "atlas-eurlex-"));
  const languageDir = join(root, "en");
  mkdirSync(languageDir, { recursive: true });
  const xmlPath = join(languageDir, "L_2026001EN.doc.fmx.xml");
  writeFileSync(
    xmlPath,
    `<?xml version="1.0"?>
<FMX>
  <BIB.DATA>
    <NO.CELEX>32026R1234</NO.CELEX>
    <BIB.INSTANCE><LG.DOC>EN</LG.DOC></BIB.INSTANCE>
  </BIB.DATA>
  <ARTICLE ID="ART_1">
    <P>Before.</P>
    <FORMULA TYPE="OUTLINE"><EXPR>x</EXPR><OP.CMP TYPE="EQ"/><EXPR>y<OP.MATH TYPE="PLUS"/>1</EXPR></FORMULA>
    <P>After.</P>
    <FORMULA TYPE="INLINE"><EXPR>a</EXPR><OP.CMP TYPE="LE"/><EXPR>b</EXPR></FORMULA>
  </ARTICLE>
  <FORMULA TYPE="OUTLINE"></FORMULA>
</FMX>`,
    "utf8",
  );

  const result = runPython([
    "scripts/science-equations/harvest-eurlex-formex-formulas.py",
    "--mirror",
    root,
    "--snapshot",
    "inventory-sha256:fixture",
  ]);

  assert.equal(result.status, 0, result.stderr);
  const rows = result.stdout.trim().split("\n").filter(Boolean).map(JSON.parse);
  assert.equal(rows.length, 2);
  assert.ok(rows.every((row) => row.provenance_class === "attested"));
  assert.ok(rows.every((row) => row.source_id === "eurlex-formex-formulas"));
  assert.ok(rows.every((row) => row.source_celex === "32026R1234"));
  assert.ok(rows.every((row) => row.source_language === "EN"));
  assert.ok(rows.every((row) => row.source_attested_payload.ocr_performed === false));
  assert.ok(rows.every((row) => row.source_attested_payload.reconstruction_performed === false));
  assert.match(rows[0].expression_original, /<FORMULA TYPE="OUTLINE">/);
  assert.equal(rows[0].source_formex_formula_type, "OUTLINE");
  assert.match(rows[0].source_document_url, /CELEX:32026R1234/);

  const metrics = JSON.parse(result.stderr.trim().split("\n").at(-1));
  assert.equal(metrics.records_written, 2);
  assert.equal(metrics.formulas_seen, 3);
  assert.equal(metrics.formulas_empty, 1);
  assert.equal(metrics.inline, 1);
  assert.equal(metrics.outline, 1);
  assert.equal(metrics.ocr_performed, 0);
  assert.equal(metrics.reconstructions, 0);
});
