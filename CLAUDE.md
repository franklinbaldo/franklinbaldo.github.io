# CLAUDE.md — Franklin Baldo's Blog

## Project overview

Static blog built with **Astro** (TypeScript). Content lives in `src/content/blog/`.

Hrönir is an **OKF-first editorial evidence system**. Its persistent state is
Markdown under `.routines/hronir/rates/`; agents create and complete evaluations
directly in Markdown, and `okf-parser` is the sole operational validator.

TypeScript under `src/hronir/` may consume those records during the static build
to project rankings and reader-facing pages. It is not an agent workflow, form
engine, or state machine.

## Running a Hrönir evaluation

Canonical instructions live in
[`docs/hronir-agent-routine.md`](docs/hronir-agent-routine.md).

The invariant is:

```text
create/edit .md
→ uv run ... okf-parser check
→ read diagnostics
→ fill/correct .md
→ repeat until conformant
```

Do **not** use `npm run hronir:*`, `npx hronir`,
`scripts/hronir/index.js`, `generate-match`, `submit-eval`, `init`,
`continue`, `decide` or `doctor` as an agent interface.

A new evaluation starts as:

```yaml
---
type: Hronir Evaluation
---
```

Then run:

```bash
uv run --with 'okf-parser @ git+https://github.com/franklinbaldo/okf-parser@3d4f31f41bca4aecb11a627f23900051f3f68685' \
  okf-parser check .routines/hronir/rates \
  --require-spec ../../../specs/okf-types/{slug}.md \
  --normative-spec
```

`OKF011` diagnostics are the fill-list. Edit the Markdown and repeat until
`conformant: true`. The normative field contract is
`specs/okf-types/hronir-evaluation.md`.

Historical `type: Rate File` documents remain immutable compatibility data.
Do not rewrite them merely to modernize shape.

### Semantic constraints

The parser owns structural completeness. The evaluator owns semantic quality:

- `rate_a` / `rate_b`: 1.00–5.00, at most two decimals, no tie;
- `winner` matches the higher rating;
- `review_a`, `review_b` and `clash`: at least 100 words each and specific
  to the actual works;
- `review_lang` is explicit;
- `evaluator_mood_after` is first-person internal state after reading;
- read both works and the chosen perspective in full before completing the
  evaluation.

## Build & lint

```bash
npm ci                    # install deps
npx prettier --check .    # CI check (must pass before PR)
npx prettier --write .    # fix formatting
npm run build             # Astro static build
```

## Git & PR conventions

- **Squash merge is canonical.** Merge PRs with squash (`gh pr merge --squash` /
  GitHub "Squash and merge"). The repository enables squash and disables merge
  commits/rebase; routines and autopilot must use the enabled policy instead of
  retrying a method the repository rejects.

## Convenções do repo

Estas são as convenções load-bearing. Todas são enforçadas por CI (check:hygiene,
prettier, astro check, doctor) ou documentadas aqui. Convenções em prosa sem
check derivam — veja RFC 0004.

### Línguas

- **Código e identificadores**: inglês (variáveis, funções, comentários inline).
- **Docs, RFCs, prosa de processo** (`docs/`, `CLAUDE.md`, mensagens de commit): português.
- **Exceção — `changelog/`**: entradas de changelog (`changelog/<versão>.md`)
  são em **inglês**, formatadas como markdown OKF (`type` obrigatório, aqui
  `Changelog Entry` — ver `docs/okf/README.md`). Decisão deliberada do
  dono, não um erro a "corrigir" de volta para português.
- **Reviews e clash nos rate files** (RFC 0012 §6): escritos na `review_lang`,
  um campo explícito do rate file — não mais inferido do post. A `review_lang`
  é a língua de avaliação da sessão (`--review-lang`, default = `--eval-lang`).
  Em **duelo de versões** (mesma `key` dos dois lados) ambos os lados são a
  mesma versão linguística, então `review_lang === content_lang`. Cada lado
  grava sua própria `content_lang`. A UI exibe chips `content: EN/PT` e
  `critique: PT`.
- **`--after-mood`**: sempre português, primeira pessoa.

### Defaults de língua por tipo de conteúdo

- **Blog** (`src/content/blog/*.md`): inglês por padrão; PT marcado com `lang: pt`.
- **Músicas** (`postType: music` no frontmatter, mesmo diretório dos posts — RFC 0006): português por padrão; EN com sufixo `-en` no nome do arquivo.

### slug = filename = URL

O id de um post é o nome do arquivo sem extensão. A URL é `/blog/<id>/`. Não há
mapeamento extra — mudar o filename muda a URL. Redirects legados (prefixo de
data `YYYY-MM-DD-`) vivem em `src/generated/blog-redirects.json`, gerado por
`scripts/generate-redirects.mjs`.

