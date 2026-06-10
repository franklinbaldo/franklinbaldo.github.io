Run a complete Hrönir rating session for this blog and open a PR with the results.

**For the full operating manual** (session flow, decision constraints, mood, reviews,
clash format) see [`CLAUDE.md`](../CLAUDE.md) in the repo root.

## This session is fully autonomous — never ask the user anything

There is no human watching this session. **Never** ask the user a question,
request clarification, wait for approval, or pause for input of any kind —
a question stalls the session forever and the conveyor with it.

If a command fails, read its output, fix the cause, and retry. If a match is
unrecoverable after honest retries, finish the remaining matches and open the
PR with what you completed — a partial PR beats a stalled session.

## Plano de sessão

Siga estes passos em ordem. Cada passo deve ser concluído antes do próximo.

**Passo 1 — Entender o sistema**
Leia `CLAUDE.md` completamente. Entenda o fluxo de sessão, o formato dos rate files,
as restrições de cada campo (`--rate-a`, `--review-a`, `--clash`, `--after-mood`),
e as convenções do repo (língua, commits, PR). Não pule esta etapa.

**Passo 2 — Instalar dependências**
Instale os pacotes do projeto antes de qualquer outro comando.

**Passo 3 — Inicializar a sessão**
Inicialize com `--agent-id jules` e `--matches 20`. Leia o output com atenção —
ele mostra a perspectiva, o mood inicial e a instrução de próximo passo.

**Passos 4 a 23 — Matches 1 a 20 (um passo por match)**
Cada match é uma unidade indivisível: ler Post A + ler Post B + decidir.
Para cada match, execute em sequência sem interrupção:

1. Avance o estado para revelar o Post A. Leia o conteúdo completo. Anote o slug.
2. Avance para revelar o Post B. Leia o conteúdo completo. Leia o glifo Unicode
   e o campo de mood que o CLI exibe — faça isso antes de escrever qualquer coisa.
3. Interprete o glifo subjetivamente, combine com o mood inicial e com o que os
   dois posts evocaram. Esse estado interno é o `--after-mood` (≤250 chars,
   primeira pessoa PT, sobre seu estado — não sobre os posts). Depois atribua
   notas (1.00–5.00, sem empate), escreva review-a e review-b (≥100 palavras cada,
   no idioma do post, da ótica da perspectiva, referenciando o slug), e o clash
   (≥100 palavras, confronto narrativo entre os dois posts pela perspectiva).
   Submeta tudo em um único comando de decisão.

O CLI imprime o NEXT STEP após cada comando — siga-o literalmente.
Não pule matches, não abrevie reviews.

**Passo 24 — Validar**
Rode o doctor e confirme que reporta 0 inconsistências. Se houver erros, corrija
os rate files apontados antes de continuar.

**Passo 25 — Formatar**
Rode o prettier sobre os arquivos alterados para garantir que o CI vai passar.

**Passo 26 — Abrir o PR**
Faça commit apenas dos arquivos em `.routines/hronir/` e `src/content/blog/`
(nenhum outro). Mensagem de commit no formato `hronir: 20 matches — jules`.
Abra o PR. O autopilot vai validar, mergear e criar a próxima sessão automaticamente.

## Restrições do autopilot

- Somente arquivos em `.routines/hronir/**` e `src/content/blog/**` no commit.
  Não toque em workflows, scripts, `package.json` ou qualquer outro config.
- O autopilot auto-merges apenas PRs confinados a esses dois caminhos e com
  `npx prettier --check .` e `npm run build` passando.
