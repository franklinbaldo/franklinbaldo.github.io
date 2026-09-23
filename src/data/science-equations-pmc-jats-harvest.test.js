import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const script = fileURLToPath(
  new URL("../../scripts/science-equations/harvest-pmc-jats.py", import.meta.url),
);

test("PMC JATS adapter extracts licensed TeX/MathML and rejects noncommercial articles", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "atlas-pmc-"));
  try {
    fs.writeFileSync(
      path.join(dir, "PMC123.xml"),
      `<?xml version="1.0"?>
<article article-type="research-article" xmlns:mml="http://www.w3.org/1998/Math/MathML" xmlns:xlink="http://www.w3.org/1999/xlink">
 <front><article-meta>
  <article-id pub-id-type="pmc">PMC123</article-id><article-id pub-id-type="doi">10.1/example</article-id>
  <title-group><article-title>Example Study</article-title></title-group>
  <permissions><license xlink:href="https://creativecommons.org/licenses/by/4.0/"><license-p>CC BY 4.0</license-p></license></permissions>
 </article-meta></front>
 <body><sec><title>Methods</title><p>We use <inline-formula id="f1"><mml:math><mml:mi>x</mml:mi><mml:mo>+</mml:mo><mml:mi>y</mml:mi></mml:math></inline-formula> in context.</p>
 <disp-formula id="f2"><tex-math><![CDATA[E = mc^2]]></tex-math></disp-formula><disp-formula id="empty"/></sec></body>
</article>`,
    );
    fs.writeFileSync(
      path.join(dir, "PMC999.xml"),
      `<article xmlns:xlink="http://www.w3.org/1999/xlink"><front><article-meta><article-id pub-id-type="pmc">PMC999</article-id><permissions><license xlink:href="https://creativecommons.org/licenses/by-nc/4.0/"><license-p>CC BY-NC 4.0</license-p></license></permissions></article-meta></front><body><disp-formula><tex-math>x=1</tex-math></disp-formula></body></article>`,
    );

    const run = spawnSync(
      "python3",
      [script, "--root", dir, "--snapshot", "fixture-inventory-digest"],
      { encoding: "utf8" },
    );
    assert.equal(run.status, 0, run.stderr);
    const rows = run.stdout.trim().split("\n").filter(Boolean).map(JSON.parse);
    assert.equal(rows.length, 2);
    assert.deepEqual(
      rows.map((row) => row.formula_kind).sort(),
      ["disp-formula", "inline-formula"],
    );
    assert(rows.every((row) => row.provenance_class === "attested"));
    assert(rows.every((row) => row.source_license === "CC-BY-4.0"));
    assert(
      rows.some(
        (row) =>
          row.original_encoding === "jats-tex-math" && row.original_expression === "E = mc^2",
      ),
    );
    assert(
      rows.some(
        (row) => row.original_encoding === "mathml-xml" && row.original_expression.includes("<ns0:math"),
      ),
    );
    assert(rows.every((row) => /^[a-f0-9]{64}$/.test(row.source_record_sha256)));

    const metrics = JSON.parse(run.stderr.trim());
    assert.equal(metrics.files_seen, 2);
    assert.equal(metrics.articles_accepted, 1);
    assert.equal(metrics.articles_rejected_license, 1);
    assert.equal(metrics.formulas_emitted, 2);
    assert.equal(metrics.formulas_skipped_empty, 1);
    assert.equal(metrics.parse_errors, 0);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
