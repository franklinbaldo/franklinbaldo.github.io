---
type: science-atlas-run
date: "2026-09-23"
mode: "cross-domain saturation-family verification + chemistry breadth + relation audit"
summary: "Add a sourced Langmuir adsorption occurrence, verify a normalized saturating-hyperbola family against Michaelis–Menten through explicit dimensionless transformations, and audit logistic growth against a tempting but false saturation-family edge."
updated: "2026-09-23"
---

# Langmuir / normalized saturation-family run — 2026-09-23

## Starting state

This execution first reread `docs/science-equation-atlas-routine.md` and reconstructed the current Atlas from `main`, the Markdown OKF bundle under `knowledge/science-equations/`, the equation-family cards, and the recent run records. The current corpus had two verified equation families: first-order linear decay and the undamped linear harmonic oscillator. The immediately preceding Life Sciences run had added Michaelis–Menten and explicitly deferred a generic saturation family until a second independent occurrence made that abstraction testable.

That deferred question was selected because it is now a small, verifiable frontier: a second scientific occurrence can either reproduce the same dimensionless algebraic structure or falsify the proposed family.

## Prior art and technical sources consulted

- OpenAlex topic metadata was checked for the hierarchy **Physical and Theoretical Chemistry → Chemistry → Physical Sciences**.
- [Murphy et al., *ACS Omega* 2023, DOI 10.1021/acsomega.2c08155](https://doi.org/10.1021/acsomega.2c08155) was used as the modern technical source for the Langmuir equilibrium isotherm, including the notation

  \[
  q_e=\frac{q_mK_LC_e}{1+K_LC_e},
  \]

  the meanings and units of the parameters, and the homogeneous/monolayer assumptions.
- [Langmuir, 1918, *The Adsorption of Gases on Plane Surfaces of Glass, Mica and Platinum*](https://doi.org/10.1021/ja02242a004) was checked as the foundational historical prior art.
- [IUPAC Gold Book: convex isotherm](https://goldbook.iupac.org/terms/view/CT06937) was checked for nomenclature context identifying the Langmuir adsorption isotherm as a special convex adsorption isotherm.
- The existing IUPAC-sourced [Michaelis–Menten equation](../formulas/michaelis-menten-equation.md) and OpenStax-sourced [logistic population growth](../formulas/logistic-population-growth.md) cards were reread before any graph edge was authored.

## Added

- [Physical and Theoretical Chemistry](../branches/physical-theoretical-chemistry.md) as a Chemistry subfield represented in the Atlas.
- [Langmuir adsorption isotherm](../formulas/langmuir-adsorption-isotherm.md), preserving the modern source notation above.
- [Normalized saturating hyperbola](../families/normalized-saturating-hyperbola.md), with canonical form

  \[
  y=\frac{x}{1+x},\qquad x\ge0.
  \]

## Explicit equivalence tests

### Langmuir occurrence

Define

\[
x=K_LC_e,
\qquad
y=\frac{q_e}{q_m}.
\]

For fixed positive \(K_L\) and \(q_m\), substitution gives

\[
y=\frac{x}{1+x}.
\]

The transformation is dimensionless and invertible on the physical nonnegative domain once the scale parameters are fixed.

### Michaelis–Menten occurrence

The existing card already established

\[
s=\frac{[S]_0}{K_{\mathrm M}},
\qquad
\nu=\frac{v_0}{V},
\qquad
\nu=\frac{s}{1+s}.
\]

With \(x=s\) and \(y=\nu\), Michaelis–Menten reaches the same canonical form. The two occurrences are physically independent—enzyme initial-rate kinetics versus equilibrium surface adsorption—so the shared edge records a mathematical family, not a shared mechanism.

This second independent occurrence is sufficient to make the abstraction useful rather than speculative. Both formula cards therefore link to the verified family through ordinary Markdown links.

## Audit / corrected boundary

The existing logistic population-growth card also uses saturation language, so it was audited specifically against the new family. Its governing equation is

\[
\frac{dP}{dt}=rP\left(1-\frac{P}{K}\right),
\]

which is a nonlinear first-order ODE for a trajectory. Bounded logistic solutions can approach \(K\), but that does not transform the governing equation into the algebraic response law \(y=x/(1+x)\). A particular solved trajectory or sigmoid representation is not an invertible equation-family equivalence to the source ODE.

The card was therefore promoted to `audited` with an explicit saturation-family rejection. No false edge was added.

## Rejected / bounded

- No claim that Langmuir adsorption and Michaelis–Menten enzyme kinetics share a physical mechanism.
- No edge from logistic population growth to the normalized saturating hyperbola merely because both exhibit bounded behavior.
- No edge from the new algebraic family to first-order linear decay or the harmonic oscillator.
- No claim that a numerical Langmuir fit proves homogeneous adsorption sites or monolayer mechanism.
- No replacement of the domain-specific source notation by the normalized canonical form; normalization exists only as an explicitly demonstrated family relation.

## Files changed

- `knowledge/science-equations/branches/chemistry.md`
- `knowledge/science-equations/branches/physical-theoretical-chemistry.md`
- `knowledge/science-equations/formulas/langmuir-adsorption-isotherm.md`
- `knowledge/science-equations/formulas/michaelis-menten-equation.md`
- `knowledge/science-equations/formulas/logistic-population-growth.md`
- `knowledge/science-equations/families/normalized-saturating-hyperbola.md`
- `knowledge/science-equations/runs/2026-09-23-langmuir-saturation-family.md`
- `changelog/changes/2026-09-23-science-equation-atlas-langmuir-saturation.md`

## Frontier left by the corpus

The Atlas now has three verified cross-domain mathematical families and a new Chemistry subfield occurrence. Future runs should reconstruct the then-current frontier from the bundle rather than treating any candidate here as mandatory. Useful open questions include whether other independently sourced algebraic response laws genuinely reduce to the same normalized family, and whether sparse fields still dominate breadth needs.

## Validation

The normative Atlas gate uses the repository-pinned `okf-parser` invocation:

```sh
uv run --with 'git+https://github.com/franklinbaldo/okf-parser@e8ed6bbd93846a40ac17a0be88c658020e85443a' \
  okf-parser check knowledge/science-equations \
  --require-spec ../../specs/okf-types/{slug}.md \
  --normative-spec
```

The repository workflow also runs the normal blog checks, internal-link checks, Astro type checking, build/Lighthouse, change-card and visual-evidence policy gates, and secret scanning. The PR is eligible for squash merge only after those gates are green.
