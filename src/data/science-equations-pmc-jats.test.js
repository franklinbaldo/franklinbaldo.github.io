import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { PassThrough } from "node:stream";
import test from "node:test";

import { classifyPmcLicense, harvestPmcFiles, parseJatsArticle } from "../../scripts/science-equations/harvest-pmc-jats.mjs";

const fixture = `<?xml version="1.0"?>
<article xmlns:mml="http://www.w3.org/1998/Math/MathML" xmlns:xlink="http://www.w3.org/1999/xlink">
  <front><article-meta>
    <article-id pub-id-type="pmc">1234567</article-id>
    <article-id pub-id-type="doi">10.0000/example</article-id>
    <title-group><article-title>Fixture article</article-title></title-group>
    <permissions><license xlink:href="https://creativecommons.org/licenses/by/4.0/"><license-p>CC BY 4.0</license-p></license></permissions>
  </article-meta></front>
  <body><sec id="s1"><title>Model</title><p>Before.
    <disp-formula id="eq1"><tex-math><![CDATA[E = mc^2]]></tex-math></disp-formula>
    After <inline-formula id="eq2"><mml:math><mml:mi>x</mml:mi><mml:mo>=</mml:mo><mml:mn>1</mml:mn></mml:math></inline-formula>.
  </p></sec></body>
</article>`;

test("PMC license classifier only auto-clears conservative redistributable licenses", () => {
  assert.equal(classifyPmcLicense(fixture).license_id, "CC-BY");
  assert.equal(classifyPmcLicense(fixture).redistribution, "redistributable-derived");
  const nc = fixture.replace("licenses/by/4.0/", "licenses/by-nc/4.0/").replace("CC BY 4.0", "CC BY-NC 4.0");
  assert.equal(classifyPmcLicense(nc).license_id, "CC-BY-NC");
  assert.equal(classifyPmcLicense(nc).redistribution, "manual-review");
});

test("JATS parser preserves attested TeX and MathML with document provenance", () => {
  const parsed = parseJatsArticle(fixture, { snapshot: "inventory-sha256:abc", objectPath: "oa/PMC1234567.xml" });
  assert.equal(parsed.records.length, 2);
  assert.equal(parsed.records[0].source_document_id, "PMC1234567");
  assert.equal(parsed.records[0].source_locator, "eq1");
  assert.equal(parsed.records[0].expression_original, "E = mc^2");
  assert.equal(parsed.records[0].expression_encoding, "tex-math");
  assert.equal(parsed.records[0].provenance_class, "attested");
  assert.equal(parsed.records[1].expression_encoding, "mathml");
  assert.match(parsed.records[1].expression_original, /<mml:math>/);
  assert.match(parsed.records[0].source_record_sha256, /^[a-f0-9]{64}$/);
});

test("JATS parser rejects non-cleared licenses by default", () => {
  const nc = fixture.replace("licenses/by/4.0/", "licenses/by-nc/4.0/").replace("CC BY 4.0", "CC BY-NC 4.0");
  const parsed = parseJatsArticle(nc, { snapshot: "inventory-sha256:abc", objectPath: "oa/PMC1234567.xml" });
  assert.equal(parsed.records.length, 0);
  assert.equal(parsed.metrics.rejected_license, 1);
});

test("bulk harvester streams multiple JATS files without page scraping", async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "pmc-jats-"));
  t.after(async () => rm(dir, { recursive: true, force: true }));
  const a = path.join(dir, "a.xml");
  const b = path.join(dir, "b.xml");
  await writeFile(a, fixture);
  await writeFile(b, fixture.replace("1234567", "7654321"));
  async function* paths() { yield a; yield b; }
  const output = new PassThrough();
  output.setEncoding("utf8");
  let jsonl = "";
  output.on("data", (chunk) => { jsonl += chunk; });
  const metrics = await harvestPmcFiles({ paths: paths(), snapshot: "inventory-sha256:abc", output });
  const rows = jsonl.trim().split("\n").map(JSON.parse);
  assert.equal(metrics.articles_seen, 2);
  assert.equal(metrics.records_written, 4);
  assert.equal(rows.length, 4);
  assert.equal(rows[2].source_document_id, "PMC7654321");
});
