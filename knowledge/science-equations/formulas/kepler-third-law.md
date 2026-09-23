---
type: science-formula
name: "Kepler's third law"
latex: "P^{2}\\propto a^{3}"
summary: "For bodies orbiting the same dominant central mass, the square of orbital period is proportional to the cube of orbital semimajor axis."
status: verified
source_label: "OpenStax Astronomy 2e, §3.1"
source_url: "https://openstax.org/books/astronomy-2e/pages/3-1-the-laws-of-planetary-motion"
updated: "2026-09-23"
---

# Kepler's third law

OpenStax states the astronomical domain form as

\[
P^{2}\propto a^{3},
\]

where \(P\) is orbital period and \(a\) is the semimajor axis. For objects orbiting the Sun, if \(P\) is measured in years and \(a\) in astronomical units, the same source writes the convenient unit-specific form

\[
P^{2}=a^{3}.
\]

The law is used to infer relative orbital scales from periods (or periods from semimajor axes) for approximately Keplerian motion. In the Newtonian two-body idealization, the proportionality constant depends on the gravitating masses; for satellites whose orbiting mass is negligible compared with a common central mass \(M\), OpenStax University Physics gives

\[
T^{2}=\frac{4\pi^{2}}{GM}a^{3}.
\]

Thus the proportionality is not a dimensionless identity in arbitrary units.

## Used in

- [Astronomy and Astrophysics](../branches/astronomy-astrophysics.md)

## Structural and equivalence test

NASA's historical presentation writes the same proportionality as

\[
T^{2}=k a^{3},
\]

with one constant \(k\) for planets orbiting the Sun. Setting \(P=T\) and \(k=4\pi^{2}/(GM)\) recovers the Newtonian form above, so these are equivalent parameterizations when the same central gravitating system and units are fixed.

For positive \(P,a,k\), solving for period yields

\[
P=\sqrt{k}\,a^{3/2},
\]

which is an algebraically equivalent representation, not a distinct scientific occurrence.

The atlas's current equation family [first-order linear decay](../families/first-order-linear-decay.md) has operator structure \(dx/dt=-kx\). Kepler's third law is a static algebraic relation between orbital period and semimajor axis, with no first-order time derivative. Variable renaming or constant rescaling cannot change that operator structure, so **no equation-family edge is asserted**.

## Conditions and evidence

The classical relation is exact for the Newtonian two-body model and is an approximation for real multi-body systems subject to perturbations. When comparing bodies using one proportionality constant, they must orbit the same dominant central mass (or the relevant total gravitating mass must be included in the constant).

- [OpenStax Astronomy 2e, §3.1](https://openstax.org/books/astronomy-2e/pages/3-1-the-laws-of-planetary-motion) states \(P^2\propto a^3\), defines \(P\) and \(a\), and gives \(P^2=a^3\) for years and AU in the solar system.
- [OpenStax University Physics Volume 1, §13.5](https://openstax.org/books/university-physics-volume-1/pages/13-5-keplers-laws-of-planetary-motion) gives \(T^2=(4\pi^2/GM)a^3\) for an object orbiting a large mass.
- [NASA, “Kepler and His Laws”](https://pwg.gsfc.nasa.gov/stargaze/Skeplaws.htm) gives \(T^2=k a^3\) and notes the same \(k\) for the planets when the same units are used.
