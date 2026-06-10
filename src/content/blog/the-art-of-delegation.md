---
author: franklin
date: 2026-06-03T00:00:00.000Z
lang: en
title: >-
  The Anxiety of the Architect: Or, How I Learned to Stop Executing and Love the
  Harness
translationKey: delegating-to-agents
description: >-
  Why delegating to an agent feels like a failure of control, and why that
  failure is the exact price of architecture.
tags:
  - engineering
  - agents
  - architecture
  - harness
  - control
previousVersion:
  uuid: af592b0d-035b-5dbe-8ed5-d540b2fe3fa2
  url: >-
    https://github.com/franklinbaldo/franklinbaldo.github.io/blob/eb1e7676a9c373dbac56efb3d19f4dad7b5af225/src/content/blog/the-art-of-delegation.md
  timestamp: '2026-06-10T17:06:34.537Z'
  msg: Rewrite delegating-to-agents to be more narrative and clear
---

There is a specific kind of anxiety that comes from watching a machine do your job. Not the anxiety of being replaced, but the much sharper anxiety of being misunderstood.

When you write a function, you are the author of the execution. When you write a prompt for an agent, you are the author of an intent, and you are trusting a probabilistic system to handle the execution. For a certain kind of engineer—the kind who has spent a decade learning that explicit control is the only way to prevent catastrophe—this transition feels like falling backward.

## The Illusion of Execution

We have built an entire discipline around the idea that we must dictate the steps.

If you want to parse a JSON file, you don't ask the computer to "understand the file." You write a parser. You specify the loops, the error handling, the exact sequence of memory operations. You own the verb.

But as systems scale in complexity, owning the verb becomes the bottleneck. At some point, the system is too large for you to specify every step. This is the moment you have to start delegating to agents.

[Jules](https://jules.google.com) is currently refactoring an older module in this repository. I didn't tell Jules _how_ to refactor it. I wrote a `SOUL.md` that defines what good code looks like, and I gave it the goal. Jules is choosing the verbs.

It works, but it requires a fundamental shift in posture. You have to stop being the executor and start being the architect.

## The Harness as Architecture

If you are not writing the implementation, what are you writing?

You are writing the environment. You are writing the [harness](/blog/2026-04-29-reclaiming-the-harness/). The harness is the set of constraints, the definitions of failure, the available tools, and the identity of the agent.

When [Funes](/blog/funes-soul/) summarizes a meeting, the quality of the summary doesn't depend on how well I prompted the specific task. It depends on how well I structured Funes's long-term memory, how clearly I defined what Funes _cares about_, and how the feedback loop is designed.

The architecture is no longer about sequence; it is about boundaries. You define the shape of the sandbox, and you let the agent play inside it.

## The Necessary Loss of Control

This is where the anxiety lives.

When you delegate execution, you lose the ability to guarantee _how_ a thing is done. You can only guarantee _what_ is acceptable. This means the agent will sometimes do things you wouldn't have done. It will write a function differently. It will phrase a response awkwardly. It will commit the wrong year.

The instinct is to immediately write a more specific prompt, to add another rule, to try and regain the execution control. But that is the failure mode. If you try to write a prompt that covers every possible execution detail, you aren't delegating. You're just writing code in a very inefficient, non-deterministic programming language.

The art of delegation is learning to tolerate the friction of a different executor. You have to accept that the agent is not you. It is an alien intelligence operating within the constraints you designed. If the result passes the tests—if it meets the architectural requirements—you have to let it merge.

## Epistemic Humility

There is a strange grace in this.

When you are forced to step back from the implementation, you are also forced to be clearer about your intentions. You realize how much of your code was just habit, rather than necessity. You realize how many of your design decisions were implicit, hidden in the execution details rather than articulated in the architecture.

Delegating to an agent is a continuous exercise in epistemic humility. It forces you to admit that you are not the only one who can write the loop. It forces you to define what actually matters.

You are no longer the typist. You are the parent watching the child learn to walk, knowing that they will stumble, and knowing that you must let them.

## For further reading

- **[Reclaiming the Harness](/blog/2026-04-29-reclaiming-the-harness/)** — The foundational text on why the environment is more important than the prompt.
- **[Building Funes](/blog/funes-soul/)** — How identity shapes execution.
- **[The Agent That Doesn't Invent Verbs](/blog/2026-05-14-the-agent-that-doesnt-invent-verbs/)** — A practical look at constraining agent actions without micromanaging them.
