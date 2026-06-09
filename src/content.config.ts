import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  // RFC 0003: each post lives in its own folder <slug>/, where the canonical
  // (published) version is index.md(x). Non-canonical versions are sibling
  // files (v-<timestamp>.md) that don't match this glob → invisible to Astro.
  // generateId strips the trailing /index so the id stays the flat slug,
  // preserving every existing URL.
  loader: glob({
    pattern: "**/index.{md,mdx}",
    base: "./src/content/blog",
    generateId: ({ entry }) => entry.replace(/\/index\.mdx?$/, ""),
  }),
  schema: ({ image }) =>
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
      series: z.string().optional(),
      seriesOrder: z.number().optional(),
      featured: z.boolean().optional(),
      featuredReason: z.string().optional(),
      /** Single emoji that represents the post — used to steer the AI
       *  prompt for the social-card QR code and as the centerpiece in
       *  the fallback plain QR. */
      emoji: z.string().optional(),
      /** Linked-list pointer to the immediately previous version of this
       *  post. `url` is a GitHub permalink to the file at the commit
       *  before this edit landed; following it shows the prior version,
       *  which itself carries its own `previousVersion` pointer (and so
       *  on until the original commit). Set by `npm run hronir:edit-commit`. */
      previousVersion: z
        .object({
          uuid: z.string(),
          url: z.string().url(),
          timestamp: z.string(),
          msg: z.string(),
        })
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
    }),
});

export const collections = { blog };
