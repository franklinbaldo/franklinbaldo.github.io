---
date: 2026-05-15
slug: pt-archive-tags-delphi
branch: claude/affectionate-dirac-yyLpv
status: pr-open
session: 4
---

# Sessão 2026-05-15 — PT Archive, LangFilter em Tags, Tradução de Delfos

## Contexto

Quarta sessão com o sistema `.routines/`. Chegou com PR #68 aberto
(ToC, RelatedPosts, primeiros pares translationKey: pierre-menard e agent-no-verbs).
Objetivo: completar a cobertura multilingual com `/pt/archive/`, filtro de idioma
em `/tags/`, e tradução fiel do post "The Three Imperatives at Delphi".

## O que foi feito nesta sessão

### Merge de PR aberta

- **PR #68** (ToC + Related Posts + primeiras traduções) — CI checks verdes (GitGuardian + Kilo) → squash merge realizado.
- **PR #38** (dependabot defu) — mantida aberta (conflito de merge; baixa prioridade).

### Implementações nesta branch (`claude/affectionate-dirac-yyLpv`)

| Arquivo                                                          | Mudança                                                                                                                                                       |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/pages/pt/archive.astro`                                     | **Novo** — `/pt/archive/`: textos em PT, datas `pt-BR`, `translationHref="/archive/"`, flag 🇺🇸 nos posts EN (inverso do arquivo EN que mostra 🇧🇷), LangFilter |
| `src/pages/archive.astro`                                        | `translationHref="/pt/archive/"` adicionado ao PageLayout — LanguageSwitcher não fica mais grayed-out no `/archive/`                                          |
| `src/pages/tags/[tag].astro`                                     | `<LangFilter client:load />` adicionado após o `<h1>` — PostCard já tem `data-post-lang`, então o filtro funciona sem mais mudanças                           |
| `src/content/blog/2026-05-04-the-three-imperatives-at-delphi.md` | `translationKey: delphi-imperatives` adicionado ao frontmatter                                                                                                |
| `src/content/blog/os-tres-imperativos-em-delfos.md`              | **Novo** — tradução fiel completa de "The Three Imperatives at Delphi" em PT, terceira parte da série harness                                                 |

### Por que cada mudança importa

- **`/pt/archive/`**: fecha a lacuna de cobertura multilingual — agora `/`, `/about/`, e `/archive/` têm versões PT com hreflang e translationHref cruzados. Usuários PT chegam ao arquivo direto em `/pt/archive/` via auto-redirect.
- **`translationHref` no archive EN**: sem isso, o LanguageSwitcher ficava grayed-out em `/archive/` para usuários PT — frustração de UX clara.
- **flag 🇺🇸 no `/pt/archive/`**: design simétrico ao 🇧🇷 no `/archive/` EN — permite ao leitor PT identificar posts em inglês antes de clicar.
- **LangFilter em `/tags/[tag]/`**: consistência UX com `/`, `/archive/` e `/pt/`; tag pages são landing pages frequentes por buscas. Sem filtro, usuário PT via SEO via tag encontrava posts EN misturados sem controle.
- **`translationKey: delphi-imperatives`**: ativa o LanguageSwitcher no post EN e no PT — terceira entrada do par; segue o padrão estabelecido por pierre-menard e agent-no-verbs.
- **Tradução de Delfos**: terceiro post da série harness traduzido. O post é o mais longo da série (~8KB) com SVG inline, Mermaid, memes, footnote com Pascal, citações gregas — tudo preservado fielmente. Tags PT adicionadas para surfar em RelatedPosts.

## Estado atual do sistema multilingual

- [x] LanguageSwitcher com auto-redirect e localStorage (PR #66)
- [x] Todos os posts tagueados com `lang: en` ou `lang: pt` (PR #66)
- [x] Infraestrutura `translationKey` para pares de tradução (PR #66)
- [x] Filtro de idioma em `/` e `/archive/` (PR #67)
- [x] Páginas estáticas `/pt/` e `/pt/about/` (PR #67)
- [x] Table of Contents para posts longos (PR #68)
- [x] Related Posts ao fim de cada post (PR #68)
- [x] Pares translationKey: pierre-menard (EN↔PT), agent-no-verbs (EN↔PT) (PR #68)
- [x] `/pt/archive/` com datas PT-BR e LangFilter (esta sessão)
- [x] `translationHref` em `/archive/` EN (esta sessão)
- [x] LangFilter em `/tags/[tag]/` (esta sessão)
- [x] Par translationKey: delphi-imperatives (EN↔PT) (esta sessão)
- [ ] Traduções dos posts restantes da série harness (2 restantes: reclaiming-the-harness, third-half-fourth-wall, jules-api-harness-backend)
- [ ] `/pt/tags/` e `/pt/archive/tags/` (se priorizado)
- [ ] Filtro de idioma em `/search/`
- [ ] Sticky ToC sidebar em telas largas

## Próximas sessões — backlog priorizado

### Alta prioridade

1. **Traduzir `2026-05-01-the-third-half-and-the-fourth-wall`** (PT) — segundo post da série harness, referenciado em Delfos. Slug: `a-terceira-metade-e-a-quarta-parede.md`.
2. **Traduzir `2026-04-29-reclaiming-the-harness`** (PT) — primeiro post da série; permite que toda a sequência harness esteja disponível em PT. Slug: `recuperando-o-harness.md`.
3. **Traduzir `2026-05-10-jules-api-harness-backend`** (PT) — quarto post da série.

### Média prioridade

4. **LangFilter em `/search/`** — consistência UX. O pagefind não filtra por lang nativamente; o LangFilter poderia pelo menos aplicar `display:none` nos resultados com `[data-post-lang]`, mas os resultados do Pagefind não têm esse atributo — precisaria de abordagem diferente (ex.: metadado de lang no índice pagefind via `data-pagefind-filter="lang:pt"`).
5. **Sticky ToC sidebar em telas largas** — CSS grid `aside` ao lado do `article` em `>1024px`. Backlog desde PR #68.
6. **`/pt/tags/`** — versão PT da listagem de tags com texto em português.
7. **dependabot #38** — atualizar `defu` manualmente (npm update defu, commitar lock file).

### Baixa prioridade

8. **`og:locale:alternate`** quando `lang=pt`.
9. **FAQ Schema** na `/about/` e `/pt/about/`.
10. **Focus management** nas transições de página (ClientRouter).

## Decisões arquiteturais

- **`/pt/archive/` como arquivo `.astro` separado, não componente parametrizado**: segue o padrão de `/pt/index.astro` e `/pt/about.astro`. Evita complexidade de prop drilling para as diferenças de locale (formato de data, labels).
- **flag 🇺🇸 no `/pt/archive/` para posts EN (em vez de 🇧🇷 para posts PT)**: no arquivo EN, 🇧🇷 marca os minoritários (posts PT). No PT, 🇺🇸 marca os minoritários (posts EN). Lógica simétrica, sinalizando o idioma não-padrão da perspectiva do leitor.
- **LangFilter em tags com `client:load`**: igual ao `/archive/` — `client:idle` causaria flash; PostCard já tem `data-post-lang` no `<article>` raiz, então nenhuma mudança no PostCard foi necessária.
- **Tradução fiel, não adaptada**: igual à política adotada em PR #68. O SVG, Mermaid, memes, código Pascal, notas de rodapé e todas as referências foram preservados integralmente; apenas o texto em prosa foi traduzido. A nota de rodapé sobre Delphi-a-linguagem foi traduzida mas o código Pascal foi mantido inalterado (é uma unidade técnica auto-contida).
- **Build: 148 páginas** — up from 144 (PR #68). As 4 novas: `/pt/archive/`, `/blog/os-tres-imperativos-em-delfos/`, e as páginas OG correspondentes.
