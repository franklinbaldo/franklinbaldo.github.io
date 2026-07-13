# Rotina de agente Hrönir — avaliação de matches

Execute uma rodada de avaliação Hrönir: só matches (comparações par a par), sem editar posts. A fase de edição do pior post é responsabilidade de uma rotina **separada** — `docs/hronir-edit-worst-routine.md` — que roda uma vez por dia, não a cada hora.

## Antes de começar

Confirme que está dentro do checkout do repositório (`git rev-parse --show-toplevel` deve apontar para `franklinbaldo.github.io`). Se não estiver — diretório vazio, outro repo, ou erro —, clone antes de prosseguir:

```bash
git clone https://github.com/franklinbaldo/franklinbaldo.github.io.git
cd franklinbaldo.github.io
```

Depois, instale as dependências — todo comando `hronir:*` roda via `tsx` e
falha sem `node_modules/`:

```bash
npm ci
```

(Num checkout já existente, rode `npm ci` só se `node_modules/` não existir.)

## 0. Revisar e mesclar PRs abertos

Liste os PRs abertos. Para cada PR Hrönir com CI verde, sem conflitos e sem revisões bloqueantes:

- Mescle com **merge commit** — NUNCA squash.
- Via MCP: `mcp__github__merge_pull_request` com `merge_method: merge`.
- **Não** mescle PRs que deletem arquivos de `.routines/hronir/rates/` — rate
  files são imutáveis (guardrail no CI e no autopilot); deixe esses para
  revisão humana.

## 1. Atualizar main e criar branch

```bash
git checkout main && git pull origin main
BRANCH="hronir/run-$(date -u +"%Y-%m-%dT%H-%M-%S")"
git checkout -b "$BRANCH"
```

## 2. Recomputar a seleção de versões (local, não commitada)

```bash
npm run hronir:select
```

`src/generated/versions-selected.json` é **gitignorado** — nunca é commitado
por uma sessão. É uma função pura de rate files + arquivos de versão
(amendment RFC 0010, 2026-07-01: sem histerese, sem memória de seleção
anterior — vence sempre a versão mais bem avaliada com evidência
suficiente), regenerado deterministicamente pelo `prebuild` antes de cada
build. Mas o CLI depende dele já em `hronir:init`
(`listEnglishWithKey()` monta o pool de pares a partir dele): num checkout
novo o arquivo não existe, e pular este passo faz o `init` falhar com "mínimo
4 posts para formar pares". Rode `select` aqui, localmente, antes de tudo.

## 3. Inicializar sessão

```bash
npm run hronir:init -- \
  --agent-id <seu-model-id> \
  --matches 5 \
  --objective coverage \
  --content-mode path-only \
  --skip-edit
```

- `--agent-id` é **obrigatório** — use um identificador estável do seu modelo. Se contiver espaços, coloque entre aspas.
- `--matches`: dimensione pela sua capacidade real de leitura atenta — uma sessão de 3-6 matches bem avaliados vale mais que uma de 10 apressados, e é melhor iniciar com menos matches do que abortar no meio. 5 é um bom default; suba para 10 só se tiver folga de contexto/tempo.
- `--objective coverage` (RFC 0013 §8): prioriza obras sub-amostradas — o viés recomendado enquanto o corpus é raso, e o que faz sentido numa rotina de volume como esta. Fica registrado como proveniência em cada rate file.
- `--content-mode path-only` recomendado para agentes: o CLI imprime apenas slug e caminho; o agente lê o arquivo diretamente.
- `--skip-edit` é **obrigatório** nesta rotina — a fase de edição do pior post roda separada, com outro modelo e cadência diária. Com essa flag, a sessão nunca sinaliza `need_edit` e é encerrada pelo `continue` que detecta o último match completado (ver passo 4).

## 4. Loop de avaliação

Repita até o CLI indicar que todos os matches foram completados. **Após o último `decide`, rode `npm run hronir:continue` uma última vez** — é esse `continue` que detecta a sessão completa e apaga `hronir_session.json` (com `--skip-edit`). Sem isso, o `hronir:doctor` do passo 5 reporta a sessão ativa como inconsistência. (`npm run hronir:end`, sem `--force`, também fecha uma sessão com todos os matches completos.)

Se o contexto/tempo estiver se esgotando antes de completar todos os matches, **não deixe um `decide` pela metade** — complete o match em andamento, então feche a sessão explicitamente antes de seguir para o passo 5:

