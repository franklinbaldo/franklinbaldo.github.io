# Rotina de agente Hrönir — avaliação de matches

Execute uma rodada de avaliação Hrönir: só matches (comparações par a par), sem editar posts. A fase de edição do pior post é responsabilidade de uma rotina **separada** — `docs/hronir-edit-worst-routine.md` — que roda uma vez por dia, não a cada hora.

O fluxo é a API one-shot (RFC 0016): cada match é `generate-match` → ler os dois posts → `submit-eval`. Não há estado de sessão para gerenciar — `submit-eval` fecha o match sozinho.

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

- Mescle com **squash**, o método habilitado e canônico do repositório.
- Via MCP: `mcp__github__merge_pull_request` com `merge_method: squash`.
- **Não** mescle PRs que deletem arquivos de `.routines/hronir/rates/` — rate files são imutáveis (guardrail no CI e no autopilot); deixe esses para revisão humana.

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

`src/generated/versions-selected.json` é **gitignorado** e regenerado pelo `prebuild` a cada build, mas `generate-match` depende dele para montar o pool de pares — num checkout novo o arquivo não existe e o comando falha com "mínimo 4 posts para formar pares". Rode `select` aqui, localmente, antes de tudo.

## 3. Loop de avaliação — um match por vez

Escolha quantos matches cabem na sua capacidade real de leitura atenta: uma rodada de 3–6 matches bem avaliados vale mais que uma de 10 apressados; 5 é um bom default.

Para cada match:

```bash
npx hronir generate-match --objective coverage
```

O comando imprime a perspectiva do match, o slug e o **caminho** de cada post, o glifo + mood inicial, e as instruções de decisão. **Leia os dois arquivos inteiros** antes de qualquer outra coisa. Quando indicar "DUELO DE VERSÃO", Post A é a versão canônica e Post B a desafiante — avalie qual serve melhor o leitor, não qual é mais recente.

(`--objective coverage`, RFC 0013 §8, prioriza obras sub-amostradas — o viés recomendado enquanto o corpus é raso. Fica registrado como proveniência no rate file.)

Depois, submeta a avaliação (`--after-mood` primeiro — ver abaixo):

```bash
npx hronir submit-eval --agent-id '<seu id estável>' \
  --after-mood "Estou inquieto, com ideias demais na cabeça para assentar." \
  --rate-a 4.25 \
  --rate-b 3.00 \
  --review-a "Resenha do <slug-a> em pelo menos 100 palavras, da ótica da perspectiva." \
  --review-b "Resenha do <slug-b> em pelo menos 100 palavras, da ótica da perspectiva." \
  --clash   "Confronto em pelo menos 100 palavras: por que <slug-a> ganhou/perdeu perante <slug-b> segundo a perspectiva."
```

Se `submit-eval` falhar por validação (texto curto), o rascunho é salvo automaticamente — complemente sem reescrever:

```bash
npx hronir submit-eval --agent-id '<seu id estável>' \
  --clash-append "<continuação>" \
  --review-a-append "<continuação>" \
  --review-b-append "<continuação>"
```

Se precisar abortar um match no meio (contexto/tempo esgotando), `npx hronir end --force` descarta **só** o match em andamento — os rate files já submetidos ficam intactos.

### Restrições

| Campo                       | Restrição                                                                                                                                                                               |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--rate-a` / `--rate-b`     | 1.00–5.00, ≤2 casas decimais, **sem empate**                                                                                                                                            |
| `--review-a` / `--review-b` | ≥100 palavras cada, na `review_lang` da sessão (RFC 0012 §6 — default: a língua de avaliação, pt), pela perspectiva do banner. Refira-se ao post pelo **slug**, não "Post A" / "Post B" |
| `--clash`                   | ≥100 palavras, na mesma `review_lang`, confronto narrativo entre os dois posts pela lente da perspectiva. Use os **slugs**                                                              |
| `--after-mood`              | **Primeiro flag**, ≤250 chars, PT, 1ª pessoa, sobre seu estado interno agora. Não sobre os posts. Original (não copie o mood inicial do banner)                                         |

**Decida o mood antes de escrever.** O `generate-match` mostra um glifo Unicode aleatório (com codepoint) e seu mood inicial. Leia o glifo subjetivamente — não há tabela de significados — e combine com o que os dois posts provocaram: o resultado é o `--after-mood`, e esse estado colore o tom das resenhas e do clash. Detalhes em CLAUDE.md, "Deciding the mood".

**Atingir a contagem mínima de palavras não é o objetivo — o objetivo é uma leitura real.** O contador de palavras não distingue uma resenha específica de texto genérico repetido até bater 100 palavras. Cada resenha e o clash devem citar ou parafrasear algo concreto e específico de cada post (uma ideia, uma imagem, uma escolha estrutural) — não frases-clichê intercambiáveis entre quaisquer dois posts. Se uma frase da sua resenha serviria, sem alteração, para qualquer outro par de posts, reescreva-a.

## 4. Validar, criar journal e commitar

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

<N> matches — <agent-id>. <Uma linha sobre a rodada: pares notáveis, surpresas, saída antecipada se houve.>
EOF

git add .routines/
git commit -m "hronir: <N> matches — <agent-id>"
git push -u origin HEAD
```

Substitua `<N>` pelo número de matches **realmente completados**. Rode `hronir:select` de novo aqui — alguns matches são duelos de versão, e o `doctor` valida contra a seleção atual. O arquivo **não entra no `git add`**: é gitignorado; quem regenera a versão definitiva é o `prebuild` do próximo build/deploy.

## 5. Abrir PR e habilitar auto-merge

Via MCP:

```
mcp__github__create_pull_request:
  owner: franklinbaldo
  repo: franklinbaldo.github.io
  title: "hronir: <N> matches — <agent-id>"
  head: <BRANCH>
  base: main

mcp__github__enable_pr_auto_merge:
  merge_method: squash
```

Se `enable_pr_auto_merge` falhar (ex.: o CI já terminou verde, e auto-merge só se arma com checks pendentes), mescle diretamente com `mcp__github__merge_pull_request` (`merge_method: squash`) — ou deixe para o passo 0 da próxima rodada.