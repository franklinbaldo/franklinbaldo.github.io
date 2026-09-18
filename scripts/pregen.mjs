// Shared pregeneration chain for `prebuild` and `predev`.
//
// Both hooks used to repeat the exact same `&&`-chained shell command in
// package.json. This runs the same steps, in the same order, from a single
// place: copy KaTeX assets, refresh the public GitHub factory snapshot on
// main-branch builds, recompute the Hrönir version selection, then regenerate
// the translation-pairs and legacy-redirect JSON files that astro.config.mjs
// and the content layer read at build time.
//
// Failure semantics match the old `&&` chain for required steps. Repo Factory
// uses the committed public snapshot on pull requests and local development;
// scheduled/repository-dispatch builds of main refresh it before Astro renders
// the site. Ordinary pushes reuse the committed snapshot so a blog/content
// deploy does not spend ~2 minutes polling dozens of unrelated repositories.
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const isMainBuild = process.env.GITHUB_REF_NAME === "main";
const refreshRepoFactory =
  process.env.REFRESH_REPO_FACTORY === "1" ||
  process.env.GITHUB_EVENT_NAME === "schedule" ||
  process.env.GITHUB_EVENT_NAME === "repository_dispatch";

const steps = [
  ["scripts/copy-katex.mjs"],
  ...(isMainBuild && refreshRepoFactory
    ? [["scripts/generate-repo-factory.mjs", "--optional"]]
    : []),
  ["--import", "tsx/esm", "scripts/hronir/index.js", "select"],
  ["scripts/generate-translation-pairs.mjs"],
  ["scripts/generate-redirects.mjs"],
];

for (const args of steps) {
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    stdio: "inherit",
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
