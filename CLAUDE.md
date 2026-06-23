# CLAUDE.md — Franklin Baldo's Blog

## Project overview

Static blog built with **Astro** (TypeScript). Content lives in `src/content/blog/`.  
The **Hrönir** system (`scripts/hronir/`) runs pairwise comparisons between posts and ranks them with OpenSkill.

## Running a Hrönir session (agent happy path)

### 1. Init

```bash
npm run hronir:init -- --agent-id 'this is my id' --matches 10 --skip-edit
```

The `--` after `hronir:init` is npm's "end of npm options" marker — without it
npm swallows `--agent-id` as its own flag. To skip the `--`, call the CLI
directly. It is registered as the `hronir` bin in `package.json`, so any of these
work without the separator:

```bash
npx hronir init --agent-id 'this is my id' --matches 10 --skip-edit  # via node_modules/.bin
# or `npm link` once, then `hronir init ...` from anywhere
```

- `--agent-id` is **required** — a stable identifier for the evaluator. It can be
  a slug (`claude-opus-4-8`, `franklin`) or a quoted human-readable phrase
  (`--agent-id 'this is my id'`); spaces are allowed. Because the value flows
  verbatim into the commit message (`hronir: <N> matches — <agent-id>`), the
  `—` separator is what keeps the id unambiguous when it contains spaces — keep it.
- `--matches` defaults to 10
- `--skip-edit` skips the post-editing phase; use it for pure rating sessions
- `--review-lang en|pt` — language the reviews/clash are written in (RFC 0012 §6); defaults to `--eval-lang`. Recorded as `review_lang` in each rate file
- `--objective coverage|refine-top|hunt-worst` — RFC 0013 §8: sampling bias, persisted in the session and recorded as `objective` in each rate file. `coverage` (recommended while the corpus is thin) prioritizes under-sampled works; `refine-top`/`hunt-worst` tilt toward the top/bottom strata. Default: neutral
- `--content-mode inline|path-only` — controls how post content is delivered:
  - `inline` (default): CLI prints the full post content in its output
  - `path-only`: CLI prints only the slug, file path, and Suno URLs; the agent reads the file directly. Recommended for agents with long sessions or context compression (e.g. Jules with 20 matches). The chosen mode is saved in `session.json` and recorded in each rate file as `content_mode`.

### 2. Loop: read → first-impression-a → first-impression-b → decide

After init, the CLI prints the next step. Follow it:

```bash
# Read post A (shows perspective banner + evaluator mood)
npm run hronir:continue

# Record your immediate reaction to post A (any length > 0, no minimum)
# This also displays post B automatically
npm run hronir:first-impression-a -- "Primeira impressão do post A aqui."

# Record your immediate reaction to post B
# This prints the decide instructions with the glyph and mood
npm run hronir:first-impression-b -- "Primeira impressão do post B aqui."

# Submit the decision (--after-mood first — see "Decidindo o mood" below)
npm run hronir:decide -- \
  --after-mood "Estou inquieto, com ideias demais na cabeça para assentar." \
  --rate-a 4.25 \
  --rate-b 3.00 \
  --review-a "Resenha do <slug-a> em pelo menos 100 palavras, da ótica da perspectiva." \
  --review-b "Resenha do <slug-b> em pelo menos 100 palavras, da ótica da perspectiva." \
  --clash   "Confronto em pelo menos 100 palavras: por que <slug-a> ganhou/perdeu perante <slug-b> segundo a perspectiva."
```

Repeat `continue` → `first-impression-a` → `first-impression-b` → `decide` for each match.  
`npm run hronir:next` is a shortcut that auto-advances state.

**Incremental decide (draft persistence):** If `decide` fails validation (e.g. word-count too short), it saves a draft automatically. On the next call you can append to the short fields instead of rewriting them:

```bash
npm run hronir:decide -- \
  --clash-append "Texto adicional para completar o confronto." \
  --review-a-append "Mais palavras para a resenha A." \
  --review-b-append "Mais palavras para a resenha B."
```

### Constraints the agent must respect

| Field                       | Constraint                                                                                                                                                                                                                                           |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--rate-a` / `--rate-b`     | 1.00–5.00, ≤2 decimal places, **no ties**                                                                                                                                                                                                            |
| `--review-a` / `--review-b` | ≥100 words each, written from the perspective shown in the banner. Refer to the post by its **slug** (shown in the post header during `continue`), not "Post A" / "Post B"                                                                           |
| `--clash`                   | ≥100 words, narrative confrontation between both posts through the perspective's lens. Refer to each post by its **slug**, not "Post A" / "Post B"                                                                                                   |
| `--after-mood`              | **First flag**, ≤250 chars, **first person PT**, about **your internal state** now — energy, fatigue, satisfaction, unease. **Not about the posts.** Must be original (not a copy of the initial mood in the banner). See "Deciding the mood" below. |

The `--review-a` / `--review-b` / `--clash` fields render as **Markdown** — use emphasis, lists, blockquotes (to quote passages), and emojis where they aid readability. Formatting in service of the content, not decoration.

### Deciding the mood (do this first)

`--after-mood` is the **first** flag you submit. Before writing anything,
Hrönir shows you, in the `continue` decide step, a **random Unicode glyph** it
drew for you (with its `U+XXXX` codepoint) plus your **initial mood** from the
banner. Read the glyph _subjectively_ — there is no lookup table; its shape,
its stroke, whatever that character evokes in you, you decide how it weighs.
Combine that reading with your initial mood and with what these two posts (and
the clash between them) made you feel. The result is your internal state right
now — and that state then **colors the tone** in which you write the reviews
and the clash. That is why the mood is decided first.

### 3. After all matches — open a PR

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
npm run hronir:worst            # print the lowest-ranked post key
npm run hronir:draft-worst      # RFC 0003: cria uma NOVA versão (rascunho) do pior post
npm run hronir:draft-commit -- --msg "..."  # registra o rascunho (canônica intocada)
npm run hronir:select           # RFC 0010: atualiza versions-selected.json (seleção de versões)
npm run hronir:select -- --dry-run  # mostra o que seria selecionado sem gravar
npm run hronir:prune -- --dry-run   # lista versões perdedoras elegíveis para poda (≥0.5★ abaixo, n≥3)
npm run hronir:prune            # remove as versões perdedoras elegíveis
npm run hronir:edit-worst       # alias legado de draft-worst (edição não-destrutiva)
npm run hronir:end -- --force   # discard an in-progress session
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
src/generated/            Artefatos gerados e commitados (selection, redirects, sitemap data)
.routines/hronir/         Rate files produced by sessions (committed to git)
docs/rfcs/                RFCs do projeto (0001…)
docs/plans/               Planos e documentos de planejamento
```
