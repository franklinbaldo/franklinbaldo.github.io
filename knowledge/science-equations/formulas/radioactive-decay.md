---
type: science-formula
name: "Radioactive decay law"
latex: "-\\frac{dN}{dt}=\\lambda N"
summary: "The decay rate is proportional to the number of undecayed nuclei."
status: audited
source_label: "OpenStax University Physics Volume 3, §10.3"
source_url: "https://openstax.org/books/university-physics-volume-3/pages/10-3-radioactive-decay"
updated: "2026-09-23"
---

# Radioactive decay law

\[
-\frac{dN}{dt}=\lambda N
\]

Here \(N\) is the number of undecayed nuclei and \(\lambda>0\) is the decay constant. OpenStax uses the law to model radioactive populations and derives the exponential form \(N=N_0e^{-\lambda t}\).

## Used in

- [Nuclear physics](../branches/nuclear-physics.md)

## Statistical interpretation and validity

The smooth differential law is a population-level description, not a deterministic clock for each nucleus. OpenStax's treatment of half-life explicitly describes nuclear decay as a statistical process: an individual unstable nucleus has a survival/decay probability, while the exponential law describes the expected large-population behavior increasingly well when many independent nuclei are present.

That distinction matters because \(N\) is physically an integer count even though the differential model treats it as a smooth variable. For small samples or event-by-event predictions, stochastic fluctuations are material and the deterministic curve should not be read as an exact trajectory of the observed count.

## Mathematical family

Let \(x=N\) and \(k=\lambda\). Then

\[
-\frac{dN}{dt}=\lambda N
\qquad\Longleftrightarrow\qquad
\frac{dx}{dt}=-kx.
\]

Because \(\lambda>0\), this occurrence belongs to [first-order linear decay](../families/first-order-linear-decay.md) without changing the family sign convention.

## Evidence

- [OpenStax University Physics Volume 3, §10.3](https://openstax.org/books/university-physics-volume-3/pages/10-3-radioactive-decay) gives the differential law \(-dN/dt=\lambda N\) and its exponential solution.
- [OpenStax Physics, §22.3](https://openstax.org/books/physics/pages/22-3-half-life-and-radiometric-dating) makes the statistical interpretation explicit, including that nuclear decay is a statistical process and that the half-life law describes large populations approximately.
