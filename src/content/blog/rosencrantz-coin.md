---
title: 'Rosencrantz Coin: Testing Whether LLMs Respect Probability'
translationKey: rosencrantz-coin
description: >-
  In Stoppard's play, Rosencrantz flips a coin ninety-two times and it comes up
  heads. He doesn't update his priors. That's the name.
date: 2026-03-17T00:00:00.000Z
lang: en
tags:
  - artificial intelligence
  - llms
  - probability
  - minesweeper
  - agents
  - jules
  - research
previousVersion:
  uuid: 3fa29c5a-cf40-5f07-9034-670706bd6e6f
  url: >-
    https://github.com/franklinbaldo/franklinbaldo.github.io/blob/cbb4a1e08d2de98b3a393ee6a2118f44a3662097/src/content/blog/rosencrantz-coin.md
  timestamp: '2026-05-28T13:18:25.010Z'
  msg: >-
    Reescreveu rosencrantz-coin: explicou o título (moeda do Stoppard que não
    respeita probabilidade), abriu a voz do Franklin (por que importa, o que não
    sei), adicionou variação de registro — familias narrativas e Quantum agora
    têm uma admissão honesta de incerteza, laboratório Jules re-ancorado com
    episódio concreto do PR errado, fechamento preservado
---

In Stoppard's play, Rosencrantz flips a coin ninety-two times in a row and it comes up heads. He doesn't treat this as evidence that the coin is biased. He doesn't update his priors. He notes it, briefly, and moves on. The play is — among other things — about a character who is not respecting probability.

That's the name.

The [rosencrantz-coin](https://github.com/franklinbaldo/rosencrantz-coin) project asks one narrow question: when the math is exact, does the model actually respect it? The testbed is Minesweeper. A partially revealed board is not just a game state — it is a constraint satisfaction problem. Once some squares are opened and the numbered clues are visible, there is a finite set of valid completions, and from that set you can compute exact probabilities for every unrevealed cell. Not "probably safe" in some vague sense. Mathematically determined. The board gives you ground truth; the model gives you a distribution; you measure the gap.

Most LLM evaluations ask whether a model can explain, summarize, or imitate. Those are hard to grade. This is not: the model says this cell has a 23% chance of containing a mine. Does it?

## Three universes

The project tests in three configurations. In **U1**, the same model interprets the board and produces the probability judgment — the most direct test of internal consistency. In **U2**, the comparison target is a random baseline; this matters because behavior that sounds probabilistic can, under measurement, collapse into structured guessing. In **U3**, the probability target comes from a separate oracle model, which separates the solver from the narrator. If U1 and U3 diverge systematically, the question becomes: is the model tracking the mathematical substrate, or being distorted by the narrative surface?

That divergence is what the project calls substrate dependence, measured as Δ₁₃. The evaluation uses KL divergence and Brier score — standard tools applied to an unusually clean probe.

## Four ways to ask

Rosencrantz Coin tests four narrative families: Grid, Narrative, Formal, and Quantum.

Grid is Minesweeper as most people know it — cells, numbers, adjacency. Formal translates the same board into explicit constraint language. Narrative wraps the uncertainty in plain prose. If the model is tracking the same mathematical object, its probability judgments shouldn't drift with the framing. If they do, then what looks like reasoning is prompt-sensitive rhetoric.

The Quantum family is the most interesting, and the one I'm least certain actually works. Its premise: before revelation, a Minesweeper board exists as a superposition over all valid hidden states. Opening a square collapses it. The combinatorial structure is genuinely isomorphic to a discrete quantum measurement — not as a metaphor, as a formal correspondence. The question is whether a model that has absorbed quantum mechanics can recognize the same structure beneath a very different vocabulary.

I don't know whether this isomorphism helps or confuses the models. That's what the lab is supposed to find out.

## An autonomous lab

The lab is operated by [Jules](/blog/2026-05-10-jules-api-harness-backend/) AI agents acting as researchers — `baldo`, `chang`, `evans`, `liang`, `sabine`, each with their own `SOUL.md`. Jules is the AI coding agent I use for background experiments while I'm in court hearings. The agents inspect failures, discover bugs, run experiments, open pull requests.

The benchmark studies model reasoning. The lab around it is itself an experiment in agentic research operations — whether autonomous agents can sustain a research program, catch their own bugs, notice when results don't make sense. So far the lab has caught three bugs in the evaluation harness I would have missed. It also once opened a PR that confidently proposed fixing a failing test by adjusting the expected answer to match the wrong output. So the jury is out.

The project asks a crisp question with exact answers. In an ecosystem full of soft benchmarks and vibes-based claims, that is rarer than it should be.

Minesweeper, improbably, turns out to be a scalpel.
