import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const pythonBin = process.platform === "win32" ? "python" : "python3";
const harvester = "scripts/science-equations/harvest-govinfo-ecfr-math.py";
const inventoryBuilder = "scripts/science-equations/build-source-inventory.py";

const fixture = `<?xml version="1.0" encoding="UTF-8"?>
<DLPSTEXTCLASS><HEADER><FILEDESC><PUBLICATIONSTMT><IDNO TYPE="title">40</IDNO></PUBLICATIONSTMT></FILEDESC></HEADER>
<TEXT><BODY><ECFRBRWS>
<DIV8 N="§ 1065.665" TYPE="SECTION"><HEAD>§ 1065.665 Emission calculations.</HEAD>
<P>Use the following equation:</P>
<MATH BORDER="NODRAW" SPAN="1"><img src="http://www.ecfr.gov/graphics/example.gif"/></MATH>
<FRP0>Equation 1</FRP0><FP>where:</FP>
<MATH SPAN='2' DEEP='250'>x + y = z</MATH>
</DIV8></ECFRBRWS></BODY></TEXT></DLPSTEXTCLASS>`;

test("GovInfo eCFR adapter preserves attested MATH XML and never OCRs", async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "ecfr-math-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const nested = path.join(dir, "title-40");
  await mkdir(nested, { recursive: true });
  await writeFile(path.join(nested, "ECFR-title40.xml"), fixture, "utf8");

  const result = spawnSync(
    pythonBin,
    [harvester, "--root", dir, "--snapshot", "inventory-sha256:abc"],
    { encoding: "utf8" }
  );
  assert.equal(result.status, 0, result.stderr);
  const rows = result.stdout.trim().split("\n").map(JSON.parse);

  assert.equal(rows.length, 2);
  assert.equal(rows[0].provenance_class, "attested");
  assert.equal(rows[0].expression_encoding, "ecfr-math-xml");
  assert.match(rows[0].expression_original, /<MATH BORDER="NODRAW"/);
  assert.deepEqual(rows[0].graphic_refs, ["http://www.ecfr.gov/graphics/example.gif"]);
  assert.equal(rows[0].ocr_performed, false);
  assert.equal(rows[0].reconstruction_performed, false);
  assert.equal(rows[0].ecfr_section, "§ 1065.665");
  assert.match(rows[0].source_record_sha256, /^[a-f0-9]{64}$/);
});

test("source inventory is deterministic and content-addressed", async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "ecfr-inventory-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await writeFile(path.join(dir, "a.xml"), "<root>A</root>", "utf8");
  await writeFile(path.join(dir, "b.xml"), "<root>B</root>", "utf8");
  const one = path.join(dir, "one.json");
  const two = path.join(dir, "two.json");

  for (const output of [one, two]) {
    const result = spawnSync(
      pythonBin,
      [
        inventoryBuilder,
        "--root",
        dir,
        "--glob",
        "*.xml",
        "--source-id",
        "govinfo-ecfr-math-blocks",
        "--output",
        output,
      ],
      { encoding: "utf8" }
    );
    assert.equal(result.status, 0, result.stderr);
  }

  assert.equal(await readFile(one, "utf8"), await readFile(two, "utf8"));
  const manifest = JSON.parse(await readFile(one, "utf8"));
  assert.equal(manifest.file_count, 2);
  assert.match(manifest.inventory_sha256, /^[a-f0-9]{64}$/);
  assert.equal(manifest.snapshot, `inventory-sha256:${manifest.inventory_sha256}`);
});
