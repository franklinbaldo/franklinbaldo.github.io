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
            input_digest:
              "sha256:1111111111111111111111111111111111111111111111111111111111111111",
          },
          {
            segment_id: "example-001-s0002",
            speaker: "alice",
            voice: { role: "character", locale: "pt-BR" },
            text: "Outro teste.",
            direction: { emotion: "curious" },
            input_digest:
              "sha256:2222222222222222222222222222222222222222222222222222222222222222",
          },
        ],
      },
      null,
      2
    )}\n`
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
    { cwd: process.cwd(), encoding: "utf8" }
  );

  assert.equal(result.status, 0, result.stderr);
  const manifest = JSON.parse(
    fs.readFileSync(path.join(outputDir, "manifest.json"), "utf8")
  );
  assert.equal(manifest.schema, "audiobook-media-manifest-v1");
  assert.equal(manifest.segments.length, 2);
  assert.equal(typeof manifest.timings.bootstrap_ms, "number");
  assert.equal(
    manifest.timings.audio_ms,
    manifest.segments.reduce((total, s) => total + s.duration_ms, 0)
  );
  assert.ok(manifest.segments.every((s) => typeof s.synthesis_ms === "number"));
  assert.ok(
    fs.statSync(path.join(outputDir, manifest.segments[0].audio_file)).size > 0
  );
  assert.ok(fs.statSync(archivePath).size > 0);
});

test("breeze checkpoint overlay rewrites only the top-level config", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "audiobook-overlay-"));
  const snapshot = path.join(root, "snapshot");
  fs.mkdirSync(path.join(snapshot, "audio_tokenizer"), { recursive: true });
  fs.writeFileSync(
    path.join(snapshot, "config.json"),
    JSON.stringify({
      text_encoder_config: {
        preferred_attn_implementation: "flash_attention_2",
      },
    })
  );
  fs.writeFileSync(
    path.join(snapshot, "audio_tokenizer", "config.json"),
    JSON.stringify({ model_type: "qwen3_tts_tokenizer_25hz" })
  );
  fs.writeFileSync(path.join(snapshot, "model.safetensors"), "weights");

  const result = spawnSync(
    "python3",
    [
      "-c",
      [
        "import json, pathlib, sys",
        "sys.path.insert(0, 'scripts/audiobook')",
        "import importlib.util",
        "spec = importlib.util.spec_from_file_location('worker', 'scripts/audiobook/worker.py')",
        "worker = importlib.util.module_from_spec(spec)",
        "spec.loader.exec_module(worker)",
        "out, attn = worker.prepare_breeze_checkpoint(pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2]))",
        "print(json.dumps({'dir': str(out), 'attn': attn}))",
      ].join("\n"),
      snapshot,
      path.join(root, "cache"),
    ],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: { ...process.env, BREEZE_TEXT_ENCODER_ATTENTION: "eager" },
    }
  );

  assert.equal(result.status, 0, result.stderr);
  const { dir, attn } = JSON.parse(result.stdout.trim().split("\n").pop());
  assert.equal(attn, "eager");
  assert.notEqual(dir, snapshot);

  const config = JSON.parse(
    fs.readFileSync(path.join(dir, "config.json"), "utf8")
  );
  assert.equal(
    config.text_encoder_config.preferred_attn_implementation,
    "eager"
  );
  // Every other file, including the nested audio tokenizer config, must survive.
  assert.equal(
    fs.readFileSync(path.join(dir, "audio_tokenizer", "config.json"), "utf8"),
    fs.readFileSync(
      path.join(snapshot, "audio_tokenizer", "config.json"),
      "utf8"
    )
  );
  assert.equal(
    fs.readFileSync(path.join(dir, "model.safetensors"), "utf8"),
    "weights"
  );
});
