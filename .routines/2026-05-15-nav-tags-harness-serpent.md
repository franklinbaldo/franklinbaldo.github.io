---
date: 2026-05-15
slug: nav-tags-harness-serpent
branch: claude/affectionate-dirac-WlWHf
status: pr-open
session: 5
---

# Sessão 2026-05-15 — Nav PT-aware, /pt/tags/, Harness PT, Serpente EN

## Contexto

Quinta sessão. Chegou com PR #69 aberto (pt/archive/, LangFilter em tags, tradução de Delfos). CI verde → squash merge realizado.

Estado atual do blog: 155 páginas, 3 pares de tradução funcionando (Pierre Menard, Agente Sem Verbos, Três Imperativos). Header ainda usava URLs EN fixas independente da lang da página. `/pt/tags/` não existia. "Continue reading" aparecia em inglês em posts PT.

## O que foi feito nesta sessão

### Merge de PR aberta
- **PR #69** (pt/archive/, LangFilter em tags, Delfos PT) — CI verde → squash merge.

### UI: Header language-aware

| Arquivo | Mudança |
|---------|---------|
| `src/components/Header.astro` | Adicionado prop `lang?: 'en' \| 'pt'`. Quando `lang='pt'`, links de nav usam URLs PT: `/pt/` (Home), `/pt/archive/`, `/pt/tags/`, `/pt/about/`. "Franklin Baldo" agora é link clicável para o home correto. |
| `src/layouts/PageLayout.astro` | Passa `lang` para `<Header lang={lang} />` |

**Por que importa**: usuários PT navegando o blog viam o Header apontar para `/archive/` (EN), `/tags/` (EN) etc. O LanguageSwitcher os redirecionava, mas os links de nav os tiravam do contexto PT novamente. Agora o Header é coerente com a língua da página.

### UI: PostCard "Continue reading" localizado

| Arquivo | Mudança |
|---------|---------|
| `src/components/PostCard.astro` | CTA usa `postLang === 'pt' ? 'Continuar lendo →' : 'Continue reading →'` |

**Por que importa**: em qualquer lista de posts, o CTA agora reflete o idioma do post — melhora micro-copy e sinalização.

### Nova página: /pt/tags/

| Arquivo | Mudança |
|---------|---------|
| `src/pages/pt/tags/index.astro` | **Novo** — espelho PT da página de tags. Título "Etiquetas", descrição em PT. `lang="pt"`, `translationHref="/tags/"`. Links apontam para `/tags/[tag]/` (que tem LangFilter). |
| `src/pages/tags/index.astro` | Adicionado `lang="en" translationHref="/pt/tags/"` para ativar LanguageSwitcher. |

**Por que importa**: `/pt/tags/` era o único link de nav PT sem página PT correspondente. LanguageSwitcher ficava grayed-out em `/tags/`. Agora completo.

### 2 novos pares de tradução

#### "Recuperando o Harness" (PT translation of Reclaiming the Harness)

| Par | EN | PT |
|-----|----|----|
| **Reclaiming/Recuperando** | `2026-04-29-reclaiming-the-harness.md` (adicionado `translationKey: reclaiming-harness`) | `2026-04-29-recuperando-o-harness.md` **novo** |

Post mais importante da série harness (featured, seriesOrder: 1). Tradução fiel preservando:
- Greentexts em estilo "4chan" (cultura internet — mantidos em PT idiomático)
- Memes do Waluigi (explicados no contexto)
- Tabelas técnicas (harness triad, failure modes)
- Referências ao canivete e Ireneo/Aparicio/Claudio
- Código Python do protocolo Backend
- Tom informal + argumentação séria

#### "The Serpent's Egg" (EN translation of O Ovo de Serpente)

| Par | EN | PT |
|-----|----|----|
| **Serpent's Egg** | `2026-05-10-the-serpents-egg.md` **novo** | `o-ovo-de-serpente.md` (adicionado `translationKey: serpents-egg`) |

