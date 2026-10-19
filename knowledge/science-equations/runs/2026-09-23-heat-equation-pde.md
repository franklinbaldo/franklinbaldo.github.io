---
type: science-atlas-run
date: "2026-09-23"
mode: "diffusion/PDE frontier + operator-equivalence audit"
summary: "Add the sourced one-dimensional heat equation, distinguish full-PDE structure from first-order modal decay, and refresh the thermodynamics branch without inventing a diffusion family."
updated: "2026-09-23"
---

# Heat equation / diffusion-PDE run — 2026-09-23

## Starting state

This execution first reread `docs/science-equation-atlas-routine.md` and reconstructed the Atlas from `main` and the canonical Markdown OKF bundle under `knowledge/science-equations/`. The branch was created from `main` at `ed7fa3f9da5884d307b93ec54e281838ab3989ff` (`atlas: add Kepler astronomy occurrence (#2131)`). No transient frontier state from earlier automation turns was used.

At that reconstructed head the bundle contained 21 taxonomy branch cards, 9 formula occurrences, 1 equation-family card and 6 prior run records. The immediately preceding run explicitly left **diffusion/PDE** and **oscillatory families** as open frontiers. Repository inspection found no heat-equation formula card, and the open-PR inspection found no active Atlas PR to continue, so this execution selected the diffusion/PDE frontier as the next small unit.

The existing [Thermodynamics and heat transfer](../branches/thermodynamics.md) card contained only Newton's law of cooling. Adding one distributed thermal model there advances the frontier without creating another taxonomy level or changing UI projection code.

## Prior art and technical sources consulted

- [OpenStax Calculus Volume 3, §4.3 Partial Derivatives](https://openstax.org/books/calculus-volume-3/pages/4-3-partial-derivatives) gives the one-dimensional heat equation exactly as `u_t = c^2 u_xx`, identifies `c^2` as thermal diffusivity, and supplies separated modes `u_m(x,t)=e^{-π²m²c²t} sin(mπx)`.
- [Wolfram MathWorld, "Heat Conduction Equation"](https://mathworld.wolfram.com/HeatConductionEquation.html) independently catalogs the diffusion form `U_t = κ∇²U`, its one-dimensional specialization `U_t = κU_xx`, and the separation-of-variables reduction.
- [EqWorld, Partial Differential Equations index](https://eqworld.ipmnet.ru/en/solutions/eqindex/eqindex-pde.htm) catalogs heat/diffusion PDEs with distinct anisotropic, linear, nonlinear and source-bearing variants. This was used as prior-art evidence against prematurely collapsing all of those structures into one Atlas family.
- [Wolfram Formula Repository, "Fourier's Law"](https://resources.wolframcloud.com/FormulaRepository/resources/Fouriers-Law) was checked as neighboring formula prior art for conductive heat transfer; it represents the flux-gradient law rather than the same time-evolution PDE.

## Added

- [Heat equation](../formulas/heat-equation.md) under [Thermodynamics and heat transfer](../branches/thermodynamics.md), preserving the OpenStax source notation

\[
u_t=c^2u_{xx}.
\]

No `equation-family` link was added.

## Structural and equivalence tests

### Notation-equivalent diffusion form

Starting from the standard one-dimensional constant-coefficient notation

\[
\frac{\partial u}{\partial t}=\kappa\frac{\partial^2u}{\partial x^2},
\]

use the derivative shorthands `u_t = ∂u/∂t`, `u_xx = ∂²u/∂x²`, and substitute `κ=c²`. The result is exactly

\[
u_t=c^2u_{xx}.
\]

This confirms a notation/parameter equivalence with the MathWorld one-dimensional diffusion form while leaving the OpenStax notation unchanged in the occurrence card.

### Existing-family rejection

The Atlas's only current equation family is scalar first-order linear decay,

\[
\frac{dx}{dt}=-kx.
\]

The heat equation instead evolves a field \(u(x,t)\) through a second spatial derivative. No variable renaming, constant rescaling or algebraic rearrangement removes that differential-operator structure, so the full PDE is not equivalent to the existing family.

OpenStax's displayed separated mode does expose a narrower relationship. If

\[
u_m(x,t)=a_m(t)\sin(m\pi x),
\qquad a_m(t)=e^{-\pi^2m^2c^2t},
\]

then direct differentiation gives

\[
\frac{da_m}{dt}=-\pi^2m^2c^2a_m.
\]

Thus a modal amplitude obeys the decay family with \(k=\pi^2m^2c^2\). This depends on a chosen separated spatial mode and its associated domain/boundary assumptions. It is a derived representation of a solution component, not an invertible equivalence of the original PDE, so it does **not** justify a family edge from the heat-equation occurrence.

## Audit / corrected knowledge

The [Thermodynamics and heat transfer](../branches/thermodynamics.md) summary was stale as soon as this frontier was added: it described only Newton cooling as the branch's bootstrap corpus. The branch now explicitly lists both the lumped cooling ODE and the distributed heat PDE and records why exponential modal decay does not collapse them into one equation family.

Markdown links remain the canonical relations. No graph/UI projection was edited directly.

## Rejected / deferred

- No generic `diffusion`, `heat`, or `linear-PDE` equation-family card was created from one occurrence.
- The source's `c²` notation was not normalized away to `κ` or `α`; those symbols appear only in the equivalence discussion.
- Modal exponential decay was not promoted into an occurrence-level family edge.
- Oscillatory equations remain an open frontier for a later run reconstructed from then-current `main`.

## Files changed

- `knowledge/science-equations/formulas/heat-equation.md`
- `knowledge/science-equations/branches/thermodynamics.md`
- `knowledge/science-equations/runs/2026-09-23-heat-equation-pde.md`

## Validation

The bundle is validated through the repository's normative OKF gate with the parser version pinned by the repository:

```sh
uv run --with 'git+https://github.com/franklinbaldo/okf-parser@e8ed6bbd93846a40ac17a0be88c658020e85443a' \
  okf-parser check knowledge/science-equations \
  --require-spec ../../specs/okf-types/{slug}.md \
  --normative-spec
```

The same pull request runs the normal blog checks, build/Lighthouse, link checks and repository policy gates. This run is complete only after those checks are green on a branch synchronized with the current `main` and the PR is squash-merged. Any failing gate must remain as reproducible evidence rather than being reported as a successful result.
