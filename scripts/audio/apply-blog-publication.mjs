#!/usr/bin/env node

import fs from "node:fs";
import process from "node:process";

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

const publicationPath = arg("--publication");
const manifestPath = arg("--manifest") ?? "data/blog-audio.json";
const duration = Number(arg("--duration-seconds"));
if (!publicationPath || !Number.isFinite(duration) || duration <= 0) {
  console.error(
    "Usage: apply-blog-publication.mjs --publication <json> --duration-seconds <seconds> [--manifest data/blog-audio.json]",
  );
  process.exit(2);
}

const publication = JSON.parse(fs.readFileSync(publicationPath, "utf8"));
if (
  !publication.verification ||
  ![200, 206].includes(publication.verification.range_status)
) {
  throw new Error("refusing to persist unverified blog audio publication");
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const episode = { ...publication, duration_seconds: duration };
delete episode.verification;
manifest.version = 1;
manifest.episodes = Array.isArray(manifest.episodes) ? manifest.episodes : [];
const existing = manifest.episodes.findIndex(
  (item) => item.post_id === episode.post_id,
);
if (existing >= 0) manifest.episodes[existing] = episode;
else manifest.episodes.push(episode);
manifest.episodes.sort((a, b) =>
  String(a.post_id).localeCompare(String(b.post_id)),
);
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
