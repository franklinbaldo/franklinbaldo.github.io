---
type: paper
title: "Semantic Atlas"
family: "Geometria semântica"
kind: "arquitetura conceitual"
scientific_tier: "C"
interest_tier: "S"
confidence: "medium"
idea: "Imagina um espaço semântico com pontos de referência artificiais — como estrelas num mapa — para medir posição, distância, alcançabilidade e custo de mover um sistema entre regiões de significado."
status: "Programa conceitual/computacional não revisado por pares. A auditoria de planejamento e controle mostra que os hooks amplos já estão bastante ocupados: reachability e controllability em espaço de significado, trajetórias semânticas sob feedback, latent planning, separação entre planejamento e verbalização e eficiência por raciocínio latente. Thoughts-as-Planning é a colisão pré-cutoff mais próxima com o eixo dynamics + world model + planejamento multiescala + eficiência."
limit: "A aposta residual fica na conjunção mais estrita: referencial semântico externo e congelado + mapa persistente de trajetórias livres + reachability/custos direcionais + rota multi-waypoint externa + tracking closed-loop pelo próprio LM + fronteira multirresolução + contabilidade amortizada de todo o compute. O falsificador é forte: se um world model task-conditioned ou um controlador local A-LQR/PID-like igualar o Atlas em qualidade, transferência e custo total, o mapa global não demonstrou valor causal; busca negativa não prova novidade."
related_file: "audits/prior-art/semantic-atlas-planning-control-2026-09-18.md"
---
