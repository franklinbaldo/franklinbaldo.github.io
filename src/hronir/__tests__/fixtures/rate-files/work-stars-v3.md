---
# RFC 0012 fixture — stars-v3 WORK duel across two languages. content_lang
# differs per side; review_lang is the session language and is recorded
# explicitly (RFC 0012 §6, rule 2/3).
prompt_version: stars-v3
match_kind: work
agent_id: fixture-agent
run_at: 2026-06-21T00:00:00Z
review_lang: pt
perspective_id: editorial-baseline
post_a:
  key: alpha-essay
  path: src/content/blog/alpha-essay.md
  display_lang: en
  content_lang: en
post_b:
  key: delta-ensaio
  path: src/content/blog/delta-ensaio.md
  display_lang: pt
  content_lang: pt
winner: a
rate_a: 4.25
rate_b: 3.5
review_a: Resenha placeholder de alpha-essay (crítica em PT).
review_b: Resenha placeholder de delta-ensaio (crítica em PT).
clash: Confronto placeholder entre alpha-essay e delta-ensaio.
---

Corpo de fixture — não lido pelo ranking.
