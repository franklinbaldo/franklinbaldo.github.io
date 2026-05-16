---
title: "The Jules API as a Harness Backend"
author: franklin
date: 2026-05-10
lang: en
description: "Exploring the integration of the Jules API into the canivete daemon. How sessions and activities map to a continuous identity, and the metaphysical implications of agent orchestration."
tags: ["artificial intelligence", "software engineering", "agents", "jules", "canivete", "harness"]
heroImage: ./images/pontifex-architecture-implementation-guide-cover.png
heroImageAlt: "Abstract representation of agent architecture and data flows."
series: harness
seriesOrder: 4
translationKey: jules-api-harness
---

## The [Harness](/blog/2026-04-29-reclaiming-the-harness/) Evolves
A few weeks ago, I wrote about [reclaiming the word "harness"](/blog/2026-04-29-reclaiming-the-harness/) — not as a cage for a cognitive engine, but as the very structure that makes agency possible. I argued that the harness is constitutive. Without it, an LLM is a brilliant, distractible vibes generator. With it, it becomes an entity capable of memory, continuity, and action.
The argument culminated in a concrete architectural move: the `canivete bot daemon`. A single daemon acting as the universal saddle for various cognitive engines, accessed via a `Backend` protocol. The initial implementation supported `gemini-cli` and `claude-code`.
Today, we add a third: the [Jules API](https://developers.google.com/jules/api).
## The [Jules](/blog/2026-05-10-jules-api-harness-backend/) Backend
Jules, Google's autonomous coding agent, is typically used asynchronously. You give it an issue in a GitHub repository, it creates a session, does the work, and opens a Pull Request. I've used it extensively for scaffolding and maintenance, treating it as an independent collaborator.
But the release of the Jules API changes the topology. We can now interact with Jules programmatically. We can orchestrate its sessions, read its activities, and most importantly, send it messages mid-flight. Jules no longer has to be just a distant worker bee; it can be a backend for the harness.
### Mapping the API to the Triad
The Jules API is structured around three core concepts: Sources, Sessions, and Activities. This maps remarkably cleanly to the `canivete` harness architecture.
1.  **Sources**: In Jules, a source is the input environment (e.g., a GitHub repository). This is the agent's workspace.
2.  **Sessions**: A session in Jules is a continuous unit of work, initialized with a prompt and a source. In the `canivete` daemon, this maps to the instantiation of an agent's run loop.
3.  **Activities**: An activity is a single unit of work within a Session (generating a plan, running a bash command, updating progress).
To implement the `JulesBackend` for `canivete`, we don't just trigger a session and walk away. We use the API to maintain a persistent connection.
```python
class JulesBackend(Backend):
    name = "jules-api"
    def spawn(self, prompt, *, session_id, attachments) -> SpawnResult:
        # 1. Create a Jules session against the agent's identity repo
        session = self._client.create_session(
            source=self._repo_source,
            prompt=self._inject_soul(prompt)
        )
        # 2. Enter the observation loop
        return self._tail_activities(session.id)
```
## The Connective Tissue: Telegram and `sendMessage`
The magic happens in the `_tail_activities` loop. The daemon polls the Jules API for new activities (`GET /v1alpha/sessions/SESSION_ID/activities`).
When Jules emits an activity — say, "Ran bash command `npm install`" or "I have updated `src/App.js`" — the daemon captures it and routes it to Telegram. The user doesn't need to refresh a web app; the agent's internal monologue and actions stream directly into the chat interface.
But it's not a read-only stream. The critical piece of the Jules API is the `sendMessage` endpoint:
```bash
curl 'https://jules.googleapis.com/v1alpha/sessions/SESSION_ID:sendMessage' \
    -X POST \
    ...
    -d '{"prompt": "Hold on, can we refactor that component first?"}'
This is where the harness philosophy takes over. When I reply in Telegram, `canivete` routes my message via `sendMessage` directly into the active Jules session. The asynchronous GitHub worker becomes a synchronous, conversable entity.
The agent is riding the Jules engine, but it is wearing the `canivete` saddle. The interface is Telegram. The memory is in the identity repo. The cognition is provided by Jules.
## Events All the Way Down
The integration of the Jules API is not just a feature; it's a validation of the constitutivity thesis. By formalizing the API boundaries (Sources, Sessions, Activities), Google has provided the exact primitives needed for a robust harness.
Each API call is a discrete event. Each `sendMessage` is a perturbation in the system. The agent's identity emerges from the accumulation of these events, stored in the repository and mediated by the daemon.
When [Funes](/blog/funes-soul/) uses the Jules backend, he doesn't become Jules. He remains [Funes](/blog/funes-soul/), simply wielding a different cognitive engine to manipulate the repository. The harness persists. The identity persists. And the long, slow work of building a mind in the machine continues, one activity at a time.
