---
type: paper
title: "Whole-MaleCNS em controle fechado de velocidade"
family: "Neurocomputação experimental"
kind: "empírico / resultado negativo"
scientific_tier: "C"
interest_tier: "S"
confidence: "high"
idea: >-
  Coloca o MaleCNS v1.0 inteiro como substrato recorrente congelado dentro de um closed loop reality-bounded: a velocidade OBD entra por um transdutor sensorial declarado, atividade em DNg100 vira throttle e sinais PAM/PPL1 funcionam como proxies de melhora ou piora. O teste pergunta se a topologia biológica e o endereçamento sensorial biologicamente motivado ajudam mais que controles randomizados, um adapter sem grafo e controle PI convencional.
status: >-
  A v0.2 continua repository-ready para empacotamento Zenodo no SHA já validado, sem que isso signifique depósito ou publicação externa. Como evidência posterior ao freeze, o C1 executou o grafo inteiro — 166.700 neurônios e 25.582.938 conexões — em três seeds e encontrou whole-MaleCNS praticamente empatado com um rewire e um adapter, enquanto PI foi claramente melhor. O Run 27 removeu uma ambiguidade importante desse resultado: em vez do fallback sensorial genérico da primeira execução, resolveu 818 neurônios mechanosensory/proprioceptive nas anotações públicas e congelou 256 como endereço biológico, comparando-os com 256 neurônios sensoriais aleatórios sob o mesmo contrato. O endereço biológico obteve MAE 3,569809 m/s contra 3,569272 no endereço aleatório, diferença de +0,000538 m/s — ligeiramente pior e, neste orçamento, praticamente indistinguível. O rewire com endereço biológico ficou em 3,570929, o adapter-only em 3,587690 e o PI em 2,859004. Assim, o resultado negativo anterior não é resgatado simplesmente trocando o fallback por este primeiro mapa sensorial biologicamente motivado.
limit: >-
  Continua sendo evidência exploratória: há só três seeds, um rewire determinístico e um único endereço aleatório, que ainda sobrepõe 6 dos 256 neurônios do endereço biológico. A próxima inferência útil exige múltiplos endereços aleatórios explicitamente disjuntos e múltiplas seeds de endereçamento, além de null recorrente/memory-matched e dinâmica, inicialização e compute pareados. Também é plausível que um sinal unidimensional de velocidade não recrute estrutura circuital diferenciada; um teste mais forte pode acrescentar uma segunda variável lícita, como aceleração longitudinal por IMU, mantendo o mesmo confronto entre endereçamento estruturado e randomizado. PAM/PPL1 seguem como proxies engenheirados, connectome não é effectome e o PI permanece um piso de engenharia forte. Sem sinal real de topologia ou endereçamento em C1, aumentar a complexidade para C2/C3 não deve ser usado apenas para buscar um resultado positivo.
related_file: "experiments/malecns_car_interface/FINDINGS-WHOLE-CNS-C1-ADDRESS-ABLATION-RUN-27.md"
relations:
  - type: extends
    target: malecns_connectome_reservoir_tagging
    note: "Transforma a pergunta antiga de um reservoir reduzido e open-loop num teste do connectome inteiro dentro de um ciclo sensor → CNS → ação → ambiente → reforço, preservando controles explícitos."
---
