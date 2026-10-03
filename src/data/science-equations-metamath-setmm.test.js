import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const pythonBin = process.platform === "win32" ? "python" : "python3";
const commit = "fixturecommit";
const snapshot = `metamath-setmm:git:${commit}:inventory-sha256:fixture123`;

function fixture() {
  return `$( fixture database $)\n$c |- wff class = < e. C_ -> $.\n$v ph A B x y $.\nwph $f wff ph $.\ncA $f class A $.\ncB $f class B $.\n$( An equality theorem with a condition. $)\n\${\n  hyp.1 $e |- ph $.\n  $d x y $.\n  eq1 $p |- ( ph -> A = B ) $= cA cB $.\n  lt1 $a |- A < B $.\n$}\nlogicOnly $p |- ph $= wph $.\n$( Membership theorem. $)\nmember $p |- A e. B $= cA cB $.\nsyntaxEq $a wff A = B $.\n`;
}

function writeFixture(root) {
  writeFileSync(join(root, "set.mm"), fixture(), "utf8");
}

function run(root) {
  return spawnSync(
    pythonBin,
    [
      "scripts/science-equations/harvest-metamath-setmm.py",
      "--input",
      root,
      "--snapshot",
      snapshot,
      "--commit",
      commit,
    ],
    { encoding: "utf8" },
  );
}

function rows(stdout) {
  return stdout.trim().split("\n").filter(Boolean).map(JSON.parse);
}

test("Metamath set.mm adapter emits attested relation-bearing logical assertions with formal context", () => {
  const root = mkdtempSync(join(tmpdir(), "atlas-metamath-"));
  writeFixture(root);
  const result = run(root);
  assert.equal(result.status, 0, result.stderr);
  const output = rows(result.stdout);
  assert.equal(output.length, 3);
  assert.deepEqual(output.map((row) => row.metamath_label), ["eq1", "lt1", "member"]);
  assert.deepEqual(output.map((row) => row.expression_original), [
    "|- ( ph -> A = B )",
    "|- A < B",
    "|- A e. B",
  ]);
  assert.ok(output.every((row) => row.source_id === "metamath-setmm-relations"));
  assert.ok(output.every((row) => row.source_license === "CC0-1.0"));
  assert.ok(output.every((row) => row.provenance_class === "attested"));
  assert.ok(output.every((row) => row.source_attested_payload.ocr_performed === false));
  assert.ok(output.every((row) => row.source_attested_payload.reconstruction_performed === false));
  assert.equal(output[0].metamath_essential_hypotheses[0].label, "hyp.1");
  assert.deepEqual(output[0].metamath_floating_hypotheses.map((item) => item.variable), ["ph", "A", "B"]);
  assert.deepEqual(output[0].metamath_relation_tokens, ["="]);
  assert.deepEqual(output[1].metamath_relation_tokens, ["<"]);
  assert.deepEqual(output[2].metamath_relation_tokens, ["e."]);
  assert.match(output[2].source_context_comment, /Membership theorem/);
  assert.ok(output[0].source_attested_payload.proof_sha256);

  const metrics = JSON.parse(result.stderr.trim().split("\n").at(-1));
  assert.equal(metrics.assertions_seen, 5);
  assert.equal(metrics.records_written, 3);
  assert.equal(metrics.filtered_no_relation, 1);
  assert.equal(metrics.filtered_nonlogical, 1);
  assert.equal(metrics.ocr_performed, 0);
  assert.equal(metrics.reconstructions, 0);
});

test("Metamath occurrence identity is independent of checkout directory", () => {
  const left = mkdtempSync(join(tmpdir(), "atlas-metamath-left-"));
  const right = mkdtempSync(join(tmpdir(), "atlas-metamath-right-"));
  writeFixture(left);
  writeFixture(right);
  const first = run(left);
  const second = run(right);
  assert.equal(first.status, 0, first.stderr);
  assert.equal(second.status, 0, second.stderr);
  assert.deepEqual(
    rows(first.stdout).map((row) => row.source_record_sha256),
    rows(second.stdout).map((row) => row.source_record_sha256),
  );
});
