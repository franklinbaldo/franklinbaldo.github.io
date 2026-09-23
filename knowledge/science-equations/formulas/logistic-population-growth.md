---
type: science-formula
name: "Logistic population growth"
latex: "\\frac{dP}{dt}=rP\\left(1-\\frac{P}{K}\\right)"
summary: "Population growth slows as population size approaches a fixed carrying capacity."
status: verified
source_label: "OpenStax Calculus Volume 2, §4.4"
source_url: "https://openstax.org/books/calculus-volume-2/pages/4-4-the-logistic-equation"
updated: "2026-09-22"
---

# Logistic population growth

OpenStax gives the logistic differential equation in the population notation

\[
\frac{dP}{dt}=rP\left(1-\frac{P}{K}\right).
\]

Here \(P=P(t)\) is population size, \(t\) is time, \(r\) is the intrinsic growth-rate parameter and \(K\) is carrying capacity. If population is measured in individuals, \(P\) and \(K\) have units of individuals and \(r\) has units of inverse time.

## Used in

- [Ecology, Evolution, Behavior and Systematics](../branches/ecology-evolution-behavior-systematics.md)

## Validity and use

The model represents density-limited growth with fixed \(r\) and \(K\). It is a useful idealization, not a universal law of population dynamics: real carrying capacity can vary, populations can overshoot it, and additional density-dependent or density-independent processes can matter. OpenStax Biology 2e makes those limitations explicit when introducing logistic growth in population ecology.

## Equivalence test

Expanding the source equation gives

\[
\frac{dP}{dt}=rP-\frac{r}{K}P^2.
\]

For finite \(K\), the quadratic term makes the ODE nonlinear. A constant renaming or rescaling of \(P\) therefore does **not** turn the full logistic equation into the atlas's existing first-order linear-decay form \(dx/dt=-kx\). No equation-family link is asserted in this run.

There is a controlled low-density approximation. When \(P/K\ll1\),

\[
1-\frac{P}{K}\approx1,
\qquad
\frac{dP}{dt}\approx rP.
\]

For the usual ecological growth case \(r>0\), this is first-order exponential **growth**, not the verified decay family whose canonical parameterization requires \(k>0\) in \(dx/dt=-kx\). Treating those as one family would require deliberately broadening the family definition rather than silently changing a sign.

## Evidence

- [OpenStax Calculus Volume 2, §4.4](https://openstax.org/books/calculus-volume-2/pages/4-4-the-logistic-equation) defines the equation above with \(P(t)\), \(r\) and carrying capacity \(K\).
- [OpenStax Biology 2e, §45.3](https://openstax.org/books/biology-2e/pages/45-3-environmental-limits-to-population-growth) derives logistic population growth from density limitation and explains the low-density reduction toward exponential growth.
- [OpenStax Biology 2e, §45.4](https://openstax.org/books/biology-2e/pages/45-4-population-dynamics-and-regulation) notes that fixed carrying capacity is a simplifying assumption and discusses variation in real populations.
