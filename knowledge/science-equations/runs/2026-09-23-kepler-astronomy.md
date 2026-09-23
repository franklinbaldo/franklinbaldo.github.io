---
type: science-atlas-run
date: "2026-09-23"
mode: "astronomy breadth completion + unit/equivalence audit"
summary: "Add an explicit Astronomy and Astrophysics branch and a sourced solar-system form of Kepler's third law, while correcting stale coverage text and rejecting premature family links."
updated: "2026-09-23"
---

# Kepler / Astronomy run — 2026-09-23

## Starting state

This execution reread `docs/science-equation-atlas-routine.md` and reconstructed the Scientific Equation Atlas from the canonical Markdown OKF bundle on `main`, rather than carrying transient state from an earlier run. The first current-head inspection in this execution saw `25dd63c78a593dcfbc219b7eec7ff0e0068a7df2`; before validation the atlas branch was rebuilt on `8d0c342a8eb5ade62d2a2f09a754d9a9a9c3f93e`. While those checks ran, unrelated ToE work advanced `main` to `c3150ce24a09fd1234644e4123a4f67a954bc3a1`, so the branch was synchronized again before the final merge gate. None of those intervening commits changed `knowledge/science-equations/`.

At the reconstructed atlas state the bundle contained 20 taxonomy branch cards, 8 formula occurrences, 1 equation-family card and 5 prior run records. The immediately preceding run had closed the top-level Social Sciences breadth gap and explicitly left an **astronomy-specific occurrence** as an open frontier. The existing `physical-sciences.md` and `physics.md` cards also said that astronomy had not yet been sampled, making this a small frontier whose completion could be checked directly against the source-of-truth Markdown.

Repository inspection found no Kepler-third-law formula card or astronomy-specific branch on `main`. Two concurrent open PRs had independently attempted this same frontier; this execution reconciles them rather than creating a third copy, preserving the more explicit unit/equivalence treatment and closing the duplicate after synchronization.

## Prior art and technical sources consulted

- [OpenAlex](https://openalex.org/) topic records place **Astronomy and Astrophysics** under the field **Physics and Astronomy**, in the **Physical Sciences** domain.
- [OpenStax Astronomy, §3.1](https://openstax.org/books/astronomy/pages/3-1-the-laws-of-planetary-motion) states Kepler's third law as `P^2 ∝ a^3`, then gives `P^2 = a^3` when period is measured in Earth years and semimajor axis in AU.
- [NASA Science, "Orbits and Kepler's Laws"](https://science.nasa.gov/solar-system/orbits-and-keplers-laws/) independently presents the solar-system relation as `p^2 = a^3` and records the historical 1619 publication of the third law.
- [OpenStax University Physics, §13.5](https://openstax.org/books/university-physics-volume-1/pages/13-5-keplers-laws-of-planetary-motion) gives the Newtonian large-central-mass relation `T^2 = 4π^2 a^3/(GM)`, exposing the coefficient suppressed by the solar-system unit normalization.

## Added

- [Astronomy and Astrophysics](../branches/astronomy-astrophysics.md) as an OpenAlex subfield under [Physics and Astronomy](../branches/physics.md).
- [Kepler's third law](../formulas/kepler-third-law.md), preserving the OpenStax solar-system notation

\[
P^2=a^3.
\]

The formula card records the required unit conditions rather than presenting the coefficient-one form as universal.

## Structural and equivalence tests

For physical orbits \(P>0\) and \(a>0\),

\[
P^2=a^3 \iff P=a^{3/2}.
\]

So the two displayed forms are algebraically equivalent only after choosing the positive square root appropriate to orbital periods.

A units check shows why the coefficient-one equality must carry its conditions. If \(P'=c_P P\) and \(a'=c_a a\), then

\[
(P')^2=\frac{c_P^2}{c_a^3}(a')^3.
\]

The OpenStax Newtonian relation further shows that for a body orbiting a large mass \(M\),

\[
T^2=\frac{4\pi^2}{GM}a^3.
\]

Thus the unit-normalized solar-system occurrence is a valid specialized representation, not a universal identity whose coefficient can be silently discarded.

### Family-edge tests

The atlas's existing family \(dx/dt=-kx\) is a first-order differential law. Kepler's third law is a static algebraic scaling relation, so variable renaming, rescaling or rearrangement cannot make the operator structures equivalent. No edge was added.

A second probe compared Kepler's \(P=a^{3/2}\) with the existing Cobb-Douglas monomial. Fixing one Cobb-Douglas input and choosing a particular exponent can manufacture a one-variable power law, but this is a specialization with added constraints rather than an invertible equivalence between the scientific occurrences. A possible future monomial/power-law family remains a hypothesis until the corpus has enough independent occurrences to justify it.

## Audit / corrected knowledge

The run found a real stale-knowledge opportunity created by the frontier itself: both [Physical Sciences](../branches/physical-sciences.md) and [Physics and Astronomy](../branches/physics.md) explicitly said that no astronomy-specific occurrence existed. Those statements were correct before this run but would become false after adding Kepler. They were updated in the same commit, without changing the taxonomy labels or moving canonical state into the UI projection.

## Rejected / deferred

- No generic `power-law` or `monomial` equation-family card was created from the Kepler/Cobb-Douglas resemblance alone.
- The sourced `P^2=a^3` notation was not replaced by the Newtonian generalization; the latter is recorded as scope/equivalence context.
- Diffusion/PDE and oscillatory families remain open frontiers.

## Validation

The bundle is validated through the repository's normative OKF gate with the pinned parser command:

```sh
uv run --with 'git+https://github.com/franklinbaldo/okf-parser@e8ed6bbd93846a40ac17a0be88c658020e85443a' \
  okf-parser check knowledge/science-equations \
  --require-spec ../../specs/okf-types/{slug}.md \
  --normative-spec
```

The same pull request also runs the normal blog checks, build/Lighthouse, link checks and repository policy gates. This run is complete only if those checks pass on a branch synchronized with the current `main` and the PR is squash-merged.
