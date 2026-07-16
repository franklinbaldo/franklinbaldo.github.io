/**
 * Fetches songs from the Suno API and creates MDX stub posts in
 * src/content/blog/. Only creates new files — never overwrites.
 * Music posts are identified by postType: music (RFC 0006).
 *
 * Usage:
 *   npm run music:generate                    # public songs only, no auth
 *   npm run music:generate -- --include-private # also private/unpublished
 *                                                 songs, needs SUNO_CLERK_COOKIE
 */

import { writeFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { mintBearerToken } from "./lib/suno-auth.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "src/content/blog");

const HANDLE = "franklinbaldo";
const SUNO_API = "https://studio-api-prod.suno.com/api";
const INCLUDE_PRIVATE = process.argv.includes("--include-private");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJSON(url, options = {}) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, {
      ...options,
      headers: { Accept: "application/json", ...options.headers },
    });
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

// Every clip gets a short id suffix, always — not just on collision.
// Duplicate titles are common in this catalog (multiple takes of the same
// song: several "Xadrez", several "Beatriz"), and a conditional suffix
// (only when a collision is detected) is order-dependent and silently
// drops whichever clip is processed second under the plain-title slug.
// A fixed suffix makes every clip's slug unique and stable regardless of
// fetch order.
function slugFor(clip) {
  const base = slugify(clip.title || "") || "sem-titulo";
  return `${base}-${clip.id.slice(0, 8)}`;
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
  if (/[:#[\]{},|>&*!'"\\]/.test(str) || str.includes("\n")) {
    return `"${str.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return str;
}

function parseTags(raw) {
  if (!raw) return [];
  return raw
    .split(/[,;\n]/) // some style prompts use newlines as the real separator
    // between clauses (e.g. "Genre: X\nTempo: Y\nInstruments: Z"), not just
    // commas — splitting on comma alone leaves multi-line fragments that
    // blow past RFC 0011's 40-char genre-label limit.
    .map((t) => t.trim())
    .filter(Boolean)
    // RFC 0011 / content.config.ts: genre labels max 40 chars each — drop
    // anything longer instead of writing frontmatter the Zod schema will
    // reject at build time.
    .filter((t) => t.length <= 40)
    // RFC 0011 / content.config.ts: max 5 genres per post (not 6 — the
    // schema's actual cap).
    .slice(0, 5);
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
type: Music Post
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

// Scans every existing post file (flat .md/.mdx at BLOG_DIR root, and
// legacy <slug>/v-*.mdx directories — RFC 0010 → 0015 layouts) for a
// `sunoId:` frontmatter field, so a clip that already has a post (under
// any slug, from any earlier run, hand-written or generated) is never
// mirrored a second time under a new slug. Deliberately a plain
// existence-scan rather than scripts/lib/content.mjs's
// selection-aware listPostFiles() — this needs "does any file anywhere
// reference this clip," not "what's currently the published version."
function findMirroredSunoIds() {
  const ids = new Set();
  const scanFile = (path) => {
    const raw = readFileSync(path, "utf8");
    const m = raw.match(/^sunoId:\s*([^\r\n]+)$/m);
    if (m) ids.add(m[1].trim());
  };
  for (const entry of readdirSync(OUT_DIR, { withFileTypes: true })) {
    const full = join(OUT_DIR, entry.name);
    if (entry.isDirectory()) {
      for (const inner of readdirSync(full)) {
        if (/\.mdx?$/.test(inner)) scanFile(join(full, inner));
      }
    } else if (/\.mdx?$/.test(entry.name)) {
      scanFile(full);
    }
  }
  return ids;
}

async function fetchPublicClips() {
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

  return clips;
}

// The public profile endpoint above never returns private/unpublished
// clips, even authenticated as the owner — it's the same data a visitor
// sees. /api/feed/v3 (cursor-paginated, POST) is the actual "my library"
// feed, returning every generation regardless of visibility.
async function fetchAllClipsIncludingPrivate(jwt) {
  const auth = { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" };
  const clips = [];
  const seen = new Set();
  let cursor = null;
  let page = 0;
  while (true) {
    page++;
    const body = cursor ? { cursor } : {};
    const next = await fetchJSON(`${SUNO_API}/feed/v3`, {
      method: "POST",
      headers: auth,
      body: JSON.stringify(body),
    });
    for (const c of next.clips ?? []) {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        clips.push(c);
      }
    }
    if (!next.has_more || !next.next_cursor || page > 100) break;
    cursor = next.next_cursor;
    await sleep(150);
  }
  return clips;
}

// feed/v3's clip objects don't carry lyrics/caption/full metadata — same
// gap the paginated profile listing has (see franklinbaldo/skills'
// suno-profile/references/write-api.md, "Reading the profile"). Detail
// needs its own per-clip GET, authenticated.
async function fetchClipDetail(id, jwt) {
  return fetchJSON(`${SUNO_API}/clip/${id}/`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  let clips;
  if (INCLUDE_PRIVATE) {
    console.log(`Buscando TODAS as músicas (públicas e privadas) de @${HANDLE} no Suno…`);
    const jwt = await mintBearerToken();
    const basics = await fetchAllClipsIncludingPrivate(jwt);
    console.log(`${basics.length} músicas encontradas (biblioteca completa). Buscando detalhes…`);
    clips = [];
    for (const c of basics) {
      const detail = await fetchClipDetail(c.id, jwt);
      clips.push({ ...c, metadata: detail.metadata ?? c.metadata, is_public: detail.is_public ?? c.is_public });
      await sleep(150);
    }
  } else {
    console.log(`Buscando músicas públicas de @${HANDLE} no Suno…`);
    clips = await fetchPublicClips();
  }

  console.log(`${clips.length} música(s) para considerar.`);

  const alreadyMirrored = findMirroredSunoIds();
  let created = 0;
  let skipped = 0;

  for (const clip of clips) {
    if (alreadyMirrored.has(clip.id)) {
      skipped++;
      continue;
    }

    const slug = slugFor(clip);
    // RFC 0010: each post is a folder <slug>/ of peer version files; new
    // posts start as a single v-<timestamp>.mdx that `hronir:select` picks
    // up as the debut selection on its next run.
    const dir = join(OUT_DIR, slug);

    // slugFor()'s id suffix makes a same-title collision between two
    // different Suno clips essentially impossible, but a flat <slug>.md(x)
    // or an existing legacy dir at this exact path (e.g. a second run
    // before hronir:select/flatten has processed the first) still needs
    // this guard.
    if (
      existsSync(`${dir}.md`) ||
      existsSync(`${dir}.mdx`) ||
      (existsSync(dir) && statSync(dir).isDirectory())
    ) {
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
    console.log(`  criado: ${slug}/v-${stamp}.mdx${clip.is_public ? "" : " (privado no Suno)"}`);
    created++;
  }

  console.log(`\nPronto: ${created} criados, ${skipped} já existiam.`);
  if (created > 0 && !INCLUDE_PRIVATE) {
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
