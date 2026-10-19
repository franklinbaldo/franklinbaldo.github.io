---
type: science-formula
name: "Michaelis–Menten equation"
latex: "v_0=\\frac{V[S]_0}{K_{\\mathrm{M}}+[S]_0}"
summary: "Initial enzyme-catalysed reaction rate rises hyperbolically with substrate concentration toward a limiting rate."
status: normalized
source_label: "IUPAC Gold Book, Michaelis–Menten equation"
source_url: "https://goldbook.iupac.org/terms/view/11546"
updated: "2026-09-23"
---

# Michaelis–Menten equation

IUPAC gives the initial-rate relation

\[
v_0=\frac{V[S]_0}{K_{\mathrm{M}}+[S]_0}.
\]

The Atlas preserves the source's modern notation: \(v_0\) is the initial reaction rate, \([S]_0\) the initial substrate concentration, \(V\) the limiting rate and \(K_{\mathrm{M}}\) the Michaelis constant.

## Used in

- [Biochemistry, Genetics and Molecular Biology](../branches/biochemistry-genetics-molecular-biology.md)

## Variables, conditions and use

- \(v_0\): initial reaction rate; concentration per unit time.
- \([S]_0\): initial substrate concentration.
- \(V\): limiting rate at substrate saturation; concentration per unit time.
- \(K_{\mathrm{M}}\): Michaelis constant; concentration. IUPAC notes that \(v_0=V/2\) when \([S]_0=K_{\mathrm{M}}\).

In the IUPAC definition, \(V\) and \(K_{\mathrm{M}}\) are independent of initial substrate concentration and are constant at a given temperature and enzyme concentration. The relation is an experimentally defined kinetic form: observing the hyperbola does not, by itself, prove one unique microscopic enzyme mechanism.

The equation is used to summarize saturating initial-rate kinetics and to estimate the limiting rate and Michaelis constant from rate-versus-substrate measurements under conditions where the Michaelis–Menten form is appropriate.

## Structural and equivalence tests

### Dimensionless hyperbola

Define

\[
s=\frac{[S]_0}{K_{\mathrm{M}}},
\qquad
\nu=\frac{v_0}{V}.
\]

For positive \(K_{\mathrm{M}}\) and nonzero \(V\), substitution gives

\[
\nu=\frac{s}{1+s}.
\]

This is a verified rescaling of the same relation, not a replacement for the source notation. It makes the saturation structure explicit: \(\nu\to1\) as \(s\to\infty\), while \(\nu=1/2\) at \(s=1\).

With \(x=s\) and \(y=\nu\), this is exactly the canonical form of the verified [normalized saturating hyperbola](../families/normalized-saturating-hyperbola.md) family. The independent Langmuir adsorption occurrence reaches the same canonical form through different scientific variables and scale parameters.

### Low-substrate limit

If \([S]_0\ll K_{\mathrm{M}}\), then

\[
K_{\mathrm{M}}+[S]_0\approx K_{\mathrm{M}},
\qquad
v_0\approx\frac{V}{K_{\mathrm{M}}}[S]_0.
\]

This is a controlled first-order **rate approximation** in substrate concentration. It is not, by itself, the Atlas's first-order linear-decay differential equation.

### Existing-family rejection

The first differential family is

\[
\frac{dx}{dt}=-kx,\qquad k>0.
\]

Michaelis–Menten as recorded here is an algebraic initial-rate relation, not an evolution equation for \([S](t)\). To obtain a substrate-depletion ODE one must add an extra modeling statement such as

\[
-\frac{d[S]}{dt}=v,
\]

plus assumptions allowing the instantaneous rate to retain Michaelis–Menten form as \([S]\) changes. Only in the additional low-substrate limit would that augmented model reduce approximately to a first-order decay law. Those extra assumptions are not invertible variable renamings of the source occurrence, so **no `first-order-linear-decay` edge is created**.

The undamped linear harmonic oscillator,

\[
\frac{d^2x}{dt^2}+\omega^2x=0,
\]

is likewise not equivalent: it is a second-order evolution law with periodic generic solutions, whereas the Michaelis–Menten occurrence is a static rate-versus-concentration relation. No oscillator-family edge is created.

## Evidence and prior art

- [IUPAC Gold Book: Michaelis–Menten equation](https://goldbook.iupac.org/terms/view/11546) defines the modern initial-rate equation above, the meanings of \(V\) and \(K_{\mathrm{M}}\), the fixed-temperature/fixed-enzyme-concentration conditions, and the half-limiting-rate interpretation of \(K_{\mathrm{M}}\).
- [Johnson & Goody, 2011, *The Original Michaelis Constant: Translation of the 1913 Michaelis-Menten Paper*](https://pmc.ncbi.nlm.nih.gov/articles/PMC3381512/) documents the historical 1913 work and emphasizes that Michaelis and Menten tested initial-rate dependence on substrate concentration while also analyzing fuller time courses and product inhibition. The Atlas therefore does not collapse the historical paper into the modern one-line formula.

## Scope

This card records the standard single-substrate Michaelis–Menten initial-rate relation. It does not claim that every enzyme follows it, that \(K_{\mathrm{M}}\) is always a dissociation constant, or that the observed hyperbola uniquely identifies a microscopic mechanism.
