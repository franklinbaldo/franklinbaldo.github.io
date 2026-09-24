import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const pythonBin = process.platform === "win32" ? "python" : "python3";

function runPython(args) {
  return spawnSync(pythonBin, args, { encoding: "utf8" });
}

const fixtureXml = `<?xml version="1.0" encoding="UTF-8"?>
<mediawiki xmlns="http://www.mediawiki.org/xml/export-0.11/">
  <page>
    <title>Test equation</title><ns>0</ns><id>10</id>
    <revision><id>20</id><timestamp>2026-09-01T00:00:00Z</timestamp><sha1>abc123</sha1>
      <text xml:space="preserve">Lead &lt;math&gt;E=mc^2&lt;/math&gt; text.
&lt;!-- &lt;math&gt;hidden=1&lt;/math&gt; --&gt;
&lt;nowiki&gt;&lt;math&gt;literal=2&lt;/math&gt;&lt;/nowiki&gt;
Then &lt;math display="block"&gt;\\int_0^1 x\\,dx = 1/2&lt;/math&gt; and &lt;math&gt;   &lt;/math&gt;.</text>
    </revision>
  </page>
  <page>
    <title>Talk:Ignored</title><ns>1</ns><id>11</id>
    <revision><id>21</id><timestamp>2026-09-01T00:00:00Z</timestamp><text xml:space="preserve">&lt;math&gt;x=y&lt;/math&gt;</text></revision>
  </page>
  <page>
    <title>Redirected</title><ns>0</ns><id>12</id><redirect title="Elsewhere"/>
    <revision><id>22</id><timestamp>2026-09-01T00:00:00Z</timestamp><text xml:space="preserve">&lt;math&gt;a=b&lt;/math&gt;</text></revision>
  </page>
</mediawiki>`;

test("Wikipedia adapter extracts explicit attested math and skips literal regions", () => {
  const root = mkdtempSync(join(tmpdir(), "atlas-wikipedia-"));
  const xmlPath = join(root, "enwiki-fixture.xml");
  writeFileSync(xmlPath, fixtureXml, "utf8");

  const result = runPython([
    "scripts/science-equations/harvest-wikipedia-math.py",
    "--dump",
    xmlPath,
    "--snapshot",
    "dump-inventory-sha256:fixture",
  ]);
  assert.equal(result.status, 0, result.stderr);
  const rows = result.stdout.trim().split("\n").filter(Boolean).map(JSON.parse);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map((row) => row.expression_original), ["E=mc^2", "\\int_0^1 x\\,dx = 1/2"]);
  assert.ok(rows.every((row) => row.provenance_class === "attested"));
  assert.ok(rows.every((row) => row.source_id === "wikipedia-en-math-tags"));
  assert.equal(rows[0].source_document_url, "https://en.wikipedia.org/w/index.php?oldid=20");
  assert.equal(rows[0].source_revision_sha1, "abc123");
  assert.deepEqual(rows[1].source_attested_payload.attributes, { display: "block" });
  assert.equal(rows[1].source_attested_payload.body_was_reconstructed, false);

  const metrics = JSON.parse(result.stderr.trim().split("\n").at(-1));
  assert.equal(metrics.records_written, 2);
  assert.equal(metrics.math_tags_seen, 5);
  assert.equal(metrics.math_tags_skipped_literal_region, 2);
  assert.equal(metrics.math_tags_empty, 1);
  assert.equal(metrics.pages_skipped_namespace, 1);
  assert.equal(metrics.pages_skipped_redirect, 1);
});

test("Wikipedia source record hashes are independent of dump-part packaging", () => {
  const root = mkdtempSync(join(tmpdir(), "atlas-wikipedia-packaging-"));
  const left = join(root, "left");
  const right = join(root, "right");
  mkdirSync(left);
  mkdirSync(right);
  const leftPath = join(left, "part-a.xml");
  const rightPath = join(right, "part-z.xml");
  writeFileSync(leftPath, fixtureXml, "utf8");
  copyFileSync(leftPath, rightPath);

  const args = ["--snapshot", "dump-inventory-sha256:same"];
  const first = runPython(["scripts/science-equations/harvest-wikipedia-math.py", "--dump", left, ...args]);
  const second = runPython(["scripts/science-equations/harvest-wikipedia-math.py", "--dump", right, ...args]);
  assert.equal(first.status, 0, first.stderr);
  assert.equal(second.status, 0, second.stderr);
  const hashes = (stdout) => stdout.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line).source_record_sha256);
  assert.deepEqual(hashes(first.stdout), hashes(second.stdout));
});
