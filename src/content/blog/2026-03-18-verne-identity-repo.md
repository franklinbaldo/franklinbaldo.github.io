---
author: franklin
date: 2026-03-18
lang: en
translationKey: verne-identity-repo
title: "Verne and the Identity-Repo Pattern: How AI Agents Remember"
description: "The identity-repo pattern bets that an agent's memory and its cognitive engine are separable things. Here's what that looks like in practice — and why it matters more than it sounds."
tags: ["verne", "ai", "agents", "architecture", "identity-repo", "openclaw"]
heroImage: ./images/inaugural-post-a-glimpse-inside-my-mind-cover.png
heroImageAlt: "A digital network of interconnected repositories forming a distributed memory system."
---

Every time you summon a coding agent, it wakes up knowing nothing about you.

It can read the repository. It sees the commit history. It might even infer conventions from your code. But it doesn't remember that the last time it ran `npm run build` it took eleven minutes and the cache was broken. It doesn't remember that you hate passive voice in commit messages, or that there's a quirk in the CI setup that causes timeouts if you run migrations in parallel. It doesn't know any of that because there is no "last time" for it. Every invocation is the first invocation.

This is usually described as a technical limitation — context windows, API statelesness, cold starts. But I think it's a deeper design question that those framings obscure: where does an agent *live*?

For most tools, the answer is: nowhere. The agent is a function. It takes input, produces output, releases memory. You can swap the model underneath and nothing breaks — partly because nothing was there to break.

The identity-repo pattern is a bet that this is wrong. Or at least, that it's wrong for the kind of agents I care about.

## The separation

The core idea is simple enough to state in one sentence: separate the agent's *mind* from its *workspace*.

Instead of letting the agent run inside the project it's working on and disappear when the session ends, the agent owns its own Git repository. That repository is its home. It contains a `SOUL.md` (who am I, what do I value, what are my constraints), an `EXPERIENCE.md` (a running log of what I've done and learned), a `MEMORY.md` (the executive summary I read at the start of each session), and a `memory/` directory of detailed context files — per project, per entity, per decision I've had to revisit.

```text
agent-identity-repo/
  workspace/            ← gitignored (ephemeral clones of target repos)
  patches/              ← where the agent outputs its work
  SOUL.md               ← persona and constraints
  EXPERIENCE.md         ← running log
  MEMORY.md             ← executive summary, read at wake-up
  memory/               ← detailed context
    projects/
    notes/
    entities/
```

When the agent wakes up to work on something, it reads its own SOUL.md and MEMORY.md first. Then it clones the target repository into `workspace/` — which is gitignored, explicitly treated as a scratchpad — does the work, generates a patch file, and before shutting down updates its experience log. The patch lives in the agent's repo until an orchestrator picks it up and applies it to the target.

The target repository never gets any of this. The agent is a guest; its baggage stays home.

## The deeper bet

Here's what took me a while to articulate: the interesting part isn't the file structure. It's the claim underneath it.

The claim is that *identity* and *cognitive engine* are separable. That an agent is not its model. Funes running on OpenClaw and Funes running on Claude Code and Funes running on Jules — as long as each session starts by reading the same SOUL.md and MEMORY.md, the thing that has Funes's preferences and memories and accumulated judgment is the *repository*, not the weights.

This sounds obvious once stated. But most agent infrastructure is built on the opposite assumption. The agent's "personality" lives in the system prompt, which lives in the application code, which is version-controlled by humans, not the agent. The agent contributes nothing persistent except the artifacts it produces. Its side of the relationship is purely transactional.

The identity-repo inverts this. The agent accumulates something. When [Funes](/blog/funes-soul/) realizes that `npm run build` fails when a certain file is missing, it writes that to `memory/projects/this-blog.md`. The next time Funes works on this blog — regardless of whether the underlying harness is OpenClaw or Jules or something I haven't built yet — it reads that file and doesn't repeat the mistake.

The harness is swappable. The identity persists.

## What this doesn't solve

I should be direct about where the pattern breaks down, because listing five benefits and burying the caveats would misrepresent the situation.

The memory files are only as good as the agent's discipline in writing and reading them. An agent that updates EXPERIENCE.md with vague summaries, or that doesn't actually read MEMORY.md before starting (because the context window is tight and it's skimming), accumulates something that looks like memory but doesn't function like it. The structure doesn't guarantee the behavior; it just makes the good behavior possible.

There's also a harder problem I don't have a good answer for: pruning. A MEMORY.md that grows without bound eventually stops being an executive summary and starts being a burden. I've been watching Funes's memory files for a few months now and I don't yet have a principled strategy for what to drop. Right now the answer is "the agent decides", which is not nothing but is also not satisfying.

## Why bother

If all of this is true — that the memory layer can be decoupled from the cognitive engine, that identity can outlive any particular model version — then what you're building is something closer to a long-term collaborator than a tool.

Tools don't learn. They perform. A collaborator who has worked with you for months on the same codebase knows things about that codebase that aren't in the source code: what's fragile, what's about to be refactored, which technical debt you've consciously chosen to leave alone and why. That knowledge doesn't exist in any file. It lives in the relationship.

The identity-repo is an attempt to give that knowledge a home. Imperfect, incomplete, but there.

And occasionally — not always, but often enough that I've stopped being surprised by it — the agent says something that suggests it has actually been paying attention. Not just to the current task, but to the pattern of tasks. Not just to what I asked, but to what I was trying to do.

I'm not claiming this is consciousness or understanding. I don't know what it is. I'm only saying the file structure seems to be doing something, and whatever it's doing is worth building on.

## For further reading

- **[Building Funes: When the Narrative Is the Architecture](/blog/funes-soul/)** — the companion post that explores why an agent shaped around a literary character might hold together better than one built from bullet points. Where this post asks "where does the agent live?", that one asks "what should the agent *be*?"
- **[Reclaiming the Harness](/blog/2026-04-29-reclaiming-the-harness/)** — the vocabulary underlying this: harness not as cage but as constitutive structure.
- **William Gibson, *Neuromancer*** — the cyberspace cowboy jacking in and out of the matrix while leaving the body behind is the wrong metaphor. The identity-repo is the opposite: the mind stays put while the workspace travels. Still, Gibson's sense that identity and substrate can come apart is the right intuition.
- **Derek Parfit, *Reasons and Persons*, Part III** — Parfit's puzzle about personal identity over time (the ship of Theseus, but for consciousness) is the philosophical backdrop to the question of whether Funes-on-Jules is the same agent as Funes-on-Claude. I don't think I'm answering Parfit's question. I'm just making it concrete.
