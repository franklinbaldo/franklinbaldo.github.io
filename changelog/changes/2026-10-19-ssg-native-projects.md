---
type: changelog
date: 2026-10-19
description: Publish the first native bilingual SSG projects index from a canonical public repository snapshot, with strict identity and privacy checks.
tags: [blog, ssg, projects, architecture, publishing]
---

# First native SSG domain projection: projects

- Reads the canonical versioned `src/generated/repo-factory.json` snapshot and validates schema, owner, repository count, public scope, URLs and duplicate identities.
- Generates `/projects/` and `/pt/projects/` using SSG's Markdown and MiniJinja pipeline, not copied Zola HTML or a custom page renderer.
- Embeds the snapshot date prominently instead of implying repository activity is current.
- Pairs bilingual pages using native `translation_key` metadata and lists every public repository deterministically.
- Makes both routes obligatory in the SSG preview parity gate, updates navigation and assigns PT route ownership.
- Leaves Zola production unaffected; rich layout, filtering and complete Zola behavior still require parity testing before cutover.
