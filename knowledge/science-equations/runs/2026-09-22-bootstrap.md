---
type: science-atlas-run
date: "2026-09-22"
mode: "bootstrap + prior-art reconciliation"
summary: "Seed the taxonomy, four scientific formula occurrences and one verified cross-domain equation family."
updated: "2026-09-22"
---

# Bootstrap run — 2026-09-22

This run establishes the smallest corpus that can test the project's central idea: authored scientific formulas can be mapped to recurring mathematical structures without erasing their domain meaning.

## Prior art consulted

- [OpenAlex topics](https://help.openalex.org/data/topics/) supplies a large literature-derived hierarchy: domains → fields → subfields → topics. It is a seed and comparison surface, not the atlas's sole authority.
- [MSC2020](https://msc2020.org/) supplies a researcher-maintained taxonomy for mathematical sciences.
- [Wolfram Formula Repository](https://resources.wolframcloud.com/FormulaRepository/) demonstrates a broad, computable formula collection across scientific categories.
- [EqWorld](https://eqworld.ipmnet.ru/en/solutions.htm) organizes equations by mathematical class and exact-solution families.
- [OntoMathPro](https://ontomathpro.org/) demonstrates ontology-based representation and formula-oriented mathematical knowledge linking.
- [Bootstrap](https://bootstrapworld.org/curricula/) is educational rather than an atlas, but is useful prior art for making expressions, equations, equivalence and modeling relationships explicit across math, physics and data science.

## Corpus added

The initial tree covers physics, chemistry and engineering just deeply enough to host four occurrences:

- [radioactive decay](../formulas/radioactive-decay.md)
- [first-order chemical kinetics](../formulas/first-order-rate-law.md)
- [Newton cooling](../formulas/newton-cooling.md)
- [RC capacitor discharge](../formulas/rc-discharge.md)

All four link to [first-order linear decay](../families/first-order-linear-decay.md), with explicit substitutions recorded in the cards.

## Frontier

The next runs should increase breadth before adding many neighboring exponential-decay examples. Good candidates are an oscillatory family, a diffusion family, a growth/saturation family, a probability/statistics family, and branches outside the physical sciences.
