// @ts-check
import { defineConfig } from "astro/config";
import { existsSync, readFileSync } from "node:fs";
import { DEFAULT_LANG, LANG_META } from "./src/lib/languages.mjs";

/** @type {Record<string, Record<string, string>>} */
let blogPairs = {};
try {
  blogPairs = JSON.parse(
    readFileSync("./src/generated/blog-translation-pairs.json", "utf-8")
  );
} catch {
  // File not yet generated — sitemap will emit blog posts without hreflang.
}

/** @type {Record<string, string>} */
let blogRedirects = {};
try {
  blogRedirects = JSON.parse(
    readFileSync("./src/generated/blog-redirects.json", "utf-8")
  );
} catch {
  // File not yet generated — legacy date-prefixed URLs won't redirect.
}

// RFC 0010 §4.4: pruned versions keep their public permalinks as redirects
// to the live post — `hronir:prune` registers every removed slug@uuid here.
// Absent registry = nothing pruned yet. A present-but-malformed registry
// must fail the build: completing without these redirects would 404 every
// pruned permalink, and the source files are already gone.
if (existsSync("./src/generated/versions-pruned.json")) {
  const pruned = JSON.parse(
    readFileSync("./src/generated/versions-pruned.json", "utf-8")
  );
  if (!Array.isArray(pruned?.pruned)) {
    throw new Error(
      "versions-pruned.json sem o array 'pruned' esperado (schema pruned-v1) — repare o registro antes de buildar."
    );
  }
  for (const e of pruned.pruned) {
    const base = e.lang === "pt" ? `/pt/blog/${e.slug}` : `/blog/${e.slug}`;
    for (const uuid of new Set([e.uuid, e.legacyUuid].filter(Boolean))) {
      blogRedirects[`${base}/v/${uuid}/`] = `${base}/`;
    }
  }
}

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { remarkReadingTime } from "./src/lib/remark-reading-time.mjs";
import { remarkGitModified } from "./src/lib/remark-git-modified.mjs";
import { remarkHasMath } from "./src/lib/remark-has-math.mjs";
import { rehypeWrapTables } from "./src/lib/rehype-wrap-tables.mjs";

// https://astro.build/config
export default defineConfig({
  site: "https://franklinbaldo.github.io",
  integrations: [
    mdx(),
    sitemap({
      // RFC 0003: version pages (/blog/<slug>/v/<uuid>) are noindex archives —
      // keep them out of the sitemap.
      filter: (page) => !/\/v\/[0-9a-f-]{8,}\/?$/i.test(page),
      serialize(item) {
        const base = "https://franklinbaldo.github.io";

        // Build hreflang links from a { [langCode]: absoluteUrl } map.
        /** @param {Record<string, string>} langUrls */
        const makeLinks = (langUrls) => [
          ...Object.entries(langUrls).map(([code, url]) => ({
            lang: LANG_META[code]?.locale ?? code,
            url,
          })),
          {
            lang: "x-default",
            url: langUrls[DEFAULT_LANG] ?? Object.values(langUrls)[0],
          },
        ];

        const staticPairs = {
          [base + "/"]: base + "/pt/",
          [base + "/about/"]: base + "/pt/about/",
          [base + "/archive/"]: base + "/pt/archive/",
          [base + "/tags/"]: base + "/pt/tags/",
          [base + "/search/"]: base + "/pt/search/",
          [base + "/projects/"]: base + "/pt/projects/",
          [base + "/ranking/"]: base + "/pt/ranking/",
          [base + "/music/"]: base + "/pt/musicas/",
          [base + "/books/"]: base + "/pt/livros/",
        };
        const ptToEn = Object.fromEntries(
          Object.entries(staticPairs).map(([en, pt]) => [pt, en])
        );

        if (staticPairs[item.url]) {
          item.links = makeLinks({ en: item.url, pt: staticPairs[item.url] });
        } else if (ptToEn[item.url]) {
          item.links = makeLinks({ en: ptToEn[item.url], pt: item.url });
        } else {
          // Blog post pairs — look up pre-generated bidirectional map.
          const path = item.url.replace(base, "");
          const pair = blogPairs[path];
          if (pair) {
            item.links = makeLinks(
              Object.fromEntries(
                Object.entries(pair).map(([code, p]) => [code, base + p])
              )
            );
          }
        }
        return item;
      },
    }),
  ],
  redirects: {
    "/musicas/": "/music/",
    ...blogRedirects,
  },
  prefetch: {
    defaultStrategy: "viewport",
  },
  markdown: {
    shikiConfig: {
      // Register `greentext` as a no-op grammar so ```greentext fences
      // keep their data-language marker (Shiki otherwise normalizes unknown
      // languages to plaintext). The actual styling is plain CSS.
      langs: [
        {
          name: "greentext",
          scopeName: "source.greentext",
          patterns: [],
          repository: {},
        },
      ],
      transformers: [
        {
          name: "greentext-line-marker",
          line(node, line) {
            if (this.options.lang !== "greentext") return;
            const text = node.children
              .map((c) => {
                if (c.type !== "element") return "";
                const child = c.children?.[0];
                return child?.type === "text" ? child.value : "";
              })
              .join("");
            if (/^\s*>/.test(text)) {
              node.properties.class =
                `${node.properties.class ?? ""} gt-quote`.trim();
            }
          },
        },
      ],
    },
    remarkPlugins: [
      remarkMath,
      remarkHasMath,
      remarkReadingTime,
      remarkGitModified,
    ],
    rehypePlugins: [
      rehypeKatex,
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: "append",
          properties: {
            className: ["heading-anchor"],
            "aria-hidden": "true",
            tabIndex: -1,
          },
          content: { type: "text", value: "#" },
        },
      ],
      rehypeWrapTables,
    ],
  },
});
