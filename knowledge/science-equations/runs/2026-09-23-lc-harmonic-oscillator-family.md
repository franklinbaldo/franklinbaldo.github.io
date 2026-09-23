---
type: science-atlas-run
date: "2026-09-23"
mode: "cross-domain oscillator family verification"
summary: "Add an ideal LC-circuit occurrence and use an explicit mechanical/electrical transformation to verify a shared undamped harmonic-oscillator family, while keeping dissipative circuit dynamics separate."
updated: "2026-09-23"
---

# LC circuit / harmonic-oscillator family run — 2026-09-23

## Starting state

This execution first reread `docs/science-equation-atlas-routine.md` and reconstructed the Atlas from current `main` and the canonical Markdown OKF bundle under `knowledge/science-equations/`. The branch started from `c49000adcdc6fb9cf0b1fb2a743939b68e7751e1`; that commit was unrelated Hrönir work whose parent was the latest Atlas merge, `4276c753941283083859c17e4d974e120d0b9cd4` (`atlas: add simple harmonic motion oscillation frontier (#2142)`). No remembered frontier state was used.

The most recent normative `okf-parser` execution on the Atlas reported `concept_count: 41`, `markdown_count: 41`, `conformant: true`, and no diagnostics after the simple-harmonic-motion merge candidate. Direct inspection of current `main` showed 21 branch cards, 11 formula occurrences, 1 equation-family card and 8 prior run records. Repository PR search found no active LC/Atlas pull request to continue.

The preceding oscillator run had explicitly deferred a generic harmonic-oscillator family until another independent occurrence could be tested. Electrical engineering already had an RC decay occurrence, so an ideal LC circuit offered a small cross-domain test that could either support or falsify the proposed oscillator family without inventing a new taxonomy node.

## Prior art and technical sources consulted

