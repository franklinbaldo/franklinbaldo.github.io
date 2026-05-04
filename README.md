# franklinbaldo.github.io

Personal blog and digital garden of Franklin Baldo. Built with **Astro 6**,
**Pico.css v2**, and a small set of **Svelte 5** islands for interactive bits.

## Stack

- [Astro 6](https://astro.build/) with `@astrojs/mdx`
- [Pico.css v2](https://picocss.com/) (semantic, classless-ish CSS)
- [Svelte 5](https://svelte.dev/) — used only for genuinely interactive
  components (`ThemeToggle`, `SecretNote`); everything else is `.astro`
- Typography: EB Garamond (body) / JetBrains Mono (code) via `@fontsource`
- `astro:assets` for image optimization (heroes generate responsive WebP)

## Commands

| Command           | Action                                       |
| :---------------- | :------------------------------------------- |
| `npm install`     | Install dependencies                         |
| `npm run dev`     | Start dev server at `localhost:4321`         |
| `npm run build`   | Build production site to `./dist/`           |
| `npm run preview` | Preview the built site locally               |

Requires Node `>=22.12.0` (see `package.json#engines`).

## Project layout

```
src/
├── components/        Header.astro, Footer.astro, PostCard.astro,
│                      PostList.astro, ThemeToggle.svelte, SecretNote.svelte
├── content/
│   └── blog/          MDX posts + colocated images/
├── content.config.ts  Collection schema (heroImage uses image() helper)
├── layouts/
│   └── PageLayout.astro
├── pages/
│   ├── about.astro
│   ├── index.astro
│   └── blog/[...slug].astro
└── styles/global.css  Pico v2 + Paper/Stone theme tokens
```

Hero images for posts live in `src/content/blog/images/` so the schema's
`image()` helper can resolve them and generate responsive variants.

## Feeds

RSS feed available at [`/rss.xml`](https://franklinbaldo.github.io/rss.xml),
generated from the `blog` collection via
[`@astrojs/rss`](https://docs.astro.build/en/recipes/rss/). The layout adds a
`<link rel="alternate">` for autodiscovery.

## Notes on the modernization migration

A couple of legacy standalone routes were dropped during the move to
Astro 6 and have not been reintroduced:

- **`/encrypt.html`** — static page-encryption demo. Can be brought back as
  an Astro page if it becomes useful again.
- **`/vault/`** — unmaintained landing page.

If you depended on either, open an issue.
