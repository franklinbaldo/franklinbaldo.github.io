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
  A v0.2 continua repository-ready para empacotamento Zenodo, sem depósito externo, e o C1 segue produzindo resultados negativos mecanisticamente informativos no grafo inteiro de 166.700 neurônios e 25.582.938 conexões. Depois do near-null OBD+IMU do Run 28 e da reachability subthreshold do Run 29, o Run 30 congelou o mesmo input e decompôs o drive sináptico que chega aos dois DNg100: no grafo verdadeiro, a modulação média absoluta de corrente líquida foi 0,012724, contra 0,109619 na média de três rewires — cerca de 8,61x maior nos nulls — e novamente houve 0/12 mudanças de trajetória de spikes no MaleCNS verdadeiro. O resultado também enfraquece duas explicações simples: cancelamento excitatório/inibitório forte não domina (16,8% no verdadeiro contra 26,2% nos rewires), e os DNg100 verdadeiros não ficam simplesmente mais longe do limiar. O gargalo ficou mais estreito: a perturbação altera a rede, mas modifica pouco o conjunto/peso presináptico ativo que efetivamente conduz corrente aos DNg100 escolhidos.
limit: >-
  Run 30 continua sendo diagnóstico interno, não endpoint de direção nem prova de vantagem ou desvantagem geral da topologia. O IMU segue largamente redundante com velocidade e histórico de ação no plant C1; só seis seeds e três rewires foram usados; a dinâmica FlyBrain é uma aproximação engenheirada; e DNg100 é um readout de apenas duas células. O próximo discriminante é medir ocupação das arestas presinápticas ativas, massa de pesos assinada e concentração de contribuições para DNg100 no grafo verdadeiro versus rewires e, em paralelo, pré-registrar um pequeno conjunto biologicamente plausível de populações descendentes/motoras mais amplas antes de olhar desempenho. A tese de topologia continua exigindo ensembles de nulls e controles memory/resource-matched.
related_file: "experiments/malecns_car_interface/FINDINGS-WHOLE-CNS-C1-RUN-30.md"
relations:
  - type: extends
    target: malecns_connectome_reservoir_tagging
    note: "Transforma a pergunta antiga de um reservoir reduzido e open-loop num teste do connectome inteiro dentro de um ciclo sensor → CNS → ação → ambiente → reforço, preservando controles explícitos."
---
