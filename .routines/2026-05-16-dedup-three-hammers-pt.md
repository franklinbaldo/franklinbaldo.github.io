---
date: 2026-05-16
slug: dedup-three-hammers-pt
branch: claude/great-mccarthy-Jqq7N
status: pr-open
session: 10
---

# Sessão 2026-05-16 — Dedup translationKey, Three Hammers PT, Orphan Draft

## Contexto

Décima sessão com o sistema `.routines/`. Branch designado: `claude/great-mccarthy-Jqq7N`.

Estado ao chegar:

- 0 PRs abertos (todos mergeados na sessão anterior)
- 20 posts com **dois** campos `translationKey` no frontmatter YAML — bug de dados herdado de sessões que adicionaram novos keys sem remover os antigos
- `three-hammers` sem par PT (único post recente sem tradução)
- Post órfão `2026-03-28-the-art-of-delegating-orchestrating-jules-and-claude-in-everyday-life.md` com `draft: false` mas sem `translationKey` — quase-duplicata de `the-art-of-delegation.md`

## O que foi feito nesta sessão

### 1. Fix de campos `translationKey` duplicados (20 arquivos)

**Por que é crítico**: Em YAML, campos duplicados têm comportamento indefinido — a maioria dos parsers usa o último valor, mas o comportamento não é garantido pelo spec. O Astro usa `js-yaml` que silencia o aviso e usa o último valor. Isso significa que alguns posts estavam sendo roteados com a key ERRADA (o valor antigo e longo em vez do novo curto), quebrando silenciosamente o LanguageSwitcher.

**Estratégia**: script Python que:

1. Abre cada arquivo afetado
2. Remove TODOS os campos `translationKey` do frontmatter
3. Reinsere o valor correto (o novo/curto) logo após o campo `lang:`

**Arquivos corrigidos** (20 no total, 10 pares):

| Par                                                                          | translationKey correto   | Key antiga removida                                                       |
| ---------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------- |
| `everything-is-a-process-5-...md` + `tudo-e-processo.md`                     | `everything-is-process`  | `everything-is-a-process-5-lessons-we-should-have-learned-2500-years-ago` |
| `travessia-the-project-that-writes-itself.md` + `travessia.md`               | `travessia-project`      | `travessia-the-project-that-writes-itself`                                |
| `crossing-after-interference.md` + `travessia-update.md`                     | `crossing-interference`  | `crossing-after-interference`                                             |
| `we-are-all-becoming-lobsters.md` + `estamos-todos-nos-tornando-lagostas.md` | `becoming-lobsters`      | `we-are-all-becoming-lobsters`                                            |
| `reddit-submarine-osint.md` + `eles-esto-realmente-...md`                    | `reddit-submarine-osint` | `reddit-submarine`                                                        |
| `building-funes.md` + `construindo-funes-...md`                              | `building-funes`         | `building-funes` (idêntico — dedup)                                       |
| `funes-soul.md` + `soulmd-funes.md`                                          | `funes-soul`             | `soul-md`                                                                 |
| `verne-identity-repo.md` + `verne-e-o-padro-identity-repo-...md`             | `verne-identity-repo`    | `verne-identity-repo` (idêntico — dedup)                                  |
| `the-future-father-...md` + `o-pai-do-futuro.md`                             | `future-father`          | `future-father` (idêntico — dedup)                                        |
| `hermes-agent-vs-openclaw-...md` + `hermes-vs-openclaw.md`                   | `hermes-vs-openclaw`     | `hermes-agent-vs-openclaw-why-my-experience-got-so-much-better`           |

**Resultado**: build continua clean (293 páginas), LanguageSwitcher agora usa keys corretas e curtas em todos os posts.

### 2. Tradução PT de "Three Hammers Walk Into a Bar"

**Arquivo criado**: `src/content/blog/2026-05-15-tres-martelos-entram-num-bar.md`

**Por que agora**: Era o único post recente (últimas semanas) sem par PT. O post é biograficamente denso e tem muita terminologia jurídico-administrativa brasileira que já estava em português no original EN — o que torna a tradução PT particularmente natural e valiosa para leitores brasileiros que veriam o texto "de dentro" em vez de como observadores.

**Decisões de tradução**:

- Todos os termos jurídico-administrativos (_papelada_, _despacho_, _visto_, _servidor_, _Constituição_, etc.) mantidos em PT pois eram os termos originais
- Vocabulário técnico de alinhamento traduzido: _affordance enumeration_ → _enumeração de affordances_, _content-addressed canon_ → _cânone endereçado por conteúdo_
- Meme Drake adaptado com texto PT (URL do memegen alterada para texto PT)
- Pull-quote traduzida para PT
- Links internos atualizados para versões PT (`/blog/2026-05-14-o-agente-que-nao-inventa-verbos`, `/blog/pierre-menard-pesquisador-computacional`)
- Further reading: referências originais mantidas em EN (são títulos de livros/papers reais); entrada do artigo do Franklin atualizada para "Alinhamento por Restrição de Affordances"

