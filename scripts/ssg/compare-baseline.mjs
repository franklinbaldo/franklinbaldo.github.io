// Compare the entire SSG candidate against the actual published Zola artifact.
// A green SSG compile is NOT equivalent to complete URL/media parity.
import { createHash } from "node:crypto";
import { createReadStream, existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

function walk(root, directory = root, into = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolute = join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error("Symlink in built artifact: " + absolute);
    if (entry.isDirectory()) walk(root, absolute, into);
    else if (entry.isFile()) into.push(relative(root, absolute).replaceAll("\\", "/"));
  }
  return into;
}

export function publicRoute(file) {
  if (file === "index.html") return "/";
  if (file.endsWith("/index.html")) return "/" + file.slice(0, -"index.html".length);
  return "/" + file;
}

function family(file) {
  const normalized = publicRoute(file);
  if (normalized === "/") return "(home)";
  return normalized.split("/")[1] || "(home)";
}

function groupByFamily(paths) {
  const result = {};
  for (const path of paths) result[family(path)] = (result[family(path)] ?? 0) + 1;
  return Object.fromEntries(Object.entries(result).sort((a, b) =>
    b[1] - a[1] || a[0].localeCompare(b[0])));
}

async function sha256(path) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}

export async function compareSites({
  baseline, candidate, staticSource,
} = {}) {
  if (!baseline || !candidate || !staticSource) throw new Error("All site directories are required");
  for (const dir of [baseline, candidate, staticSource]) {
    if (!existsSync(join(dir, "index.html")) && dir !== staticSource)
      throw new Error("Missing built site root index.html: " + dir);
    if (!existsSync(dir)) throw new Error("Missing directory: " + dir);
  }

  const baselineFiles = walk(baseline).sort();
  const candidateFiles = walk(candidate).sort();
  const staticFiles = walk(staticSource).sort();
  const bset = new Set(baselineFiles);
  const cset = new Set(candidateFiles);

  const isHtml = (f) => f.endsWith(".html");
  const baselineHtml = baselineFiles.filter(isHtml);
  const candidateHtml = candidateFiles.filter(isHtml);
  const missingHtml = baselineHtml.filter((f) => !cset.has(f));
  const additionalHtml = candidateHtml.filter((f) => !bset.has(f));
  const missingOther = baselineFiles.filter((f) => !isHtml(f) && !cset.has(f));

  // Keep generator output as the authority, but classify every collision
  // against canonical source assets instead of silently treating it as OK.
  const staticMissing = [];
  const staticDifferent = [];
  let staticVerified = 0;
  for (const file of staticFiles) {
    if (!cset.has(file)) {
      staticMissing.push(file);
      continue;
    }
    const [referenceHash, candidateHash] = await Promise.all([
      sha256(join(staticSource, file)),
      sha256(join(candidate, file)),
    ]);
    if (referenceHash === candidateHash) staticVerified++;
    else staticDifferent.push(file);
  }

  const report = {
    schema: "ssg-zola-comparison-v1",
    baseline: "Zola full production-equivalent artifact",
    candidate: "SSG experimental artifact",
    baseline_files: baselineFiles.length,
    candidate_files: candidateFiles.length,
    baseline_html_pages: baselineHtml.length,
    candidate_html_pages: candidateHtml.length,
    shared_html_paths: baselineHtml.length - missingHtml.length,
    html_path_coverage_percent: baselineHtml.length
      ? Math.round(10000 * (baselineHtml.length - missingHtml.length) / baselineHtml.length) / 100
      : 0,
    missing_html: missingHtml.map(publicRoute),
    missing_html_by_family: groupByFamily(missingHtml),
    additional_html: additionalHtml.map(publicRoute),
    missing_other_baseline_files: missingOther,
    missing_other_by_family: groupByFamily(missingOther),
    canonical_static_assets: staticFiles.length,
    unchanged_static_assets: staticVerified,
    missing_static_assets: staticMissing,
    different_static_assets: staticDifferent,
    full_path_parity: missingHtml.length === 0 && missingOther.length === 0 &&
      staticMissing.length === 0 && staticDifferent.length === 0,
    functional_parity_verified: false,
    public_cutover_allowed: false,
    caveat: "Matching paths and assets is necessary, not sufficient: templates, feeds, interactive behavior, CSP, a11y and visual parity need separate browser checks.",
  };
  return report;
}

export function compactSummary(report) {
  return {
    baseline_html_pages: report.baseline_html_pages,
    candidate_html_pages: report.candidate_html_pages,
    shared_html_paths: report.shared_html_paths,
    html_path_coverage_percent: report.html_path_coverage_percent,
    missing_html_count: report.missing_html.length,
    missing_html_by_family: report.missing_html_by_family,
    missing_non_html_count: report.missing_other_baseline_files.length,
    canonical_static_assets: report.canonical_static_assets,
    unchanged_static_assets: report.unchanged_static_assets,
    missing_static_assets: report.missing_static_assets.length,
    changed_static_assets: report.different_static_assets,
    cutover_allowed: report.public_cutover_allowed,
  };
}

async function main(args) {
  const root = process.cwd();
  const baseline = resolve(args[0] ?? "dist-zola");
  const candidate = resolve(args[1] ?? "dist-ssg");
  const staticSource = resolve(args[2] ?? "public");
  const out = resolve(args[3] ?? ".cache/ssg-native/full-parity.json");
  const report = await compareSites({ baseline, candidate, staticSource });
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(compactSummary(report), null, 2));
  // Migration is incomplete by design. This command records evidence without
  // making all other candidate checks fail until the eventual cutover gate.
  if (process.env.SSG_REQUIRE_FULL_PARITY === "1" && !report.full_path_parity)
    process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
