#!/usr/bin/env node

import process from "node:process";

import { AudiobookValidationError, validateWork } from "../../src/audiobook/validate.js";

function usage() {
  console.error(
    "Usage: node scripts/audiobook/validate.mjs --work <work_id> [--chapter <chapter_id>] [--require-ready-for-audio] [--json]",
  );
}

function parseArgs(argv) {
  const args = {
    workId: null,
    chapterId: null,
    requireReadyForAudio: false,
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--work") args.workId = argv[++index] ?? null;
    else if (arg === "--chapter") args.chapterId = argv[++index] ?? null;
    else if (arg === "--require-ready-for-audio") args.requireReadyForAudio = true;
    else if (arg === "--json") args.json = true;
    else if (arg === "--help" || arg === "-h") {
      usage();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!args.workId) throw new Error("--work is required");
  return args;
}

try {
  const args = parseArgs(process.argv.slice(2));
  const result = validateWork(process.cwd(), args.workId, args);

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`work: ${result.workId} — ${result.title}`);
    console.log(`status: ${result.status ?? "unknown"}`);
    console.log(`next: ${result.nextAction}`);
    for (const chapter of result.chapters) {
      console.log(
        `${chapter.chapterId}: ${chapter.readyForAudio ? "ready_for_audio" : chapter.status ?? "not_ready"}`,
      );
      if (chapter.pendingGates.length) console.log(`  pending: ${chapter.pendingGates.join(", ")}`);
      if (chapter.nextAction) console.log(`  next: ${chapter.nextAction}`);
    }
  }
} catch (error) {
  if (error instanceof AudiobookValidationError) {
    console.error(error.message);
    for (const detail of error.details) console.error(`- ${detail}`);
    process.exit(2);
  }

  console.error(error instanceof Error ? error.message : String(error));
  usage();
  process.exit(2);
}
