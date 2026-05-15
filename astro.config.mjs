// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { remarkReadingTime } from './src/lib/remark-reading-time.mjs';
import { remarkGitModified } from './src/lib/remark-git-modified.mjs';
import { remarkHasMath } from './src/lib/remark-has-math.mjs';
import { rehypeWrapTables } from './src/lib/rehype-wrap-tables.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://franklinbaldo.github.io',
  integrations: [
    mdx(),
    sitemap({
      serialize(item) {
        const base = 'https://franklinbaldo.github.io';
        const path = item.url.startsWith(base) ? item.url.slice(base.length) : item.url;

        // Static EN↔PT page pairs
        const enToPt = {
          '/': '/pt/',
          '/about/': '/pt/about/',
          '/archive/': '/pt/archive/',
          '/tags/': '/pt/tags/',
          '/search/': '/pt/search/',
          '/projects/': '/pt/projects/',
        };
        const ptToEn = Object.fromEntries(Object.entries(enToPt).map(([e, p]) => [p, e]));

        if (enToPt[path]) {
          item.links = [
            { lang: 'en-US', url: item.url },
            { lang: 'pt-BR', url: base + enToPt[path] },
            { lang: 'x-default', url: item.url },
          ];
        } else if (ptToEn[path]) {
          item.links = [
            { lang: 'pt-BR', url: item.url },
            { lang: 'en-US', url: base + ptToEn[path] },
            { lang: 'x-default', url: base + ptToEn[path] },
          ];
        }
        return item;
      },
    }),
  ],
  prefetch: {
    defaultStrategy: 'viewport',
  },
  markdown: {
    shikiConfig: {
      // Register `greentext` as a no-op grammar so ```greentext fences
      // keep their data-language marker (Shiki otherwise normalizes unknown
      // languages to plaintext). The actual styling is plain CSS.
      langs: [
        {
          name: 'greentext',
          scopeName: 'source.greentext',
          patterns: [],
        },
      ],
      transformers: [
        {
          name: 'greentext-line-marker',
          line(node, line) {
            if (this.options.lang !== 'greentext') return;
            const text = node.children
              .map((c) => (c.type === 'element' ? c.children?.[0]?.value ?? '' : ''))
              .join('');
            if (/^\s*>/.test(text)) {
              node.properties.class = `${node.properties.class ?? ''} gt-quote`.trim();
            }
          },
        },
      ],
    },
    remarkPlugins: [remarkMath, remarkHasMath, remarkReadingTime, remarkGitModified],
    rehypePlugins: [
      rehypeKatex,
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'append',
          properties: { className: ['heading-anchor'], 'aria-hidden': 'true', tabIndex: -1 },
          content: { type: 'text', value: '#' },
        },
      ],
      rehypeWrapTables,
    ],
  },
});
