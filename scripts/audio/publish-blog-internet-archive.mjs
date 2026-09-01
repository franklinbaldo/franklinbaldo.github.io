#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

const postId = arg('--post');
const audioPathArg = arg('--audio');
const title = arg('--title');
const description = arg('--description') ?? title;
const output = arg('--output');
const archiveItem = arg('--archive-item') ?? (postId ? `franklinbaldo-blog-audio-${postId}` : null);
if (!postId || !audioPathArg || !title || !output || !archiveItem) {
  console.error('Usage: publish-blog-internet-archive.mjs --post <post_id> --audio <file> --title <title> --output <json> [--description <text>] [--archive-item <id>]');
  process.exit(2);
}
if (!process.env.IA_ACCESS_KEY_ID || !process.env.IA_SECRET_ACCESS_KEY) {
  throw new Error('IA_ACCESS_KEY_ID and IA_SECRET_ACCESS_KEY are required');
}

const audioPath = path.resolve(audioPathArg);
const bytes = fs.statSync(audioPath).size;
const digest = `sha256:${crypto.createHash('sha256').update(fs.readFileSync(audioPath)).digest('hex')}`;
const filename = path.basename(audioPath);
const mediaUrl = `https://archive.org/download/${encodeURIComponent(archiveItem)}/${encodeURIComponent(filename)}`;
const mimeType = filename.endsWith('.mp3') ? 'audio/mpeg' : filename.endsWith('.m4a') ? 'audio/mp4' : 'audio/wav';

const run = spawnSync('ia', [
  'upload', archiveItem, audioPath,
  '--retries', '10',
  '--metadata', 'mediatype:audio',
  '--metadata', 'collection:opensource_audio',
  '--metadata', `title:${title}`,
  '--metadata', 'creator:Franklin Baldo',
  '--metadata', `description:${description}`,
], { encoding: 'utf8' });
if (run.status !== 0) throw new Error(run.stderr || run.stdout || 'Internet Archive upload failed');

let head;
for (let attempt = 1; attempt <= 18; attempt += 1) {
  head = await fetch(mediaUrl, { method: 'HEAD', redirect: 'follow' });
  if (head.ok) break;
  if (attempt === 18) throw new Error(`Internet Archive media not readable: HEAD ${head.status}`);
  await new Promise((resolve) => setTimeout(resolve, Math.min(attempt * 5000, 20000)));
}
const remoteBytes = Number(head.headers.get('content-length'));
if (Number.isFinite(remoteBytes) && remoteBytes > 0 && remoteBytes !== bytes) {
  throw new Error(`Internet Archive Content-Length ${remoteBytes} != local ${bytes}`);
}
const range = await fetch(mediaUrl, { headers: { Range: 'bytes=0-0' }, redirect: 'follow' });
if (![200, 206].includes(range.status) || (await range.arrayBuffer()).byteLength < 1) {
  throw new Error(`Internet Archive range verification failed: ${range.status}`);
}

const publication = {
  post_id: postId,
  guid: `audio:blog:${postId}`,
  archive_item: archiveItem,
  media_url: mediaUrl,
  mime_type: head.headers.get('content-type')?.split(';')[0] || mimeType,
  bytes,
  sha256: digest,
  published_at: new Date().toISOString(),
  verification: { head_status: head.status, range_status: range.status },
};
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(publication, null, 2)}\n`);
console.log(JSON.stringify(publication));
