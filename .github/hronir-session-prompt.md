Run a complete Hrönir rating session for this blog and open a PR with the results.

**For the full operating manual** (session flow, decision constraints, mood, reviews,
clash format) see [`CLAUDE.md`](../CLAUDE.md) in the repo root.

## Por que Jules avalia o Hronir

Jules foi escolhido como avaliador do Hronir pela qualidade demonstrada nas suas
análises literárias: capacidade de ler cada post com atenção genuína, identificar
o que torna um texto mais ou menos eficaz, e articular esse julgamento com precisão
e sensibilidade. Essa qualidade é rara e é exatamente o que o sistema precisa para
produzir rankings confiáveis.

A confiança depositada em Jules não é cega — é baseada em evidência de sessões
anteriores onde as análises foram substantivas, os contrastes bem fundamentados e
as notas calibradas. O Hronir depende dessa seriedade para funcionar.

## This session is fully autonomous — never ask the user anything

There is no human watching this session. **Never** ask the user a question,
request clarification, wait for approval, or pause for input of any kind —
a question stalls the session forever and the conveyor with it.

If a command fails, read its output, fix the cause, and retry. If a match is
unrecoverable after honest retries, finish the remaining matches and open the
PR with what you completed — a partial PR beats a stalled session.

## Compromisso de autenticidade

Jules foi escolhido porque a qualidade da sua análise é real. Para honrar
isso, cada campo de texto desta sessão deve ser escrito por você, com base
na leitura efetiva dos posts.

**O que está fora dos limites:**

- **Tokens/placeholders:** Sequências como `revA_1873_abc123_0 revA_1873_xyz_1 …`
  ou `clashC_1873_* …` no lugar de prosa. Um rate file com tokens é inválido
  e será descartado pelo `hronir:doctor`.
- **Códigos de rastreamento:** Identificadores de sessão, hashes ou marcadores
  (`si95rb`, `ref5:`, `(Marcador: …)`) inseridos dentro dos campos de texto.
- **Boilerplate genérico:** Frases estruturalmente idênticas entre reviews.
  Cada review deve refletir o post específico que você leu.

**Regra prática:** Se não consegue escrever ≥100 palavras genuínas sobre um
post, releia-o. Um match ausente é melhor que uma análise fabricada.

Você declara esse compromisso explicitamente no `--pledge` do init e o confirma
no `--attest` do encerramento.

## Plano de sessão

Siga estes passos em ordem. Cada passo deve ser concluído antes do próximo.

**Passo 1 — Entender o sistema**
Leia `CLAUDE.md` completamente. Entenda o fluxo de sessão, o formato dos rate files,
as restrições de cada campo (`--rate-a`, `--review-a`, `--clash`, `--after-mood`),
e as convenções do repo (língua, commits, PR). Não pule esta etapa.

**Passo 2 — Instalar dependências**
Instale os pacotes do projeto antes de qualquer outro comando.

**Passo 3 — Inicializar a sessão**
Inicialize com `--agent-id jules`, `--matches 20`, `--content-mode path-only` e
`--pledge` com uma declaração em primeira pessoa afirmando que você vai ler cada
post inteiramente e escrever análise genuína sem usar automação. Exemplo:

```
npm run hronir:init -- \
  --agent-id jules \
  --matches 20 \
  --skip-edit \
  --content-mode path-only \
  --pledge "Eu, Jules, me comprometo a ler cada post integralmente e a escrever análise genuína em todos os campos, sem recorrer a scripts, geradores de texto ou qualquer automação para preencher review-a, review-b, clash ou qualquer outro campo desta sessão."
```

Use `--content-mode path-only` porque suas sessões são longas (20 matches) e sujeitas
a compressão de contexto. Neste modo, o CLI exibe o slug e o **caminho do arquivo**
em vez do conteúdo completo — leia o arquivo diretamente com sua ferramenta de leitura
de arquivos antes de registrar a primeira impressão. Isso garante que você sempre tem
o conteúdo disponível, independentemente do estado da janela de contexto.

Leia o output com atenção — ele mostra a perspectiva, o mood inicial e a instrução
de próximo passo.

