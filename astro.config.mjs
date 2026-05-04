// @ts-check
import { defineConfig } from 'astro/config';

import svelte from '@astrojs/svelte';
import remarkMermaid from 'remark-mermaidjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://franklinbaldo.github.io',
  integrations: [svelte()],
  markdown: {
    remarkPlugins: [remarkMermaid],
  },
});
