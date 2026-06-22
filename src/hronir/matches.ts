import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import matter from "gray-matter";
import { OUT_DIR, RATES_DIR } from "./posts.js";
import type {
  MatchKind,
  NormalizedMatch,
  NormalizedMatchSide,
} from "./types.js";

export function listMatchFiles(): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const dir of [OUT_DIR, RATES_DIR]) {
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!/_x_.*\.md$/.test(f)) continue;
      if (seen.has(f)) continue;
      seen.add(f);
      out.push(path.join(dir, f));
    }
  }
  return out;
}

interface ParsedMatch {
  data: Record<string, unknown>;
  content: string;
  filePath: string;
}

// RFC 0010 §4.7 (E1): every command walks the ~1.200 rate files several times
// (ranking, quality, version ratings, doctor sweeps). Each CLI invocation is
// a fresh process, so a per-path parse cache is safe; writeMatch invalidates
// the touched entry and bumps the data version so downstream memos
// (ranking._loadMatchData) recompute.
const _matchCache = new Map<string, ParsedMatch>();
let _matchesDataVersion = 0;

/** Monotonic counter, bumped on every writeMatch. Memoize derived data
 *  (e.g. the normalized match array) against this value. */
export function matchesDataVersion(): number {
  return _matchesDataVersion;
}

export function readMatch(filePath: string): ParsedMatch {
  let cached = _matchCache.get(filePath);
  if (!cached) {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = matter(raw);
    // Rate files written on Windows carry backslash separators in
    // post_a/b.path; normalize to POSIX so existsSync and key lookups work
    // on Linux CI. decide() re-persists via writeMatch, so files self-heal.
    for (const sideName of ["post_a", "post_b"]) {
      const side = (parsed.data as Record<string, unknown>)[sideName] as
        | { path?: unknown }
        | undefined;
      if (side && typeof side.path === "string") {
        side.path = side.path.replace(/\\/g, "/");
      }
    }
    cached = { data: parsed.data, content: parsed.content, filePath };
    _matchCache.set(filePath, cached);
  }
  // Defensive copy: callers mutate frontmatter (migrate, decide drafts), and
  // a shared reference would poison later reads. Cloning a small object is
  // far cheaper than re-parsing the file.
  return structuredClone(cached);
}

export function writeMatch(
  filePath: string,
  frontmatter: Record<string, unknown>,
  body: string
): void {
  const out = matter.stringify(body, frontmatter);
  fs.writeFileSync(filePath, out);
  _matchCache.delete(filePath);
  _matchesDataVersion++;
}

export function postKey(
  side: { key?: string; slug?: string } | null | undefined
): string | null {
  if (!side) return null;
  return side.key || side.slug || null;
}

// ── Single normalizer (RFC 0012 §4.1) ───────────────────────────────────────
//
// Before RFC 0012 three readers (ranking._loadMatchData,
// ranking.computePerPerspectiveRatings, hronir-rank.loadDuelData) each parsed
// the rate files and re-derived winner/override resolution, keys, runAt and the
// work-vs-version distinction by hand. This is the one place that does it, so
// every consumer shares the same classification instead of re-deriving
// `aKey === bKey` ad hoc.

/** RFC 0012 §4.1: structural, derivable from the rate file alone. */
export function classifyKind(aKey: string, bKey: string): MatchKind {
  return aKey === bKey ? "version" : "work";
}

/** Stable 8-char duel id — hash of postAKey|postBKey|runAt. Single source for
 *  the value hronir-rank.duelId used to compute inline. */
export function matchId(aKey: string, bKey: string, runAt: string): string {
  return crypto
    .createHash("sha256")
    .update([aKey, bKey, runAt].join("|"))
    .digest("hex")
    .slice(0, 8);
}

/** A normalized match plus the raw material consumers still need: the exact
 *  original runAt string (Date round-tripping would corrupt `run_id`-only
 *  timestamps), the source filename, and the untouched frontmatter/body for
 *  passthrough display fields (margin, confidence, parsed clash, …). */
export interface LoadedMatch {
  norm: NormalizedMatch;
  filename: string;
  runAtRaw: string;
  data: Record<string, unknown>;
  content: string;
}

function asString(v: unknown): string | null {
  return v == null ? null : String(v);
}

function asFiniteNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function normalizeSide(
  raw: Record<string, unknown> | null | undefined,
  key: string
): NormalizedMatchSide {
  const version = (raw?.version as string) ?? null;
  const contentLang =
    (raw?.content_lang as string) ?? (raw?.display_lang as string) ?? null;
  return {
    key,
    ref: version ? `${key}@${version}` : null,
    path: (raw?.path as string) || null,
    version,
    contentLang,
  };
}

/** Pure: turns one parsed rate file into a LoadedMatch, or null when the file
 *  carries no usable verdict (no winner, missing keys, TODO). Same filters the
 *  three legacy readers applied, in one place. */
