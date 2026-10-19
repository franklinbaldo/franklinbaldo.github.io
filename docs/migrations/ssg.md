# SSG native built-ins — migration candidate

**State: experimental. Public Pages still uses Zola.**
**Architecture:** [SSG boundaries and cleanup](../architecture/ssg-native.md).  
**Target:** SSG 0.0.68, SHA-256-pinned from the official GitHub release.
**Canonical content:** src/content/blog/ (never edit generated .cache/ssg-native).

## Goal

Delegate SEO, accessibility, security, RSS/Atom, sitemaps, i18n, search,
taxonomies, templating and generated indexes to SSG's native pipeline.
Retain custom logic only for canonical editorial identity, safe media
handling and specialized interactive experiences.

## Implemented in this first migration increment

- Generator-independent publication rules shared through `scripts/lib/publication.mjs` rather than importing Zola into SSG.
- Canonical post selection via the existing content helper, including
  legacy version precedence and flattened sources.
- Publication filtering (drafts and future publishDate).
- Bilingual URLs based on slug ?? id, and shared translation_key.
- SSG source frontmatter projection with deterministic published dates.
- Safe handling of supported JSX literals, KaTeX and local blog images.
- Native SSG templates and config (i18n, archive listing, plugins).
- Output and manifest reports; no silent exclusion of unsupported MDX.
- Separate candidate workflow, no Pages write permission, no deploy switch.

## Test from the repository root

Requires Node 24, npm ci and the official ssg v0.0.68 binary.

    node scripts/ssg/check-architecture.mjs
    node --test scripts/ssg/*.test.mjs
    node scripts/pregen.mjs
    node scripts/ssg/prepare.mjs
    ssg --validate -c .cache/ssg-native/content
    ssg -f ssg/ssg.toml -c .cache/ssg-native/content -o dist-ssg -t ssg/templates
    node scripts/ssg/finish.mjs
    node scripts/ssg/parity.mjs
    ssg audit --output dist-ssg --sarif

Never direct SSG output to the repository's public/ directory: it contains
SOURCE assets. Dist output is dist-ssg/ only. The preview workflow uploads
the native output and JSON evidence; it cannot deploy to GitHub Pages.

## Cutover gate

1. Zero unsupported or missing public posts, no private clips or draft leak.
2. The full historical route and asset baseline remains equivalent,
   including EN/PT, translations, metadata, RSS and redirects.
3. Native search, archives, accessibility and CSP work in Chromium and
   on a phone, not merely as generated files.
4. Music players, Hrönir, books, papers, science, MaleCNS, ToE and all
   interactive demos remain functional and visually reviewed.
5. Build time, bandwidth and delivered JS are benchmarked on the same corpus.
6. Only then switch deploy.yml and the production npm build, with Zola rollback.

The initial candidate is expected to report gaps: it is NOT proof that the
full 4,704-artifact baseline has been migrated. A passing candidate workflow
does not authorize publication. The native SSG plugin audit is exploratory
until violations have been assessed and critical ones are blocking.

## Verified checkpoint — 19 October 2026

GitHub Actions built SSG 0.0.68 on the full current editorial projection:
252 published posts rendered; 1 draft/future post excluded; 0 unsupported;
0 projected post routes missing. Native content validation loaded 2 schemas
and verified all content files. Static assets were copied without overwriting
SSG output (120 copied, 2 collisions preserved).

**Not production-ready.** The preview still lacks six special route roots:
`/archive/`, `/projects/`, `/music/`, `/books/`, `/ranking/` and
`/papers/`. The native SSG auditor reported 8/10 quality pillars passed
with 1,065 findings across 557 pages; its separate accessibility scan found
5 heading-hierarchy issues in 5 articles. The SARIF report is uploaded even
when findings make the audit subcommand return non-zero.

Upstream investigation: SSG's built-in `PaginationPlugin::after_compile`
currently looks only for `ctx.build_dir/.meta` and returns early if absent.
`TemplatePlugin` already resolves sidecars from either build or site
directories after staticdatagen's output promotion. This is a likely cause
of the missing built-in `/archive/` listing; confirm with a focused
reproduction before patching or reporting upstream. Avoid substituting a
custom archive generator without first resolving the native behavior.

No GitHub Pages cutover is authorized by this checkpoint.
