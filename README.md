# franklinbaldo.github.io

Personal blog and digital garden of Franklin Baldo. Built with **Astro 6** and **Pico.css v2**.

**Live site:** https://franklinbaldo.github.io/

## What lives here

The repository powers more than a chronological blog. Its public surface currently includes:

- [essays and the archive](https://franklinbaldo.github.io/archive/), with tags, search and bilingual routes;
- curated [reading paths](https://franklinbaldo.github.io/) that connect related essays into sequences;
- a public [projects index](https://franklinbaldo.github.io/projects/);
- the [Hrönir ranking](https://franklinbaldo.github.io/ranking/), produced from committed pairwise evaluations used to curate and compare the writing corpus;
- [music](https://franklinbaldo.github.io/music/) and [books](https://franklinbaldo.github.io/books/) as adjacent parts of the digital garden;
- a public [changelog](https://franklinbaldo.github.io/changelog/) and RSS feeds for following updates.

Hrönir is both repository machinery and a public-facing curation artifact: the evaluation data lives in `.routines/hronir/`, while the resulting ranking is published on the site.

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
