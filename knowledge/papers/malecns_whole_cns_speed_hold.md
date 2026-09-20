---
type: paper
title: "Whole-MaleCNS em controle fechado de velocidade"
family: "Neurocomputação experimental"
kind: "empírico / resultado negativo"
scientific_tier: "C"
interest_tier: "S"
confidence: "high"
idea: >-
  Coloca o MaleCNS v1.0 inteiro como substrato recorrente congelado dentro de um closed loop reality-bounded: a velocidade OBD entra por um transdutor sensorial declarado, atividade em DNg100 vira throttle e sinais PAM/PPL1 funcionam como proxies de melhora ou piora. O teste pergunta se a topologia biológica ajuda mais que rewiring, um adapter sem grafo e controle PI convencional.
status: >-
  A v0.2 é o sucessor results-bearing do antigo diagnóstico de 512 neurônios e está repository-ready para empacotamento Zenodo no SHA validado, sem que isso signifique depósito ou publicação externa. O C1 executou o grafo inteiro — 166.700 neurônios e 25.582.938 conexões — em três seeds. O whole-MaleCNS obteve MAE 3,569564 m/s, praticamente empatado com um único rewire degree-preserving (3,573171) e com o adapter-only pareado em parâmetros treináveis (3,587690), enquanto o PI convencional foi claramente melhor (2,859004). O resultado material é duplo: o whole-CNS participou de fato do ciclo causal, mas esta formulação não fornece evidência útil de vantagem específica da topologia.
limit: >-
  É um resultado exploratório, não confirmatório: houve apenas um rewiring, três seeds e orçamento pequeno; o input de velocidade caiu num fallback genérico de 256 neurônios da sensory-superclass; o adapter-only iguala número de parâmetros treináveis, não memória ou capacidade dinâmica; PAM/PPL1 são proxies engenheirados, e connectome não é effectome. Uma inferência de topologia exigiria ensemble de rewires, randomização do endereçamento biológico, null recorrente/memory-matched e dinâmica/inicialização/compute pareados. O PI ainda carrega um forte prior de planta, e speed-hold não demonstra competência geral de direção.
related_file: "audits/prior-art/malecns-whole-cns-c1-run26-2026-09-19.md"
relations:
  - type: extends
    target: malecns_connectome_reservoir_tagging
    note: "Transforma a pergunta antiga de um reservoir reduzido e open-loop num teste do connectome inteiro dentro de um ciclo sensor → CNS → ação → ambiente → reforço, preservando controles explícitos."
---
