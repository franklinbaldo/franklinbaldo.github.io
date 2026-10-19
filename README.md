# franklinbaldo.github.io

Personal blog and digital garden of Franklin Baldo. Built with **Astro 7** and **Pico.css v2**.

**Live site:** https://franklinbaldo.github.io/

## What lives here

The repository powers more than a chronological blog. Its public surface currently includes:

- [essays and the archive](https://franklinbaldo.github.io/archive/), with tags, search and bilingual routes;
- curated [reading paths](https://franklinbaldo.github.io/) that connect related essays into sequences;
- a public [projects index](https://franklinbaldo.github.io/projects/);
- the [Hrönir ranking](https://franklinbaldo.github.io/ranking/), produced from committed pairwise evaluations used to curate and compare the writing corpus;
- [music](https://franklinbaldo.github.io/music/) and [books](https://franklinbaldo.github.io/books/) as adjacent parts of the digital garden;
- a public [changelog](https://franklinbaldo.github.io/changelog/) and RSS feeds for following updates.

Hrönir is both repository machinery and a public-facing curation artifact: evaluation data lives in `.routines/hronir/` as OKF Markdown, `okf-parser` validates agent-authored records, and the site publishes read-only ranking projections.

## Stack

- [Zola 0.23.6](https://www.getzola.org/) with native Tera templates
- Node 24 for canonical editorial projections, KaTeX, social images and Pagefind
- [Pico.css v2](https://picocss.com/) (semantic, classless-ish CSS)
- Typography: Fraunces (body) / Inter (UI) via `@fontsource`
- Source assets preserved; local article images copied by the native exporter
- **Hrönir** — pairwise editorial evidence in Markdown OKF; agents are guided and validated by `okf-parser`. See [`CLAUDE.md`](./CLAUDE.md) for the operating contract.

## Commands

| Command                 | Action                                    |
| :---------------------- | :---------------------------------------- |
| `npm install`           | Install dependencies                      |
| `npm run dev`           | Start dev server at `localhost:4321`      |
| `npm run build`         | Build production site to `./dist-zola/`   |
| `npm run preview`       | Preview the built site locally            |
| `npm run check:hygiene` | Repo hygiene (root files, lockfile, etc.) |

Requires Node `>=24.0.0` and the official Zola **0.23.6** binary in PATH (or `ZOLA_BIN=/path/to/zola`). See [migration and verification instructions](docs/migrations/zola.md). `npm run build:astro` is an explicit legacy parity fallback; it is not the production generator.

Native templates and browser assets live in `zola/`; exporters and the static preview server live in `scripts/zola/`. The disposable input is `.cache/zola-site/`. Never use the source `public/` directory as Zola output.

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
├── hronir/            Hrönir perspectives/skills and legacy support resources
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
from the exact rendered article HTML via `scripts/zola/finish.mjs`. Portuguese RSS is at `/pt/rss.xml`; JSON Feeds are at `/feed.json` and `/pt/feed.json`.

## Notes on the modernization migration

A couple of legacy standalone routes were dropped during the Astro modernization:

- **`/encrypt.html`** — static page-encryption demo.
- **`/vault/`** — unmaintained landing page.

If you depended on either, open an issue.
