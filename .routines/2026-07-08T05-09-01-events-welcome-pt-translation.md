---
date: 2026-07-08T05:09:01
slug: events-welcome-pt-translation
branch: claude/sleepy-pasteur-0hvh2x
status: pr-open
issues: [1014]
pr_opened: null
pr_merged: 994
---

## Contexto ao chegar

Nenhum PR `routine` aberto — o PR #994 (fix do template `brain`→`gb` do
memegen.link, deixado aberto pela run de 2026-07-07T05-06-36) já tinha sido
mergeado por Franklin diretamente (`merged_by: franklinbaldo`), fora do fluxo
autônomo. Como nenhuma run tinha verificado ainda a versão publicada, fiz essa
checagem agora: busquei o HTML de produção de `/blog/tree-reads-itself/` e
`/blog/everything-is-eml/` e confirmei que as duas URLs de imagem já usam
`.../images/gb/...` e retornam 200/301 (não mais 404). Correção confirmada em
produção.

Backlog em 9 issues `routine` abertas — abaixo do piso de 10. Antes de
escolher trabalho, precisava repor.

## Reposição do backlog

Ao investigar paridade i18n (um dos eixos "futuro do blog" no escopo da
rotina), encontrei uma lacuna real e não-trivial: 11 posts de blog (não-música,
`lang: en`) sem `translationKey` e sem nenhum par PT-BR — alguns publicados
desde março de 2026, então não é lacuna transitória. Abri a **#1014**
(`priority:media`) catalogando os 11 slugs e propondo tratar como série de
PRs pequenos (1–3 posts por vez), não uma tradução em massa de uma vez só.
Backlog voltou a 10 issues abertas — no piso da faixa 10–20.

## O que fiz

Peguei a **#1014** (maior prioridade entre as abertas, `media` vs `baixa` do
resto do backlog) e fiz o primeiro incremento: traduzi o post mais curto da
lista, `events-welcome` ("Welcome to Events All the Way Down", 239 palavras,
2026-03-22) — um texto pessoal/manifesto sobre o próprio blog, então baixo
risco de deriva técnica na tradução.

- Criei `src/content/blog/bem-vindo-a-eventos-ate-o-fundo/v-2026-07-08T05-03-07.md`
  — tradução completa e fiel ao tom do original, `lang: pt`,
  `translationKey: events-welcome`, tags mantidas em inglês (convenção já
  observada no par `building-funes`/`construindo-funes-...`).
- Adicionei `translationKey: events-welcome` ao lado EN (`events-welcome/v-2026-06-10T05-09-44.md`),
  que não tinha o campo antes — corrigi também um `lang: en` duplicado no
  frontmatter original que isso expôs.
- Rodei `npm run hronir:select` (regenera `versions-selected.json`, não
  commitado) e `node scripts/generate-translation-pairs.mjs` — o novo par
  apareceu corretamente em `blog-translation-pairs.json` (commitado).

Verificações locais:
- `npx astro check` — 0 erros, 0 warnings (só hints pré-existentes)
- `npm run build` — completo, 4446 páginas, sem falhas; confirmei no HTML
  gerado que `/pt/blog/bem-vindo-a-eventos-ate-o-fundo/` renderiza com
  `` correto e que a página EN ganhou os links
  `hreflang="pt-BR"`/`hreflang="en"` recíprocos
- `npm run hronir:doctor` — 0 inconsistências (só um aviso não-bloqueante de
  divergência de timestamp entre EN/PT, esperado para um par novo — mesma
  categoria de aviso que já existe para outros pares)
- `npx prettier --check` nos arquivos alterados — limpo
- `node scripts/check-hygiene.mjs` — limpo
- `ranking-snapshot.json` teve churn não relacionado (sessões Hrönir
  mescladas desde o último build) — revertido, seguindo o mesmo cuidado da
  run anterior, para manter o PR focado só na tradução

## Fica para a próxima run

- Mergear este PR se CI verde e sem veto de Franklin sobre a qualidade da
  tradução (é a primeira vez que uma run traduz um ensaio inteiro do zero,
  não só pareia conteúdo existente — vale atenção extra na janela de veto)
- Verificar screenshot de produção de `/pt/blog/bem-vindo-a-eventos-ate-o-fundo/`
  e `/blog/events-welcome/` após deploy
- Continuar a #1014 com os outros 10 posts, um ou poucos por vez
- Backlog em 10 issues — no piso da faixa; próxima run deve repor se cair
  abaixo antes de executar
