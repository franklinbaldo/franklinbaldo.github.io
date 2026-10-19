import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const pythonBin = process.platform === "win32" ? "python" : "python3";
const script = "scripts/science-equations/harvest-lmfdb-elliptic-curves-q.py";

function runPython(args) {
  return spawnSync(pythonBin, args, { encoding: "utf8" });
}

const csv = `lmfdb_label,ainvs,conductor,jinv,analytic_rank,cm,lmfdb_iso,lmfdb_number
14.a4,"{1,0,1,-11,12}",14,"{128787625,98}",0,0,14.a,4
72.a6,"[0,0,0,141,4718]",72,"[207646,6561]",0,0,72.a,6
63.a6,"{1,-1,0,9,0}",63,"{103823,63}",0,0,63.a,6
bad.a1,"{1,2,3,4}",99,"{1,1}",0,0,bad.a,1
`;

test("LMFDB elliptic-curve adapter reconstructs generalized Weierstrass equations", () => {
  const root = mkdtempSync(join(tmpdir(), "atlas-lmfdb-ec-"));
  const csvPath = join(root, "ec.csv");
  writeFileSync(csvPath, csv, "utf8");

  const result = runPython([script, "--input", csvPath, "--snapshot", "rowstream-sha256:fixture"]);
  assert.equal(result.status, 0, result.stderr);
  const rows = result.stdout.trim().split("\n").filter(Boolean).map(JSON.parse);
  assert.deepEqual(rows.map((row) => row.expression_original), [
    "y^2 + x*y + y = x^3 - 11*x + 12",
    "y^2 = x^3 + 141*x + 4718",
    "y^2 + x*y = x^3 - x^2 + 9*x",
  ]);
  assert.ok(rows.every((row) => row.provenance_class === "reconstructed"));
  assert.ok(rows.every((row) => row.source_table === "ec_curvedata"));
  assert.equal(rows[0].source_document_url, "https://www.lmfdb.org/EllipticCurve/Q/14/a/4");
  assert.deepEqual(rows[0].source_attested_payload.ainvs, [1, 0, 1, -11, 12]);

  const metrics = JSON.parse(result.stderr.trim().split("\n").at(-1));
  assert.equal(metrics.rows_read, 4);
  assert.equal(metrics.records_emitted, 3);
  assert.equal(metrics.rows_rejected, 1);
});

test("LMFDB elliptic-curve record hashes ignore CSV column ordering", () => {
  const root = mkdtempSync(join(tmpdir(), "atlas-lmfdb-ec-order-"));
  const a = join(root, "a.csv");
  const b = join(root, "b.csv");
  writeFileSync(a, `lmfdb_label,ainvs,conductor,jinv,analytic_rank,cm,lmfdb_iso,lmfdb_number
14.a4,"{1,0,1,-11,12}",14,"{128787625,98}",0,0,14.a,4
`, "utf8");
  writeFileSync(b, `conductor,lmfdb_number,lmfdb_iso,cm,analytic_rank,jinv,ainvs,lmfdb_label
14,4,14.a,0,0,"{128787625,98}","{1,0,1,-11,12}",14.a4
`, "utf8");

  const args = ["--snapshot", "rowstream-sha256:same"];
  const first = runPython([script, "--input", a, ...args]);
  const second = runPython([script, "--input", b, ...args]);
  assert.equal(first.status, 0, first.stderr);
  assert.equal(second.status, 0, second.stderr);
  assert.equal(JSON.parse(first.stdout).source_record_sha256, JSON.parse(second.stdout).source_record_sha256);
});
