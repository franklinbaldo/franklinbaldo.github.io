---
type: changelog
date: 2026-10-18
description: Add an offline bounded experiment queue planner and explicit activation prerequisites.
tags: [experiments, reproducibility, security]
---

# Offline bounded queue planning

- Adds immutable specification identities and exact approved-snapshot matching
- Blocks prior success, reservation and failure; rejects malformed or overflowing state
- Includes eleven synthetic tests and documents trusted atomic reservation requirements
- Does not dispatch experiments, change workflows, create credentials or claim operational exactly-once execution
