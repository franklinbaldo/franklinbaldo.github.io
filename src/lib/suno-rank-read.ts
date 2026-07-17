// Build-time read facade for the music-ranking system's pages, mirroring
// hronir-rank.ts's role for the text system but backed by
// data/suno-catalog.jsonl instead of getCollection("blog") for song
// metadata (see docs/rfcs/0018-hronir-de-musica.md).
import { existsSync, readFileSync } from "node:fs";
import { computeRatings } from "../suno-rank/ranking.js";
import { loadDuels } from "../suno-rank/duels.js";
import type { RankRow, DuelRecord } from "../suno-rank/types.js";

export type { RankRow, DuelRecord };

export interface SongInfo {
  id: string;
  title: string;
  imageUrl: string | null;
  audioUrl: string | null;
}

let _songCache: Map<string, SongInfo> | null = null;

export function getSongsById(): Map<string, SongInfo> {
  if (_songCache) return _songCache;
  const map = new Map<string, SongInfo>();
  const path = "./data/suno-catalog.jsonl";
  if (existsSync(path)) {
    const raw = readFileSync(path, "utf-8");
    for (const line of raw.split("\n")) {
      if (!line.trim()) continue;
      const clip = JSON.parse(line);
      map.set(clip.id, {
        id: clip.id,
        title: clip.title || "(sem título)",
        imageUrl: clip.imageUrl ?? null,
        audioUrl: clip.audioUrl ?? null,
      });
    }
  }
  _songCache = map;
  return map;
}

export interface RankedSong extends RankRow {
  rank: number;
  song?: SongInfo;
}

export function getSongRanking(): RankedSong[] {
  const rows = computeRatings();
  const songs = getSongsById();
  return rows.map((r, i) => ({ ...r, rank: i + 1, song: songs.get(r.key) }));
}

export interface DuelDisplay extends DuelRecord {
  id: string;
  songA?: SongInfo;
  songB?: SongInfo;
}

export function getDuels(): DuelDisplay[] {
  const songs = getSongsById();
  return loadDuels()
    .map((d) => ({
      ...d,
      id: `${d.runId}_${d.aKey}_x_${d.bKey}`,
      songA: songs.get(d.aKey),
      songB: songs.get(d.bKey),
    }))
    .sort((a, b) => b.runAt.localeCompare(a.runAt));
}

export function getDuelById(id: string): DuelDisplay | undefined {
  return getDuels().find((d) => d.id === id);
}

export function getSongDuelHistory(songId: string): DuelDisplay[] {
  return getDuels().filter((d) => d.aKey === songId || d.bKey === songId);
}
