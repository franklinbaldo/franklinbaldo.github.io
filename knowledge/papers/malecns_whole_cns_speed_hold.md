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
  A v0.2 continua repository-ready para empacotamento Zenodo, sem depósito externo, e o C1 segue produzindo resultados negativos mecanisticamente informativos no grafo inteiro de 166.700 neurônios e 25.582.938 conexões. O Run 31 encontrou um responsive-16 descendente muito mais sensível ao probe IMU que os dois DNg100 históricos, mas o Run 32 mostrou que essa responsividade não vira controle melhor; o Run 33 também falsificou o rescue simples por voltagem pós-reset, que piorou o MAE. O Run 34 então abriu o caminho ação por ação em seeds novos e encontrou um gargalo de condicionamento: a voltagem absoluta pós-reset tem RMS de feature 1,840250 contra 0,561584 no spike trace (cerca de 3,28x), produz contribuição neural média de logit de -0,240996 e throttle médio de 0,441065, cerca de 0,115 abaixo do equilíbrio do plant (0,556), sem saturação do atuador e com correlação erro↔ação praticamente nula (-0,0139). No mesmo run, responsive-voltage ficou pior que responsive-spike (3,245971 contra 3,090100 m/s de MAE) e o PI continuou melhor (2,485052). O resultado sustenta um problema de baseline/escala e aprendizado do atuador na interface atual, não a conclusão de que voltagem carece de informação útil nem qualquer vantagem da topologia MaleCNS.
limit: >-
  O Run 34 é um diagnóstico de mecanismo, não um teste confirmatório de topologia nem um rescue já bem-sucedido. A auditoria do Run 33 mostra que spike e voltagem estavam pareados em número de parâmetros, mas não em condicionamento do otimizador: baseline, escala e filtragem temporal diferem, e a voltagem é observada após hard reset do modelo, portanto o resultado não mede de forma limpa a qualidade intrínseca das duas representações. A inconsistência documental dos body IDs do responsive-16 no Findings Record do Run 33 também permanece aberta em papers#815. O próximo discriminante mínimo é comparar prospectivamente a voltagem absoluta atual com uma representação centered/delta-voltage congelada apenas em calibração, mantendo sinais externos, população, topologia, reward, capacidade e firewall de seeds; se isso não restaurar alinhamento erro↔ação e MAE, o alvo seguinte passa a ser reward/credit assignment. Qualquer claim de topologia ainda exige seleção simétrica de readout em grafo verdadeiro/rewired, ensembles de nulls e controles memory/resource-matched.
related_file: "experiments/malecns_car_interface/FINDINGS-WHOLE-CNS-C1-RUN-34.md"
relations:
  - type: extends
    target: malecns_connectome_reservoir_tagging
    note: "Transforma a pergunta antiga de um reservoir reduzido e open-loop num teste do connectome inteiro dentro de um ciclo sensor → CNS → ação → ambiente → reforço, preservando controles explícitos."
---
