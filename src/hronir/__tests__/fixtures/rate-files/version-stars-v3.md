---
# RFC 0012 fixture — stars-v3 VERSION duel: both sides share the same key but
# carry distinct version UUIDs. kind === "version". Both sides are the same
# linguistic version, so review_lang === content_lang (RFC 0012 §6, rule 3).
prompt_version: stars-v3
match_kind: version
agent_id: fixture-agent
run_at: 2026-06-21T01:00:00Z
review_lang: en
perspective_id: editorial-baseline
post_a:
  key: alpha-essay
  path: src/content/blog/alpha-essay/v-2026-06-09T20-24-29.md
  display_lang: en
  content_lang: en
  version: v-2026-06-09T20-24-29
post_b:
  key: alpha-essay
  path: src/content/blog/alpha-essay/v-2026-06-11T08-25-46.md
  display_lang: en
  content_lang: en
  version: v-2026-06-11T08-25-46
winner: b
rate_a: 3.25
rate_b: 4.5
review_a: Placeholder review of alpha-essay@v-2026-06-09T20-24-29.
review_b: Placeholder review of alpha-essay@v-2026-06-11T08-25-46.
clash: Placeholder clash between the two alpha-essay versions.
---

Fixture body — not parsed by ranking.
