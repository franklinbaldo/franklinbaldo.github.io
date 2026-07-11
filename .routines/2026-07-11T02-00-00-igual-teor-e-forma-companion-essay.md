---
date: "2026-07-11T02:00:00Z"
branch: claude/new-session-6e8w1z
status: open
---

Estratégia B: novo ensaio companheiro de "Quem sou eu? / Who Am I?" usando
o material que o briefing original marcou como especulativo demais para o
post principal — cópias computacionais e identidade, a distinção
real/ficção sob persistência, o "teste de Turing interno".

Título: "Igual teor e forma" (PT) / "Executed in Counterparts" (EN),
`translationKey: igual-teor-e-forma`, RFC 0003, primeira versão de cada
slug (`v-2026-07-11T02-00-00-000.md`), sem competição — selecionada
diretamente por não ter concorrente.

Eixo do ensaio: a cláusula notarial "duas vias de igual teor e forma"
(cópias de contrato sem hierarquia entre original e via) como imagem para
a aposta sobre identidade computacional, estendida ao mecanismo real de
identidade-por-conteúdo deste próprio blog (hash UUID via `getPostUuid`,
excluindo de propósito campos como `draftCreatedAt`/`type`/`docType` —
verificado em `src/hronir/posts.ts`). O "teste de Turing interno" vira a
observação de que uma versão não-selecionada (`/blog/<slug>/v/<uuid>`) é
byte a byte indistinguível da selecionada de dentro do próprio texto — a
seleção é um fato externo (script + rate files), não uma propriedade do
texto. Fecha explicando por que o sistema de ranqueamento do blog se chama
Hrönir (Borges, "Tlön, Uqbar, Orbis Tertius") e por que a aposta deste
ensaio é sobre o caso-limite que os hrönir borgianos não cobrem: a cópia
perfeita, sem degradação entre gerações.

Ponte mínima: uma linha nova em "Para se aprofundar" / "Further reading"
de "Quem sou eu?" / "Who Am I?" (chained draft, `supersedes` a versão
mesclada na PR anterior), linkando para o novo ensaio. Nenhum outro texto
do post original tocado.

`npm run hronir:doctor`, `check:hygiene`, `check:links` e `npx prettier
--check` limpos; `npm run build` completo sem erros.
