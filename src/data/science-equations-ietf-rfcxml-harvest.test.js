import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const script = path.resolve("scripts/science-equations/harvest-ietf-rfcxml.py");

function runFixture() {
  const dir = mkdtempSync(path.join(os.tmpdir(), "equation-atlas-rfcxml-"));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rfc number="9999">
  <front><title>Fixture Protocol</title></front>
  <middle>
    <section anchor="grammar"><name>Grammar</name>
      <sourcecode type="abnf" anchor="grammar-rule">token = 1*DIGIT</sourcecode>
      <sourcecode type="json">{"ignored": true}</sourcecode>
    </section>
    <section anchor="algorithm"><name>Algorithm</name>
      <sourcecode type="pseudocode">x := x + 1\nreturn x</sourcecode>
    </section>
  </middle>
</rfc>`;
  writeFileSync(path.join(dir, "rfc9999.xml"), xml);
  const run = spawnSync(
    "python3",
    [script, "--mirror", dir, "--snapshot", "fixture-2026-09-23"],
    { encoding: "utf8" },
  );
  try {
    assert.equal(run.status, 0, run.stderr);
    const rows = run.stdout.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
    assert.equal(rows.length, 2);
    assert.deepEqual(rows.map((row) => row.sourcecode_type), ["abnf", "pseudocode"]);
    assert.equal(rows[0].source_id, "ietf-rfcxml-formal-blocks");
    assert.equal(rows[0].source_document_id, "RFC9999");
    assert.equal(rows[0].source_section, "Grammar");
    assert.equal(rows[0].source_record_url, "https://www.rfc-editor.org/rfc/rfc9999.xml#grammar-rule");
    assert.equal(rows[0].provenance_class, "attested");
    assert.equal(rows[0].original_expression, "token = 1*DIGIT");
    assert.equal(rows[0].original_encoding, "rfcxml-sourcecode:abnf");
    assert.match(rows[0].source_record_sha256, /^[0-9a-f]{64}$/);
    assert.match(rows[0].original_text_sha256, /^[0-9a-f]{64}$/);
    assert.match(rows[0].normalized_text_sha256, /^[0-9a-f]{64}$/);
    const metrics = JSON.parse(run.stderr.trim().split("\n").at(-1));
    assert.equal(metrics.documents_seen, 1);
    assert.equal(metrics.documents_parsed, 1);
    assert.equal(metrics.documents_failed, 0);
    assert.equal(metrics.records_written, 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("RFCXML adapter extracts only selected formal sourcecode blocks", () => {
  runFixture();
});
