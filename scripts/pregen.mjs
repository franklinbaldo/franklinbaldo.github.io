// Shared pregeneration chain for `prebuild` and `predev`.
//
// Both hooks used to repeat the exact same `&&`-chained shell command in
// package.json. This runs the same steps, in the same order, from a single
// place: copy KaTeX assets, recompute the Hrönir version selection, then
// regenerate the translation-pairs and legacy-redirect JSON files that
// astro.config.mjs and the content layer read at build time.
//
// Failure semantics match the old `&&` chain: the first step that exits
// non-zero stops the run immediately with that same exit code, so later
// steps never run against a bad intermediate state.
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const steps = [
  ["scripts/copy-katex.mjs"],
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
