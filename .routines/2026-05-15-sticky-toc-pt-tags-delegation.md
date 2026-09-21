---
date: 2026-05-15
slug: sticky-toc-pt-tags-delegation
branch: claude/great-mccarthy-mVYaL
status: pr-open
session: 7
---

# Sessão 2026-05-15 — Sticky ToC, /pt/tags/[tag]/, Tradução "Art of Delegation"

## Contexto

Sétima sessão com o sistema `.routines/`. Chegou com PR #72 aberto (/pt/search/, harness 100% PT, og:locale:alternate, Pagefind lang filter). CI verde → squash merge realizado.

Estado atual antes desta sessão: 160 páginas. LanguageSwitcher já detecta preferência de idioma via `navigator.language` + localStorage, e auto-redireciona uma vez por sessão quando há `translationHref`. Requisito "servir o usuário na versão de acordo com a preferência dele" estava parcialmente coberto — funciona para páginas com `translationKey`, não funciona para páginas sem par de tradução.

**Instrução explícita desta sessão**: blog padrão EN, toda página/post deve ter versão PT-BR, UI serve a versão de acordo com a preferência do usuário.

## O que foi feito nesta sessão

### Merge de PR aberta

- **PR #72** (pt/search/, harness 100% PT, og:locale:alternate) — CI verde → squash merge realizado.

### 1. Sticky ToC sidebar em telas largas

| Arquivo                                | Mudança                                                                                                                                                                                                                                                                                                     |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/TableOfContents.astro` | Adicionado prop `sidebar?: boolean`. Quando `sidebar=true`: renderiza `<nav class="toc-sidebar-nav">` sem `<details>`, com label em uppercase e lista com hover border-left. Quando `sidebar=false` (padrão): mantém `<nav class="toc-inline">` com `<details>` para mobile.                                |
| `src/pages/blog/[...slug].astro`       | Adicionado wrapper `<div class="post-grid">` com `<aside class="toc-col">` (sidebar ToC, desktop) e `<div class="post-body">` (artigo + bio + related posts). CSS grid em `≥ 1200px`: `200px minmax(0, 1fr)`, `position: sticky; top: 4.5rem`. O `<TableOfContents>` inline (mobile) é ocultado em desktop. |

**Por que importa**: posts longos (Harness, Pierre Menard, Tudo é Processo) ficavam sem navegação interna visível em desktop. ToC sticky melhora orientação do leitor em posts com muitas seções. Pico CSS container (max-width ~1320px) comporta bem o layout de 2 colunas.

**Detalhe técnico**: dual-render com duas instâncias de `<TableOfContents>`:

- `<aside class="toc-col">` no grid → versão sidebar (sem `<details>`) → visível em `≥ 1200px`
- `<TableOfContents>` dentro de `<article>` → versão collapsible (com `<details>`) → visível em `< 1200px`

### 2. /pt/tags/[tag]/ — rotas PT para cada tag

| Arquivo                         | Mudança                                                                                                                                                                |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/pages/pt/tags/[tag].astro` | **Novo** — espelho PT de `/tags/[tag].astro`. `lang="pt"`, `translationHref=/tags/{tag}/`, links "todas as etiquetas" → `/pt/tags/`. LangFilter para filtro padrão PT. |
| `src/pages/tags/[tag].astro`    | Adicionado `lang="en"`, `translationHref=/pt/tags/{tag}/`, link 🇧🇷 PT no cabeçalho da página.                                                                          |
| `src/pages/pt/tags/index.astro` | Links de tags agora apontam para `/pt/tags/${tag}/` (antes: `/tags/${tag}/`).                                                                                          |

**Por que importa**: `/pt/tags/` listava todas as tags mas ao clicar saía do contexto PT, indo para `/tags/[tag]/` EN. Agora o fluxo PT é coeso: `/pt/tags/` → `/pt/tags/[tag]/` com LangFilter ativo. LanguageSwitcher ativo em ambos os lados.

**Efeito no build**: gerou ~55 novas páginas `/pt/tags/[tag]/` (uma por tag única).

### 3. Links de tags PT-aware no post

| Arquivo                          | Mudança                                                                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `src/pages/blog/[...slug].astro` | `const tagBase = lang === 'pt' ? '/pt/tags/' : '/tags/'` — links no rodapé do post agora apontam para `/pt/tags/${tag}/` em posts PT. |

