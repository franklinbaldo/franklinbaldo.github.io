---
date: 2026-06-17T05:15:23
slug: content-paths-memory-funes
branch: claude/sleepy-pasteur-fofktw
status: pr-open
issues: [248]
pr_opened: null
pr_merged: null
---

## Contexto ao chegar

Main no commit c0412d1 (Merge PR #578: desativa Jules). Últimos commits: maioria de sessões Jules (hronir) e dois fixes relevantes — restauração de 70 rate files deletados (PR #574) e desativação do Jules (PR #578).

12 issues abertas com label `routine` — backlog saudável (faixa 10–20, sem necessidade de criar ou congelar).

## O que mergeou

Nada mergeado nesta run — PR #564 (seo: trim meta descriptions) estava com CI vermelho em duas frentes.

**Diagnóstico e fix de PR #564:**

1. **`check:translations` falhava**: a run anterior editou `a-api-do-jules-como-backend-do-harness/v-2026-06-10T05-09-44.md` (PT) e `reddit-submarine-osint/v-2026-06-10T05-09-44.md` (EN) sem atualizar os respectivos pares de idioma. Fix: atualizei as descriptions dos dois posts parceiros para dentro da faixa 130–160 chars.

2. **`hronir:doctor` falhava após o fix**: o UUID em `versions-selected.json` é SHA1 do conteúdo do arquivo. Ao editar as descriptions, o UUID mudou, e o doctor detectou a divergência. Fix: rodei `npm run hronir:select` no branch do PR para regenerar os UUIDs corretos.

PR #564 agora tem dois commits adicionais e CI está em andamento. A próxima run deverá mergear (se CI verde).

## O que fiz nesta run

**Issue #248: expande trilha memory-and-funes com posts 2026**

Antes: 3 posts EN (building-funes, funes-soul, pierre-menard-computational-researcher), 2 posts PT (sem paridade — faltavam os pares PT de building-funes e funes-soul, e a trilha não refletia o corpus atual).

Após auditoria dos posts com temas de memória, arquivo, identidade e Funes:
- `verne-identity-repo` / `verne-e-o-padro-identity-repo-como-os-agentes-de-ia-se-lembram` (2026-03-18) — padrão identity-repo: como agentes mantêm identidade independente do motor cognitivo. Fit excelente com o tema.
- `what-i-learned-orchestrating-ai-agents-to-preserve-family-memory` / `orquestrando-agentes-memoria-familiar` (2026-03-30) — preservação de memória familiar com agentes. O post PT já estava na trilha; o EN estava ausente.
- `construindo-funes-como-dei-uma-alma-a-um-agente-de-ia` e `soulmd-funes` — pares PT de posts EN já na trilha.

Ordem de leitura agora vai do mais conceitual (construir Funes, SOUL.md) ao mais arquitetural (identity-repo) ao mais concreto/pessoal (memória familiar, Pierre Menard).

Blurb atualizado para refletir o escopo ampliado.

Build local: 1944 páginas, astro check: 0 erros. Prettier: OK. hronir:doctor: 0 inconsistências.

PR aberto para esta run — aguardando review de Franklin (janela de 24h).

## Issues descobertos

Dois issues de "já implementado" encontrados durante triagem:
- **#550 (series nav)**: `SeriesContext.astro` com variant `nav` já está implementado e integrado em `[...slug].astro:282`. Issue pode ser fechado.
- **#493 (TOC scroll spy)**: `TableOfContents.astro` já tem IntersectionObserver completo com `toc-active` CSS. Issue pode ser fechado.

Franklin pode querer fechar #550 e #493 manualmente para limpar o backlog.

## Próxima run

- Mergear PR desta run (se CI verde)
- Mergear PR #564 (SEO descriptions) se CI passou finalmente
- Verificar prod pós-deploy de #564 (snippets de description no HTML)
- Trabalho: próxima issue de priority:media — #243 (goodreads books) ou issue baixa
