import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";
import yaml from "js-yaml";

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

function digest(value) {
  const serialized =
    typeof value === "string"
      ? value
      : JSON.stringify(canonicalize(value));
  return `sha256:${crypto.createHash("sha256").update(serialized, "utf8").digest("hex")}`;
}

function readYaml(filePath) {
  return yaml.load(fs.readFileSync(filePath, "utf8")) ?? {};
}

function readVoices(filePath) {
  const document = readYaml(filePath);
  return Object.fromEntries(
    Object.entries(document.voices ?? {}).map(([voiceId, voice]) => [
      voiceId,
      {
        ...(document.default_locale && !voice.locale
          ? { locale: document.default_locale }
          : {}),
        ...voice,
      },
    ]),
  );
}

export function resolveChapterFiles(rootDir, workId, chapterId) {
  const workDir = path.join(rootDir, "data", "audiobooks", workId);
  const state = readYaml(path.join(workDir, "state.yaml"));
  if (state.work_id !== workId) {
    throw new Error(`state.work_id does not match ${workId}`);
  }
  const chapter = state.chapters?.[chapterId];
  if (!chapter) throw new Error(`unknown chapter ${chapterId} for work ${workId}`);
  if (!chapter.files?.narration) {
    throw new Error(`${chapterId}.files.narration is required`);
  }

  return {
    workDir,
    narrationPath: path.join(workDir, chapter.files.narration),
    voicesPath: path.join(workDir, "voices.yaml"),
    chapterState: chapter,
  };
}

export function parseNarrationText(
  markdown,
  { voices = null, sourcePath = null } = {},
) {
  const parsed = matter(markdown);
  const frontmatter = parsed.data;
  const errors = [];

  if (frontmatter.type !== "Audiobook Narration Chapter") {
    errors.push(
      `type must be Audiobook Narration Chapter, got ${JSON.stringify(frontmatter.type)}`,
    );
  }
  for (const field of ["work_id", "chapter_id", "lang", "derived_from"]) {
    if (!frontmatter[field]) {
      errors.push(`${field} is required in narration frontmatter`);
    }
  }

  const segments = [];
  const seen = new Set();
  const pattern =
    /<!--\s*tts:\s*(\{[^\n]*\})\s*-->\s*([\s\S]*?)(?=<!--\s*tts:|$)/g;
  let match;
  while ((match = pattern.exec(parsed.content)) !== null) {
    let directive;
    try {
      directive = JSON.parse(match[1]);
    } catch (error) {
      errors.push(
        `invalid tts directive JSON near offset ${match.index}: ${error.message}`,
      );
      continue;
    }

    const segmentId = directive.id ?? directive.segment_id;
    const speaker = directive.speaker;
    const text = match[2].trim();
    const voice = voices && speaker ? voices[speaker] : null;

    if (!segmentId) {
      errors.push(`tts directive near offset ${match.index} is missing id`);
    }
    if (!speaker) errors.push(`${segmentId ?? "segment"} is missing speaker`);
    if (!text) errors.push(`${segmentId ?? "segment"} has empty narration text`);
    if (segmentId && seen.has(segmentId)) {
      errors.push(`duplicate segment id: ${segmentId}`);
    }
    if (segmentId) seen.add(segmentId);
    if (voices && speaker && !voice) {
      errors.push(`${segmentId ?? "segment"} references unknown speaker: ${speaker}`);
    }

    const direction = Object.fromEntries(
      Object.entries(directive).filter(
        ([key]) => !["id", "segment_id", "speaker"].includes(key),
      ),
    );

    if (segmentId && speaker && text && (!voices || voice)) {
      const request = {
        segment_id: segmentId,
        speaker,
        voice: canonicalize(voice ?? {}),
        text,
        direction,
      };
      segments.push({ ...request, input_digest: digest(request) });
    }
  }

  if (segments.length === 0) {
    errors.push("narration contains no <!-- tts: {...} --> segments");
  }

  if (errors.length) {
    const error = new Error(
      `Invalid narration${sourcePath ? ` ${sourcePath}` : ""}`,
    );
    error.details = errors;
    throw error;
  }

  return {
    schema: "audiobook-tts-plan-v1",
    work_id: frontmatter.work_id,
    chapter_id: frontmatter.chapter_id,
    lang: frontmatter.lang,
    narration_source: sourcePath,
    narration_digest: digest(markdown),
    segments,
  };
}

export function createPlan({ narrationPath, voicesPath }) {
  const narration = fs.readFileSync(narrationPath, "utf8");
  const voices = readVoices(voicesPath);
  return parseNarrationText(narration, { voices, sourcePath: narrationPath });
}

export function createWorkPlan({ rootDir, workId, chapterId }) {
  const resolved = resolveChapterFiles(rootDir, workId, chapterId);
  const plan = createPlan(resolved);
  if (plan.work_id !== workId) {
    throw new Error(
      `narration work_id ${plan.work_id} does not match requested work ${workId}`,
    );
  }
  if (plan.chapter_id !== chapterId) {
    throw new Error(
      `narration chapter_id ${plan.chapter_id} does not match requested chapter ${chapterId}`,
    );
  }
  return plan;
}

export { canonicalize, digest };
