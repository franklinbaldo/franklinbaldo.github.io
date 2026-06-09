Run a complete Hrönir rating session for this blog and open a PR with the results.

## Start

```bash
npm ci
npm run hronir:init -- --agent-id jules --matches 20
```

After init, **follow the NEXT STEP instructions the CLI prints at each stage.**
The CLI guides you through the full loop (read → read → decide) and into the
edit-worst phase. Do not skip any step it shows.

## How to evaluate — this is the most important part

**Read each post for real.** Not a skim. Not a summary. Sit with the text.

For **music posts** (`postType: music` in the frontmatter), the audio is
available at `https://cdn1.suno.ai/<sunoId>.mp3` — download and listen to it
before writing the review. The text of a music post exists in relation to the
sound; evaluating one without the other misses the point.

Each match assigns you a **perspective** (a reader persona) and a **mood**. These
are not decoration — they are the lens through which you must experience the posts.
Inhabit the perspective fully: its values, its blind spots, what it finds moving or
irritating. Your reviews and clash must come from inside that perspective, not from
above it.

The **clash** is not a comparison table. It is a confrontation — something was at
stake between these two posts when read through this lens, and you must say what it
was and how it resolved. Write it as someone who was genuinely affected.

Mechanical evaluations (templated phrases, generic praise, "Post A handles X well
while Post B focuses on Y") will produce bad rate files and a broken ranking. The
whole point of Hrönir is that the signal comes from a real subjective encounter
with the text. If you phone it in, the system degrades.

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
