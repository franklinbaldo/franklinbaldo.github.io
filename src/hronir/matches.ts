import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import matter from "gray-matter";
import { OUT_DIR, RATES_DIR } from "./posts.js";

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

// RFC 0010 §4.7 (E3): one `git log --name-only` walk builds a last-commit-time
// map for the whole blog tree, replacing the per-candidate subprocess (~200
// per generated match). First block a path appears in = its latest commit.
let _gitMtimes: Map<string, number> | null = null;

function loadGitMtimes(): Map<string, number> {
  const m = new Map<string, number>();
  try {
    const out = execFileSync(
      "git",
      ["log", "--format=%x00%ct", "--name-only", "--", "src/content/blog"],
      { stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 * 1024 * 1024 }
    ).toString();
    for (const block of out.split("\u0000")) {
      const lines = block.trim().split("\n").filter(Boolean);
      if (lines.length < 2) continue;
      const ts = Number(lines[0]) * 1000;
      if (!Number.isFinite(ts) || ts <= 0) continue;
      for (let i = 1; i < lines.length; i++) {
        if (!m.has(lines[i])) m.set(lines[i], ts);
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
