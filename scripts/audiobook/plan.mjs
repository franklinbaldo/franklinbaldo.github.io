#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { createPlan, createWorkPlan } from "../../src/audiobook/plan.js";

function usage() {
  console.error(
    "Usage: node scripts/audiobook/plan.mjs (--work <work_id> --chapter <chapter_id> | --narration <file.md> --voices <voices.yaml>) [--output <plan.json>]"
  );
}

function parseArgs(argv) {
  const args = {
    workId: null,
    chapterId: null,
    narrationPath: null,
    voicesPath: null,
    outputPath: null,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--work") args.workId = argv[++index] ?? null;
    else if (arg === "--chapter") args.chapterId = argv[++index] ?? null;
    else if (arg === "--narration") args.narrationPath = argv[++index] ?? null;
    else if (arg === "--voices") args.voicesPath = argv[++index] ?? null;
    else if (arg === "--output") args.outputPath = argv[++index] ?? null;
    else if (arg === "--help" || arg === "-h") {
      usage();
      process.exit(0);
    } else throw new Error(`Unknown argument: ${arg}`);
  }

  const byWork = args.workId && args.chapterId;
  const byFiles = args.narrationPath && args.voicesPath;
  if (!byWork && !byFiles)
    throw new Error("provide --work/--chapter or --narration/--voices");
  if (byWork && byFiles)
    throw new Error(
      "choose either work/chapter resolution or explicit file paths"
    );
  return args;
}

try {
  const args = parseArgs(process.argv.slice(2));
  const plan = args.workId
    ? createWorkPlan({
        rootDir: process.cwd(),
        workId: args.workId,
        chapterId: args.chapterId,
      })
    : createPlan(args);
  const json = `${JSON.stringify(plan, null, 2)}\n`;
  if (args.outputPath) {
    fs.mkdirSync(path.dirname(args.outputPath), { recursive: true });
    fs.writeFileSync(args.outputPath, json);
    console.error(
      `wrote ${args.outputPath}: ${plan.segments.length} segment(s)`
    );
  } else {
    process.stdout.write(json);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  if (error?.details)
    for (const detail of error.details) console.error(`- ${detail}`);
  usage();
  process.exit(2);
}
