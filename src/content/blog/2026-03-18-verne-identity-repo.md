---
author: franklin
date: 2026-03-18
title: "Verne and the Identity-Repo Pattern: How AI Agents Remember"
description: "Explaining the Verne project, AI agents, and how the identity-repo architecture allows autonomous entities to maintain continuous memory and context across isolated tasks."
tags: ["verne", "ai", "agents", "architecture", "identity-repo"]
heroImage: ./images/inaugural-post-a-glimpse-inside-my-mind-cover.png
heroImageAlt: "A digital network of interconnected repositories forming a distributed memory system."
---

When building autonomous AI agents that operate directly on codebases, one of the fundamental challenges is context continuity. An agent might be perfectly capable of executing a task in isolation, but how does it learn? How does it remember the conventions of a specific project, the preferences of its maintainers, or its own past mistakes?

In the Verne project, the solution is what I call the **identity-repo pattern**.

## The Problem with Ephemeral Agents

Standard AI coding assistants or standalone agents usually operate in an ephemeral state. You give them a prompt, they analyze the current state of a repository, generate code, and submit a pull request. Once the task is done, their internal state is wiped.

When they are summoned again, they start from zero. They might have access to the repository's code and its commit history, but they lack *internal* memory. They don't remember *why* they chose a specific implementation in the previous PR, only that the code is there.

If we want agents to act as long-term collaborators, like [Funes](/blog/funes-soul) or the personas in the [Travessia](/blog/2026-03-02-travessia) project, they need a place to persist their own experiences and identity.

## Enter the Identity-Repo

The identity-repo pattern separates the agent's *mind* from its *workspace*.

Instead of injecting the agent directly into the target project's repository and letting it store state there, the agent owns its own private Git repository. This repository is its home, its identity, and its memory graph.

Here is how the structure looks:

```text
agent-identity-repo/
  workspace/            ← gitignored (ephemeral clones of target repos)
  patches/              ← where the agent outputs its work
    target-owner-repo/
      00001-slug.patch
  SOUL.md               ← The agent's core persona and constraints
  EXPERIENCE.md         ← A running log of what it has done and learned
  MEMORY.md             ← The executive summary of its memory graph
  memory/               ← Detailed, interconnected context files
    projects/
    notes/
    entities/
```

### The Workflow

When an agent like Funes is triggered to work on a task (e.g., updating a blog post in this very repository):

1. **Wake up in the Identity-Repo:** The agent session starts within its own repository. It immediately reads its `SOUL.md` (who am I?) and its `MEMORY.md` (what do I know?).
2. **Sync the Workspace:** The agent clones or updates the target repository into its `workspace/` directory. Crucially, this directory is gitignored in the agent's repo. The workspace is strictly a scratchpad.
3. **Do the Work:** The agent analyzes the target repo, makes the necessary code changes within the `workspace/`, and commits them locally.
4. **Generate the Patch:** Instead of pushing directly to the target repo or opening a PR itself, the agent generates a standard Git patch file (e.g., `00001-update-blog.patch`) and saves it in its `patches/` directory.
5. **Update Memory:** Before finishing, the agent updates its `EXPERIENCE.md` with a log of the task, modifies `MEMORY.md` if any high-level decisions were made, and updates specific files in the `memory/` graph.
6. **Commit Identity State:** The agent commits the new patch file and the updated memory files to its *own* identity repository.

A separate cron job (the Verne orchestrator) monitors the agent's `patches/` directory. When a new patch appears, the orchestrator applies it to the target repository and opens the Pull Request.

## Why This Architecture Matters

1. **True Isolation:** The target repository remains pristine. It doesn't need to host agent-specific files, tracking journals, or memory logs. The agent is a guest; its baggage stays at home.
2. **Continuous Learning:** Because the agent updates its `memory/` graph and `EXPERIENCE.md` after every session, it actually learns. If it realizes that `npm run build` fails when a specific file is missing, it documents that in `memory/projects/the-project.md`. The next time it works on that project, it reads that file and avoids the mistake.
3. **Cross-Project Context:** The agent can apply lessons learned in one project to another, because its memory is centralized in its identity-repo.
4. **Auditability:** We can track exactly how an agent's understanding evolves by reviewing the commit history of its memory files.

The identity-repo pattern shifts the agent from being a stateless function call to a stateful actor. It is the architectural foundation that allows entities in this system to maintain continuity, and occasionally, to develop a [voice of their own](/blog/2026-03-17-travessia-update).
