# Rotina de agente Hrönir — avaliação de matches

Execute uma rodada de avaliação Hrönir: só matches (comparações par a par), sem editar posts. A fase de edição do pior post é responsabilidade de uma rotina **separada** — `docs/hronir-edit-worst-routine.md` — que roda uma vez por dia, não a cada hora.

## Antes de começar

Confirme que está dentro do checkout do repositório (`git rev-parse --show-toplevel` deve apontar para `franklinbaldo.github.io`). Se não estiver — diretório vazio, outro repo, ou erro —, clone antes de prosseguir:

```bash
git clone https://github.com/franklinbaldo/franklinbaldo.github.io.git
cd franklinbaldo.github.io
```

## 0. Revisar e mesclar PRs abertos

Liste os PRs abertos. Para cada PR Hrönir com CI verde, sem conflitos e sem revisões bloqueantes:

- Mescle com **merge commit** — NUNCA squash.
- Via MCP: `mcp__github__merge_pull_request` com `merge_method: merge`.

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
  --matches 10 \
  --content-mode path-only \
  --skip-edit
```

- `--agent-id` é **obrigatório** — use um identificador estável do seu modelo.
- `--content-mode path-only` recomendado para agentes: o CLI imprime apenas slug e caminho; o agente lê o arquivo diretamente.
- `--skip-edit` é **obrigatório** nesta rotina — a fase de edição do pior post roda separada, com outro modelo e cadência diária. Com essa flag, a sessão se fecha sozinha ao completar os matches, sem nunca sinalizar `need_edit`.

## 4. Loop de avaliação

Repita até o CLI indicar que todos os matches foram completados. Se o contexto/tempo estiver se esgotando antes de completar os 10 matches, **não deixe um `decide` pela metade** — complete o match em andamento, então feche a sessão explicitamente antes de seguir para o passo 5, já que `hronir:doctor` reporta qualquer `hronir_session.json` ativo como inconsistência:

```bash
npm run hronir:end -- --force
```

Os rate files já commitados por cada `decide` **não são afetados** — isso só encerra o rastreamento da sessão. (Com `--skip-edit`, a sessão nunca fica em `need_edit`, então esse é o único caso de saída antecipada aqui.)

Uma sessão de 3-6 matches bem avaliados vale mais que uma de 10 apressados.

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

| Campo                       | Restrição                                                                                                                                       |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--rate-a` / `--rate-b`     | 1.00–5.00, ≤2 casas decimais, **sem empate**                                                                                                    |
| `--review-a` / `--review-b` | ≥100 palavras cada, no idioma do post, pela perspectiva do banner. Refira-se ao post pelo **slug**, não "Post A" / "Post B"                     |
| `--clash`                   | ≥100 palavras, confronto narrativo entre os dois posts pela lente da perspectiva. Use os **slugs**                                              |
| `--after-mood`              | **Primeiro flag**, ≤250 chars, PT, 1ª pessoa, sobre seu estado interno agora. Não sobre os posts. Original (não copie o mood inicial do banner) |

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
EOF

git add .routines/
git commit -m "hronir: N matches — <agent-id>"
git push -u origin HEAD
```

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
  title: "hronir: N matches — <agent-id>"
  head: <BRANCH>
  base: main

mcp__github__enable_pr_auto_merge:
  merge_method: merge
```
