# ToE Arena scan — 2026-09-25 — Asymptotic Safety infrared screening

This incremental scan applies `franklinbaldo/skills/toe-arena-tiering`: scientific strength and interest are separate comparative judgements, never probabilities that a theory is true. A fresh paper only changes a tier when it materially changes empirical evidence, recovery, consistency, independent scrutiny, or a major blocking problem.

## Asymptotic Safety — A scientific / A interest, medium confidence — held

**Fresh source.** Vincenzo Branchina, Riccardo Gandolfo and Arcangelo Pernace, *Infrared Screening of the Cosmological Constant*, arXiv:2609.29979v1, posted **2026-09-24**: <https://arxiv.org/abs/2609.29979>.

**Proposal and result.** In an Einstein-Hilbert plus R-squared Wilsonian truncation of Euclidean gravity, the authors allow non-trivial large-amplitude saddles to govern the blocking step. For a broad basin of initial conditions, the dimensionless cosmological term approaches a universal infrared attractor and the dimensionful cosmological constant scales as the square of the RG scale. At the deepest present-day infrared scale, identified with the Hubble scale, this yields a cosmological constant of the observed order.

**Evidence for.** The paper attacks a genuinely load-bearing problem for quantum gravity rather than adding a decorative sector. It gives an analytic infrared attractor, supplements it with numerical RG trajectories, makes the basin-of-attraction condition explicit, and claims that vacuum-energy contributions from matter are screened along with the gravitational term. This materially expands the evidence surface for RG-based quantum gravity.

**Evidence against / uncertainty.** The calculation is a fresh preprint and is not an end-to-end solution of the cosmological-constant problem. It freezes the running Newton coupling and the R-squared coupling, uses a single transverse-traceless Fourier-mode saddle ansatz, and the attractor is conditional on the flow entering the non-trivial-saddle basin. Independent reproduction and extension to a less restricted truncation are required.

There is also an important scheme-control warning in the same research line. Branchina et al., *Path integral measure and RG equations for gravity*, Phys. Rev. D 111, 125021 (2025), found no non-Gaussian UV-attractive fixed point in their Einstein-Hilbert RG equations when treating the path-integral measure in their preferred way: <https://journals.aps.org/prd/abstract/10.1103/wqv2-j5dt>. A later preprint by the group, *Quantum gravity and spectral running cutoff* (arXiv:2606.16911, 2026-06-15), recovered the asymptotic-safety fixed-point pattern with a spectral cutoff: <https://arxiv.org/abs/2606.16911>. That history makes regulator/measure robustness part of the evidence, not a footnote.

**Placement.** **A scientific / A interest, medium confidence, unchanged.** The new result strengthens contact with one of the hardest cosmological problems, so this is a material evidence update. It does not warrant promotion: the calculation is truncation- and ansatz-dependent, it is not an empirical detection, and it is adjacent Wilsonian RG-gravity evidence rather than an independent confirmation of the canonical ultraviolet fixed point.

**Distinctive recovery gates.** Reproduce the infrared attractor independently; let the currently frozen couplings run; enlarge the saddle and curvature-invariant space; show that the basin survives gauge/regulator/measure changes; and extract a discriminating cosmological observable beyond reproducing the order of the observed cosmological constant.

**Clash — String theory / M-theory (A/S).** Battleground: **cosmological-constant predictivity**. Asymptotic Safety's advantage is a direct RG mechanism that can in principle turn the observed infrared scale into a quantitative attractor; its liability is systematic control of truncations and regulator/measure dependence. String/M-theory has far deeper microscopic unification machinery and many controlled compactifications, but pays a severe vacuum-selection/de Sitter-predictivity debt. The new infrared-screening result improves the Asymptotic Safety side of this specific clash but does not move either tier. A regulator-robust derivation plus a successful prospective cosmological prediction would materially change the comparison.

**Movement history.** 2026-09-18: A/A held after the Fermi-scale scaling-solution result. 2026-09-25: **A/A -> A/A**, evidence strengthened by the new infrared-screening calculation; confidence remains medium.

## Fresh screening

The 25 September hep-th new-submission list contains 25 new submissions. Two results are relevant to established contenders but do not pass the tier-movement threshold:

- Ilmo Sung, *Six-point consistency and uniqueness of the Veneziano amplitude* (arXiv:2609.29919, 2026-09-24) strengthens the on-shell mathematical uniqueness story around a string amplitude under stated assumptions, but it does not supply a new realistic compactification or string-specific empirical signal. String/M-theory remains A/S.
- Hernandez-Segura, Liu, Perez-Martinez and Ramos-Sanchez, *The Flavor of Non-Abelian Orbifolds* (arXiv:2609.30241, 2026-09-24) develops flavor-symmetry methods across 331 non-Abelian affine heterotic-orbifold geometries. It is useful model-building infrastructure, not yet a new full-scope contender or a tier-moving phenomenological result.

Other fresh entries are sectoral quantum-gravity, amplitudes, black-hole, cosmology or QFT results rather than uncatalogued programmes that attempt the full gravity plus realistic Standard Model chain.

## franklinbaldo/papers

The newest inspected main commit is `db478ea7ee44a828ac0687663e63148c0e4539f0`, *results(fir): exploratory tail-mass and O4 scaling GPU runs (#1423)*. It reports exploratory representation-identification results, including recovery improvements when absolute mass information is preserved and an O4 scaling run reaching high correlation only at a probe budget substantially larger than the fp32 weights. The surrounding commits add CUDA-equivalence infrastructure and move result state to Parquet plus OKF manifests. These are substantive methodology results for representation discovery and auditability, but they do not propose a physical gravity-plus-Standard-Model theory. **No local ToE tier is added or moved.**

## Net movement

- New full-scope contenders: **none**.
- Existing tier movement: **none**.
- Material evidence update: **Asymptotic Safety A/A -> A/A**, stronger cosmological-constant evidence, medium confidence.
- String/M-theory: **A/S unchanged**; two fresh theory/model-building papers screened as non-tier-moving.
- `franklinbaldo/papers`: **no new physical ToE contender** in the newest commits.
