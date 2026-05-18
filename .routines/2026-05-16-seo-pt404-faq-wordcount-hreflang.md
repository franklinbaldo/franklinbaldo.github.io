---
date: 2026-05-16
slug: seo-pt404-faq-wordcount-hreflang
branch: claude/great-mccarthy-DsR9H
status: pr-open
session: 11
---

# Sessão 2026-05-16 — PT 404, FAQ Schema, wordCount, x-default hreflang

## Contexto

Décima-primeira sessão. Branch designado: `claude/great-mccarthy-DsR9H`.

Estado ao chegar:

- 1 PR aberto: #102 "Optimize profile visuals and fix latest essay logic" — **NÃO mergeado** (bugs críticos, detalhados abaixo)
- Build limpo em 293 páginas
- Todos os posts têm `translationKey` (62/63; 1 é orphan com `draft: true`)
- Única página sem versão PT: `404.astro`

## Decisão sobre PR #102 — **Não mergeado**

PR #102 tem dois bugs que quebram o build:

1. **`PageLayout.astro` com indentação incorreta**: o diff adiciona 2 espaços antes de `};`, `---` e `<!doctype html>`. O delimitador `---` do frontmatter Astro precisa estar na coluna 0 — indentá-lo quebra o parsing do componente.
2. **Chave i18n inexistente**: `HomeAuthorRail.astro` passa `t(lang, 'author.moreAbout')`, mas a chave correta no `UIKey` union type é `'author.aboutMore'`. TypeScript rejeitaria na build.

O CI só tem Kilo Code Review (que falhou) e GitGuardian (ok) — sem build test, então o bug não foi detectado automaticamente. Recomendação: o autor do PR corrija a chave para `'author.aboutMore'` e restaure a indentação original em `PageLayout.astro`.

## O que foi feito nesta sessão

### 1. `src/pages/pt/404.astro` — versão PT da página 404

**Por que importa**: era a única página do site sem versão PT. Usuário PT que acessa uma URL quebrada via `/pt/...` caía na 404 EN sem contexto ou links úteis em PT.

**Implementação**:

- Filtra posts recentes com `lang === 'pt'` (lista posts PT-only para usuário PT)
- Links de navegação apontam para `/pt/`, `/pt/archive/`, `/pt/tags/`
- Datas formatadas com `pt-BR` locale
- `translations={{ en: "/404/" }}` ativa o LanguageSwitcher

**Build**: +1 página → total 294.

### 2. `wordCount` no JSON-LD `BlogPosting`

**Por que importa**: `wordCount` no schema.org/BlogPosting é usado pelo Google para estimar tempo de leitura nos rich results. `minutesRead` já estava disponível via remark plugin.

**Implementação**:

- `PageLayout.astro`: nova prop `wordCount?: number`
- `[...slug].astro`: calcula `wordCount = minutesRead * 200` (estimativa conservadora: ~200 wpm)
- `BlogPosting` JSON-LD: `...(wordCount && { wordCount })` — só emite quando disponível

### 3. `x-default` hreflang no `<head>`

**Por que importa**: sem `x-default`, o Google não tem como inferir qual versão mostrar para usuários de idiomas não cobertos. Convenção: apontar para EN (versão principal).

**Lógica**:

```
x-default = EN version:
  - Se página é EN: canonical.href (a própria página)
  - Se página é PT: translations['en'] (se existir)
  - Caso contrário: null (não emite)
```

**Implementação**: `xDefaultHref` calculado no frontmatter; `{xDefaultHref && <link rel="alternate" hreflang="x-default" href={xDefaultHref} />}` no `<head>`.

### 4. FAQ Schema em `/about/` e `/pt/about/`

**Por que importa**: FAQPage schema ativa rich results no Google — perguntas aparecem expandidas na SERP abaixo do snippet. Para uma página /about/, FAQs são naturais e de baixo risco de over-optimization.

**FAQs EN** (`/about/`):

