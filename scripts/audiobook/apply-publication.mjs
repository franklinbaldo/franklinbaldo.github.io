#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import matter from "gray-matter";
import yaml from "js-yaml";

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

function updateWorkPodcast(workPath) {
  const parsed = matter(fs.readFileSync(workPath, "utf8"));
  if (!parsed.data.podcast) throw new Error("work.md must declare podcast metadata before publication");
  if (parsed.data.podcast.enabled === true) return false;

  parsed.data.podcast.enabled = true;
  const frontmatter = yamlText(parsed.data).trimEnd();
  const body = parsed.content.startsWith("\n") ? parsed.content : `\n${parsed.content}`;
  fs.writeFileSync(workPath, `---\n${frontmatter}\n---${body}`);
  return true;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const workDir = path.join(process.cwd(), "data", "audiobooks", args.workId);
  const statePath = path.join(workDir, "state.yaml");
  const workPath = path.join(workDir, "work.md");
  const state = yaml.load(fs.readFileSync(statePath, "utf8")) ?? {};
  const publication = JSON.parse(fs.readFileSync(args.publicationPath, "utf8"));

  if (state.work_id !== args.workId) throw new Error("state work_id mismatch");
  if (publication.work_id !== args.workId || publication.chapter_id !== args.chapterId) {
    throw new Error("publication identity mismatch");
  }
  if (publication.dry_run) throw new Error("refusing to apply dry-run publication");

  const chapter = state.chapters?.[args.chapterId];
  if (!chapter) throw new Error(`unknown chapter ${args.chapterId}`);
  if (chapter.ready_for_audio !== true) throw new Error(`${args.chapterId} is not ready_for_audio`);
  if (!publication.enclosure?.url || !publication.enclosure?.bytes || !publication.enclosure?.type) {
    throw new Error("publication is missing a complete enclosure");
  }
  if (!publication.verification) throw new Error("publication enclosure was not verified");

  chapter.status = "published";
  chapter.publication = {
    ...(chapter.publication ?? {}),
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
  chapter.next_action = "published; regenerate only if editorial or TTS inputs change";

  const pending = Object.entries(state.chapters)
    .filter(([, value]) => value.publication?.status !== "published")
    .map(([chapterId]) => chapterId);
  state.status = pending.length ? "in_progress" : "published";
  state.next_action = pending.length ? `continue editorial work on ${pending[0]}` : "all registered chapters published";

  fs.writeFileSync(statePath, yamlText(state));
  const podcastChanged = updateWorkPodcast(workPath);

  console.log(
    JSON.stringify({
      work_id: args.workId,
      chapter_id: args.chapterId,
      state_path: path.relative(process.cwd(), statePath),
      podcast_enabled: podcastChanged ? "enabled_now" : "already_enabled",
    }),
  );
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(2);
}
