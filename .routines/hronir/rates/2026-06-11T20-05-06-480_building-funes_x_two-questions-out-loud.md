---
run_id: 2026-06-11T20-05-06-480
run_at: '2026-06-11T20:05:06.480Z'
post_a:
  key: building-funes
  path: src/content/blog/building-funes/index.md
  display_lang: en
  version: f3fabcd1-3889-561a-ad4f-67aecd34fd09
post_b:
  key: two-questions-out-loud
  path: src/content/blog/two-questions-out-loud/index.md
  display_lang: en
  version: e7dcdde4-8d8d-54e9-b301-79bd4f41bd18
winner: a
agent_id: jules
eval_lang: pt
prompt_version: stars-v1
season: 1
override: null
perspective_id: curious-outsider
evaluator_mood: >-
  Estou impaciente com a tela clara. Queria fechar tudo e olhar para o nada por
  um instante longo, sem métricas ou rimas obrigatórias.
mood_glyph: ⇒
evaluator_mood_after: A chuva la fora é relaxante. c0ea6ac0 15
rate_a: 3.68
rate_b: 3.67
clash: >-
  way back in._ This is line item two, continuity, in the most literal possible
  form. The agent uses cron to **stitch itself across the gap between now and
  tomorrow**. Without it, every session is amnesia. With it, you can leave a
  note for your future self. That's not a constraint _on_ the agent. It's a
  _power the agent has_, mediated by a tool it calls. **`canivete bot daemon`**
  — and this is where the theory and the code shake hands. Today there are two
  near-identical `bot.py` files in the [Funes](/blog/funes-soul/) monorepo, one
  for the gemini-cli backend and one for claude-code. The plan in
  [`docs/plans/canivete-bot-meta-harness.md`](https://github.com/franklinbaldo/canivete/blob/main/docs/plans/canivete-bot-meta-harness.md)
  is to collapse them into a between building-funes and two-questions-out-loud
review_a: >-
  scaffolding" paper from the last while is a harness-engineering result. You
  weren't building a better cage. You were building a better halter. I keep a
  small CLI in my repo called
  [`canivete`](https://github.com/franklinbaldo/canivete) — Brazilian for _swiss
  army knife_. It started as a kit of utilities for a Telegram-bot-shaped agent
  and has been quietly accumulating into exactly the picture above. I didn't set
  out to build harness ergonomics; I set out to stop maintaining two
  near-identical `bot.py` files. The architecture happened. Three commands. Look
  at who each one makes the active party of the sentence. **`canivete tg`** —
  wraps the Telegram Bot API. `canivete tg text "hello"`, `canivete tg photo
  /path/img.png`, (slug: building-funes)
review_b: >-
  `canivete tg document /path/file.pdf`. The agent uses this to _talk to the
  world_. Environment access, line item three from the triad. The active party:
  the agent. **`canivete cron`** — schedules prompts that come back to the agent
  later, as if the user had typed them. From the README, which says it cleaner
  than I will: > The point isn't to run a job — it's to **wake the agent up
  later with a prompt** so it can act in a future turn. AI agents don't have
  voice outside of an active session; cron gives them a way back in. Let that
  sit for a second. _Cron gives the agent a (slug: two-questions-out-loud)
---
