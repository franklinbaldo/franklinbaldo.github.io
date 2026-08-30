import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

for (const script of [
  "scripts/audiobook/runners/local.sh",
  "scripts/audiobook/runners/colab.sh",
  "scripts/audiobook/runners/kaggle.sh",
]) {
  test(`shell syntax: ${script}`, () => {
    const result = spawnSync("bash", ["-n", script], { cwd: process.cwd(), encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
  });
}
