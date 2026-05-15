---
title: "Hermes Agent vs OpenClaw: Why My Experience Got Much Better"
description: "An honest account, based on my own sessions, of the UX leap from the old OpenClaw harness to Hermes Agent."
date: "2026-04-04"
lang: en
tags: ["ai", "agents", "developer-tools", "automation", "software-engineering"]
translationKey: hermes-vs-openclaw
draft: false
author: "franklin"
---

Over the past few weeks I've been living through an interesting transition in my daily use of agents: I moved from OpenClaw, my previous harness, to Hermes Agent as my main environment. Since almost everything I do with AI ends up becoming work infrastructure — not just a benchmark toy — I wanted to write about it in a less promotional, more empirical way.
So I did the obvious thing: I went to look at the sessions.
In the `/opt/data/sessions/` directory, I found 81 old sessions classifiable as OpenClaw and 3 recent ones already in the Hermes format. This isn't an academic benchmark; it's an operational sample from my own routine. And precisely because of that, it interests me more than sterile comparisons.
The short summary is this: Hermes isn't magic, doesn't zero out errors, and still stumbles on environment details. But the overall experience got clearly better. Better for investigation, better for recovering context, better for course-correcting mid-flight, and most importantly, better for actually finishing real work.

## What the logs show

OpenClaw left plenty of traces. Across the 81 sessions I analyzed, there were:
- 1,414 tool calls
- 137 tool errors
- 39 sessions with at least one tool error
- roughly 48.1% of sessions with some operational friction

The examples are concrete, and many of them ring familiar because I lived them day to day:
- schema error: `Missing required parameter: newText (newText or new_string)`
- command/flag error: `Unknown JSON field: "mergeableState"`
- environment error: `kanban: command not found`
- heartbeat spawn error: `Failed to spawn: heartbeat`

These errors don't condemn a platform on their own. Any agent system that actually touches the shell, GitHub, files, and real automation will bump into edges. The OpenClaw problem was different: often the friction seemed to be in the harness itself — in how tools fit together, in the schemas, in the ergonomics — not just in the task.

There was a recurring pattern of "almost worked": the agent understood the goal, but lost time on tool interface details. In a session from February 14th, for example, the flow was simple: read `HEARTBEAT.md`, check PRs, update a section of the file. The work got done, but not before the notorious `edit`-without-`newText` crash. Did it resolve? It did. But with that feeling of a tool fighting you more than helping.

Another OpenClaw trait was operational repetition. Many sessions turned into small cron loops, heartbeats, `NO_REPLY`, mechanical checks, without a good gradient between "verify" and "act". For simple tasks that was enough. For investigation, debugging, and coordinating several moving parts, I felt the system became more fragile and verbose than it needed to be.

## Hermes makes mistakes too — but fails better

I preferred to look at Hermes honestly, because it would have been easy to write a false victory. In the 3 recent logs already in the new format, I found:
- 225 tool calls
- 22 results with error or non-zero exit

So: it's not true that Hermes is an error-free world. It isn't.

The recent logs themselves show stumbles like:
- `bash: python: command not found`
- searching a non-existent path (`/home/ubuntu`)
- security blocks for patterns like `curl | python3`
- authentication failures in third-party visual tools (`invalid x-api-key`)

If I looked only at raw error counts, I could tell the wrong story. Because the difference isn't "no errors". The difference is in the system's behavior *after* the error.

In Hermes, the pattern has consistently been:
1. the attempt fails
2. the agent understands why it failed
3. switches tool or approach
4. continues the task until the objective is closed

That detail changes everything.

When the shell complained about `python`, for example, the flow continued with `python3` without drama. When the security scan blocked a `curl | python3`, the agent correctly worked around it by writing a temp file and using a different parse method. When the browser view gave a 401, the investigation continued via text snapshot, Jina, shell, and files. That's much closer to what I expect from a technical partner and much less like a demo script.

## The real leap: investigation quality

