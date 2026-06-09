Run a complete Hrönir rating session for this blog and open a PR with the results.

## Start

```bash
npm ci
npm run hronir:init -- --agent-id jules --matches 10
```

After init, **follow the NEXT STEP instructions the CLI prints at each stage.**
The CLI guides you through the full loop (read → read → decide) and into the
edit-worst phase. Do not skip any step it shows.

## Before opening the PR

```bash
npm run hronir:doctor   # must report 0 inconsistências
```

If doctor reports any issues — including files outside `.routines/hronir/` or
`src/content/blog/` — fix or delete them before staging.

## Constraints on the PR

- Only commit files under `.routines/hronir/**` and `src/content/blog/**`.
  Do not touch workflows, scripts, `package.json`, or any other config.
- The autopilot auto-merges only PRs confined to those two paths and with
  `npx prettier --check .` and `npm run build` passing.
