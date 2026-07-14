import { existsSync, readFileSync } from "node:fs";
import { defineCollection, z, type SchemaContext } from "astro:content";
import { glob } from "astro/loaders";
import { listAllVersionSlugs, flatCanonicalPath } from "./hronir/selection.js";
import { generateBlogId } from "./lib/blog-id.js";

// RFC 0010 (amended 2026-07-01): the published version of a *legacy*-layout
// post is whatever versions-selected.json points at — selection is a
// generated artifact (written by `hronir:select`, run via `prebuild`), not
// a privileged filename. The file is gitignored, not committed — select()
// is a pure function of rate files + version files, no hysteresis.
const selectedFiles: string[] = [];
if (existsSync("./src/generated/versions-selected.json")) {
  // Present-but-unparseable must fail the build: silently falling back to
  // the index.* glob would publish an empty (or wrong) blog collection.
  const sel = JSON.parse(
    readFileSync("./src/generated/versions-selected.json", "utf-8")
  ) as Record<string, { file?: string }>;
  for (const [slug, entry] of Object.entries(sel)) {
    if (slug === "_meta" || !entry?.file) continue;
    selectedFiles.push(entry.file);
  }
}
// Absent file = pre-migration tree: fall back to the RFC 0003 index.* layout.

// RFC 0015 (single-file model): a flattened slug's canonical IS
// `<slug>.mdx` directly — it never appears in versions-selected.json
// (select() skips it; see commands.ts). Reusing flatCanonicalPath here
// instead of a bare `*.{md,mdx}` glob matters: two pre-existing slugs
// (delegando-para-agentes, the-art-of-delegation) have an orphan loose
// file at the content root *alongside* their real legacy directory (RFC
// 0015 §1) — a naive root-level glob would wrongly publish that stale
// orphan instead of the real, still-versioned content. flatCanonicalPath
// already resolves that ambiguity (a real legacy directory always wins),
// so this list can never collide with `selectedFiles` above.
const flatFiles = listAllVersionSlugs()
  .map((slug) => flatCanonicalPath(slug))
  .filter((p): p is string => p !== null)
  .map((p) => p.replace(/^src\/content\/blog\//, ""));

// Shared schema for canonical posts (blog) and their non-canonical versions
// (blogVersions). RFC 0003: a version file is a frozen copy of a canonical, so
// it satisfies the same shape plus a few draft-lifecycle markers.
const postSchema = ({ image }: SchemaContext) =>
  z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().optional(),
    publishDate: z.coerce.date().optional(),
    tags: z.array(z.string()).optional(),
    heroImage: image().optional(),
    heroImageAlt: z.string().optional(),
    lang: z.enum(["en", "pt"]).optional(),
    author: z.string().optional(),
    translationKey: z.string().optional(),
    /** RFC 0003: content UUID of the version this one superseded when it was
     *  promoted to canonical. Lineage lives in-repo as sibling version files. */
    supersedes: z.string().optional(),
    /** RFC 0003 draft-lifecycle markers (set by draft-worst / draft-commit). */
    draftCreatedAt: z.string().optional(),
    draftCommittedAt: z.string().optional(),
    draftMsg: z.string().optional(),
    series: z.string().optional(),
    seriesOrder: z.number().optional(),
    featured: z.boolean().optional(),
    featuredReason: z.string().optional(),
    /** Single emoji that represents the post — used to steer the AI
     *  prompt for the social-card QR code and as the centerpiece in
     *  the fallback plain QR. */
    emoji: z.string().optional(),
    /** Legacy linked-list pointer to the immediately previous version (a
     *  GitHub permalink). Superseded by RFC 0003 in-repo versions, but kept
     *  for posts edited under the old flow. */
    previousVersion: z
      .object({
        uuid: z.string(),
        url: z.string().url(),
        timestamp: z.string(),
        msg: z.string(),
      })
      .optional(),
    /** Document taxonomy: essay, letter, fiction, technical, or dialogue.
     *  Optional — posts without a docType remain valid and appear unfiltered. */
    docType: z
      .enum(["essay", "letter", "fiction", "technical", "dialogue"])
      .optional(),
    /** OKF (RFC 0014) concept type — every post is either a Blog Post or a
     *  Music Post. Excluded from the version-identity hash (posts.ts
     *  UUID_EXCLUDED_FIELDS), same as docType: it's a classification, not
     *  version-defining content. */
    type: z.enum(["Blog Post", "Music Post"]),
    /** When "music", the post is a music publication with lyrics and
     *  composer notes. Triggers the music post layout. */
    postType: z.literal("music").optional(),
    /** Suno song UUID — used to load audio in the global player. */
    sunoId: z.string().optional(),
    /** RFC 0011: short canonical genre labels (max 40 chars, max 5 items).
     *  Use sunoStyle for the full Suno prompt description. */
    genre: z
      .array(z.string().max(40, "genre label deve ter no máximo 40 caracteres"))
      .max(5, "máximo 5 gêneros por post")
      .optional(),
    /** RFC 0011: full Suno style/prompt description, free-form text. */
    sunoStyle: z.string().optional(),
    /** Song duration in seconds. */
    duration: z.number().optional(),
    /** Album art URL from the Suno API (stored at stub-generation time). */
    sunoImageUrl: z.string().url().optional(),
  });

const publishedPattern =
  selectedFiles.length + flatFiles.length > 0
    ? [...selectedFiles, ...flatFiles]
    : ["**/index.{md,mdx}"];

const blog = defineCollection({
  // See generateBlogId (src/lib/blog-id.ts) for what this strips and why —
  // legacy folder-per-slug vs. RFC 0015 flat-file both need to end up as
  // the bare slug, extension-free.
  loader: glob({
    pattern: publishedPattern,
    base: "./src/content/blog",
    generateId: ({ entry }) => generateBlogId(entry),
  }),
  schema: postSchema,
});

// RFC 0010: every non-selected legacy-layout version (challengers +
// ex-selected). Served at /blog/<slug>/v/<uuid> (noindex, canonical →
// live). The id keeps the folder path so the post slug = dirname(id).
//
// RFC 0015: a flat slug's open challengers (.routines/hronir/drafts/) are
// deliberately NOT in this collection — they don't get a live permalink
// page while still competing (a real gap vs. legacy behavior, not an
// oversight: closing it needs a second base directory, astro/loaders'
// glob() only takes one). Once a flat-slug version is folded back or
// pruned, it's archived in versions-history.json and the /v/<uuid> route
// resolves it from there directly (see [uuid].astro), no collection entry
// required — that's the path that actually matters (permalinks must
// survive after the fact; mid-competition drafts don't need to).
const blogVersions = defineCollection({
  loader: glob({
    pattern: ["**/v-*.{md,mdx}", ...selectedFiles.map((f) => `!${f}`)],
    base: "./src/content/blog",
    generateId: ({ entry }) => entry.replace(/\.mdx?$/, ""),
  }),
  schema: postSchema,
});

export const collections = { blog, blogVersions };
