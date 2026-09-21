---
date: 2026-07-09T05:16:53
slug: shallow-clone-datemodified
branch: claude/sleepy-pasteur-eqkb7r
status: pr-open
issues: [760]
pr_opened: 1043
pr_merged: null
---

## Contexto ao chegar

Nenhum PR `routine` aberto — a #1015 (tradução PT de `events-welcome`, deixada
aberta pela run de 2026-07-08T05-09-01) já tinha sido mergeada por Franklin
diretamente, fora do fluxo autônomo. Verifiquei a versão publicada agora:
`/blog/events-welcome/` e `/pt/blog/bem-vindo-a-eventos-ate-o-fundo/` estão no
ar, com `hreflang` recíproco confirmado nas duas direções. Correção confirmada
em produção.

O único PR aberto no repo era o #1032 (RFC 0015, aberto por Franklin
diretamente, sem label `routine`) — fora de escopo, não toquei.

Backlog em 9 issues `routine` abertas — abaixo do piso de 10.

## Reposição do backlog

Pedi uma investigação de "para onde o blog deveria ir" em vez de mais um
item tático. O achado: o sistema Hrönir (o projeto mais autoral do blog) já
gerou 2.466 arquivos de duelo, cada um virando uma página estática indexável
em `/ranking/battles/[id]/` e afins — e nenhuma delas linka de volta pro
único parágrafo em linguagem simples que explica o que é o sistema (um
`<details>` recolhido em `/ranking/`). Ou seja: milhares de páginas em jargão
puro, sem noindex, potencialmente recebendo tráfego orgânico frio. Abri a
**#1042** (`priority:media`) com o achado e um esboço de correção. Backlog
voltou a 10.

## O que fiz

Peguei a **#760** (dateModified no JSON-LD) — o único item `priority:media`
aberto era a #1042 que acabei de criar (escopo maior, decisão editorial sobre
indexação; deixei para uma run dedicada com sua própria janela de veto), então
fui para o `baixa` mais bem definido.

Ao investigar #760 descobri que a peça (`remark-git-modified.mjs`) já existe
desde 06/07, mas está **quebrada em produção de um jeito que inventa datas**:
`deploy.yml` faz checkout raso (`fetch-depth` padrão = 1), então o `git log
--follow` por arquivo só vê o commit do deploy — todo post do site, em todo
deploy, reportava o timestamp do próprio deploy como "última modificação".
Confirmei ao vivo: `/blog/xadrez-en/` (publicado 2025-08-29, nunca revisado)
mostrava "updated July 8, 2026", batendo exatamente com o deploy anterior.
Isso é o oposto do invariante da própria #760 ("não inventar datas") e é
sinal de freshness falso — exatamente o tipo de coisa que o Google trata como
manipulação quando descobre que não corresponde a edição real.

Corrigi na raiz, não com um patch por cima:
- `deploy.yml`: checkout com `fetch-depth: 0` (histórico completo), para o
  `git log --follow` em produção ver o histórico real de cada post.
- `remark-git-modified.mjs`: guarda de defesa-em-profundidade —
  `git rev-parse --is-shallow-repository` checado uma vez por build; se raso,
  omite o campo em vez de inventar data (protege contra regressão futura do
  `fetch-depth`, e contra sandboxes/dev locais rasos — que é exatamente onde
  rodei e testei o fix, já que este ambiente também é um clone raso).

Verificações locais:
- `npm run build` — confirmei que, no clone raso deste sandbox, o guard faz
  `dateModified`/badge "updated" sumirem (comportamento correto: omitir, não
  inventar) em vez do valor fabricado de antes
- `npx astro check` — 0 erros
- `npm run hronir:doctor` — 0 inconsistências (3 avisos pré-existentes de
  divergência de timestamp EN/PT — `events-welcome`, `music-mindfulness`,
  `music-riobaldo-e-o-aleph` — não relacionados a este PR)
- `npx prettier --check` nos arquivos alterados — limpo
- `node scripts/check-hygiene.mjs` — limpo
- `ranking-snapshot.json` teve churn do build local — revertido, mantendo o
  PR focado

## Fica para a próxima run

- Mergear o PR #1043 se CI verde e sem veto
- Após o deploy (que agora terá histórico completo pela primeira vez),
  verificar produção: posts com `previousVersion` real (ex.
  `will-ai-discover-new-conservation-law-before-2050`) devem passar a mostrar
  `dateModified`/badge "updated" **correto** (data da revisão, não do deploy);
  `/blog/xadrez-en/` não deve mais mostrar o badge "updated" (nunca foi
  revisado)
- Considerar a #1042 (identidade do Hrönir em escala) como próximo item de
  prioridade média, numa run com espaço pra essa decisão editorial
- Backlog em 10 issues — no piso da faixa; próxima run deve repor se cair
  abaixo antes de executar
