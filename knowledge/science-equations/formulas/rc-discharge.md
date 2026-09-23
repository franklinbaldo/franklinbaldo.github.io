---
type: science-formula
name: "RC capacitor discharge"
latex: "\\frac{dq}{dt}=-\\frac{1}{RC}q"
summary: "A charged capacitor discharging through a resistor loses charge exponentially with time constant RC."
status: audited
source_label: "OpenStax University Physics Volume 2, §10.5"
source_url: "https://openstax.org/books/university-physics-volume-2/pages/10-5-rc-circuits"
updated: "2026-09-23"
---

# RC capacitor discharge

\[
\frac{dq}{dt}=-\frac{1}{RC}q
\]

For an ideal resistor-capacitor discharge, \(q\) is capacitor charge, \(R\) resistance and \(C\) capacitance. The solution is \(q(t)=Qe^{-t/(RC)}\), where \(Q\) is the initial capacitor charge.

## Used in

- [Electrical engineering](../branches/electrical-engineering.md)

## Variables, units and validity

- \(q\): capacitor charge, in coulombs.
- \(Q\): initial charge at \(t=0\), in coulombs.
- \(R\): resistance, in ohms.
- \(C\): capacitance, in farads.
- \(t\): time, in seconds.
- \(\tau=RC\): the RC time constant; OpenStax explicitly notes that \(RC\) has units of time.

The source derivation is for the discharge position of a simple series RC circuit, where the voltage source is removed and the charged capacitor discharges through the resistor. The model assumes lumped, constant \(R\) and \(C\) and the ideal component relations used in Kirchhoff's loop rule.

## Mathematical family

OpenStax's discharge loop gives

\[
IR+\frac{q}{C}=0,
\qquad I=\frac{dq}{dt}.
\]

Therefore

\[
R\frac{dq}{dt}=-\frac{q}{C}
\]

and, dividing by \(R\),

\[
\frac{dq}{dt}=-\frac{1}{RC}q.
\]

Let

\[
x=q,\qquad k=\frac{1}{RC}.
\]

Then

\[
\frac{dx}{dt}=-kx,
\]

which puts the RC discharge in [first-order linear decay](../families/first-order-linear-decay.md). Because \(R>0\) and \(C>0\) for the passive ideal components in this model, \(k=1/(RC)>0\), matching the family condition.

## Evidence

[OpenStax University Physics Volume 2, §10.5](https://openstax.org/books/university-physics-volume-2/pages/10-5-rc-circuits) derives the discharging-loop equation, gives \(q(t)=Qe^{-t/\tau}\), and identifies \(\tau=RC\) as the circuit time constant. The explicit derivation above makes the existing family edge reproducible rather than relying only on resemblance between exponential solutions.
