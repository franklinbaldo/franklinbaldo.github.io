import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
const zola = process.env.ZOLA_BIN || "zola";
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
run(zola, [
  "--root",
  ".cache/zola-site",
  "build",
  "--force",
  "--output-dir",
  resolve("dist-zola"),
]);
run(process.execPath, ["scripts/zola/finish.mjs"]);
run(process.execPath, ["--import", "tsx/esm", "scripts/zola/og.mjs"]);
run(process.execPath, [
  "node_modules/pagefind/lib/runner/bin.cjs",
  "--site",
  "dist-zola",
]);
