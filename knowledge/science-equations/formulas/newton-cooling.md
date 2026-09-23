---
type: science-formula
name: "Newton's law of cooling"
latex: "\\frac{dT}{dt}=-k(T-T_\\infty)"
summary: "Temperature approaches a constant ambient temperature at a rate proportional to the temperature difference."
status: normalized
source_label: "Khan Academy, Newton's Law of Cooling"
source_url: "https://www.khanacademy.org/science/physics/thermodynamics/temp-kinetic-theory-ideal-gas-law/a/newtons-law-of-cooling"
updated: "2026-09-22"
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

A standard differential-equation presentation gives \(dT/dt=-k(T-T_a)\) and its exponential solution: [Khan Academy, Newton's Law of Cooling](https://www.khanacademy.org/science/physics/thermodynamics/temp-kinetic-theory-ideal-gas-law/a/newtons-law-of-cooling).
