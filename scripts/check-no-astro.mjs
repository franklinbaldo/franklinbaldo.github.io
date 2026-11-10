// The published Zola build must never silently reintroduce the old engine.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
const paths = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
const errors = [];
for (const p of paths) {
  if (p.endsWith(".astro") || p.startsWith("src/pages/") || p.startsWith("src/components/") || p.startsWith("src/layouts/") || p === "astro.config.mjs" || p === "src/content.config.ts") {
    errors.push("Legacy renderer source is tracked: " + p);
  }
}
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
for (const group of ["dependencies", "devDependencies"]) {
  for (const name of Object.keys(pkg[group] ?? {})) {
    if (name === "astro" || name.startsWith("@astrojs/")) errors.push("Legacy package in " + group + ": " + name);
  }
}
for (const name of Object.keys(pkg.scripts ?? {})) {
  if (name.includes("astro") && name !== "check:no-astro") errors.push("Legacy npm script: " + name);
}
const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
for (const name of Object.keys(lock.packages ?? {})) {
  if (name === "node_modules/astro" || name.startsWith("node_modules/@astrojs/")) errors.push("Legacy dependency remains in lockfile: " + name);
}
const executable = paths.filter((p) => p.startsWith("scripts/zola/") || p.startsWith("scripts/lib/") || p.startsWith("src/lib/") || p.startsWith("src/rug-pull/"));
for (const file of executable.filter((p) => /\.(?:mjs|js|ts)$/.test(p) && existsSync(p))) {
  const content = readFileSync(file, "utf8");
  if (/(?:from\s*|import\s*\(|require\s*\()\s*["'](?:astro(?:\/|:|["'])|@astrojs\/)/m.test(content)) errors.push("Legacy module import: " + file);
  if (/src\/(?:components|pages|layouts)\/[^\s"']+\.astro/m.test(content)) errors.push("Legacy source dependency: " + file);
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log("No Astro runtime, source or dependency remains in the Zola build.");

