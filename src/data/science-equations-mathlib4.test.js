import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const pythonBin = process.platform === "win32" ? "python" : "python3";
const commit = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const inventory = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const snapshot = `mathlib4:git:${commit}:inventory-sha256:${inventory}`;

function fixtureSource() {
  return `namespace Fixture

theorem add_zero (n : Nat) : n + 0 = n := by
  simp

lemma multiline
    (a b : Nat)
    (h : a ≤ b) :
    a + 1 ≤ b + 1 := by
  omega

private theorem quantified : ∀ n : Nat, n = n := by
  intro n
  rfl

theorem «quoted name» : True := by
  trivial

/- outer comment
  theorem fakeComment : False := by contradiction
  /- lemma nestedFake : 1 = 2 := by omega -/
-/

def ordinary := "theorem fakeString : 2 = 3 := by omega"
def raw := r#"lemma fakeRaw : False := by contradiction"#
macro "fake" : command => \`(theorem fakeQuoted : 7 = 8 := by omega)
#check \`theorem

theorem inferred := True.intro

end Fixture
`;
}

function writeCheckout(root) {
  const dir = join(root, "Mathlib", "Algebra");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(root, "LICENSE"), "Apache License\nVersion 2.0, January 2004\n", "utf8");
  writeFileSync(join(dir, "Fixture.lean"), fixtureSource(), "utf8");
}

function run(root, runSnapshot = snapshot, runCommit = commit) {
  return spawnSync(
    pythonBin,
    [
      "scripts/science-equations/harvest-mathlib4-statements.py",
      "--input",
      root,
      "--snapshot",
      runSnapshot,
      "--commit",
      runCommit,
    ],
    { encoding: "utf8" },
  );
}

test("mathlib4 adapter emits explicit attested theorem/lemma propositions", () => {
  const root = mkdtempSync(join(tmpdir(), "atlas-mathlib4-"));
  writeCheckout(root);
  const result = run(root);
  assert.equal(result.status, 0, result.stderr);

  const rows = result.stdout.trim().split("\n").filter(Boolean).map(JSON.parse);
  assert.equal(rows.length, 4);
  assert.deepEqual(rows.map((row) => row.expression_original), [
    "n + 0 = n",
    "a + 1 ≤ b + 1",
    "∀ n : Nat, n = n",
    "True",
  ]);
  assert.deepEqual(rows.map((row) => row.source_declaration_name), [
    "add_zero",
    "multiline",
    "quantified",
    "«quoted name»",
  ]);
  assert.ok(rows.every((row) => row.source_id === "mathlib4-formal-statements"));
  assert.ok(rows.every((row) => row.provenance_class === "attested"));
  assert.ok(rows.every((row) => row.expression_encoding === "Lean 4 proposition syntax"));
  assert.ok(rows.every((row) => row.source_license === "Apache-2.0"));
  assert.ok(rows.every((row) => row.source_attested_payload.proof_body_excluded === true));
  assert.ok(rows.every((row) => row.source_attested_payload.reconstruction_performed === false));
  assert.ok(rows.every((row) => row.source_attested_payload.ocr_performed === false));
  assert.equal(rows[0].source_document_id, "Mathlib/Algebra/Fixture.lean");
  assert.equal(rows[0].source_domain_path, "Algebra");

  const metrics = JSON.parse(result.stderr.trim().split("\n").at(-1));
  assert.equal(metrics.files_seen, 1);
  assert.equal(metrics.declarations_seen, 5);
  assert.equal(metrics.records_written, 4);
  assert.equal(metrics.rejected_no_explicit_statement, 1);
  assert.equal(metrics.masked_block_comments, 1);
  assert.equal(metrics.masked_raw_strings, 1);
  assert.equal(metrics.masked_syntax_quotes, 1);
  assert.equal(metrics.ocr_performed, 0);
  assert.equal(metrics.reconstructions, 0);
});

test("mathlib4 occurrence identity is independent of checkout directory", () => {
  const left = mkdtempSync(join(tmpdir(), "atlas-mathlib4-left-"));
  const right = mkdtempSync(join(tmpdir(), "atlas-mathlib4-right-"));
  writeCheckout(left);
  writeCheckout(right);

  const first = run(left);
  const second = run(right);
  assert.equal(first.status, 0, first.stderr);
  assert.equal(second.status, 0, second.stderr);

  const hashes = (stdout) => stdout.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line).source_record_sha256);
  assert.deepEqual(hashes(first.stdout), hashes(second.stdout));
});

test("mathlib4 adapter fails closed when snapshot is not bound to commit", () => {
  const root = mkdtempSync(join(tmpdir(), "atlas-mathlib4-mismatch-"));
  writeCheckout(root);
  const otherCommit = "cccccccccccccccccccccccccccccccccccccccc";
  const result = run(root, snapshot, otherCommit);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /snapshot must bind the exact --commit/);
});