Único post PT-only sem par EN. Artigo sobre CPC 2015, art. 489 §1º, patrimonialismo judicial e Fux. Tradução fiel preservando:
- SVGs inline com IDs renomeados (-en suffix para evitar conflito)
- Diagrama Mermaid (mantido identico)
- Termos jurídicos em PT com explicação inline onde necessário
- Referências bibliográficas (com títulos PT preservados + tradução)
- Tom gonzo+acadêmico

## Estado atual (build: 155 páginas, sem erros)

- 5 pares de tradução funcionando com `translationKey` + LanguageSwitcher ativo
- Header PT-aware em todas as páginas PT
- `/pt/tags/` completa com LanguageSwitcher ativo
- PostCard CTA localizado

## Cobertura de tradução atual

| Post EN | Par PT | Status |
|---------|--------|--------|
| Reclaiming the Harness | recuperando-o-harness | ✅ novo |
| The Third Half and the Fourth Wall | — | ❌ falta |
| The Three Imperatives at Delphi | os-tres-imperativos-em-delfos | ✅ PR #69 |
| Jules API Harness Backend | — | ❌ falta |
| The Agent That Doesn't Invent Verbs | o-agente-que-nao-inventa-verbos | ✅ PR #68 |
| Pierre Menard Computational Researcher | pierre-menard-pesquisador-computacional | ✅ PR #68 |
| O Ovo de Serpente | the-serpents-egg | ✅ novo |
| Outros posts (20+) | — | ❌ sem par |

## Próximas sessões — backlog priorizado

### Alta prioridade
1. **Traduzir harness série PT**: `the-third-half-and-the-fourth-wall` → PT, `jules-api-harness-backend` → PT. Completa a série de 4 posts com par PT (seriesOrder 2 e 4).
2. **Sticky ToC sidebar em telas largas**: CSS `position: sticky` no ToC para posts com ≥ 3 seções. Melhora navegação sem alterar mobile.
3. **`/pt/tags/[tag]/`** (opcional): rota PT que pré-filtra posts PT. Hoje `/pt/tags/` leva para `/tags/[tag]/` com LangFilter. Pode adicionar rota PT dedicada se quiser URL canônica PT.

### Média prioridade
4. **Pagination em `/archive/` e `/tags/[tag]/`**: cresce mal. Astro `paginate()`.
5. **`og:locale:alternate`** nos posts PT: já tem hreflang, falta og:locale:alternate.
6. **`/pt/projects/`** — `/projects/` não tem PT equivalente. Pode ser redirect ou página mínima.
7. **Traduzir posts PT→EN**: `tudo-e-processo`, `travessia`, `delegando-para-agentes`, `hermes-vs-openclaw` — posts PT-only que dariam alcance EN.

### Baixa prioridade
8. **dependabot #38** — `defu` 6.1.4→6.1.6, conflito de merge antigo. Fechar e atualizar manualmente.
9. **wordCount no JSON-LD** — minutesRead já disponível.
10. **FAQ Schema** na `/about/`.
11. **Caching GitHub Projects** — fallback se API falhar.

## Decisões arquiteturais

- **Header recebe `lang` via prop, não via Astro.url**: cleanest approach — PageLayout já tem `lang`, basta passar para Header. Evita lógica de URL no componente.
- **`/pt/tags/` linka para `/tags/[tag]/` (não `/pt/tags/[tag]/`)**: as páginas `/tags/[tag]/` já têm LangFilter funcionando. Criar `/pt/tags/[tag]/` seria duplicação sem benefício imediato. Pode ser adicionado na próxima sessão se necessário.
- **SVG IDs com sufixo -en no Serpent's Egg**: os SVGs originais têm `id="arr3"`, `id="arr4"`. Ambas as versões podem aparecer na mesma página por ClientRouter/prefetch. IDs renomeados para `arr3-en`, `arr4-en` para evitar conflito de marker IDs no SVG.
- **Greentexts em PT**: mantidos no estilo greentext (4chan) mas com texto em PT — funciona porque essa estética é conhecida no Brasil. Alternativa (manter EN) foi descartada por inconsistência com o tom.
