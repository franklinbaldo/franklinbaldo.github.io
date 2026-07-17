/**
 * Fetches the full Suno catalog and overwrites data/suno-catalog.jsonl with
 * exactly what Suno currently reports — a full sync, not an append-only
 * mirror. There's no hand-edited content in this file to preserve, so a
 * title/tag edit, a visibility flip, or a trash on Suno all propagate to
 * the next sync automatically instead of needing a separate cleanup step.
 *
 * Rendering (slug, genre parsing, YAML/markdown) happens at Astro build
 * time in src/content.config.ts's music loader, not here — this script's
 * only job is "what does Suno currently say," kept close to the raw API
 * shape.
 *
 * Usage:
 *   npm run music:sync                    # public songs only, no auth
 *   npm run music:sync -- --include-private # also private/unpublished
 *                                             songs, needs SUNO_CLERK_COOKIE
 */

import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { mintBearerToken } from "./lib/suno-auth.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_FILE = join(ROOT, "data/suno-catalog.jsonl");

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
  const auth = {
    Authorization: `Bearer ${jwt}`,
    "Content-Type": "application/json",
  };
  const clips = [];
  const seen = new Set();
  let cursor = null;
  let page = 0;
  while (true) {
    page++;
    const body = cursor ? { cursor } : {};
    // feed/v3 confirmed live (2026-07-16) to silently truncate under rapid
    // pagination: a burst of calls with no delay produced a 200 OK with an
    // empty clips array and no has_more/next_cursor on what should have
    // been a mid-feed page — not a 429, so fetchJSON's retry-on-error never
    // sees it. A 400ms stagger alone made two consecutive full paginations
    // consistent (the shorter one was a strict subset of the longer one —
    // truncation, not a shifting dataset). Belt-and-suspenders: also retry
    // a suspiciously-empty non-first page a few times before accepting it
    // as genuinely the end of the feed.
    let next;
    for (let attempt = 0; ; attempt++) {
      next = await fetchJSON(`${SUNO_API}/feed/v3`, {
        method: "POST",
        headers: auth,
        body: JSON.stringify(body),
      });
      const looksTruncated =
        page > 1 && (next.clips ?? []).length === 0 && attempt < 3;
      if (!looksTruncated) break;
      console.log(
        `  página ${page}: resposta vazia suspeita, tentativa ${attempt + 1}/4...`
      );
      await sleep(1000 * 2 ** attempt);
    }
    for (const c of next.clips ?? []) {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        clips.push(c);
      }
    }
    if (!next.has_more || !next.next_cursor || page > 150) break;
    cursor = next.next_cursor;
    await sleep(400);
  }
  return clips;
}

// Raw Suno clip -> the trimmed shape we persist. Kept close to the API but
// normalized enough that the build-time loader doesn't need to know about
// Suno's response shape at all.
function toRecord(clip) {
  return {
    id: clip.id,
    title: clip.title || "",
    lyricsPrompt: (clip.metadata?.prompt ?? "").trim(),
    styleTags: clip.metadata?.tags ?? "",
    durationSeconds: clip.metadata?.duration
      ? Math.round(clip.metadata.duration)
      : null,
    imageUrl: clip.image_url ?? null,
    // For the music-ranking system's Gemini judge (src/suno-rank/) — the
    // audio it needs to fetch per duel. Already present on every feed/v3
    // item, no extra request.
    audioUrl: clip.audio_url ?? null,
    isPublic: clip.is_public === true,
    createdAt: clip.created_at ?? null,
  };
}

async function main() {
  mkdirSync(dirname(OUT_FILE), { recursive: true });

  let clips;
  if (INCLUDE_PRIVATE) {
    console.log(
      `Buscando TODAS as músicas (públicas e privadas) de @${HANDLE} no Suno…`
    );
    const jwt = await mintBearerToken();
    // feed/v3's list items already carry full metadata (prompt/lyrics,
    // tags, duration) identical to the separate per-clip detail endpoint
    // — confirmed by diffing both responses for the same clip live
    // (2026-07-17). No second request per clip needed.
    clips = await fetchAllClipsIncludingPrivate(jwt);
    console.log(`${clips.length} música(s) encontradas.`);
  } else {
    console.log(`Buscando músicas públicas de @${HANDLE} no Suno…`);
    clips = await fetchPublicClips();
  }

  const records = clips.map(toRecord).sort((a, b) => a.id.localeCompare(b.id));
  const jsonl = records.map((r) => JSON.stringify(r)).join("\n") + "\n";
  writeFileSync(OUT_FILE, jsonl, "utf8");

  console.log(
    `\nPronto: ${records.length} música(s) sincronizadas em data/suno-catalog.jsonl.`
  );
}

main().catch((e) => {
  console.error("Erro:", e.message);
  process.exit(1);
});
