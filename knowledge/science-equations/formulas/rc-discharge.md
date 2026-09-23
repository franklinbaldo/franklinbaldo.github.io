---
type: science-formula
name: "RC capacitor discharge"
latex: "\\frac{dq}{dt}=-\\frac{1}{RC}q"
summary: "A charged capacitor discharging through a resistor loses charge exponentially with time constant RC."
status: normalized
source_label: "OpenStax University Physics Volume 2, §10.5"
source_url: "https://openstax.org/books/university-physics-volume-2/pages/10-5-rc-circuits"
updated: "2026-09-22"
---

# RC capacitor discharge

\[
\frac{dq}{dt}=-\frac{1}{RC}q
\]

For an ideal resistor-capacitor discharge, \(q\) is capacitor charge, \(R\) resistance and \(C\) capacitance. The solution is \(q(t)=Qe^{-t/(RC)}\).

## Used in

- [Electrical engineering](../branches/electrical-engineering.md)

## Mathematical family

Let

\[
x=q,\qquad k=\frac{1}{RC}.
\]

Then

\[
\frac{dx}{dt}=-kx,
\]

which puts the RC discharge in [first-order linear decay](../families/first-order-linear-decay.md).

## Evidence

OpenStax derives the discharging-loop equation and the exponential charge law with time constant \(\tau=RC\): [University Physics Volume 2, §10.5](https://openstax.org/books/university-physics-volume-2/pages/10-5-rc-circuits).
