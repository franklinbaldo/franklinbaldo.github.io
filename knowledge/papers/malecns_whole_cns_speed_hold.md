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
  A v0.2 continua repository-ready para empacotamento Zenodo, sem depósito externo, e o C1 já acumulou uma sequência de resultados negativos mecanisticamente informativos no grafo inteiro de 166.700 neurônios e 25.582.938 conexões. Os rescues simples de interface/readout — maior responsividade descendente, voltagem absoluta ou centrada, delta-voltage e padronização — não produziram vantagem de controle. Um readout ridge supervisionado por um professor PI OBD-only resgatou fortemente o adapter sem grafo, mas não os braços MaleCNS, deslocando a dúvida para representação/readout e não apenas para credit assignment. A pista temporal retrospectiva de spike também enfraqueceu quando restringida a informação causal, e um baseline causal baseado apenas no histórico OBD prevê o professor PI por 500 ms muito melhor do que a direção escalar MaleCNS. Em paralelo, os Runs 43–45 tornaram a interface física mais explícita. O Run 44 mostrou que uma ponte causal Android-IMU melhora bastante a estimação de velocidade quando o OBD é esparso, embora piore levemente o tracking no horizonte curto de 2,4 s com os mesmos ganhos PI herdados. O Run 45 manteve exatamente sensores e controlador e estendeu o episódio para 12 s: o MAE do episódio completo continua ligeiramente pior, mas o MAE da segunda metade passa a favorecer a ponte IMU em todos os regimes esparsos, com melhora held-out de cerca de 2,23% a 5 Hz, 8,50% a 2 Hz e 17,65% a 1 Hz. Isso mostra valor marginal do sinal IMU na interface sintética depois do transiente inicial, sem transformar o resultado em evidência de topologia MaleCNS. O próximo falsificador whole-CNS congelado continua sendo o Run 39, com OLS, ridge fixo e ridge selecionado só no treino.
limit: >-
  Ainda não existe vantagem de topologia biológica sobre adapter, PI ou nulls pareados, e o Run 45 é um experimento leve da interface sensorial, não uma nova execução whole-CNS. O horizonte de 12 s foi escolhido na própria rodada de desenvolvimento, portanto a reversão no tail é exploratória; também não testa orientação/gravity leakage, vibração, jitter ou bias variável de um telefone real. No ramo barato de interface, o próximo discriminante limpo é calibrar uma pequena grade de ganhos PI apenas na validação, congelar os ganhos por estimador/cadência e comparar hold versus IMU em seeds held-out novos. No ramo whole-CNS, o Run 39 permanece primeiro; se continuar negativo, o phase-lead causal do Run 41 e depois readouts temporais com capacidade/nulls pareados continuam em aberto. A inconsistência documental dos body IDs do Run 33 permanece em papers#815. Qualquer claim de topologia ainda exige seleção simétrica de readout no grafo verdadeiro e rewired, ensembles de nulls e controles memory/resource-matched.
related_file: "experiments/malecns_car_interface/FINDINGS-WHOLE-CNS-C1-RUN-45-LONG-HORIZON-SPARSE-OBD-IMU.md"
relations:
  - type: extends
    target: malecns_connectome_reservoir_tagging
    note: "Transforma a pergunta antiga de um reservoir reduzido e open-loop num teste do connectome inteiro dentro de um ciclo sensor → CNS → ação → ambiente → reforço, preservando controles explícitos."
---
