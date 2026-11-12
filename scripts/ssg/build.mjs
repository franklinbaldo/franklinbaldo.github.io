// Reproducible SSG candidate build. It does not publish to GitHub Pages.
// Production remains on Zola until full route, asset and browser parity.
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const SSG_VERSION = "0.0.75";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export function expectedVersion(output) {
  return output.trim() === "ssg " + SSG_VERSION;
}

export function buildSteps(ssgBin = "ssg", nodeBin = process.execPath) {
  const node = (script) => ({ command: nodeBin, args: [script] });
  return [
    node("scripts/pregen.mjs"),
    node("scripts/ssg/check-architecture.mjs"),
    node("scripts/ssg/prepare.mjs"),
    node("scripts/ssg/prepare-redirects.mjs"),
    { command: ssgBin, args: ["--validate", "-c", ".cache/ssg-native/content"] },
    { command: ssgBin, args: ["-f", "ssg/ssg.toml", "-c", ".cache/ssg-native/content",
      "-o", "dist-ssg", "-t", "ssg/templates"] },
    node("scripts/ssg/finish.mjs"),
    node("scripts/ssg/fix-redirect-headers.mjs"),
    node("scripts/ssg/verify-redirects.mjs"),
    node("scripts/ssg/verify-projects.mjs"),
    node("scripts/ssg/verify-archive.mjs"),
    node("scripts/ssg/parity.mjs"),
    node("scripts/ssg/quality-summary.mjs"),
  ];
}

function execute(command, args, stdio = "inherit") {
  const result = spawnSync(command, args, { cwd: ROOT, stdio, encoding: "utf8",
    env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(
    command + " " + args.join(" ") + " failed (exit " + result.status + ")"
  );
  return result;
}

export function build() {
  const ssgBin = process.env.SSG_BIN || "ssg";
  const version = execute(ssgBin, ["--version"], "pipe");
  if (!expectedVersion(version.stdout))
    throw new Error("Expected official ssg " + SSG_VERSION +
      ", got: " + (version.stdout + version.stderr).trim());
  for (const { command, args } of buildSteps(ssgBin)) execute(command, args);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { build(); } catch (error) { console.error(error); process.exitCode = 1; }
}
