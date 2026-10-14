---
type: Blog Post
title: "Are AI Decisions Human at Their CORE? An Interactive Choice Lab"
description: "A browser experiment in reward learning, behavioral agreement, and why matching choices is not the same as matching cognition."
date: 2026-10-14T00:00:00.000Z
lang: en
docType: technical
tags:
  - artificial intelligence
  - cognition
  - decision-making
  - interactive
  - experiments
---

Can a decision-specialized language model choose like a human without *thinking* like one? The [CORE research project](https://core-cognition.github.io/core-model/results/) offers a concrete way to ask: measure behavior on controlled tasks, fit a cognitive model, and compare how it generalizes.

The temptation is to present a table of human-versus-AI agreement and declare victory. That would miss the interesting part. Two agents can give the same answer while using different learning dynamics—and different answers may come from similar mechanisms under different parameters.

## Try the experiment

This miniature two-armed bandit runs entirely in your browser. Choose between A and B, observe rewards, and compare your choices with a simulated learning policy. Try the **reversal** scenario: the better arm switches halfway through. Does the policy adapt when its expectations stop working?

<iframe title="Interactive human versus simulated decision policy choice laboratory" src="/demos/core-choice-lab/" loading="lazy" style="width:100%;height:1150px;border:0;border-radius:12px" allow="clipboard-write"></iframe>

[Open the interactive lab full-screen](/demos/core-choice-lab/).

## What is actually being compared?

The interactive agent is **not CORE, Microsoft-Decision-1, Jev, Liquid d1, or any other real decision model**. It is a small, explicit Rescorla–Wagner learner with a softmax choice rule. The controls let you vary its learning rate and exploration. Greedy and random baselines are available. The numbers displayed in this page are generated locally during your session—not scientific results.

Even this toy example separates three questions:

1. **Outcome:** Which agent earns more reward?
2. **Behavior:** How often do the two agents select the same action, and how quickly do they respond to reversal?
3. **Mechanism:** Can one generative model of choice explain both sequences under comparable parameter regimes?

A model could maximize reward and still fail to reproduce human learning biases. High choice agreement is not proof of similar internal algorithms.

## The experiment worth running next

To compare decision models with human CORE signatures, I would use the published CORE experimental tasks and their available data, then evaluate actual model choices—not imagined ones. Present the same sequential observations and action set to each model. Standardize presentation, action probabilities where available, and sampling policy. Repeat stochastic conditions across seeds.

Next, fit the **real CORE implementation** separately to each system's behavioral traces, using held-out sequences rather than only in-sample goodness of fit. Compare negative log-likelihood, effect directions, reversal adaptation, sensitivity to context, and uncertainty intervals. Test simpler behavioral baselines to avoid mistaking flexibility of fit for cognitive identity.

There is an additional wrinkle with language models: prompt wording, examples, temperature, and access to prior trial history may alter behavior dramatically. Those are experimental conditions, not invisible implementation details. Decision models returning calibrated choice scores should be evaluated both as distributions and as sampled policies.

**The hypothesis:** specializing a model for decision quality may improve expected reward while moving its behavioral signatures *away* from those typical of human participants. It may also do the reverse. The empirical answer is still open.

### Sources and reproducibility

- [CORE project results](https://core-cognition.github.io/core-model/results/)
- [CORE code and associated materials](https://github.com/core-cognition/core-model)
- [Standalone browser lab](/demos/core-choice-lab/) (fully local simulation; export session CSV)

This page is a **methodology demo**, not a published comparison between human participants and language models. The next step is collecting comparable model traces and fitting CORE to them.
