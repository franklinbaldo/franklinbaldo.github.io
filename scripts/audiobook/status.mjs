#!/usr/bin/env node

import process from "node:process";

import { deriveWorkState } from "../../src/audiobook/status.js";

function parseArgs(argv) {
  const args = { workId: null, chapterId: null, json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--work") args.workId = argv[++index] ?? null;
    else if (arg === "--chapter") args.chapterId = argv[++index] ?? null;
    else if (arg === "--json") args.json = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!args.workId) throw new Error("--work is required");
  return args;
}

try {
  const args = parseArgs(process.argv.slice(2));
  const state = deriveWorkState(process.cwd(), args.workId);
  const chapters = args.chapterId
    ? state.chapters.filter((chapter) => chapter.chapterId === args.chapterId)
    : state.chapters;
  if (args.chapterId && chapters.length === 0) {
    throw new Error(`unknown chapter ${args.chapterId}`);
  }

  const output = { ...state, chapters };
  if (args.json) {
    console.log(JSON.stringify(output, null, 2));
  } else {
    console.log(`work: ${state.workId}`);
    console.log(`status: ${state.status}`);
    console.log(`next: ${state.nextAction}`);
    for (const chapter of chapters) {
      console.log(`${chapter.chapterId}: ${chapter.status}`);
      console.log(`  completed: ${chapter.completedSegments.length}`);
      console.log(`  next: ${chapter.nextSegmentId ?? "none"}`);
      console.log(`  ready_for_audio: ${chapter.ready_for_audio}`);
    }
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(2);
}
