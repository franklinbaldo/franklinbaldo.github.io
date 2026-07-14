# CLAUDE.md — Franklin Baldo's Blog

## Project overview

Static blog built with **Astro** (TypeScript). Content lives in `src/content/blog/`.  
The **Hrönir** system (`scripts/hronir/`) runs pairwise comparisons between posts and ranks them with OpenSkill.

## Running a Hrönir session (agent happy path)

The canonical flow (RFC 0016) is the one-shot API — each match is two commands
plus reading two files, with no session state to manage:

```bash
npx hronir generate-match --objective coverage        # prints perspective, both post paths, glyph + mood, decide prompt
# read BOTH files printed by the command, in full
npx hronir submit-eval --agent-id 'this is my id' \
  --after-mood "..." --rate-a 4.25 --rate-b 3.00 \
  --review-a "..." --review-b "..." --clash "..."     # decide + auto-close of the round
```

Repeat for as many matches as you can evaluate attentively (3–6 good matches
beat 10 rushed ones). `npx hronir ranking` prints the current ranking.

- `--agent-id` is **required on `submit-eval`** — a stable identifier for the
  evaluator; slugs or quoted phrases with spaces both work. It flows verbatim
  into the commit message (`hronir: <N> matches — <agent-id>`), where the `—`
  separator keeps a spaced id unambiguous. Generating a match is
  identity-agnostic (`generate-match` stores `agentId: "TODO"`), but you may
  pass `--agent-id` there to pin it early.
- Post content is never printed inline: the CLI prints the slug, file path and
  Suno URLs; the agent reads the file directly.
- If `submit-eval` fails validation (e.g. word count too short), the draft is
  saved automatically — complete it with `--clash-append` /
  `--review-a-append` / `--review-b-append` instead of rewriting.
- `--review-lang en|pt` (on `generate-match`) — language the reviews/clash are
  written in (RFC 0012 §6); defaults to `--eval-lang`. Recorded as
  `review_lang` in each rate file.
- `--objective coverage|refine-top|hunt-worst` — RFC 0013 §8: sampling bias,
  recorded as `objective` in each rate file. `coverage` (recommended while the
  corpus is thin) prioritizes under-sampled works. Default: neutral.
- Multi-match sessions still exist for direct human use:
  `npx hronir init --agent-id '...' --matches 10 --skip-edit`, then
  `continue` → `decide` per match (`continue` prints both posts and the decide
  prompt at once; `end` closes early). Note: with `npm run`, flags need npm's
  `--` separator (`npm run hronir:init -- --agent-id ...`); `npx hronir`
  avoids that.

### Constraints the agent must respect

