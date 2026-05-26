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
  uuid: d04c4bd5-d7c9-521a-9ea3-a9e4e1aa9e0b
  url: >-
    https://github.com/franklinbaldo/franklinbaldo.github.io/blob/d353fd1dce1fa025a8a975be942176eb22ba4c87/src/content/blog/the-art-of-delegation.md
  timestamp: '2026-05-26T13:23:41.259Z'
  msg: >-
    Ancorado o incidente de fevereiro no tipo específico de caso (auto de
    infração tributária, prazo de 48h), tornando a falha concreta em vez de
    abstrata. Adicionado parágrafo explicando por que a engenharia de software
    não separa nativamente minuta de assinatura — a legibilidade da lacuna é o
    que o direito administrativo fornece e o código precisa recriar. Expandido o
    comportamento concreto do Funes no harness (PR sem merge, causaganha draft
    sem envio). Dois novos itens no For Further Reading: Lei 9.784 como fonte
    normativa direta e Brooks para o princípio da equipe cirúrgica.
---

The problem with most writing about AI delegation is not that it's wrong. It's that it's set in the wrong room.

In February, I almost missed a window in a federal tax case because I had started treating the assessor's draft as the deliverable. The case was a state revenue objection — an _auto de infração_, forty-eight hours to contest before the administrative window closed. The _parecer_ was good: the applicable statute correctly identified, the procedural argument solid, the conclusion defensible. The assessor had marked it ready for review on Monday morning. The window closed Wednesday at midnight. On Tuesday afternoon I realized the submission had not been filed. The draft was complete. The act was not. That is a forty-eight-hour gap during which I had stopped tracking something I was legally responsible for.

This is the same confusion that breaks AI delegation.

I spend my days in a state attorney's office in Rondônia, reading _pareceres_ drafted by assessors and signing the ones that don't terrify me. When I delegate a legal opinion, I am not asking someone to be my extended keyboard. I am handing down the task of traversing the case file, identifying the applicable law, and proposing a conclusion. What I am _not_ handing down is the signature. The signature is the irreversible boundary — the moment the act enters the record and the deadlines start moving.

The reason this distinction doesn't arise naturally in software engineering is that the feedback loop is tighter. In law, the delays are built into the institution: the assessor finishes drafting, the protocol office has a processing window, the court's system has its own schedule. The stages are physically separate and the gap is legible. In code, the developer writes the function, the tests pass in thirty seconds, the PR auto-merges on green. The proposal and the act compress into a continuous motion, and the point where the agent's output stops being draft and starts being act is never made explicit.

When we orchestrate agents like Jules and Claude, the problem is not that we want to micromanage their keystrokes. The problem is that software engineering, unlike administrative law, does not natively separate the draft from the signature. In code, writing the function and executing the function often look like the same continuous motion.

## The boundaries of the sandbox

When I trust Jules to refactor a microservice in the background, the anxiety does not come from a fear that Jules will choose the wrong design pattern. The anxiety comes from the fact that Jules has write access.

The solution is not to stand over Jules's shoulder while it writes. The solution is to build a sandbox where the agent's actions are explicitly treated as _proposals_. The CI/CD pipeline, the test suites, the strict linting rules—these are not just quality assurance mechanisms. They are the equivalent of the institutional rules that say an assessor can draft a _parecer_, but cannot sign the final _ofício_.

The magic of delegation happens when you constrain the output space, not the process. You define the bounds of the sandbox — the schema, the invariants, the tests — and you allow the agent to navigate the interior freely. If the tests pass, the proposal is valid. But the _apply_ step — the actual merging of the PR, the deployment to production — that remains a human signature. A CI pipeline that cannot be bypassed is a protocol office: a mandatory processing step between the draft and the act that makes the stages legible again.

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

Funes opens pull requests; he does not merge them. He updates memory files; he does not send emails on his own. When I asked him to draft a response to an external inquiry about causaganha, he wrote the draft and created a PR containing it. He did not send the message. Not because a rule said _do not send messages without permission_. Because the harness simply had no wiring for outbound external messages — the sandbox made the signature step structurally required, not behaviorally enforced.

He acts because the framework permits it, and he pauses when the framework demands a signature. _Reversível → age, irreversível → pergunta._ That is not just a safety heuristic; it is a theory of constitutional design for agents.

The assessor is good. The agent is capable. Neither of those facts changes who signs.

## For further reading

- **Lucy Suchman, _Plans and Situated Actions_ (1987)** — on the difference between the plan as a cognitive model and the plan as an accountability artifact. The proposal PR is exactly this kind of artifact.
- **Dylan Hadfield-Menell et al., _The Off-Switch Game_ (2017)** — corrigibility as game theory; the human-approval-before-apply step is a concrete instance of what this paper formalizes.
- **Brazilian Lei 9.784/1999, arts. 11–17** — the domestic legal framework for delegation of administrative acts. The distinction between _competência_ and its limits is the statutory source of the draft/signature separation I've been describing. Most software engineers have never read a line of administrative procedure law and would benefit from the clarity.
- **Fred Brooks, _The Mythical Man-Month_ (1975)** — specifically the surgical team chapter: the person doing the intellectual work is not the person accountable for the output. The same capability can exist in two accountability architectures, and the choice between them is not a capability question.
