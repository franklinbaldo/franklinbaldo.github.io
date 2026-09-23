---
type: equation-family
name: "First-order linear decay"
canonical_latex: "\\frac{dx}{dt}=-kx"
summary: "A scalar quantity relaxes exponentially at a rate proportional to its current value."
status: verified
updated: "2026-09-22"
---

# First-order linear decay

Canonical form:

\[
\frac{dx}{dt}=-kx,\qquad k>0,
\]

with solution

\[
x(t)=x_0e^{-kt}.
\]

## Scientific occurrences

- [Radioactive decay](../formulas/radioactive-decay.md): \(x=N,\ k=\lambda\).
- [First-order chemical kinetics](../formulas/first-order-rate-law.md): \(x=[A]\).
- [Newton cooling](../formulas/newton-cooling.md): \(x=T-T_\infty\).
- [RC capacitor discharge](../formulas/rc-discharge.md): \(x=q,\ k=1/(RC)\).

These are not identical physical claims. Their variables, mechanisms, dimensions and validity conditions differ. The atlas relation is mathematical: after the explicit substitutions above, each model has the same scalar autonomous linear ODE.

This is the first proof-of-concept hub for the graph analysis the project is intended to grow.
