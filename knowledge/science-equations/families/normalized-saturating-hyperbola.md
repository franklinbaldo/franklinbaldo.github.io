---
type: equation-family
name: "Normalized saturating hyperbola"
canonical_latex: "y=\\frac{x}{1+x}"
summary: "A dimensionless monotone response that is linear near the origin and approaches a finite plateau."
status: verified
updated: "2026-09-23"
---

# Normalized saturating hyperbola

Canonical form:

\[
y=\frac{x}{1+x},
\qquad x\ge0.
\]

On the physical nonnegative domain, the response satisfies \(y(0)=0\), is monotone increasing, has the low-input approximation \(y\approx x\) for \(x\ll1\), and approaches the finite plateau \(y\to1\) as \(x\to\infty\).

## Scientific occurrences

- [Michaelis–Menten equation](../formulas/michaelis-menten-equation.md): with \(x=[S]_0/K_{\mathrm M}\) and \(y=v_0/V\), the sourced initial-rate law becomes the canonical form.
- [Langmuir adsorption isotherm](../formulas/langmuir-adsorption-isotherm.md): with \(x=K_LC_e\) and \(y=q_e/q_m\), the sourced equilibrium adsorption law becomes the canonical form.

These transformations are dimensionless rescalings of their respective source equations for fixed positive scale parameters. The two occurrences are physically independent: one is an enzyme initial-rate relation and the other an equilibrium adsorption relation. Their common edge therefore records shared mathematics, not shared mechanism.

## Boundary of the family

This family is algebraic, not dynamical. It does not include equations merely because their solutions eventually saturate or because their prose uses words such as "capacity" or "carrying capacity".

In particular:

- [Logistic population growth](../formulas/logistic-population-growth.md) is a nonlinear first-order ODE, \(dP/dt=rP(1-P/K)\). Its bounded solution can approach \(K\), but the governing equation is not transformed into \(y=x/(1+x)\) by the rescalings above.
- [First-order linear decay](first-order-linear-decay.md) is an evolution law \(dx/dt=-kx\), not a static response relation.
- [Undamped linear harmonic oscillator](undamped-linear-harmonic-oscillator.md) is a second-order differential equation with periodic generic solutions.

The family should therefore be used only when an occurrence can be reduced explicitly to the canonical algebraic form, not from qualitative resemblance alone.
