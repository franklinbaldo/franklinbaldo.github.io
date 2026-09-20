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
  A v0.2 continua repository-ready para empacotamento Zenodo, sem depósito externo, e o C1 segue produzindo resultados negativos mecanisticamente informativos no grafo inteiro de 166.700 neurônios e 25.582.938 conexões. Os Runs 31–35 localizaram o problema na interface/readout e falsificaram rescues simples por maior responsividade descendente, voltagem absoluta, centering e delta-voltage. O Run 36 separou credit assignment de representação: um readout ridge supervisionado por um PI que vê somente OBD resgatou fortemente o adapter sem grafo (MAE 3,487239 → 2,808904 m/s, próximo do PI em 2,854649), mas não resgatou responsive-16 spike nem delta-voltage. O Run 37 então mostrou que padronização treinada só no namespace de treino reduz materialmente os condition numbers sem melhorar o controle held-out do MaleCNS. O Run 38 reutilizou exatamente o artefato do Run 37 para um diagnóstico retrospectivo ainda mais estreito: recalibrar por seed apenas escala e bias do logit já aprendido piorou o teacher-throttle MAE do responsive-16 spike de 0,219522 para 0,241928 e do delta-voltage de 0,242587 para 0,259905; o adapter permaneceu praticamente inalterado em 0,024784 → 0,024806. As correlações logit↔teacher dos braços MaleCNS continuaram baixas/instáveis e os slopes mudaram inclusive de sinal entre seeds, enquanto o adapter permaneceu estável.
limit: >-
  O Run 38 falsifica somente a explicação simples de que a direção já aprendida pelo ridge fixo seria boa e estaria globalmente mal escalada ou enviesada. Ele não testa o espaço completo de fits lineares nas 16 features neurais porque o artefato arquivado não contém as matrizes stepwise necessárias; por isso OLS e/ou um pequeno sweep de ridge escolhido exclusivamente dentro do treino continuam sendo o controle mínimo antes de atribuir a imitation error à representação. O Run 38 também é retrospectivo e não pode recomputar MAE de velocidade contrafactual, já que uma ação diferente mudaria os estados futuros. Se um fit linear melhor no mesmo distribution ainda falhar closed loop, o passo seguinte é DAgger-style learner-state aggregation com o mesmo PI OBD-only para testar covariate shift; readouts temporais mais ricos permanecem uma fronteira separada. A inconsistência documental dos body IDs do Run 33 permanece aberta em papers#815. Qualquer claim de topologia ainda exige seleção simétrica de readout em grafo verdadeiro/rewired, ensembles de nulls e controles memory/resource-matched.
related_file: "experiments/malecns_car_interface/FINDINGS-WHOLE-CNS-C1-RUN-38.md"
relations:
  - type: extends
    target: malecns_connectome_reservoir_tagging
    note: "Transforma a pergunta antiga de um reservoir reduzido e open-loop num teste do connectome inteiro dentro de um ciclo sensor → CNS → ação → ambiente → reforço, preservando controles explícitos."
---
