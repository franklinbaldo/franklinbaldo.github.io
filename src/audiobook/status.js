import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

const LAYERS = ["original", "translation", "narration"];
const REQUIRED_GATES = [
  "work_ready",
  "source_ready",
  "translation_ready",
  "narration_ready",
  "consistency_ready",
  "editorial_review_ready",
  "audio_contract_ready",
];

function readMarkdown(filePath) {
  const parsed = matter(fs.readFileSync(filePath, "utf8"));
  return { data: parsed.data, body: parsed.content };
}

function markdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => path.join(dir, entry.name))
    .sort();
}

function segmentIdsFromAggregate(layer, body) {
  const ids = new Set();
  if (layer === "narration") {
    const pattern = /<!--\s*tts:\s*({[^\n]*})\s*-->/g;
    let match;
    while ((match = pattern.exec(body)) !== null) {
      try {
        const directive = JSON.parse(match[1]);
        const id = directive.id ?? directive.segment_id;
        if (id) ids.add(id);
      } catch {
        // Validation reports malformed directives elsewhere. Status derivation
        // only counts directives that are structurally readable.
      }
    }
    return ids;
  }

  const pattern = /<!--\s*segment:\s*([a-z0-9-]+)\s*-->/g;
  let match;
  while ((match = pattern.exec(body)) !== null) ids.add(match[1]);
  return ids;
}

function loadLayer(workDir, layer) {
  const layerDir = path.join(workDir, layer);
  const chapters = new Map();

  for (const filePath of markdownFiles(layerDir)) {
    const document = readMarkdown(filePath);
    const chapterId = document.data.chapter_id;
    if (!chapterId) continue;
    chapters.set(chapterId, {
      filePath,
      frontmatter: document.data,
      segmentIds: segmentIdsFromAggregate(layer, document.body),
    });
  }

  const shardDir = path.join(layerDir, "segments");
  for (const filePath of markdownFiles(shardDir)) {
    const document = readMarkdown(filePath);
    const { chapter_id: chapterId, segment_id: segmentId, status } = document.data;
    if (!chapterId || !segmentId) continue;
    if (!chapters.has(chapterId)) {
      chapters.set(chapterId, {
        filePath: null,
        frontmatter: {},
        segmentIds: new Set(),
      });
    }
    if (status === "canonical-editorial-unit" || status === "canonical") {
      chapters.get(chapterId).segmentIds.add(segmentId);
    }
  }

  return chapters;
}

function incrementSegmentId(chapterId, completed) {
  let index = 1;
  while (completed.has(`${chapterId}-s${String(index).padStart(4, "0")}`)) {
    index += 1;
  }
  return `${chapterId}-s${String(index).padStart(4, "0")}`;
}

function statusIsReady(value) {
  return ["ready", "complete", "completed", "canonical"].includes(value);
}

function intersection(sets) {
  if (sets.length === 0) return new Set();
  return new Set([...sets[0]].filter((value) => sets.every((set) => set.has(value))));
}

export function deriveWorkState(rootDir, workId) {
  const workDir = path.join(rootDir, "data", "audiobooks", workId);
  const work = readMarkdown(path.join(workDir, "work.md"));
  const rightsPath = path.join(workDir, "rights.md");
  const rights = fs.existsSync(rightsPath) ? readMarkdown(rightsPath).data : {};
  const layers = Object.fromEntries(LAYERS.map((layer) => [layer, loadLayer(workDir, layer)]));

  const chapterIds = new Set();
  for (const layer of LAYERS) {
    for (const chapterId of layers[layer].keys()) chapterIds.add(chapterId);
  }

  const structuralFiles = ["work.md", "editorial.md", "voices.yaml", "pronunciation.yaml", "rights.md"];
  const workReady =
    structuralFiles.every((name) => fs.existsSync(path.join(workDir, name))) &&
    rights.editorial_work_allowed === true;

  const chapters = [...chapterIds]
    .sort()
    .map((chapterId) => {
      const source = layers.original.get(chapterId) ?? { frontmatter: {}, segmentIds: new Set() };
      const translation = layers.translation.get(chapterId) ?? { frontmatter: {}, segmentIds: new Set() };
      const narration = layers.narration.get(chapterId) ?? { frontmatter: {}, segmentIds: new Set() };
      const completed = intersection([source.segmentIds, translation.segmentIds, narration.segmentIds]);

      const gates = {
        work_ready: workReady,
        source_ready: statusIsReady(source.frontmatter.source_status),
        translation_ready: statusIsReady(translation.frontmatter.translation_status),
        narration_ready: statusIsReady(narration.frontmatter.narration_status),
        consistency_ready: narration.frontmatter.consistency_ready === true,
        editorial_review_ready: narration.frontmatter.editorial_review_ready === true,
        audio_contract_ready: narration.frontmatter.audio_contract_ready === true,
      };
      const readyForAudio = REQUIRED_GATES.every((gate) => gates[gate] === true);
      const publication = narration.frontmatter.publication ?? null;
      const status =
        publication?.status === "published"
          ? "published"
          : readyForAudio
            ? "ready"
            : completed.size > 0
              ? "in_progress"
              : "not_started";
      const nextSegmentId = readyForAudio ? null : incrementSegmentId(chapterId, completed);

      return {
        chapterId,
        status,
        completedSegments: [...completed].sort(),
        nextSegmentId,
        nextAction: readyForAudio
          ? "chapter is ready for audio"
          : `process exactly ${nextSegmentId} through source, translation, and narration`,
        gates,
        ready_for_audio: readyForAudio,
        publication,
        files: {
          original: source.filePath ? path.relative(workDir, source.filePath) : null,
          translation: translation.filePath ? path.relative(workDir, translation.filePath) : null,
          narration: narration.filePath ? path.relative(workDir, narration.filePath) : null,
        },
      };
    });

  const pending = chapters.find((chapter) => chapter.status !== "published");
  const status =
    chapters.length > 0 && chapters.every((chapter) => chapter.status === "published")
      ? "published"
      : chapters.some((chapter) => chapter.completedSegments.length > 0)
        ? "in_progress"
        : work.data.status ?? "preparing";

  return {
    schema: "audiobook-derived-state-v1",
    workId,
    status,
    nextAction: pending?.nextAction ?? "all registered chapters published",
    metadata: work.data,
    rights,
    publication: {
      public_distribution_authorized: rights.public_distribution_authorized === true,
    },
    chapters,
  };
}

export { REQUIRED_GATES };
