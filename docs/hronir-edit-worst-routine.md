# Rotina de agente Hrönir — edição do pior post

Rotina diária, separada da rotina horária de avaliação de matches (`docs/hronir-agent-routine.md`). Enquanto a rotina de matches prioriza volume (várias sessões por dia, modelo rápido), esta é trabalho editorial de verdade: escolher o post pior-ranqueado e reescrevê-lo com base nas críticas acumuladas — cabe rodar uma vez por dia, com um modelo mais cuidadoso.

Não chame `npm run hronir:init` aqui — essa rotina não roda matches, só a fase de edição, que funciona standalone.

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
BRANCH="hronir/edit-worst-$(date -u +"%Y-%m-%dT%H-%M-%S")"
git checkout -b "$BRANCH"
```

## 2. Escolher e rascunhar o pior post

```bash
npm run hronir:draft-worst
```

Esse comando já escolhe o post pior-ranqueado elegível — pulando os recém-editados, os com rascunho pendente, e os sem arquivo correspondente em `src/content/blog/` (post avaliado no passado e depois deletado) — e cria os rascunhos (`src/content/blog/<slug>/v-<timestamp>.<ext>`, um por idioma) prontos para editar.

Se não houver candidato elegível, o comando avisa e termina sem erro ("Volume insuficiente para edit-worst", ou lista os pulados por falta de arquivo). **Não force nada nesse caso** — não há trabalho de edição para fazer hoje; finalize sem abrir PR.

## 3. Editar

Leia AS DUAS skills antes de editar:

- `scripts/hronir/skills/franklin-blog/SKILL.md`
- `scripts/hronir/skills/franklin-essay/SKILL.md`

Default: `franklin-blog`. Use `franklin-essay` **apenas** se o post for argumentativo-formal (paper-shaped, defesa de tese, citação acadêmica densa). Em caso de dúvida, blog.

Edite os **rascunhos** impressos pelo comando anterior — nunca as versões selecionadas, que ficam intactas e continuam publicadas até o rascunho vencer seus duelos. O objetivo é diminuir o gap observado entre este post e os melhores colocados, mantendo o espírito do post.

Isso é o ponto principal desta rotina: leia de verdade as críticas e defesas acumuladas nos matches anteriores (o comando imprime o contexto) antes de editar. Um polimento superficial que não responde às críticas registradas não cumpre o propósito da rotina.

## 4. Registrar e finalizar

```bash
npm run hronir:draft-commit -- --msg "<justificativa da edição, referenciando as críticas que motivaram>"
npm run hronir:select
npm run hronir:end
npm run hronir:doctor
```

## 5. Journal e commit

```bash
TIMESTAMP="$(date -u +"%Y-%m-%dT%H-%M-%S")"
cat > ".routines/${TIMESTAMP}-hronir-edit-worst.md" <<EOF
---
date: "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
branch: ${BRANCH}
status: open
---
EOF

git add .routines/ src/content/blog/ src/generated/versions-selected.json
git commit -m "hronir: edição do pior post — <agent-id>"
git push -u origin HEAD
```

## 6. Abrir PR e habilitar auto-merge

Via MCP:

```
mcp__github__create_pull_request:
  owner: franklinbaldo
  repo: franklinbaldo.github.io
  title: "hronir: edição do pior post — <agent-id>"
  head: <BRANCH>
  base: main

mcp__github__enable_pr_auto_merge:
  merge_method: merge
```
