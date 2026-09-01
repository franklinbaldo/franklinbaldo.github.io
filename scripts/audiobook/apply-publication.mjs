#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import matter from "gray-matter";
import yaml from "js-yaml";

import { deriveWorkState } from "../../src/audiobook/status.js";

function parseArgs(argv) {
  const args = { workId: null, chapterId: null, publicationPath: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--work") args.workId = argv[++index] ?? null;
    else if (arg === "--chapter") args.chapterId = argv[++index] ?? null;
    else if (arg === "--publication") args.publicationPath = argv[++index] ?? null;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!args.workId || !args.chapterId || !args.publicationPath) {
    throw new Error("--work, --chapter and --publication are required");
  }
  return args;
}

function yamlText(value) {
  return yaml.dump(value, { noRefs: true, lineWidth: -1, sortKeys: false, quotingType: '"' });
}

function rewriteFrontmatter(filePath, mutate) {
  const parsed = matter(fs.readFileSync(filePath, "utf8"));
  mutate(parsed.data);
  const frontmatter = yamlText(parsed.data).trimEnd();
  const body = parsed.content.startsWith("\n") ? parsed.content : `\n${parsed.content}`;
  fs.writeFileSync(filePath, `---\n${frontmatter}\n---${body}`);
}

function updateWorkPodcast(workPath) {
  let changed = false;
  rewriteFrontmatter(workPath, (data) => {
    if (!data.podcast) throw new Error("work.md must declare podcast metadata before publication");
    if (data.podcast.enabled !== true) {
      data.podcast.enabled = true;
      changed = true;
    }
  });
  return changed;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const workDir = path.join(process.cwd(), "data", "audiobooks", args.workId);
  const workPath = path.join(workDir, "work.md");
  const publication = JSON.parse(fs.readFileSync(args.publicationPath, "utf8"));
  const state = deriveWorkState(process.cwd(), args.workId);

  if (state.publication.public_distribution_authorized !== true) {
    throw new Error("public distribution is not authorized in rights.md frontmatter; refusing to persist a public episode");
  }
  if (publication.work_id !== args.workId || publication.chapter_id !== args.chapterId) {
    throw new Error("publication identity mismatch");
  }
  if (publication.dry_run) throw new Error("refusing to apply dry-run publication");

  const chapter = state.chapters.find((entry) => entry.chapterId === args.chapterId);
  if (!chapter) throw new Error(`unknown chapter ${args.chapterId}`);
  if (chapter.ready_for_audio !== true) throw new Error(`${args.chapterId} is not ready_for_audio`);
  if (!chapter.files.narration) throw new Error(`${args.chapterId} has no narration chapter document`);
  if (!publication.enclosure?.url || !publication.enclosure?.bytes || !publication.enclosure?.type) {
    throw new Error("publication is missing a complete enclosure");
  }
  if (!publication.verification) throw new Error("publication enclosure was not verified");
  if (!publication.transcript?.verification) throw new Error("publication transcript was not verified");

  const narrationPath = path.join(workDir, chapter.files.narration);
  rewriteFrontmatter(narrationPath, (data) => {
    data.publication = {
      ...(data.publication ?? {}),
      status: "published",
      title: publication.title,
      description: publication.description,
      published_at: publication.published_at,
      duration_seconds: publication.duration_seconds,
      audio_digest: publication.audio_digest,
      enclosure: publication.enclosure,
      transcript: publication.transcript,
      archive_item: publication.archive_item,
    };
  });

  const podcastChanged = updateWorkPodcast(workPath);
  console.log(JSON.stringify({
    work_id: args.workId,
    chapter_id: args.chapterId,
    chapter_document: path.relative(process.cwd(), narrationPath),
    podcast_enabled: podcastChanged ? "enabled_now" : "already_enabled",
  }));
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(2);
}
