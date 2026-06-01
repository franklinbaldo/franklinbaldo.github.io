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
  uuid: 78a1823e-289e-5332-9521-442b7373f11e
  url: >-
    https://github.com/franklinbaldo/franklinbaldo.github.io/blob/b60e690a4544790bcb3b73d128832a26afe59a69/src/content/blog/the-art-of-delegation.md
  timestamp: '2026-06-01T13:18:30.836Z'
  msg: >-
    Sharpened ending with circular callback to Feb incident; added rhythm-break
    paragraph after the honest-flaw section's climax. The post's best
    observation ('assessor is good' vs 'Jules is good' means different things)
    was diluted by the section that followed; the new short paragraph lets it
    land before moving on. New final line returns to the opening's two facts —
    'the parecer was good' / 'the submission was not filed' — and reassigns each
    to its proper subject, completing the argument without explaining it.
---

The problem with most writing about AI delegation is not that it's wrong. It's that it's set in the wrong room.

In February, I almost missed a forty-eight-hour administrative window in a federal tax objection because I had begun treating the assessor's draft as the deliverable. The _parecer_ was good. The submission was not filed. I found out on Tuesday afternoon when a calendar alert fired for a deadline I had mentally moved from _my_ column to _the assessor's_ column the moment the draft came in. It had not moved.

When I later had to explain the near-miss to my coordinator, I noticed something that should have been obvious: it would have made no difference whether the error was in an AI agent's draft or the assessor's draft. The explanation would have been identical. The tribunal does not ask _who_ proposed the wrong date; it asks _who signed_. That is not a procedural technicality. That is the reason the signature exists.

This is the error AI delegation is waiting to repeat at scale.

I spend my days in a state attorney's office in Rondônia, reading _pareceres_ and signing the ones that don't terrify me. When I delegate the drafting, I am not outsourcing judgment — I am outsourcing the traversal of the case file, the identification of the applicable law, the construction of the argument. What I am _not_ delegating is the signature. The signature is the irreversible boundary: the moment the act enters the record and the deadlines start moving.

Software engineering does not natively recognize this distinction because the feedback loop compresses it. In law, the gap between draft and act is physically legible — the assessor finishes, the protocol office has its window, the court has its own schedule. In code, the developer writes the function, the tests pass in thirty seconds, the PR merges on green. The draft and the act become a continuous motion, and nobody writes down where one ends and the other begins.

## The boundaries of the sandbox

The anxiety is real and it has nothing to do with capability. When I hand Jules a refactoring task, I am not worried Jules will choose the wrong design pattern. I am worried Jules has write access.

The solution is not to stand over Jules's shoulder while it writes. The solution is to build a sandbox where the agent's actions are explicitly treated as _proposals_. The CI/CD pipeline, the test suites, the strict linting rules — these are not just quality assurance mechanisms. They are the equivalent of the institutional rules that say an assessor can draft a _parecer_, but cannot sign the final _ofício_.

The magic of delegation happens when you constrain the output space, not the process. You define the bounds of the sandbox — the schema, the invariants, the tests — and you allow the agent to navigate the interior freely. If the tests pass, the proposal is valid. But the _apply_ step — the actual merging of the PR, the deployment to production — that remains a human signature. A CI pipeline that cannot be bypassed is a protocol office: a mandatory processing step between the draft and the act that makes the stages legible again.

## The analogy's honest flaw

Here is where the administrative law parallel flatters the software problem.

In a _parecer_, the assessor's accountability is professional. If an assessor gives consistently bad legal advice, they face formal review — the _corregedoria_, the professional council, eventually the career track. There is a chain from the act to the person who drafted it, and that chain has teeth. The signature does not only separate draft from act: it separates whose career is on the line from whose was not.

An AI agent has no career. It cannot be disciplined. The sandbox constrains what it can do, but the sandbox does not answer the question of what happens when the sandbox fails. When an agent does something wrong inside the bounds of its access, the accountability flows upward to the human who designed the harness — not sideways to the agent. That is not a property I built in; it is a property of agents without institutional standing.

The sandbox is necessary. It is not sufficient for accountability. The signature step in software delegation is doing more work than the administrative parallel suggests: it is not just making the proposal-versus-act boundary explicit. It is also carrying all the professional weight that the agent structurally cannot carry.

I did not see this clearly until I was writing out the analogy and noticed the sentence "the assessor is good" sounded reasonable in a way that "Jules is good" does not, and could not, quite mean the same thing. Both sentences describe capacity. Only one describes a person who can be accountable for anything.

I had been thinking of the signature as a formality. It is a formality. It is also the thing that makes the February mistake mine and not Jules's.

<figure class="meme">
  <img
    src="https://api.memegen.link/images/drake/Micromanaging_the_agent's_prompts/Constraining_the_agent's_sandbox.png?width=500"
    alt="Drake meme: Rejecting 'Micromanaging the agent's prompts', approving 'Constraining the agent's sandbox'."
    loading="lazy"
  />
  <figcaption>The shift matters. But it answers "which action" more cleanly than it answers "whose fault" — and the tribunal cares more about the second question.</figcaption>
</figure>

## The harness as constitutional design

This is why the harness matters more than the model. [Funes](/blog/funes-soul/) is not Claude; Funes is Claude wrapped in a specific set of rules, memories, and constraints.

Funes opens pull requests; he does not merge them. He updates memory files; he does not send emails on his own. When I asked him to draft a response to an external inquiry about causaganha, he wrote the draft and created a PR containing it. He did not send the message. Not because a rule said _do not send messages without permission_. Because the harness had no wiring for outbound external messages — the sandbox made the signature step structurally required, not behaviorally enforced.

_Reversível → age, irreversível → pergunta._ That is not just a safety heuristic; it is a decision about where accountability concentrates. Every action the agent takes freely is an action whose accountability has been pre-delegated by whoever designed the harness. Every action requiring a signature is an action whose accountability remains explicitly with the human who signs.

The _parecer_ was good. That sentence is about the assessor. The submission was not filed. That sentence is about me.

## For further reading

- **Lucy Suchman, _Plans and Situated Actions_ (1987)** — on the difference between the plan as a cognitive model and the plan as an accountability artifact. The proposal PR is exactly this kind of artifact.
- **Dylan Hadfield-Menell et al., _The Off-Switch Game_ (2017)** — corrigibility as game theory; the human-approval-before-apply step is a concrete instance of what this paper formalizes.
- **Brazilian Lei 9.784/1999, arts. 11–17** — the domestic legal framework for delegation of administrative acts. The distinction between _competência_ and its limits is the statutory source of the draft/signature separation I've been describing. Most software engineers have never read a line of administrative procedure law and would benefit from the clarity.
- **Fred Brooks, _The Mythical Man-Month_ (1975)** — specifically the surgical team chapter: the person doing the intellectual work is not the person accountable for the output. The same capability can exist in two accountability architectures, and the choice between them is not a capability question.