### 3. Post órfão marcado como draft

**Arquivo**: `2026-03-28-the-art-of-delegating-orchestrating-jules-and-claude-in-everyday-life.md`

**Por quê**: Quase-duplicata de `2026-03-28-the-art-of-delegation.md` — mesmo tema, mesma data, conteúdo similar, sem `translationKey`. O segundo tem `translationKey: "delegating-to-agents"` e está pareado com o PT. Manter ambos seria ruído nos resultados de busca e Related Posts. Marcado `draft: true` em vez de deletado (pode ser aproveitado no futuro ou comparado).

## Build

293 páginas (up from 290 da sessão anterior). +3:

- `/blog/2026-05-15-tres-martelos-entram-num-bar/` (novo)
- `/og/2026-05-15-tres-martelos-entram-num-bar.png` (novo)
- Post órfão delegating removido do build por `draft: true` (-1)
- Net: +2 novas páginas públicas

## Estado atual de pares de tradução

**30 pares ativos** (era 29 na sessão anterior, +1 three-hammers).

| Par                    | EN  | PT          |
| ---------------------- | --- | ----------- |
| three-hammers          | ✅  | ✅ **novo** |
| pierre-menard          | ✅  | ✅          |
| agent-no-verbs         | ✅  | ✅          |
| delegating-to-agents   | ✅  | ✅          |
| hermes-vs-openclaw     | ✅  | ✅          |
| everything-is-process  | ✅  | ✅          |
| travessia-project      | ✅  | ✅          |
| crossing-interference  | ✅  | ✅          |
| verne-identity-repo    | ✅  | ✅          |
| becoming-lobsters      | ✅  | ✅          |
| reddit-submarine-osint | ✅  | ✅          |
| future-father          | ✅  | ✅          |
| building-funes         | ✅  | ✅          |
| funes-soul             | ✅  | ✅          |
| delphi-imperatives     | ✅  | ✅          |
| reclaiming-harness     | ✅  | ✅          |
| serpents-egg           | ✅  | ✅          |
| third-half-fourth-wall | ✅  | ✅          |
| jules-api-harness      | ✅  | ✅          |
| asterisk-protects      | ✅  | ✅          |
| conservation-law       | ✅  | ✅          |
| vitrine-sonora         | ✅  | ✅          |
| pampa-circuit          | ✅  | ✅          |
| intelligible-void      | ✅  | ✅          |
| family-memory          | ✅  | ✅          |
| social-vulnerabilities | ✅  | ✅          |
| rosencrantz-coin       | ✅  | ✅          |
| inaugural-post         | ✅  | ✅          |
| pontifex-guide         | ✅  | ✅          |
| pontifex-research      | ✅  | ✅          |
| conceptual-document    | ✅  | ✅          |

## Próximas sessões — backlog priorizado

### Alta prioridade

1. **Atualizar `defu` (PR #38 dependabot)**: `defu` 6.1.4 → 6.1.6 no `package.json`. PR antigo de dependabot — atualização simples sem breaking changes.
2. **SEO**: Adicionar `wordCount` ao JSON-LD `BlogPosting` — `minutesRead` disponível, pode estimar wordCount (minutesRead × 200 words/min).
3. **SEO**: FAQ Schema em `/about/` e `/pt/about/` — 3-5 FAQs sobre o autor/blog adicionam rich results.
4. **Tradução PT de posts EN-only restantes**: verificar se há posts EN sem par PT (todos os importantes já estão pareados, mas pode haver posts mais antigos).

### Média prioridade

5. **Sticky ToC sidebar**: o CSS do `.toc-col` já implementa `position: sticky` para ≥1100px. Verificar se `IntersectionObserver` para highlight do item ativo seria útil.
6. **`wordCount` no JSON-LD**: `minutesRead * 200` como estimativa.
7. **Pagination**: `/archive/` e `/tags/[tag]/` com Astro `paginate()` — escala com crescimento.
8. **Canonical tag no `<head>`**: verificar se `PageLayout.astro` já emite `<link rel="canonical">` corretamente para todas as páginas (incluindo PT).

### Baixa prioridade

9. **Focus management nas transições de página** (ClientRouter).
10. **`og:locale:alternate` para posts PT-only sem par EN** (atualmente só gerado quando `translationHref` presente).

## Decisões arquiteturais

- **Script Python para dedup vs edits manuais**: script foi mais seguro pois garantiu tratamento uniforme dos 20 arquivos e documentou o padrão de fix. Edit manual por arquivo seria propenso a erro.
- **Tradução de three-hammers agora**: prioridade justificada pelo fato de ser o único post recente sem par PT — posts mais antigos (que já têm pares) têm menos urgência.
- **Draft em vez de delete para o orphan**: preservação do conteúdo para possível reutilização. O post tem valor como rascunho ou referência histórica.
- **Meme adaptado para PT**: a URL do memegen aceita textos em qualquer idioma — melhor UX para leitores PT do que manter texto EN num post PT.
