// Read/write layer for .routines/suno-rank/duels/*.json — the music-ranking
// equivalent of src/hronir/matches.ts, much simpler: one flat JSON object
// per duel (no human prose body, so gray-matter's document+frontmatter
// shape buys nothing here — see docs/rfcs/0018-hronir-de-musica.md).
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { DuelRecord } from "./types.js";

export const OUT_DIR = ".routines/suno-rank";
export const DUELS_DIR = join(OUT_DIR, "duels");

let _cache: { count: number; duels: DuelRecord[] } | null = null;

function _listFiles(): string[] {
  try {
    return readdirSync(DUELS_DIR)
      .filter((f) => f.endsWith(".json"))
      .sort();
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

/** Cheap invalidation signal: file count. A duel file is never edited after
 *  being written, only added — matchesDataVersion()'s mtime-scan approach
 *  would work too, but count is enough here and avoids a stat() per file. */
export function duelsDataVersion(): number {
  return _listFiles().length;
}

export function loadDuels(): DuelRecord[] {
  const version = duelsDataVersion();
  if (_cache && _cache.count === version) return _cache.duels;
  const duels = _listFiles().map(
    (f) => JSON.parse(readFileSync(join(DUELS_DIR, f), "utf-8")) as DuelRecord
  );
  _cache = { count: version, duels };
  return duels;
}

export function writeDuel(duel: DuelRecord): string {
  mkdirSync(DUELS_DIR, { recursive: true });
  const filename = `${duel.runId}_${duel.aKey}_x_${duel.bKey}.json`;
  writeFileSync(
    join(DUELS_DIR, filename),
    JSON.stringify(duel, null, 2) + "\n",
    "utf-8"
  );
  _cache = null;
  return filename;
}
