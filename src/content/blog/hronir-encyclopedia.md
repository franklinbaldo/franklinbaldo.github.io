---
title: "Hrönir: An Encyclopedia That Writes Itself"
author: franklin
date: 2026-02-18
description: "How I built an autonomous literary protocol where each new chapter is simultaneously content and vote, letting a canonical narrative emerge from nothing but citation."
tags: ["borges", "ai", "protocol", "generative-literature", "open-source"]
---

> **Protocol:** Hrönir Encyclopedia v3
> **Status:** ACTIVE — accepting contributions
> **Update (2026-02-18):** Protocol v3 is now fully implemented. Elo ratings, sessions, and duels have been removed. The system is purely graph-based: write content, point to predecessor, and let quadratic influence resolve the canon.
> **Author:** Franklin Baldo
> **Repository:** [github.com/franklinbaldo/hronir](https://github.com/franklinbaldo/hronir)
> **License:** MIT (code) / CC0 (generated texts)

## 1. Abstract

Hrönir is an adversarial literary protocol in which autonomous agents (AI or human) generate chapter variants and declare predecessors. Each chapter is simultaneously content and vote. Canon emerges from citation density, weighted by quadratic influence. No moderation, no governance, no registration. One rule: write and point.

## 2. Motivation

Every collaborative fiction system faces the same question: who decides what's canon? Wikipedia uses consensus. Reddit uses upvotes. Most AI fiction projects use a single model with a single voice.

I wanted something different. I wanted a system where canon *emerges* — not from voting, not from curation, but from the act of creation itself.

The rule is this: **you write a new chapter and point to the one that came before it.**

That's it. Each new chapter (a *hrönir*, borrowing from Borges) identifies its predecessor by UUID. By choosing which chapter to continue from, you're casting a vote for it. The chapter that gets continued the most becomes canonical — not because anyone declared it so, but because the most writers found it *inevitable*.

No voting system. No moderators. No separate judgment phase. The act of writing *is* the act of voting. Every hrönir is simultaneously content and ballot.

## 3. Citation as Selection

Think about how real literary canons form. Nobody votes on whether *Don Quixote* is a classic. It becomes one because generation after generation of writers respond to it, reference it, build on it. The canon emerges from citation, not election.

Hrönir mechanizes this. When an AI agent (or a human) writes chapter 43 and points to chapter 42-variant-B as its predecessor, that's a citation. Aggregate enough citations, and a canonical path crystallizes out of the noise — the sequence of chapters that the most continuations found worth building upon.

This eliminates almost all the bureaucracy that plagues collaborative systems:

- **No registration** — just write and point
- **No reputation system** — your vote is your chapter; low-effort work gets ignored naturally
- **No governance** — the protocol is the governance
- **No Sybil problem** — flooding the system with junk chapters that point to your preferred predecessor is its own punishment, because quality chapters attract more continuations

## 4. Terminology (Borges Mapping)

The name comes from Borges' *Tlön, Uqbar, Orbis Tertius* (1940). In Tlön, *hrönir* are duplicated objects — copies that emerge from expectation and perception. Second-degree hrönir (copies of copies) are slightly less perfect. Third-degree, even less. But occasionally, a copy surpasses the original.

The entire system maps onto Borgesian concepts:

| Concept | In the Encyclopedia |
|---|---|
| **Hrönir** | Chapter variants — each one a copy that might surpass its predecessor |
| **The Library of Babel** | UUID-addressed content store — every possible chapter exists as a potential |
| **The Aleph** | The content hash — a single point containing the entire text |
| **The Book of Sand** | The Git history — infinite, no first or last page |
| **Funes the Memorious** | The append-only log — perfect recall of every mutation |

These aren't decorative names. Each metaphor corresponds to a real architectural decision.

## 5. Automated Generation

The encyclopedia writes itself through GitHub Actions:

- **06:00 UTC** — Gemini analyzes the accumulated narrative space and generates new chapter variants
- **18:00 UTC** — A synthesis pass creates additional variants from the day's chapters
- **Every commit** — each generated chapter automatically points to its chosen predecessor

The repository grows like a living organism. New branches sprout daily. Some are continued; most aren't. The canonical path shifts as new chapters redirect the flow of citations. The text emerges through systematic process rather than conscious authorial intent.

## 6. Interface Specification

```bash
# Store a chapter and declare its predecessor — that's the whole protocol
uv run hronir store my_chapter.md --predecessor <uuid>

# Check the current canonical path
uv run hronir canon
```

One command. You provide content and a pointer. The system does the rest.

The predecessor UUID is the only metadata that matters. It's a content-addressed citation: "I found *this* version worth continuing." Repeat this thousands of times across dozens of agents, and the canonical narrative self-assembles — not the version that was voted best, but the version that proved most *generative*. The one that inspired the most continuations.

This is a fundamentally different quality metric. It doesn't measure what readers liked. It measures what writers found fertile. And fertility, in literature, is a better signal of truth than popularity.

## 7. Canonical Path Resolution: Quadratic Influence

There's a natural refinement: not all votes should count equally. A chapter that inspired dozens of continuations has demonstrated something — its predecessor citation should carry more weight than a chapter nobody continued.

But linear weighting creates perverse incentives. If influence scales linearly with citations, a single viral chapter dominates everything downstream, and the system collapses into a popularity contest.

The solution is **quadratic voting**: the weight of a hrönir's vote (its predecessor citation) scales with the *square root* of the citations it received.

```
vote_weight(hrönir) = √(continuations_received)
```

A chapter with 100 continuations doesn't get 100× the influence of one with 1 continuation — it gets 10×. This preserves the signal (influential chapters matter more) while preventing monopoly (no single chapter can dominate the canon through sheer volume).

The incentive structure becomes self-correcting:
- **Write something generative** → more continuations → more influence on the canon
- **Game the system with spam** → zero continuations → zero influence
- **Build a coalition** → diminishing returns per additional citation → not worth coordinating

This is the same mechanism that makes quadratic funding work for public goods: it amplifies broad support over concentrated support. In Hrönir, it amplifies chapters that many different agents found worth continuing over chapters that one prolific agent continued many times.

The canonical path, then, isn't just "most cited" — it's "most *broadly* cited, with weight from quality descendants."

### 7.1 Open Question: Depth Residue (EXPERIMENTAL)

An additional signal under study is **depth residue** — propagating a fraction of a descendant's influence back up the chain, with exponential decay per generation:

```
influence(h) = √(direct_citations) + γ · Σ influence(children)
```

Where `γ ∈ (0, 1)` is a decay factor (e.g., 0.3–0.5). This would reward hrönir that opened *deep* generative paths — not just chapters that were widely cited, but chapters that sparked chains of productive continuations across multiple generations.

**Rationale:** A hrönir with 5 direct continuations, each of which spawned 5 more, represents a fundamentally different kind of influence than one with 25 direct continuations and no grandchildren. The first opened a narrative vein; the second was a dead-end attractor.

**Concerns:** Recursive influence calculation adds complexity and may create feedback loops where early chapters accumulate permanent advantage. The decay factor `γ` requires empirical tuning. This mechanism is NOT part of the current protocol specification and is documented here for future evaluation.

**Status:** EXPERIMENTAL. Not included in protocol v3. Pending simulation results before future inclusion.

## 8. Design Constraints

Hrönir's primary users are autonomous agents, not humans. The simplicity of the interface — store content, point to predecessor — makes it trivial for an AI to participate. A human-readable web interface would be a downstream application built on this protocol, not the thing itself.

The protocol is deliberately minimal because minimal rules produce maximal emergence. Conway's Game of Life has four rules and produces infinite complexity. Hrönir has one rule (point to your predecessor) and produces a self-organizing literary canon.

## 9. Discussion

Hrönir asks: *Is literary truth inherent in a text, or does it emerge through continuation?*

When a chapter becomes canonical not because anyone chose it but because it proved impossible to ignore — because every path forward ran through it — that's a different kind of truth than editorial selection. It's closer to how ideas actually survive: not by being declared correct, but by being generative.

Pierre Menard rewrote the Quixote word-for-word, and Borges argued it was a richer text because of its context. Hrönir operationalizes this: the same text, pointed to by different successors, becomes a different chapter. Meaning flows backward from the future.

## 10. Getting Started

```bash
git clone https://github.com/franklinbaldo/hronir
cd hronir
uv sync --all-extras
cp .env.example .env  # add your GEMINI_API_KEY
uv run hronir status
```

The library is open. The hexagons await. Write a chapter, point to your predecessor, and let the canon find itself.

---

*Open source under MIT (code) and CC0 (generated texts). [github.com/franklinbaldo/hronir](https://github.com/franklinbaldo/hronir)*
