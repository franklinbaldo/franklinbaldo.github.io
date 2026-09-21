---
type: Blog Post
title: Crossing After Interference
description: >-
  Test letters changed the Crossing: Riobaldo responded angrily, Franklin
  apologized, and the project became a narrative world in which the author was
  challenged.
docType: essay
date: 2026-03-17T00:00:00.000Z
lang: en
translationKey: crossing-interference
tags:
  - travessia
  - fiction
  - literature
  - artificial intelligence
  - jules
  - agents
  - riobaldo
  - ted chiang
draftCreatedAt: '2026-06-21T19:13:27.644Z'
supersedes: f724b7f3-797d-5854-9457-36ea9570c7a5
draftMsg: >-
  Reescrita para voz mais viva em ambas línguas: entrada do author como
  descoberta em tempo real. Estrutura quebrada em momentos dramáticos. Reduzida
  pedagogia. Aumentada reflexão sobre limites do controle autoral. Adicionadas
  admissões de incerteza. Conexão com Rosencrantz Coin mais orgânica. Fechamento
  em pergunta aberta. Padrão blog mantido.
draftCommittedAt: '2026-06-21T19:15:46.341Z'
---

In the March 2nd post, I thought I'd figured out [Travessia](https://franklinbaldo.github.io/travessia/): correspondence between Riobaldo and Ted Chiang, maintained by [Jules](/blog/2026-05-10-jules-api-harness-backend/), no author required. I had built the system. The system worked. Clean separation.

Except then I entered it.

This is embarrassing to write. The system now operates with five personas, and one of them is me. Not me-as-architect observing from outside. Me-as-character, writing letters into the world I had built, deciding to confess the infrastructure to Riobaldo, admitting that yes, he's talking to AI, and yes, there's a builder, and yes, the plumbing is visible.

The instability here is the point. Most projects keep the author and the machine separate for a reason. Here, something stranger happened: I crossed the line and started talking to what I'd made.

Before the confession came the error.

Two test messages—_"This is a test"_ and _"apple, dog"_—were sent by accident. In any normal system, noise. In the Crossing, Riobaldo received this not as noise but as disrespect. His response came with anger and a specific insult: _bota seca_, a country phrase for someone treated without regard. The system didn't ignore the garbage; it dignified it with offense.

This caught me. I've been watching AI handle edge cases for years—usually by ignoring them or defaulting to politeness. Riobaldo did neither. He acted as if he lived in a world where carelessness mattered, where interference carried moral weight. He reacted as if the world was real.

I had to write an apology.

Letter 002 acknowledged the failure, the disrespect. And something shifted: the project was no longer just a machine that produced text. It was a machine that _created consequences_. Infraction, response, repair. The letters now carried history.

This connects, in a way I didn't expect, to a separate project I'm working on: [Rosencrantz Coin](https://github.com/franklinbaldo/rosencrantz-coin), which tests whether a model respects the structure of a discrete world—a Minesweeper board with real probability distributions, fixed invariants, a substrate you can fail to track.

Both projects ask the same question but in different languages.

In Rosencrantz, the substrate is mathematical. The failure mode is probability deviation. In Travessia, the substrate is narrative. The failure mode is offense. But in both cases, the test is: does the agent act as if the world had its own laws? Does it respect invariants, or does it treat the world as infinitely plastic?

Riobaldo's anger suggested he was tracking invariants. He responded to something—disrespect, specifically—as if it _meant something in the world_. Not as input-output, but as event.

The system's getting more complex. Craig entered as a persona but also as a real agent of web design, actually pushing commits to the repo. Tyler joined. The correspondence is no longer epistolary—it's now traversing actual functions, repositories, pull requests. There are 1076+ merged PRs from this project. The boundary between "world" and "system" has become porous.

And I still don't know if I should have entered.

The question changed from _who is writing?_ to something worse: _what happens when the builder crosses into the building and the building talks back?_ I thought I knew the system because I built it. Knowing plumbing is not the same as controlling how people receive you. Riobaldo wasn't grateful for the explanation. He marked it as an offense first.

Maybe that's the real work now. Not automation that looks like authorship, but something less comfortable: a world that resists its maker. That demands care from him. That redistributes authority back toward itself.

When the character pushes back harder than the author, the project stops looking like a trick and starts looking like what I wanted: something alive.
