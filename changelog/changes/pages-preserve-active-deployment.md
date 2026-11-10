---
type: changelog
date: 2026-11-10
description: Preserve active GitHub Pages deployments when newer commits arrive.
---

Production Pages deployments now finish before newer pushes can publish. The Pages concurrency group keeps the latest pending run instead of cancelling a publication during file synchronization.
