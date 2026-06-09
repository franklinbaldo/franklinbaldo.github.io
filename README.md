# franklinbaldo.github.io

Personal blog and digital garden of Franklin Baldo. Built with **Astro 6** and **Pico.css v2**.

## Stack

- [Astro 6](https://astro.build/) with `@astrojs/mdx`
- [Pico.css v2](https://picocss.com/) (semantic, classless-ish CSS)
- Typography: Fraunces (body) / Inter (UI) via `@fontsource`
- `astro:assets` for image optimization (heroes generate responsive WebP)
- **Hrönir** — pairwise post-ranking system. See [`CLAUDE.md`](./CLAUDE.md) for the full operating manual.

## Commands

| Command                  | Action                                    |
| :----------------------- | :---------------------------------------- |
| `npm install`            | Install dependencies                      |
| `npm run dev`            | Start dev server at `localhost:4321`      |
| `npm run build`          | Build production site to `./dist/`        |
| `npm run preview`        | Preview the built site locally            |
| `npm run check:hygiene`  | Repo hygiene (root files, lockfile, etc.) |
| `npm run hronir:ranking` | Print current Hrönir ranking              |

Requires Node `>=22.12.0` (see `package.json#engines`).

## Project layout

```
src/
├── components/        Astro components
├── content/
│   └── blog/          Posts (.md/.mdx) — slug = filename = URL
├── content.config.ts  Zod schema for the blog collection
├── lib/               Build-time TypeScript helpers
└── pages/             Routes (bilingual: / and /pt/)

scripts/
├── hronir/            Hrönir CLI and rating engine
├── lib/               Shared helpers (content.mjs, blog-links.mjs)
└── oneoff/            One-shot scripts, not part of the build

docs/
├── rfcs/              RFC documents (0001 …)
├── plans/             Planning documents
└── reviews/           Session reviews

.routines/
└── hronir/            Rate files produced by Hrönir sessions (committed)
```

## Feeds

RSS feed at [`/rss.xml`](https://franklinbaldo.github.io/rss.xml), generated
from the `blog` collection via
[`@astrojs/rss`](https://docs.astro.build/en/recipes/rss/).

## Notes on the modernization migration

A couple of legacy standalone routes were dropped during the move to Astro 6:

- **`/encrypt.html`** — static page-encryption demo.
- **`/vault/`** — unmaintained landing page.

If you depended on either, open an issue.
