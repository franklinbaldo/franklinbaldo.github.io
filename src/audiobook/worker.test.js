import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

function makePlan(root) {
  const planPath = path.join(root, "plan.json");
  fs.writeFileSync(
    planPath,
    `${JSON.stringify(
      {
        schema: "audiobook-tts-plan-v1",
        work_id: "example",
        chapter_id: "example-001",
        lang: "pt-BR",
        narration_digest: "sha256:test",
        segments: [
          {
            segment_id: "example-001-s0001",
            speaker: "narrator",
            voice: { role: "narrator", locale: "pt-BR" },
            text: "Teste.",
            direction: {},
            input_digest: "sha256:1111111111111111111111111111111111111111111111111111111111111111",
          },
          {
            segment_id: "example-001-s0002",
            speaker: "alice",
            voice: { role: "character", locale: "pt-BR" },
            text: "Outro teste.",
            direction: { emotion: "curious" },
            input_digest: "sha256:2222222222222222222222222222222222222222222222222222222222222222",
          },
        ],
      },
      null,
      2,
    )}\n`,
  );
  return planPath;
}

test("fake worker emits deterministic segment audio, manifest and archive", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "audiobook-worker-"));
  const planPath = makePlan(root);
  const outputDir = path.join(root, "output");
  const archivePath = path.join(root, "result.zip");

  const result = spawnSync(
    "python3",
    [
      "scripts/audiobook/worker.py",
      "--plan",
      planPath,
      "--output-dir",
      outputDir,
      "--backend",
      "fake",
      "--result-archive",
      archivePath,
    ],
    { cwd: process.cwd(), encoding: "utf8" },
  );

  assert.equal(result.status, 0, result.stderr);
  const manifest = JSON.parse(fs.readFileSync(path.join(outputDir, "manifest.json"), "utf8"));
  assert.equal(manifest.schema, "audiobook-media-manifest-v1");
  assert.equal(manifest.segments.length, 2);
  assert.ok(fs.statSync(path.join(outputDir, manifest.segments[0].audio_file)).size > 0);
  assert.ok(fs.statSync(archivePath).size > 0);
});