| Field                       | Constraint                                                                                                                                                                                                                                           |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--rate-a` / `--rate-b`     | 1.00–5.00, ≤2 decimal places, **no ties**                                                                                                                                                                                                            |
| `--review-a` / `--review-b` | ≥100 words each, written in the session's `review_lang` (RFC 0012 §6 — defaults to the evaluation language, pt), from the perspective shown in the banner. Refer to the post by its **slug** (shown in the post header), not "Post A" / "Post B"     |
| `--clash`                   | ≥100 words, narrative confrontation between both posts through the perspective's lens. Refer to each post by its **slug**, not "Post A" / "Post B"                                                                                                   |
| `--after-mood`              | **First flag**, ≤250 chars, **first person PT**, about **your internal state** now — energy, fatigue, satisfaction, unease. **Not about the posts.** Must be original (not a copy of the initial mood in the banner). See "Deciding the mood" below. |

The `--review-a` / `--review-b` / `--clash` fields render as **Markdown** — use emphasis, lists, blockquotes (to quote passages), and emojis where they aid readability. Formatting in service of the content, not decoration.

### Deciding the mood (do this first)

`--after-mood` is the **first** flag you submit. Before writing anything,
Hrönir shows you, in the `generate-match` output (re-printed by `continue`),
a **random Unicode glyph** it
drew for you (with its `U+XXXX` codepoint) plus your **initial mood** from the
banner. Read the glyph _subjectively_ — there is no lookup table; its shape,
its stroke, whatever that character evokes in you, you decide how it weighs.
Combine that reading with your initial mood and with what these two posts (and
the clash between them) made you feel. The result is your internal state right
now — and that state then **colors the tone** in which you write the reviews
and the clash. That is why the mood is decided first.

### After all matches — open a PR

```bash
git add .routines/hronir/
git commit -m "hronir: <N> matches — <agent-id>"
# push and open a PR
```

The rate files go to `.routines/hronir/` and must be committed.  
Run `npm run hronir:doctor` before committing to catch any inconsistencies.

## Other useful commands

```bash
npm run hronir:ranking          # print current ranking to stdout
npm run hronir:doctor           # validate all rate files
npm run hronir:draft-worst      # RFC 0003: cria uma NOVA versão (rascunho) do pior post
npm run hronir:draft-commit -- --msg "..."  # registra o rascunho (canônica intocada)
npm run hronir:select           # RFC 0010 (amendment 2026-07-01): recalcula versions-selected.json — função pura de rate files + versões, sem histerese; gitignorado, regenerado pelo prebuild antes de cada build; rode localmente antes de qualquer outro comando hronir num checkout novo
npm run hronir:select -- --dry-run  # mostra o que seria selecionado sem gravar
npm run hronir:prune -- --dry-run   # lista versões perdedoras elegíveis para poda (≥0.5★ abaixo, n≥3)
npm run hronir:prune            # remove as versões perdedoras elegíveis
npm run hronir:end -- --force   # discard an in-progress session (o match em andamento é perdido; os já submetidos ficam)
```

## Build & lint

```bash
npm ci                    # install deps
npx prettier --check .    # CI check (must pass before PR)
npx prettier --write .    # fix formatting
npm run build             # Astro static build
```

## Git & PR conventions

- **Merge commits, not squash.** Always merge PRs with a real merge commit
  (`gh pr merge --merge` / GitHub "Create a merge commit"). Do **not** squash —
  preserving each PR's history is the project preference. The Hrönir autopilot
  workflow follows this too.

## Convenções do repo

Estas são as convenções load-bearing. Todas são enforçadas por CI (check:hygiene,
prettier, astro check, doctor) ou documentadas aqui. Convenções em prosa sem
check derivam — veja RFC 0004.

### Línguas

- **Código e identificadores**: inglês (variáveis, funções, comentários inline).
- **Docs, RFCs, prosa de processo** (`docs/`, `CLAUDE.md`, mensagens de commit): português.
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
Merge com merge commit, nunca squash.

### Padrão para dados persistidos

Schema versionado (ex. `stars-v1`) + script de migração preservado + validação
no `hronir:doctor`. Qualquer dado novo (ex. versões de posts da RFC 0003)
declara conformidade com este padrão em vez de reinventar.

### Campo `type` (OKF, RFC 0014)

Todo post em `src/content/blog/**` tem `type: Blog Post | Music Post`
(obrigatório) — a classificação OKF, não confundir com `docType` (opcional;
a antiga taxonomia editorial: essay/letter/fiction/technical/dialogue). Todo
rate file em `.routines/hronir/rates/**` tem `type: Rate File`. Ambos os
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
src/hronir/               Hrönir core modules (commands, ranking, matches, posts, selection)
  __tests__/              Unit tests (node:test)
scripts/hronir/           Hrönir CLI entry point and perspectives/skills
  perspectives/           Reader perspective files (.md)
  skills/                 Writing skills for edit-worst phase
scripts/lib/              Shared helpers consumidos por múltiplos scripts
  content.mjs             Fonte única de descoberta de posts (listPostFiles, readPostMeta)
  blog-links.mjs          Validação e redirects de links internos
src/generated/            Artefatos gerados; redirects e sitemap data são commitados, versions-selected.json é gitignorado (regenerado pelo prebuild)
.routines/hronir/         Rate files produced by sessions (committed to git)
docs/rfcs/                RFCs do projeto (0001…)
docs/plans/               Planos e documentos de planejamento
docs/okf/                 Bundle Open Knowledge Format (RFC 0014) — conceitos do Hrönir navegáveis por agente
```
