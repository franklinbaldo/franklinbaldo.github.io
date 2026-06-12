import { existsSync, readFileSync } from "node:fs";
import { defineCollection, z, type SchemaContext } from "astro:content";
import { glob } from "astro/loaders";

// RFC 0010: the published version of each post is whatever
// versions-selected.json points at — selection is a generated, committed
// artifact (written by `hronir:select`), not a privileged filename.
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
     *  Optional — posts without a type remain valid and appear unfiltered. */
    type: z
      .enum(["essay", "letter", "fiction", "technical", "dialogue"])
      .optional(),
    /** When "music", the post is a music publication with lyrics and
     *  composer notes. Triggers the music post layout. */
    postType: z.literal("music").optional(),
    /** Suno song UUID — used to load audio in the global player. */
    sunoId: z.string().optional(),
    /** Music genres/styles for display. */
    genre: z.array(z.string()).optional(),
    /** Song duration in seconds. */
    duration: z.number().optional(),
    /** Album art URL from the Suno API (stored at stub-generation time). */
    sunoImageUrl: z.string().url().optional(),
  });

const blog = defineCollection({
  // RFC 0010: each post lives in its own folder <slug>/ holding peer version
  // files (v-<timestamp>.md). The collection loads exactly the version that
  // versions-selected.json picks per slug. generateId strips the version
  // filename so the id stays the flat slug, preserving every existing URL.
  loader: glob({
    pattern: selectedFiles.length > 0 ? selectedFiles : "**/index.{md,mdx}",
    base: "./src/content/blog",
    generateId: ({ entry }) => entry.replace(/\/(v-[^/]+|index)\.mdx?$/, ""),
  }),
  schema: postSchema,
});

// RFC 0010: every non-selected version (challengers + ex-selected). Served at
// /blog/<slug>/v/<uuid> (noindex, canonical → live). The id keeps the folder
// path so the post slug = dirname(id).
const blogVersions = defineCollection({
  loader: glob({
    pattern: ["**/v-*.{md,mdx}", ...selectedFiles.map((f) => `!${f}`)],
    base: "./src/content/blog",
    generateId: ({ entry }) => entry.replace(/\.mdx?$/, ""),
  }),
  schema: postSchema,
});

export const collections = { blog, blogVersions };
