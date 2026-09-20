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
  A v0.2 continua repository-ready para empacotamento Zenodo, sem depósito externo, e o C1 segue produzindo resultados negativos mecanisticamente informativos no grafo inteiro de 166.700 neurônios e 25.582.938 conexões. Os Runs 31–35 localizaram o problema na interface/readout e falsificaram rescues simples por maior responsividade descendente, voltagem absoluta, centering e delta-voltage. O Run 36 então separou credit assignment de representação usando o mesmo limite de 17 parâmetros de deploy: um readout ridge supervisionado por um PI que vê somente OBD resgatou fortemente o adapter sem grafo (MAE 3,487239 → 2,808904 m/s, próximo do PI em 2,854649), mas não resgatou responsive-16 spike (3,513448 → 3,514191) nem delta-voltage (3,504907 → 3,540021). O Run 37 testou prospectivamente o principal confound numérico desse resultado: padronização treinada só no namespace de treino reduziu materialmente os condition numbers — spike ~9,06 → 3,23; delta ~2,47 → 1,89; adapter ~898,62 → 570,44 — mas não melhorou o controle held-out do MaleCNS (spike 3,383582 raw vs 3,388290 standardized; delta 3,459572 vs 3,459157). Assim, nem o reward learner herdado sozinho nem mismatch de escala do ridge explicam suficientemente a falha atual do responsive-16.
limit: >-
  Os Runs 36–37 falsificam dois rescues concretos — one-shot lawful-teacher ridge e sua versão standardized —, não a hipótese mais ampla de que o MaleCNS contenha informação útil para dirigir. O supervised fit ainda aprende apenas em estados visitados pelo PI e depois é avaliado na distribuição induzida pela própria política; covariate shift de imitation learning permanece uma explicação material. O próximo falsificador limpo é DAgger-style learner-state aggregation com o mesmo PI OBD-only, os mesmos sensores, responsive-16 e 17 parâmetros, mantendo adapter e PI como controles positivos. A inconsistência documental dos body IDs do Run 33 permanece aberta em papers#815. Qualquer claim de topologia ainda exige seleção simétrica de readout em grafo verdadeiro/rewired, ensembles de nulls e controles memory/resource-matched.
related_file: "experiments/malecns_car_interface/FINDINGS-WHOLE-CNS-C1-RUN-37.md"
relations:
  - type: extends
    target: malecns_connectome_reservoir_tagging
    note: "Transforma a pergunta antiga de um reservoir reduzido e open-loop num teste do connectome inteiro dentro de um ciclo sensor → CNS → ação → ambiente → reforço, preservando controles explícitos."
---
