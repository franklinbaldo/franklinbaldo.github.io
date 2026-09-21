#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

import { loadWork } from "../../src/audiobook/catalog.js";

function usage() {
  console.error(
    "Usage: node scripts/audiobook/publish-internet-archive.mjs --work <work_id> --chapter <chapter_id> --assembly-dir <dir> --output <publication.json> [--dry-run]"
  );
}

function parseArgs(argv) {
  const args = {
    workId: null,
    chapterId: null,
    assemblyDir: null,
    outputPath: null,
    dryRun: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--work") args.workId = argv[++index] ?? null;
    else if (arg === "--chapter") args.chapterId = argv[++index] ?? null;
    else if (arg === "--assembly-dir") args.assemblyDir = argv[++index] ?? null;
    else if (arg === "--output") args.outputPath = argv[++index] ?? null;
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--help" || arg === "-h") {
      usage();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  for (const [flag, value] of [
    ["--work", args.workId],
    ["--chapter", args.chapterId],
    ["--assembly-dir", args.assemblyDir],
    ["--output", args.outputPath],
  ]) {
    if (!value) throw new Error(`${flag} is required`);
  }
  return args;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const digest = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("data", (chunk) => digest.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(`sha256:${digest.digest("hex")}`));
  });
}

function run(command, args, { env = process.env } = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed (${result.status}): ${result.stderr || result.stdout}`
    );
  }
  return result.stdout;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function verifyRemoteFile(url, expectedBytes, attempts = 18) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const head = await fetch(url, { method: "HEAD", redirect: "follow" });
      if (!head.ok) throw new Error(`HEAD ${head.status}`);
      const length = Number(head.headers.get("content-length"));
      if (Number.isFinite(length) && length > 0 && length !== expectedBytes) {
        throw new Error(
          `Content-Length ${length} != expected ${expectedBytes}`
        );
      }

      const range = await fetch(url, {
        headers: { Range: "bytes=0-0" },
        redirect: "follow",
      });
      if (![200, 206].includes(range.status)) {
        throw new Error(`range request ${range.status}`);
      }
      const bytes = new Uint8Array(await range.arrayBuffer());
      if (bytes.length < 1) throw new Error("range request returned no bytes");
      return {
        headStatus: head.status,
        rangeStatus: range.status,
        contentType: head.headers.get("content-type"),
        acceptRanges: head.headers.get("accept-ranges"),
      };
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await sleep(Math.min(5000 * attempt, 20_000));
      }
    }
  }
  throw new Error(
    `Internet Archive file did not become readable: ${lastError}`
  );
}

function publicationTitle(chapter) {
  const title = chapter.publication?.title;
  if (!title) {
    throw new Error(
      `${chapter.chapterId}: publication.title must be set before publishing`
    );
  }
  return title;
}

async function validateAssemblyFile(filePath, expected) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    throw new Error(`Missing assembly file: ${filePath}`);
  }
  if (fs.statSync(filePath).size !== expected.bytes) {
    throw new Error(`assembly size mismatch: ${filePath}`);
  }
  if ((await sha256File(filePath)) !== expected.sha256) {
    throw new Error(`assembly digest mismatch: ${filePath}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const work = loadWork(process.cwd(), args.workId);
  const chapter = work.chapters.find(
    (entry) => entry.chapterId === args.chapterId
  );
  if (!chapter) throw new Error(`Unknown chapter ${args.chapterId}`);
  if (chapter.ready_for_audio !== true) {
    throw new Error(`${args.chapterId} is not ready_for_audio`);
  }

  const archiveItem = work.metadata.media?.archive_item;
  if (!archiveItem) {
    throw new Error(`${args.workId}: media.archive_item is required`);
  }

  if (
    !args.dryRun &&
    work.state.publication?.public_distribution_authorized !== true
  ) {
    throw new Error(
      "public distribution is not authorized in state.yaml; refusing Internet Archive upload"
    );
  }

  const assemblyDir = path.resolve(args.assemblyDir);
  const assembly = readJson(path.join(assemblyDir, "assembly.json"));
  if (
    assembly.work_id !== args.workId ||
    assembly.chapter_id !== args.chapterId
  ) {
    throw new Error("assembly work/chapter identity mismatch");
  }

  const audioPath = path.join(assemblyDir, assembly.audio.file);
  const transcriptPath = path.join(assemblyDir, assembly.transcript.file);
  await validateAssemblyFile(audioPath, assembly.audio);
  await validateAssemblyFile(transcriptPath, assembly.transcript);

  const title = publicationTitle(chapter);
  const description =
    chapter.publication?.description ??
    work.metadata.podcast?.description ??
    work.metadata.title;
  const publishedAt =
    chapter.publication?.published_at ?? new Date().toISOString();
  const audioName = path.basename(audioPath);
  const transcriptName = path.basename(transcriptPath);
  const baseUrl = `https://archive.org/download/${encodeURIComponent(archiveItem)}/`;
  const enclosureUrl = new URL(encodeURIComponent(audioName), baseUrl).href;
  const transcriptUrl = new URL(encodeURIComponent(transcriptName), baseUrl)
    .href;

  const publication = {
    schema: "audiobook-publication-v1",
    work_id: args.workId,
    chapter_id: args.chapterId,
    backend: "internet-archive",
    archive_item: archiveItem,
    published_at: publishedAt,
    title,
    description,
    duration_seconds: assembly.duration_seconds,
    audio_digest: assembly.audio.sha256,
    enclosure: {
      url: enclosureUrl,
      bytes: assembly.audio.bytes,
      type: assembly.audio.type,
    },
    transcript: {
      url: transcriptUrl,
      type: assembly.transcript.type,
      language: assembly.transcript.language,
      sha256: assembly.transcript.sha256,
    },
  };

  if (args.dryRun) {
    publication.dry_run = true;
  } else {
    if (!process.env.IA_ACCESS_KEY_ID || !process.env.IA_SECRET_ACCESS_KEY) {
      throw new Error("IA_ACCESS_KEY_ID and IA_SECRET_ACCESS_KEY are required");
    }

    run("ia", [
      "upload",
      archiveItem,
      audioPath,
      transcriptPath,
      path.join(assemblyDir, "assembly.json"),
      "--retries",
      "10",
      "--metadata",
      "mediatype:audio",
      "--metadata",
      "collection:opensource_audio",
      "--metadata",
      `title:${work.metadata.podcast?.title ?? work.metadata.title}`,
      "--metadata",
      `creator:${work.metadata.author ?? "Unknown"}`,
      "--metadata",
      `description:${work.metadata.podcast?.description ?? description}`,
    ]);

    publication.verification = await verifyRemoteFile(
      enclosureUrl,
      assembly.audio.bytes
    );
    publication.transcript.verification = await verifyRemoteFile(
      transcriptUrl,
      assembly.transcript.bytes
    );
  }

  fs.mkdirSync(path.dirname(args.outputPath), { recursive: true });
  fs.writeFileSync(
    args.outputPath,
    `${JSON.stringify(publication, null, 2)}\n`
  );
  console.log(JSON.stringify(publication));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(2);
});
