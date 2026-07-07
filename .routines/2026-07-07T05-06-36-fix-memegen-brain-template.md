---
date: 2026-07-07T05:06:36
slug: fix-memegen-brain-template
branch: routine/fix-memegen-brain-template
status: pr-open
issues: [979]
pr_opened: null
pr_merged: null
---

Cheguei sem nenhum PR `routine` pendente para mergear — a run anterior não tinha
deixado nada aberto (só commits de sessões Hrönir nas últimas horas, que não são
meus). Backlog de issues `routine` está em 10 abertas, exatamente no piso da
faixa 10–20, então não criei issue nova nesta run.

Escolhi a #979 (bug: imagens quebradas em 2 posts — template `brain` do
memegen.link renomeado para `gb`) por ser um bug real já em produção, com
escopo pequeno e bem definido. Confirmei com `curl` que `.../images/brain/...`
retorna 404 e `.../images/gb/...` retorna 200 para as duas URLs afetadas
(`tree-reads-itself` e `everything-is-eml`). Antes de editar o conteúdo,
verifiquei que nenhum rate file em `.routines/hronir/rates/` referencia essas
duas versões — como cada post só tem um único arquivo `v-*.md` (sem outras
versões concorrendo), editar a URL diretamente não quebra nenhuma avaliação
Hrönir existente nem descola histórico.

Troquei `brain` → `gb` nas duas URLs, rodei
`node scripts/generate-image-dimensions.mjs` (2 imagens novas sondadas com
sucesso, cache atualizado), depois `astro check` (0 erros) e `npm run build`
(completo, sem falhas). O build também regenerou `ranking-snapshot.json` com
churn não relacionado (rankings mudaram desde o último commit por causa das
sessões Hrönir mescladas nas últimas horas) — revertido esse arquivo para
manter o PR focado só na correção de imagem.

Fica para a próxima run: mergear este PR (após CI verde) e verificar em
produção que as duas imagens renderizam corretamente nos posts afetados
(`/blog/tree-reads-itself/` e `/blog/everything-is-eml/`, EN — não há versão
PT desses posts para checar). Backlog segue em 10 issues abertas; nenhuma
issue nova necessária ainda.
