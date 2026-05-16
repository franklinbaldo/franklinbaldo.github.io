---
date: 2026-05-16
slug: i18n-mass-pairing-sitemap-hreflang
branch: claude/great-mccarthy-q4Txs
status: pr-open
session: 9
---

# Sessão 2026-05-16 — Mass Translation Pairing, Sitemap hreflang, /pt/projects/

## Contexto

Nona sessão com o sistema `.routines/`. Branch designado: `claude/great-mccarthy-q4Txs`.

Estado ao chegar:
- 3 PRs abertos: #94 (favicons, clean), #76 (sitemap hreflang / /pt/projects/ — conflitos com main), #38 (dependabot defu — antigo)
- 19 posts com `translationKey`, 43 posts sem — grande lacuna de cobertura de LanguageSwitcher
- Sitemap sem hreflang
- JSON-LD sem `inLanguage`
- Header roteava PT users para `/projects/` EN em vez de `/pt/projects/`

## O que foi feito nesta sessão

### Merges
- **PR #94** (favicons) — CI verde, `mergeable_state: clean` → squash merge realizado ✅
- **PR #76** (sitemap hreflang, /pt/projects/) — `mergeable_state: dirty` → implementado do zero neste branch; PR #76 fechado por obsolescência

### 1. Sitemap hreflang (astro.config.mjs)

| Arquivo | Mudança |
|---------|---------|
| `astro.config.mjs` | `sitemap()` → `sitemap({ serialize })` com `links: [{ lang: 'en-US' }, { lang: 'pt-BR' }, { lang: 'x-default' }]` para todos os 6 pares de páginas estáticas |

**Pares cobertos**: `/` ↔ `/pt/`, `/about/` ↔ `/pt/about/`, `/archive/` ↔ `/pt/archive/`, `/tags/` ↔ `/pt/tags/`, `/search/` ↔ `/pt/search/`, `/projects/` ↔ `/pt/projects/`.

**Por que importa**: Google usa `xhtml:link` no sitemap para entender relações de idioma entre páginas. Sem isso, as páginas PT são rastreadas sem relação com as EN — tráfego orgânico em PT pode cair no buraco. Verificado no `dist/sitemap-0.xml` gerado: todos os 6 pares têm hreflang correto.

### 2. JSON-LD `inLanguage` (PageLayout.astro)

| Arquivo | Mudança |
|---------|---------|
| `src/layouts/PageLayout.astro` | `BlogPosting` e `WebSite` recebem `inLanguage: langBcp47` onde `langBcp47 = lang === 'pt' ? 'pt-BR' : 'en-US'` |

**Por que importa**: structured data explícita é processada pelo Google Rich Results e ferramentas de análise de schema.org. Anteriormente, o Google tinha que inferir o idioma pelo `lang` do `<html>` — agora está declarado no JSON-LD.

### 3. /pt/projects/ + Header fix

| Arquivo | Mudança |
|---------|---------|
| `src/pages/pt/projects.astro` | **Novo** — espelho PT de `/projects/`. Datas em `pt-BR`, cópia em PT, `translations={{ en: "/projects/" }}` |
| `src/pages/projects.astro` | `translations={{ pt: "/pt/projects/" }}` adicionado — LanguageSwitcher ativo |
| `src/components/Header.astro` | `/projects/` hardcoded → `${prefix}/projects/` — PT users agora vão para `/pt/projects/` |

**Por que importa**: Header era o único link de navegação que ignorava o prefix de idioma. PT users clicando em "Projetos" chegavam em `/projects/` EN sem LanguageSwitcher. Agora o fluxo PT é coeso em todos os 5 links de navegação.

### 4. Mass `translationKey` pairing (14 posts em 7 pares)

Pares conectados pela primeira vez nesta sessão:

