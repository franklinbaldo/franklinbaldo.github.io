---
date: 2026-06-08T05:05:27
slug: archive-collapse-years
branch: claude/sleepy-pasteur-9Tnom
status: pr-open
issues: [240]
pr_opened: 268
pr_merged: null
---

# Sessão 2026-06-08 — Archive: colapsar anos antigos (issue #240)

## Contexto ao chegar

Trigésima-quarta sessão. Branch designado: `claude/sleepy-pasteur-9Tnom`.

Estado ao chegar:
- **13 issues `routine` abertas** — backlog saudável (10–20), sem necessidade de criar ou fechar
- **0 PRs `routine` abertos** — nenhum PR da run anterior para mergear
- Últimas runs: #238 (Webmentions i18n, 2026-06-07), #237 (font-display: optional), #236 (font Inter + footer + lang-switcher)

Os três PRs `routine` pendentes da fila eram todos de hronir/Jules — ignorados conforme regras.

## Trabalho executado: issue #240 — Archive collapse

### Problema

O `/archive/` e `/pt/archive/` renderizavam todos os anos em scroll contínuo. Com 97 posts EN (40 só em 2026), a página virava parede de texto sem hierarquia visual navegável.

### Solução

Substituí `<section>/<h2>` por `<details>/<summary>` em ambas as páginas:

- **Ano mais recente** (`years[0]`): `<details open>` — expandido por default
- **Anos anteriores**: `<details>` sem `open` — colapsados por default
- **Summary**: `YYYY — N posts` — título clicável com count contextual
- **Indicador de estado**: `▶` (colapsado) / `▼` (expandido) via CSS `::before`
- **Sem JS**: disclosure nativo HTML, funciona sem JavaScript

**Invariantes verificados:**
- `id="archive-{year}"` permanece nos `<details>` → nav de anos ainda faz anchor links
- JSON-LD `hasPart` em `<head>` inalterado → 97 posts listados no schema
- `npm run build`: ✓ Completed (0 erros)
- `npx astro check`: 0 erros, 0 warnings
- `npx prettier --check .`: All matched files use Prettier code style

### Arquivos alterados

- `src/pages/archive.astro` — `<section>/<h2>` → `<details>/<summary>` + CSS
- `src/pages/pt/archive.astro` — idem para PT

### Nota sobre produção

Mudança visual. Screenshots de prod chegam na run seguinte (Jina só alcança URL pública).
Onde olhar no deploy: `/archive/` e `/pt/archive/` — anos 2025 e 2024 devem aparecer colapsados; 2026 aberto.

## Plano para próximas sessões

Por prioridade `alta` restante:
1. **#239**: Pagefind warnings PT — build noise mascara erros reais
2. **#241**: Taxonomia de tipo de documento (essay/letter/fiction) — maior escopo

---

_Sessão: 2026-06-08 | Branch: `claude/sleepy-pasteur-9Tnom` | franklinbaldo@gmail.com_
