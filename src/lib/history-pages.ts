// RFC 0015 Fase A: build-time bridge between versions-history.json and the
// /blog/<slug>/v/<uuid> permalink routes. Once a slug is flattened, its
// archived versions have no file on disk — only a git blob recorded in the
// history index — so the version pages and the raw-body endpoint resolve
// content from the blob store instead of the content collections.
import { execFileSync } from "node:child_process";
import { readHistory, type HistoryEntry } from "../hronir/history.js";
import { GITHUB_REPO, contentUrlsForPath } from "./versions.js";

export type { HistoryEntry };

/** All archived entries (empty array when versions-history.json is absent —
 *  the pre-flattening tree — so every consumer degrades to a no-op). */
export function listHistoryEntries(): HistoryEntry[] {
  return readHistory();
}

const _blobCache = new Map<string, string | null>();

/** Materialize a git blob's content at build time (`git cat-file blob`).
 *  The deploy checkout is fetch-depth:0, so blobs of committed versions are
 *  reachable; never-committed drafts were persisted with `hash-object -w`.
 *  Returns null (with a warning) when the object is unreachable — a missing
 *  blob skips its entry, it must never break the build. */
export function materializeBlob(sha: string): string | null {
  const hit = _blobCache.get(sha);
  if (hit !== undefined) return hit;
  let content: string | null;
  try {
    content = execFileSync("git", ["cat-file", "blob", sha], {
      stdio: ["ignore", "pipe", "ignore"],
      maxBuffer: 16 * 1024 * 1024,
    }).toString();
  } catch {
    console.warn(
      `[history-pages] blob ${sha} not reachable in this checkout — skipping entry`
    );
    content = null;
  }
  _blobCache.set(sha, content);
  return content;
}

/** Every uuid an entry's permalink may be reached under (current + the
 *  pre-RFC-0010 legacy and pre-RFC-0014 pre-OKF aliases), deduped. */
export function historyUuids(e: HistoryEntry): string[] {
  return [...new Set([e.uuid, e.legacyUuid, e.preOkfUuid].filter(Boolean))];
}

/** Site path of the raw-body endpoint for an archived entry. Always keyed by
 *  the primary uuid (aliases reuse it), and language-neutral: PT pages fetch
 *  the same endpoint. Null when the blob can't be materialized — the page
 *  then falls back to its GitHub link. */
export function historyRawPath(e: HistoryEntry): string | null {
  if (materializeBlob(e.sha) === null) return null;
  return `/blog/${e.slug}/v/${e.uuid}/raw.txt`;
}

/** Human-facing GitHub link for an archived entry: the commit-pinned blob
 *  page when the removal commit is known, else the repo root (a draft-only
 *  blob was never pushed, so no file URL exists for it). */
export function historyGithubUrl(e: HistoryEntry): string {
  if (e.commitSha) return contentUrlsForPath(e.path, e.commitSha).githubUrl;
  return `https://github.com/${GITHUB_REPO}`;
}
