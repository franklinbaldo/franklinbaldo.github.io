// Music-ranking equivalent of continue.ts's generateNextMatch pairing
// logic — coverage-objective only for v1 (see
// docs/rfcs/0018-hronir-de-musica.md): closeness + information-gain
// (sigma) + coverage bonus for under-sampled songs. No staleness bonus (a
// synced Suno song is never "edited" the way a text post is) and no
// leader-cooldown (that exists for per-perspective deconfounding, which
// this system doesn't do yet — see the RFC's "explicitly drop" section).
import { rating, predictWin } from "openskill";
import { readFileSync } from "node:fs";
import { computeRatings } from "./ranking.js";

export const COVERAGE_WEIGHT = 4.0;

export interface CatalogSong {
  id: string;
  title: string;
  lyricsPrompt: string;
  styleTags: string;
  audioUrl: string | null;
  isPublic: boolean;
}

export function loadPublicSongs(
  catalogPath = "./data/suno-catalog.jsonl"
): CatalogSong[] {
  const raw = readFileSync(catalogPath, "utf-8");
  return raw
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l))
    .filter((c) => c.isPublic === true);
}

export interface Pair {
  a: CatalogSong;
  b: CatalogSong;
  score: number;
}

export function _pickNextPair(
  songs: CatalogSong[],
  ratingByKey: Map<string, { mu: number; sigma: number }>,
  appByKey: Map<string, number>
): Pair | null {
  if (songs.length < 2) return null;

  const getRating = (key: string) => ratingByKey.get(key) ?? rating();
  const coverageBonus = (a: string, b: string) =>
    COVERAGE_WEIGHT *
    (1 / (1 + (appByKey.get(a) ?? 0)) + 1 / (1 + (appByKey.get(b) ?? 0)));

  let best: Pair | null = null;
  let bestScore = -Infinity;
  let bestJitter = -Infinity;

  for (let i = 0; i < songs.length; i++) {
    for (let j = i + 1; j < songs.length; j++) {
      const a = songs[i];
      const b = songs[j];
      const ra = getRating(a.id);
      const rb = getRating(b.id);
      const [pA] = predictWin([[ra], [rb]]);
      const score =
        -Math.abs(pA - 0.5) + ra.sigma + rb.sigma + coverageBonus(a.id, b.id);
      const jitter = Math.random();
      if (score > bestScore || (score === bestScore && jitter > bestJitter)) {
        bestScore = score;
        bestJitter = jitter;
        best = { a, b, score };
      }
    }
  }
  if (!best) return null;
  // Randomize which song lands on side "a" — the scoring above is
  // symmetric, but side assignment shouldn't correlate with anything
  // (e.g. catalog order) that could bias the judge.
  if (Math.random() < 0.5) return { a: best.b, b: best.a, score: best.score };
  return best;
}

export function pickNextPair(songs: CatalogSong[]): Pair | null {
  const ratingByKey = new Map<string, { mu: number; sigma: number }>();
  const appByKey = new Map<string, number>();
  for (const r of computeRatings()) {
    ratingByKey.set(r.key, { mu: r.mu, sigma: r.sigma });
    appByKey.set(r.key, r.appearances);
  }
  return _pickNextPair(songs, ratingByKey, appByKey);
}
