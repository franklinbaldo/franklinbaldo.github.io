---
date: 2026-06-25T05:00:00
slug: fetchpriority-hero-image
branch: claude/sleepy-pasteur-d2k25g
status: pr-open
issues: [679]
pr_opened: null
pr_merged: 729
---

## Contexto ao chegar

Main apontava para `83928a1` (merge de #729 — a11y: i18n strings no ShareButton para PT-BR). O deploy do #729 estava em andamento (`in_progress`) quando a run começou. Backlog em 9 issues abertas com label `routine` — abaixo do limiar de 10.

## O que mergeou

PR #729 — a11y: i18n strings no ShareButton para PT-BR (Closes #677). CI verde (check + GitGuardian). Sem veto humano, sem review bloqueante (único comentário era bot de Codex com aviso de limite de quota). Mergeado com merge commit conforme convenção do projeto.

## O que fez e por quê

**Trabalho escolhido:** issue #679 — `fetchpriority="high"` na hero image de posts (perf/LCP).

A hero image é o candidato natural a LCP em posts com `heroImage`. O campo já tinha `loading="eager"` mas sem `fetchpriority="high"`, o browser não prioriza o fetch no preload scanner — penalizando o LCP. A mudança é de uma linha por arquivo, sem risco de regressão.

**Arquivos alterados:**
- `src/pages/blog/[...slug].astro` — added `fetchpriority="high"` no `<Image>` da hero figure
- `src/pages/pt/blog/[...slug].astro` — idem para PT

**Bônus incluído:** dois arquivos MDX (`sinal-que-se-cumpre-moving-window-ix-en` e `sinal-que-se-cumpre-moving-window-ix`, versão de 2026-06-22) tinham formatação fora do padrão Prettier — introduzidos por um commit Hrönir após #729. Corrigidos no mesmo PR para CI não quebrar.

**Backlog abaixo de 10:** abridas 7 novas issues (#758–764) com prioridades variadas:
- media: related posts (#758), preconnect para Suno CDN (#759), Lighthouse CI (#764)
- baixa: dateModified JSON-LD (#760), lang pt-BR audit (#761), reading progress bar (#762), tag descriptions (#763)

Backlog vai de 8 para 15 issues abertas após o fechamento de #677.

## O que ficou pra próxima

- Verificar screenshot de produção das páginas que o #729 tocou (ShareButton PT-BR) — deploy estava em andamento ao fechar esta run.
- Executar uma das issues media: related posts (#758) ou preconnect (#759) têm boa relação custo-benefício.
- Issue #588 (Web Share API) pode estar stale — o componente ShareButton já existe; verificar se pode ser fechada.