The point where Hermes won me over wasn't the "nice chat". It was the quality of investigation.

In recent sessions, it used a much more mature combination of tools:
- `session_search` to recover context across sessions
- `read_file` and `search_files` with finer granularity
- `execute_code` for local processing without shell hacks
- `patch` and `write_file` for predictable edits
- `todo` to maintain an explicit plan
- browser + snapshot for page inspection when necessary

That may sound like a detail, but in practice it drastically reduces the cognitive cost of automation. Instead of wondering "what improvised command will keep this agent alive?", I can think more about the problem.

A good example came when I was investigating CausaGanha. The session didn't stay at the surface. Hermes went all the way to Internet Archive metadata, counted recent files, compared historical versions of `completed-items.json`, separated "catalog refresh" from "real backfill progress", and then opened Jules sessions with more precise instructions. That's much closer to real operational analysis than a random sequence of tool calls.

With OpenClaw, I often felt that the agent could *execute commands*. With Hermes, I more often feel that it can *conduct an investigation*.

## Context and continuity

Another big gain is continuity.

One of the most frustrating problems with the previous experience was that moment when you knew you'd already talked about something, but the system couldn't re-anchor itself properly. Sometimes you had to over-explain. Sometimes the agent even remembered the "mood" of the task, but not the right facts. In an old session, this appeared quite explicitly: I had to point out that we were talking about something discussed just a few hours earlier, and the system basically admitted it had lost the thread.

Hermes doesn't solve this mystically. What it does is better operational memory engineering:
- lean persistent memory for durable facts
- `session_search` for recall of previous sessions
- skills for recurring procedures
- structured reading of the workspace

This is much more sustainable. Instead of trying to fake total memory, it seems more comfortable saying "let me check the records" — which, for real work, is better than a confident improvisation.

## Tool UX matters more than it seems

I underestimated for a long time how much tool UX changes the perception of intelligence.

If an agent "thinks well" but constantly stumbles on schema, on file editing, on how to pass an argument, on parsing output, the final feeling is sand in the gears. That's what several OpenClaw sessions transmitted to me. It wasn't necessarily model stupidity. It was the model + harness + tools combination delivering too much friction.

Hermes gives me a different feeling: more factory floor. Less juggling. Less "this should have worked".

Even when things go wrong, they normally go wrong in a diagnosable way. And that, in daily use, is worth gold.

## Where OpenClaw still had merit

It would be unfair to pretend OpenClaw served no purpose. It served plenty.

It was in OpenClaw that I consolidated many of my routines for heartbeat, memory, Jules, backlog, PR checking, and context documentation. It helped me learn what I actually wanted from an operational agent. In a sense, it was OpenClaw that made me demanding with Hermes.

It's also impossible to ignore the sample bias: I have 81 old sessions on one side and only 3 in the new format on the other. So it would be dishonest to call this a definitive statistical comparison.

But tool experience isn't only statistics. It's texture. It's fluidity. It's how often I have to interrupt the flow to fix the mechanism itself.

And on that front, the difference is already quite clear.

## My practical conclusion

If I summed it up in one sentence:

OpenClaw felt like a promising harness for agents. Hermes already feels more like a work environment.

With OpenClaw, I often felt I needed to manage the tool in order to do the work.
With Hermes, much more often, I simply do the work.

That doesn't mean perfection. There are still broken credentials, security-blocked commands, wrong path choices, environment confusion, and small real-world collisions. But Hermes has a quality I value now more than "reasoning benchmark": recovery capacity.

For anyone using agents in personal production — that is, to investigate bugs, open external sessions, compile reports, edit code, cross-reference logs, query GitHub, handle files, and publish results — that capacity is worth more than an occasional flash of brilliance on a demo prompt.

In the end, that's what changed my perception.

OpenClaw gave me several glimpses of the future.
Hermes has started to give me routine.

And for serious work, routine beats glimpse almost every time.
