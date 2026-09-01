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
  write(root, "data/audiobooks/example/work.md", `---\ntype: Audiobook Work\nwork_id: example\ntitle: Example\nsource_language: en\ntarget_language: pt-BR\nsource_url: https://example.test/\n---\n`);
  write(root, "data/audiobooks/example/rights.md", `---\ntype: Audiobook Rights Record\nwork_id: example\neditorial_work_allowed: true\npublic_distribution_authorized: false\n---\n`);
  write(root, "data/audiobooks/example/editorial.md", "# Editorial\n");
  write(root, "data/audiobooks/example/voices.yaml", "schema: audiobook-voices-v1\nwork_id: example\nvoices:\n  narrator:\n    role: narrator\n");
  write(root, "data/audiobooks/example/pronunciation.yaml", "schema: audiobook-pronunciation-v1\nwork_id: example\nentries: []\n");

  write(root, "data/audiobooks/example/original/001.md", `---\ntype: Audiobook Source Chapter\nwork_id: example\nchapter_id: example-001\nsource_status: ${ready ? "ready" : "partial"}\n---\n`);
  write(root, "data/audiobooks/example/translation/001.md", `---\ntype: Audiobook Translation Chapter\nwork_id: example\nchapter_id: example-001\ntranslation_status: ${ready ? "ready" : "partial"}\n---\n`);
  write(root, "data/audiobooks/example/narration/001.md", `---\ntype: Audiobook Narration Chapter\nwork_id: example\nchapter_id: example-001\nnarration_status: ${ready ? "ready" : "partial"}\nconsistency_ready: ${ready}\neditorial_review_ready: ${ready}\naudio_contract_ready: ${ready}\n---\n`);
  return root;
}

test("validates a not-yet-ready work without requiring audio readiness", () => {
  const root = fixture();
  const result = validateWork(root, "example", { chapterId: "example-001" });
  assert.equal(result.chapters[0].readyForAudio, false);
  assert.ok(result.chapters[0].pendingGates.includes("source_ready"));
});

test("blocks TTS gate until every derived readiness gate is true", () => {
  const root = fixture();
  assert.throws(
    () => validateWork(root, "example", { chapterId: "example-001", requireReadyForAudio: true }),
    (error) => error instanceof AudiobookValidationError && /not ready for audio/.test(error.details.join(" "))
  );
});

test("accepts a chapter when frontmatter derives every required gate as true", () => {
  const root = fixture({ ready: true });
  const result = validateWork(root, "example", { chapterId: "example-001", requireReadyForAudio: true });
  assert.equal(result.chapters[0].readyForAudio, true);
});

test("rejects ready_for_audio when a supplied derived snapshot disagrees with gates", () => {
  assert.throws(
    () => validateChapterState("example-001", { gates: { ...ALL_TRUE, narration_ready: false }, ready_for_audio: true }),
    AudiobookValidationError
  );
});

test("validates repository HPMOR without state.yaml", () => {
  const result = validateWork(process.cwd(), "hpmor", { chapterId: "hpmor-001" });
  assert.equal(result.workId, "hpmor");
  assert.equal(result.chapters[0].readyForAudio, false);
  assert.equal(result.chapters[0].nextSegmentId, "hpmor-001-s0033");
  assert.equal(fs.existsSync(path.join(process.cwd(), "data/audiobooks/hpmor/state.yaml")), false);
});
