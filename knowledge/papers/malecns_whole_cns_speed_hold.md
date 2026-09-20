---
type: paper
title: "Whole-MaleCNS em controle fechado de velocidade"
family: "Neurocomputação experimental"
kind: "empírico / resultado negativo"
scientific_tier: "C"
interest_tier: "S"
confidence: "high"
idea: >-
  Coloca o MaleCNS v1.0 inteiro como substrato recorrente congelado dentro de um closed loop reality-bounded: sinais veiculares lícitos entram por endereços sensoriais declarados, atividade em DNg100 vira throttle e sinais PAM/PPL1 funcionam como proxies de melhora ou piora. O teste pergunta se a topologia biológica e escolhas biologicamente motivadas de entrada acrescentam controle útil além de randomizações, um adapter sem grafo e controle PI convencional.
status: >-
  A v0.2 continua repository-ready para empacotamento Zenodo, sem que isso signifique depósito ou publicação externa. O C1 executou o grafo inteiro — 166.700 neurônios e 25.582.938 conexões — e segue produzindo resultados negativos informativos. Depois do near-null OBD+IMU do Run 28, o Run 29 isolou a etapa causal IMU→DNg100: no grafo verdadeiro, o sinal altera substancialmente a atividade global e chega a DNg100 por caminhos dirigidos curtos, mas no ganho congelado de 1x gera só resposta subthreshold média de 0,019197 na trajetória de voltagem e zero mudança de spikes em todas as 12 comparações sign×trial. Três rewires responderam muito mais fortemente no mesmo diagnóstico, com média 0,174812 — cerca de 9,11x — e mudanças frequentes de spikes. Assim, a falta de ganho do Run 28 deixou de parecer simples desconexão estrutural ou falta de sensores e passou a apontar para a conversão dinâmica/readout no DNg100 selecionado.
limit: >-
  Run 29 é um diagnóstico interno de reachability, não um endpoint de direção nem evidência de que rewiring controle melhor. O IMU continua largamente redundante com velocidade e histórico de ação no plant C1, a dinâmica FlyBrain é uma aproximação engenheirada, DNg100 contém só dois neurônios de ação escolhidos e seis seeds não formam ensemble confirmatório. O próximo discriminante é congelar o mesmo input e decompor corrente excitatória/inibitória e distância ao limiar em DNg100, comparando com os rewires; se necessário, testar um pequeno conjunto pré-registrado de populações motoras/descendentes biologicamente plausíveis sob a mesma capacidade externa. A tese de topologia continua exigindo ensembles de nulls e controles memory/resource-matched.
related_file: "experiments/malecns_car_interface/FINDINGS-WHOLE-CNS-C1-RUN-29.md"
relations:
  - type: extends
    target: malecns_connectome_reservoir_tagging
    note: "Transforma a pergunta antiga de um reservoir reduzido e open-loop num teste do connectome inteiro dentro de um ciclo sensor → CNS → ação → ambiente → reforço, preservando controles explícitos."
---
