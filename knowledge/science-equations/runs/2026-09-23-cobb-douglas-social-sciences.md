---
type: science-atlas-run
date: "2026-09-23"
mode: "breadth expansion + structural equivalence audit"
summary: "Sample the previously absent Social Sciences domain through Economics and Econometrics with a sourced Cobb-Douglas production-function occurrence, verify constant returns, and reject an invalid differential-equation family edge."
updated: "2026-09-23"
---

# Cobb-Douglas / Social Sciences run — 2026-09-23

## Starting state

The run reconstructed the atlas from the canonical Markdown bundle on `main` rather than carrying state from an earlier execution. The initial inspected head was `a3e2d8c5d84b4b1d7250a66b0112ef8c7fa314ff`; while the run was in progress, unrelated work advanced `main`. Before final validation, this branch was rebuilt on `fdfdc55f7731a4749e16ed15ccefa3fbf475b17f`, the then-current head, satisfying the repository's strict up-to-date rule without changing the atlas analysis.

At the initial inspected state the bundle contained 17 taxonomy branch cards, 7 formula occurrences, 1 equation-family card and 4 prior run records. The latest run record explicitly left **Social Sciences** unsampled. OpenAlex's current hierarchy has four top-level domains; the root already linked Physical Sciences, Life Sciences and Health Sciences, so Social Sciences was the smallest high-value breadth gap.

Repository prior-art search found no existing Cobb-Douglas card or production-function occurrence in the atlas.

## Prior art and technical sources consulted

- [OpenAlex Domains](https://help.openalex.org/data/domains/) documents the four-domain hierarchy and names **Social Sciences** as a top-level domain.
- [OpenAlex Fields](https://help.openalex.org/data/fields/) documents the hierarchy `domain → field → subfield → topic`; current OpenAlex topic records place economics work under **Economics and Econometrics**, within **Economics, Econometrics and Finance**, in Social Sciences.
- [Humphrey, Federal Reserve Bank of Richmond Economic Quarterly 83(1), 1997](https://fraser.stlouisfed.org/files/docs/publications/frbrichreview/rev_frbrich199701.pdf) gives the two-factor form `P=bL^kC^(1-k)`, states that it has constant returns to scale, and provides historical context on production functions before Cobb and Douglas.
- [Cobb & Douglas, "A Theory of Production," American Economic Review 18(1), 1928](https://www.jstor.org/stable/1811556) is the canonical historical paper associated with the empirical Cobb-Douglas specification.

## Added

- [Social Sciences](../branches/social-sciences.md) as the fourth OpenAlex domain.
- [Economics, Econometrics and Finance](../branches/economics-econometrics-finance.md) and [Economics and Econometrics](../branches/economics-econometrics.md) as the path to the selected occurrence.
- [Cobb-Douglas production function](../formulas/cobb-douglas-production.md), preserving the reference source's notation:

\[
P=bL^{k}C^{1-k}.
\]

The root's new Social Sciences link is canonical Markdown; no atlas state was duplicated into the Astro/TypeScript projection.

## Structural and equivalence tests

Writing \(F(L,C)=bL^kC^{1-k}\), for \(\lambda>0\),

\[
F(\lambda L,\lambda C)
=\lambda^{k+1-k}F(L,C)
=\lambda F(L,C),
\]

which verifies the source's constant-returns-to-scale statement for this exact parameterization.

For positive variables, taking logarithms gives

\[
\log P=\log b+k\log L+(1-k)\log C.
\]

That is an algebraically equivalent representation on the positive domain, not a new occurrence or equation-family edge.

The only current atlas family is scalar first-order linear decay, \(dx/dt=-kx\). Cobb-Douglas is a static algebraic map in two inputs and has no time derivative. Variable renaming, constant rescaling and constant reparameterization cannot change that operator structure, so the occurrence is **not equivalent** to the existing family and no family link was added.

## Rejected / deferred

- No generic "power law" or Cobb-Douglas equation-family card was created from a single economics occurrence.
- Later variants such as \(Y=AK^\alpha L^\beta\) with unconstrained \(\alpha+\beta\) were not silently substituted for the sourced constant-returns form.
- The eponym was not treated as a priority claim; the cited historical review documents related work by Thünen and Wicksell before 1928.
- Diffusion/PDE, oscillatory families and an astronomy-specific occurrence remain open frontiers now that all four OpenAlex domains have at least one atlas path.

## Validation

The repository's normative OKF gate uses the pinned parser command:

```sh
uv run --with 'git+https://github.com/franklinbaldo/okf-parser@e8ed6bbd93846a40ac17a0be88c658020e85443a' \
  okf-parser check knowledge/science-equations \
  --require-spec ../../specs/okf-types/{slug}.md \
  --normative-spec
```

Normal blog checks and the parser gate are run by the pull-request workflows before merge. Their final results are recorded in the PR/check history; this run is not considered complete unless those gates pass.
