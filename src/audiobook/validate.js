import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";
import yaml from "js-yaml";

import { deriveWorkState, REQUIRED_GATES } from "./status.js";

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
    throw new AudiobookValidationError(`Missing or unreadable file: ${filePath}`, [String(error)]);
  }
}

function readYaml(filePath) {
  try {
    return yaml.load(readUtf8(filePath)) ?? {};
  } catch (error) {
    if (error instanceof AudiobookValidationError) throw error;
    throw new AudiobookValidationError(`Invalid YAML: ${filePath}`, [String(error)]);
  }
}

function readMarkdownFrontmatter(filePath) {
  try {
    return matter(readUtf8(filePath)).data;
  } catch (error) {
    if (error instanceof AudiobookValidationError) throw error;
    throw new AudiobookValidationError(`Invalid Markdown frontmatter: ${filePath}`, [String(error)]);
  }
}

function requireEqual(errors, actual, expected, label) {
  if (actual !== expected) {
    errors.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function requireTruthy(errors, value, label) {
  if (!value) errors.push(`${label} is required`);
}

export function validateChapterState(chapterId, chapterState, { requireReadyForAudio = false } = {}) {
  const errors = [];
  if (!chapterState || typeof chapterState !== "object") {
    throw new AudiobookValidationError(`Chapter ${chapterId} has no derived state`);
  }

  for (const gate of REQUIRED_GATES) {
    if (typeof chapterState.gates?.[gate] !== "boolean") {
      errors.push(`${chapterId}.gates.${gate} must be derived as boolean`);
    }
  }

  const allReady = REQUIRED_GATES.every((gate) => chapterState.gates?.[gate] === true);
  if (chapterState.ready_for_audio !== allReady) {
    errors.push(`${chapterId}.ready_for_audio must equal the conjunction of all derived gates (expected ${allReady})`);
  }
  if (requireReadyForAudio && !allReady) {
    const pending = REQUIRED_GATES.filter((gate) => chapterState.gates?.[gate] !== true);
    errors.push(`${chapterId} is not ready for audio; pending gates: ${pending.join(", ")}`);
  }

  if (errors.length) {
    throw new AudiobookValidationError(`Invalid derived chapter state: ${chapterId}`, errors);
  }

  return {
    chapterId,
    readyForAudio: allReady,
    pendingGates: REQUIRED_GATES.filter((gate) => chapterState.gates[gate] !== true),
    status: chapterState.status,
    nextAction: chapterState.nextAction,
    nextSegmentId: chapterState.nextSegmentId,
    completedSegments: chapterState.completedSegments,
  };
}

export function validateWork(rootDir, workId, options = {}) {
  const workDir = path.join(rootDir, "data", "audiobooks", workId);
  const errors = [];
  const work = readMarkdownFrontmatter(path.join(workDir, "work.md"));
  const rights = readMarkdownFrontmatter(path.join(workDir, "rights.md"));
  const voices = readYaml(path.join(workDir, "voices.yaml"));
  const pronunciation = readYaml(path.join(workDir, "pronunciation.yaml"));
  const derived = deriveWorkState(rootDir, workId);

  requireEqual(errors, work.type, "Audiobook Work", "work.type");
  requireEqual(errors, work.work_id, workId, "work.work_id");
  requireTruthy(errors, work.title, "work.title");
  requireTruthy(errors, work.source_language, "work.source_language");
  requireTruthy(errors, work.target_language, "work.target_language");
  requireTruthy(errors, work.source_url, "work.source_url");

  requireEqual(errors, rights.type, "Audiobook Rights Record", "rights.type");
  requireEqual(errors, rights.work_id, workId, "rights.work_id");
  if (typeof rights.editorial_work_allowed !== "boolean") {
    errors.push("rights.editorial_work_allowed must be boolean");
  }
  if (typeof rights.public_distribution_authorized !== "boolean") {
    errors.push("rights.public_distribution_authorized must be boolean");
  }

  requireEqual(errors, voices.schema, "audiobook-voices-v1", "voices.schema");
  requireEqual(errors, voices.work_id, workId, "voices.work_id");
  if (!voices.voices || typeof voices.voices !== "object" || Object.keys(voices.voices).length === 0) {
    errors.push("voices.voices must contain at least one logical voice");
  }

  requireEqual(errors, pronunciation.schema, "audiobook-pronunciation-v1", "pronunciation.schema");
  requireEqual(errors, pronunciation.work_id, workId, "pronunciation.work_id");
  if (!Array.isArray(pronunciation.entries)) errors.push("pronunciation.entries must be an array");

  if (errors.length) throw new AudiobookValidationError(`Invalid audiobook work: ${workId}`, errors);

  const chapterIds = options.chapterId ? [options.chapterId] : derived.chapters.map((chapter) => chapter.chapterId);
  const chapterResults = chapterIds.map((chapterId) => {
    const chapter = derived.chapters.find((entry) => entry.chapterId === chapterId);
    if (!chapter) throw new AudiobookValidationError(`Unknown chapter ${chapterId} for work ${workId}`);
    return validateChapterState(chapterId, chapter, { requireReadyForAudio: options.requireReadyForAudio ?? false });
  });

  return {
    workId,
    title: work.title,
    status: derived.status,
    nextAction: derived.nextAction,
    publicDistributionAuthorized: derived.publication.public_distribution_authorized,
    chapters: chapterResults,
  };
}

export { REQUIRED_GATES };
