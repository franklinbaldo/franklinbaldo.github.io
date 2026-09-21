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
  A v0.2 continua repository-ready para empacotamento Zenodo, sem depósito externo, e o C1 já acumulou uma sequência de resultados negativos mecanisticamente informativos no grafo inteiro de 166.700 neurônios e 25.582.938 conexões. Rescues simples de interface/readout não produziram vantagem de topologia; um ridge supervisionado por professor PI resgatou fortemente o adapter sem grafo, mas não os braços MaleCNS, e o baseline causal de histórico OBD prevê o professor melhor do que a direção escalar MaleCNS. O ramo barato de interface avançou até o Run 48. Runs 44–47 mostraram que a ponte causal Android-IMU melhora estimação e tail tracking em OBD esparso, mas continua pior que sample-and-hold no MAE do episódio completo; nem retuning PI nem um escalar explícito de sample age explicaram a diferença. No Run 48, uma ponte causal low-pass selecionada em validação e testada em seeds held-out fechou cerca de 46–61% do gap de MAE full-episode da ponte bruta para hold enquanto reteve 56–72% do ganho de estimação da ponte bruta. Isso torna mismatch de fase/amortecimento com o controlador uma explicação parcial material para a penalidade inicial, sem eliminá-la: hold ainda vence no episódio completo. Nenhum desses runs leves constitui evidência nova de vantagem da topologia MaleCNS.
limit: >-
  Ainda não existe vantagem de topologia biológica sobre adapter, PI ou nulls pareados, e o Run 48 continua sendo uma ablação sintética de interface/controlador, não uma nova execução whole-CNS. O filtro foi selecionado dentro do harness congelado e não estabelece robustez em carro real, montagem real de telefone, vibração, orientação/gravity leakage, jitter ou bias variável. O próximo controle barato mais discriminante é comparar hold, ponte bruta e ponte phase-matched com um controlador dinâmico startup-aware que use apenas histórico lawful, congelado prospectivamente e avaliado em seeds novos. No ramo whole-CNS, o Run 39 permanece prioridade com OLS, ridge fixo e ridge selecionado só no treino; qualquer claim de topologia ainda exige seleção simétrica de readout no grafo verdadeiro e rewired, ensembles de nulls e controles memory/resource-matched. Esses limites preservam scientific tier C e interest tier S.
related_file: "experiments/malecns_car_interface/FINDINGS-WHOLE-CNS-C1-RUN-48-PHASE-MATCHED-IMU.md"
relations:
  - type: extends
    target: malecns_connectome_reservoir_tagging
    note: "Transforma a pergunta antiga de um reservoir reduzido e open-loop num teste do connectome inteiro dentro de um ciclo sensor → CNS → ação → ambiente → reforço, preservando controles explícitos."
---
