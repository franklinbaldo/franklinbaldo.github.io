import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
const zola = process.env.ZOLA_BIN || "zola";
const expectedVersion = "zola 0.23.6";
const version = spawnSync(zola, ["--version"], { encoding: "utf8" });
if (
  version.error ||
  version.status !== 0 ||
  version.stdout.trim() !== expectedVersion
)
  throw new Error(
    `Expected official ${expectedVersion}; install the pinned release or set ZOLA_BIN. Found: ${version.error?.message ?? (version.stdout + version.stderr).trim()}`
  );
function run(bin, args) {
  const r = spawnSync(bin, args, {
    stdio: "inherit",
    env: { ...process.env, ASTRO_TELEMETRY_DISABLED: "1" },
  });
  if (r.error) throw r.error;
  if (r.status !== 0) process.exit(r.status ?? 1);
}
run(process.execPath, ["scripts/pregen.mjs"]);
run(process.execPath, ["--import", "tsx/esm", "scripts/zola/prepare.mjs"]);
run(process.execPath, ["--import", "tsx/esm", "scripts/zola/audio.mjs"]);
run(process.execPath, ["--import", "tsx/esm", "scripts/zola/music.mjs"]);
run(process.execPath, ["--import", "tsx/esm", "scripts/zola/static-pages.mjs"]);
run(process.execPath, ["--import", "tsx/esm", "scripts/zola/rankings.mjs"]);
run(process.execPath, [
  "--import",
  "tsx/esm",
  "scripts/zola/interactive-apps.mjs",
]);
run(process.execPath, [
  "--import",
  "tsx/esm",
  "scripts/zola/science-pages.mjs",
]);
run(process.execPath, ["scripts/zola/enhancements.mjs"]);
run(process.execPath, ["--import", "tsx/esm", "scripts/zola/books.mjs"]);
run(zola, [
  "--root",
  ".cache/zola-site",
  "build",
  "--force",
  "--output-dir",
  resolve("dist-zola"),
]);
run(process.execPath, ["scripts/zola/finish.mjs"]);
run(process.execPath, ["scripts/zola/webmentions.mjs"]);
run(process.execPath, ["--import", "tsx/esm", "scripts/zola/og.mjs"]);
run(process.execPath, [
  "node_modules/pagefind/lib/runner/bin.cjs",
  "--site",
  "dist-zola",
]);

// Preserve the original post-build payload budget and ranking movement snapshot.
run(process.execPath, ["scripts/check-player-payload.mjs", "dist-zola"]);
run(process.execPath, [
  "--import",
  "tsx/esm",
  "scripts/generate-ranking-snapshot.mjs",
]);
run(process.execPath, ["scripts/zola/artifact-check.mjs"]);
