---
type: equation-family
name: "Undamped linear harmonic oscillator"
canonical_latex: "\\frac{d^2x}{dt^2}+\\omega^2x=0"
summary: "A linear second-order oscillator with constant positive angular frequency and no damping or external forcing."
status: verified
updated: "2026-09-23"
---

# Undamped linear harmonic oscillator

Canonical form:

\[
\frac{d^2x}{dt^2}+\omega^2x=0,
\qquad \omega>0.
\]

Its general real solution is

\[
x(t)=C\cos(\omega t)+D\sin(\omega t),
\]

which can equivalently be written

\[
x(t)=A\cos(\omega t+\varphi)
\]

for real amplitude/phase parameters, including the zero solution with \(A=0\).

## Scientific occurrences

- [Simple harmonic motion](../formulas/simple-harmonic-motion.md): differentiating the sourced \(x(t)=A\cos(\omega t+\varphi)\) twice gives the canonical ODE directly.
- [Ideal LC circuit oscillation](../formulas/lc-circuit-oscillation.md): with \(x=q\) and \(\omega^2=1/(LC)\), the capacitor charge obeys the canonical ODE for \(L,C>0\).

The second occurrence is independent physically: one describes mechanical displacement, the other electrical charge. OpenStax nevertheless gives the explicit correspondence \(m\mapsto L\), \(k\mapsto 1/C\), and \(x\mapsto q\), and both occurrences reduce to the same constant-coefficient second-order operator.

## Boundary of the family

The family intentionally excludes damping and forcing. Terms such as

\[
\gamma\frac{dx}{dt}
\]

or an external forcing function change the differential operator and generally the solution space. Likewise, nonlinear restoring forces are not equivalent merely because their small-amplitude limits may approximate harmonic motion.

This card therefore records a verified shared mathematical structure, not a claim that the underlying physical mechanisms are identical.
