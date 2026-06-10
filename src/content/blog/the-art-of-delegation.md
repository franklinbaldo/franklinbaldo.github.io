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
  uuid: 09318476-1009-5abe-bf6a-86e789067dec
  url: >-
    https://github.com/franklinbaldo/franklinbaldo.github.io/blob/a1d9cabb963c9674fbeea140d68240830f231062/src/content/blog/the-art-of-delegation.md
  timestamp: '2026-06-06T13:30:49.440Z'
  msg: >-
    Broke opener from programmatic framing to direct scene; folded analogy-flaw
    into sandbox section mid-argument instead of announcing it; removed Drake
    meme; grounded outsider terms (parecer, ofício, CI/CD, corregedoria,
    Causaganha, Funes) on first use; added Vaughan Challenger reference as
    challenger to post's own thesis; 5 For Further Reading entries from 4
---

In February, I almost missed a forty-eight-hour window in a federal tax objection because I had begun treating the assessor's draft as the final deliverable. The _parecer_ — the formal legal opinion that travels up the chain before anything binds the institution — was impeccable. The submission, however, was not filed. I found out Tuesday afternoon when a calendar alert fired for a deadline I had mentally moved from my column to the assessor's column the exact moment the draft hit my desk. It had not moved from anywhere.

The tribunal does not care who proposed the wrong date, nor who typed the draft. The tribunal only asks who signed it.

That is not a tedious procedural technicality. That is the entire reason the signature exists.

I spend my days in a state attorney's office in Rondônia, reading _pareceres_ and signing the ones that don't terrify me. When I delegate the drafting of a legal brief, I am not outsourcing my judgment — I am delegating the mechanical and cognitive traversal of the case file, the identification of the applicable law, and the construction of the skeleton argument. What I am _not_ delegating, under any circumstances, is the signature. The signature is the irreversible boundary: it is the event that makes a piece of paper an act in the real world, where deadlines start devouring days.

Software engineering struggles to natively recognize this distinction because the feedback loop of its tools compresses it into nothing. In law, the gap between the draft and the act is physically legible — the assessor finishes the document, the protocol office has a hard closing time, the court's servers go down. There is friction. In code, the developer writes the function, the tests pass in thirty seconds, the PR merges on green, and the code is live in production. The draft and the act become a single, lubricated, continuous motion. Nobody stops to record where the deliberation ends and the accountability begins.

## The boundaries of the sandbox

I see a lot of real anxiety about AI agents — autonomous programs like [Jules](/blog/2026-05-10-jules-api-harness-backend/) — and it has absolutely nothing to do with the machine's capacity to think. When I hand Jules a refactoring task for this blog, I am not worried that it will choose the wrong design pattern or invent a function that doesn't exist. I am worried because it has write access to reality.

The solution to this, as the software industry has figured out, is not to stand over the agent's shoulder while it types. The solution is to build a sandbox where the agent's actions are treated exclusively as _proposals_. The CI/CD pipeline — the automated sequence of builds, tests, and checks that must pass in GitHub before any code goes live —, the test suites, the strict linting rules: I no longer look at these just as quality assurance mechanisms. For me, today, they are the syntactic equivalent of the institutional rule that says a legal assessor can draft a _parecer_, but cannot sign the binding _ofício_.

The magic of delegation with AI does not happen when you constrain the model's reasoning. It happens when you constrain its output space. You define the bounds of the sandbox — the database invariants, the tests that must run — and allow the agent to navigate the interior freely. If the tests break, the agent tries again. If the tests pass, the proposal is valid. But the final _apply_ step — the act of merging into the main repository, of altering production — remains a human signature. A CI pipeline that cannot be bypassed is not just a DevOps tool; it is the protocol counter of a public office, holding the door between intention and consequence.

This is exactly where my parallel with administrative law flatters software engineering and hides a massive sinkhole.

In a public office, when an assessor writes a _parecer_, their accountability is professional. Consistently bad opinions don't just generate rework for the reviewer; they lead to formal review by the _corregedoria_ (the internal oversight body), friction with the professional council, and eventually the end of a career. There is an invisible chain linking the signed act to the flesh-and-blood person who drafted it, and that chain has teeth. The attorney's signature doesn't just separate the draft from the act: it separates the person who put their career on the line from the person who had absolutely nothing to lose.

