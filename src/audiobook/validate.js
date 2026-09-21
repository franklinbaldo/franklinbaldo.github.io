import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";
import yaml from "js-yaml";

const REQUIRED_GATES = [
  "work_ready",
  "source_ready",
  "translation_ready",
  "narration_ready",
  "consistency_ready",
  "editorial_review_ready",
  "audio_contract_ready",
];

export class AudiobookValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = "AudiobookValidationError";
    this.details = details;
  }
}

function readUtf8(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (error) {
    throw new AudiobookValidationError(
      `Missing or unreadable file: ${filePath}`,
      [String(error)]
    );
  }
}

function readYaml(filePath) {
  try {
    return yaml.load(readUtf8(filePath)) ?? {};
  } catch (error) {
    if (error instanceof AudiobookValidationError) throw error;
    throw new AudiobookValidationError(`Invalid YAML: ${filePath}`, [
      String(error),
    ]);
  }
}

function readMarkdownFrontmatter(filePath) {
  try {
    return matter(readUtf8(filePath)).data;
  } catch (error) {
    if (error instanceof AudiobookValidationError) throw error;
    throw new AudiobookValidationError(
      `Invalid Markdown frontmatter: ${filePath}`,
      [String(error)]
    );
  }
}

function requireEqual(errors, actual, expected, label) {
  if (actual !== expected) {
    errors.push(
      `${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}

function requireTruthy(errors, value, label) {
  if (!value) errors.push(`${label} is required`);
}

export function validateChapterState(
  chapterId,
  chapterState,
  { requireReadyForAudio = false } = {}
) {
  const errors = [];

  if (!chapterState || typeof chapterState !== "object") {
    throw new AudiobookValidationError(`Chapter ${chapterId} has no state`);
  }

  const gates = chapterState.gates;
  if (!gates || typeof gates !== "object") {
    errors.push(`${chapterId}.gates is required`);
  } else {
    for (const gate of REQUIRED_GATES) {
      if (typeof gates[gate] !== "boolean") {
        errors.push(`${chapterId}.gates.${gate} must be boolean`);
      }
    }
  }

  const allReady =
    Boolean(gates) && REQUIRED_GATES.every((gate) => gates[gate] === true);
  if (typeof chapterState.ready_for_audio !== "boolean") {
    errors.push(`${chapterId}.ready_for_audio must be boolean`);
  } else if (chapterState.ready_for_audio !== allReady) {
    errors.push(
      `${chapterId}.ready_for_audio must equal the conjunction of all required gates (expected ${allReady})`
    );
  }

  if (requireReadyForAudio && !allReady) {
    const pending = REQUIRED_GATES.filter((gate) => gates?.[gate] !== true);
    errors.push(
      `${chapterId} is not ready for audio; pending gates: ${pending.join(", ")}`
    );
  }

  if (errors.length) {
    throw new AudiobookValidationError(
      `Invalid chapter state: ${chapterId}`,
      errors
    );
  }

  return {
    chapterId,
    readyForAudio: allReady,
    pendingGates: REQUIRED_GATES.filter((gate) => gates[gate] !== true),
    status: chapterState.status ?? null,
    nextAction: chapterState.next_action ?? null,
  };
}

export function validateWork(rootDir, workId, options = {}) {
  const workDir = path.join(rootDir, "data", "audiobooks", workId);
  const errors = [];

  const work = readMarkdownFrontmatter(path.join(workDir, "work.md"));
  const state = readYaml(path.join(workDir, "state.yaml"));
  const voices = readYaml(path.join(workDir, "voices.yaml"));
  const pronunciation = readYaml(path.join(workDir, "pronunciation.yaml"));

  requireEqual(errors, work.type, "Audiobook Work", "work.type");
  requireEqual(errors, work.work_id, workId, "work.work_id");
  requireTruthy(errors, work.title, "work.title");
  requireTruthy(errors, work.source_language, "work.source_language");
  requireTruthy(errors, work.target_language, "work.target_language");
  requireTruthy(errors, work.source_url, "work.source_url");

  requireEqual(errors, state.schema, "audiobook-work-state-v1", "state.schema");
  requireEqual(errors, state.work_id, workId, "state.work_id");
  requireTruthy(errors, state.next_action, "state.next_action");
  if (!state.chapters || typeof state.chapters !== "object") {
    errors.push("state.chapters is required");
  }

  requireEqual(errors, voices.schema, "audiobook-voices-v1", "voices.schema");
  requireEqual(errors, voices.work_id, workId, "voices.work_id");
  if (
    !voices.voices ||
    typeof voices.voices !== "object" ||
    Object.keys(voices.voices).length === 0
  ) {
    errors.push("voices.voices must contain at least one logical voice");
  }

  requireEqual(
    errors,
    pronunciation.schema,
    "audiobook-pronunciation-v1",
    "pronunciation.schema"
  );
  requireEqual(errors, pronunciation.work_id, workId, "pronunciation.work_id");
  if (!Array.isArray(pronunciation.entries)) {
    errors.push("pronunciation.entries must be an array");
  }

  if (errors.length) {
    throw new AudiobookValidationError(
      `Invalid audiobook work: ${workId}`,
      errors
    );
  }

  const chapterResults = [];
  const chapterIds = options.chapterId
    ? [options.chapterId]
    : Object.keys(state.chapters);
  for (const chapterId of chapterIds) {
    if (!(chapterId in state.chapters)) {
      throw new AudiobookValidationError(
        `Unknown chapter ${chapterId} for work ${workId}`
      );
    }
    chapterResults.push(
      validateChapterState(chapterId, state.chapters[chapterId], {
        requireReadyForAudio: options.requireReadyForAudio ?? false,
      })
    );
  }

  return {
    workId,
    title: work.title,
    status: state.status ?? null,
    nextAction: state.next_action,
    chapters: chapterResults,
  };
}

export { REQUIRED_GATES };
