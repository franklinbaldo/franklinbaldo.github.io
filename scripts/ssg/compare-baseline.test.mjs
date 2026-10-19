import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { compareSites, compactSummary, publicRoute } from "./compare-baseline.mjs";

function write(root, file, content = "") {
  const dest = join(root, file);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, content);
}

test("publicRoute maps directory indexes to stable public URLs", () => {
  assert.equal(publicRoute("index.html"), "/");
  assert.equal(publicRoute("blog/hello/index.html"), "/blog/hello/");
  assert.equal(publicRoute("404.html"), "/404.html");
});

test("full artifact baseline distinguishes missing HTML from shared assets", async () => {
  const temp = mkdtempSync(join(tmpdir(), "ssg-compare-"));
  const baseline = join(temp, "zola");
  const candidate = join(temp, "ssg");
  const staticSource = join(temp, "public");
  for (const dir of [baseline, candidate, staticSource])
    mkdirSync(dir, { recursive: true });
  try {
    write(baseline, "index.html", "HOME");
    write(baseline, "archive/index.html", "ARCHIVE");
    write(baseline, "ranking/duels/1/index.html", "DUEL");
    write(baseline, "blog/hello/index.html", "BLOG");
    write(baseline, "images/photo.png", "photo");
    write(baseline, "legacy.js", "old-build");
    write(candidate, "index.html", "SSG HOME");
    write(candidate, "blog/hello/index.html", "SSG BLOG");
    write(candidate, "images/photo.png", "photo");
    write(candidate, "tags/native/index.html", "NATIVE");
    write(staticSource, "images/photo.png", "photo");
    write(staticSource, "css/missing.css", "missing");
    const result = await compareSites({ baseline, candidate, staticSource });
    assert.equal(result.baseline_html_pages, 4);
    assert.equal(result.candidate_html_pages, 3);
    assert.equal(result.html_path_coverage_percent, 50);
    assert.deepEqual(result.missing_html, ["/archive/", "/ranking/duels/1/"]);
    assert.deepEqual(result.missing_html_by_family, { archive: 1, ranking: 1 });
    assert.deepEqual(result.additional_html, ["/tags/native/"]);
    assert.deepEqual(result.missing_other_baseline_files, ["legacy.js"]);
    assert.equal(result.unchanged_static_assets, 1);
    assert.deepEqual(result.missing_static_assets, ["css/missing.css"]);
    assert.deepEqual(result.different_static_assets, []);
    assert.equal(result.full_path_parity, false);
    assert.equal(result.functional_parity_verified, false);
    assert.equal(result.public_cutover_allowed, false);
    assert.equal(compactSummary(result).missing_html_count, 2);
  } finally { rmSync(temp, { recursive: true, force: true }); }
});

test("asset collisions are surfaced without overwriting generated output", async () => {
  const temp = mkdtempSync(join(tmpdir(), "ssg-compare-"));
  const baseline = join(temp, "zola");
  const candidate = join(temp, "ssg");
  const staticSource = join(temp, "public");
  for (const dir of [baseline, candidate, staticSource])
    mkdirSync(dir, { recursive: true });
  try {
    write(baseline, "index.html");
    write(candidate, "index.html");
    write(baseline, "robots.txt", "zola");
    write(candidate, "robots.txt", "ssg");
    write(staticSource, "robots.txt", "handwritten");
    const result = await compareSites({ baseline, candidate, staticSource });
    assert.deepEqual(result.different_static_assets, ["robots.txt"]);
    assert.equal(result.full_path_parity, false);
    assert.equal(result.html_path_coverage_percent, 100);
  } finally { rmSync(temp, { recursive: true, force: true }); }
});

test("a missing SSG output is an error, never an empty-success report", async () => {
  const temp = mkdtempSync(join(tmpdir(), "ssg-compare-"));
  const baseline = join(temp, "zola");
  const candidate = join(temp, "ssg");
  const staticSource = join(temp, "public");
  for (const dir of [baseline, candidate, staticSource])
    mkdirSync(dir, { recursive: true });
  try {
    write(baseline, "index.html");
    await assert.rejects(compareSites({ baseline, candidate, staticSource }),
      /Missing built site root index.html/);
  } finally { rmSync(temp, { recursive: true, force: true }); }
});
