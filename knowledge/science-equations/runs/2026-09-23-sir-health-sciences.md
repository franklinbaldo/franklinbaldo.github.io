---
type: science-atlas-run
date: "2026-09-23"
mode: "breadth expansion + nonlinear equivalence rejection + taxonomy audit"
summary: "Sample Health Sciences through Medicine and Epidemiology with the normalized SIR model, reject a false first-order-decay family edge, and align the Physics field label with current OpenAlex taxonomy."
updated: "2026-09-23"
---

# SIR / Health Sciences run — 2026-09-23

The state was reconstructed from `main`, the routine, the current bundle, and the recent run records before choosing work. The corpus already sampled Physical Sciences and Life Sciences, while the most recent run explicitly left **Health Sciences** and **Social Sciences** unsampled. This run advances one of those broad gaps rather than drilling further into a represented physical-science branch.

## Prior art and technical sources consulted

- [OpenAlex Domains](https://help.openalex.org/data/domains/) documents the current four-domain hierarchy and names **Health Sciences** as a top-level domain.
- [OpenAlex Fields](https://help.openalex.org/data/fields/) documents the four-level hierarchy `domain → field → subfield → topic`, including **Medicine** and **Physics and Astronomy** among the standardized field labels. Current OpenAlex topic records place the **Epidemiology** subfield under Medicine in Health Sciences.
- [Heng & Althaus, Scientific Reports 10, 19365 (2020)](https://www.nature.com/articles/s41598-020-76563-8) gives the normalized SIR equations used here, states `S+I+R=1`, and identifies `β=R₀γ`.
- [Kermack & McKendrick (1927), A Contribution to the Mathematical Theory of Epidemics](https://royalsocietypublishing.org/doi/10.1098/rspa.1927.0118) is the historical prior art for this compartmental epidemic tradition.
- [Wolfram MathWorld, Kermack–McKendrick Model](https://mathworld.wolfram.com/Kermack-McKendrickModel.html) independently characterizes the model as three coupled nonlinear ODEs and summarizes its simplifying assumptions.

## Added

- [Health Sciences](../branches/health-sciences.md) as the previously absent OpenAlex domain.
- [Medicine](../branches/medicine.md) and [Epidemiology](../branches/epidemiology.md) as the path to the selected occurrence.
- [SIR epidemic model](../formulas/sir-epidemic-model.md), preserving the normalized fraction notation of the cited Scientific Reports source:

\[
\begin{aligned}
\frac{dS}{dt}&=-\beta IS,\\
\frac{dI}{dt}&=\beta IS-\gamma I,\\
\frac{dR}{dt}&=\gamma I.
\end{aligned}
\]

The root now links to Health Sciences directly through Markdown; the UI and graph remain projections of those links.

## Equivalence and consistency tests

Adding the three equations gives

\[
\frac{d}{dt}(S+I+R)=0,
\]

so the source's normalization `S+I+R=1` is dynamically preserved when true initially.

The tempting family match was the atlas's existing scalar first-order linear decay,

\[
\frac{dx}{dt}=-kx.
\]

For the infectious compartment,

\[
\frac{dI}{dt}=(\beta S(t)-\gamma)I.
\]

This only has a constant scalar coefficient if `S` is frozen externally. In the actual SIR system, `S` is a state variable obeying `dS/dt=-βIS`; the `IS` product makes the coupled vector field nonlinear. Therefore the full SIR dynamics are **not** equivalent to the existing first-order linear-decay family by equality, variable renaming, or constant reparameterization. No family edge was added.

A frozen-`S` or early-epidemic linearization may produce local exponential growth or decay, but that is an approximation/linearization, not an equivalence of the full model.

## Audit

The previous run left an explicit taxonomy question: the existing `Physics` card used OpenAlex's `Physics and Astronomy` as its taxonomy source while retaining the narrower authored label. This run resolves that mismatch by changing the card's displayed name/title and its parent link to **Physics and Astronomy**, the current standardized OpenAlex field label. The stable filename `physics.md` is retained to avoid link churn. No physics formula or equation-family relation changed, and the card explicitly says that astronomy-specific formula coverage is still absent.

## Rejected / deferred

- No `equation-family` card was created for compartmental dynamics from a single new occurrence.
- SIR was not connected to first-order linear decay merely because one component can look exponential after freezing another state variable.
- No claim was made that SIR is an adequate model for arbitrary epidemics; its simplifying assumptions are recorded on the formula card.
- Social Sciences, diffusion/PDE, oscillatory families, and an astronomy-specific occurrence remain open breadth frontiers.

## Validation

Validation is performed with the repository's pinned `okf-parser` command and the normal blog gates before merge. Final gate results are recorded in the pull request and merge history rather than being asserted in advance here.
