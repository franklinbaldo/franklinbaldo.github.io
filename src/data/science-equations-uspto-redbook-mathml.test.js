import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { copyFileSync, mkdtempSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const pythonBin = process.platform === "win32" ? "python" : "python3";
const script = "scripts/science-equations/harvest-uspto-redbook-mathml.py";

function sha256(data) {
  return createHash("sha256").update(data).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function fixtureXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<us-patent-grant dtd-version="v4.7 2022-07-01" lang="EN" file="US0001-20260922.XML" date-publ="20260922">
  <us-bibliographic-data-grant>
    <publication-reference><document-id><country>US</country><doc-number>12345678</doc-number><kind>B2</kind><date>20260922</date></document-id></publication-reference>
    <invention-title>Control relation fixture</invention-title>
  </us-bibliographic-data-grant>
  <description>
    <p>The controller uses <maths id="m1" num="0001"><math xmlns="http://www.w3.org/1998/Math/MathML"><apply><eq/><ci>y</ci><apply><times/><ci>K</ci><ci>x</ci></apply></apply></math><img file="eqn0001.tif"/></maths> during operation.</p>
    <p>Legacy image only <maths id="m2"><img file="eqn0002.tif"/></maths>.</p>
  </description>
</us-patent-grant>
<?xml version="1.0" encoding="UTF-8"?>
<us-patent-application dtd-version="v4.7 2022-07-01" lang="EN" file="US0002-20260922.XML" date-publ="20260922">
  <us-bibliographic-data-application>
    <publication-reference><document-id><country>US</country><doc-number>20260345678</doc-number><kind>A1</kind><date>20260922</date></document-id></publication-reference>
    <invention-title>Optimization relation fixture</invention-title>
  </us-bibliographic-data-application>
  <description>
    <p>Copyright © 2026 Example Corp. All Rights Reserved.</p>
    <p>The loss is <maths num="0003"><m:math xmlns:m="http://www.w3.org/1998/Math/MathML"><m:apply><m:eq/><m:ci>L</m:ci><m:apply><m:power/><m:ci>e</m:ci><m:cn>2</m:cn></m:apply></m:apply></m:math></maths>.</p>
  </description>
</us-patent-application>`;
}

function makeZip(path, xml) {
  const code = [
    "import sys, zipfile",
    "p=sys.argv[1]",
    "data=sys.stdin.buffer.read()",
    "with zipfile.ZipFile(p,'w',zipfile.ZIP_DEFLATED) as z:",
    "    z.writestr('weekly.xml', data)",
  ].join("\n");
  const result = spawnSync(pythonBin, ["-c", code, path], { input: xml, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
}

function makeManifest(root, relativePath, objectName = "ipg260922.zip") {
  const full = join(root, relativePath);
  const digest = sha256(readFileSync(full));
  const size = statSync(full).size;
  const inventory = [{
    object_name: objectName,
    product: "Patent Grant/Application Full Text Data/XML fixture",
    release_date: "2026-09-22",
    size_bytes: size,
    sha256: digest,
  }];
  const snapshot = `uspto-redbook:inventory-sha256:${sha256(Buffer.from(stable(inventory)))}`;
  const manifest = {
    schema_version: 1,
    source_id: "uspto-redbook-mathml",
    objects: [{
      relative_path: relativePath,
      object_name: objectName,
      product: inventory[0].product,
      release_date: inventory[0].release_date,
      size_bytes: size,
      sha256: digest,
      rights_status: "redistributable",
      license: "Public Domain Mark 1.0",
      license_url: "https://creativecommons.org/publicdomain/mark/1.0/",
      product_url: "https://data.uspto.gov/bulkdata/datasets/ptgrxml",
    }],
  };
  const manifestPath = join(root, "manifest.json");
  writeFileSync(manifestPath, JSON.stringify(manifest), "utf8");
  return { manifestPath, snapshot };
}

function run(root, manifestPath, snapshot) {
  return spawnSync(pythonBin, [script, "--input", root, "--acquisition-manifest", manifestPath, "--snapshot", snapshot], { encoding: "utf8" });
}

function rows(stdout) {
  return stdout.trim().split("\n").filter(Boolean).map(JSON.parse);
}

test("USPTO Red Book adapter preserves exact MathML, skips image-only math, and fails closed on explicit rights notices", () => {
  const root = mkdtempSync(join(tmpdir(), "atlas-uspto-"));
  const zipPath = join(root, "weekly.zip");
  makeZip(zipPath, fixtureXml());
  const { manifestPath, snapshot } = makeManifest(root, "weekly.zip");
  const result = run(root, manifestPath, snapshot);
  assert.equal(result.status, 0, result.stderr);
  const output = rows(result.stdout);
  assert.equal(output.length, 2);
  assert.ok(output.every((row) => row.source_id === "uspto-redbook-mathml"));
  assert.ok(output.every((row) => row.provenance_class === "attested"));
  assert.ok(output.every((row) => row.expression_encoding === "MathML"));
  assert.match(output[0].expression_original, /^<math xmlns=/);
  assert.match(output[1].expression_original, /^<m:math xmlns:m=/);
  assert.equal(output[0].publication_number, "12345678");
  assert.equal(output[0].math_has_fallback_image, true);
  assert.equal(output[0].redistribution_allowed, true);
  assert.equal(output[1].publication_number, "20260345678");
  assert.equal(output[1].explicit_copyright_or_mask_notice_detected, true);
  assert.equal(output[1].redistribution_allowed, false);
  assert.equal(output[1].source_rights_status, "unverified");
  assert.ok(output.every((row) => row.source_attested_payload.ocr_performed === false));
  assert.ok(output.every((row) => row.source_attested_payload.reconstruction_performed === false));
  const metrics = JSON.parse(result.stderr.trim().split("\n").at(-1));
  assert.equal(metrics.objects_seen, 1);
  assert.equal(metrics.documents_seen, 2);
  assert.equal(metrics.math_containers_seen, 3);
  assert.equal(metrics.records_written, 2);
  assert.equal(metrics.image_only_math_rejected, 1);
  assert.equal(metrics.redistributable_records, 1);
  assert.equal(metrics.nonredistributable_records, 1);
  assert.equal(metrics.ocr_performed, 0);
  assert.equal(metrics.reconstructions, 0);
});

test("USPTO logical occurrence identity is independent of local acquisition paths", () => {
  const left = mkdtempSync(join(tmpdir(), "atlas-uspto-left-"));
  const right = mkdtempSync(join(tmpdir(), "atlas-uspto-right-"));
  const leftZip = join(left, "a.zip");
  makeZip(leftZip, fixtureXml());
  copyFileSync(leftZip, join(right, "different-local-name.zip"));
  const leftMeta = makeManifest(left, "a.zip");
  const rightMeta = makeManifest(right, "different-local-name.zip");
  assert.equal(leftMeta.snapshot, rightMeta.snapshot);
  const first = run(left, leftMeta.manifestPath, leftMeta.snapshot);
  const second = run(right, rightMeta.manifestPath, rightMeta.snapshot);
  assert.equal(first.status, 0, first.stderr);
  assert.equal(second.status, 0, second.stderr);
  assert.deepEqual(rows(first.stdout).map((row) => row.source_record_sha256), rows(second.stdout).map((row) => row.source_record_sha256));
});