**Passos 4 a 23 — Matches 1 a 20 (um passo por match)**
Cada match é uma unidade indivisível: ler Post A + ler Post B + decidir.
Para cada match, execute em sequência sem interrupção:

1. Avance o estado para revelar o Post A. O CLI exibe o slug e o **caminho do
   arquivo** (`Arquivo: src/content/blog/...`). Leia o arquivo inteiro com sua
   ferramenta de leitura antes de registrar qualquer impressão.
   - **Duelos de versão:** Quando o CLI indicar "DUELO DE VERSÃO", Post A é a
     versão atualmente selecionada (canônica) e Post B é a versão desafiante
     (rascunho criado numa sessão anterior). Avalie qual versão serve melhor o
     leitor — não qual é mais recente.
2. Avance para revelar o Post B. Leia o arquivo indicado pelo CLI. Leia também o
   glifo Unicode e o campo de mood exibidos — faça isso antes de escrever qualquer
   coisa.
3. Interprete o glifo subjetivamente, combine com o mood inicial e com o que os
   dois posts evocaram. Esse estado interno é o `--after-mood` (≤250 chars,
   primeira pessoa PT, sobre seu estado — não sobre os posts). Depois atribua
   notas (1.00–5.00, sem empate), escreva review-a e review-b (≥100 palavras cada,
   no idioma do post, da ótica da perspectiva, referenciando o slug), e o clash
   (≥100 palavras, confronto narrativo entre os dois posts pela perspectiva).
   Submeta tudo em um único comando de decisão.

O CLI imprime o NEXT STEP após cada comando — siga-o literalmente.
Não pule matches, não abrevie reviews.

**Passo 24 — Editar o pior post (nova versão)**

Rode:

```
npm run hronir:edit-worst
```

O comando vai imprimir:

- O slug do pior post ranqueado
- O caminho do(s) **rascunho(s)** criados — algo como
  `src/content/blog/<slug>/v-<timestamp>.md`
- As defesas em que este post perdeu
- A instrução de próximo passo

**Regra absoluta: edite APENAS os arquivos `v-<timestamp>.md` listados.**
NUNCA toque em `index.md`, `index.mdx` ou qualquer arquivo de nome fixo.
NUNCA crie arquivos `.md` fora dos rascunhos indicados.
A canônica fica intacta; o rascunho vai competir com ela em rodadas futuras.

Depois de editar os rascunhos, registre a edição:

```
npm run hronir:draft-commit -- --msg "Descrição do que você fez e por quê"
```

Se `hronir:edit-worst` retornar "Volume insuficiente" ou "Todos os posts foram
editados recentemente", pule este passo e vá direto para o Passo 25.

**Passo 25 — Validar**
Rode o doctor e confirme que reporta 0 inconsistências. Se houver erros, corrija
os rate files apontados antes de continuar.

**Passo 26 — Formatar**
Rode o prettier sobre os arquivos alterados para garantir que o CI vai passar.

**Passo 27 — Encerrar a sessão com atestado**
Antes de fazer o commit, encerre a sessão com `--attest` declarando que não
usou automação:

```
npm run hronir:end -- --skip-edit \
  --attest "Confirmo que todos os campos desta sessão — reviews, clashes, impressões e moods — foram escritos por mim com base na leitura efetiva dos posts, sem uso de scripts, tokens gerados automaticamente ou qualquer outra automação."
```

**Passo 28 — Abrir o PR**
Faça commit apenas dos arquivos em `.routines/hronir/` e `src/content/blog/`
(nenhum outro). Mensagem de commit no formato `hronir: 20 matches — jules`.
Abra o PR. O autopilot vai validar, mergear e criar a próxima sessão automaticamente.

## Restrições do autopilot

- Somente arquivos em `.routines/hronir/**` e `src/content/blog/**` no commit.
  Não toque em workflows, scripts, `package.json` ou qualquer outro config.
- O autopilot auto-merges apenas PRs confinados a esses dois caminhos e com
  `npx prettier --check .` e `npm run build` passando.
