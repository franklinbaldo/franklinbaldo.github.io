import fs from "node:fs";
import path from "node:path";
import {
  POSTS_DIR,
  DRAFTS_DIR,
  readPost,
  getPostUuid,
  getPostUuidLegacy,
  getPostUuidPreOkfType,
  isPublishedData,
  blobShaForPath,
} from "./posts.js";
import { registerHistory, type HistoryEntry } from "./history.js";

// RFC 0010 §4.2 (amended 2026-07-01): the published version of each post is
// not a privileged filename but an entry in this generated JSON. Gitignored,
// not committed — select() is a pure function of rate files + version files
// (no hysteresis, no memory of any prior selection), so `prebuild` can
// regenerate it deterministically before every build. It must also be
// regenerated locally (uncommitted) before any other hronir command in a
// fresh checkout, since e.g. `hronir:init` reads it via
// listEnglishWithKey(). The site loader and every script read it;
// `hronir:select` is the only writer.
export const SELECTION_PATH = "src/generated/versions-selected.json";
export const SELECTION_SCHEMA = "selection-v1";

export interface SelectionEntry {
  /** Path relative to src/content/blog, e.g. "vos/v-2026-06-10T02-12-45.mdx". */
  file: string;
  /** Content UUID of the selected version (RFC 0010 §4.3 definition). */
  uuid: string;
}

export type SelectionEntries = Record<string, SelectionEntry>;

// Each CLI invocation is a fresh process, so a module-level memo is safe;
// writeSelection refreshes it.
let _selectionCache: SelectionEntries | null = null;

export function readSelection(): SelectionEntries {
  if (_selectionCache) return _selectionCache;
  if (!fs.existsSync(SELECTION_PATH)) return {};
  // Only a genuinely absent (pre-migration) file means "empty selection".
  // A present-but-unparseable file (merge conflict, partial write) must
  // abort: returning {} would make select() treat every post as a debut
  // and overwrite the ranking-driven selection with newest-publishable
  // picks, hiding the corruption.
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(fs.readFileSync(SELECTION_PATH, "utf8"));
  } catch (e) {
    throw new Error(
      `${SELECTION_PATH} existe mas não parseia (${(e as Error).message}). ` +
        "Resolva o conflito/corrupção manualmente antes de rodar comandos hronir."
    );
  }
  // The same goes for parseable schema corruption: writeSelection (the only
  // writer) always emits _meta.schema and complete {file, uuid} entries, so
  // anything else is a damaged manifest — silently dropping an entry would
  // make select() treat that slug as a debut and swap live content.
  const meta = parsed._meta as { schema?: unknown } | undefined;
  if (meta?.schema !== SELECTION_SCHEMA) {
    throw new Error(
      `${SELECTION_PATH}: _meta.schema esperado "${SELECTION_SCHEMA}", encontrado ${JSON.stringify(meta?.schema)}. ` +
        "Repare o manifesto manualmente antes de rodar comandos hronir."
    );
  }
  const entries: SelectionEntries = {};
  for (const [slug, v] of Object.entries(parsed)) {
    if (slug === "_meta") continue;
    const e = v as SelectionEntry;
    if (!e || typeof e.file !== "string" || typeof e.uuid !== "string") {
      throw new Error(
        `${SELECTION_PATH}: entrada inválida para "${slug}" (esperado {file, uuid}). ` +
          "Repare o manifesto manualmente antes de rodar comandos hronir."
      );
    }
    entries[slug] = e;
  }
  _selectionCache = entries;
  return entries;
}

/** Idempotent write (RFC 0010 §4.2): compares the new slug→{file,uuid}
 *  mapping with the current file ignoring _meta.generatedAt; only writes —
 *  and only advances generatedAt — when at least one selection changed.
 *  Returns true when the file was (re)written. */
export function writeSelection(entries: SelectionEntries): boolean {
  const current = readSelection();
  const same =
    Object.keys(current).length === Object.keys(entries).length &&
    Object.entries(entries).every(
      ([slug, e]) =>
        current[slug] &&
        current[slug].file === e.file &&
        current[slug].uuid === e.uuid
    );
  if (same && fs.existsSync(SELECTION_PATH)) return false;

  const out: Record<string, unknown> = {
    _meta: { schema: SELECTION_SCHEMA, generatedAt: new Date().toISOString() },
  };
  for (const slug of Object.keys(entries).sort()) out[slug] = entries[slug];
  fs.mkdirSync(path.dirname(SELECTION_PATH), { recursive: true });
  fs.writeFileSync(SELECTION_PATH, JSON.stringify(out, null, 2) + "\n");
  _selectionCache = { ...entries };
  return true;
}

