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
  A v0.2 continua repository-ready para empacotamento Zenodo no SHA validado, sem que isso signifique depósito ou publicação externa. O C1 executou o grafo inteiro — 166.700 neurônios e 25.582.938 conexões — e segue produzindo resultados negativos informativos. No Run 27, o subconjunto mechanosensory/proprioceptive não superou um conjunto random-sensory pareado sob o código escalar executado, e a auditoria posterior deixou claro que isso não equivale a comparar endereçamento biológico com injeção arbitrária no grafo. O Run 28 acrescentou um segundo sinal fisicamente reproduzível — aceleração longitudinal ruidosa de Android — em um segundo endereço biologicamente motivado, disjunto do endereço OBD, e usou um controle random-sensory de 512 neurônios com zero overlap. Ainda assim, OBD+IMU biológico ficou em 3,569191 m/s de MAE contra 3,569302 no OBD-only, ganho de apenas 0,000111 m/s; random dual-address ficou em 3,569790, rewire em 3,570941, adapter-only em 3,575835 e PI em 2,860807. Assim, nem trocar o fallback por um endereço sensorial mais específico nem simplesmente acrescentar uma segunda variável veicular lícita revelou vantagem prática do MaleCNS ou de sua topologia nesta formulação.
limit: >-
  Run 28 ainda tem só três seeds, um rewire e uma dinâmica/readout muito simplificados; o pequeno contraste biológico-versus-random continua longe de uma inferência confirmatória de topologia ou biofidelidade. O input OBD e o IMU são transduções engenheiradas, não códigos sensoriais naturais, PAM/PPL1 seguem como proxies, connectome não é effectome e o gargalo de dois DNg100 pode apagar diferenças internas. O próximo discriminante útil é medir causalmente se perturbações IMU realmente alcançam DNg100 sob endereço biológico, random-sensory e rewires, com ganho de drive controlado: se não alcançam, o problema está na observabilidade/interface; se alcançam sem melhorar controle, o gargalo se desloca para readout, aprendizagem ou credit assignment. Uma tese forte de endereçamento biológico ainda exige controles não-sensoriais/anatomicamente implausíveis e código-semântico; uma tese de topologia exige ensemble de rewires e nulls memory/resource-matched.
related_file: "experiments/malecns_car_interface/FINDINGS-WHOLE-CNS-C1-RUN-28.md"
relations:
  - type: extends
    target: malecns_connectome_reservoir_tagging
    note: "Transforma a pergunta antiga de um reservoir reduzido e open-loop num teste do connectome inteiro dentro de um ciclo sensor → CNS → ação → ambiente → reforço, preservando controles explícitos."
---
