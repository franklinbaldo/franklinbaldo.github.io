---
type: changelog
date: 2026-11-08
description: Prove monetary label invariance on signed recipient-period cash-flow ledgers
tags: [lean4, economics, formal-verification]
---

The new recipient-time formalization represents payments by recipient,
period, signed amount and accounting label. It proves that reclassifying
payments or exactly compensating lost interest to the same recipient at
the same time does not alter their net income schedule or a predictor
that depends exclusively on that schedule and the policy-rate input.

Separate counterexamples show that equal nominal aggregates can mask
redistribution across persons or time. The weighted-demand example is
hypothetical and does not assert a macroeconomic inflation response.
