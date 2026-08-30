import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("synthetic pt-BR benchmark compiles into a provider-neutral TTS plan", () => {
  const outputPath = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), "audiobook-benchmark-")),
    "plan.json",
  );
  const result = spawnSync(
    "node",
    [
      "scripts/audiobook/benchmark-plan.mjs",
      "--benchmark",
      "data/audiobook-benchmarks/pt-br-audiobook-v1.yaml",
      "--output",
      outputPath,
    ],
    { cwd: process.cwd(), encoding: "utf8" },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const plan = JSON.parse(fs.readFileSync(outputPath, "utf8"));
  assert.equal(plan.schema, "audiobook-tts-plan-v1");
  assert.equal(plan.benchmark_id, "pt-br-audiobook-v1");
  assert.equal(plan.lang, "pt-BR");
  assert.ok(plan.segments.length >= 10);
  assert.equal(plan.segments[0].voice.locale, "pt-BR");
  assert.match(plan.segments[0].input_digest, /^sha256:[0-9a-f]{64}$/);
  assert.ok(plan.segments.some((segment) => segment.direction.emotion));
  assert.ok(plan.segments.some((segment) => /Harry/.test(segment.text)));
});