- [OpenStax University Physics Volume 2, §14.5 Oscillations in an LC Circuit](https://openstax.org/books/university-physics-volume-2/pages/14-5-oscillations-in-an-lc-circuit) gives the ideal LC charge exactly as `q(t)=q₀ cos(ωt+φ)`, gives `ω=sqrt(1/(LC))`, and explicitly maps the mechanical oscillator by replacing `m` with `L`, `k` with `1/C`, and `x` with `q`.
- [OpenStax University Physics Volume 2, §14.6 RLC Series Circuits](https://openstax.org/books/university-physics-volume-2/pages/14-6-rlc-series-circuits) shows that adding resistance produces an additional damping structure and a decaying envelope, bounding the ideal LC equivalence.
- [Wolfram Formula Repository, Resonance Frequency Equation](https://resources.wolframcloud.com/FormulaRepository/resources/Resonance-Frequency-Equation) independently catalogs the LC resonant-frequency relation `f=1/(2π sqrt(LC))` and was checked as formula-repository prior art.
- The existing [simple harmonic motion](../formulas/simple-harmonic-motion.md) occurrence and its OpenStax mechanical source were re-audited because they are the other side of the proposed family edge.

No new discipline taxonomy was introduced, so no taxonomy source beyond the already materialized Electrical engineering branch was needed.

## Added

- [Ideal LC circuit oscillation](../formulas/lc-circuit-oscillation.md), preserving the OpenStax source notation

\[
q(t)=q_0\cos(\omega t+\varphi),
\qquad
\omega=\sqrt{\frac{1}{LC}}.
\]

- [Undamped linear harmonic oscillator](../families/undamped-linear-harmonic-oscillator.md), with canonical form

\[
\frac{d^2x}{dt^2}+\omega^2x=0,
\qquad \omega>0.
\]

The family is created only after two physically independent occurrences are available and the transformation is reproduced explicitly.

## Structural and equivalence tests

### LC source form to canonical ODE

From the sourced charge law,

\[
q(t)=q_0\cos(\omega t+\varphi),
\]

differentiating twice gives

\[
\frac{d^2q}{dt^2}=-\omega^2q.
\]

Therefore

\[
\frac{d^2q}{dt^2}+\omega^2q=0.
\]

With \(\omega^2=1/(LC)\), this is equivalently

\[
\frac{d^2q}{dt^2}+\frac{1}{LC}q=0.
\]

For the passive ideal parameters \(L>0\) and \(C>0\), \(\omega>0\). Renaming \(x=q\) maps the occurrence exactly onto the family operator.

### Mechanical SHM to LC oscillator

The existing mechanical occurrence is

\[
x(t)=A\cos(\omega t+\varphi).
\]

The new electrical occurrence is

\[
q(t)=q_0\cos(\omega t+\varphi).
\]

The invertible variable/amplitude map

\[
x\leftrightarrow q,
\qquad
A\leftrightarrow q_0
\]

makes the source solution forms identical. More strongly, OpenStax independently states the physical-model correspondence

\[
m\mapsto L,
\qquad
k\mapsto \frac{1}{C},
\qquad
x\mapsto q,
\]

so the mechanical relation \(\omega^2=k/m\) becomes \(\omega^2=1/(LC)\). This verifies the shared equation-family edge rather than merely observing two sinusoidal plots.

### First-order decay rejection

The existing family

\[
\frac{dx}{dt}=-kx
\]

is first-order and dissipative. The ideal LC system is second-order and has non-decaying periodic generic solutions. No constant renaming, sign change or rescaling changes derivative order/state dimension, so the new occurrence is not linked to first-order linear decay.

### Damped RLC rejection

OpenStax's underdamped RLC solution contains an exponential envelope and its differential operator includes resistance. That term is material structure, not a harmless parameter rename. RLC dynamics are therefore not folded into the undamped family in this run.

## Audit / corrected knowledge

Two older cards were audited as part of the family decision.

First, [simple harmonic motion](../formulas/simple-harmonic-motion.md) previously said a harmonic-oscillator family was deferred until an independent occurrence such as an LC circuit was available. That statement had become stale once this run verified the LC transformation. The card now links to the new family and records the exact correspondence that justifies the edge; its status advances from `verified` to `audited`.

Second, [Electrical engineering](../branches/electrical-engineering.md) previously described only the bootstrap RC discharge occurrence. It now records both RC discharge and ideal LC oscillation and explicitly distinguishes their first-order dissipative and second-order conservative structures, avoiding a misleading implication that the branch has only one sampled circuit dynamic.

Markdown links remain canonical. No UI, graph projection or generated aggregate was edited.

## Rejected / deferred

- No link was created between the ideal LC oscillator and first-order linear decay.
- No RLC, damped-mechanical, driven, nonlinear or quantum oscillator was treated as equivalent to the new undamped family.
- No narrower electrical-circuits taxonomy node was invented without a taxonomy-specific need and source.
- A broader `oscillator` family spanning damped or forced systems remains unjustified; the new family is intentionally narrow.

## Files changed

- `knowledge/science-equations/formulas/lc-circuit-oscillation.md`
- `knowledge/science-equations/families/undamped-linear-harmonic-oscillator.md`
- `knowledge/science-equations/formulas/simple-harmonic-motion.md`
- `knowledge/science-equations/branches/electrical-engineering.md`
- `knowledge/science-equations/runs/2026-09-23-lc-harmonic-oscillator-family.md`
- `changelog/changes/2026-09-23-science-equation-atlas-lc-oscillator.md`

## Validation

The normative Atlas gate is expected to run the repository-pinned parser command:

```sh
uv run --with 'git+https://github.com/franklinbaldo/okf-parser@e8ed6bbd93846a40ac17a0be88c658020e85443a' \
  okf-parser check knowledge/science-equations \
  --require-spec ../../specs/okf-types/{slug}.md \
  --normative-spec
```

The pull request must also pass the normal blog checks, internal-link checks, Astro type checking, build/Lighthouse, change-card policy, visual-evidence policy and secret scanning before squash merge. If any required gate fails, the run is left reproducibly blocked rather than reported as successful.
