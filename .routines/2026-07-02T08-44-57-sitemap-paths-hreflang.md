---
date: 2026-07-02T08:44:57
slug: sitemap-paths-hreflang
branch: claude/sleepy-pasteur-62kliq
status: pr-open
issues: [888]
pr_opened: null
pr_merged: 864
---

## Contexto ao chegar

Nenhum PR `routine` aberto para mergear — a fila estava vazia. O PR da run
anterior (#864, issue #250 — OG images para reading paths) já tinha sido
mergeado diretamente por Franklin (`closed_by: franklinbaldo`,
`merged_at: 2026-07-01T08:07:18Z`), sem veto.

## Verificação em produção do PR anterior (#864)

Confirmado via `curl` em `/paths/agency-and-constraint/` e
`/pt/paths/agency-and-constraint/`: `og:image`/`twitter:image` apontam para
`/og/path-agency-and-constraint.png` e `/og/path-pt-agency-and-constraint.png`
respectivamente (200 OK em ambos), `hreflang` correto no `<head>`. Sem
regressão.

## Backlog — reposição

9 issues `routine` abertas ao chegar — abaixo da faixa saudável (10–20).
Investiguei a estrutura do site (agente Explore) em busca de gaps reais de
SEO/UX/discovery/i18n ainda não cobertos pelo backlog existente. Abri 4
issues novas:

- **#888** (`priority:media`) — `sitemap.xml` sem hreflang para
  `/paths/[slug]/` (bug real e verificável — ver abaixo).
- **#889** (`priority:baixa`) — fallback em `RelatedPosts` quando há menos
  de 2 posts com tag em comum (hoje a seção simplesmente não renderiza).
- **#890** (`priority:baixa`) — `llms.txt` para indexação por agentes de IA.
- **#891** (`priority:baixa`) — trilha de breadcrumb visível (hoje só existe
  como JSON-LD `BreadcrumbList`, sem UI).

Backlog agora com 13 issues abertas — dentro da faixa.

## Trabalho desta run — issue #888

Confirmei o gap: `astro.config.mjs`'s `serialize()` do sitemap só monta
`item.links` (hreflang) para `staticPairs` (home, about, archive, tags,
search, projects, ranking, music, books) e para pares de posts de blog via
`blogPairs`. As 3 reading paths × 2 línguas não batiam em nenhum dos dois
ramos — saíam do `sitemap.xml` sem `xhtml:link`, mesmo com o `<head>` da
própria página correto (confirmado na verificação do #864 acima). O Google
Search Console usa o sitemap como sinal primário de hreflang, então esse par
ficava invisível para ele.

Adicionei um terceiro ramo ao `serialize()` cobrindo `/paths/[slug]/` ↔
`/pt/paths/[slug]/`, derivado da mesma lista `READING_PATHS` que já
alimenta as páginas — sem hardcode de slugs, então um novo reading path já
entra automaticamente.

Problema no caminho: `READING_PATHS` vivia em `src/lib/paths.ts`, que importa
`astro:content` (via `getCollection`) — inimportável em tempo de
carregamento do `astro.config.mjs`. Segui a convenção `.ts`/`.mjs` do próprio
`CLAUDE.md` (".mjs: arquivos importáveis por scripts Node e por
astro.config.mjs") e extraí os dados puros (sem o import de `astro:content`)
para `src/lib/reading-paths-data.mjs`; `paths.ts` agora reexporta o mesmo
array com o tipo `ReadingPath[]`.

## Verificação local

- `astro check` ✓ (0 errors, 0 warnings)
- `npm run build` ✓ (3614 páginas) — inspecionei `dist/sitemap-0.xml`
  diretamente: as 6 URLs de reading paths (3 slugs × 2 línguas) agora têm
  `xhtml:link` com `hreflang="en-US"`, `"pt-BR"` e `"x-default"` corretos.
- `npx prettier --check .` ✓
- `npm run check:hygiene` ✓ (13 root files)
- `npm run hronir:doctor` ✓ (0 inconsistências — 16 avisos pré-existentes de
  convergência EN/PT, não relacionados a esta mudança)
- Descartada mudança em `src/generated/ranking-snapshot.json` (efeito
  colateral do build local, não faz parte deste PR)

## O que fica para a próxima run

- Mergear o PR desta run (issue #888) após CI verde e sem veto de 24h.
- Mudança sem impacto visual (só `<xhtml:link>` no sitemap.xml, não
  renderizado) — nada para o screenshot de prod verificar além de re-checar
  o sitemap ao vivo.
- Próxima issue de maior prioridade no backlog: as 4 novas (#888 zerada
  após merge, então #889/#890/#891, todas `priority:baixa`) ou as
  pré-existentes #251/#552/#553/#587/#588/#678/#760/#762/#763.