- Who is Franklin Baldo?
- What topics does this blog cover?
- What is the Harness?
- Is this blog available in Portuguese?

**FAQs PT** (`/pt/about/`):

- Quem é Franklin Baldo?
- Quais tópicos este blog aborda?
- O que é o Harness?
- Este blog está disponível em inglês?

**Implementação**: JSON-LD inline como `<script type="application/ld+json" slot="head">` dentro do `<PageLayout>`. Isso exigiu:

1. Adicionar `<slot name="head" />` ao final do `<head>` em `PageLayout.astro`
2. Converter `about.mdx` → `about.astro` (MDX com frontmatter layout não suporta named slots facilmente)

**about.mdx → about.astro**: conteúdo idêntico, formato HTML semântico equivalente. `data-pagefind-body` mantido para indexação.

## Build

294 páginas (era 293). +1: `/pt/404/`. Sem erros ou warnings.

## Cobertura de páginas PT-BR

| Página        | EN  | PT            |
| ------------- | --- | ------------- |
| /             | ✅  | ✅            |
| /about/       | ✅  | ✅            |
| /archive/     | ✅  | ✅            |
| /tags/        | ✅  | ✅            |
| /tags/[tag]/  | ✅  | ✅            |
| /search/      | ✅  | ✅            |
| /projects/    | ✅  | ✅            |
| /404/         | ✅  | ✅ **novo**   |
| /blog/[post]/ | ✅  | ✅ (31 pares) |

**Cobertura completa**: todas as páginas e posts têm versão PT-BR.

## Detecção de preferência de idioma

O sistema já funciona corretamente:

1. `LanguageSwitcher.astro` detecta idioma via `localStorage` → `navigator.language`
2. Auto-redirect na primeira visita se o usuário prefere outro idioma e a tradução existe
3. A preferência é persistida em `localStorage` para visitas futuras
4. O botão de switch mostra o idioma alvo de forma contextual

Nenhuma mudança necessária neste fluxo — funciona conforme o requisito "servir ao usuário a versão de acordo com a preferência dele".

## Próximas sessões — backlog priorizado

### Alta prioridade

1. **Fechar PR #38** (dependabot defu 6.1.4 → 6.1.6): atualização simples sem breaking changes. Apenas editar `package.json`.
2. **Corrigir PR #102**: notificar o autor sobre os dois bugs (chave i18n errada + indentação PageLayout).

### Média prioridade

3. **Pagination** em `/archive/` e `/tags/[tag]/`: Astro `paginate()` — cresce com o blog.
4. **Sitemap hreflang para blog posts**: atualmente só os 6 pares de páginas estáticas têm `xhtml:link` no sitemap. Blog posts (com `translationKey`) não têm hreflang no sitemap — apenas no `<head>`. Para ~30 pares de posts, adicionar hreflang ao sitemap melhoraria cobertura de indexação multilingual.
5. **OG image para pt/404**: `/og/home-pt.png` (default) está ok, mas poderia ter uma OG específica.

### Baixa prioridade

6. **Focus management** nas transições ClientRouter (acessibilidade).
7. **`og:locale:alternate` para posts sem par** (posts PT-only ou EN-only): atualmente só emitido quando `translationHref` existe.

## Decisões arquiteturais

- **about.mdx → about.astro**: Astro MDX com frontmatter layout não tem API oficial para named slots. Converter para .astro é mais simples, mantém paridade de funcionalidade, e é mais fácil de manter.
- **wordCount = minutesRead \* 200**: estimativa conservadora. A maioria dos leitores EN lê ~250-300 wpm; 200 garante que não superestimamos para o schema.org.
- **x-default só quando EN existe**: para páginas PT sem tradução EN, não emitir `x-default` é mais correto que apontar para uma página inexistente.
- **slot="head" vs inline em body**: JSON-LD em `<head>` é recomendado por Google (embora funcionem em ambos). Adicionar um slot nomeado ao PageLayout é baixo impacto e melhora a arquitetura geral para injeções futuras.