**Por que importa**: em posts PT, as tags linkavam para `/tags/{tag}/` EN. Agora direcionam para `/pt/tags/{tag}/`, mantendo o leitor PT no contexto correto.

### 4. Tradução: "Delegando para Agentes" → EN

| Par                       | EN                                             | PT                                                                                         |
| ------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **The Art of Delegation** | `2026-03-28-the-art-of-delegation.md` **novo** | `2026-03-28-delegando-para-agentes.md` (adicionado `translationKey: delegating-to-agents`) |

Post sobre delegar tarefas a Jules e Claude enquanto pai. Tom pessoal + técnico. Preservados:

- Paralelo parenting/agentes (criança com torre de blocos → grave; agente com design pattern → primeiros princípios)
- Conceito "eventos até o fim" (filosofia do processo)
- Distinção Jules (scaffolding, CI/CD) vs Claude (design, síntese)
- Cena final (tela no escuro, babá eletrônica)

## Estado atual (build: 273 páginas, sem erros)

- ToC sidebar sticky ativa em posts com ≥ 3 seções em telas ≥ 1200px
- `/pt/tags/[tag]/` completo para todas as tags existentes
- Tags em posts PT linkam para `/pt/tags/[tag]/`
- LanguageSwitcher ativo em `/tags/[tag]/` ↔ `/pt/tags/[tag]/`
- 7 pares de tradução funcionando (novo: delegating-to-agents)

## Cobertura de tradução atual

| Post PT                | Par EN                | Status                            |
| ---------------------- | --------------------- | --------------------------------- |
| Delegando para Agentes | The Art of Delegation | ✅ novo                           |
| Tudo é Processo        | —                     | ❌ falta (longa, alta prioridade) |
| Travessia              | —                     | ❌ falta                          |
| Hermes vs OpenClaw     | —                     | ❌ falta                          |
| Pai do Futuro          | —                     | ❌ falta                          |
| Reddit Submarine OSINT | —                     | ❌ falta                          |
| + outros posts PT-only | —                     | ❌ falta                          |

## Próximas sessões — backlog priorizado

### Alta prioridade

1. **Traduzir "Tudo é Processo"** → EN: post filosófico denso (~3000 palavras), maior do blog. Alto valor para alcance EN.
2. **Traduzir "Hermes vs OpenClaw"** → EN: post técnico sobre comparação de agentes — muito relevante para audiência EN.
3. **Traduzir "Travessia"** → EN: post sobre o projeto Travessia (Jules + correspondência literária).

### Média prioridade

4. **`/pt/projects/`**: `/projects/` não tem equivalente PT. Pode ser uma página PT com título em PT + mesmo conteúdo.
5. **Pagination em `/archive/` e `/tags/[tag]/`**: crescimento de posts vai degradar essas páginas. Astro `paginate()`.
6. **Traduzir posts PT-only restantes**: `o-pai-do-futuro`, `reddit-submarine-osint`, `travessia-update`, `verne-identity-repo`.

### Baixa prioridade

7. **wordCount no JSON-LD**: `remarkPluginFrontmatter` tem `minutesRead`, pode calcular wordCount.
8. **FAQ Schema na `/about/`**: structured data para FAQ.
9. **Caching GitHub Projects**: fallback se API falhar.
10. **dependabot #38**: `defu` 6.1.4→6.1.6 — fechar e atualizar manualmente.

## Decisões arquiteturais

- **Dual-render do ToC**: instância `sidebar` (sem `<details>`) em `.toc-col` desktop + instância `toc-inline` (com `<details>`) dentro do artigo para mobile. Tradeoff: leve duplicação de HTML. Alternativa (CSS `details[open]` forçado por JS) descartada por adicionar runtime JS desnecessário. Para uma compilação estática, dois `<nav>` âncoras equivalentes são inofensivos.
- **`/pt/tags/[tag]/` mostra todos os posts com LangFilter**: mesma decisão de `/tags/[tag]/`. Filtrar por lang=pt no servidor (getStaticPaths) geraria URLs PT vazias para tags usadas só em posts EN. Deixar o LangFilter no cliente é mais resiliente.
- **tagBase condicional**: a variável `tagBase` no post layout é o approach mais simples para links PT-aware sem duplicar HTML.
- **Breakpoint 1200px**: escolhido por ser o `xl` do Pico CSS, onde o container tem espaço suficiente para 200px sidebar + conteúdo.
