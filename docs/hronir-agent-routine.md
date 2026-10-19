# Rotina de agente Hrönir — OKF-first

O Hrönir não tem mais um fluxo operacional em Node. A avaliação é um artefato
Markdown OKF, e o `okf-parser` é a autoridade para dizer o que falta preencher.

A regra operacional é simples:

> criar o `.md` → rodar `okf-parser check` → preencher/corrigir o que o
> diagnóstico pedir → repetir até o check ficar verde.

Não use `npm run hronir:*`, `npx hronir`, `scripts/hronir/index.js`,
`generate-match` ou `submit-eval`. Esses caminhos não são mais a interface de
agente.

## 0. Começar do main atual

```bash
git switch main
git pull --ff-only
BRANCH="hronir/run-$(date -u +"%Y-%m-%dT%H-%M-%S")"
git switch -c "$BRANCH"
```

## 1. Escolher o duelo

Escolha dois trabalhos distintos do corpus atual em `src/content/blog/`. Prefira
obras com pouca evidência recente ou combinações que ainda não tenham sido
comparadas sob a mesma perspectiva. Leia os dois arquivos integralmente.

A seleção é uma decisão do agente sobre o corpus; não existe mais estado de
sessão oculto nem um comando que "entrega" o próximo formulário.

Escolha também uma perspectiva em `scripts/hronir/perspectives/` e leia seu
conteúdo. A perspectiva deve realmente influenciar a avaliação.

## 2. Criar o registro OKF mínimo

Crie um arquivo em:

```text
.routines/hronir/evaluations/<run_id>_<post-a-key>_x_<post-b-key>.md
```

Comece deliberadamente mínimo:

```yaml
---
type: Hronir Evaluation
---
```

Não copie um formulário fixo para "passar de primeira". O contrato está na spec
`specs/okf-types/hronir-evaluation.md`; quem informa os campos obrigatórios é o
parser.

## 3. Deixar o parser dirigir o preenchimento

Use sempre o `okf-parser` pinado pelo repositório/CI:

```bash
uv run --with 'okf-parser @ git+https://github.com/franklinbaldo/okf-parser@e8ed6bbd93846a40ac17a0be88c658020e85443a' \
  okf-parser check .routines/hronir/evaluations \
  --require-spec ../../../specs/okf-types/{slug}.md \
  --normative-spec
```

Para o arquivo novo, cada `OKF011` indica um campo obrigatório ausente ou vazio.
Preencha o campo pedido no frontmatter, preserve o que já está correto e rode o
mesmo check novamente. Continue até `conformant: true`.

O arquivo Markdown é simultaneamente o estado de trabalho e o resultado final.
Não existe `submit`, draft escondido, sessão temporária ou segunda base de
estado.

## 4. Regras semânticas da avaliação

O check garante o contrato estrutural declarado pela spec; o agente continua
responsável pela qualidade semântica do conteúdo.

- `rate_a` e `rate_b`: 1.00–5.00, até duas casas decimais e sem empate.
- `winner`: deve corresponder ao lado com a maior nota.
- `review_a` e `review_b`: pelo menos 100 palavras cada, específicas ao texto
  avaliado e escritas em `review_lang`.
- `clash`: pelo menos 100 palavras, confrontando concretamente os dois trabalhos
  pela lente da perspectiva escolhida.
- `evaluator_mood_after`: em primeira pessoa e sobre o estado interno do
  avaliador depois da leitura, não um resumo dos posts.
- Não use prosa genérica intercambiável. Cite ou parafraseie escolhas, imagens,
  argumentos ou estruturas concretas dos dois trabalhos.

O formato novo usa campos escalares `post_a_key`, `post_a_path`,
`post_b_key`, `post_b_path` etc. Isso é deliberado: permite ao parser apontar
exatamente qual célula do "formulário" ainda falta. Os antigos `type: Rate File`
com `post_a`/`post_b` aninhados permanecem legíveis como legado e não devem ser
reescritos em massa.

## 5. Gate final

Antes de commitar, o mesmo comando acima precisa terminar conforme. Depois:

```bash
TIMESTAMP="$(date -u +"%Y-%m-%dT%H-%M-%S")"
cat > ".routines/${TIMESTAMP}-hronir-run.md" <<EOF
---
date: "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
branch: ${BRANCH}
status: open
---

<N> avaliações Hrönir OKF — <agent-id>.
EOF
```

Crie também o change card exigido pelo repositório em
`changelog/changes/`, descrevendo a rodada de forma específica.

Então:

```bash
git add .routines/ changelog/changes/
git commit -m "hronir: <N> matches — <agent-id>"
git push -u origin HEAD
```

Abra PR para `main`. Rate files já mergeados são evidência imutável: não edite
uma avaliação histórica para mudar um julgamento; produza nova evidência.

## Fronteira arquitetural

O Astro/TypeScript ainda pode **ler** os registros durante o build para projetar
ranking e páginas públicas. Isso é uma projeção de leitura do site, não a
máquina de estado do Hrönir.

Criação, preenchimento, validação e avanço de avaliações são exclusivamente
Markdown OKF + `okf-parser`.