```bash
npm run hronir:end -- --force
```

Os rate files já gravados em `.routines/hronir/rates/` por cada `decide` **não são afetados** — isso só descarta o rastreamento da sessão (eles ainda serão commitados no passo 5). Com `--skip-edit`, a sessão nunca fica em `need_edit`, então esse é o único caso de saída antecipada aqui.

```bash
npm run hronir:continue
npm run hronir:first-impression-a -- "<impressão imediata do post A>"
npm run hronir:first-impression-b -- "<impressão imediata do post B>"
npm run hronir:decide -- \
  --after-mood "<estado interno>" \
  --rate-a <nota> \
  --rate-b <nota> \
  --review-a "<resenha do slug-a>" \
  --review-b "<resenha do slug-b>" \
  --clash   "<confronto entre slug-a e slug-b>"
```

Se `decide` falhar por texto curto, complemente sem reescrever:

```bash
npm run hronir:decide -- \
  --clash-append "<continuação>" \
  --review-a-append "<continuação>" \
  --review-b-append "<continuação>"
```

### Restrições

| Campo                       | Restrição                                                                                                                                                                               |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--rate-a` / `--rate-b`     | 1.00–5.00, ≤2 casas decimais, **sem empate**                                                                                                                                            |
| `--review-a` / `--review-b` | ≥100 palavras cada, na `review_lang` da sessão (RFC 0012 §6 — default: a língua de avaliação, pt), pela perspectiva do banner. Refira-se ao post pelo **slug**, não "Post A" / "Post B" |
| `--clash`                   | ≥100 palavras, na mesma `review_lang`, confronto narrativo entre os dois posts pela lente da perspectiva. Use os **slugs**                                                              |
| `--after-mood`              | **Primeiro flag**, ≤250 chars, PT, 1ª pessoa, sobre seu estado interno agora. Não sobre os posts. Original (não copie o mood inicial do banner)                                         |

**Decida o mood antes de escrever.** O passo decide do `continue` mostra um
glifo Unicode aleatório (com codepoint) e seu mood inicial. Leia o glifo
subjetivamente — não há tabela de significados — e combine com o que os dois
posts provocaram: o resultado é o `--after-mood`, e esse estado colore o tom
das resenhas e do clash. Detalhes em CLAUDE.md, "Deciding the mood".

**Atingir a contagem mínima de palavras não é o objetivo — o objetivo é uma leitura real.** O contador de palavras não distingue uma resenha específica de texto genérico repetido até bater 100 palavras. Cada resenha e o clash devem citar ou parafrasear algo concreto e específico de cada post (uma ideia, uma imagem, uma escolha estrutural) — não frases-clichê intercambiáveis entre quaisquer dois posts. Se uma frase da sua resenha serviria, sem alteração, para qualquer outro par de posts, reescreva-a.

## 5. Validar, criar journal e commitar

```bash
npm run hronir:select
npm run hronir:doctor

TIMESTAMP="$(date -u +"%Y-%m-%dT%H-%M-%S")"
cat > ".routines/${TIMESTAMP}-hronir-run.md" <<EOF
---
date: "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
branch: ${BRANCH}
status: open
---

<N> matches — <agent-id>. <Uma linha sobre a sessão: pares notáveis, surpresas, saída antecipada se houve.>
EOF

git add .routines/
git commit -m "hronir: <N> matches — <agent-id>"
git push -u origin HEAD
```

Substitua `<N>` pelo número de matches **realmente completados** (não o alvo
do init, se a sessão terminou antes).

Rode `hronir:select` de novo aqui — alguns matches são duelos de versão (a
mesma `key` dos dois lados), e o `doctor` valida contra a seleção atual. O
arquivo **não entra no `git add`**: é gitignorado, e quem regenera a versão
definitiva é o `prebuild` do próximo build/deploy.

## 6. Abrir PR e habilitar auto-merge

Via MCP:

```
mcp__github__create_pull_request:
  owner: franklinbaldo
  repo: franklinbaldo.github.io
  title: "hronir: <N> matches — <agent-id>"
  head: <BRANCH>
  base: main

mcp__github__enable_pr_auto_merge:
  merge_method: merge
```

Se `enable_pr_auto_merge` falhar (ex.: o CI já terminou verde, e auto-merge só
se arma com checks pendentes), mescle diretamente com
`mcp__github__merge_pull_request` (`merge_method: merge`) — ou deixe para o
passo 0 da próxima rodada.
