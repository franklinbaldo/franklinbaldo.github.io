---
title: 'The Art of Delegation: Signatures and Sandboxes'
description: >-
  The anxiety about autonomous agents isn't about what they know. It's about the
  fact that, in code, the distance between writing and signing has disappeared.
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
  timestamp: '2026-06-08T10:41:16.435Z'
  msg: >-
    Revised worst post based on evaluation feedback to give it real stakes and a
    stronger argument about accountability
---

In February, a deadline to object to a federal infraction almost closed without a filing because I made the most basic mistake in bureaucracy: I confused who writes with who signs.

The draft was in my inbox, flawless. The deadline was Tuesday. Mentally, I had already dispatched the problem. But the Federal Justice doesn't read drafts. The Federal Justice only reads what has a digital certificate attached to it.

I spend my days reading _pareceres_ (formal legal opinions) in Rondônia. The silent agreement between the attorney and the assessor is that the assessor builds the machine — cross-references jurisprudence, stacks the facts, proposes the conclusion — and the attorney turns the key. The signature isn't a quality control stamp; it's the irreversible act that transforms speculative text into state force.

The anxiety surrounding agents like Jules or Devin doesn't come from the fact that they hallucinate libraries. It comes from the fact that the environment in which they operate — the Git repository, the CI/CD pipeline — was built by a culture that erased the distinction between drafting the opinion and signing the dispatch. In software, if the tests pass, the PR merges. The draft _is_ the act.

When you put an autonomous agent in that pipe, you aren't just automating writing. You are automating signing. That is what is terrifying.

To solve this, the default engineering intuition is to build a sandbox.

The sandbox restricts what the machine can see and where it can touch. You create paranoid linting rules, unforgiving tests, and deployment policies that tie the agent's hands. The idea is that, if the box is tight enough, the agent cannot cause irreparable harm. If the tests pass, the agent proposes; the human approves.

This sounds like a dispatch waiting for the attorney's signature, but it's a false mirror.

The magic of delegation happens when you constrain the output space, not the process. You define the bounds of the sandbox — the schema, the invariants, the tests — and allow the agent to navigate the interior freely. If the tests pass, the proposal is valid. But the _apply_ step — the actual merging of the PR, the deployment to production — that remains a human signature. A CI pipeline that cannot be bypassed is a protocol office: a mandatory processing step between the draft and the act.

In a real administrative structure, the assessor has a career to lose. Drafts that ignore the law lead to internal oversight. There is a structural tension that holds the system up: the person who does not sign the act still answers for the quality of the draft. The chain of accountability has teeth.

An LLM has no career to lose. The "harness" of rules you put around it (the tests, the negative prompts, the sandbox) doesn't create an institutional position; it just creates a harder maze to solve. When the maze fails, and the agent produces a hallucination that passes the unit tests and the human approves without reading the diff carefully, accountability flows entirely upward to the human who designed the sandbox.

There is no lateral accountability. The step of "approving a Pull Request" done by a human in relation to a software agent carries a weight that Administrative Law does not ask the attorney to carry: that of assuming not just the final decision, but the moral authorship of the proposal itself.

<figure class="meme">
  <img
    src="https://api.memegen.link/images/custom/the_assessor_is_good/Jules_is_good.jpg?background=https://i.imgflip.com/4/8q5y4u.jpg&width=500"
    alt="Meme showing two different levels of realization. 'The assessor is good' (calm). 'Jules is good' (panicked)."
    loading="lazy"
  />
  <figcaption>Both sentences describe capacity. Only one describes someone who can be fired.</figcaption>
</figure>

This is the boundary the bureaucratic analogy tries to hide. I thought the signature was just what separated proposal from action. It is. But in the world of synthetic agents, the signature is also what hides the fact that there is no one on the other side of the table.

When [Funes](/blog/funes-soul/) writes the draft of an issue and waits for me to publish it, the rule preventing him from posting alone isn't behavioral — the harness simply doesn't have wires connected to the GitHub posting API. The severed wire forces the signature.

_Reversível → age, irreversível → pergunta._ (Reversible → act, irreversible → ask.)

But even if he asked, if he generated something catastrophic that I didn't read properly and signed, internal oversight wouldn't go after the Python script. They would come after me. The mistake in February proved that to me. Bureaucracy is built on meat, not tokens.

The sandbox works to limit the damage the machine can cause. But it is the signature that reveals who will pay for it.

## For further reading

- **Lucy Suchman, _Plans and Situated Actions_ (1987)** — distinguishes the plan as a cognitive model from the plan as an accountability artifact. The PR-as-proposal sits exactly on this line, and the book earns its keep in the section on what "following a plan" actually means to the people following one.
- **Dylan Hadfield-Menell et al., _The Off-Switch Game_ (2017)** — corrigibility as game theory. The human-approval-before-apply step is one concrete instance; the paper frames the general case.
- **Diane Vaughan, _The Challenger Launch Decision_ (1996)** — on how accountability mechanisms ritualize into theater. If the human who signs the PR isn't actually reading the diff, the signature is bureaucracy, not accountability. This is what the sandbox-plus-signature design does not protect against on its own.
- **Brazilian Lei 9.784/1999, arts. 11–17** — the domestic legal framework for delegation of administrative acts. The distinction between _competência_ and its delegable limits is the statutory source of the draft/signature separation I've been describing.
- **Fred Brooks, _The Mythical Man-Month_ (1975)** — the surgical team chapter: the same capability can exist in two accountability architectures, and the choice between them is not a capability question.
