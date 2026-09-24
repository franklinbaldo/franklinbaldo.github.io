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

function writeFixture(root) {
  writeFileSync(
    join(root, "PostHistory.xml"),
    `<?xml version="1.0" encoding="utf-8"?>
<posthistory>
  <row Id="10" PostHistoryTypeId="2" PostId="1" RevisionGUID="r1" CreationDate="2010-01-01T00:00:00.000" UserId="7" Text="Initial $x=1$ body" />
  <row Id="11" PostHistoryTypeId="5" PostId="1" RevisionGUID="r2" CreationDate="2019-01-01T00:00:00.000" UserId="8" Text="Edited $$E=mc^2$$ and \`code $z=3$\` plus $a+b$." />
  <row Id="20" PostHistoryTypeId="2" PostId="2" RevisionGUID="r3" CreationDate="2015-01-01T00:00:00.000" UserId="9" Text="Question has $p(x)$ and &lt;code&gt;$not_math$&lt;/code&gt;." />
</posthistory>`,
    "utf8",
  );
  writeFileSync(
    join(root, "Posts.xml"),
    `<?xml version="1.0" encoding="utf-8"?>
<posts>
  <row Id="1" PostTypeId="2" ParentId="99" OwnerUserId="7" Score="5" />
  <row Id="2" PostTypeId="1" OwnerUserId="9" Score="10" Title="Fixture" Tags="&lt;probability&gt;&lt;statistics&gt;" />
</posts>`,
    "utf8",
  );
}

function args(root) {
  return [
    "scripts/science-equations/harvest-stackexchange-tex.py",
    "--input",
    root,
    "--site",
    "math.stackexchange.com",
    "--snapshot",
    "stackexchange:math.stackexchange.com:fixture:inventory-sha256:abc123",
  ];
}

test("Stack Exchange adapter selects latest body revision, preserves TeX and suppresses code", () => {
  const root = mkdtempSync(join(tmpdir(), "atlas-stackexchange-"));
  writeFixture(root);

  const result = runPython(args(root));
  assert.equal(result.status, 0, result.stderr);
  const rows = result.stdout.trim().split("\n").filter(Boolean).map(JSON.parse);

  assert.equal(rows.length, 3);
  assert.deepEqual(
    rows.map((row) => row.expression_original),
    ["$$E=mc^2$$", "$a+b$", "$p(x)$"],
  );
  assert.ok(rows.every((row) => row.source_id === "stackexchange-data-dump-tex"));
  assert.ok(rows.every((row) => row.provenance_class === "attested"));
  assert.ok(rows.every((row) => row.source_site === "math.stackexchange.com"));
  assert.ok(rows.every((row) => row.source_attested_payload.raw_markdown_tex_preserved === true));
  assert.ok(rows.every((row) => row.source_attested_payload.reconstruction_performed === false));
  assert.ok(rows.every((row) => row.source_attested_payload.ocr_performed === false));
  assert.ok(!rows.some((row) => row.expression_original.includes("z=3")));
  assert.ok(!rows.some((row) => row.expression_original.includes("not_math")));

  const edited = rows.filter((row) => row.source_post_id === 1);
  assert.ok(edited.every((row) => row.source_revision_guid === "r2"));
  assert.ok(edited.every((row) => row.source_license === "CC-BY-SA-4.0"));
  assert.equal(rows.find((row) => row.source_post_id === 2).source_license, "CC-BY-SA-3.0");
  assert.equal(rows.find((row) => row.source_post_id === 2).source_tags, "<probability><statistics>");

  const metrics = JSON.parse(result.stderr.trim().split("\n").at(-1));
  assert.equal(metrics.body_revisions_seen, 3);
  assert.equal(metrics.latest_body_rows, 2);
  assert.equal(metrics.posts_metadata_matched, 2);
  assert.equal(metrics.records_written, 3);
  assert.equal(metrics.ocr_performed, 0);
  assert.equal(metrics.reconstructions, 0);
});

test("Stack Exchange logical occurrence identity is independent of extraction directory", () => {
  const left = mkdtempSync(join(tmpdir(), "atlas-stackexchange-left-"));
  const right = mkdtempSync(join(tmpdir(), "atlas-stackexchange-right-"));
  writeFixture(left);
  writeFixture(right);

  const first = runPython(args(left));
  const second = runPython(args(right));
  assert.equal(first.status, 0, first.stderr);
  assert.equal(second.status, 0, second.stderr);

  const hashes = (stdout) =>
    stdout.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line).source_record_sha256);
  assert.deepEqual(hashes(first.stdout), hashes(second.stdout));
});