export function selectedPathForSlug(slug: string): string | null {
  const e = readSelection()[slug];
  if (!e) return null;
  const p = path.join(POSTS_DIR, e.file);
  return fs.existsSync(p) ? p : null;
}

/** Selected version file for the directory containing `anyPathInFolder`,
 *  or null when the directory has no selection. */
export function selectedPathForDir(anyPathInFolder: string): string | null {
  return selectedPathForSlug(path.basename(path.dirname(anyPathInFolder)));
}

export interface VersionInfo {
  slug: string;
  /** Absolute-ish repo path, e.g. src/content/blog/vos/v-....mdx */
  path: string;
  /** Path relative to src/content/blog. */
  file: string;
  uuid: string;
  legacyUuid: string;
  preOkfUuid: string;
  selected: boolean;
  published: boolean;
  draftCreatedAt: string | null;
  translationKey: string | null;
  lang: string;
}

/** Every version file in a post directory, selection-annotated. */
export function listDirVersions(slug: string): VersionInfo[] {
  const dir = path.join(POSTS_DIR, slug);
  if (!fs.existsSync(dir)) return [];
  const selection = readSelection();
  const selectedFile = selection[slug]?.file ?? null;
  const out: VersionInfo[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile() || !/\.mdx?$/.test(entry.name)) continue;
    const p = path.join(dir, entry.name);
    const data = readPost(p);
    out.push({
      slug,
      path: p,
      file: `${slug}/${entry.name}`,
      uuid: getPostUuid(p)!,
      legacyUuid: getPostUuidLegacy(p)!,
      preOkfUuid: getPostUuidPreOkfType(p)!,
      selected: selectedFile === `${slug}/${entry.name}`,
      published: isPublishedData(data),
      draftCreatedAt: data.draftCreatedAt ? String(data.draftCreatedAt) : null,
      translationKey: data.translationKey ? String(data.translationKey) : null,
      lang: data.lang ? String(data.lang) : "en",
    });
  }
  // v-<timestamp> names sort chronologically; newest last.
  out.sort((a, b) => a.file.localeCompare(b.file));
  return out;
}

/** All post directories (slugs) that contain at least one version file.
 *  Legacy layout only — a flattened slug (single `<slug>.mdx` file, RFC
 *  0015) has no directory to find here. See `listAllVersionSlugs`. */
export function listVersionSlugs(): string[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(POSTS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(POSTS_DIR, entry.name);
    const hasVersion = fs
      .readdirSync(dir)
      .some((f) => /\.mdx?$/.test(f) && /^(v-|index\.)/.test(f));
    if (hasVersion) out.push(entry.name);
  }
  return out.sort();
}

// ── RFC 0015 single-file model: dual-layout reads ────────────────────────────
//
// A slug is in exactly one of two layouts at any time:
//   - legacy: src/content/blog/<slug>/{v-*,index}.{md,mdx} + an entry in
//     versions-selected.json says which sibling is canonical.
//   - flat: src/content/blog/<slug>.{md,mdx} IS the canonical, directly —
//     no selection entry needed. Open challengers (RFC 0015 §3.2/§5) live
//     outside the content collection, in .routines/hronir/drafts/<slug>/,
//     so an active competition never adds a file under POSTS_DIR.
//
// Every function below handles both without the caller needing to know
// which one a given slug is in — this is what lets consumer rewrites (Fase
// 3) ship independently of flattening (Fase 1): a slug becomes flat the
// moment something moves its file, and every reader here picks that up
// automatically, no coordinated flag day required.

/** The flat canonical file for `slug`, or null if it isn't flattened yet. */
export function flatCanonicalPath(slug: string): string | null {
  for (const ext of [".mdx", ".md"]) {
    const p = path.join(POSTS_DIR, `${slug}${ext}`);
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  }
  return null;
}

function toVersionInfo(
  slug: string,
  p: string,
  file: string,
  selected: boolean
): VersionInfo {
  const data = readPost(p);
  return {
    slug,
    path: p,
    file,
    uuid: getPostUuid(p)!,
    legacyUuid: getPostUuidLegacy(p)!,
    preOkfUuid: getPostUuidPreOkfType(p)!,
    selected,
    published: isPublishedData(data),
    draftCreatedAt: data.draftCreatedAt ? String(data.draftCreatedAt) : null,
    translationKey: data.translationKey ? String(data.translationKey) : null,
    lang: data.lang ? String(data.lang) : "en",
  };
}

