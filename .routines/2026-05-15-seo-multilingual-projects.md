---
date: 2026-05-15
slug: seo-multilingual-projects
branch: claude/great-mccarthy-s83RK
status: pr-open
session: 7
---

# Sessão 2026-05-15 — SEO multilingual: sitemap hreflang, JSON-LD inLanguage, /pt/projects/, EN Hermes

## Contexto

Sétima sessão. Chegou com PR #75 aberto (sticky ToC sidebar, /pt/tags/[tag]/, PT-aware tag links, "The Art of Delegation" EN). CI verde → squash merge realizado no início da sessão.

Estado do blog antes desta sessão: 273 páginas, sistema multilingual EN/PT quase completo, mas faltavam:
- Sitemap sem hreflang alternates (gap de SEO significativo para multilingual)
- JSON-LD BlogPosting sem `inLanguage`
- "min read" hardcoded em inglês mesmo em posts PT
- `/pt/projects/` inexistente (único link de nav sem versão PT)
- Header enviando usuários PT para `/projects/` EN
- `hermes-vs-openclaw` como único post PT importante sem par EN

## O que foi feito nesta sessão

### Merge de PR aberta
- **PR #75** (sticky ToC sidebar, /pt/tags/[tag]/, PT-aware tag links, delegating-to-agents pair) — CI verde → squash merge.

### Sitemap hreflang (`astro.config.mjs`)

Configurado `@astrojs/sitemap` com função `serialize` que adiciona `xhtml:link rel="alternate"` para os 6 pares de páginas estáticas EN↔PT:

| EN | PT |
|----|----|
| `/` | `/pt/` |
| `/about/` | `/pt/about/` |
| `/archive/` | `/pt/archive/` |
| `/tags/` | `/pt/tags/` |
| `/search/` | `/pt/search/` |
| `/projects/` | `/pt/projects/` |

Cada URL recebe `en-US`, `pt-BR` e `x-default` (EN). Posts de blog mantêm hreflang apenas via `<link rel="alternate">` no `<head>` (já existente via `translationKey` + `translationHref`), o que é suficiente — o Googlebot lê ambas as fontes.

**Por que importa**: sem hreflang no sitemap, o Google não tem garantia de que sabe associar `/about/` e `/pt/about/` como variantes do mesmo recurso. O hreflang evita que as duas páginas compitam entre si nas SERPs e garante que o Google sirva a versão correta por idioma/região.

### JSON-LD `inLanguage` (`src/layouts/PageLayout.astro`)

Adicionado `inLanguage` ao schema `BlogPosting`:
```json
{ "inLanguage": "pt-BR" }  // ou "en-US"
```

Também adicionado `inLanguage: "en-US"` ao schema `WebSite` (o blog é primariamente EN).

**Por que importa**: o `inLanguage` é um sinal explícito de idioma no structured data. Pode melhorar rich snippets em buscas de idioma específico e ajuda parsers de conteúdo (ex.: Google Discover) a classificar o post no feed correto.

### `minutesRead` localizado (`src/pages/blog/[...slug].astro`)

Corrigido texto hardcoded "min read" → `lang === 'pt' ? 'min de leitura' : 'min read'`.

**Antes**: posts PT mostravam "5 min read"  
**Depois**: posts PT mostram "5 min de leitura"

### `/pt/projects/` + Header PT-aware (`src/pages/pt/projects.astro`, `src/components/Header.astro`)

Criado `/pt/projects.astro`:
- Título "Projetos", textos em PT
- Data formatada com `pt-BR` locale ("mai." em vez de "May")
- `lang="pt"`, `translationHref="/projects/"` (LanguageSwitcher ativo)
- Mesmo fetch de repos GitHub do original

Atualizado `Header.astro`:
- `projectsHref` agora varia: `/pt/projects/` quando `isPt`, `/projects/` caso contrário
- Fecha o último gap de navegação multilingual: todos os 5 links do nav agora têm versão PT

Adicionado `translationHref="/pt/projects/"` ao `/projects/` EN (LanguageSwitcher ativo em ambos os lados).

### EN translation of `hermes-vs-openclaw` (par `translationKey: hermes-vs-openclaw`)

| Par | Slug | Lang |
|-----|------|------|
| "Hermes Agent vs OpenClaw: Why My Experience Got Much Better" | `2026-04-04-hermes-agent-vs-openclaw.md` | **novo EN** |
| "Hermes Agent vs OpenClaw: por que minha experiência ficou muito melhor" | `2026-04-04-hermes-vs-openclaw.md` | PT (adicionado `translationKey`) |

Tradução fiel do post de 2026-04-04. Preserva:
- Todos os dados quantitativos (81 sessões, 1.414 tool calls, 137 erros, 39 sessões problemáticas)
- Exemplos de erros técnicos (schema, command/flag, environment, heartbeat)
- Tom empírico/honesto (explicitamente não é marketing)
- Jargão de harness (OpenClaw, Hermes, heartbeat, NO_REPLY)
- Terminologia de ferramentas (`session_search`, `read_file`, `execute_code`, `patch`, `todo`)
- Referências ao CausaGanha e Internet Archive

