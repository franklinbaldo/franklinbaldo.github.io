import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("doctor reports data plane environment and discovers sources", () => {
  const result = spawnSync(
    "python",
    ["scripts/science-equations/doctor.py", "--json"],
    {
      encoding: "utf8",
    }
  );

  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);

  assert.equal(report.all_critical_ok, true);
  assert.equal(report.node.status, "OK");
  assert.equal(report.python.status, "OK");
  assert.equal(report.python_packages.pydantic.status, "OK");
  assert.equal(report.python_packages.pyarrow.status, "OK");
  assert.equal(report.ia_cli.status, "OK");
  assert.equal(report.okf_parser.status, "OK");
  assert.ok(report.sources["pmc-jats-formulas"]);
  assert.ok(report.sources["oeis-formula-lines"]);
  assert.ok(report.sources["wikidata-p2534"]);
});
