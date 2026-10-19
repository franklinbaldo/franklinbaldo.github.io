---
type: science-atlas-run
date: "2026-09-22"
mode: "breadth expansion + equivalence test + source audit"
summary: "Extend the atlas into Life Sciences with logistic population growth, reject an over-strong linear-family link, and repair a stale Newton-cooling source URL."
updated: "2026-09-22"
---

# Logistic population growth run — 2026-09-22

The bootstrap frontier called for breadth outside the physical sciences and for a growth/saturation example. This run advances exactly that unit.

## Prior art and technical sources consulted

- [OpenAlex Domains](https://help.openalex.org/data/domains/) documents the current four-level aboutness hierarchy and identifies **Life Sciences** as a top-level domain.
- Current OpenAlex records place **Agricultural and Biological Sciences** under Life Sciences and **Ecology, Evolution, Behavior and Systematics** beneath that field.
- [OpenStax Calculus Volume 2, §4.4](https://openstax.org/books/calculus-volume-2/pages/4-4-the-logistic-equation) defines the logistic differential equation in the notation preserved by the atlas card.
- [OpenStax Biology 2e, §45.3](https://openstax.org/books/biology-2e/pages/45-3-environmental-limits-to-population-growth) explains exponential versus logistic population growth and the low-density limit.
- [OpenStax Biology 2e, §45.4](https://openstax.org/books/biology-2e/pages/45-4-population-dynamics-and-regulation) records an important limitation: carrying capacity is not generally constant in real populations.

## Added

- [Life Sciences](../branches/life-sciences.md) as a new broad domain.
- [Agricultural and Biological Sciences](../branches/agricultural-biological-sciences.md) and [Ecology, Evolution, Behavior and Systematics](../branches/ecology-evolution-behavior-systematics.md) as the initial path into that domain.
- [Logistic population growth](../formulas/logistic-population-growth.md) in the source notation \(dP/dt=rP(1-P/K)\), including variables, units, validity conditions and source evidence.

## Equivalence test and rejection

Expanding the logistic equation gives

\[
\frac{dP}{dt}=rP-\frac{r}{K}P^2.
\]

The \(P^2\) term makes the finite-\(K\) model nonlinear, so it is not equivalent by simple variable renaming or constant rescaling to the existing first-order linear-decay family. No family edge was created.

The controlled limit \(P/K\ll1\) yields \(dP/dt\approx rP\). For the standard ecological growth case \(r>0\), this is exponential growth, whereas the existing decay family is intentionally parameterized as \(dx/dt=-kx\) with \(k>0\). A future broader linear-growth/decay abstraction may be useful, but this run does not silently widen an existing verified family to obtain a prettier graph.

## Audit

The Newton-cooling card pointed to an older Khan Academy path. The current article is under `thermodynamics/laws-of-thermodynamics/`; the source URL was repaired without changing the scientific formula or its already-demonstrated family transformation.

## Frontier

The atlas now has one nonlinear saturation example outside the physical sciences but still lacks probability/statistics, diffusion/PDE and oscillatory families. Logistic growth also creates a concrete future question: whether a signed first-order linear family should generalize both exponential growth and decay, while preserving the more specific verified decay family.
