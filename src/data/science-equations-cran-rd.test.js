import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const pythonBin = process.platform === "win32" ? "python" : "python3";
const snapshot = "cran-rd-math:inventory-sha256:fixture123";

function makePackage(root, name, version, license, rdText) {
  const packageRoot = join(root, `${name}-src`, name);
  mkdirSync(join(packageRoot, "man"), { recursive: true });
  writeFileSync(
    join(packageRoot, "DESCRIPTION"),
    `Package: ${name}\nVersion: ${version}\nTitle: ${name} fixture\nLicense: ${license}\nEncoding: UTF-8\n`,
    "utf8",
  );
  writeFileSync(join(packageRoot, "man", `${name}.Rd`), rdText, "utf8");
  const tarPath = join(root, `${name}_${version}.tar.gz`);
  const code = [
    "import io, pathlib, sys, tarfile",
    "src=pathlib.Path(sys.argv[1]); out=pathlib.Path(sys.argv[2]); pkg=sys.argv[3]",
    "with tarfile.open(out, 'w:gz') as tf:",
    "  for p in sorted(src.rglob('*')):",
    "    if p.is_file():",
    "      data=p.read_bytes(); rel=f'{pkg}/'+p.relative_to(src).as_posix(); ti=tarfile.TarInfo(rel); ti.size=len(data); tf.addfile(ti, io.BytesIO(data))",
  ].join("\n");
  const made = spawnSync(
    pythonBin,
    ["-c", code, packageRoot, tarPath, name],
    { encoding: "utf8" },
  );
  assert.equal(made.status, 0, made.stderr);
  return tarPath;
}

function run(root, index) {
  return spawnSync(
    pythonBin,
    [
      "scripts/science-equations/harvest-cran-rd.py",
      "--input",
      root,
      "--packages-index",
      index,
      "--snapshot",
      snapshot,
    ],
    { encoding: "utf8" },
  );
}

function rows(stdout) {
  return stdout.trim().split("\n").filter(Boolean).map(JSON.parse);
}

test("CRAN Rd adapter preserves attested eqn/deqn markup and repository rights metadata", () => {
  const root = mkdtempSync(join(tmpdir(), "atlas-cran-rd-"));
  makePackage(
    root,
    "foo",
    "1.0",
    "MIT",
    String.raw`\name{foo}
\alias{foo}
\title{Foo math}
\description{Inline \eqn{x^2 + y^2 = z^2}{x^2+y^2=z^2}.}
\details{
\deqn{p(x) = \frac{\lambda^x e^{-\lambda}}{x!}}{p(x)=lambda^x exp(-lambda)/x!}
% \eqn{ignored-comment}
\eqn{0 < p \le 1}
}
`,
  );
  const index = join(root, "PACKAGES");
  writeFileSync(
    index,
    "Package: foo\nVersion: 1.0\nLicense: MIT\nLicense_is_FOSS: yes\nLicense_restricts_use: no\n\n",
    "utf8",
  );

  const result = run(root, index);
  assert.equal(result.status, 0, result.stderr);
  const output = rows(result.stdout);
  assert.equal(output.length, 3);
  assert.deepEqual(
    output.map((row) => row.math_display),
    ["inline", "display", "inline"],
  );
  assert.equal(output[0].expression_original, "x^2 + y^2 = z^2");
  assert.equal(output[0].expression_ascii_original, "x^2+y^2=z^2");
  assert.equal(
    output[1].source_markup_original,
    String.raw`\deqn{p(x) = \frac{\lambda^x e^{-\lambda}}{x!}}{p(x)=lambda^x exp(-lambda)/x!}`,
  );
  assert.equal(output[2].rd_section, "details");
  assert.ok(output.every((row) => row.provenance_class === "attested"));
  assert.ok(output.every((row) => row.redistribution_allowed === true));
  assert.ok(
    output.every(
      (row) => row.source_attested_payload.reconstruction_performed === false,
    ),
  );
  assert.ok(
    output.every((row) => row.source_attested_payload.ocr_performed === false),
  );

  const metrics = JSON.parse(result.stderr.trim().split("\n").at(-1));
  assert.equal(metrics.packages_seen, 1);
  assert.equal(metrics.math_macros_seen, 3);
  assert.equal(metrics.records_written, 3);
  assert.equal(metrics.redistributable_records, 3);
  assert.equal(metrics.ocr_performed, 0);
  assert.equal(metrics.reconstructions, 0);
});

test("CRAN occurrence identity ignores executor path and uncertain rights fail closed", () => {
  const roots = [
    mkdtempSync(join(tmpdir(), "atlas-cran-left-")),
    mkdtempSync(join(tmpdir(), "atlas-cran-right-")),
  ];
  const outputs = [];

  for (const root of roots) {
    makePackage(
      root,
      "bar",
      "2.0",
      "file LICENSE",
      String.raw`\name{bar}
\title{Bar}
\details{\deqn{L(\theta) = \sum_i \ell_i(\theta)}}
`,
    );
    const index = join(root, "PACKAGES");
    writeFileSync(
      index,
      "Package: bar\nVersion: 2.0\nLicense: file LICENSE\n\n",
      "utf8",
    );
    const result = run(root, index);
    assert.equal(result.status, 0, result.stderr);
    outputs.push(rows(result.stdout));
  }

  assert.equal(outputs[0].length, 1);
  assert.equal(
    outputs[0][0].source_record_sha256,
    outputs[1][0].source_record_sha256,
  );
  assert.equal(outputs[0][0].rights_status, "license-present-unverified");
  assert.equal(outputs[0][0].redistribution_allowed, false);
});
