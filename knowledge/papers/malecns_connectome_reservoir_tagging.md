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
  A baseline v0.1 de cinco seeds continua sendo um diagnóstico reproduzível da formulação reduzida de 512 neurônios, open-loop e com readout supervisionado. Para a linha whole-CNS, o protocolo C0→C6 já está congelado, mas a auditoria claim-specific estreitou a novidade: whole-connectome embodied control, connectome fixo com interfaces treináveis e controles de topologia já têm antecedentes fortes em FlyGM, Biological Processing Units e connectome reservoirs. A pergunta local defensável ficou mais específica: se um MaleCNS inteiro e congelado, biologicamente endereçado e ligado a um carro por sinais Android/OBD plausíveis, acrescenta benefício em closed loop sob controles pareados. O Run 25 também corrigiu a escada de comparação da interface de carro: uma fusão passiva de OBD-II, GNSS e ego-speed da câmera, sem custo de aquisição auxiliar, superou globalmente os comparadores ativos RF/LiDAR anteriores no sintético held-out. Ainda não existe resultado C1 whole-CNS.
limit: >-
  A próxima evidência precisa separar efeito da topologia de explicações mais simples. Um teste confirmatório deve usar múltiplos nulls degree-preserving, inicialização e orçamento pareados, controle da escala dinâmica e uma ablação com posições sensoriais/reward/motoras aleatórias; um único rewiring basta apenas como smoke test exploratório. Depois do Run 25, qualquer claim de active sensing/MaleCNS também precisa vencer a fusão passiva dos sinais primários já gratuitos, e não apenas pair-only ou o antigo guarded RF-first. Além disso, sucesso do core congelado mostraria utilidade de um substrato connectome-constrained sob aprendizado externo, não reprodução do aprendizado biológico da mosca: plasticidade dopaminérgica e traces internos ainda não estão modelados. O C1 mínimo continua sendo o próximo passo; plasticidade local e reward-delay entram depois se a falha observada os justificar.
related_file: "experiments/malecns_car_interface/PROTOCOL-WHOLE-CNS-CLOSED-LOOP-v1.md"
---
