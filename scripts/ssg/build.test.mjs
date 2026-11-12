import assert from "node:assert/strict";
import { test } from "node:test";
import { buildSteps, expectedVersion, SSG_VERSION } from "./build.mjs";

test("SSG build is pinned and rejects an unexpected generator version", () => {
  assert.equal(SSG_VERSION, "0.0.75");
  assert.equal(expectedVersion("ssg 0.0.75\n"), true);
  assert.equal(expectedVersion("ssg 0.0.68"), false);
  assert.equal(expectedVersion("zola 0.23.6"), false);
});

test("SSG projections and validation precede compilation, with integrity gates after", () => {
  const steps = buildSteps("ssg", "node").map(({ command, args }) =>
    command === "node" ? args[0] : command + " " + args[0]);
  assert.deepEqual(steps, [
    "scripts/pregen.mjs",
    "scripts/ssg/check-architecture.mjs",
    "scripts/ssg/prepare.mjs",
    "scripts/ssg/prepare-redirects.mjs",
    "ssg --validate",
    "ssg -f",
    "scripts/ssg/finish.mjs",
    "scripts/ssg/fix-redirect-headers.mjs",
    "scripts/ssg/verify-redirects.mjs",
    "scripts/ssg/verify-projects.mjs",
    "scripts/ssg/verify-archive.mjs",
    "scripts/ssg/parity.mjs",
    "scripts/ssg/quality-summary.mjs",
  ]);
  assert.ok(steps.every((step) => !step.includes("zola") && !step.includes("astro")));
});
