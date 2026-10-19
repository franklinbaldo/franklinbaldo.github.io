---
type: changelog
date: 2026-10-19
description: Fix validation and literal summaries in the manual papers runner
---

The manual papers experiment runner now initializes its bundle path on the
runner, instead of using an unavailable context in the job environment. Its
summary prints input values literally rather than treating Markdown backticks
as shell command substitution. Offline regression tests cover both failures.

The workflow remains manual-only and read-only. No experiment was dispatched,
and credentials, source checkout policy, and scientific gates are unchanged.
