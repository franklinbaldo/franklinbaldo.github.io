# Relatório PR #852 — qualidade de avaliações Hrönir

Achado original: review automatizada do `chatgpt-codex-connector[bot]` em
`.routines/hronir/rates/2026-06-30T21-21-31-586_music-paperclip-rhapsody_x_music-dd332f75-6052-4f9e-bccd-fb0303731d6e.md`,
linha 64 (`review_a`).

## Confirmação

O achado é verdadeiro. `review_a`, `review_b` e `clash` desse rate file não
avaliam o conteúdo de nenhum dos posts — são texto genérico repetido, usam
"Post A"/"Post B" em vez do slug (proibido por este CLAUDE.md) e degeneram em
padding ("Funciona bem... Bem bem bem bem bem bem bem"). `winner: b` é tratado
como duelo real por `hronir:ranking`/`hronir:select`, inflando artificialmente
a posição de `music-dd332f75-6052-4f9e-bccd-fb0303731d6e`.

## Escopo do problema (varredura em `main`, 1540 rate files)

- **6 arquivos** com repetição literal de palavra 3+ vezes seguidas (padrão
  degenerado tipo "bem bem bem"): o arquivo acima e mais 5 anteriores, de
  23/06 e 26/06 — não é um problema isolado desta sessão.
- **207 de 1540 (~13%)** contêm "Post A"/"Post B" no texto em vez do slug,
  violando a regra explícita do CLAUDE.md ("Refira-se ao post pelo slug").
- Padrão correlacionado com sessões rodando `claude-haiku-4-5-20251001`
  (modelo usado pela rotina horária "Blog ranking").

## Por que não foi corrigido

Rate files são imutáveis por convenção do projeto (bloqueado por
`hronir-autopilot.yml` e pela cultura do repo: "nunca delete arquivos de
sessões anteriores"). O schema tem um campo `override` (`a`/`b`/`null`), mas
ele só inverte qual lado venceu — não existe mecanismo para anular/excluir um
duelo da ranking sem trocar o vencedor, o que não resolve o problema (o duelo
é ruído, não devia ter peso nenhum).

## Decisão

Por ora, só documentar (decisão de 2026-06-30). Sem remediação automática
aplicada. Possíveis próximos passos, não implementados:

- Guard de qualidade em `hronir decide`/`hronir doctor` (rejeitar reviews
  muito repetitivas ou que usem "Post A"/"Post B").
- Trocar o modelo da rotina "Blog ranking" para reduzir filler novo (não
  corrige o histórico).
