# RFC 0016 — Simplificação do Hrönir: one-shot canônico e poda de cerimônia

|                 |                                                                                                                                                    |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**      | Aprovada pelo dono (2026-07-13) — em implementação faseada                                                                                         |
| **Autor**       | Franklin Baldo (proposta assistida)                                                                                                                |
| **Criado em**   | 2026-07-13                                                                                                                                         |
| **Branch / PR** | `claude/hronir-agent-routine-review-2616q4`                                                                                                        |
| **Depende de**  | RFC 0012 (stars-v3 permanece o schema vigente), RFC 0013 (objetivos de amostragem permanecem). Retoma a RFC 0015 como fase final.                  |
| **Afeta**       | `src/hronir/commands/**`, `scripts/hronir/index.js`, `package.json` (scripts), `docs/hronir-*.md`, `CLAUDE.md`, `.github/hronir-session-prompt.md` |

---

## 1. Motivação

O sistema acumulou duas APIs paralelas para o mesmo fluxo (a cerimônia
`init` → `continue` → `first-impression-a/b` → `decide` → `end`, com cinco
estados de sessão, e a API one-shot `generate-match` → `submit-eval`) e uma
camada de features cerimoniais sem uso downstream. As instruções de rotina
são longas porque documentam a API difícil — o PR #1154 precisou documentar
três armadilhas (fechamento de sessão, `end --force`, `npm ci`) que a API
one-shot simplesmente não tem. Complexidade guiando documentação é o sinal
de que a faca deve cortar no código, não na prosa.

## 2. Decisões (registradas com o dono, 2026-07-13)

1. **O fluxo one-shot é o canônico.** As rotinas de agente usam apenas
   `generate-match` → ler os dois posts → `submit-eval`, N vezes. A cerimônia
   deixa de ser documentada; `init`/`continue`/`decide`/`end` permanecem como
   maquinaria interna e para uso humano direto.
2. **First impressions saem.** Comandos `first-impression-a/b`, estados
   `reading_a`/`waiting_impression_a/b` e flags `--impression-a/b`. O próprio
   CLAUDE.md já registrava que não têm uso downstream.
3. **Pledge/attest saem.** `--pledge` (init) e `--attest` (end) — cerimônia
   que nenhuma rotina documentava.
4. **Aliases e comandos redundantes saem:** `next`/`auto`, `worst`,
   `get-glipho`, `get-ranking`, `edit-worst`/`edit-commit`/`edit` (aliases
   legados de `draft-worst`/`draft-commit`), e a flag `--content-mode`
   (path-only vira o único modo — o conteúdo nunca mais é impresso inline;
   o avaliador lê o arquivo).
5. **O ritual do glifo/mood fica.** `mood_glyph`, `evaluator_mood`,
   `--after-mood` e a instrução de decidir o mood primeiro são identidade do
   sistema, não cerimônia morta. Com `get-glipho` removido, o `continue` em
   estado `deciding` reimprime o prompt completo (que inclui glifo e mood).
6. **RFC 0015 é retomada** (achatamento single-file com histórico via git)
   como fase final desta simplificação, seguindo o que a §7 daquela RFC lista
   como pendente.

## 3. Máquina de estados resultante

Antes: `ready_for_next → reading_a → waiting_impression_a →
waiting_impression_b → deciding → ready_for_next` (+ `need_edit`).

Depois: `ready_for_next → deciding → ready_for_next` (+ `need_edit`).
`continue` a partir de `ready_for_next` gera o match e exibe, de uma vez:
banner da perspectiva, post A, post B e o prompt de decisão (com glifo e
mood). `generate-match` vira um atalho fino: `init` de 1 match (skip-edit,
agent-id adiado) + `continue`; `submit-eval` continua sendo `decide` +
auto-fechamento da rodada completa.

## 4. Compatibilidade de dados

- **Rate files existentes são imutáveis** e continuam válidos: o `doctor`
  segue validando stars-v1/v2/v3 como hoje.
- **O schema stars-v3 não muda.** Novos rate files continuam gravando
  `impression_a/b` (sempre `null` de agora em diante) e `content_mode`
  (sempre `"path-only"`). Remoção de campos exigiria um stars-v4 sem
  benefício — a poda é de superfície de entrada, não de dados.
- Sessões em andamento em estados removidos (`reading_a`,
  `waiting_impression_*`) não são migradas: `hronir:end -- --force` e uma
  sessão nova. O custo é perder no máximo um match não decidido.

## 5. Fases

| Fase | Conteúdo                                                                                                                                                                                       | Verificação                                |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| 1    | Poda do CLI: itens da §2.2–2.4, máquina de estados da §3, `package.json` e mensagens de próximo-passo atualizadas                                                                              | `npm test`, `hronir:doctor`, CI verde      |
| 2    | Docs: `hronir-agent-routine.md` reescrito em torno do one-shot; `CLAUDE.md` aposenta a cerimônia; `hronir-edit-worst-routine.md` ganha `npm ci`; `.github/hronir-session-prompt.md` atualizado | prettier, leitura de ponta a ponta         |
| 3    | RFC 0015: achatamento `v-*` → arquivo único, aposentadoria de `select`/`prune`/páginas de versão conforme aquela RFC                                                                           | fases próprias da RFC 0015, cada uma verde |

## 6. O que esta RFC não faz

- Não altera ranking, seleção, perspectivas, objetivos de amostragem nem o
  formato dos rate files.
- Não remove `--skip-rating`, `--min-appearances`, `diagnose`, `migrate` —
  fora do escopo aprovado; candidatos naturais a uma poda futura se o uso
  não se materializar.

## 7. História de revisões

| Data       | Mudança            |
| ---------- | ------------------ |
| 2026-07-13 | Criação (aprovada) |
