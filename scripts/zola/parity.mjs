// A missing route must block cutover; passing this is necessary, not sufficient.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
export function files(root) {
  const out = [];
  for (const item of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, item.name);
    if (item.isDirectory()) out.push(...files(path));
    else out.push(path);
  }
  return out;
}
const baseline = process.argv[2] || "dist";
const candidate = process.argv[3] || "dist-zola";
if (!existsSync(baseline) || !existsSync(candidate))
  throw new Error("Build both baseline Astro and candidate Zola first");
const routes = files(baseline)
  .map((f) => relative(baseline, f))
  .filter(
    (f) =>
      !f.startsWith("_astro/") &&
      !f.startsWith("pagefind/") &&
      /\.(html|xml|json|png)$/.test(f)
  );
const missing = routes.filter((f) => !existsSync(join(candidate, f)));
const changedPublic = files("public")
  .map((f) => relative("public", f))
  .filter(
    (f) =>
      !existsSync(join(candidate, f)) ||
      !readFileSync(join("public", f)).equals(readFileSync(join(candidate, f)))
  );
const report = {
  baseline,
  candidate,
  total_baseline_routes: routes.length,
  missing_routes: missing,
  changed_public_assets: changedPublic,
  ready_for_cutover: missing.length === 0 && changedPublic.length === 0,
  note: "Route/asset coverage only; interactive behavior and rendering require separate checks.",
};
writeFileSync(
  ".cache/zola-parity.json",
  JSON.stringify(report, null, 2) + "\n"
);
console.log(JSON.stringify(report, null, 2));
if (!report.ready_for_cutover) process.exitCode = 1;
