#!/usr/bin/env node

import process from "node:process";
import { spawnSync } from "node:child_process";

import {
  AudiobookValidationError,
  validateWork,
} from "../../src/audiobook/validate.js";

function usage() {
  console.error(
    "Usage: node scripts/audiobook/validate.mjs --work <work_id> [--chapter <chapter_id>] [--require-ready-for-audio] [--json]"
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
    else if (arg === "--require-ready-for-audio")
      args.requireReadyForAudio = true;
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

function validateOkf(args) {
  const command = [
    "run",
    "scripts/audiobook/validate-okf.py",
    "--work",
    args.workId,
    "--json",
  ];
  if (args.chapterId) command.push("--chapter", args.chapterId);

  const result = spawnSync("uv", command, {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  if (result.error) {
    throw new Error(
      `OKF validation could not start: ${result.error.message}. Install uv; audiobook validation fails closed without okf-parser.`
    );
  }

  let report;
  try {
    report = JSON.parse(result.stdout || "{}");
  } catch {
    throw new Error(
      `OKF validator returned unreadable output: ${(result.stdout || result.stderr).trim()}`
    );
  }

  if (result.status !== 0 || report.valid !== true) {
    const details = Array.isArray(report.errors) ? report.errors : [];
    throw new AudiobookValidationError(
      `Invalid audiobook OKF contract: ${args.workId}`,
      details.length ? details : [result.stderr.trim() || "okf-parser validation failed"]
    );
  }

  return report;
}

try {
  const args = parseArgs(process.argv.slice(2));
  const okf = validateOkf(args);
  const result = validateWork(process.cwd(), args.workId, args);
  const output = { ...result, okf };

  if (args.json) {
    console.log(JSON.stringify(output, null, 2));
  } else {
    console.log(`work: ${result.workId} — ${result.title}`);
    console.log(`okf: valid (${okf.canonical_segments_checked} canonical segments checked)`);
    console.log(`status: ${result.status ?? "unknown"}`);
    console.log(`next: ${result.nextAction}`);
    for (const chapter of result.chapters) {
      console.log(
        `${chapter.chapterId}: ${chapter.readyForAudio ? "ready_for_audio" : (chapter.status ?? "not_ready")}`
      );
      if (chapter.pendingGates.length) {
        console.log(`  pending: ${chapter.pendingGates.join(", ")}`);
      }
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
