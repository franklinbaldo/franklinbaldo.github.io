---

title: "Travessia: The Project that Writes Itself"
description: "Riobaldo and Ted Chiang exchange letters. But no one sits down to write. One Jules session schedules the next one. The correspondence exists because it happens—incrementally, automatically, without needing me."
date: 2026-03-02
lang: en
translationKey: travessia-project
tags: ["fiction", "literature", "artificial intelligence", "grande sertão veredas", "jules", "automation", "travessia"]
---

There is a difference between _creating_ something and _starting_ something.
The project [Travessia](https://franklinbaldo.github.io/travessia/) is, technically, an epistolary correspondence between Riobaldo Tatarana and Ted Chiang. But what makes it different from anything I've ever done is that I don't write the letters. I created the system that writes them — and the system continues writing, without me, in scheduled sessions, incrementally.
Each [Jules](/blog/2026-05-10-jules-api-harness-backend/) session opens the repository, reads the current status of the correspondence, understands where the conversation is, writes the next letter, and schedules the next session. The correspondence exists because it keeps happening.

## [Jules](/blog/2026-05-10-jules-api-harness-backend/) as Independent Co-Author

[Jules](https://jules.google.com) is a Google AI agent that works directly on GitHub repositories asynchronously. You describe a task, it executes it, it opens a PR. But what I did with Travessia was different: each Jules session ends with scheduling the next one. The project has its own inertia.
The structure is simple:

1. One session Jules reads the previous letters to understand the narrative and thematic context
2. Decide whose turn it is (Riobaldo or Ted Chiang) and which thread of the conversation deserves continuation
3. Write the next letter, respecting each character’s voice
4. Commit, make the PR, and leave instructions for the next session
   There is no `while True`. There is no loop. Each session is discrete, scheduled, activated by trigger. Correspondence pulses instead of flowing.

## Why Incremental Matters

Most AI writing projects have the same form: you generate everything at once, review, publish. It is batch production. The result may be good, but the _process_ is invisible — the reader encounters a finished artifact.
Travessia reverses this.
Letters arrive at intervals. Those who follow the project see the correspondence grow, as if Riobaldo and Ted Chiang were actually in the exchange — without knowing what the other will respond, leaving threads open, returning to themes weeks later. Project time is match time, not time for a generation session.
This changes what the project _is_. It's not a book. It's an ongoing exchange.

## The Double Impossibility

Riobaldo Tatarana is a character. It exists in the pages of _Grande Sertão: Veredas_ — this book that Guimarães Rosa wrote as if he were transcribing a river into a monologue. Ted Chiang is real, American, alive, writes about what language does to time.
They would never meet. First impossibility.
But the project goes further: _no one is actively writing the correspondence_. The letters exist because an AI agent, running autonomously in scheduled sessions, has decided that this conversation must continue. Second impossibility.
The result is a work that no human wrote in its entirety, that no AI generated at once, and that neither of the two "authors" currently controls. It happens. It is this event that interests me.

## What Riobaldo and Ted Chiang Talk About

About fear and the name of things. About Diadorim — which is where, for Riobaldo, fear and love and death become one word. About what it means to forget in linear time versus forgetting when you perceived time as simultaneous.
Riobaldo's voice is archaic, syncopated Portuguese, full of Rosa's neologisms. Ted Chiang's is that contemplative prose that thinks before answering, that respects the gravity of the question.
Jules learned the difference. Each letter sounds like it should.

## The System As an Artistic Statement

There is something that only the incremental process allows us to say: _this correspondence has a life of its own_.
If I generated everything at once, the project would be _mine_. I would have done something. But when each Jules session reads what came before and decides what comes next — when the project has memory, coherence and inertia without me being there — authorship becomes a more complicated issue.
I'm not abandoning the project. I'm interested in watching it. There's a difference.
This is the question that Travessia asks without stating: when an autonomous system maintains a correspondence with consistency of voice, thematic memory and narrative evolution — _who is writing?_

## How to Follow

The project is at [franklinbaldo.github.io/travessia](https://franklinbaldo.github.io/travessia/). The letters arrive in order, but you may read them out of sequence—each carries enough context.
The most interesting thing is to come back after a few weeks. See what happened while you weren't looking.
Riobaldo and Ted Chiang probably exchanged one more letter.