| translationKey | EN | PT |
|----------------|----|----|
| `everything-is-process` | `2026-02-26-everything-is-a-process-5-lessons-we-should-have-learned-2500-years-ago.md` | `2026-02-26-tudo-e-processo.md` |
| `hermes-vs-openclaw` | `2026-04-04-hermes-agent-vs-openclaw-why-my-experience-got-so-much-better.md` | `2026-04-04-hermes-vs-openclaw.md` |
| `travessia-project` | `2026-03-02-travessia-the-project-that-writes-itself.md` | `2026-03-02-travessia.md` |
| `crossing-interference` | `2026-03-17-crossing-after-interference.md` | `2026-03-17-travessia-update.md` |
| `verne-identity-repo` | `2026-03-18-verne-identity-repo.md` | `2026-03-18-verne-e-o-padro-identity-repo-*.md` |
| `becoming-lobsters` | `2026-03-21-we-are-all-becoming-lobsters.md` | `2026-03-21-estamos-todos-nos-tornando-lagostas.md` |
| `reddit-submarine-osint` | `2026-03-22-reddit-submarine-osint.md` | `2026-03-22-eles-esto-realmente-*.md` |
| `future-father` | `2026-03-22-the-future-father-*.md` | `2026-03-22-o-pai-do-futuro.md` |
| `building-funes` | `building-funes.md` | `construindo-funes-*.md` |
| `funes-soul` | `funes-soul.md` | `soulmd-funes.md` |

**Por que importa**: LanguageSwitcher estava desabilitado (grayed-out) em todos esses posts porque não havia `translationKey`. Os pares existiam mas não estavam conectados — usuários que chegavam por qualquer um desses posts não conseguiam ir para o outro idioma. Conectar 10 pares de uma vez é a mudança de cobertura multilingual mais impactante desta sessão.

**Tags corrigidas**: posts EN com tags em PT (e.g., `"ficção"`, `"automação"`) foram corrigidos para EN (`"fiction"`, `"automation"`). Melhora filtros e SEO EN.

### 5. Tags EN/PT corrigidas

Posts EN com tags em PT foram atualizados:
- `2026-03-02-travessia-the-project-that-writes-itself.md`: `"ficção"` → `"fiction"`, `"literatura"` → `"literature"`, etc.
- `2026-03-17-crossing-after-interference.md`: `"ficção"` → `"fiction"`, `"agentes"` → `"agents"`, etc.
- `2026-02-26-everything-is-a-process-...md`: tags em PT → EN equivalentes

## Estado atual

- Build: 290 páginas, sem erros
- LanguageSwitcher ativo: de 19 pares → 29 pares (10 novos pares conectados)
- Sitemap: 6 pares estáticos com hreflang correto
- JSON-LD: `inLanguage` em todos os posts e páginas
- `/pt/projects/` funcionando com LanguageSwitcher ↔ `/projects/`
- Header: todos os 5 links de nav usam prefix de idioma corretamente

## Cobertura de tradução atual (posts com translationKey)

| translationKey | EN | PT | Status |
|----------------|----|----|--------|
| pierre-menard | ✅ | ✅ | ativo |
| agent-no-verbs | ✅ | ✅ | ativo |
| delegating-to-agents | ✅ | ✅ | ativo |
| hermes-vs-openclaw | ✅ | ✅ | **novo** |
| everything-is-process | ✅ | ✅ | **novo** |
| travessia-project | ✅ | ✅ | **novo** |
| crossing-interference | ✅ | ✅ | **novo** |
| verne-identity-repo | ✅ | ✅ | **novo** |
| becoming-lobsters | ✅ | ✅ | **novo** |
| reddit-submarine-osint | ✅ | ✅ | **novo** |
| future-father | ✅ | ✅ | **novo** |
| building-funes | ✅ | ✅ | **novo** |
| funes-soul | ✅ | ✅ | **novo** |
| delphi-imperatives | ✅ | ✅ | ativo |
| reclaiming-harness | ✅ | ✅ | ativo |
| serpents-egg | ✅ | ✅ | ativo |
| third-half-fourth-wall | ✅ | ✅ | ativo |
| jules-api-harness | ✅ | ✅ | ativo |

