# Rotina de agente Hrönir — edição do pior post

Rotina diária, separada da rotina horária de avaliação de matches (`docs/hronir-agent-routine.md`). Enquanto a rotina de matches prioriza volume (várias sessões por dia, modelo rápido), esta é trabalho editorial de verdade: escolher o post pior-ranqueado e reescrevê-lo com base nas críticas acumuladas — cabe rodar uma vez por dia, com um modelo mais cuidadoso.

Não chame `npm run hronir:init` aqui — essa rotina não roda matches, só a fase de edição, que funciona standalone.

## Antes de começar

Confirme que está dentro do checkout do repositório (`git rev-parse --show-toplevel` deve apontar para `franklinbaldo.github.io`). Se não estiver — diretório vazio, outro repo, ou erro —, clone antes de prosseguir:

```bash
git clone https://github.com/franklinbaldo/franklinbaldo.github.io.git
cd franklinbaldo.github.io
```

Depois, instale as dependências — todo comando `hronir` roda via `tsx` e falha sem `node_modules/`:

```bash
npm ci
```

(Num checkout já existente, rode `npm ci` só se `node_modules/` não existir.)

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

## 2. Recomputar a seleção de versões (local, não commitada)

```bash
npm run hronir:select
```

`src/generated/versions-selected.json` é **gitignorado** — nunca é commitado
por uma sessão. É uma função pura de rate files + arquivos de versão
(amendment RFC 0010, 2026-07-01: sem histerese — vence sempre a versão mais
bem avaliada com evidência suficiente), regenerado deterministicamente pelo
`prebuild` antes de cada build. Mas `draft-worst` depende dele para saber qual
versão é a canônica a copiar como base do rascunho: num checkout novo o
arquivo não existe, e pular este passo faz `draft-worst` tratar todo post
como sem seleção. Rode `select` aqui, localmente, antes de tudo.

## 3. Escolher e rascunhar o pior post

```bash
npm run hronir:draft-worst
```

Esse comando já escolhe o post pior-ranqueado elegível — pulando os recém-editados, os com rascunho pendente, e os sem arquivo correspondente em `src/content/blog/` (post avaliado no passado e depois deletado) — e cria os rascunhos (`src/content/blog/<slug>/v-<timestamp>.<ext>`, um por idioma) prontos para editar.

Se não houver candidato elegível, o comando avisa e termina sem erro ("Volume insuficiente para edit-worst", ou lista os pulados por falta de arquivo). **Não force nada nesse caso** — não há trabalho de edição para fazer hoje; finalize sem abrir PR.

## 4. Editar

Leia AS DUAS skills antes de editar:

- `scripts/hronir/skills/franklin-blog/SKILL.md`
- `scripts/hronir/skills/franklin-essay/SKILL.md`

Default: `franklin-blog`. Use `franklin-essay` **apenas** se o post for argumentativo-formal (paper-shaped, defesa de tese, citação acadêmica densa). Em caso de dúvida, blog.

Edite os **rascunhos** impressos pelo comando anterior — nunca as versões selecionadas, que ficam intactas e continuam publicadas até o rascunho vencer seus duelos. O objetivo é diminuir o gap observado entre este post e os melhores colocados, mantendo o espírito do post.

Isso é o ponto principal desta rotina: leia de verdade as críticas e defesas acumuladas nos matches anteriores (o comando imprime o contexto) antes de editar. Um polimento superficial que não responde às críticas registradas não cumpre o propósito da rotina.

## 5. Registrar e finalizar

```bash
npm run hronir:draft-commit -- --msg "<justificativa da edição, referenciando as críticas que motivaram>"
npm run hronir:select
npm run hronir:end
npm run hronir:doctor
```

`hronir:select` roda de novo aqui — o novo rascunho entra no cômputo, e o
`doctor` valida contra a seleção fresca. O arquivo segue gitignorado — não
commitado por sessão, regenerado pelo `prebuild` no próximo build/deploy.

## 6. Journal e commit

```bash
TIMESTAMP="$(date -u +"%Y-%m-%dT%H-%M-%S")"
cat > ".routines/${TIMESTAMP}-hronir-edit-worst.md" <<EOF
---
date: "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
branch: ${BRANCH}
status: open
---
EOF

git add .routines/ src/content/blog/
git commit -m "hronir: edição do pior post — <agent-id>"
git push -u origin HEAD
```

## 7. Abrir PR e habilitar auto-merge

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
