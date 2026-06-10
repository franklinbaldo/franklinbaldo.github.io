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

**Passo 4 — Ler o Post A do match 1**
Avance o estado da sessão para revelar o primeiro post. Leia o conteúdo completo
do post. Anote o slug — você vai precisar referenciá-lo pelo slug, não por "Post A".

**Passo 5 — Ler o Post B do match 1**
Avance novamente para revelar o segundo post. Leia o conteúdo completo.
O CLI vai mostrar o glifo Unicode e o campo de mood — leia-os antes de escrever qualquer coisa.

**Passo 6 — Decidir o clash 1**
Antes de escrever: interprete o glifo subjetivamente, combine com seu mood inicial
e com o que os dois posts evocaram. Esse estado interno é o `--after-mood` (≤250 chars,
primeira pessoa PT, sobre seu estado — não sobre os posts). Escreva o mood primeiro.
Depois atribua notas (1.00–5.00, sem empate), escreva review-a e review-b
(≥100 palavras cada, no idioma do post, da ótica da perspectiva, referenciando o slug),
e o clash (≥100 palavras, confronto narrativo entre os dois posts pela perspectiva).
Submeta tudo em um único comando.

**Passos 7 a 63 — Matches 2 a 20**
Repita o ciclo: ler Post A → ler Post B → decidir clash. São 20 matches no total,
3 passos cada = 60 passos de execução. O CLI imprime o NEXT STEP após cada comando —
siga-o literalmente. Não pule matches, não abrevie reviews.

**Passo 64 — Validar**
Rode o doctor e confirme que reporta 0 inconsistências. Se houver erros, corrija
os rate files apontados antes de continuar.

**Passo 65 — Formatar**
Rode o prettier sobre os arquivos alterados para garantir que o CI vai passar.

**Passo 66 — Abrir o PR**
Faça commit apenas dos arquivos em `.routines/hronir/` e `src/content/blog/`
(nenhum outro). Mensagem de commit no formato `hronir: 20 matches — jules`.
Abra o PR. O autopilot vai validar, mergear e criar a próxima sessão automaticamente.

## Restrições do autopilot

- Somente arquivos em `.routines/hronir/**` e `src/content/blog/**` no commit.
  Não toque em workflows, scripts, `package.json` ou qualquer outro config.
- O autopilot auto-merges apenas PRs confinados a esses dois caminhos e com
  `npx prettier --check .` e `npm run build` passando.
