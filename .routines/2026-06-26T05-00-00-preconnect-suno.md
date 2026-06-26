---
date: 2026-06-26T05:00:00
slug: preconnect-suno
branch: claude/sleepy-pasteur-vt0grl
status: pr-open
issues: [759]
pr_opened: null
pr_merged: null
---

## Contexto ao chegar

Run diária do blog franklinbaldo.github.io. A run anterior havia aberto PR #765 (perf: `fetchpriority=high` na hero image). O estado do repo ao chegar: 15 issues `routine` abertas (dentro da faixa 10–20), PR #765 com CI vermelho por dois motivos: (1) arquivo de journal hronir com nome inválido `run-2026-06-25T05-04-15-hronir-run.md` commitado em main por algum PR anterior, e (2) dois arquivos MDX com formatação fora do padrão Prettier.

## O que aconteceu com o PR pendente

PR #765 (`perf: fetchpriority=high na hero image`) estava com `mergeable_state: dirty` — main avançou muito desde a criação do PR (vários hronir PRs). Rebaseei a branch `claude/sleepy-pasteur-d2k25g` sobre main; o único conflito foi no arquivo gerado `versions-selected.json`, que foi skipado (main tem a versão mais recente). CI rodou na branch rebaseada e falhou em 31s no `check:hygiene` por causa do journal mal nomeado. Adicionei commit de rename ao PR #765 para corrigir. CI rodando novamente ao final desta run.

## O que fiz nesta run

**Issue #759** — `perf: <link rel=preconnect> para domínios externos (Suno, CDN)`.

Auditei os domínios externos usados:
- `cdn2.suno.ai` — imagens de capa dos posts de música → já tinha `preconnect` ✓
- `suno.com` — iframes de embed via `SunoEmbed.astro` → apenas `dns-prefetch`; upgradei para `preconnect`
- `cdn1.suno.ai` — áudio MP3 via `SunoInlinePlayer.astro`, carregado sob demanda → adicionei `dns-prefetch`
- `i.gr-assets.com` — Goodreads → mantido como `dns-prefetch`

Mudança em `src/layouts/PageLayout.astro` (único layout compartilhado entre EN e PT).

Também incluí neste PR:
- Rename do journal mal nomeado (`run-YYYY-…` → `YYYY-MM-DD…`) que estava em main quebrando todos os CIs
- Prettier fix nos 2 arquivos MDX (`sinal-que-se-cumpre-moving-window-ix*`) que estavam formatados fora do padrão

## O que fica para a próxima run

- Verificar CI do PR #765 e mergear se verde
- Verificar CI do PR deste run e mergear se verde
- Screenshot de produção de um post de música após merge para confirmar que os preconnect aparecem no HTML
- Próxima issue de prioridade média: #758 (related posts) ou #764 (Lighthouse CI)