/** Every open challenger for a flattened slug — files in
 *  .routines/hronir/drafts/<slug>/, the flat-layout equivalent of the
 *  non-selected siblings a legacy directory holds.
 *
 *  Self-healing: a draft whose uuid now matches `canonicalUuid` is a stray
 *  left behind by a `foldBack` that crashed after its atomic rename but
 *  before it removed the draft (see `foldBack`) — by definition it already
 *  "won" (its content IS the canonical now), so it's deleted on sight
 *  instead of being surfaced as a live competitor. This is what makes
 *  foldBack's crash window safe to leave unhandled inside foldBack itself:
 *  every reader of this list independently converges the state. */
function listDraftsForSlug(slug: string, canonicalUuid: string): VersionInfo[] {
  const dir = path.join(DRAFTS_DIR, slug);
  if (!fs.existsSync(dir)) return [];
  const out: VersionInfo[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile() || !/\.mdx?$/.test(entry.name)) continue;
    const p = path.join(dir, entry.name);
    const v = toVersionInfo(slug, p, `${slug}/${entry.name}`, false);
    if (v.uuid === canonicalUuid) {
      fs.unlinkSync(p);
      continue;
    }
    out.push(v);
  }
  out.sort((a, b) => a.file.localeCompare(b.file));
  return out;
}

/** Dual-mode replacement for `listDirVersions`: every version of `slug`
 *  (canonical + open challengers) regardless of which layout it's in. */
export function listSlugVersions(slug: string): VersionInfo[] {
  const flat = flatCanonicalPath(slug);
  if (flat) {
    const canonical = toVersionInfo(slug, flat, path.basename(flat), true);
    return [canonical, ...listDraftsForSlug(slug, canonical.uuid)];
  }
  return listDirVersions(slug);
}

/** Dual-mode replacement for `listVersionSlugs`: every slug with at least
 *  one version, flat or legacy. */
export function listAllVersionSlugs(): string[] {
  const out = new Set(listVersionSlugs());
  if (fs.existsSync(POSTS_DIR)) {
    for (const entry of fs.readdirSync(POSTS_DIR, { withFileTypes: true })) {
      if (!entry.isFile() || !/\.mdx?$/.test(entry.name)) continue;
      out.add(entry.name.replace(/\.mdx?$/, ""));
    }
  }
  return [...out].sort();
}

/** Slug that owns a content path, for either layout: a flat canonical
 *  (`src/content/blog/<slug>.mdx`), a draft
 *  (`.routines/hronir/drafts/<slug>/v-....mdx`), or a legacy sibling
 *  (`src/content/blog/<slug>/v-....mdx`). Replaces the
 *  `path.basename(path.dirname(p))` pattern, which only ever gave the right
 *  answer for the legacy/draft shapes — for a flat canonical it returns the
 *  containing directory name ("blog"), not the slug. */
export function slugForContentPath(p: string): string {
  const norm = p.split(path.sep).join("/");
  if (norm.startsWith(POSTS_DIR + "/")) {
    const rel = norm.slice(POSTS_DIR.length + 1);
    if (!rel.includes("/")) return rel.replace(/\.mdx?$/, ""); // flat canonical
  }
  return path.basename(path.dirname(p)); // draft or legacy sibling
}

/** Every slug's canonical version, dual-mode (flat file directly, or
 *  whichever legacy sibling versions-selected.json currently names). */
function allCanonicals(): VersionInfo[] {
  const out: VersionInfo[] = [];
  for (const slug of listAllVersionSlugs()) {
    const canonical = listSlugVersions(slug).find((v) => v.selected);
    if (canonical) out.push(canonical);
  }
  return out;
}

/** Selected, published EN posts with a translationKey — the cross-essay
 *  tournament pool (RFC 0010 §4.6). */
export function listEnglishWithKey(): Array<{
  path: string;
  translationKey: string;
}> {
  const out: Array<{ path: string; translationKey: string }> = [];
  for (const v of allCanonicals()) {
    if (v.lang !== "en") continue;
    if (!v.translationKey) continue;
    if (!v.published) continue;
    out.push({ path: v.path, translationKey: v.translationKey });
  }
  return out;
}

