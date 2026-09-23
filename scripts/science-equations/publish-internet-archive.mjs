#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const manifestArg = arg("--manifest");
const outputArg = arg("--output");
if (!manifestArg || !outputArg) {
  console.error("Usage: publish-internet-archive.mjs --manifest <manifest.json> --output <publication.json>");
  process.exit(2);
}
if (!process.env.IA_ACCESS_KEY_ID || !process.env.IA_SECRET_ACCESS_KEY) {
  throw new Error("IA_ACCESS_KEY_ID and IA_SECRET_ACCESS_KEY are required in the external executor environment");
}

const manifestPath = path.resolve(manifestArg);
const manifestDir = path.dirname(manifestPath);
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const identifier = manifest.archive_identifier;
if (!identifier || !Array.isArray(manifest.shards) || manifest.shards.length === 0) {
  throw new Error("manifest must contain archive_identifier and non-empty shards");
}

const expected = [
  ...manifest.shards.map((shard) => ({
    file: shard.file,
    bytes: Number(shard.bytes),
    md5: String(shard.md5).toLowerCase(),
  })),
  {
    file: path.basename(manifestPath),
    bytes: fs.statSync(manifestPath).size,
    md5: null,
  },
];

for (const item of expected) {
  const local = item.file === path.basename(manifestPath) ? manifestPath : path.join(manifestDir, item.file);
  if (!fs.existsSync(local)) throw new Error(`missing local artifact: ${local}`);
  if (fs.statSync(local).size !== item.bytes) throw new Error(`local size mismatch for ${item.file}`);
  item.local = local;
}

const metadataUrl = `https://archive.org/metadata/${encodeURIComponent(identifier)}`;
async function getMetadata() {
  const response = await fetch(metadataUrl, { redirect: "follow" });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Internet Archive metadata failed: HTTP ${response.status}`);
  return response.json();
}

const before = await getMetadata();
if (before?.files) {
  const remoteByName = new Map(before.files.map((file) => [file.name, file]));
  for (const item of expected) {
    const remote = remoteByName.get(item.file);
    if (!remote) continue;
    const remoteBytes = Number(remote.size);
    if (Number.isFinite(remoteBytes) && remoteBytes !== item.bytes) {
      throw new Error(`refusing overwrite: ${item.file} exists with ${remoteBytes} bytes, local has ${item.bytes}`);
    }
    if (item.md5 && remote.md5 && String(remote.md5).toLowerCase() !== item.md5) {
      throw new Error(`refusing overwrite: ${item.file} exists with a different MD5`);
    }
  }
}

const uploadArgs = [
  "upload",
  identifier,
  ...expected.map((item) => item.local),
  "--retries",
  "10",
  "--metadata",
  "mediatype:data",
  "--metadata",
  `title:Scientific Equation Atlas — ${manifest.source_id} — ${manifest.source_snapshot}`,
  "--metadata",
  "creator:Scientific Equation Atlas",
  "--metadata",
  `description:Versioned Apache Parquet dataset for ${manifest.source_id}, snapshot ${manifest.source_snapshot}.`,
];
const upload = spawnSync("ia", uploadArgs, { encoding: "utf8" });
if (upload.status !== 0) {
  throw new Error(upload.stderr || upload.stdout || "Internet Archive upload failed");
}

let verifiedMetadata = null;
for (let attempt = 1; attempt <= 18; attempt += 1) {
  const metadata = await getMetadata();
  const remoteByName = new Map((metadata?.files ?? []).map((file) => [file.name, file]));
  let complete = true;
  for (const item of expected) {
    const remote = remoteByName.get(item.file);
    if (!remote || Number(remote.size) !== item.bytes) {
      complete = false;
      break;
    }
    if (item.md5 && remote.md5 && String(remote.md5).toLowerCase() !== item.md5) {
      throw new Error(`post-upload MD5 mismatch for ${item.file}`);
    }
  }
  if (complete) {
    verifiedMetadata = metadata;
    break;
  }
  if (attempt < 18) await sleep(Math.min(attempt * 5000, 20000));
}
if (!verifiedMetadata) throw new Error("Internet Archive publication did not become verifiable");

const publication = {
  identifier,
  details_url: `https://archive.org/details/${identifier}`,
  download_base_url: `https://archive.org/download/${identifier}/`,
  source_id: manifest.source_id,
  source_snapshot: manifest.source_snapshot,
  manifest_sha256: manifest.manifest_sha256,
  files: expected.map(({ file, bytes, md5 }) => ({ file, bytes, md5 })),
  verified_at: new Date().toISOString(),
  verification: "Internet Archive metadata listing + byte size + MD5 when available",
};
const outputPath = path.resolve(outputArg);
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(publication, null, 2) + "\n");
console.log(JSON.stringify(publication));
