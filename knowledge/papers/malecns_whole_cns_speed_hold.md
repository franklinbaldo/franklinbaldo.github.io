---
type: paper
source_url: "https://github.com/franklinbaldo/papers/blob/main/malecns/whole-cns-speed-hold.md"
title: "Whole-MaleCNS em controle fechado de velocidade"
family: "Neurocomputação experimental"
kind: "empírico / resultado negativo"
scientific_tier: "C"
interest_tier: "S"
confidence: "high"
idea: >-
  Coloca o MaleCNS v1.0 inteiro como substrato recorrente congelado dentro de um closed loop reality-bounded: sinais veiculares lícitos entram por endereços sensoriais declarados, atividade descendente vira throttle e sinais PAM/PPL1 funcionam como proxies de melhora ou piora. O teste pergunta se a topologia biológica e escolhas biologicamente motivadas de entrada/readout acrescentam controle útil além de randomizações, um adapter sem grafo e controle PI convencional.
status: >-
  A v0.2 continua repository-ready para empacotamento Zenodo, sem depósito externo, e o C1 já acumulou uma sequência de resultados negativos mecanisticamente informativos no grafo inteiro de 166.700 neurônios e 25.582.938 conexões. Rescues simples de interface/readout não produziram vantagem de topologia; um ridge supervisionado por professor PI resgatou fortemente o adapter sem grafo, mas não os braços MaleCNS, e o baseline causal de histórico OBD prevê o professor melhor do que a direção escalar MaleCNS. O ramo barato de interface avançou até o Run 49. O Run 48 mostrou que um low-pass causal fecha parte da penalidade inicial da ponte OBD+Android-IMU, sugerindo mismatch de fase/controlador. O Run 49 congelou esses filtros e selecionou em validação apenas a duração de um gate de startup: 6 s em 5, 2 e 1 Hz. Em seeds held-out, o braço startup-gated melhora o low-pass constante nas três cadências, fecha cerca de 52–68% do gap full-episode da ponte bruta para hold e preserva 64–77% do ganho de estimação da ponte bruta. Depois do startup ele fica praticamente raw-bridge-like no tail e supera hold à medida que o OBD fica esparso. Isso concentra boa parte do benefício de phase matching no transiente de engajamento e enfraquece a ideia de um filtro estacionário como interface final, mas sample-and-hold ainda vence o MAE do episódio completo e nada disso constitui evidência nova de vantagem da topologia MaleCNS.
limit: >-
  Ainda não existe vantagem de topologia biológica sobre adapter, PI ou nulls pareados, e o Run 49 continua sendo uma ablação sintética de interface/controlador, não uma nova execução whole-CNS. O gate de 6 s é baseado em relógio e foi selecionado no mesmo toy plant; ainda não há validação em carro real, montagem real de telefone, vibração, orientação/gravity leakage, jitter ou bias variável. O próximo controle barato mais discriminante é substituir o relógio por um critério de settling prospectivamente congelado que use apenas histórico lawful de erro/controlador e compará-lo com hold, ponte bruta, low-pass constante e o gate de startup em seeds novos. No ramo whole-CNS, o Run 39 permanece prioridade com OLS, ridge fixo e ridge selecionado só no treino; qualquer claim de topologia ainda exige seleção simétrica de readout no grafo verdadeiro e rewired, ensembles de nulls e controles memory/resource-matched. Esses limites preservam scientific tier C e interest tier S.
related_file: "experiments/malecns_car_interface/FINDINGS-WHOLE-CNS-C1-RUN-49-STARTUP-GATED-IMU.md"
relations:
  - type: extends
    target: malecns_connectome_reservoir_tagging
    note: "Transforma a pergunta antiga de um reservoir reduzido e open-loop num teste do connectome inteiro dentro de um ciclo sensor → CNS → ação → ambiente → reforço, preservando controles explícitos."
---
