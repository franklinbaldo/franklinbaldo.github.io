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
<mediawiki xmlns="http://www.mediawiki.org/xml/export-0.11/">
  <page>
    <title>Open learning example</title><ns>0</ns><id>41</id>
    <revision><id>73</id><timestamp>2026-09-01T00:00:00Z</timestamp><sha1>learning123</sha1>
      <text xml:space="preserve">A lesson with &lt;math&gt;F=ma&lt;/math&gt; and
&lt;math display="block"&gt;\\sum_{k=1}^{n} k = n(n+1)/2&lt;/math&gt;.
&lt;pre&gt;&lt;math&gt;not=content&lt;/math&gt;&lt;/pre&gt;</text>
    </revision>
  </page>
</mediawiki>`;

function harvest({ wikiId, language, wikiBase }) {
  const root = mkdtempSync(join(tmpdir(), `atlas-${wikiId}-`));
  const xmlPath = join(root, `${wikiId}-fixture.xml`);
  writeFileSync(xmlPath, fixtureXml, "utf8");
  const result = runPython([
    "scripts/science-equations/harvest-wikipedia-math.py",
    "--dump",
    xmlPath,
    "--snapshot",
    `wikimedia-content-current:${wikiId}:inventory-sha256:fixture`,
    "--source-id",
    "wikimedia-open-learning-math-tags",
    "--source-license",
    "CC-BY-SA-4.0-and-GFDL-with-project-edition-and-imported-text-caveat",
    "--wiki-id",
    wikiId,
    "--wiki-language",
    language,
    "--wiki-base",
    wikiBase,
  ]);
  assert.equal(result.status, 0, result.stderr);
  return {
    rows: result.stdout.trim().split("\n").filter(Boolean).map(JSON.parse),
    metrics: JSON.parse(result.stderr.trim().split("\n").at(-1)),
  };
}

test("Wikibooks uses the generic MediaWiki math adapter with project identity preserved", () => {
  const { rows, metrics } = harvest({
    wikiId: "enwikibooks",
    language: "en",
    wikiBase: "https://en.wikibooks.org",
  });

  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map((row) => row.expression_original), ["F=ma", "\\sum_{k=1}^{n} k = n(n+1)/2"]);
  assert.ok(rows.every((row) => row.provenance_class === "attested"));
  assert.ok(rows.every((row) => row.source_id === "wikimedia-open-learning-math-tags"));
  assert.ok(rows.every((row) => row.source_wiki_id === "enwikibooks"));
  assert.ok(rows.every((row) => row.source_wiki_language === "en"));
  assert.equal(rows[0].source_document_id, "wiki:enwikibooks:page:41:revision:73");
  assert.equal(rows[0].source_document_url, "https://en.wikibooks.org/w/index.php?oldid=73");
  assert.match(rows[0].source_locator, /^wiki:enwikibooks;/);
  assert.equal(rows[1].source_attested_payload.body_was_reconstructed, false);
  assert.equal(metrics.records_written, 2);
  assert.equal(metrics.math_tags_skipped_literal_region, 1);
});

test("Wikiversity keeps the same page/revision numbers distinct through wiki_id", () => {
  const books = harvest({
    wikiId: "ptwikibooks",
    language: "pt",
    wikiBase: "https://pt.wikibooks.org",
  });
  const university = harvest({
    wikiId: "ptwikiversity",
    language: "pt",
    wikiBase: "https://pt.wikiversity.org",
  });

  assert.equal(university.rows.length, 2);
  assert.ok(university.rows.every((row) => row.source_wiki_id === "ptwikiversity"));
  assert.equal(university.rows[0].source_document_url, "https://pt.wikiversity.org/w/index.php?oldid=73");
  assert.notEqual(books.rows[0].source_record_sha256, university.rows[0].source_record_sha256);
});
