---
type: paper
title: "MaleCNS como reservoir para tagging jurídico"
family: "Neurocomputação experimental"
kind: "empírico"
scientific_tier: "C"
interest_tier: "S"
confidence: "high"
idea: >-
  Usa a conectividade real do sistema nervoso da mosca como uma rede recorrente congelada e pergunta se essa topologia ajuda a marcar trechos de texto jurídico melhor que controles embaralhados e um baseline sem recorrência.
status: >-
  A baseline v0.1 de cinco seeds continua sendo o diagnóstico histórico da formulação reduzida de 512 neurônios, mas a linha whole-CNS deixou de ser apenas prospectiva. O primeiro C1 exploratório executou o MaleCNS v1.0 inteiro — 166.700 neurônios e 25.582.938 conexões, com artefatos checksum-pinned — num loop reality-bounded de OBD speed → substrato congelado → readout DNg100 → throttle. Com três seeds e orçamento deliberadamente pequeno, o whole-CNS ficou praticamente empatado com um único rewiring degree-preserving (MAE 3,5696 vs. 3,5732 m/s) e com o adapter-only pareado apenas em número de parâmetros treináveis (3,5877), enquanto o PI convencional foi claramente melhor (2,8590). O avanço material é de execução: o whole-CNS entrou de fato no closed loop; o resultado é negativo/não sustentador para uma vantagem específica da topologia nesta formulação. A auditoria posterior também corrige a fronteira de novidade: Flyhard já ligava computação derivada de MaleCNS a controle veicular/CARLA, e DoomFly já combinava whole MaleCNS congelado, inputs biologicamente nomeados e readout externo pequeno. A contribuição local precisa portanto ser lida pela conjunção específica de realidade OBD, contrato frozen-core e controles declarados, não pelo claim amplo "MaleCNS controla veículo".
limit: >-
  O C1 exploratório ainda não isola uma vantagem biológica da topologia. Houve apenas um rewiring e orçamento pequeno; além disso, o speed input caiu num fallback determinístico de 256 neurônios da sensory-superclass porque o manifesto proprioceptivo/chordotonal/campaniform/mecanossensorial não atingiu o limiar congelado. O próximo teste deve corrigir esse endereçamento antes de aumentar compute e repetir a mesma tarefa e controles. Inferência confirmatória continua exigindo ensemble de rewires degree-preserving, randomização do endereçamento biológico, inicialização e dinâmica pareadas e um null recorrente/memory-matched; igualdade de parâmetros treináveis não iguala capacidade dinâmica. PAM/PPL1 continuam sendo proxies engenheirados de reforço, não reprodução fiel de valência dopaminérgica, e o connectome é um prior estrutural, não o effectome in vivo. O PI permanece um piso de engenharia forte, embora carregue um prior de planta quase exato no feed-forward; sucesso no speed-hold tampouco equivale a competência geral de direção.
related_file: "audits/prior-art/malecns-whole-cns-c1-run26-2026-09-19.md"
relations:
  - type: applies
    target: affordance_restriction
    note: "O scaffold city-as-affordance-field aplica restrição de affordances antes do controlador: ruas viram corredores navegáveis e regiões fora da via deixam de ser ações espacialmente disponíveis, com a própria transdução exposta a ablação."
---
