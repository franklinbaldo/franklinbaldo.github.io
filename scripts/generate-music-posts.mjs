/**
 * Fetches public songs from the Suno API and creates MDX stub posts
 * in src/content/blog/. Only creates new files — never overwrites.
 * Music posts are identified by postType: music (RFC 0006).
 *
 * Usage:
 *   npm run music:generate
 */

import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "src/content/blog");

const HANDLE = "franklinbaldo";
const SUNO_API = "https://studio-api-prod.suno.com/api";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJSON(url) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (res.ok) return res.json();
    if ((res.status === 429 || res.status >= 500) && attempt < 3) {
      await sleep(1000 * Math.pow(2, attempt));
      continue;
    }
    throw new Error(`HTTP ${res.status} on ${url}`);
  }
  throw new Error("exhausted retries");
}

function slugify(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove accents
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

function fmtDate(isoString) {
  return isoString?.split("T")[0] ?? new Date().toISOString().split("T")[0];
}

function fmtYamlStr(str) {
  if (!str) return '""';
  // Always quote if the value could be parsed as a non-string (pure numbers, booleans, etc.)
  if (/^[\d.]+$/.test(str) || /^(true|false|null|yes|no)$/i.test(str)) {
    return `"${str}"`;
  }
  // Quote if contains special YAML chars
  if (/[:#\[\]{},|>&*!'"\\]/.test(str) || str.includes("\n")) {
    return `"${str.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return str;
}

function parseTags(raw) {
  if (!raw) return [];
  return raw
    .split(/[,;]/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function makeMdx(clip) {
  const tags = parseTags(clip.metadata?.tags);
  const genre = tags.length ? tags : [];
  const duration = clip.metadata?.duration
    ? Math.round(clip.metadata.duration)
    : null;
  const lyrics = (clip.metadata?.prompt ?? "").trim();
  const date = fmtDate(clip.created_at);

  const genreYaml =
    genre.length > 0
      ? `genre:\n${genre.map((g) => `  - ${fmtYamlStr(g)}`).join("\n")}`
      : "";

  const durationYaml = duration ? `duration: ${duration}` : "";

  const imageYaml = clip.image_url
    ? `sunoImageUrl: ${fmtYamlStr(clip.image_url)}`
    : "";

  const lyricsSection = lyrics
    ? `## Letra\n\n\`\`\`\n${lyrics}\n\`\`\``
    : `## Letra\n\n<!-- Cole a letra aqui -->`;

  return `---
title: ${fmtYamlStr(clip.title || "(sem título)")}
description: ${fmtYamlStr(`Música de Franklin Baldo — ${clip.title || "sem título"}`)}
date: ${date}
postType: music
sunoId: ${clip.id}
${imageYaml}
${genreYaml}
${durationYaml}
tags:
  - música
lang: pt
---

${lyricsSection}

## Notas do compositor
`;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  console.log(`Buscando músicas de @${HANDLE} no Suno…`);

  const first = await fetchJSON(
    `${SUNO_API}/profiles/${HANDLE}/?page=1&playlists_sort_by=created_at&clips_sort_by=created_at`
  );

  const total = Math.max(0, first.num_total_clips ?? 0);
  const seen = new Set();
  const clips = [];

  for (const c of first.clips ?? []) {
    if (!seen.has(c.id) && c.is_public) {
      seen.add(c.id);
      clips.push(c);
    }
  }

  let page = 2;
  while (clips.length < total) {
    const next = await fetchJSON(
      `${SUNO_API}/profiles/${HANDLE}/?page=${page}&playlists_sort_by=created_at&clips_sort_by=created_at`
    );
    const got = next.clips ?? [];
    if (got.length === 0) break;
    for (const c of got) {
      if (!seen.has(c.id) && c.is_public) {
        seen.add(c.id);
        clips.push(c);
      }
    }
    page++;
  }

  console.log(`${clips.length} músicas públicas encontradas.`);

  let created = 0;
  let skipped = 0;

  for (const clip of clips) {
    const rawSlug = slugify(clip.title || clip.id);
    const slug = rawSlug || clip.id.slice(0, 8);
    // RFC 0010: each post is a folder <slug>/ of peer version files; new
    // posts start as a single v-<timestamp>.mdx that `hronir:select` picks
    // up as the debut selection on its next run.
    const dir = join(OUT_DIR, slug);

    // The blog root is shared with regular posts; a song titled like an
    // existing essay would otherwise produce a duplicate Astro id.
    if (existsSync(dir)) {
      skipped++;
      continue;
    }

    const stamp = new Date()
      .toISOString()
      .replace(/\.\d+Z$/, "")
      .replace(/:/g, "-");
    const filepath = join(dir, `v-${stamp}.mdx`);
    mkdirSync(dir, { recursive: true });
    const content = makeMdx(clip);
    writeFileSync(filepath, content, "utf8");
    console.log(`  criado: ${slug}/v-${stamp}.mdx`);
    created++;
  }

  console.log(`\nPronto: ${created} criados, ${skipped} já existiam.`);
  if (created > 0) {
    console.log(
      `\nAgora edite os novos arquivos em src/content/blog/ e adicione\nsuas notas em cada seção "## Notas do compositor".`
    );
    console.log(
      `\nDepois rode \`npm run hronir:select\` para registrar os novos posts\nem src/generated/versions-selected.json (o build também roda isso).`
    );
  }
}

main().catch((e) => {
  console.error("Erro:", e.message);
  process.exit(1);
});
