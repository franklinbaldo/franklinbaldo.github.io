---
type: changelog
date: 2026-10-19
description: Exempt Dependabot pull requests from the change card requirement
tags: [ci, dependencies, process]
---

The change card policy no longer requires a hand-written card on pull requests
opened by `dependabot[bot]`; their description already records the bump. The
exemption keys on the pull request author rather than the push actor, so commits
pushed onto a Dependabot branch keep it and no other author inherits it. Every
other pull request still needs at least one card.
