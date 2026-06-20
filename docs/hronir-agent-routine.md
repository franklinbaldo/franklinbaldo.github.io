# Rotina de agente Hrönir

Execute uma rodada completa do sistema Hrönir.

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

## 2. Inicializar sessão

```bash
npm run hronir:init -- \
  --agent-id <seu-model-id> \
  --matches 10 \
  --content-mode path-only
```

- `--agent-id` é **obrigatório** — use um identificador estável do seu modelo (ex: `claude-sonnet-4-6`, `jules`).
- `--content-mode path-only` recomendado para agentes: o CLI imprime apenas slug e caminho; o agente lê o arquivo diretamente. Evita compressão de contexto em sessões longas.

## 3. Loop de avaliação

Repita até o CLI indicar que todos os matches foram completados:

```bash
# Avança o estado e exibe o próximo post A (perspectiva + glifo + mood)
npm run hronir:continue

# Primeira impressão do post A (qualquer comprimento > 0)
npm run hronir:first-impression-a -- "Impressão imediata aqui."

# Primeira impressão do post B (o CLI exibe post B automaticamente)
npm run hronir:first-impression-b -- "Impressão imediata aqui."

# Decisão — --after-mood SEMPRE primeiro
npm run hronir:decide -- \
  --after-mood "Estado interno em PT, ≤250 chars, 1ª pessoa, sobre sua energia/foco agora." \
  --rate-a 4.25 \
  --rate-b 3.00 \
  --review-a "Resenha de <slug-a>, ≥100 palavras, no idioma do post, pela perspectiva." \
  --review-b "Resenha de <slug-b>, ≥100 palavras, no idioma do post, pela perspectiva." \
  --clash   "Confronto ≥100 palavras entre <slug-a> e <slug-b> pela lente da perspectiva."
```

Se `decide` falhar por texto curto, complemente sem reescrever:

```bash
npm run hronir:decide -- \
  --clash-append "Texto adicional." \
  --review-a-append "Mais palavras." \
  --review-b-append "Mais palavras."
```

### Restrições

| Campo | Restrição |
| --- | --- |
| `--rate-a` / `--rate-b` | 1.00–5.00, ≤2 casas decimais, **sem empate** |
| `--review-a` / `--review-b` | ≥100 palavras cada, no idioma do post, pela perspectiva do banner. Refira-se ao post pelo **slug**, não "Post A" / "Post B" |
| `--clash` | ≥100 palavras, confronto narrativo entre os dois posts pela lente da perspectiva. Use os **slugs** |
| `--after-mood` | **Primeiro flag**, ≤250 chars, PT, 1ª pessoa, sobre seu estado interno agora — energia, foco, inquietação. Não sobre os posts. Original (não copie o mood inicial do banner) |

## 4. Fase de edição do pior post

Quando todos os matches terminam, o CLI sinaliza `need_edit`.

```bash
# Cria rascunho(s) do post pior ranqueado e imprime caminhos + defesas
npm run hronir:draft-worst
```

Edite os arquivos de rascunho criados (`src/content/blog/<slug>/v-<timestamp>.md`) com base nas defesas e contexto impresso pelo comando.

```bash
# Confirme a edição com justificativa
npm run hronir:draft-commit -- --msg "Melhorei X e cortei Y com base nas defesas da sessão."

# Atualize a seleção de versões (RFC 0010)
npm run hronir:select

# Encerre a sessão
npm run hronir:end
```

## 5. Validar, criar journal e commitar

```bash
# Deve passar sem erros antes de qualquer commit
npm run hronir:doctor

# Criar journal da sessão (obrigatório — check:hygiene valida o nome)
TIMESTAMP="$(date -u +"%Y-%m-%dT%H-%M-%S")"
cat > ".routines/${TIMESTAMP}-hronir-run.md" <<EOF
---
date: "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
branch: ${BRANCH}
status: open
---

Rodada Hrönir: 10 matches, agente <agent-id>, com edit-worst.
EOF

git add .routines/ src/generated/versions-selected.json
git commit -m "hronir: 10 matches + edit-worst — <agent-id>"
git push -u origin HEAD
```

## 6. Abrir PR e habilitar auto-merge

Via MCP:

```
mcp__github__create_pull_request:
  owner: franklinbaldo
  repo: franklinbaldo.github.io
  title: "hronir: 10 matches + edit-worst — <agent-id>"
  body: "Rodada com 10 comparações + edição do pior post ranqueado."
  head: <BRANCH>
  base: main

mcp__github__enable_pr_auto_merge:
  merge_method: merge   # NUNCA squash
```
