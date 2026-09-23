---
type: science-formula
name: "Normal distribution probability density"
latex: "f(x)=\\frac{e^{-(x-\\mu)^2/(2\\sigma^2)}}{\\sigma\\sqrt{2\\pi}}"
summary: "Probability density for a normal random variable with location parameter μ and positive scale parameter σ."
status: verified
source_label: "NIST/SEMATECH e-Handbook, Normal Distribution"
source_url: "https://www.itl.nist.gov/div898/handbook/eda/section3/eda3661.htm"
updated: "2026-09-23"
---

# Normal distribution probability density

NIST gives the general normal probability density as

\[
f(x)=\frac{e^{-(x-\mu)^2/(2\sigma^2)}}{\sigma\sqrt{2\pi}},\qquad \sigma>0.
\]

Here \(x\in\mathbb{R}\) is the variate, \(\mu\) is the location parameter and \(\sigma\) is the positive scale parameter. If \(x\) carries physical units, \(\mu\) and \(\sigma\) carry the same units while \(f(x)\) has reciprocal units so that its integral is dimensionless.

## Used in

- [Statistics and Probability](../branches/statistics-probability.md)

## Validity and use

This expression is a probability **density**, not the probability of one exact point. Probabilities over intervals are obtained by integrating the density. The formula applies when a variable is modeled as normally distributed with fixed \(\mu\) and \(\sigma>0\); choosing a normal model is a modeling assumption and is not justified for every dataset merely by the formula's ubiquity.

## Equivalence test: general versus standard normal

NIST also gives the standard normal form

\[
\phi(z)=\frac{e^{-z^2/2}}{\sqrt{2\pi}}.
\]

Set

\[
z=\frac{x-\mu}{\sigma}.
\]

Then the general density becomes

\[
f(x)=\frac{1}{\sigma}\,\phi\!\left(\frac{x-\mu}{\sigma}\right).
\]

This is an explicit location-scale transformation between the general and standard forms. It is not an equality obtained by variable renaming alone: the factor \(1/\sigma\) is required so the transformed density remains normalized. No `equation-family` edge is created because the atlas does not yet contain a useful cross-domain family for probability densities.

## Evidence

[NIST/SEMATECH e-Handbook of Statistical Methods, Normal Distribution](https://www.itl.nist.gov/div898/handbook/eda/section3/eda3661.htm) gives both the general density above and the \(\mu=0,\sigma=1\) standard normal density, explicitly identifying \(\mu\) as the location parameter and \(\sigma\) as the scale parameter.
