---
title: 'The Art of Delegation: Signatures and Sandboxes'
description: >-
  The sandbox separates draft from act. What it doesn't do is answer where the
  accountability lives when the sandbox fails.
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
  uuid: af592b0d-035b-5dbe-8ed5-d540b2fe3fa2
  url: >-
    https://github.com/franklinbaldo/franklinbaldo.github.io/blob/4d6c9b2a2b5711080406dfc7e9886ca65287595f/src/content/blog/the-art-of-delegation.md
  timestamp: '2026-06-08T07:19:48.544Z'
  msg: >-
    Deepened the ontological stakes of the signature vs. draft distinction,
    replacing generic tutorial tone with focus on risk and consequence.
---

In February, I almost missed a forty-eight-hour window in a federal tax objection because I had begun treating the assessor's draft as the deliverable. The _parecer_ — the formal legal opinion that travels up the chain before anything gets signed — was good. The submission was not filed. I found out Tuesday afternoon when a calendar alert fired for a deadline I had mentally moved from my column to the assessor's column the moment the draft landed. It had not moved.

The tribunal doesn't ask who proposed the wrong date. It asks who signed.

That's not a procedural technicality. That is the reason the signature exists.

I spend my days in a state attorney's office in Rondônia, reading _pareceres_ and signing the ones that don't terrify me. When I delegate the drafting, I am not outsourcing judgment — I am delegating the traversal of the case file, the identification of the applicable law, the construction of the argument. What I am _not_ delegating is the signature. The signature is the irreversible boundary: the moment the act enters the record and the deadlines start moving.

Software engineering struggles with this distinction because it has spent the last decade building tools to erase it. The goal of CI/CD, of automated testing, of continuous deployment, is to turn the abyss between draft and act into an imperceptible ramp. The code passes the test and becomes reality thirty seconds later. The consequence of a failure is fast, technical, and usually reversed with a rollback. In law, the gap is an abyss with business hours, and falling into it has a cost that cannot be undone by pushing a button.

## The boundaries of the sandbox

The anxiety about AI agents is real and it has nothing to do with capability. When I hand Jules a refactoring task, I am not worried Jules will choose the wrong design pattern. I am worried Jules has write access.

The solution is not to stand over Jules's shoulder while it writes. The solution is a sandbox where the agent's actions are explicitly treated as _proposals_. The CI/CD pipeline — the automated sequence of builds, tests, and checks that must pass before any code goes live — the test suites, the strict linting rules: these are not just quality assurance mechanisms. They are the institutional equivalent of the rule that says an assessor can draft a _parecer_, but cannot sign the final _ofício_ (the official dispatch that goes out the door and binds the institution).

Delegation breaks when it confuses capacity with risk. You constrain the output space, define the schema, run the tests. If everything passes, you have a valid proposal. But the _apply_ step — the merge, the deployment, the filing — remains a signature.

This is where the administrative parallel exposes the fracture in the software model. In a _parecer_, the human assessor's accountability is not just technical; it's existential. An assessor who consistently drafts bad arguments loses their job, faces the board, sinks their career. They have skin in the game. The signature separates draft from act, but the draft already carried risk.

An AI agent has no skin. It simulates competence, but it does not inhabit risk. The sandbox constrains the agent's capacity, but it doesn't know what to do with consequence. When an agent fails, the blame doesn't slide sideways to the machine; it travels straight up the spine of whoever built the harness. The agent produces language; the consequence bleeds on you.

The signature step in algorithmic delegation is not a quality control gate. It is the exact point where the simulation meets the real and the bill comes due.

I did not see this clearly until I was writing out the analogy and noticed the sentence "the assessor is good" sounded reasonable in a way that "Jules is good" does not, and could not, quite mean the same thing. Both sentences describe capacity. Only one describes a person who can be accountable for anything.

I had been thinking of the signature as a formality. It is a formality. It is also the thing that makes the February mistake mine and not Jules's.

## The harness as constitutional design

This is why the harness matters more than the model. [Funes](/blog/funes-soul/) — the AI agent I've built on top of Claude to handle delegated work across my projects — is not Claude. Funes is Claude wrapped in a specific set of rules, memories, and constraints.

Funes opens pull requests; he does not merge them. He updates memory files; he does not send emails on his own. When I asked him to draft a response to an external inquiry about [Causaganha](https://github.com/franklinbaldo/causaganha), my open-source project for parsing Brazil's official gazette decisions, he wrote the draft and created a PR containing it. He did not send the message. Not because a rule said _do not send messages without permission_. Because the harness had no wiring for outbound external messages — the sandbox made the signature step structurally required, not behaviorally enforced.

_Reversível → age, irreversível → pergunta._ That is not just a safety heuristic; it is a decision about where accountability concentrates. Every action the agent takes freely is an action whose accountability has been pre-delegated by whoever designed the harness. Every action requiring a signature is an action whose accountability remains explicitly with the human who signs.

The _parecer_ was good. That sentence is about the assessor. The submission was not filed. That sentence is about me.

## For further reading

- **Lucy Suchman, _Plans and Situated Actions_ (1987)** — distinguishes the plan as a cognitive model from the plan as an accountability artifact. The PR-as-proposal sits exactly on this line, and the book earns its keep in the section on what "following a plan" actually means to the people following one.
- **Dylan Hadfield-Menell et al., _The Off-Switch Game_ (2017)** — corrigibility as game theory. The human-approval-before-apply step is one concrete instance; the paper frames the general case.
- **Diane Vaughan, _The Challenger Launch Decision_ (1996)** — on how accountability mechanisms ritualize into theater. If the human who signs the PR isn't actually reading the diff, the signature is bureaucracy, not accountability. This is what the sandbox-plus-signature design does not protect against on its own.
- **Brazilian Lei 9.784/1999, arts. 11–17** — the domestic legal framework for delegation of administrative acts. The distinction between _competência_ and its delegable limits is the statutory source of the draft/signature separation I've been describing.
- **Fred Brooks, _The Mythical Man-Month_ (1975)** — the surgical team chapter: the same capability can exist in two accountability architectures, and the choice between them is not a capability question.
