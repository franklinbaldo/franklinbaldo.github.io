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

// https://astro.build/config
export default defineConfig({
  site: 'https://franklinbaldo.github.io',
  integrations: [mdx(), sitemap()],
  markdown: {
    remarkPlugins: [remarkMath, remarkReadingTime, remarkGitModified],
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
    ],
  },
});
