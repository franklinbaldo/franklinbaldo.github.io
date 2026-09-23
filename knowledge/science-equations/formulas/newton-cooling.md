---
type: science-formula
name: "Newton's law of cooling"
latex: "\\frac{dT}{dt}=-k(T-T_\\infty)"
summary: "Temperature approaches a constant ambient temperature at a rate proportional to the temperature difference."
status: audited
source_label: "OpenStax Calculus Volume 1, §6.8"
source_url: "https://openstax.org/books/calculus-volume-1/pages/6-8-exponential-growth-and-decay"
updated: "2026-09-23"
---

# Newton's law of cooling

\[
\frac{dT}{dt}=-k(T-T_\infty)
\]

Here \(T\) is the object's temperature, \(T_\infty\) is a constant ambient temperature and \(k>0\) is an effective cooling constant. The simple law is a lumped model and is not a universal heat-transfer equation; its validity depends on the physical regime.

## Used in

- [Thermodynamics and heat transfer](../branches/thermodynamics.md)

## Mathematical family

Define the temperature excess

\[
x=T-T_\infty.
\]

Since \(T_\infty\) is constant,

\[
\frac{dx}{dt}=\frac{dT}{dt}=-kx.
\]

The relaxing temperature difference is therefore an occurrence of [first-order linear decay](../families/first-order-linear-decay.md).

## Evidence

[OpenStax Calculus Volume 1, §6.8](https://openstax.org/books/calculus-volume-1/pages/6-8-exponential-growth-and-decay) states Newton's law as \(T'=-k(T-T_a)\) and explicitly performs the change of variables \(y=T-T_a\), obtaining \(y'=-ky\). This directly supports both the scientific formula and the atlas's recorded family transformation.
