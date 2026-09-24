import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const pythonBin = process.platform === "win32" ? "python" : "python3";

function runPython(args) {
  return spawnSync(pythonBin, args, { encoding: "utf8" });
}

test("arXiv bulk source adapter extracts attested TeX math and filters licenses", () => {
  const root = mkdtempSync(join(tmpdir(), "atlas-arxiv-"));
  const oai = join(root, "oai.xml");
  const bulkTar = join(root, "arXiv_src_2401_001.tar");

  writeFileSync(
    oai,
    `<?xml version="1.0"?>
<OAI-PMH xmlns="http://www.openarchives.org/OAI/2.0/" xmlns:arXiv="http://arxiv.org/OAI/arXiv/">
<ListRecords>
  <record>
    <header><identifier>oai:arXiv.org:2401.00001</identifier></header>
    <metadata><arXiv:arXiv>
      <arXiv:id>2401.00001</arXiv:id>
      <arXiv:title>Allowed fixture</arXiv:title>
      <arXiv:categories>math.AG cs.LG</arXiv:categories>
      <arXiv:license>http://creativecommons.org/licenses/by/4.0/</arXiv:license>
    </arXiv:arXiv></metadata>
  </record>
  <record>
    <header><identifier>oai:arXiv.org:2401.00002</identifier></header>
    <metadata><arXiv:arXiv>
      <arXiv:id>2401.00002</arXiv:id>
      <arXiv:title>Restricted fixture</arXiv:title>
      <arXiv:categories>physics.gen-ph</arXiv:categories>
      <arXiv:license>http://arxiv.org/licenses/nonexclusive-distrib/1.0/</arXiv:license>
    </arXiv:arXiv></metadata>
  </record>
</ListRecords>
</OAI-PMH>`,
    "utf8",
  );

  const fixtureBuilder = String.raw`
import io, tarfile, sys

def package(name, text):
    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode="w:gz") as inner:
        data = text.encode("utf-8")
        info = tarfile.TarInfo(name)
        info.size = len(data)
        inner.addfile(info, io.BytesIO(data))
    return buf.getvalue()

allowed = package("main.tex", r"""\documentclass{article}
\begin{document}
Here $x+y=z$ and \[ E = mc^2 \].
% ignored $a=b$
\begin{equation}
F=ma
\end{equation}
\begin{verbatim}
$not_math$
\end{verbatim}
\end{document}
""")
restricted = package("paper.tex", r"$restricted=1$")
with tarfile.open(sys.argv[1], "w") as outer:
    for member_name, payload in [
        ("2401/2401.00001.gz", allowed),
        ("2401/2401.00002.gz", restricted),
    ]:
        info = tarfile.TarInfo(member_name)
        info.size = len(payload)
        outer.addfile(info, io.BytesIO(payload))
`;
  const built = runPython(["-c", fixtureBuilder, bulkTar]);
  assert.equal(built.status, 0, built.stderr);

  const result = runPython([
    "scripts/science-equations/harvest-arxiv-source.py",
    "--bulk-tar",
    bulkTar,
    "--oai-metadata",
    oai,
    "--snapshot",
    "arxiv-composite-sha256:fixture",
  ]);
  assert.equal(result.status, 0, result.stderr);
  const rows = result.stdout.trim().split("\n").filter(Boolean).map(JSON.parse);
  assert.equal(rows.length, 3);
  assert.ok(rows.every((row) => row.provenance_class === "attested"));
  assert.ok(rows.every((row) => row.source_document_id === "2401.00001"));
  assert.ok(rows.every((row) => row.redistribution_allowed === true));
  assert.deepEqual(rows.map((row) => row.source_math_kind), [
    "inline-dollar",
    "display-bracket",
    "environment:equation",
  ]);
  assert.ok(rows.every((row) => !row.expression_original.includes("not_math")));
  assert.ok(rows.every((row) => !row.expression_original.includes("a=b")));

  const metrics = JSON.parse(result.stderr.trim().split("\n").at(-1));
  assert.equal(metrics.article_packages_seen, 2);
  assert.equal(metrics.article_packages_license_filtered, 1);
  assert.equal(metrics.records_written, 3);
});

test("arXiv source acquisition planner is deterministic and selection-addressed", () => {
  const root = mkdtempSync(join(tmpdir(), "atlas-arxiv-plan-"));
  const manifest = join(root, "arXiv_src_manifest.xml");
  const output1 = join(root, "plan-1.json");
  const output2 = join(root, "plan-2.json");
  writeFileSync(
    manifest,
    `<?xml version="1.0"?>
<arXivSRC>
  <file>
    <filename>src/arXiv_src_2401_001.tar</filename>
    <yymm>2401</yymm><seq_num>1</seq_num><size>100</size><num_items>2</num_items>
    <md5sum>aaa</md5sum><content_md5sum>bbb</content_md5sum>
    <first_item>2401.00001</first_item><last_item>2401.00002</last_item>
    <timestamp>2024-01-01 00:00:00</timestamp>
  </file>
  <file>
    <filename>src/arXiv_src_2402_001.tar</filename>
    <yymm>2402</yymm><seq_num>1</seq_num><size>200</size><num_items>3</num_items>
    <md5sum>ccc</md5sum><content_md5sum>ddd</content_md5sum>
    <first_item>2402.00001</first_item><last_item>2402.00003</last_item>
    <timestamp>2024-02-01 00:00:00</timestamp>
  </file>
</arXivSRC>`,
    "utf8",
  );

  for (const output of [output1, output2]) {
    const result = runPython([
      "scripts/science-equations/plan-arxiv-source.py",
      "--manifest",
      manifest,
      "--output",
      output,
      "--yymm",
      "2401",
    ]);
    assert.equal(result.status, 0, result.stderr);
  }

  assert.equal(readFileSync(output1, "utf8"), readFileSync(output2, "utf8"));
  const plan = JSON.parse(readFileSync(output1, "utf8"));
  assert.equal(plan.selection.chunk_count, 1);
  assert.equal(plan.selection.total_items_reported, 2);
  assert.equal(plan.chunks[0].filename, "src/arXiv_src_2401_001.tar");
  assert.match(plan.selection.selection_sha256, /^[a-f0-9]{64}$/);
});
