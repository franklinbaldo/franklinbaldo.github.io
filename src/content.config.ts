import { existsSync, readFileSync } from "node:fs";
import { defineCollection, z, type SchemaContext } from "astro:content";
import { glob, type Loader } from "astro/loaders";
import { listAllVersionSlugs, flatCanonicalPath } from "./hronir/selection.js";
import { generateBlogId } from "./lib/blog-id.js";
import { slugFor, parseTags } from "./lib/suno-music.js";

type SunoCatalogRecord = {
  id: string;
  title: string;
  lyricsPrompt: string;
  styleTags: string;
  durationSeconds: number | null;
  imageUrl: string | null;
  isPublic: boolean;
  createdAt: string | null;
};

// Music posts are pure derived data: raw Suno API responses live in
// data/suno-catalog.jsonl (synced daily by scripts/sync-suno-catalog.mjs)
// and are rendered into blog-collection entries here, at build time — they
// never touch disk as .mdx. This sidesteps an entire class of bug: there's
// no generated MDX to have invalid syntax in the first place. It also
// means these entries are invisible to src/hronir/selection.ts (which
// walks the filesystem directly), so music posts fall outside Hrönir's
// versioning/ranking system by construction — no filter needed anywhere
// in Hrönir's code for that. A dedicated music-only ranking system (audio
// comparison via Gemini) is planned separately, much later; this loader
// intentionally has no hook for it yet.
const musicLoader: Loader = {
  name: "suno-music-jsonl",
  load: async (context) => {
    const path = "./data/suno-catalog.jsonl";
    if (!existsSync(path)) return;
    const raw = readFileSync(path, "utf-8");
    for (const line of raw.split("\n")) {
      if (!line.trim()) continue;
      const clip = JSON.parse(line) as SunoCatalogRecord;
      // Nothing else in this codebase gates on sunoPrivate — this is the
      // one place a private/unpublished Suno song is kept out of the
      // published site. Filtering here, before parseData, means a private
      // clip never even becomes a schema-valid entry, let alone a page.
      if (!clip.isPublic) continue;
      // createdAt is required by postSchema's date field (no default) —
      // a record missing it would otherwise throw and abort the whole
      // collection load for every other entry. Suno always sets this on a
      // real clip; skip and log rather than crash the build if it's ever
      // absent (e.g. a malformed sync).
      if (!clip.createdAt) {
        context.logger.warn(`Suno clip ${clip.id} has no createdAt, skipping`);
        continue;
      }

      const id = slugFor(clip);
      const lyrics = clip.lyricsPrompt.trim();
      const lyricsMd = lyrics
        ? `## Letra\n\n\`\`\`\n${lyrics}\n\`\`\``
        : `## Letra`;
      const rendered = await context.renderMarkdown(lyricsMd);

      const data = await context.parseData({
        id,
        data: {
          type: "Music Post",
          postType: "music",
          title: clip.title || "(sem título)",
          description: `Música de Franklin Baldo — ${clip.title || "sem título"}`,
          date: clip.createdAt,
          sunoId: clip.id,
          genre: parseTags(clip.styleTags),
          duration: clip.durationSeconds ?? undefined,
          sunoImageUrl: clip.imageUrl ?? undefined,
          tags: ["música"],
          lang: "pt",
        },
      });
      context.store.set({ id, data, rendered, digest: context.generateDigest(line) });
    }
  },
};

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

// Schema for the `blog` collection. Draft-lifecycle fields (supersedes,
// draftCreatedAt, draftCommittedAt, draftMsg, previousVersion) are legacy
// from the retired version-duel model (RFC 0003/0010) — no longer written,
// kept optional so already-published posts still validate (RFC 0017
// decision 5; removed from the schema in Fase 2).
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
    /** Public URL override — the post's id (filename-derived, see
     *  generateBlogId) is always the content-collection identity used by
     *  Hrönir/ranking, but the public URL is `slug ?? id`. Lets a
     *  translated post get a real localized slug without renaming its file
     *  (which would also be fine — this exists so translation-only edits
     *  don't require a rename+redirect for a slug fix). */
    slug: z.string().optional(),
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
    /** When "music", the post is a music publication with lyrics.
     *  Triggers the music post layout. */
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
    /** Album art URL from the Suno API. */
    sunoImageUrl: z.string().url().optional(),
    /** Additional Suno renditions of the same music post, beyond the
     *  primary sunoId/genre/sunoStyle/duration/sunoImageUrl above — for a
     *  post that sets the same text to music more than once. Each entry
     *  renders its own player block on the post page and resolves to this
     *  post's URL from the global player. */
    tracks: z
      .array(
        z.object({
          label: z.string(),
          sunoId: z.string(),
          sunoImageUrl: z.string().url().optional(),
          duration: z.number().optional(),
          genre: z
            .array(
              z.string().max(40, "genre label deve ter no máximo 40 caracteres")
            )
            .max(5, "máximo 5 gêneros por track")
            .optional(),
          sunoStyle: z.string().optional(),
        })
      )
      .optional(),
  });

const publishedPattern =
  selectedFiles.length + flatFiles.length > 0
    ? [...selectedFiles, ...flatFiles]
    : ["**/index.{md,mdx}"];

// See generateBlogId (src/lib/blog-id.ts) for what this strips and why —
// legacy folder-per-slug vs. RFC 0015 flat-file both need to end up as
// the bare slug, extension-free.
const globLoader = glob({
  pattern: publishedPattern,
  base: "./src/content/blog",
  generateId: ({ entry }) => generateBlogId(entry),
});

const blog = defineCollection({
  // glob()'s return value already satisfies the Loader interface
  // ({name, load}), so it can be driven directly alongside musicLoader —
  // this is how Music Posts join the same collection as file-backed posts
  // without ever being files themselves.
  loader: {
    name: "blog-with-music",
    load: async (context) => {
      await globLoader.load(context);
      await musicLoader.load(context);
    },
  },
  schema: postSchema,
});

// One entry per release, `changelog/<version>.md` — OKF markdown (`type` is
// the only required field; here always `"Changelog Entry"`). English by
// deliberate exception to the "docs em português" convention (CLAUDE.md
// "Línguas" — dono decidiu, não é engano a corrigir).
const changelog = defineCollection({
  loader: glob({
    pattern: "*.md",
    base: "./changelog",
  }),
  schema: z.object({
    type: z.literal("Changelog Entry"),
    version: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    tags: z.array(z.string()).optional(),
  }),
});

// RFC 0017: o duelo `version` foi eliminado — não há mais versão
// concorrente a servir, nem permalink `/blog/<slug>/v/<uuid>/`. A coleção
// `blogVersions` (RFC 0010/0015) e sua rota foram removidas; enquanto
// restarem diretórios legados não achatados (Fase 1 parcial — ver RFC 0017
// §7), `selectedFiles` acima já cobre o que deve ser publicado.
export const collections = { blog, changelog };
