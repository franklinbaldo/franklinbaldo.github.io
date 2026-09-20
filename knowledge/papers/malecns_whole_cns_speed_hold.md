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
  A v0.2 continua repository-ready para empacotamento Zenodo, sem depósito externo, e o C1 segue produzindo resultados negativos mecanisticamente informativos no grafo inteiro de 166.700 neurônios e 25.582.938 conexões. Os Runs 31–34 localizaram o gargalo na interface/readout: uma população descendente responsive-16 reage ao IMU muito mais que os dois DNg100 históricos, mas essa responsividade não melhora o controle, e a voltagem absoluta pós-reset revelou forte offset de baseline e escala. O Run 35 executou o rescue prospectivamente congelado com centered- e delta-voltage mantendo grafo, sensores, população, reward, otimizador e capacidade de saída. O centered removeu quase todo o common mode (média 1,791987 → 0,002584 e RMS 1,822117 → 0,324038), mas não melhorou o held-out: absolute-voltage marcou 4,048266 m/s de MAE, delta 4,088438 e centered 4,092583; responsive-centered também ficou ligeiramente pior que random-centered (4,092583 contra 4,087750), enquanto o PI permaneceu melhor em 3,263287. Assim, o offset identificado no Run 34 era real, mas não suficiente para explicar a falha: a evidência agora desloca o próximo discriminante para reward/credit assignment e aprendizado do readout, sem mostrar vantagem da topologia MaleCNS.
limit: >-
  O Run 35 falsifica fortemente o rescue centered/delta exatamente implementado, não a hipótese mais ampla de que a voltagem contenha informação útil. A própria auditoria mostra que centering altera a geometria do otimizador, o transiente do episódio e a política inicial; portanto ainda não é um teste puro de capacidade representacional, e uma alegação causal mais forte sobre common mode exigiria controle intercept-preserving e/ou RMS-matched. A inconsistência documental dos body IDs do responsive-16 no Findings Record do Run 33 também permanece aberta em papers#815. O próximo teste limpo é comparar o learner de reward atual com um baseline de readout/credit mais forte treinado apenas com informação permitida e capacidade de deploy pareada, em seeds novos. Qualquer claim de topologia continua exigindo seleção simétrica de readout em grafo verdadeiro/rewired, ensembles de nulls e controles memory/resource-matched.
related_file: "experiments/malecns_car_interface/FINDINGS-WHOLE-CNS-C1-RUN-35.md"
relations:
  - type: extends
    target: malecns_connectome_reservoir_tagging
    note: "Transforma a pergunta antiga de um reservoir reduzido e open-loop num teste do connectome inteiro dentro de um ciclo sensor → CNS → ação → ambiente → reforço, preservando controles explícitos."
---
