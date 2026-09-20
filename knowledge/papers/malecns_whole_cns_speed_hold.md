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
  A v0.2 continua repository-ready para empacotamento Zenodo, sem depósito externo, e o C1 segue produzindo resultados negativos mecanisticamente informativos no grafo inteiro de 166.700 neurônios e 25.582.938 conexões. O Run 31 havia mostrado que um conjunto congelado de 16 neurônios descendentes respondia muito mais ao probe IMU do que os dois DNg100 históricos; o Run 32 colocou exatamente esse responsive-16 no closed loop e a vantagem neural não virou controle melhor: MAE held-out de 4,188490 m/s, praticamente empatado e ligeiramente pior que random-16 (4,183978), enquanto o PI ficou em 3,330860. O Run 33 então testou a hipótese de que o spike trace estava descartando informação subthreshold: trocar para um trace de voltagem pós-reset piorou o responsive-16 de 3,663654 para 4,011908 m/s e o random-16 de 3,626577 para 4,270553; o PI permaneceu melhor em 2,838269. Assim, responsividade neural mais forte não foi suficiente para melhorar ação e o rescue simples por voltagem pós-reset foi falsificado; nenhum desses runs demonstra vantagem da topologia MaleCNS.
limit: >-
  Runs 32 e 33 testam interfaces/readouts dentro do grafo verdadeiro, não uma comparação confirmatória de topologia: o responsive-16 foi escolhido no MaleCNS real, o plant C1 pode tornar o IMU largamente redundante com velocidade e histórico de throttle, e a dinâmica FlyBrain continua sendo uma aproximação engenheirada. Há ainda uma inconsistência documental concreta no Run 33: a implementação importa o responsive-16 canônico do Run 32/31, mas o Findings Record lista um conjunto diferente de body IDs; essa proveniência deve ser corrigida antes de tratar o registro textual como archivalmente limpo. Run 33 mede estado de membrana pós-reset, não picos pré-reset nem voltagem biológica calibrada. O próximo discriminante deve diagnosticar prospectivamente saturação de ação, viés persistente e condicionamento do aprendizado nas linhas por episódio já preservadas; qualquer claim de topologia continua exigindo seleção simétrica de readout dentro de cada grafo verdadeiro/rewired, ensembles de nulls e controles memory/resource-matched.
related_file: "experiments/malecns_car_interface/FINDINGS-WHOLE-CNS-C1-RUN-33.md"
relations:
  - type: extends
    target: malecns_connectome_reservoir_tagging
    note: "Transforma a pergunta antiga de um reservoir reduzido e open-loop num teste do connectome inteiro dentro de um ciclo sensor → CNS → ação → ambiente → reforço, preservando controles explícitos."
---
