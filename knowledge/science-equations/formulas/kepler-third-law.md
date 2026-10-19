---
type: science-formula
name: "Kepler's third law"
latex: "P^{2}=a^{3}"
summary: "Solar-system unit form relating orbital period in Earth years to orbital semimajor axis in astronomical units."
status: verified
source_label: "OpenStax Astronomy, 3.1 The Laws of Planetary Motion"
source_url: "https://openstax.org/books/astronomy/pages/3-1-the-laws-of-planetary-motion"
updated: "2026-09-23"
---

# Kepler's third law

OpenStax first states Kepler's third law as the proportionality \(P^2\propto a^3\), then gives the unit-normalized solar-system form

\[
P^{2}=a^{3}
\]

when \(P\) is the orbital period measured in Earth years and \(a\) is the semimajor axis measured in astronomical units (AU). The notation above is preserved from that source rather than replaced by a generalized form.

## Used in

- [Astronomy and Astrophysics](../branches/astronomy-astrophysics.md)

## Variables, conditions and use

- \(P\): orbital period, in Earth years for the displayed equality.
- \(a\): orbital semimajor axis, in AU for the displayed equality.
- The coefficient-one equality is a solar-system/unit normalization, not a dimension-free identity valid for arbitrary central masses or arbitrary unit systems.

In this form the law is used to infer a solar-system object's relative orbital distance from its period, or conversely its period from its semimajor axis. NASA likewise presents the solar-system relation as \(p^2=a^3\) and describes the third law as the square of orbital period being proportional to the cube of semimajor axis.

## Structural and equivalence tests

For physical orbits \(P>0\) and \(a>0\), taking the positive square root gives

\[
P=a^{3/2}.
\]

Thus \(P^2=a^3\) and \(P=a^{3/2}\) are algebraically equivalent on the positive domain. This transformation is recorded here; the atlas does not replace the sourced notation with the transformed form.

The coefficient-one equality is not invariant under arbitrary changes of units. If \(P'=c_P P\) and \(a'=c_a a\), then

\[
(P')^2=\frac{c_P^2}{c_a^3}(a')^3.
\]

That is why the units belong to the validity conditions rather than being treated as incidental typography.

OpenStax University Physics gives the Newtonian large-central-mass form

\[
T^2=\frac{4\pi^2}{GM}a^3,
\]

which makes the dependence on the central mass explicit. It is a generalization/contextual derivation, not a reason to overwrite the occurrence above.

### Existing equation-family test

The atlas's current equation family is scalar first-order linear decay,

\[
\frac{dx}{dt}=-kx.
\]

Kepler's third law is a static algebraic scaling relation between period and orbital size; it contains no time derivative and cannot be mapped to the decay law by variable renaming, constant rescaling or algebraic rearrangement. No `equation-family` edge is added.

### Cross-occurrence power-law probe

The existing Cobb-Douglas occurrence can reduce to a one-variable power law only after imposing an extra constraint such as fixing one input and choosing a particular exponent. For example, fixing \(C=C_0\) and choosing \(k=3/2\) in \(bL^kC^{1-k}\) produces a quantity proportional to \(L^{3/2}\). That is a constructed specialization, not an invertible transformation between the scientific occurrences. The possible broader monomial/power-law abstraction is therefore left as a future family hypothesis rather than asserted as a verified edge.

## Evidence and prior art

- [OpenStax Astronomy, §3.1](https://openstax.org/books/astronomy/pages/3-1-the-laws-of-planetary-motion) states \(P^2\propto a^3\), then \(P^2=a^3\) for period in years and semimajor axis in AU, and illustrates its use for solar-system orbits.
- [NASA Science, "Orbits and Kepler's Laws"](https://science.nasa.gov/solar-system/orbits-and-keplers-laws/) presents the third law as \(p^2=a^3\), describes its solar-system scope, and notes Kepler's 1619 publication of the law.
- [OpenStax University Physics, §13.5](https://openstax.org/books/university-physics-volume-1/pages/13-5-keplers-laws-of-planetary-motion) gives \(T^2=4\pi^2a^3/(GM)\) for an object orbiting a large mass, exposing the physical coefficient hidden by the solar-system unit normalization.

## Scope

This card records the classical solar-system occurrence. It does not claim that \(P^2=a^3\) with coefficient one applies unchanged to arbitrary two-body systems, relativistic regimes, or arbitrary units.
