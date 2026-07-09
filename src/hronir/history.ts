import fs from "node:fs";
import path from "node:path";

// RFC 0015 (single-file model): the archival record for every version that
// no longer has a live file — either folded back into the canonical
// `<slug>.mdx` (its content lost the duel) or pruned outright. Merges the
// role RFC 0010 §4.4 gave `versions-pruned.json` (permalink → redirect vs.
// 404) with a uuid→blob index, since under the single-file model *every*
// non-canonical version stops being a file, not just ones that cleared the
// prune margin. Committed (not gitignored): unlike `versions-selected.json`
// this is not a pure recomputation — it is the only remaining record of a
// blob's slug/uuid/metadata once its file is gone from the working tree.
export const HISTORY_PATH = "src/generated/versions-history.json";
export const HISTORY_SCHEMA = "history-v1";

export interface HistoryEntry {
  slug: string;
  uuid: string;
  legacyUuid: string;
  preOkfUuid: string;
  lang: string;
  /** Git blob sha of the content at the moment it was archived (`git
   *  hash-object <path>` right before removal — identical to the sha that
   *  commit will record, since the file is unmodified at that point). */
  sha: string;
  /** Repo-relative path the content lived at when archived, for the
   *  commit-pinned raw URL (raw.githubusercontent.com/.../<commit-sha>/<path>
   *  needs a *commit*, not a blob, to resolve — see historyRawRef). */
  path: string;
  title: string;
  description: string;
  date: string | null;
  draftCommittedAt: string | null;
  draftMsg: string | null;
  /** Commit this entry's removal was part of — filled in by the caller once
   *  the commit exists (the register step itself runs pre-commit, so this
   *  starts null and `stampHistoryCommit` fills it after `git commit`). */
  commitSha: string | null;
  archivedAt: string;
}

interface HistoryFile {
  _meta: { schema: string };
  entries: HistoryEntry[];
}

let _cache: HistoryEntry[] | null = null;

function load(): HistoryFile {
  if (!fs.existsSync(HISTORY_PATH)) {
    return { _meta: { schema: HISTORY_SCHEMA }, entries: [] };
  }
  let parsed: HistoryFile;
  try {
    parsed = JSON.parse(fs.readFileSync(HISTORY_PATH, "utf8"));
  } catch (e) {
    throw new Error(
      `${HISTORY_PATH} existe mas não parseia (${(e as Error).message}). ` +
        "Resolva o conflito/corrupção manualmente antes de rodar comandos hronir."
    );
  }
  if (
    parsed?._meta?.schema !== HISTORY_SCHEMA ||
    !Array.isArray(parsed.entries)
  ) {
    throw new Error(
      `${HISTORY_PATH}: schema inesperado (esperado "${HISTORY_SCHEMA}" com um array "entries"). ` +
        "Repare o arquivo manualmente antes de rodar comandos hronir."
    );
  }
  return parsed;
}

export function readHistory(): HistoryEntry[] {
  if (_cache) return _cache;
  _cache = load().entries;
  return _cache;
}

/** Dedup key: a bare uuid can theoretically collide across slugs (astronomically
 *  unlikely, but the key exists so it doesn't have to be assumed away). */
function historyKey(slug: string, uuid: string): string {
  return `${slug}@${uuid}`;
}

/** Append-only: entries already present (by slug@uuid) are skipped, never
 *  overwritten — an archived blob's metadata doesn't change after the fact. */
export function registerHistory(newEntries: HistoryEntry[]): void {
  if (newEntries.length === 0) return;
  const file = load();
  const seen = new Set(file.entries.map((e) => historyKey(e.slug, e.uuid)));
  for (const e of newEntries) {
    const k = historyKey(e.slug, e.uuid);
    if (seen.has(k)) continue;
    file.entries.push(e);
    seen.add(k);
  }
  file.entries.sort((a, b) =>
    historyKey(a.slug, a.uuid).localeCompare(historyKey(b.slug, b.uuid))
  );
  fs.mkdirSync(path.dirname(HISTORY_PATH), { recursive: true });
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(file, null, 2) + "\n");
  _cache = null;
}

/** Fills in `commitSha` for every entry still missing it — called once,
 *  right after the commit that removed their files lands, since the sha
 *  isn't known until the commit exists. Idempotent (only touches nulls). */
export function stampHistoryCommit(commitSha: string): void {
  const file = load();
  let changed = false;
  for (const e of file.entries) {
    if (e.commitSha === null) {
      e.commitSha = commitSha;
      changed = true;
    }
  }
  if (!changed) return;
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(file, null, 2) + "\n");
  _cache = null;
}

export function historyEntryForUuid(uuid: string): HistoryEntry | null {
  return (
    readHistory().find(
      (e) => e.uuid === uuid || e.legacyUuid === uuid || e.preOkfUuid === uuid
    ) ?? null
  );
}

export function historyEntriesForSlug(slug: string): HistoryEntry[] {
  return readHistory().filter((e) => e.slug === slug);
}

/** All slug@uuid keys ever archived — same "tolerate a gone rate-file
 *  reference" role `versions-pruned.json` played for `doctor()`. */
export function historyKeySet(): Set<string> {
  const out = new Set<string>();
  for (const e of readHistory()) {
    out.add(historyKey(e.slug, e.uuid));
    out.add(historyKey(e.slug, e.legacyUuid));
    out.add(historyKey(e.slug, e.preOkfUuid));
  }
  return out;
}
