import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import matter from "gray-matter";
import { remark } from "remark";

export const POSTS_DIR = "src/content/blog";
export const OUT_DIR = ".routines/hronir";
export const RATES_DIR = path.join(OUT_DIR, "rates");
// RFC 0015 (single-file model): where active, not-yet-decided challengers
// live once a slug has flattened to `<slug>.mdx` — outside the content
// collection, so an open competition never adds a file under POSTS_DIR.
export const DRAFTS_DIR = path.join(OUT_DIR, "drafts");

const HRONIR_NAMESPACE = "6f8a3c1e-2b94-5d7f-9e10-a4c8f2b6d031";

// RFC 0010 §4.3: lifecycle and publication-control fields are excluded from
// the version UUID so that migration stamps, draft-commit metadata and
// publish/unpublish toggles never change a version's identity. RFC 0014
// adds `type` (OKF concept type) and `docType` (renamed document taxonomy,
// formerly `type`) to the exclusion — they're classification, not
// version-defining content, and excluding them keeps future edits to either
// field from churning identity again.
const UUID_EXCLUDED_FIELDS = new Set([
  "draftCreatedAt",
  "draftCommittedAt",
  "draftMsg",
  "supersedes",
  "previousVersion",
  "draft",
  "publishDate",
  "type",
  "docType",
  "slug",
]);

// Pre-RFC-0014 exclusion set (without type/docType), used to reconstruct
// the identity hash exactly as it was computed before that migration.
const PRE_OKF_EXCLUDED_FIELDS = new Set([
  "draftCreatedAt",
  "draftCommittedAt",
  "draftMsg",
  "supersedes",
  "previousVersion",
  "draft",
  "publishDate",
]);

