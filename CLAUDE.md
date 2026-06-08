# CLAUDE.md — Franklin Baldo's Blog

## Project overview

Static blog built with **Astro** (TypeScript). Content lives in `src/content/blog/`.  
The **Hrönir** system (`scripts/hronir/`) runs pairwise comparisons between posts and ranks them with OpenSkill.

## Running a Hrönir session (agent happy path)

### 1. Init

```bash
npm run hronir:init -- --agent-id <your-model-id> --matches 10 --skip-edit
```

- `--agent-id` is **required** — use a stable identifier like `claude-opus-4-8` or `franklin`
- `--matches` defaults to 10
- `--skip-edit` skips the post-editing phase; use it for pure rating sessions

### 2. Loop: read → read → decide

After init, the CLI prints the next step. Follow it:

```bash
# Read post A (shows perspective banner + evaluator mood)
npm run hronir:continue

# Read post B
npm run hronir:continue

# Submit the decision
npm run hronir:decide -- \
  --rate-a 4.25 \
  --rate-b 3.00 \
  --review-a "Resenha do post A em pelo menos 100 palavras, da ótica da perspectiva." \
  --review-b "Resenha do post B em pelo menos 100 palavras, da ótica da perspectiva." \
  --clash   "Confronto em pelo menos 100 palavras: por que A ganhou/perdeu perante B segundo a perspectiva." \
  --after-mood "Estou inquieto, com ideias demais na cabeça para assentar."
```

Repeat `continue` + `continue` + `decide` for each match.  
`npm run hronir:next` is a shortcut that auto-advances state.

### Constraints the agent must respect

| Field                       | Constraint                                                                                                                                                                                                                   |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--rate-a` / `--rate-b`     | 1.00–5.00, ≤2 decimal places, **no ties**                                                                                                                                                                                    |
| `--review-a` / `--review-b` | ≥100 words each, written from the perspective shown in the banner                                                                                                                                                            |
| `--clash`                   | ≥100 words, narrative confrontation between both posts through the perspective's lens                                                                                                                                        |
| `--after-mood`              | Optional. ≤250 chars, **first person PT**, about **your internal state** after evaluating — energy, fatigue, satisfaction, unease. **Not about the posts.** Must be original (not a copy of the initial mood in the banner). |

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
npm run hronir:edit-worst       # full edit-worst flow (human sessions)
npm run hronir:end -- --force   # discard an in-progress session
```

## Build & lint

```bash
npm ci                    # install deps
npx prettier --check .    # CI check (must pass before PR)
npx prettier --write .    # fix formatting
npm run build             # Astro static build
```

## Key directories

```
src/content/blog/         Blog posts (markdown + frontmatter)
src/components/           Astro components
src/lib/                  Build-time TypeScript helpers
scripts/hronir/           Hrönir CLI and rating engine
  lib/                    Core modules (commands, ranking, moods, perspectives, matches, posts)
  perspectives/           Reader perspective files (.md)
  skills/                 Writing skills for edit-worst phase
.routines/hronir/         Rate files produced by sessions (committed to git)
```