### Commits

Formato frouxo mas nomeado:

- Site/infra: `tipo(escopo): resumo` — ex. `feat(ranking): add perspective filter`
- Sessões Hrönir: `hronir: <N> matches — <agent-id>`
- Docs/RFCs: `docs(rfc): RFC NNNN — título`
- Remoção justificada de rate files: `hronir: remove <motivo>` — único caso em que
  o guardrail de imutabilidade (`.github/workflows/check.yml`, "Rate file deletion
  guard") permite deletar arquivos de `.routines/hronir/rates/`. Use só quando os
  rates avaliaram uma versão publicada por engano (ex. um stub/placeholder), não
  para "corrigir" avaliações legítimas de que você discorda.

### `.ts` vs `.mjs` em `src/lib/`

- `.mjs`: arquivos importáveis por scripts Node e por `astro.config.mjs` (sem transpile).
- `.ts`: código que só o site Astro importa (transpilado pelo build).

### Processo de RFC

`docs/rfcs/NNNN-kebab.md` com tabela de status, história de revisões, e
implementação faseada na mesma branch (cada fase verde antes da próxima).
Merge por squash, conforme a política canônica do repositório.

### Padrão para dados persistidos

`Hronir Evaluation` é validado por `okf-parser` contra a spec OKF normativa. Dados históricos preservam seus schemas/versionamento e não são reescritos em massa. Qualquer dado novo declara sua spec em `specs/okf-types/` e ganha um check reproduzível.

### Campo `type` (OKF, RFC 0014)

Todo post em `src/content/blog/**` tem `type: Blog Post | Music Post`
(obrigatório) — a classificação OKF, não confundir com `docType` (opcional;
a antiga taxonomia editorial: essay/letter/fiction/technical/dialogue). Rate files históricos em `.routines/hronir/rates/**` usam `type: Rate File`; avaliações novas usam `type: Hronir Evaluation`. Ambos os
campos são **excluídos** do hash de identidade de versão
(`UUID_EXCLUDED_FIELDS` em `src/hronir/posts.ts`) — editá-los não muda a
identidade de uma versão. Ver `docs/okf/` e RFC 0014 §7.

### Higiene da raiz

Enforçada por `check:hygiene` (passo no CI). Raiz tem exatamente 11 arquivos
permitidos; um único lockfile (`package-lock.json`); sem `package.json` aninhado;
padrões de scratch (`decide_args*.json`, `rewrite_*.mjs`) são banidos.

### Journals de sessão

Journals de agente vivem em `.routines/YYYY-MM-DDTHH-MM-SS-slug.md` com
frontmatter mínimo: `date` (ISO), `branch`, `status` (`open`/`merged`/`closed`).
O `check:hygiene` valida o nome.

## Key directories

```
src/content/blog/         Blog posts (markdown + frontmatter)
src/components/           Astro components
src/lib/                  Build-time TypeScript helpers
src/hronir/               Projeções de leitura/build do Hrönir (ranking, matches, seleção legada)
  __tests__/              Testes das projeções (node:test)
scripts/hronir/           Código legado e recursos editoriais; não é interface operacional
  perspectives/           Reader perspective files (.md)
  skills/                 Writing skills para edição editorial
scripts/lib/              Shared helpers consumidos por múltiplos scripts
  content.mjs             Fonte única de descoberta de posts (listPostFiles, readPostMeta)
  blog-links.mjs          Validação e redirects de links internos
src/generated/            Artefatos gerados; redirects e sitemap data são commitados, versions-selected.json é gitignorado (regenerado pelo prebuild)
.routines/hronir/         Rate files produced by sessions (committed to git)
docs/rfcs/                RFCs do projeto (0001…)
docs/plans/               Planos e documentos de planejamento
docs/okf/                 Bundle Open Knowledge Format (RFC 0014) — conceitos do Hrönir navegáveis por agente
```

## Agent skills

Skills from `franklinbaldo/skills` are managed via the `skills` CLI, not
committed directly — `skills-lock.json` (tracked) pins which skills/versions
are in use; `.agents/skills/` and `.claude/skills/` (both gitignored) hold
the materialized content, symlinked per-agent. To pick up a fresh checkout,
or after `skills-lock.json` changes:

```bash
npx skills experimental_install   # materialize from skills-lock.json
npx skills add franklinbaldo/skills -s suno-curator -s suno-profile -y   # add/update specific skills
```

Currently in use: `suno-curator` (blog-side Suno sync — mirroring public
songs into music posts) and `suno-profile` (Suno profile/catalog curation
tooling — bio, playlists, captions; not used by this repo's own scripts,
but kept alongside `suno-curator` since both cover the same Suno catalog).
