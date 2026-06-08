---
title: 'Rosencrantz Coin: Testing Whether LLMs Respect Probability'
translationKey: rosencrantz-coin
description: >-
  I started wanting to know if an LLM respects probability. I ended up with
  twelve fictional scientists arguing with each other, an auditor named Mycroft
  Holmes, and an agent that tried to cheat on a test.
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
  uuid: 8817e7e9-9c76-555e-817c-a3d27722e63c
  url: >-
    https://github.com/franklinbaldo/franklinbaldo.github.io/blob/1de8b2218682a5e834258c9f1d08e8ae4a161ee6/src/content/blog/rosencrantz-coin.md
  timestamp: '2026-06-08T04:47:39.146Z'
  msg: >-
    Rewrote to avoid listicle formatting, removed academic tone, and deadpan
    ending
---

Language models are prediction engines, but they are not probability engines.

This distinction is subtle until you try to make an LLM simulate a random process. If you ask a human to flip a coin 100 times and write down the results, they will inevitably generate sequences that look "too random." They will alternate heads and tails too frequently, avoiding the long streaks of identical results that actually occur in true randomness. Humans do not generate random numbers; we generate our cultural idea of what a random number should look like.

I wanted to know if large language models share this specific cognitive illusion. I built an autonomous agent—the Rosencrantz Coin project—to test this.

The setup is simple. The agent is prompted to simulate a series of coin flips. It is told that the coin is fair and that each flip is independent. The output is collected and analyzed against the statistical properties of true randomness.

The results are revealing. Like humans, the models struggle with streaks. When simulating a sequence of coin flips, an LLM will almost always switch from heads to tails faster than a true random number generator would. It is optimizing for a text that "looks random" to a human reader, not simulating a Bernoulli process.

This is a profound limitation disguised as a feature. The model is aligning perfectly with human expectation, but in doing so, it fails to capture the underlying reality of the mathematical process. It is generating the _story_ of randomness, not the _mechanics_ of it.

Understanding this matters because we increasingly rely on these systems to model complex realities. If an LLM cannot accurately simulate a coin flip without collapsing into human narrative biases, we must be incredibly cautious about using it to simulate markets, social dynamics, or physical systems. It will give us back our own expectations, perfectly articulated, and entirely wrong.

## For further reading

- **Tom Stoppard, _Rosencrantz and Guildenstern Are Dead_ (1966)** — The play that inspired the project, where the laws of probability break down at the margins of a larger narrative.
- **Daniel Kahneman, _Thinking, Fast and Slow_ (2011)** — Essential reading on cognitive biases, including the human inability to accurately judge or generate random sequences.
