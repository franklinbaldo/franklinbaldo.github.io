---
type: science-atlas-run
date: "2026-09-23"
mode: "breadth expansion + location-scale equivalence test + source audit"
summary: "Extend the atlas into Statistics and Probability with the normal density, repair the missing Physical Sciences taxonomy layer, and strengthen the Newton-cooling evidence."
updated: "2026-09-23"
---

# Normal distribution run — 2026-09-23

The reconstructed frontier after the logistic-growth run still lacked probability/statistics. This run advances that single frontier while also fixing one taxonomy inconsistency exposed by the new path.

## Prior art and technical sources consulted

- Current OpenAlex topic records place **Statistics and Probability** under **Mathematics**, within the **Physical Sciences** domain. The existing atlas already used OpenAlex as a taxonomy seed but had attached Physics, Chemistry and Engineering directly to the root while Life Sciences used an explicit domain node.
- [NIST/SEMATECH e-Handbook of Statistical Methods, Normal Distribution](https://www.itl.nist.gov/div898/handbook/eda/section3/eda3661.htm) gives the general and standard normal probability-density formulas and identifies their location and scale parameters.
- [OpenStax Calculus Volume 1, §6.8](https://openstax.org/books/calculus-volume-1/pages/6-8-exponential-growth-and-decay) states Newton's law of cooling and explicitly performs the temperature-excess substitution used by the atlas's existing first-order-decay family edge.

## Added

- [Physical Sciences](../branches/physical-sciences.md) as the missing OpenAlex domain layer for the atlas's existing physics, chemistry and engineering branches.
- [Mathematics](../branches/mathematics.md) and [Statistics and Probability](../branches/statistics-probability.md) as the path into the selected frontier.
- [Normal distribution probability density](../formulas/normal-distribution-density.md), preserving NIST's general location-scale notation.

The root now links to domain-level Physical Sciences and Life Sciences rather than mixing one domain with several physical-science fields.

## Equivalence test

For the general normal density

\[
f(x)=\frac{e^{-(x-\mu)^2/(2\sigma^2)}}{\sigma\sqrt{2\pi}},
\]

set \(z=(x-\mu)/\sigma\). With

\[
\phi(z)=\frac{e^{-z^2/2}}{\sqrt{2\pi}},
\]

we obtain

\[
f(x)=\frac{1}{\sigma}\phi\!\left(\frac{x-\mu}{\sigma}\right).
\]

This verifies a location-scale transformation between the general and standard normal forms. The \(1/\sigma\) Jacobian factor is essential, so this is stronger than a simple variable rename. No equation-family link was added because the current atlas has no cross-domain probability-density family whose abstraction would earn its cost.

## Audit

The Newton-cooling card previously relied on a Khan Academy article. It has been upgraded to OpenStax Calculus Volume 1 §6.8, which not only states the differential equation but independently reproduces the same substitution \(y=T-T_a\) and reduction to \(y'=-ky\). The formula's status is now `audited`; its scientific notation and family edge are unchanged.

The new Physical Sciences domain also makes a pre-existing taxonomy asymmetry explicit. This run does **not** silently rename the existing `Physics` card to OpenAlex's exact field label `Physics and Astronomy`; that is recorded as a future taxonomy audit question.

## Rejected / deferred

- No `equation-family` card was created merely to connect the general and standard normal density.
- No claim was made that normality is justified for arbitrary data; the formula card explicitly treats normality as a modeling assumption.
- The atlas did not expand into neighboring probability distributions in the same run.

## Frontier

The atlas now samples probability/statistics but still lacks diffusion/PDE and oscillatory families, and it has not yet sampled Health Sciences or Social Sciences. A separate taxonomy audit should decide whether the existing `Physics` label should be aligned to OpenAlex's `Physics and Astronomy` field or intentionally remain a narrower authored branch.
