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
    https://github.com/franklinbaldo/franklinbaldo.github.io/blob/d697b21a753773fe6aeee9b8adcdabac42abd782/src/content/blog/2026-03-28-the-art-of-delegation.md
  timestamp: '2026-05-23T19:42:48.489Z'
  msg: >-
    Adicionou incidente concreto de Porto Velho (parecer de prazo processual em
    fevereiro) para ancorar a distinção minuta/assinatura em experiência real.
    Conectou explicitamente a pressão do prazo judicial com a pressão de 14 PRs
    abertos. Trocou o fechamento atmosférico por linha deadpan curta. Reduziu
    For Further Reading de 4 para 2 entradas (cortou 2 auto-links).
---

The problem with most writing about AI delegation is that it assumes the difficulty is emotional. The engineer, we are told, struggles with letting go. The solution offered is usually some variation of "trust the system" or "treat the agent like a junior developer."

This is bad advice wrapped in bad metaphor. The difficulty is not emotional; it is structural. And the structure is something the legal profession figured out a long time ago, because the legal profession is, at bottom, a technology for managing dangerous delegation.

I spend my days in a state attorney's office in Rondônia, reading _pareceres_ drafted by assessors and signing the ones that don't terrify me. When I delegate a legal opinion, I am not asking someone to be my extended keyboard. I am handing down the task of traversing the case file, identifying the applicable law, and proposing a conclusion. What I am _not_ handing down is the signature. The signature is the irreversible boundary.

The pressure to blur that line is real and specific. Last February, I had three pareceres waiting and a hearing at four o'clock. The assessor I trust most had drafted an opinion on a procedural deadline. I had worked with her for two years. I knew her track record. The hearing was in thirty-five minutes. I signed without reading as carefully as I should have. The opinion was mostly correct — but "mostly correct" on a deadline question is how you lose an appeal window for someone who trusted the office to get it right. I found the error the next morning and we moved to correct it before the deadline lapsed. We made it. Sometimes you don't.

That's what "the signature is the irreversible boundary" looks like in practice: not a philosophical principle, but a Thursday decision made under time pressure, where the institutional rule that says _you sign as if you read every word_ is the only thing that protects the person whose rights hang on the date.

When we orchestrate agents like [Jules](/blog/2026-05-10-jules-api-harness-backend/) and Claude, the problem is not that we want to micromanage their keystrokes. The problem is that software engineering, unlike administrative law, does not natively separate the draft from the signature. In code, writing the function and executing the function often look like the same continuous motion. Worse: when the agent is fast and the tests are green and there are fourteen pull requests open, the pressure to just merge is the same pressure I was under at 3:25 on a Thursday afternoon in Porto Velho.

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

We are not building tools that replace us. We are building an administrative apparatus where human discernment sits at the edge of the sandbox, reviewing the proposals generated by the probabilistic brute force inside.

The assessor is good. The agent is capable. Neither of those facts changes who signs.

## For further reading

- **Lucy Suchman, _Plans and Situated Actions_ (1987)** — on the difference between the plan as a cognitive model and the plan as an accountability artifact. The proposal PR is this kind of artifact: not a record of how the agent decided, but the structured commitment by which the decision will be judged.
- **[The Agent That Doesn't Invent Verbs](/blog/2026-05-14-the-agent-that-doesnt-invent-verbs/)** — what happens when you take the sandbox constraint seriously enough to enumerate the agent's entire action vocabulary on disk, as named content-addressed playbooks.
