#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

function sha256File(file) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(file));
  return hash.digest("hex");
}

function md5File(file) {
  const hash = crypto.createHash("md5");
  hash.update(fs.readFileSync(file));
  return hash.digest("hex");
}

function verifyLocalManifest(manifestPath, manifest) {
  const dir = path.dirname(manifestPath);
  const files = [];
  for (const shard of manifest.shards ?? []) {
    const file = path.resolve(dir, shard.file);
    if (!fs.existsSync(file)) throw new Error(`missing shard: ${shard.file}`);
    const bytes = fs.statSync(file).size;
    const sha256 = sha256File(file);
    const md5 = md5File(file);
    if (bytes !== shard.bytes) throw new Error(`${shard.file}: ${bytes} bytes != manifest ${shard.bytes}`);
    if (sha256 !== shard.sha256) throw new Error(`${shard.file}: SHA-256 mismatch`);
    if (shard.md5 && md5 !== shard.md5) throw new Error(`${shard.file}: MD5 mismatch`);
    files.push({ file, name: shard.file, bytes, sha256, md5 });
  }
  if (files.length === 0) throw new Error("manifest has no Parquet shards");
  return files;
}

async function fetchMetadata(identifier) {
  const response = await fetch(`https://archive.org/metadata/${encodeURIComponent(identifier)}`);
  if (!response.ok) throw new Error(`Internet Archive metadata HTTP ${response.status}`);
  return response.json();
}

async function waitForRemoteFiles(identifier, expected, attempts = 18) {
  let last = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const metadata = await fetchMetadata(identifier);
      const remote = new Map((metadata.files ?? []).map((file) => [file.name, file]));
      const missing = [];
      for (const local of expected) {
        const found = remote.get(local.name);
        if (!found) {
          missing.push(`${local.name}:missing`);
          continue;
        }
        if (Number(found.size) !== local.bytes) missing.push(`${local.name}:bytes`);
        if (found.md5 && found.md5 !== local.md5) missing.push(`${local.name}:md5`);
      }
      if (missing.length === 0) return metadata;
      last = missing.join(", ");
    } catch (error) {
      last = error instanceof Error ? error.message : String(error);
    }
    if (attempt < attempts) {
      await new Promise((resolve) => setTimeout(resolve, Math.min(attempt * 5000, 30000)));
    }
  }
  throw new Error(`Internet Archive verification did not converge: ${last}`);
}

async function main() {
  const manifestArg = arg("--manifest");
  const title = arg("--title");
  const description = arg("--description") ?? "Scientific Equation Atlas source snapshot";
  const creator = arg("--creator") ?? "Scientific Equation Atlas";
  const iaCli = process.env.IA_CLI || "ia";
  if (!manifestArg) throw new Error("--manifest is required");
  if (!process.env.IA_ACCESS_KEY_ID || !process.env.IA_SECRET_ACCESS_KEY) {
    throw new Error("IA_ACCESS_KEY_ID and IA_SECRET_ACCESS_KEY are required in the executor environment");
  }

  const manifestPath = path.resolve(manifestArg);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (manifest.format !== "parquet") throw new Error("only Parquet lake manifests may be published");
  if (manifest.stage !== "extracted" && manifest.stage !== "normalized" && manifest.stage !== "deduplicated") {
    throw new Error(`unsupported lake stage: ${manifest.stage}`);
  }
  const identifier = manifest.internet_archive?.identifier;
  if (!identifier) throw new Error("manifest.internet_archive.identifier is required");

  const localFiles = verifyLocalManifest(manifestPath, manifest);
  const uploadFiles = [...localFiles.map((entry) => entry.file), manifestPath];
  const metadata = [
    "mediatype:data",
    `title:${title ?? `Scientific Equation Atlas — ${manifest.source_id} — ${manifest.source_snapshot}`}`,
    `creator:${creator}`,
    `description:${description}`,
    `subject:Scientific Equation Atlas;equations;Parquet;open data;${manifest.source_id}`,
  ];

  const command = ["upload", identifier, ...uploadFiles, "--retries", "10"];
  for (const value of metadata) command.push("--metadata", value);
  const run = spawnSync(iaCli, command, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  if (run.status !== 0) throw new Error(run.stderr || run.stdout || "Internet Archive upload failed");

  const expected = [
    ...localFiles,
    {
      file: manifestPath,
      name: path.basename(manifestPath),
      bytes: fs.statSync(manifestPath).size,
      sha256: sha256File(manifestPath),
      md5: md5File(manifestPath),
    },
  ];
  await waitForRemoteFiles(identifier, expected);

  const publication = {
    identifier,
    metadata_url: `https://archive.org/metadata/${identifier}`,
    details_url: `https://archive.org/details/${identifier}`,
    files: expected.map(({ name, bytes, sha256, md5 }) => ({ name, bytes, sha256, md5 })),
    verified: true,
  };
  process.stdout.write(`${JSON.stringify(publication, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