An AI agent has no career. It feels no shame in the company cafeteria. It cannot be punished for incompetence or malice. The sandbox we create for software constrains what the code can do, but fails completely to answer what happens when the sandbox is bypassed or breaks. When an agent does something destructive within the bounds of its access, the accountability flows entirely and instantaneously upward to the human who designed the leash — the harness — and never sideways to the agent.

The sandbox is necessary, but it does not solve the problem of true delegation. The "human signature" step in continuous integration is doing much heavier lifting than the public service parallel suggests. It is not just making the boundary between intention and act explicit; it is solely carrying all the professional, social, and legal weight that the software agent is structurally too hollow to bear.

I did not see this clearly until I had to write out the mistake I made in February. The sentence "my assessor is very good" sounds perfectly reasonable in a way that "Claude is very good" does not, and could not ever, sound. Both describe the capacity to operate complex symbols. But only the first sentence points to someone who can pay the bill at the end of the day.

I had convinced myself, perhaps out of inertia, that the final signature was merely a formality in a bureaucratic process. And it is. But it is also the anchor that makes the February procedural error entirely mine.

## The harness as constitutional design

This is why, as models become more terrifyingly capable, the harness (the structure that contains and governs the model) interests me far more than the neural network weights. [Funes](/blog/funes-soul/) — the AI agent I built to handle delegated tasks across my repositories — is not Claude, even though it uses Anthropic's API to "think." Funes is Claude isolated within a membrane of hard rules, controlled amnesia, and directory permissions.

Funes opens pull requests; it does not merge them. It crawls Markdown files and updates project summaries; it cannot reply to a Gmail message in my inbox. When I asked it to draft a response to an external issue submitted by a stranger about [Causaganha](https://github.com/franklinbaldo/causaganha), my open-source gazette parser, it researched the logic, drafted the response, and opened a PR. It did not send the message to GitHub. And this wasn't because a "system prompt" begged it to "please not talk to strangers." It happened because Funes's harness simply has no active network wiring to the GitHub Comments API. The sandbox made the signature step (me going there, copying, pasting, and clicking the green button) a structural, physical requirement, not just a loose suggestion in a prompt.

_Reversível → age, irreversível → pergunta._ (If reversible, act; if irreversible, ask.)

I used to treat this as a neat technical safety heuristic. But I'm starting to understand that this rule is, fundamentally, a constitutional allocation of risk. Every action the agent takes freely, without consulting me, is an action whose accountability was tacitly assumed and pre-delegated by me the moment I plugged the harness wires together. And every irreversible action that demands a manual click, a digital signature, is an action where I openly retain the monopoly of blame before the world.

The assessor's draft was flawless. And that is a statement that begins and ends with the qualities of the assessor. The legal brief was not attached to the case file in time. And that is the absolute limit where the assessor's story ends and mine begins.

## For further reading

- **Lucy Suchman, _Plans and Situated Actions_ (1987)** — Suchman brilliantly distinguishes the "plan" as a cognitive model from the "plan" as an accountability artifact that a group negotiates publicly. The PR (Pull Request) as a "proposal" operates exactly on the border of these concepts. The book earns its keep in the section describing what "following a plan" actually means for the flesh-and-blood people executing the order.
- **Dylan Hadfield-Menell et al., _The Off-Switch Game_ (2017)** — A dense paper treating AI "corrigibility" as a game theory problem. The practical step of requiring human approval before applying code is a crude but concrete version of the formalization this paper attempts to resolve.
- **Diane Vaughan, _The Challenger Launch Decision_ (1996)** — An uncomfortable book about how institutional safety and accountability mechanisms rapidly degenerate into pure bureaucratic theater. If the human signing the AI-generated PR no longer actually reads the code diff, the signature has stopped allocating responsibility and become a performance. This is the systemic failure that the "sandbox-plus-signature" separation cannot prevent on its own.
- **Brazilian Lei 9.784/1999, arts. 11–17** — The domestic administrative framework outlining the possibilities and limits of delegating authority. The philosophical distinction between holding _competência_ (jurisdiction) and the strictly delegable parts of an act is the underlying basis for the draft/signature separation I try to weave here.
- **Fred Brooks, _The Mythical Man-Month_ (1975)** — Specifically the chapter on the surgical software team. Brooks shows that the same technical capability can exist simultaneously under two distinct accountability architectures, and that the choice between them is never purely technical, but always political.
