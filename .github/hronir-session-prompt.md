Run a complete Hrönir rating session for this blog and open a PR with the results.

**For the full operating manual** (decision constraints, mood, reviews, clash
format, repo conventions) see [`CLAUDE.md`](../CLAUDE.md) in the repo root. The
step-by-step routine is [`docs/hronir-agent-routine.md`](../docs/hronir-agent-routine.md)
— follow it; this prompt only adds session-specific rules.

## This session is fully autonomous — never ask the user anything

There is no human watching this session. **Never** ask the user a question,
request clarification, wait for approval, or pause for input of any kind —
a question stalls the session forever and the conveyor with it.

If a command fails, read its output, fix the cause, and retry. If a match is
unrecoverable after honest retries, finish the remaining matches and open the
PR with what you completed — a partial PR beats a stalled session.

## Compromisso de autenticidade

Cada campo de texto desta sessão deve ser escrito por você, com base na
leitura efetiva dos posts.

**O que está fora dos limites:**

- **Tokens/placeholders:** Sequências como `revA_1873_abc123_0 …` no lugar de
  prosa. Um rate file com tokens é inválido e será descartado pelo
  `hronir:doctor`.
- **Códigos de rastreamento:** Identificadores de sessão, hashes ou marcadores
  (`si95rb`, `ref5:`, `(Marcador: …)`) inseridos dentro dos campos de texto.
- **Boilerplate genérico:** Frases estruturalmente idênticas entre reviews.
  Cada review deve refletir o post específico que você leu.

**Regra prática:** Se não consegue escrever ≥100 palavras genuínas sobre um
post, releia-o. Um match ausente é melhor que uma análise fabricada.

## Plano de sessão

1. **Entenda o sistema.** Leia `CLAUDE.md` e `docs/hronir-agent-routine.md`
   por completo. Não pule esta etapa.
2. **Prepare o checkout.** `npm ci`, depois `npm run hronir:select` (obrigatório
   num checkout novo).
3. **Avalie os matches, um por vez** (5 é o alvo; menos e bem avaliados é
   melhor que mais e apressados):
   - `npx hronir generate-match --objective coverage`
   - **Leia os dois arquivos inteiros** indicados pelo comando antes de
     escrever qualquer coisa. Em "DUELO DE VERSÃO", Post A é a versão
     canônica e Post B a desafiante — avalie qual serve melhor o leitor.
   - `npx hronir submit-eval --agent-id '<seu id>' --after-mood "..." --rate-a ... --rate-b ... --review-a "..." --review-b "..." --clash "..."`
     (restrições de cada campo: ver CLAUDE.md).
4. **Valide.** `npm run hronir:select` e `npm run hronir:doctor` — 0
   inconsistências antes de commitar.

   > **REGRA CRÍTICA — nunca delete rate files de outras sessões.**
   > Rate files são imutáveis depois de commitados. Se o doctor reportar erro
   > em arquivo de outra sessão, relate o problema no PR mas NÃO delete o
   > arquivo.

5. **Formate.** `npx prettier --check .` (corrija com `--write` se falhar).
6. **Abra o PR.** Commit apenas de arquivos em `.routines/` (journal) e
   `.routines/hronir/` (rates). Mensagem: `hronir: <N> matches — <agent-id>`.

## Restrições do autopilot

- Somente arquivos em `.routines/hronir/**`, journal em `.routines/*.md` e
  `src/content/blog/**` no commit. Não toque em workflows, scripts,
  `package.json` ou qualquer outro config.
- O autopilot auto-merges apenas PRs confinados a esses caminhos e com o CI
  verde.
