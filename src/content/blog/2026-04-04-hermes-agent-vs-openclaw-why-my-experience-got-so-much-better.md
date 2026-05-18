---
title: "Hermes Agent vs OpenClaw: Why My Experience Got So Much Better"
description: "An honest account, based on my own sessions, about the UX leap between the old OpenClaw harness and the Hermes Agent."
date: "2026-04-04"
lang: en
translationKey: hermes-vs-openclaw
tags: ["ai", "agents", "developer-tools", "automation", "software-engineering"]
draft: false
author: "franklin"
---

I have 81 OpenClaw session logs sitting in `/opt/data/sessions/` and 3 Hermes sessions next to them. That's not a comparison — it's a before-and-after from someone's personal infrastructure. I'm going to write about it anyway, with that caveat visible.

The reason I care is practical. I don't run benchmarks. I use agents for real work: keeping CausaGanha's backfill pipelines honest, opening [Jules](/blog/2026-05-10-jules-api-harness-backend/) sessions from Porto Velho at 11pm when the day job is done, maintaining the identity repo, debugging whatever broke while I was in a court hearing. The comparison that matters to me is not "which one scores higher on MMLU" — it's "which one I can hand a task to and walk away from."

The thing I'd underestimated, going into this analysis, is how much harness design is perception of intelligence. Not metaphorically. When an agent trips over a schema error and loops on it, it reads as dim. When it trips over the same error and routes around it in two moves, it reads as sharp. The model might be identical in both cases. The _harness_ makes the difference.

## What the OpenClaw logs show

81 sessions. 1,414 tool calls. 137 tool errors. 39 sessions with at least one error. Roughly 48% of sessions had some kind of operational friction.

The specific errors are the kind that stop being surprising once you've seen them a few times:

- `Missing required parameter: newText (newText or new_string)`
- `Unknown JSON field: "mergeableState"`
- `kanban: command not found`
- `Failed to spawn: heartbeat`

None of these condemn a platform. Any agent doing real work against shell, GitHub, and live files is going to hit corners. The question is what happens next.

In OpenClaw, the pattern was: error → agent registers the error → agent tries a slightly different phrasing of the same thing → same error. Or: error → successful workaround → next session starts from scratch and hits the same wall. A session on February 14 went like this: simple flow, read `HEARTBEAT.md`, query PRs, update a section. The work got done. But first came the familiar `edit`-without-`newText` collision, the loop, the eventual workaround. The task was straightforward. The harness made it an obstacle course.

The other pattern was repetition without gradient. Sessions collapsed into cron loops — heartbeat, `NO_REPLY`, mechanical check. Fine for rote tasks. For actual investigation, the verbosity became noise and the fragility became a problem.

## Hermes also makes mistakes

22 errors out of 225 tool calls in the 3 recent sessions. Not zero.

- `bash: python: command not found`
- search against `/home/ubuntu` (doesn't exist)
- security block on `curl patterns | python3`
- `invalid x-api-key` from a visual browser tool

What's different is the behavior after. When the shell complained about `python`, the next move was `python3`. No drama, no loop. When the security scan blocked `curl | python3`, a temp file appeared and the parse strategy changed. When the browser view returned 401, the investigation continued through snapshot, Jina, and file reads.

That four-step loop — fail, understand why, pivot, continue — sounds small. In practice it's the difference between an agent I can delegate to and an agent I have to supervise.

## The CausaGanha session

The clearest example: a session investigating CausaGanha's backfill status. Not a surface ping. Hermes pulled Internet Archive metadata, counted recent files, compared historical versions of `completed-items.json`, separated "catalog refresh" from "actual backfill advancement," then opened [Jules](/blog/2026-05-10-jules-api-harness-backend/) sessions with tighter instructions based on what it found.

That kind of layered investigation — where each step narrows the question for the next — is what I'd been hoping agents could do for a while. OpenClaw got there sometimes. Hermes does it more consistently.

The tool mix helps: `session_search` for cross-session context, `read_file` and `search_files` with real granularity, `execute_code` for local processing without shell improvisation, `todo` to keep a plan visible. The practical effect is that I spend less time thinking "what incantation will keep this agent alive?" and more time thinking about the actual problem.

## The memory problem

Continuity was the constant friction in OpenClaw. I'd know we had discussed something two hours before; the system would be adrift. Sometimes it had the _feeling_ of a previous session — the right vocabulary, roughly the right context — but not the specific facts. Once I had to say explicitly: this is something we talked about today.

Hermes doesn't fix this through magic. It makes the memory architecture honest: lean persistent memory for durable facts, `session_search` for previous sessions, skills for recurring procedures, structured workspace reading. Instead of pretending to remember, it says "let me check the records" — which for real work is more useful than confident improvisation.

## Where OpenClaw deserves credit

Most of the routines Hermes now runs better were built in OpenClaw. Heartbeat, memory, Jules integration, backlog management, PR checking, context documentation — those patterns came out of 81 sessions of figuring out what I actually needed from an operational agent. In a real sense OpenClaw made me picky enough to notice the difference.

And the sample is what it is. Three sessions versus 81 doesn't settle anything statistically. This is texture, not rigor.

But texture is the thing. How many times do I stop to fix the mechanism instead of running the task? That's the number that matters at 11pm in Porto Velho when the thing I actually care about is whether the pipeline advanced.

OpenClaw gave me a clearer picture of what I wanted.

Hermes is starting to give me a routine.

For serious work, routine wins.
