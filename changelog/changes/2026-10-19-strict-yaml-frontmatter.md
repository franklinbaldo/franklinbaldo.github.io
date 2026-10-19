---
type: changelog
date: 2026-10-19
description: Make the "Stopping by Woods" music post frontmatter valid under strict YAML parsers
tags: [content, build, dependencies]
---

The `title` and `description` of the "Stopping by Woods on a Snowy Evening"
music post used multi-line double-quoted strings with unindented continuation
lines. The lenient parser behind `gray-matter` accepted them, but the stricter
`yaml` parser used by newer Astro releases rejects them, which broke
`astro check` in the pending dependency update. Both fields now use an escaped
`\n` on a single line. The parsed values and all version identity hashes are
unchanged.
