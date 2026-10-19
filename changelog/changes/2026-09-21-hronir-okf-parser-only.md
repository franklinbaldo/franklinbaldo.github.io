---
type: changelog
date: "2026-09-21"
description: "Move Hrönir agent evaluation from the Node CLI to OKF Markdown driven by okf-parser diagnostics."
tags: [hronir, okf, agents]
---

# Hrönir becomes OKF-first

New Hrönir evaluations are authored directly as `Hronir Evaluation` Markdown.
The `okf-parser` type spec now drives required-field completion: agents rerun
the check and resolve diagnostics until the evaluation is conformant.

The former Node agent CLI and npm Hrönir commands are removed. TypeScript remains
only on the read/build side for public ranking and temporary compatibility with
legacy versioned posts.
