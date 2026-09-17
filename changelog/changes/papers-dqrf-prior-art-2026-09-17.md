---
type: changelog
date: 2026-09-17
description: Atualiza /papers com a auditoria de prior art de Dynamic Quasar Reference Frames.
tags: [papers, research, semantic-atlas, dqrf]
---

# DQRF: prior art no mapa de papers

- O `franklinbaldo/papers` incorporou em `main` a auditoria `audits/prior-art/dynamic-quasar-reference-frames-2026-09-17.md`.
- A auditoria encontra antecedentes anteriores ao cutoff para coordenadas que simplificam dinâmica, shared latent dynamics, decomposição campo comum + desvio, residual Neural ODEs e semantic reference frames para trajetórias de LLMs.
- A contribuição defensável fica mais estreita: testar se um campo dinâmico externo, escolhido e congelado sem observar as transições dos modelos de avaliação, reduz uma bateria pré-registrada de complexidade residual após ajustar apenas uma amplitude de baixa capacidade.
- `scientific_tier=C` e `interest_tier=S` permanecem: a auditoria altera o enquadramento de novidade, não acrescenta resultado empírico. A confiança na colocação sobe de `low` para `medium` porque a fronteira entre componentes estabelecidos e a composição ainda não testada ficou materialmente mais clara.
- O mapa de relações também passa a descrever DQRF como extensão do Semantic Atlas para um gauge dinâmico externo congelado, medido pelo residual que sobra em cada modelo.
- A auditoria de `contract_aware_driver_rehosting.md` continua fora do mapa enquanto `franklinbaldo/papers#486` permanecer fora de `main`.
