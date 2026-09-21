#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import yaml from "js-yaml";

import { canonicalize, digest } from "../../src/audiobook/plan.js";

function usage() {
  console.error(
    "Usage: node scripts/audiobook/benchmark-plan.mjs --benchmark <file.yaml> [--output <plan.json>]"
  );
}

function parseArgs(argv) {
  const args = { benchmarkPath: null, outputPath: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--benchmark") args.benchmarkPath = argv[++index] ?? null;
    else if (arg === "--output") args.outputPath = argv[++index] ?? null;
    else if (arg === "--help" || arg === "-h") {
      usage();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (!args.benchmarkPath) throw new Error("--benchmark is required");
  return args;
}

function createBenchmarkPlan(document, sourcePath) {
  if (document.schema !== "audiobook-tts-benchmark-v1") {
    throw new Error(`unsupported benchmark schema: ${document.schema}`);
  }
  if (!document.benchmark_id || !document.language) {
    throw new Error("benchmark_id and language are required");
  }
  if (!document.voices || typeof document.voices !== "object") {
    throw new Error("benchmark voices are required");
  }
  if (!Array.isArray(document.segments) || document.segments.length === 0) {
    throw new Error("benchmark requires at least one segment");
  }

  const seen = new Set();
  const segments = document.segments.map((segment, index) => {
    if (!segment.id || !segment.speaker || !segment.text) {
      throw new Error(
        `benchmark segment ${index} requires id, speaker and text`
      );
    }
    if (seen.has(segment.id))
      throw new Error(`duplicate benchmark id: ${segment.id}`);
    seen.add(segment.id);
    const voice = document.voices[segment.speaker];
    if (!voice)
      throw new Error(`${segment.id}: unknown speaker ${segment.speaker}`);
    const request = {
      segment_id: `${document.benchmark_id}-${segment.id}`,
      speaker: segment.speaker,
      voice: canonicalize(voice),
      text: segment.text.trim(),
      direction: canonicalize(segment.direction ?? {}),
    };
    return { ...request, input_digest: digest(request) };
  });

  return {
    schema: "audiobook-tts-plan-v1",
    work_id: `benchmark-${document.benchmark_id}`,
    chapter_id: document.benchmark_id,
    lang: document.language,
    benchmark_id: document.benchmark_id,
    benchmark_source: sourcePath,
    narration_digest: digest(document),
    segments,
  };
}

try {
  const args = parseArgs(process.argv.slice(2));
  const source = fs.readFileSync(args.benchmarkPath, "utf8");
  const document = yaml.load(source);
  const plan = createBenchmarkPlan(document, args.benchmarkPath);
  const output = `${JSON.stringify(plan, null, 2)}\n`;
  if (args.outputPath) {
    fs.mkdirSync(path.dirname(args.outputPath), { recursive: true });
    fs.writeFileSync(args.outputPath, output);
    console.error(
      `wrote ${args.outputPath}: ${plan.segments.length} segment(s)`
    );
  } else {
    process.stdout.write(output);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  usage();
  process.exit(2);
}
