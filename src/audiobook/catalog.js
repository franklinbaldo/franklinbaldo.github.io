import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";
import yaml from "js-yaml";

const WORK_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function readYaml(filePath) {
  return yaml.load(fs.readFileSync(filePath, "utf8")) ?? {};
}

function readWorkFile(filePath) {
  const parsed = matter(fs.readFileSync(filePath, "utf8"));
  return { data: parsed.data, body: parsed.content.trim() };
}

export function audiobookRoot(rootDir = process.cwd()) {
  return path.join(rootDir, "data", "audiobooks");
}

export function listWorkIds(rootDir = process.cwd()) {
  const root = audiobookRoot(rootDir);
  if (!fs.existsSync(root)) return [];
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && WORK_ID_PATTERN.test(entry.name))
    .filter((entry) => fs.existsSync(path.join(root, entry.name, "work.md")))
    .map((entry) => entry.name)
    .sort();
}

export function loadWork(rootDir, workId) {
  if (!WORK_ID_PATTERN.test(workId))
    throw new Error(`Invalid work_id: ${workId}`);

  const workDir = path.join(audiobookRoot(rootDir), workId);
  const work = readWorkFile(path.join(workDir, "work.md"));
  const state = readYaml(path.join(workDir, "state.yaml"));

  if (work.data.type !== "Audiobook Work")
    throw new Error(`${workId}: work.md type must be Audiobook Work`);
  if (work.data.work_id !== workId)
    throw new Error(`${workId}: work.md work_id mismatch`);
  if (state.work_id !== workId)
    throw new Error(`${workId}: state.yaml work_id mismatch`);

  const chapters = Object.entries(state.chapters ?? {})
    .map(([chapterId, chapter]) => ({ chapterId, ...chapter }))
    .sort((a, b) => a.chapterId.localeCompare(b.chapterId));

  return {
    workId,
    workDir,
    metadata: work.data,
    body: work.body,
    state,
    chapters,
  };
}

export function listWorks(rootDir = process.cwd()) {
  return listWorkIds(rootDir).map((workId) => loadWork(rootDir, workId));
}

export function publishedEpisodes(work) {
  return work.chapters
    .filter((chapter) => chapter.publication?.status === "published")
    .map((chapter) => ({
      chapterId: chapter.chapterId,
      title: chapter.publication.title ?? chapter.chapterId,
      description: chapter.publication.description ?? "",
      publishedAt: chapter.publication.published_at,
      durationSeconds: chapter.publication.duration_seconds ?? null,
      enclosure: chapter.publication.enclosure ?? null,
      transcript: chapter.publication.transcript ?? null,
      chapters: chapter.publication.chapters ?? null,
    }))
    .sort(
      (a, b) =>
        new Date(b.publishedAt).valueOf() - new Date(a.publishedAt).valueOf()
    );
}

export { WORK_ID_PATTERN };
