---
type: paper
title: "Whole-MaleCNS em controle fechado de velocidade"
family: "Neurocomputação experimental"
kind: "empírico / resultado negativo"
scientific_tier: "C"
interest_tier: "S"
confidence: "high"
idea: >-
  Coloca o MaleCNS v1.0 inteiro como substrato recorrente congelado dentro de um closed loop reality-bounded: sinais veiculares lícitos entram por endereços sensoriais declarados, atividade descendente vira throttle e sinais PAM/PPL1 funcionam como proxies de melhora ou piora. O teste pergunta se a topologia biológica e escolhas biologicamente motivadas de entrada/readout acrescentam controle útil além de randomizações, um adapter sem grafo e controle PI convencional.
status: >-
  A v0.2 continua repository-ready para empacotamento Zenodo, sem depósito externo, e o C1 segue produzindo resultados negativos mecanisticamente informativos no grafo inteiro de 166.700 neurônios e 25.582.938 conexões. Depois dos Runs 28–30 mostrarem que o Android IMU altera a rede mas quase não modula os dois DNg100 usados como saída, o Run 31 testou diretamente se esse par era um gargalo estreito. Entre 1.332 neurônios descendentes, um conjunto de 16 células selecionado somente em seeds de calibração por resposta ao mesmo probe IMU foi congelado e generalizou para seeds held-out: resposta média absoluta de voltagem 0,103926 por neurônio, contra 0,032718 nos DNg100 e 0,040166 num controle aleatório de 16 células — 3,176x e 2,587x, respectivamente. Cerca de 35,4% das células do conjunto responsivo mudaram trajetória de spikes, contra 8,3% nos DNg100. Os dois DNg100 ficaram apenas em 928º e 909º no ranking de calibração. Assim, o near-null anterior não representa toda a população descendente: informação dependente do IMU chega a um readout mais amplo, embora ainda não haja evidência de melhora de controle nem de vantagem da topologia biológica.
limit: >-
  Run 31 é um diagnóstico neural evaluator-only, não um teste fechado do novo readout: as 16 células foram escolhidas por responsividade, não por semântica motora, e ainda não dirigiram o throttle. Além disso, o conjunto foi selecionado no grafo verdadeiro e portanto não permite uma comparação confirmatória justa contra rewires; o IMU pode continuar redundante com velocidade e histórico de ação no plant C1. O próximo discriminante é congelar essas mesmas 16 identidades e, com seeds inteiramente novos, comparar em closed loop DNg100, responsive-16, random-16, adapter-only e PI. Qualquer claim de topologia exige seleção simétrica de readout dentro de cada grafo verdadeiro/rewired, sem olhar os dados de teste, além de ensembles de nulls e controles memory/resource-matched.
related_file: "experiments/malecns_car_interface/FINDINGS-WHOLE-CNS-C1-RUN-31.md"
relations:
  - type: extends
    target: malecns_connectome_reservoir_tagging
    note: "Transforma a pergunta antiga de um reservoir reduzido e open-loop num teste do connectome inteiro dentro de um ciclo sensor → CNS → ação → ambiente → reforço, preservando controles explícitos."
---
