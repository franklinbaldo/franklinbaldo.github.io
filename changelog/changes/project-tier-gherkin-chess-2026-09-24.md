---
type: changelog
date: 2026-09-24
description: "Add the canonical project-tier card for gherkin-chess after reviewing its epistemic action gate, OKF memory model, tests, tournament harness and current publishing failures."
tags: [projects, tiers, okf, github]
---

# Canonical project tier: gherkin-chess

Adds `knowledge/project-tiers/gherkin-chess.md` for `franklinbaldo/gherkin-chess`, reviewed at main revision `198e9df9d2c29ba1be72b641ae3fc2d2809dc315`.

The initial placement is **quality B / interest S / medium confidence**. The review credits the executable Gherkin-to-action gate, immutable origin-FEN provenance, explicit reuse/divergence semantics, OKF materialization, adversarial and historical-consistency tests, MCP/CLI/web surfaces, and the direct-vs-Gherkin tournament design.

A quality tier above B is withheld because the continuous tournament currently succeeds at running matches but fails while publishing the resulting corpus/leaderboard, leaving the public experiment stale and extremely sparse. The generic MCP path also leaves non-silent-substitution enforcement opt-in even though the README describes it as an invariant. Interest is S because the project is a compact and unusually explicit experimental environment for studying structured external memory and action-gated agent behavior.
