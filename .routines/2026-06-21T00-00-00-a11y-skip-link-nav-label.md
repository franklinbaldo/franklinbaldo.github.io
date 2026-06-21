---
date: 2026-06-21T00:00:00
slug: a11y-skip-link-nav-label
branch: claude/sleepy-pasteur-tw13in
status: pr-open
issues: [583, 495]
pr_opened: null
pr_merged: null
---

# Sessão 2026-06-21 — a11y: skip-link i18n + nav aria-label

## Contexto ao chegar

- Sem PR `routine` pendente da run anterior para mergear.
- Backlog: 12 issues abertas com label `routine` — na faixa 10–20, sem necessidade de reabastecimento.
- Branch designada: `claude/sleepy-pasteur-tw13in`, alinhada com `origin/main`.

## O que foi feito

### 1. Skip-link internacionalizado — `src/layouts/PageLayout.astro` (issue #583)

O skip-link `<a href="#main">Skip to content</a>` era hardcoded em inglês. Em páginas PT-BR,
screen readers liam "Skip to content" em inglês — violação de WCAG 2.1 SC 3.1.1 (idioma da página
identificável). A correção é uma expressão condicional inline usando o prop `lang` já disponível:

```astro
{lang === 'pt' ? 'Ir para o conteúdo' : 'Skip to content'}
```

### 2. `aria-label` na navegação principal — `src/components/Header.astro` (issue #495)

O `<nav>` do Header não tinha `aria-label`. Em páginas com TOC (que têm um segundo `<nav>`),
screen readers não conseguiam distinguir os dois landmarks — WCAG 2.1 SC 4.1.2. O `<nav>` do
TOC já tinha `aria-label` (confirmado na inspeção). O Header recebeu:

```astro
<nav aria-label={lang === 'pt' ? 'Navegação principal' : 'Main navigation'}>
```

Ambos os labels estão em PT em páginas PT e em EN em páginas EN — paridade i18n respeitada.

## CI local

- `npm run build` ✅ (0 erros, 206 páginas indexadas)
- `npx prettier --check .` ✅
- `npx astro check` ✅ (0 erros, 0 warnings novos)
- `npm run hronir:doctor` ✅ (0 inconsistências)

## Para a próxima run

O screenshot de produção das páginas afetadas (`/`, `/pt/`) confirma o comportamento
visual na próxima run após o merge. Não há impacto visual visível — o skip-link é
oculto até Tab e o `aria-label` é invisível para usuários sem screen reader.

Issues fechadas: #583, #495.
Próximas candidatas no backlog (todas `priority:baixa`):
- #249: preload Inter 400 WOFF2
- #585: font-display Fira Code
- #591: reading time nos PostCards
