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

const oaiFixture = `<?xml version="1.0"?>
<OAI-PMH xmlns="http://www.openarchives.org/OAI/2.0/" xmlns:r="http://arxiv.org/OAI/arXivRaw/">
<ListRecords>
<record><header><identifier>oai:arXiv.org:2609.00001</identifier></header><metadata><r:arXivRaw><r:id>2609.00001</r:id><r:title>Safe one</r:title><r:categories>cs.AI math.OC</r:categories><r:license>https://creativecommons.org/licenses/by/4.0/</r:license><r:versions><r:version version="v1"><r:date>Wed, 23 Sep 2026</r:date><r:size>10kb</r:size></r:version></r:versions></r:arXivRaw></metadata></record>
<record><header><identifier>oai:arXiv.org:2609.00002</identifier></header><metadata><r:arXivRaw><r:id>2609.00002</r:id><r:title>Multi</r:title><r:categories>math.PR</r:categories><r:license>https://creativecommons.org/licenses/by/4.0/</r:license><r:versions><r:version version="v1"><r:date>a</r:date></r:version><r:version version="v2"><r:date>b</r:date></r:version></r:versions></r:arXivRaw></metadata></record>
<record><header><identifier>oai:arXiv.org:2609.00003</identifier></header><metadata><r:arXivRaw><r:id>2609.00003</r:id><r:title>Default</r:title><r:categories>physics.gen-ph</r:categories><r:license>http://arxiv.org/licenses/nonexclusive-distrib/1.0/</r:license><r:versions><r:version version="v1"><r:date>a</r:date></r:version></r:versions></r:arXivRaw></metadata></record>
</ListRecords></OAI-PMH>`;

const safeTex = String.raw`Text $x+y=z$ here.
% comment $bad=1$
\begin{verbatim}$also_bad=2$\end{verbatim}
\[
E = mc^2
\]
\begin{equation}
a^2+b^2=c^2
\end{equation}`;

function prepare(root) {
  const oai = join(root, "oai.xml");
  const meta = join(root, "metadata.jsonl");
  const src = join(root, "src");
  writeFileSync(oai, oaiFixture, "utf8");
  for (const id of ["2609.00001", "2609.00002", "2609.00003"]) {
    mkdirSync(join(src, id), { recursive: true });
  }
  writeFileSync(join(src, "2609.00001", "main.tex"), safeTex, "utf8");
  writeFileSync(join(src, "2609.00002", "main.tex"), "$x=2$", "utf8");
  writeFileSync(join(src, "2609.00003", "main.tex"), "$x=3$", "utf8");
  const metadataResult = runPython([
    "scripts/science-equations/extract-arxiv-oai-metadata.py",
    "--input",
    oai,
  ]);
  assert.equal(metadataResult.status, 0, metadataResult.stderr);
  writeFileSync(meta, metadataResult.stdout, "utf8");
  return {
    meta,
    src,
    metadataRows: metadataResult.stdout.trim().split("\n").map(JSON.parse),
  };
}

test("arXiv gate emits only single-version permissively licensed attested TeX", () => {
  const root = mkdtempSync(join(tmpdir(), "atlas-arxiv-"));
  const { meta, src, metadataRows } = prepare(root);
  assert.deepEqual(metadataRows.map((row) => row.version_count), [1, 2, 1]);

  const result = runPython([
    "scripts/science-equations/harvest-arxiv-tex.py",
    "--source",
    src,
    "--metadata",
    meta,
    "--snapshot",
    "arxiv-single-version:fixture",
  ]);
  assert.equal(result.status, 0, result.stderr);
  const rows = result.stdout.trim().split("\n").filter(Boolean).map(JSON.parse);
  assert.equal(rows.length, 3);
  assert.ok(rows.every((row) => row.source_arxiv_id === "2609.00001"));
  assert.ok(rows.every((row) => row.provenance_class === "attested"));
  assert.ok(rows.every((row) => row.source_license === "CC-BY-4.0"));
  assert.ok(rows.every((row) => row.source_attested_payload.reconstruction_performed === false));
  assert.ok(rows.every((row) => row.source_attested_payload.ocr_performed === false));
  assert.deepEqual(
    rows.map((row) => row.expression_original.trim()),
    ["x+y=z", "E = mc^2", "a^2+b^2=c^2"],
  );
  assert.ok(!rows.some((row) => row.expression_original.includes("bad=1")));
  assert.ok(!rows.some((row) => row.expression_original.includes("also_bad=2")));
  const metrics = JSON.parse(result.stderr.trim().split("\n").at(-1));
  assert.equal(metrics.packages_skipped_multi_version, 1);
  assert.equal(metrics.packages_skipped_license, 1);
  assert.equal(metrics.records_written, 3);
});

test("arXiv logical occurrence identity is independent of checkout root", () => {
  const left = mkdtempSync(join(tmpdir(), "atlas-arxiv-left-"));
  const right = mkdtempSync(join(tmpdir(), "atlas-arxiv-right-"));
  const firstFixture = prepare(left);
  const secondFixture = prepare(right);
  const run = ({ src, meta }) => runPython([
    "scripts/science-equations/harvest-arxiv-tex.py",
    "--source",
    src,
    "--metadata",
    meta,
    "--snapshot",
    "arxiv-single-version:fixture",
  ]);
  const first = run(firstFixture);
  const second = run(secondFixture);
  assert.equal(first.status, 0, first.stderr);
  assert.equal(second.status, 0, second.stderr);
  const hashes = (stdout) => stdout.trim().split("\n").filter(Boolean).map(
    (line) => JSON.parse(line).source_record_sha256,
  );
  assert.deepEqual(hashes(first.stdout), hashes(second.stdout));
});
