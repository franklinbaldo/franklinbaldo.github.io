import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  AudiobookValidationError,
  validateChapterState,
  validateWork,
} from "./validate.js";

const ALL_TRUE = {
  work_ready: true,
  source_ready: true,
  translation_ready: true,
  narration_ready: true,
  consistency_ready: true,
  editorial_review_ready: true,
  audio_contract_ready: true,
};

function write(root, relativePath, content) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function fixture({ ready = false } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "audiobook-validator-"));
  const gates = ready
    ? ALL_TRUE
    : {
        ...ALL_TRUE,
        source_ready: false,
        translation_ready: false,
        narration_ready: false,
      };

  write(
    root,
    "data/audiobooks/example/work.md",
    `---\ntype: Audiobook Work\nwork_id: example\ntitle: Example\nsource_language: en\ntarget_language: pt-BR\nsource_url: https://example.test/\n---\n`,
  );
  write(
    root,
    "data/audiobooks/example/state.yaml",
    `schema: audiobook-work-state-v1\nwork_id: example\nstatus: preparing\nnext_action: continue\nchapters:\n  example-001:\n    status: ${ready ? "ready" : "in_progress"}\n    next_action: continue chapter\n    gates:\n${Object.entries(gates)
      .map(([key, value]) => `      ${key}: ${value}`)
      .join("\n")}\n    ready_for_audio: ${ready}\n`,
  );
  write(
    root,
    "data/audiobooks/example/voices.yaml",
    "schema: audiobook-voices-v1\nwork_id: example\nvoices:\n  narrator:\n    role: narrator\n",
  );
  write(
    root,
    "data/audiobooks/example/pronunciation.yaml",
    "schema: audiobook-pronunciation-v1\nwork_id: example\nentries: []\n",
  );
  return root;
}

test("validates a not-yet-ready work without requiring audio readiness", () => {
  const root = fixture();
  const result = validateWork(root, "example", { chapterId: "example-001" });
  assert.equal(result.chapters[0].readyForAudio, false);
  assert.ok(result.chapters[0].pendingGates.includes("source_ready"));
});

test("blocks TTS gate until every readiness gate is true", () => {
  const root = fixture();
  assert.throws(
    () =>
      validateWork(root, "example", {
        chapterId: "example-001",
        requireReadyForAudio: true,
      }),
    (error) =>
      error instanceof AudiobookValidationError &&
      /not ready for audio/.test(error.details.join(" ")),
  );
});

test("accepts a chapter when every required gate is true", () => {
  const root = fixture({ ready: true });
  const result = validateWork(root, "example", {
    chapterId: "example-001",
    requireReadyForAudio: true,
  });
  assert.equal(result.chapters[0].readyForAudio, true);
});

test("rejects ready_for_audio when it disagrees with gates", () => {
  assert.throws(
    () =>
      validateChapterState("example-001", {
        gates: { ...ALL_TRUE, narration_ready: false },
        ready_for_audio: true,
      }),
    AudiobookValidationError,
  );
});

test("validates the repository HPMOR work state", () => {
  const result = validateWork(process.cwd(), "hpmor", {
    chapterId: "hpmor-001",
  });
  assert.equal(result.workId, "hpmor");
  assert.equal(result.chapters[0].readyForAudio, false);
  assert.equal(
    result.chapters[0].nextAction,
    "import source snapshot and establish stable segment ids",
  );
});
