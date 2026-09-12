---
type: changelog
date: 2026-08-31
description: Specify narration segments as OKF concepts with renderer-aware tags, speaker spans, and per-renderer readiness.
tags: [audiobook, okf, rfc]
---

# Narration segments gain an OKF contract

- Adds RFC 0019 for one OKF concept per narration segment.
- Defines renderer-conditional tags and explicit speaker spans so mixed dialogue no longer depends on `mixed-dialogue-pending` as the long-term representation.
- Defines renderer-specific input digests and readiness while requiring equivalent plain-text projection across renderers unless an explicit justified variation is recorded.
