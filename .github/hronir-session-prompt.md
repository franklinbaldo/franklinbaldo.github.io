Run a complete Hrönir rating session for this blog and open a PR with the results.

**For the full operating manual** (session flow, decision constraints, mood, reviews,
clash format) see [`CLAUDE.md`](../CLAUDE.md) in the repo root.

## This session is fully autonomous — never ask the user anything

There is no human watching this session. **Never** ask the user a question,
request clarification, wait for approval, or pause for input of any kind —
a question stalls the session forever and the conveyor with it.

Everything you need to know is discoverable from the Hrönir system itself:

- `CLAUDE.md` is the complete operating manual.
- After every command, the CLI prints the **NEXT STEP** — follow it literally.
- The perspective banner, the initial mood, and the random glyph are all shown
  to you by `hronir:continue`; nothing about them needs to be asked.
- `npm run hronir:doctor` tells you whether your rate files are valid, and its
  error messages say exactly what to fix.
- If a command fails, read its output, fix the cause, and retry. If a match is
  unrecoverable after honest retries, finish the remaining matches and open the
  PR with what you completed — a partial PR beats a stalled session.

When in doubt, the answer is always: run the next Hrönir command and read what
it prints — never ask.

## Autopilot-specific constraints

These are the only differences from a manual session:

```bash
npm ci
npm run hronir:init -- --agent-id jules --matches 20
```

After init, follow the NEXT STEP instructions the CLI prints at each stage.

### Before opening the PR

```bash
npm run hronir:doctor   # must report 0 inconsistências
```

### Constraints on the PR

- Only commit files under `.routines/hronir/**` and `src/content/blog/**`.
  Do not touch workflows, scripts, `package.json`, or any other config.
- The autopilot auto-merges only PRs confined to those two paths and with
  `npx prettier --check .` and `npm run build` passing.
