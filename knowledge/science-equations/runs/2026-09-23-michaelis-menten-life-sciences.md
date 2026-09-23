---
type: science-atlas-run
date: "2026-09-23"
mode: "Life Sciences breadth expansion + saturation-equivalence audit"
summary: "Add a sourced Michaelis–Menten occurrence under a new OpenAlex Life Sciences field, test its dimensionless and limiting forms without inventing differential-family edges, and audit the statistical scope of radioactive decay."
updated: "2026-09-23"
---

# Michaelis–Menten / Life Sciences run — 2026-09-23

## Starting state

This execution first reread `docs/science-equation-atlas-routine.md` and reconstructed the Atlas from current `main` and the canonical Markdown OKF bundle under `knowledge/science-equations/`. At reconciliation time `main` was `5d81754ba3693751d7c069d7f10ac0bfb76aa166`; its parent `ec7c953aa915bca512fc42104a6c757f9172e9fb` was the latest Atlas merge, adding the independently verified LC/harmonic-oscillator family.

The current bundle contained 21 taxonomy branch cards, 12 formula occurrences, 2 equation-family cards and 9 prior run records. Life Sciences still had only one sampled OpenAlex field (`Agricultural and Biological Sciences`), so breadth remained materially thinner there than in Physical Sciences.

Repository inspection found an already-open PR, #2147, attempting the same Michaelis–Menten frontier from an older Atlas base. This run did not duplicate it: the branch was audited, rebuilt on current `main`, and its claims were refreshed against the two-family current corpus before validation.

## Prior art and technical sources consulted

- OpenAlex topic metadata was checked for the hierarchy **Biochemistry, Genetics and Molecular Biology → Life Sciences**.
- [IUPAC Gold Book: Michaelis–Menten equation](https://goldbook.iupac.org/terms/view/11546) supplies the modern technical definition and source notation

  \[
  v_0=\frac{V[S]_0}{K_{\mathrm{M}}+[S]_0}.
  \]

  IUPAC also states that \(V\) and \(K_{\mathrm{M}}\) are independent of initial substrate concentration and constant at a given temperature and enzyme concentration, and that \(K_{\mathrm{M}}\) is the substrate concentration at which \(v_0=V/2\).
- [Johnson & Goody (2011), *The Original Michaelis Constant: Translation of the 1913 Michaelis-Menten Paper*](https://pmc.ncbi.nlm.nih.gov/articles/PMC3381512/) was checked for historical prior art, including the richer scope of the 1913 paper and earlier work by Henri.
- [OpenStax University Physics Volume 3, §10.3](https://openstax.org/books/university-physics-volume-3/pages/10-3-radioactive-decay) and [OpenStax Physics, §22.3](https://openstax.org/books/physics/pages/22-3-half-life-and-radiometric-dating) were revisited for the required audit of older knowledge.

## Added

- [Biochemistry, Genetics and Molecular Biology](../branches/biochemistry-genetics-molecular-biology.md) as a second sampled Life Sciences field, linked from [Life Sciences](../branches/life-sciences.md).
- [Michaelis–Menten equation](../formulas/michaelis-menten-equation.md), preserving the IUPAC notation

  \[
  v_0=\frac{V[S]_0}{K_{\mathrm{M}}+[S]_0}.
  \]

No new `equation-family` card was created.

## Structural and equivalence tests

### Dimensionless rescaling

Let

\[
s=\frac{[S]_0}{K_{\mathrm{M}}},
\qquad
\nu=\frac{v_0}{V}.
\]

For \(K_{\mathrm{M}}>0\) and \(V\ne0\), substitution gives

\[
\nu=\frac{s}{1+s}.
\]

This is an explicit rescaling of the same relation, not a replacement for the scientific notation. It yields \(\nu=1/2\) at \(s=1\) and \(\nu\to1\) as \(s\to\infty\).

### Low-substrate limit

For \([S]_0\ll K_{\mathrm{M}}\),

\[
v_0\approx\frac{V}{K_{\mathrm{M}}}[S]_0.
\]

This is a controlled first-order **rate approximation** in substrate concentration. It is not itself a first-order decay evolution law.

### Current-family rejection

The first current family is

\[
\frac{dx}{dt}=-kx,\qquad k>0.
\]

Michaelis–Menten as defined by IUPAC is an algebraic initial-rate relation. Obtaining substrate-depletion dynamics requires an added modeling statement such as \(-d[S]/dt=v\) plus assumptions that let the rate law be used as \([S]\) changes. Only after that augmentation and in the low-substrate limit does an approximate first-order decay law appear. Those steps are not an invertible equivalence, so no decay-family edge is created.

The second current family is the undamped linear harmonic oscillator,

\[
\frac{d^2x}{dt^2}+\omega^2x=0.
\]

Its second-order periodic dynamics are likewise not equivalent to a static rate-versus-concentration hyperbola. No oscillator-family edge is created.

A generic saturating-hyperbola family remains deferred until another independent occurrence makes the abstraction testable and useful.

## Audit / corrected knowledge

The existing [Radioactive decay law](../formulas/radioactive-decay.md) had the correct equation and family link, but its prose did not clearly bound the smooth ODE against the discrete stochastic process for individual nuclei.

OpenStax explicitly describes nuclear decay as statistical and notes that the half-life law is realized approximately for reasonably large populations. The card is therefore upgraded from `normalized` to `audited`, distinguishes population-level exponential behavior from event-level randomness, and makes its family transformation explicit:

\[
-\frac{dN}{dt}=\lambda N
\quad\Longleftrightarrow\quad
\frac{dx}{dt}=-kx,
\qquad x=N,\;k=\lambda>0.
\]

Markdown links remain the canonical graph state. No UI or generated graph projection was edited.

## Rejected / deferred

- No equation-family edge between Michaelis–Menten and first-order linear decay.
- No equation-family edge between Michaelis–Menten and the undamped harmonic oscillator.
- No generic `saturating-hyperbola` family from a single occurrence.
- No narrower enzymology branch without a separately justified taxonomy edge.
- No simplistic priority claim that erases Henri or reduces the 1913 paper to the modern one-line equation.

## Files changed

- `knowledge/science-equations/branches/life-sciences.md`
- `knowledge/science-equations/branches/biochemistry-genetics-molecular-biology.md`
- `knowledge/science-equations/formulas/michaelis-menten-equation.md`
- `knowledge/science-equations/formulas/radioactive-decay.md`
- `knowledge/science-equations/runs/2026-09-23-michaelis-menten-life-sciences.md`
- `changelog/changes/2026-09-23-science-equation-atlas-michaelis-menten.md`

## Frontier left by the corpus

Life Sciences now has two sampled fields but remains sparse. A future run can reconstruct the next unit from the then-current bundle. One mathematically interesting deferred question is whether a second independently sourced saturation law justifies a cross-domain saturating-response family; it should not be promoted before that second occurrence exists.

## Validation

The normative Atlas gate uses the repository-pinned parser invocation:

```sh
uv run --with 'git+https://github.com/franklinbaldo/okf-parser@e8ed6bbd93846a40ac17a0be88c658020e85443a' \
  okf-parser check knowledge/science-equations \
  --require-spec ../../specs/okf-types/{slug}.md \
  --normative-spec
```

The PR must also pass the normal blog checks, internal-link checks, Astro type checking, build/Lighthouse, change-card and visual-evidence policy gates, and secret scanning before squash merge. A failing required gate remains a reproducible blocker rather than being papered over.
