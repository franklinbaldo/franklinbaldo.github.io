---
type: science-atlas-run
date: "2026-09-23"
mode: "frontier completion + equivalence audit"
summary: "Close the explicit astronomy-specific coverage gap with a sourced Kepler third-law occurrence, verify equivalent parameterizations, and reject an invalid link to the existing first-order decay family."
updated: "2026-09-23"
---

# Kepler / Astronomy run — 2026-09-23

## Starting state

This run reconstructed state from `main` at `4ebae06cca3f147761cea67875bd330c17c52686`, `docs/science-equation-atlas-routine.md`, and the canonical Markdown under `knowledge/science-equations/`. No transient frontier state was imported from an earlier agent run.

The latest canonical run explicitly left **an astronomy-specific occurrence** open. The existing [Physics and Astronomy](../branches/physics.md) card also said that astronomy had not yet been sampled, making this a small, directly verifiable frontier unit rather than a new taxonomy invented for this run.

Repository search found no existing Kepler-third-law formula card or astronomy-specific branch in the atlas. The current formula inventory contained eight occurrences and one equation-family card; the only normalized family was scalar first-order linear decay.

## Prior art and technical sources consulted

- [OpenAlex](https://openalex.org/) topic records place **Astronomy and Astrophysics** under the **Physics and Astronomy** field and **Physical Sciences** domain.
- [OpenStax Astronomy 2e, §3.1](https://openstax.org/books/astronomy-2e/pages/3-1-the-laws-of-planetary-motion) states Kepler's third law in the astronomical form `P^2 ∝ a^3`, defines orbital period and semimajor axis, and gives `P^2 = a^3` when period is measured in years and distance in AU for solar orbits.
- [OpenStax University Physics Volume 1, §13.5](https://openstax.org/books/university-physics-volume-1/pages/13-5-keplers-laws-of-planetary-motion) gives the Newtonian form `T^2 = (4π^2/GM)a^3` for an orbit about a large mass.
- [NASA, “Kepler and His Laws”](https://pwg.gsfc.nasa.gov/stargaze/Skeplaws.htm) gives the equivalent historical parameterization `T^2 = k a^3` and notes a common `k` for the planets in fixed units.

## Added

- [Astronomy and Astrophysics](../branches/astronomy-astrophysics.md) as an OpenAlex subfield under Physics and Astronomy.
- [Kepler's third law](../formulas/kepler-third-law.md), preserving the OpenStax Astronomy source notation:

\[
P^{2}\propto a^{3}.
\]

The new graph edges are ordinary Markdown links between the field, subfield and formula cards. No atlas state was added to the Astro/TypeScript projection.

## Equivalence tests

The source forms

\[
P^{2}\propto a^{3},
\qquad
T^{2}=k a^{3},
\qquad
T^{2}=\frac{4\pi^{2}}{GM}a^{3}
\]

represent the same proportional structure only after their conditions are made explicit: the central gravitating system and units are fixed, and in the Newtonian form `k = 4π^2/(GM)` for a negligible orbiting mass. The solar-system convention `P^2=a^3` is therefore a unit-normalized special representation, not a universal dimensionless identity.

For positive variables,

\[
P=\sqrt{k}\,a^{3/2}
\]

is algebraically equivalent to `P^2=k a^3`; it remains the same occurrence and was not split into another card.

The existing atlas family `dx/dt=-kx` is a first-order differential equation. Kepler's third law is a static algebraic relation between period and semimajor axis. Renaming variables, rescaling constants or choosing astronomical units cannot change the operator order, so **no `equation-family` link was added**.

## Audit of existing knowledge

The [Physical Sciences](../branches/physical-sciences.md) and [Physics and Astronomy](../branches/physics.md) cards contained a deliberately honest but now stale statement that no astronomy-specific occurrence existed. This run replaced that statement with explicit links to the new subfield while retaining the stable `physics.md` filename. No scientific claim or historical source was silently rewritten.

## Rejected / deferred

- No generic power-law family was created from the Kepler and Cobb-Douglas occurrences without a demonstrated cross-domain abstraction useful enough to justify a family node.
- No claim was made that Kepler's law is exact for arbitrary multi-body astronomical systems; perturbations and mass assumptions remain explicit.
- Diffusion/PDE and oscillatory equation families remain high-value structural frontiers for later runs.

## OKF and blog validation

The normative repository gate uses the pinned parser:

```sh
uv run --with 'git+https://github.com/franklinbaldo/okf-parser@e8ed6bbd93846a40ac17a0be88c658020e85443a' \
  okf-parser check knowledge/science-equations \
  --require-spec ../../specs/okf-types/{slug}.md \
  --normative-spec
```

This run relies on that `okf-parser` gate as the parser-level validation of the Markdown OKF bundle, plus the repository's normal PR checks. The run is not complete unless those checks pass before squash merge.
