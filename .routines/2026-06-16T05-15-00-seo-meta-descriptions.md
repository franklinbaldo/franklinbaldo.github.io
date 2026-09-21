---
date: 2026-06-16T05:15:00
slug: seo-meta-descriptions
branch: claude/sleepy-pasteur-5ks4ic
status: pr-open
issues: [551]
pr_opened: 564
pr_merged: 554
---

## Contexto ao chegar

13 issues abertas com label `routine` (dentro da faixa 10–20 — sem ação de backlog). PR #554 (ux: reading path "Law and AI / Direito e IA") estava aberto com CI verde mas com conflitos de merge porque `main` avançou com vários merges de sessões Jules.

## O que mergeou

PR #554 (law-and-ai path). Rebase necessário por conflitos em `src/generated/ranking-snapshot.json` e `versions-selected.json` — arquivos gerados que foram regenerados localmente com `hronir:select` e `npm run build`. CI rodou novamente na branch rebased (`status: success`), então merge prosseguiu.

## O que fez

**Issue #551 — seo: meta description audit.**

Rodei auditoria completa via `listPostFiles()` + `js-yaml` contra todos os posts canônicos (seleção via `versions-selected.json`). Resultado:

- **111 posts com descrições OK** (50–160 chars)
- **93 "curtos"** — todos music posts com padrão intencional "Music by Franklin Baldo — [título]" (não alterados)
- **22 posts com descrições longas demais** (>160 chars) — Google trunca snippets nesses casos

Trimei os 22 posts para 130–160 chars mantendo a essência semântica:
- 11 posts EN (building-funes, rosencrantz-coin, asymmetric-evolution, etc.)
- 11 posts PT (construindo-funes, moeda-rosencrantz, travessia, etc.)

Todos dentro de `v-*.md` (versões canônicas selecionadas). Prettier verde, astro check 0 errors, build limpo.

## O que ficou pra próxima

Issues `priority:media` restantes: #550 (ux: série prev/next navigation), #493 (ux: TOC scroll spy), #248 (content: memory-and-funes path com posts 2026), #243 (ux: Goodreads books no HomeAuthorRail).

Verificação de prod do PR #554 (law-and-ai path) será feita quando o deploy terminar — screenshot via Jina da próxima run.
