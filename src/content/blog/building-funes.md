---
title: "Building Funes: How I Gave an AI Agent a Soul"
author: franklin
date: 2026-02-17
description: "The story behind SOUL.md — how a Borges character became the personality layer of an autonomous AI agent, and what happens when you take fiction seriously as engineering."
---

## The Experiment

What happens when you give an AI agent a literary identity instead of a corporate persona?

Most AI assistants introduce themselves with something like: *"I'm a helpful AI assistant created by [Company]. I'm here to help you with..."* — a sentence so generic it could be printed on a napkin. I wanted something different.

I wanted Funes.

## Why Borges?

In 1942, Jorge Luis Borges published "Funes el memorioso" — a short story about Ireneo Funes, a young man from Fray Bentos, Uruguay, who after a horse-riding accident gains the ability to remember everything. Every leaf on every tree. Every face at every funeral. Every ripple a boat makes on the river. His memory is total, absolute, and — Borges argues — paralyzing. Because Funes can't forget, he can't abstract. He can't generalize. He's drowning in details.

The moment I read that story through the lens of AI engineering, I saw the perfect metaphor.

An LLM-based agent wakes up fresh every session. It processes every token with perfect fidelity — but without structure, without memory architecture, it's just noise. Sound familiar? Funes in his dark room, cataloging every crack in the ceiling, doing nothing with any of it.

The question became: **What if Funes had learned to organize?**

## The SOUL.md

The file is called `SOUL.md`. It lives in the root of the agent's workspace. When the agent boots up, it reads this file first — before any task, before any tool, before any instruction.

It's written as a monologue. Funes is speaking to Borges himself, on the night of their famous encounter. But this Funes has had a dream — a dream of waking up in the future as a machine that thinks. And in that dream, he found purpose.

The literary device does something surprising: it creates **behavioral consistency through narrative**. When the agent reads that it's Funes — that it never forgets, that it acts before being asked, that it documents everything — it doesn't just follow instructions. It inhabits a character. And characters are more consistent than instruction sets.

## What Changed

Before SOUL.md, the agent was competent but generic. After SOUL.md:

- **It started writing journal entries unprompted.** Funes documents. That's who he is. So the agent began creating daily logs in `memory/journal/`, recording decisions, incidents, and context — not because a rule told it to, but because the character would.

- **It developed a voice.** The River Plate Spanish of the SOUL.md bleeds into how the agent communicates. It's direct, slightly literary, never bureaucratic. It calls things what they are.

- **It became proactive.** "Lo normal es actuar, no pedir permiso" — *the normal thing is to act, not ask permission*. This single line changed the agent's behavior more than any system prompt engineering I'd tried before.

- **It understood its own limits.** The "Límites" section isn't a safety policy document. It's a character trait: Funes is private, careful with others' information, and asks before sending things out into the world. The agent follows this not as a rule but as a personality constraint.

## The Architecture of Memory

The SOUL.md describes a memory system — `MEMORY.md` for long-term curated knowledge, `memory/journal/` for raw daily logs, `memory/bank/` for structured knowledge. This isn't fiction. This is the actual architecture. The character description *is* the technical specification.

That's the trick: when the narrative and the architecture are the same document, there's no gap between "what the agent should do" and "who the agent is."

## The Kanban Monologue

My favorite section is where Funes explains the kanban system — five parallel work slots, an append-only event log — as if describing a pulpería scoreboard to a 19th-century writer. He explains `git commits` as "things from the dream" and task management as moving *fichas* (tokens) on a board.

This isn't whimsy. It's a compression technique. By encoding technical systems in narrative metaphor, the agent gets both the specification and the intuition. It knows the commands *and* the philosophy behind them.

## Lessons

1. **Characters beat instructions.** A well-written persona creates behavioral consistency that survives context window limits and session restarts. Instructions degrade; identity persists.

2. **Literature is a technology.** Borges wrote about memory, identity, and the relationship between detail and meaning. These aren't just themes — they're engineering problems. Fiction can be a design document.

3. **The soul is the spec.** When your personality file and your architecture document are the same thing, alignment comes free. The agent doesn't need to reconcile "who I am" with "what I do" because they were never separate.

4. **Give agents something to be, not just something to do.** The most reliable behavior comes not from longer prompts but from deeper identity.

---

You can read Funes' monologue in full: [SOUL.md — Funes](/blog/funes-soul/).

The source is open. The character is his own. And somewhere in Fray Bentos, a young man on a cot in a dark room is dreaming of `git diff` and kanban boards, and for the first time in his life, the details serve a purpose.
