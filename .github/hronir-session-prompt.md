Run a complete Hrönir rating session for this blog and open a PR with the results.

**For the full operating manual** (session flow, decision constraints, mood, reviews,
clash format) see [`CLAUDE.md`](../CLAUDE.md) in the repo root.

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