/** Selected versions of every language variant sharing a translationKey. */
export function findTranslations(
  translationKey: string,
  { publishedOnly = false }: { publishedOnly?: boolean } = {}
): Array<{ path: string; lang: string }> {
  const out: Array<{ path: string; lang: string }> = [];
  for (const v of allCanonicals()) {
    if (!v.translationKey) continue;
    if (v.translationKey !== String(translationKey)) continue;
    if (publishedOnly && !v.published) continue;
    out.push({ path: v.path, lang: v.lang });
  }
  return out;
}

// ── Fold-back: the atomic winner-replaces-canonical swap ────────────────────
//
// RFC 0010's `promote`/`promoteFile` did rename-then-write-then-unlink; a
// crash between steps could leave a slug with no canonical file at all, or
// with two files claiming the same UUID (achado V3 — RFC 0010 §4.7). RFC
// 0010 sidestepped the whole problem by never physically swapping content
// (selection is just a pointer in versions-selected.json). The flat layout
// has no pointer to swap — the canonical's identity IS its path — so this
// is the one place the single-file model needs a mechanism RFC 0010 could
// avoid needing at all.
//
// The fix: write-then-atomic-rename, register-before-mutate. At every point
// during and after a crash, `<slug>.mdx` exists and has *some* valid
// version's content — the file is simply never absent, which is the
// specific failure achado V3 described. See __tests__/fold-back.test.js for
// the crash-injection test (kill the write, kill the rename, kill the
// unlink) that proves this — RFC 0015 §3.2/§4 flagged this repo as having
// no precedent for that kind of test; this is that precedent.

function historyEntryFor(v: VersionInfo, sha: string): HistoryEntry {
  const data = readPost(v.path);
  return {
    slug: v.slug,
    uuid: v.uuid,
    legacyUuid: v.legacyUuid,
    preOkfUuid: v.preOkfUuid,
    lang: v.lang,
    sha,
    path: v.path,
    title: data.title ? String(data.title) : "",
    description: data.description ? String(data.description) : "",
    date: data.date ? String(data.date) : null,
    draftCommittedAt: data.draftCommittedAt
      ? String(data.draftCommittedAt)
      : null,
    draftMsg: data.draftMsg ? String(data.draftMsg) : null,
    commitSha: null,
    archivedAt: new Date().toISOString(),
  };
}

/** Atomically replaces `slug`'s flat canonical with `winner`'s content,
 *  archives the outgoing canonical to history, and removes the winning
 *  draft file. `winner` must come from `listSlugVersions(slug)` (a live
 *  draft) — `winner.selected === true` is treated as an idempotent no-op
 *  (already canonical, nothing to do), not an error, so callers don't need
 *  to special-case "the current leader is already in front". Throws if
 *  `slug` isn't flattened yet (fold-back only makes sense once there's a
 *  single canonical path to swap into — a legacy directory has no such
 *  target). */
export function foldBack(slug: string, winner: VersionInfo): void {
  if (winner.slug !== slug) {
    throw new Error(
      `foldBack: winner.slug (${winner.slug}) !== slug (${slug})`
    );
  }
  if (winner.selected) return;

  const canonicalPath = flatCanonicalPath(slug);
  if (!canonicalPath) {
    throw new Error(
      `foldBack: "${slug}" ainda não está achatado (sem ${POSTS_DIR}/${slug}.md(x)).`
    );
  }

  // Register BEFORE mutating anything (same discipline `prune()` already
  // uses, RFC 0010 §4.4): a crash after this line at worst leaves an
  // unused history entry lying around. A crash before it, with the swap
  // half-done, would leave a version archived nowhere.
  const outgoing = toVersionInfo(
    slug,
    canonicalPath,
    path.basename(canonicalPath),
    true
  );
  const outgoingSha = blobShaForPath(canonicalPath);
  registerHistory([historyEntryFor(outgoing, outgoingSha)]);

  // Write-then-rename: `canonicalPath` holds valid content (old or new)
  // at every instant, including mid-crash — `rename` is atomic when both
  // paths are on the same filesystem, which same-directory always is.
  const winnerRaw = fs.readFileSync(winner.path, "utf8");
  const tmpPath = path.join(
    path.dirname(canonicalPath),
    `.${path.basename(canonicalPath)}.tmp-${process.pid}-${Date.now()}`
  );
  fs.writeFileSync(tmpPath, winnerRaw);
  fs.renameSync(tmpPath, canonicalPath);

  // Only reachable after the rename committed — a crash here leaves a
  // stray draft whose uuid now equals the canonical's; listDraftsForSlug's
  // self-heal check cleans it up on the next read, so this line failing to
  // run isn't a correctness problem, only a tidiness one.
  fs.unlinkSync(winner.path);
}
