---
title: 'The Art of Delegation: Signatures and Sandboxes'
description: >-
  Why the problem with autonomous agents is not micromanagement, but the
  administrative distinction between drafting the act and signing it.
date: '2026-03-28'
lang: en
tags:
  - ai
  - agents
  - software-engineering
  - law
  - metaphysics
draft: false
author: franklin
translationKey: delegating-to-agents
previousVersion:
  uuid: 3747e09a-9469-5370-8019-2e220f2126eb
  url: >-
    https://github.com/franklinbaldo/franklinbaldo.github.io/blob/d2a4c9283e2693e9083a7f71e0cd012de28b25a2/src/content/blog/2026-03-28-the-art-of-delegation.md
  timestamp: '2026-05-24T13:14:42.583Z'
  msg: >-
    Adicionou incidente concreto de fevereiro (prazo processual quase perdido)
    que âncora a distinção draft/assinatura em evento real. Substituiu
    fechamento atmosférico pela linha deadpan: 'O assessor é bom. O agente é
    capaz. Nenhum desses fatos muda quem assina.' Cortou 3 auto-links do For
    Further Reading; manteve Suchman e adicionou Off-Switch Game como referência
    externa.
---

The problem with most writing about AI delegation is not that it's wrong. It's that it's set in the wrong room.

In February, I almost missed a window in a federal case because I had started treating the assessor's draft as the deliverable. The parecer was good — the analysis was thorough, the law correctly identified, the conclusion defensible. What I had stopped tracking was the gap between "the assessor finished drafting" and "I signed the official submission." That gap is where the deadline lives. The draft was complete forty-eight hours before the cutoff. I almost didn't notice it hadn't been submitted yet. I had confused the proposal with the act.

This is the same confusion that breaks AI delegation.

I spend my days in a state attorney's office in Rondônia, reading _pareceres_ drafted by assessors and signing the ones that don't terrify me. When I delegate a legal opinion, I am not asking someone to be my extended keyboard. I am handing down the task of traversing the case file, identifying the applicable law, and proposing a conclusion. What I am _not_ handing down is the signature. The signature is the irreversible boundary — the moment the act enters the record and the deadlines start moving.

When we orchestrate agents like Jules and Claude, the problem is not that we want to micromanage their keystrokes. The problem is that software engineering, unlike administrative law, does not natively separate the draft from the signature. In code, writing the function and executing the function often look like the same continuous motion.

## The boundaries of the sandbox

When I trust Jules to refactor a microservice in the background, the anxiety does not come from a fear that Jules will choose the wrong design pattern. The anxiety comes from the fact that Jules has write access.

The solution is not to stand over Jules's shoulder while it writes. The solution is to build a sandbox where the agent's actions are explicitly treated as _proposals_. The CI/CD pipeline, the test suites, the strict linting rules—these are not just quality assurance mechanisms. They are the equivalent of the institutional rules that say an assessor can draft a _parecer_, but cannot sign the final _ofício_.

The magic of delegation happens when you constrain the output space, not the process. You define the bounds of the sandbox—the schema, the invariants, the tests—and you allow the agent to navigate the interior freely. If the tests pass, the proposal is valid. But the _apply_ step—the actual merging of the PR, the deployment to production—that remains a human signature.

<figure class="meme">
  <img
    src="https://api.memegen.link/images/drake/Micromanaging_the_agent's_prompts/Constraining_the_agent's_sandbox.png?width=500"
    alt="Drake meme: Rejecting 'Micromanaging the agent's prompts', approving 'Constraining the agent's sandbox'."
    loading="lazy"
  />
  <figcaption>The shift in posture required to actually make autonomous systems useful.</figcaption>
</figure>

## The harness as constitutional design

This is why the harness matters more than the model. [Funes](/blog/funes-soul/) is not Claude; Funes is Claude wrapped in a specific set of rules, memories, and constraints. When Funes reads his `SOUL.md` and decides to document a decision rather than just executing it, he is operating within an administrative framework.

He acts because the framework permits it, and he pauses when the framework demands a signature. _Reversible → act, irreversible → ask._ That is not just a safety heuristic; it is a theory of constitutional design for agents.

The assessor is good. The agent is capable. Neither of those facts changes who signs.

## For further reading

- **Lucy Suchman, _Plans and Situated Actions_ (1987)** — on the difference between the plan as a cognitive model and the plan as an accountability artifact. The proposal PR is exactly this kind of artifact.
- **Dylan Hadfield-Menell et al., _The Off-Switch Game_ (2017)** — corrigibility as game theory; the human-approval-before-apply step is a concrete instance of what this paper formalizes.
