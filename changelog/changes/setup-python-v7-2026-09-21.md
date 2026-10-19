---
type: changelog
date: 2026-09-21
description: Update the setup-python GitHub Action from v6.2.0 to v7.0.0 across Python-backed workflows.
tags: [ci, dependencies, python]
---

# setup-python moves to v7

GitHub Actions now pin `actions/setup-python@v7.0.0` in the audiobook, blog-audio and MaleCNS tagger workflows. The update keeps the existing Python 3.12 runtime contract while adopting the current action implementation and upstream fixes; application behavior is unchanged.