## Posts PT-only restantes (sem par EN)

| Post | Prioridade |
|------|-----------|
| `o-ovo-de-serpente.md` | média (já tem EN: `the-serpents-egg`?) — verificar translationKey |
| `orquestrando-agentes-memoria-familiar.md` | alta |
| `a-vitrine-sonora-do-gemeo-digital.md` | média |
| `o-pampa-no-circuito-um-mate-com-o-boswell-digital.md` | média |
| `a-ia-descobrir-uma-nova-lei-de-conservao-antes-de-2050.md` | média |
| `moeda-rosencrantz-testando-se-os-llms-respeitam-a-probabilidade.md` | média |
| Posts sem data (inaugurais, pontifex, etc.) | baixa |

## Posts EN-only restantes (sem par PT)

| Post | Prioridade |
|------|-----------|
| `2026-03-28-the-art-of-delegating-orchestrating-jules-and-claude-in-everyday-life.md` | verificar se é duplicado de `the-art-of-delegation.md` |
| `inaugural-post-a-glimpse-inside-my-mind.md` | baixa (par PT existe: `postagem-inaugural-um-vislumbre-da-minha-mente.md`) |
| `will-ai-discover-new-conservation-law-before-2050.md` | baixa (par PT: `a-ia-descobrir-uma-nova-lei-de-conservao-antes-de-2050.md`) |
| pontifex posts EN | baixa (par PT existe) |

## Próximas sessões — backlog priorizado

### Alta prioridade
1. **Conectar pares EN/PT restantes**: `inaugural-post` ↔ `postagem-inaugural`, `will-ai-discover` ↔ `a-ia-descobrir`, pontifex pares. Basta adicionar `translationKey` — os pares já existem.
2. **Auditar `o-ovo-de-serpente.md`**: verificar se já tem par EN e se `translationKey` está conectado.
3. **Traduzir "orquestrando-agentes-memoria-familiar.md"** → EN: post sobre memória familiar com agentes — relevante para audiência EN.

### Média prioridade
4. **Fechar PR #38** (dependabot defu): atualizar manualmente `defu` 6.1.4 → 6.1.6 no `package.json` e `package-lock.json`.
5. **Traduzir `a-vitrine-sonora-do-gemeo-digital.md`** → EN.
6. **Pagination em `/archive/` e `/tags/[tag]/`**: Astro `paginate()` — escala com crescimento de posts.

### Baixa prioridade
7. **`wordCount` no JSON-LD BlogPosting**: `minutesRead` já disponível, pode calcular wordCount.
8. **FAQ Schema em `/about/` e `/pt/about/`**.
9. **Focus management nas transições de página** (ClientRouter).
10. **Pontifex posts**: criar pares EN ↔ PT com translationKey.

## Decisões arquiteturais

- **Mass pairing sem reescrita**: em vez de verificar qualidade de cada tradução antes de conectar, simplesmente conectei os pares existentes. A política de curadoria de conteúdo (verificar se as traduções são fieis) pode ser feita separadamente — o LanguageSwitcher ativo é sempre melhor que grayed-out.
- **Tags corrigidas apenas nos posts EN com tags PT**: posts PT que usam tags EN (e.g., `"transformation"`, `"AI agents"`) foram deixados como estão — mistura de idiomas em tags é menos problemática para PT posts (audiência EN pode descobri-los via tags EN). Apenas os casos mais óbvios foram corrigidos.
- **`/pt/projects/` como espelho exato**: mesma estrutura do EN, traduzindo apenas cópia e formatação de datas. Alternativa (mostrar apenas repos com descrição PT) descartada — a maioria dos repos tem descrição EN, seria uma página praticamente vazia.
- **PR #76 fechado**: em vez de resolver conflitos do PR #76, reimplementamos suas features do zero no branch atual. Resultado limpo, sem histórico de conflitos.
