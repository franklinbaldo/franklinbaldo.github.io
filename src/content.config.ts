import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
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
      translationKey: z.string().optional(),
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
    }),
});

export const collections = { blog };
