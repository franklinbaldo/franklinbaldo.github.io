Run a complete Hrönir rating session for this blog and open a PR with the results.

## Steps

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Initialize a session (use a stable agent id):

   ```bash
   npm run hronir:init -- --agent-id jules --matches 10
   ```

3. For each match, follow the loop the CLI prints: read post A, read post B,
   then submit a decision. Read the banner each time — the perspective and the
   evaluator mood change per match and your reviews must be written from that
   perspective.

   ```bash
   npm run hronir:continue   # read post A
   npm run hronir:continue   # read post B
   npm run hronir:decide -- \
     --rate-a <1.00-5.00> --rate-b <1.00-5.00> \
     --review-a "<≥100 words, in the banner's perspective>" \
     --review-b "<≥100 words, in the banner's perspective>" \
     --clash   "<≥100 words, narrative confrontation through the perspective>" \
     --after-mood "<≤250 chars, first person PT, your internal state after evaluating — original, not the banner mood>"
   ```

   Respect every constraint:
   - Ratings 1.00–5.00, at most 2 decimals, **no ties** between A and B.
   - Reviews and clash each **≥100 words**, written from the shown perspective.
   - `--after-mood` is about **your** state, not the posts; first person PT.

4. When all matches are done, the CLI enters the edit-worst phase. Edit the
   lowest-ranked post (both the English and Portuguese versions) following the
   `franklin-blog` writing skill, then commit the edit:

   ```bash
   npm run hronir:edit-commit
   npm run hronir:end
   ```

5. Validate before committing:

   ```bash
   npm run hronir:doctor      # must pass
   npx prettier --write .
   npx astro check
   npm run build
   ```

6. Stage the rate files and the worst-post edit, commit, and open a PR:

   ```bash
   git add .routines/hronir/ src/content/blog/
   git commit -m "hronir: 10 matches — jules"
   ```

## Constraints on the PR

- Only touch `.routines/hronir/**` and `src/content/blog/**`. Do not modify
  workflows, scripts, `package.json`, or other config — the autopilot only
  auto-merges PRs confined to those two paths.
- Make sure `npx prettier --check .` and `npm run build` pass; CI gates the
  merge on them.