**Por que importa**: era o único post com 1k+ palavras sobre comparação de harnesses sem par EN. Com a audiência EN crescente (dev community, AI twitter), esse artigo tem alto potencial de engajamento — fala diretamente sobre a experiência de usar agentes de IA em produção pessoal.

## Build

**275 páginas** (antes: 273). Novas:
- `/blog/2026-04-04-hermes-agent-vs-openclaw/` + `/og/2026-04-04-hermes-agent-vs-openclaw.png`
- `/pt/projects/`

## Estado atual do sistema multilingual

- [x] LanguageSwitcher com auto-redirect e localStorage
- [x] Posts com `lang: en` ou `lang: pt`
- [x] Infraestrutura `translationKey` para pares
- [x] LangFilter em `/`, `/archive/`, `/pt/archive/`, `/tags/[tag]/`, `/pt/tags/[tag]/`
- [x] Páginas estáticas PT completas: `/pt/`, `/pt/about/`, `/pt/archive/`, `/pt/tags/`, `/pt/search/`, `/pt/projects/` ← **novo**
- [x] Header 100% PT-aware: todos os 5 links de nav têm versão PT ← **completo**
- [x] `og:locale:alternate` quando `translationHref` presente
- [x] `data-pagefind-filter="lang:{lang}"` nos artigos
- [x] `hreflang` em HTML `<head>` via `translationHref`
- [x] `hreflang` no sitemap XML para páginas estáticas ← **novo**
- [x] JSON-LD `inLanguage` em BlogPosting e WebSite ← **novo**
- [x] `minutesRead` localizado (EN/PT) ← **novo**
- [x] ToC sidebar sticky em ≥1200px
- [x] Related Posts, AuthorBio, Comments, ShareButton, BackToTop
- [x] Série harness 100% EN+PT (4 posts × 2 idiomas)
- [x] `hermes-vs-openclaw` par completo ← **novo**
- [ ] EN translations: `tudo-e-processo`, `travessia`, `o-pai-do-futuro`, `hermes-vs-openclaw` ← parcialmente resolvido (`hermes` agora tem EN)
- [ ] FAQ Schema em `/about/` e `/pt/about/`
- [ ] `wordCount` no JSON-LD (minutesRead * ~200 palavras/min)
- [ ] Pagination em `/archive/` e `/tags/[tag]/`
- [ ] `/pt/tags/[tag]/` com hreflang no sitemap (as tags dinâmicas não têm par EN, então x-default seria suficiente)

## Próximas sessões — backlog priorizado

### Alta prioridade
1. **EN translations dos PT-only posts restantes**: `tudo-e-processo` (filosofia do processo, Heráclito, Lao Tzu — alta relevância EN), `travessia` (viagem, identidade digital), `o-pai-do-futuro`.
2. **FAQ Schema em `/about/`** — rich snippet de alto valor para personal brand.
3. **`wordCount` no JSON-LD** — passar `minutesRead * 200` como `wordCount` no BlogPosting. Requer adicionar `wordCount` ao PageLayout Props e passar de `[...slug].astro`.

### Média prioridade
4. **Pagination em `/archive/`** — com 35+ posts, a lista começa a ser longa. Astro `paginate()` com 20 posts/página.
5. **`/pt/tags/[tag]/` hreflang no sitemap** — hoje as tags dinâmicas não têm par EN exato, mas o Google poderia confundir. Adicionar `x-default` pelo menos seria bom.
6. **dependabot PR #38** — `defu` 6.1.4→6.1.6. Fechar e atualizar manualmente: `npm update defu && git commit package-lock.json`.

### Baixa prioridade
7. **Focus management nas transições de ClientRouter** — acessibilidade para leitores de tela.
8. **RSS multilingual** — criar `/pt/rss.xml` com posts PT apenas.

## Decisões arquiteturais

- **Sitemap serialize vs i18n option**: a opção `i18n` do `@astrojs/sitemap` assume `/en/` e `/pt/` prefixos Astro nativos. Como nosso EN está na raiz, usamos `serialize` com mapa explícito. Mais verboso mas correto e sem magic.
- **hreflang no sitemap só para páginas estáticas**: posts individuais têm hreflang via `<link rel="alternate">` no `<head>` (gerado por `translationHref` em `PageLayout.astro`). Duplicar no sitemap seria redundante e complicaria a manutenção. Google aceita ambas as abordagens.
- **`/pt/projects/` como arquivo independente, não componente parametrizado**: segue o padrão estabelecido para todas as outras páginas PT. A diferença de locale (`pt-BR`) no `Intl.DateTimeFormat` justifica o arquivo separado.
- **Tradução de `hermes-vs-openclaw` fiel e sem adaptar**: manteve tom empírico, jargões técnicos em inglês, dados quantitativos. O público EN que chegará via busca por "AI agent harness comparison" espera exatamente esse nível de detalhe técnico e honestidade.
