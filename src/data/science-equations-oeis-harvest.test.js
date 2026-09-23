import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { PassThrough } from "node:stream";
import test from "node:test";

import {
  harvestGitRepository,
  normalizeOeisFormulaText,
  parseGitGrepFormulaLine,
} from "../../scripts/science-equations/harvest-oeis-formulas.mjs";

test("normalizeOeisFormulaText only canonicalizes surrounding and repeated whitespace", () => {
  assert.equal(normalizeOeisFormulaText("  a(n)   =  n^2 + 3*n.  "), "a(n) = n^2 + 3*n.");
});

test("parseGitGrepFormulaLine preserves attested OEIS formula notation and provenance", () => {
  const snapshot = "86962e9ef366e08ffbeeff8c72c1cf2b4268d82b";
  const line = `${snapshot}:seq/A000/A000012.seq:101:%F A000012 G.f.: 1/(1-x).`;
  const record = parseGitGrepFormulaLine(line, { snapshot });

  assert.equal(record.source_id, "oeis-formula-lines");
  assert.equal(record.source_document_id, "A000012");
  assert.equal(record.source_line, 101);
  assert.equal(record.original_expression, "G.f.: 1/(1-x).");
  assert.equal(record.provenance_class, "attested");
  assert.equal(record.source_license, "CC-BY-SA-4.0");
  assert.match(record.source_record_url, /86962e9e.*A000012\.seq#L101$/);
  assert.match(record.source_record_sha256, /^[a-f0-9]{64}$/);
  assert.match(record.original_text_sha256, /^[a-f0-9]{64}$/);
  assert.match(record.normalized_text_sha256, /^[a-f0-9]{64}$/);
});

test("parseGitGrepFormulaLine rejects mismatched sequence paths and non-formula fields", () => {
  const snapshot = "abc123";
  assert.equal(
    parseGitGrepFormulaLine(`${snapshot}:seq/A000/A000001.seq:3:%N A000001 name`, { snapshot }),
    null,
  );
  assert.equal(
    parseGitGrepFormulaLine(`${snapshot}:seq/A000/A000002.seq:3:%F A000001 a(n)=1`, { snapshot }),
    null,
  );
});

test("harvestGitRepository streams every %F line from a pinned git snapshot", async (t) => {
  const repo = await mkdtemp(path.join(os.tmpdir(), "oeis-harvest-"));
  t.after(async () => {
    await rm(repo, { recursive: true, force: true });
  });

  await mkdir(path.join(repo, "seq", "A000"), { recursive: true });
  await writeFile(
    path.join(repo, "seq", "A000", "A000001.seq"),
    [
      "%I A000001 #1",
      "%N A000001 fixture one",
      "%F A000001 a(n) = n^2 + 3*n.",
      "%F A000001 a(n)=a(n-1)+2*n-1.",
      "",
    ].join("\n"),
  );
  await writeFile(
    path.join(repo, "seq", "A000", "A000002.seq"),
    ["%I A000002 #1", "%N A000002 fixture two", "%F A000002 a(n) = n^2 + 3*n.", ""].join(
      "\n",
    ),
  );

  execFileSync("git", ["init", "-q"], { cwd: repo });
  execFileSync("git", ["config", "user.email", "atlas@example.invalid"], { cwd: repo });
  execFileSync("git", ["config", "user.name", "Atlas Fixture"], { cwd: repo });
  execFileSync("git", ["add", "."], { cwd: repo });
  execFileSync("git", ["commit", "-qm", "fixture"], { cwd: repo });
  const snapshot = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo, encoding: "utf8" }).trim();

  const output = new PassThrough();
  output.setEncoding("utf8");
  let jsonl = "";
  output.on("data", (chunk) => {
    jsonl += chunk;
  });

  const metrics = await harvestGitRepository({ repo, snapshot, output });
  const rows = jsonl.trim().split("\n").map(JSON.parse);

  assert.deepEqual(metrics, {
    resolvedSnapshot: snapshot,
    formulaLinesSeen: 3,
    rejectedLines: 0,
    recordsWritten: 3,
    limited: false,
  });
  assert.equal(rows.length, 3);
  assert.equal(rows[0].source_document_id, "A000001");
  assert.equal(rows[2].source_document_id, "A000002");
  assert.equal(rows[0].original_expression, "a(n) = n^2 + 3*n.");
  assert.equal(rows[2].original_expression, "a(n) = n^2 + 3*n.");
  assert.notEqual(rows[0].source_record_sha256, rows[2].source_record_sha256);
  assert.equal(rows[0].original_text_sha256, rows[2].original_text_sha256);
  assert.equal(rows[0].normalized_text_sha256, rows[2].normalized_text_sha256);
});
