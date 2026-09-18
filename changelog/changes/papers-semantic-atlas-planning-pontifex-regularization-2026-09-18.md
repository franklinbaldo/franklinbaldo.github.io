---
type: changelog
date: 2026-09-18
description: Atualiza /papers com a auditoria de planejamento e controle do Semantic Atlas e corrige a interpretação do ablation de complexidade do Pontifex Torus após o diagnóstico de regularização.
tags: [papers, research, semantic-atlas, pontifex, prior-art]
---

# Semantic Atlas e Pontifex Torus: mapa atualizado

- `Semantic Atlas` passa a refletir a auditoria `audits/prior-art/semantic-atlas-planning-control-2026-09-18.md`: os hooks amplos de reachability, semantic control, latent planning, multiresolution e eficiência já têm antecedentes fortes; a aposta residual fica na conjunção persistente de atlas calibrado + reachability/cost + rota externa + tracking closed-loop + contabilidade amortizada.
- `Pontifex Torus` incorpora o diagnóstico posterior da PR `franklinbaldo/papers#485`: a reversão c2-c4 do transporte degree-2 era em grande parte sensível à regularização; com sweep Ridge mais largo, c2 fica levemente positivo, c3 praticamente neutro e c4 apenas levemente negativo.
- Os tiers são preservados: `Semantic Atlas` e `Pontifex Torus` continuam em ciência C / interesse S / confiança medium. A mudança estreita claims e melhora controles, mas não adiciona evidência suficiente para promoção ou relegação.
