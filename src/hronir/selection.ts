import fs from "node:fs";
import path from "node:path";
import {
  POSTS_DIR,
  readPost,
  getPostUuid,
  getPostUuidLegacy,
  isPublishedData,
} from "./posts.js";

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

/** All post directories (slugs) that contain at least one version file. */
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

/** Selected, published EN posts with a translationKey — the cross-essay
 *  tournament pool (RFC 0010 §4.6). */
export function listEnglishWithKey(): Array<{
  path: string;
  translationKey: string;
}> {
  const out: Array<{ path: string; translationKey: string }> = [];
  for (const [slug, e] of Object.entries(readSelection())) {
    const p = path.join(POSTS_DIR, e.file);
    if (!fs.existsSync(p)) continue;
    const data = readPost(p);
    const lang = data.lang ? String(data.lang) : "en";
    if (lang !== "en") continue;
    if (!data.translationKey) continue;
    if (!isPublishedData(data)) continue;
    out.push({ path: p, translationKey: String(data.translationKey) });
  }
  return out;
}

/** Selected versions of every language variant sharing a translationKey. */
export function findTranslations(
  translationKey: string,
  { publishedOnly = false }: { publishedOnly?: boolean } = {}
): Array<{ path: string; lang: string }> {
  const out: Array<{ path: string; lang: string }> = [];
  for (const e of Object.values(readSelection())) {
    const p = path.join(POSTS_DIR, e.file);
    if (!fs.existsSync(p)) continue;
    const data = readPost(p);
    if (!data.translationKey) continue;
    if (String(data.translationKey) !== String(translationKey)) continue;
    if (publishedOnly && !isPublishedData(data)) continue;
    out.push({ path: p, lang: data.lang ? String(data.lang) : "en" });
  }
  return out;
}
