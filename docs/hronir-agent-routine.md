# Rotina de agente Hrönir

Execute uma rodada completa do sistema Hrönir.

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

## 2. Inicializar sessão

```bash
npm run hronir:init -- \
  --agent-id <seu-model-id> \
  --matches 10 \
  --content-mode path-only
```

- `--agent-id` é **obrigatório** — use um identificador estável do seu modelo.
- `--content-mode path-only` recomendado para agentes: o CLI imprime apenas slug e caminho; o agente lê o arquivo diretamente.

## 3. Loop de avaliação

Repita até o CLI indicar que todos os matches foram completados. Se o contexto/tempo estiver se esgotando antes de completar os 10 matches, **não deixe um `decide` pela metade** — pare no match atual já concluído, pule para o passo 5 (ou 4, se `need_edit` já tiver sido sinalizado) e finalize a sessão parcial normalmente. Uma sessão de 3-6 matches bem avaliados vale mais que uma de 10 apressados.

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

## 4. Fase de edição do pior post

Quando todos os matches terminam, o CLI sinaliza `need_edit`.

```bash
npm run hronir:draft-worst
```

Edite os arquivos de rascunho criados (`src/content/blog/<slug>/v-<timestamp>.md`) com base nas defesas e contexto impresso pelo comando.

```bash
npm run hronir:draft-commit -- --msg "<justificativa da edição>"
npm run hronir:select
npm run hronir:end
```

## 5. Validar, criar journal e commitar

```bash
npm run hronir:doctor

TIMESTAMP="$(date -u +"%Y-%m-%dT%H-%M-%S")"
cat > ".routines/${TIMESTAMP}-hronir-run.md" <<EOF
---
date: "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
branch: ${BRANCH}
status: open
---
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
  head: <BRANCH>
  base: main

mcp__github__enable_pr_auto_merge:
  merge_method: merge
```
