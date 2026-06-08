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
  timestamp: '2026-06-08T10:52:56.562Z'
  msg: Refine the lowest-rated post based on hronir feedback
---

In February, I almost missed a forty-eight-hour window in a federal tax objection because I had begun treating the assessor's draft as the deliverable. The _parecer_ — the formal legal opinion that travels up the chain before anything gets signed — was good. The submission was not filed. I found out Tuesday afternoon when a calendar alert fired for a deadline I had mentally moved from my column to the assessor's column the moment the draft landed. It had not moved.

The tribunal doesn't ask who proposed the wrong date. It asks who signed. The assessor's mistake was to propose; mine, unforgivable and silent, was to rubber-stamp inertia as procedural progress. That's not a procedural technicality. That is the reason the signature exists: it transforms a private opinion into an act of State.

I spend my days in a state attorney's office in Rondônia, reading _pareceres_ and signing the ones that don't terrify me. When I delegate the drafting, I am not outsourcing judgment — I am delegating the traversal of the case file, the identification of the applicable law, the construction of the argument. What I am _not_ delegating is the signature. The signature is the irreversible boundary: the moment the act enters the record and the deadlines start moving.

Software engineering doesn't natively recognize this distinction because the feedback loop compresses and dissolves it. In law, the gap between draft and act is physically and historically legible — the assessor finishes the document, the protocol office has its window, the court has its own schedule. In modern code, the developer writes the function, the tests pass in thirty seconds, the PR merges on green. Draft and act become one continuous motion, a cascade of bytes where authorship blurs, and nobody writes down where one ends and the other begins. It is an architecture of distributed irresponsibility.

## The boundaries of the sandbox

The anxiety about AI agents is real and it has nothing to do with capability. When I hand Jules a refactoring task, I am not worried Jules will choose the wrong design pattern. I am worried Jules has write access.

The solution is not to stand over Jules's shoulder while it writes. The solution is a sandbox where the agent's actions are explicitly treated as _proposals_. The CI/CD pipeline — the automated sequence of builds, tests, and checks that must pass before any code goes live — the test suites, the strict linting rules: these are not just quality assurance mechanisms. They are the institutional equivalent of the rule that says an assessor can draft a _parecer_, but cannot sign the final _ofício_ (the official dispatch that goes out the door and binds the institution).

The magic of delegation happens when you constrain the output space, not the process. You define the bounds of the sandbox — the schema, the invariants, the tests — and allow the agent to navigate the interior freely. If the tests pass, the proposal is valid. But the _apply_ step — the actual merging of the PR, the deployment to production — that remains a human signature. A CI pipeline that cannot be bypassed is a protocol office: a mandatory processing step between the draft and the act.

This is where the administrative law parallel excessively flatters the software problem. In a _parecer_, the assessor's accountability is structural and biographical. Consistently bad legal advice attracts formal review — the _corregedoria_ (the internal oversight body), the professional council, dismissal. There is a punitive chain from the act down to the social security number of the person who drafted it, and that chain has steel teeth. The signature doesn't only separate draft from act: it separates whose career is on the line from who is protected by the hierarchical shadow. Contemporary software pretends the process eliminates the need for this punitive umbilical cord.

An AI agent has no career. It cannot be disciplined. The sandbox constrains what it can do, but the sandbox doesn't answer what happens when the sandbox fails. When an agent does something wrong inside the bounds of its access, accountability flows upward to the human who designed the harness — not sideways to the agent. That is not a property I built in; it is a property of agents without institutional standing.

The sandbox is necessary. It is not sufficient for accountability. The signature step in software delegation is doing more work than the administrative parallel suggests: it is not just making the proposal-versus-act boundary explicit. It is also carrying all the professional weight that the agent structurally cannot carry.

I did not see this clearly until last month, when I found myself reviewing the analogy and noticed the sentence "the assessor is good" sounded morally reasonable in a way that "Jules is good" does not, and could not. Both sentences describe capacity. Only one describes an entity whose mistake carries real biographical weight, someone who knows the taste of fear when clicking "send".

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