function uuidv5(name: string, namespace: string): string {
  const nsBytes = Buffer.from(namespace.replace(/-/g, ""), "hex");
  const hash = crypto.createHash("sha1").update(nsBytes).update(name).digest();
  const bytes = Buffer.from(hash.slice(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function listPosts(dir: string = POSTS_DIR): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listPosts(full));
    } else if (/\.mdx?$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

export function readPost(filePath: string): Record<string, unknown> {
  const raw = fs.readFileSync(filePath, "utf8");
  const { data } = matter(raw);
  return data;
}

export function keyForPath(filePath: string): string {
  const data = readPost(filePath);
  if (data.translationKey) return String(data.translationKey);
  const base = path.basename(filePath).replace(/\.mdx?$/, "");
  if (base === "index" || base.startsWith("v-")) {
    return path.basename(path.dirname(filePath));
  }
  return base;
}

export function listVersions(anyPathInFolder: string): string[] {
  const dir = path.dirname(anyPathInFolder);
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isFile() && /\.mdx?$/.test(entry.name)) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

// Publication predicate shared by match sampling: a post is publishable
// unless it is marked draft or has a publishDate in the future.
export function isPublishedData(data: Record<string, unknown>): boolean {
  if (data.draft === true) return false;
  if (data.publishDate) {
    const pub = new Date(String(data.publishDate));
    if (!isNaN(pub.getTime()) && pub > new Date()) return false;
  }
  return true;
}

// RFC 0010 §4.7: the remark pipeline is the UUID hotspot — listDirVersions
// recomputes identities for every version file, several times per command.
// Both UUIDs share the normalized body, so one parse + one remark run yields
// both; the entry is keyed by (mtime, size) so an edited file recomputes.
interface UuidCacheEntry {
  mtimeMs: number;
  size: number;
  uuid: string;
  legacyUuid: string;
  preOkfUuid: string;
}
const _uuidCache = new Map<string, UuidCacheEntry>();

function buildMeta(
  data: Record<string, unknown>,
  excluded: Set<string>
): Record<string, unknown> {
  const meta: Record<string, unknown> = {};
  for (const k of Object.keys(data).sort()) {
    if (excluded.has(k)) continue;
    const v = data[k];
    meta[k] = v instanceof Date ? v.toISOString() : v;
  }
  return meta;
}

// RFC 0014: reconstructs the frontmatter exactly as it stood before that
// migration — drops the new `type` (OKF concept type) and restores the
// renamed `docType` back to its original key `type` — so
// PRE_OKF_EXCLUDED_FIELDS (which never excluded `type`) reproduces the
// identical historical meta object, key order included.
function preOkfData(data: Record<string, unknown>): Record<string, unknown> {
  const restored: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (k === "type") continue;
    if (k === "docType") {
      restored.type = v;
      continue;
    }
    restored[k] = v;
  }
  return restored;
}

/** Core identity computation, shared by the file-backed path (uuidsFor,
 *  memoized by mtime/size) and the blob-backed path (uuidsForBlob, for
 *  content read via git plumbing instead of the filesystem — RFC 0015
 *  single-file model, where a version that lost its duel only survives as a
 *  git blob, not a file). */
function uuidsFromRaw(raw: string): Omit<UuidCacheEntry, "mtimeMs" | "size"> {
  const { data, content } = matter(raw);
  const body = remark()
    .processSync(content)
    .toString()
    .replace(/\r\n/g, "\n")
    .trim();
  const meta = buildMeta(data, UUID_EXCLUDED_FIELDS);
  const preOkfMeta = buildMeta(preOkfData(data), PRE_OKF_EXCLUDED_FIELDS);
  return {
    uuid: uuidv5(body + "\n\u0000" + JSON.stringify(meta), HRONIR_NAMESPACE),
    legacyUuid: uuidv5(body, HRONIR_NAMESPACE),
    preOkfUuid: uuidv5(
      body + "\n\u0000" + JSON.stringify(preOkfMeta),
      HRONIR_NAMESPACE
    ),
  };
}

function uuidsFor(filePath: string): UuidCacheEntry | null {
  let st: fs.Stats;
  try {
    st = fs.statSync(filePath);
  } catch {
    return null;
  }
  const hit = _uuidCache.get(filePath);
  if (hit && hit.mtimeMs === st.mtimeMs && hit.size === st.size) return hit;

  const raw = fs.readFileSync(filePath, "utf8");
  const entry: UuidCacheEntry = {
    mtimeMs: st.mtimeMs,
    size: st.size,
    ...uuidsFromRaw(raw),
  };
  _uuidCache.set(filePath, entry);
  return entry;
}

// ── Git-blob-backed reads (RFC 0015 single-file model) ──────────────────────
//
// Once a slug flattens to `<slug>.mdx`, a version that lost its duel stops
// being a file — its content only survives as a git blob. These mirror the
// file-backed primitives above but take a blob sha instead of a path.

const _blobCache = new Map<string, Omit<UuidCacheEntry, "mtimeMs" | "size">>();

/** Blob sha for the file at `filePath`, and — critically — persists that
 *  blob into `.git/objects/` right now (`-w`), not just computes the hash.
 *  Plain `git hash-object` (no `-w`) only prints what the sha *would* be; it
 *  writes nothing. For a file whose content was already committed earlier
 *  (the normal case — fold-back/prune only touch already-duel-tested
 *  versions), the object already exists and this is a no-op re-hash. But
 *  relying on that is fragile — a version's blob is only *guaranteed*
 *  retrievable later via `readBlob` if something actually wrote it, and
 *  `-w` makes that true unconditionally instead of "true unless the file
 *  was somehow never committed as this exact content." */
export function blobShaForPath(filePath: string): string {
  return execFileSync("git", ["hash-object", "-w", filePath], {
    stdio: ["ignore", "pipe", "ignore"],
  })
    .toString()
    .trim();
}

/** Raw content of a git blob (`git cat-file -p`). Throws if `sha` isn't a
 *  reachable object — callers register a blob's sha only right after
 *  hashing it from a real file, so an unreadable blob means repo corruption
 *  or a shallow clone missing the object, not a normal "not found" case. */
export function readBlob(sha: string): string {
  return execFileSync("git", ["cat-file", "-p", sha], {
    stdio: ["ignore", "pipe", "ignore"],
    maxBuffer: 16 * 1024 * 1024,
  }).toString();
}

/** Parsed frontmatter of a git blob, same shape `readPost` returns for a
 *  file. */
export function readPostFromBlob(sha: string): Record<string, unknown> {
  const { data } = matter(readBlob(sha));
  return data;
}

function uuidsForBlob(sha: string): Omit<UuidCacheEntry, "mtimeMs" | "size"> {
  const hit = _blobCache.get(sha);
  if (hit) return hit;
  const entry = uuidsFromRaw(readBlob(sha));
  _blobCache.set(sha, entry);
  return entry;
}

export function getPostUuidFromBlob(sha: string): string {
  return uuidsForBlob(sha).uuid;
}
export function getPostUuidLegacyFromBlob(sha: string): string {
  return uuidsForBlob(sha).legacyUuid;
}
export function getPostUuidPreOkfTypeFromBlob(sha: string): string {
  return uuidsForBlob(sha).preOkfUuid;
}

/** Version identity (RFC 0010 §4.3): UUIDv5 over the normalized body plus the
 *  version-relevant frontmatter, excluding lifecycle/publication-control
 *  fields. Two versions that differ only in title/description/etc. get
 *  distinct UUIDs; stamping draftCommittedAt or toggling draft does not
 *  change identity. */
export function getPostUuid(filePath: string): string | null {
  return uuidsFor(filePath)?.uuid ?? null;
}

/** Pre-RFC-0010 identity: UUIDv5 over the normalized body only. Rate files
 *  written under stars-v1 carry this value in post_a/b.version; readers fall
 *  back to it when the current UUID has no recorded duels. */
export function getPostUuidLegacy(filePath: string): string | null {
  return uuidsFor(filePath)?.legacyUuid ?? null;
}

/** Pre-RFC-0014 identity: UUIDv5 as computed before the OKF `type`/`docType`
 *  migration (§ RFC 0014) — reconstructs the historical frontmatter (drops
 *  `type`, restores `docType` to `type`) so rate files recorded before that
 *  migration still resolve. Readers fall back to it when neither the
 *  current UUID nor the legacy UUID has recorded duels. */
export function getPostUuidPreOkfType(filePath: string): string | null {
  return uuidsFor(filePath)?.preOkfUuid ?? null;
}