export function normalizeMatch(
  data: Record<string, unknown>,
  content: string,
  filePath: string
): LoadedMatch | null {
  let winner = data.winner as string;
  if (data.override && data.override !== "null")
    winner = data.override as string;
  if (winner === "TODO" || !winner) return null;
  if (winner !== "a" && winner !== "b") return null;

  const aKey = postKey(data.post_a as { key?: string; slug?: string } | null);
  const bKey = postKey(data.post_b as { key?: string; slug?: string } | null);
  if (!aKey || !bKey) return null;

  const rawRunAt = (data.run_at ?? data.run_id ?? "") as string | Date;
  const runAtRaw =
    rawRunAt instanceof Date ? rawRunAt.toISOString() : String(rawRunAt);
  const parsed = runAtRaw ? new Date(runAtRaw) : null;
  const runAt = parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;

  const postA = data.post_a as Record<string, unknown> | null;
  const postB = data.post_b as Record<string, unknown> | null;

  const norm: NormalizedMatch = {
    id: matchId(aKey, bKey, runAtRaw),
    kind: classifyKind(aKey, bKey),
    winnerSide: winner,
    runAt,
    postA: normalizeSide(postA, aKey),
    postB: normalizeSide(postB, bKey),
    reviewLang:
      (data.review_lang as string) ?? (data.eval_lang as string) ?? null,
    agentId: asString(data.agent_id),
    perspectiveId: asString(data.perspective_id),
    rateA: asFiniteNumber(data.rate_a),
    rateB: asFiniteNumber(data.rate_b),
    evaluatorMood: asString(data.evaluator_mood),
    evaluatorMoodAfter: asString(data.evaluator_mood_after),
  };

  return { norm, filename: filePath, runAtRaw, data, content };
}

// RFC 0010 §4.7 (E1): memoized against matchesDataVersion so a writeMatch in
// the same process (decide, migrate) invalidates the snapshot.
let _normCache: { version: number; matches: LoadedMatch[] } | null = null;

/** The single parse pass over the rate files. Consumers map this to their own
 *  shape (RawMatch, DuelEntry) instead of reading the files again. */
export function loadMatches(): LoadedMatch[] {
  const version = matchesDataVersion();
  if (_normCache && _normCache.version === version) return _normCache.matches;
  const out: LoadedMatch[] = [];
  for (const f of listMatchFiles()) {
    const { data, content } = readMatch(f);
    const lm = normalizeMatch(data as Record<string, unknown>, content, f);
    if (lm) out.push(lm);
  }
  _normCache = { version, matches: out };
  return out;
}

/** RFC 0012 §4.1 public API: the normalized matches without the raw passthrough
 *  material. */
export function loadNormalizedMatches(): NormalizedMatch[] {
  return loadMatches().map((m) => m.norm);
}

// RFC 0010 §4.7 (E3): one `git log --name-only` walk builds a last-commit-time
// map for the whole blog tree, replacing the per-candidate subprocess (~200
// per generated match). First block a path appears in = its latest commit.
let _gitMtimes: Map<string, number> | null = null;

function loadGitMtimes(): Map<string, number> {
  const m = new Map<string, number>();
  try {
    const out = execFileSync(
      "git",
      [
        "log",
        "--format=%x00%ct",
        "--name-status",
        "-M",
        "--",
        "src/content/blog",
      ],
      { stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 * 1024 * 1024 }
    ).toString();
    // Maps a historical path to the present-day path it became, so commits
    // older than a rename keep crediting the file that exists now (git log
    // walks newest -> oldest, so aliases are in place before older blocks).
    const alias = new Map<string, string>();
    const finalName = (p: string) => alias.get(p) ?? p;
    for (const block of out.split("\u0000")) {
      const lines = block.trim().split("\n").filter(Boolean);
      if (lines.length < 2) continue;
      const ts = Number(lines[0]) * 1000;
      if (!Number.isFinite(ts) || ts <= 0) continue;
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split("\t");
        const status = parts[0];
        if (status.startsWith("R") && parts.length >= 3) {
          const from = parts[1];
          const to = parts[2];
          const target = finalName(to);
          alias.set(from, target);
          // The RFC 0010 migration renamed index.* -> v-* adding only a
          // lifecycle frontmatter stamp (git reports R09x). Like a pure
          // R100 rename, that is not a content edit: skipping the stamp
          // here lets older commits on the former name carry the real
          // mtime, instead of marking the whole archive freshly edited.
          const pureRename =
            status === "R100" ||
            (/\/index\.mdx?$/.test(from) && /\/v-[^/]+\.mdx?$/.test(to));
          if (!pureRename && !m.has(target)) m.set(target, ts);
        } else {
          const target = finalName(parts[parts.length - 1]);
          if (!m.has(target)) m.set(target, ts);
        }
      }
    }
  } catch {
    // git unavailable → empty map; gitMtime falls back per file below.
  }
  return m;
}

export function gitMtime(filePath: string): number {
  if (!_gitMtimes) _gitMtimes = loadGitMtimes();
  const hit = _gitMtimes.get(filePath);
  if (hit !== undefined) return hit;
  // Path outside the batched scope (or not yet committed): single-file
  // lookup, cached so repeats stay cheap.
  let mtime = 0;
  try {
    const out = execFileSync(
      "git",
      ["log", "-1", "--format=%ct", "--", filePath],
      { stdio: ["ignore", "pipe", "ignore"] }
    )
      .toString()
      .trim();
    mtime = out ? Number(out) * 1000 : 0;
  } catch {
    mtime = 0;
  }
  _gitMtimes.set(filePath, mtime);
  return mtime;
}
