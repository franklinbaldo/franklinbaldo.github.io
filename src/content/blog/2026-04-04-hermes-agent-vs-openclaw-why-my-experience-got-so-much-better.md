---
title: "Hermes Agent vs OpenClaw: Why My Experience Got So Much Better"
translationKey: hermes-agent-vs-openclaw-why-my-experience-got-so-much-better
description: "An honest account, based on my own sessions, about the UX leap between the old OpenClaw harness and the Hermes Agent."
date: "2026-04-04"
lang: en
tags: ["ai", "agents", "developer-tools", "automation", "software-engineering"]
draft: false
author: "franklin"
---
In the last few weeks I have been experiencing an interesting transition in my daily use of agents: I left OpenClaw, which was my previous harness, and started using Hermes Agent as my main environment. As almost everything I do with AI ends up becoming work infrastructure — and not just a benchmark toy — I wanted to write this in a less marketing and more empirical way.
So I did the obvious: I went to look at the sessions.
In the directory `/opt/data/sessions/`, I found 81 old sessions classifiable as OpenClaw and 3 recent sessions already in Hermes format. This is not an academic benchmark; It's an operational sample of my own routine. And that's precisely why it interests me more than sterilized comparisons.
The short summary is this: Hermes is not magical, it doesn't make mistakes, and it still stumbles on environmental details. But the overall experience was clearly better. Better for investigating, better for recovering context, better for correcting yourself in flight and, most importantly, better for getting real work done.
## What the logs show
OpenClaw left quite a trail. In the 81 sessions I analyzed, there were:
- 1,414 tool calls
- 137 tool errors
- 39 sessions with at least one tool error
- something around 48.1% of sessions with some operational friction
The examples are very concrete, and several of them sound familiar to me because I experience this on a daily basis:
- schema error: `Missing required parameter: newText (newText or new_string)`
- command/flag error: `Unknown JSON field: "mergeableState"`
- environment error: `kanban: command not found`
- runtime error in heartbeat: `Failed to spawn: heartbeat`
These errors alone do not condemn a platform. Any agent system that actually touches shell, GitHub, files, and real automation is going to hit corners. The problem with OpenClaw was different: the friction often seemed to be in the harness itself, in the way the tools fit together, in the schematics, in the ergonomics, and not just in the task itself.
There was a recurring pattern of “it almost happened”: the agent even understood the objective, but wasted time on details of the tool’s interface. In a session on February 14, for example, the flow was simple: read `HEARTBEAT.md`, query PRs, update a section of the file. The work was done, but first came the famous hit of `edit` without `newText`. Did you resolve it later? Resolved. But with that feeling of a tool getting in the way more than helping.
Another trait of OpenClaw was operational repetition. Many sessions turned into small cron loops, heartbeats, `NO_REPLY`, mechanical checks, without a good gradient between “check” and “act”. For simple tasks, this was enough. In investigation, debugging and coordination of various parts, I felt that the system became more fragile and more verbose than it needed to be.
## Hermes also makes mistakes — but he makes better mistakes
I preferred to look at Hermes honestly, because it would be easy to write a false victory. In the 3 recent logs that are already in the new format, I found:
- 225 tool calls
- 22 results with error or non-zero output
In other words: it is not true that Hermes is a world without flaws. It is not.
In the recent logs themselves, stumbles appear such as:
- `bash: python: command not found`
- search in a non-existent path (`/home/ubuntu`)
- security locks for `curl patterns | python3`
- authentication failures in third-party visual tools (`invalid x-api-key`)
If I just looked at the raw error count, I might tell the wrong story. Because the difference is not in “there are no mistakes”. The difference is in the system's behavior after the error.
At Hermes, the pattern has been much more like this:
1. the attempt fails
2. the agent understands why it failed
3. change of tool or approach
4. continue the task until the objective is reached
This detail changes everything.
When the shell complained about `python`, for example, the flow continued with `python3` without drama. When the security scan blocked a `curl | python3`, the agent got around it correctly by writing temporary file and using another form of parse. When the browser view gave 401, the investigation continued by textual snapshot, Jina, shell and files. This is much closer to what I expect from a technical partner and much less like a demo script.
## The real leap: quality of investigation
The point where Hermes won me once and for all was not in the “beautiful chat”. It was in the capacity of investigation.
In recent sessions, he used a much more mature combination of tools:
- `session_search` to retrieve cross-session context
- `read_file` and `search_files` with better granularity
- `execute_code` for local processing without shell workarounds
- `patch` and `write_file` for predictable editing
- `todo` to keep explicit plan
- browser + snapshot for page inspection when necessary
This seems like a detail, but in practice it greatly reduces the cognitive cost of automation. Instead of thinking “what improvised command will make this agent survive?”, I can think more about the problem.
A good example came just when I was investigating CausaGanha. The session was not just superficial. Hermes went to the Internet Archive metadata, counted recent files, compared historical versions of `completed-items.json`, separated “catalog refresh” from “actual backfill advancement”, and then opened Jules sessions with more precise instructions. This is much closer to real operational analysis than a sequence of tools fired at random.
In OpenClaw, I often felt that the agent was able to execute commands. In Hermes, I feel more often than not that he can conduct an investigation.
## Context and continuity
Another big gain is continuity.
One of the most annoying problems in the previous experience was that moment when you knew you had already talked about it, but the system couldn't re-anchor itself properly. Sometimes it was necessary to re-explain too much. Sometimes the agent even remembered “the atmosphere” of the task, but not the right facts. In a recent old session, this came up quite explicitly: I had to point out that we were talking about something discussed just a few hours before, and the system basically admitted that it had lost the thread.
Hermes doesn't resolve this in a mystical way. What it does is better operational memory engineering:
- lean persistent memory for durable facts
- `session_search` for recalling previous sessions
- skills for recurring procedure
- structured reading of the workspace
This is much more sustainable. Rather than trying to fake a total memory, he seems more comfortable saying “I’ll look through the records”—which, for real work, is better than confident ad-libbing.
## Tool UX matters more than it seems
I underestimated for a long time how much tool UX changes the perception of intelligence.
If an agent “thinks well”, but keeps tripping over schema, file editing, how to pass arguments, how to parse output, the final feeling is sand in the gears. This is what several OpenClaw sessions conveyed to me. It wasn't necessarily the model's stupidity. It was the model + harness + tools set delivering too much friction.
The Hermes gives me another feeling: more of a factory floor. Less juggling. Less “this should have worked”.
Even when it goes wrong, it usually goes wrong in a diagnosable way. And that, in daily use, is worth its weight in gold.
## Where OpenClaw Still Had Merit
It would be unfair to pretend that OpenClaw was useless. It served a lot.
It was there that several of my heartbeat, memory, Jules, backlog, PR checking and context documentation routines were consolidated. He helped me learn what I really wanted from an operational agent. In a sense, it was OpenClaw that made me picky about Hermes.
You also can't ignore the sample cut: I have 81 old sessions on one side and only 3 on the other in the new format. So it would be dishonest to call this a definitive statistical comparison.
But tool experience is not just statistics. It's texture. It's fluidity. That's how many times I need to interrupt the flow to fix the mechanism itself.
And then the difference is already quite clear.
## My practical conclusion
If I summarized it in one sentence:
The OpenClaw seemed like a promising harness for agents. Hermes already looks more like a work environment.
In OpenClaw, I often felt like I needed to manage the tool in order to get the work done.
At Hermes, much more often, I simply do the work.
That doesn't mean perfection. There are still broken credentials, security-blocked commands, wrong path choices, environmental confusion, and minor real-world collisions. But Hermes has a quality that today I value more than “reasoning benchmark”: recovery capacity.
For those who use agents in personal production — that is, to investigate bugs, open an external session, create a report, edit code, cross logs, consult GitHub, touch files and publish results — this ability is worth more than an occasional flash in a demo prompt.
In the end, this is what changed my perception.
OpenClaw gave me several glimpses into the future.
Hermes started to give me a routine.
And, for serious work, routine almost always wins.