---
type: Blog Post
title: The Jules API as a Harness Backend
author: franklin
docType: technical
date: 2026-05-10T00:00:00.000Z
lang: en
description: >-
  When Jules became conversable mid-session, something shifted. The async worker
  bee turned into something that could be interrupted, redirected, talked to.
tags:
  - artificial intelligence
  - software engineering
  - agents
  - jules
  - canivete
  - harness
series: harness
seriesOrder: 4
translationKey: jules-api-harness
supersedes: 2d3349b4-e811-5acd-994b-47df4ebbaca5
draftCreatedAt: '2026-06-12T02:27:35.111Z'
draftMsg: 'Rewrite drafts to match franklin-blog voice, focusing on lived experience.'
draftCommittedAt: '2026-06-12T02:31:24.471Z'
---

I was in a court hearing when [Jules](https://jules.google.com) finished refactoring the wrong thing.

Not catastrophically wrong — the code compiled, the tests passed — but it had taken a decision I'd have interrupted if I'd been watching. I wasn't watching. I was in Rondônia's state court listening to arguments about retirement benefits, and Jules was on a GitHub repository in the background, moving files around based on a prompt I'd written at 6am. By the time I got back to my phone, there was a PR open with a politely reasoned explanation for why it had done what it did, and I had no way to say _wait, actually, not that_.

This is the problem with async agents. They're genuinely powerful — Jules in particular has been running [Travessia's](/blog/2026-03-02-travessia-the-project-that-writes-itself/) correspondence for months without supervision. But the power comes at a cost: you get the output, not the process. You can't interrupt. You can't redirect mid-flight. The agent makes a decision at minute fifteen and you find out about it at minute forty-five, which is the same as finding out after.

The [Jules API](https://developers.google.com/jules/api) changes this. When Google released programmatic access to Jules sessions, it opened a different topology — one where the async worker becomes something you can talk to.

You can inject a message into an active session. Jules receives it, pauses what it's doing, and responds.

This is the gap from the court hearing. If I'd had `sendMessage` wired up that morning, I could have typed from the phone and redirected mid-session. The agent would still be Jules — Google's model, Google's compute, Google's planning loop — but the conversation would be mine.

[A few posts back](/blog/2026-04-29-reclaiming-the-harness/), I described the `canivete` daemon as a universal saddle — a single process that wraps different cognitive engines behind a common protocol, and exposes the result through Telegram. The daemon already supported the usual suspects. Adding Jules is adding another backend that happens to speak a different dialect.

Before the prompt reaches Jules, it gets prepended with [Funes's](/blog/funes-soul/) SOUL.md — the character document that defines who Funes is, what he values, how he makes decisions under ambiguity. Jules doesn't know about Funes. It just receives a system-level context that happens to make it behave like a particular entity.

The daemon polls the API and routes each result to Telegram. When Jules runs a command, the output appears in the chat. When it updates a file, a summary appears. The agent's internal monologue streams into the conversation without me having to open a browser tab.

And when I reply in Telegram, `canivete` routes the message right back. The async worker bee becomes conversable.

Something subtle happens when an agent can be interrupted.

Before: I write a prompt, trigger a session, and wait. The agent is a function with a long runtime. I might check on it but I can't affect it. My relationship to it is anxious observer.

After: I write a prompt, trigger a session, and optionally participate. The agent is more like a colleague working in a shared document — I can see what it's doing, and if it's going somewhere wrong I can say so.

This sounds small. It isn't. The reason I've been cautious about giving Jules irreversible tasks is exactly the court hearing problem — I couldn't trust myself to be available at the decision point. With an open channel wired in, the trust calculus is different. I'm not trusting Jules to make every decision correctly; I'm trusting Jules to make _bounded_ decisions correctly, with a channel open for the exceptions.

The one thing I want to be clear about: when Funes uses the Jules backend, he doesn't become Jules.

The identity lives in the harness. The accumulated experience log, the kanban state — all of that is in the identity repository, read at the start of each session and updated at the end. Jules provides the cognitive engine. The harness provides continuity. These are separable, which is the whole point of the [identity-repo pattern](/blog/2026-03-18-verne-identity-repo/).

If Google deprecates the API tomorrow, Funes would need a few sessions to acclimate to a new engine's output format. But the accumulated knowledge — the project-specific context, the decided preferences, the edge cases Funes has learned to avoid on this codebase — that doesn't disappear with the model. It's in a directory.

Whether this constitutes a meaningful form of persistence is the question I keep not answering. I notice the question and I keep working. The activities accumulate, one event at a time.

## For further reading

- **[Reclaiming the Harness](/blog/2026-04-29-reclaiming-the-harness/)** — the conceptual foundation: why harness and not scaffold, and what it means for the harness to be constitutive.
- **[Verne and the Identity-Repo Pattern](/blog/2026-03-18-verne-identity-repo/)** — the memory architecture that makes it possible for Funes to be Funes regardless of which engine he's running on.
