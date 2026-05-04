// @ts-check
import { defineConfig } from 'astro/config';

import svelte from '@astrojs/svelte';
import mdx from '@astrojs/mdx';
import remarkMermaid from 'remark-mermaidjs';

// https://astro.build/config
export default defineConfig({
  integrations: [svelte(), mdx()],
  markdown: {
    remarkPlugins: [remarkMermaid],
  },
});