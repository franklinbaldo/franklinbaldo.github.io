---
type: paper
title: "Whole-MaleCNS em controle fechado de velocidade"
family: "Neurocomputação experimental"
kind: "empírico / resultado negativo"
scientific_tier: "C"
interest_tier: "S"
confidence: "high"
idea: >-
  Coloca o MaleCNS v1.0 inteiro como substrato recorrente congelado dentro de um closed loop reality-bounded: a velocidade OBD entra por um transdutor sensorial declarado, atividade em DNg100 vira throttle e sinais PAM/PPL1 funcionam como proxies de melhora ou piora. O teste pergunta se a topologia biológica e escolhas biologicamente motivadas de entrada ajudam mais que controles randomizados, um adapter sem grafo e controle PI convencional.
status: >-
  A v0.2 continua repository-ready para empacotamento Zenodo no SHA validado, sem que isso signifique depósito ou publicação externa. O C1 executou o grafo inteiro — 166.700 neurônios e 25.582.938 conexões — em três seeds e encontrou whole-MaleCNS praticamente empatado com um rewire e um adapter, enquanto PI foi claramente melhor. O Run 27 substituiu o fallback genérico por 256 neurônios escolhidos entre 818 candidatos mechanosensory/proprioceptive e comparou esse conjunto com 256 neurônios sorteados da mesma superclass sensorial. O conjunto biologicamente selecionado obteve MAE 3,569809 m/s contra 3,569272 no random-sensory, diferença de +0,000538 m/s; o rewire com o mesmo endereço biológico ficou em 3,570929, o adapter-only em 3,587690 e o PI em 2,859004. A auditoria posterior estreitou a interpretação: isso é um null direto para este subconjunto mechanosensory/proprioceptive versus este random-sensory sob o código executado, e continua sem revelar vantagem útil de topologia, mas não demonstra equivalência entre endereçamento biológico e injeção arbitrária ou anatomicamente implausível.
limit: >-
  Os dois braços de endereço do Run 27 já respeitam uma restrição biológica importante porque ambos usam neurônios da superclass sensorial; o controle aleatório não é um endereço arbitrário no grafo. Além disso, o código de entrada é um erro escalar de velocidade dividido deterministicamente entre metades do conjunto, não uma transdução fiel à seletividade conhecida de subtipos mechanosensory/chordotonal. Há só três seeds, um rewire e um único endereço random-sensory, com sobreposição de 6/256 neurônios. Para sustentar uma tese causal de endereçamento biológico ainda faltam múltiplos endereços sensoriais disjuntos, conjuntos não-sensoriais/anatomicamente implausíveis, permutações da semântica do código e, idealmente, sinais físicos mais próximos das modalidades relevantes; se surgir efeito de endereço, então um ensemble de rewires e nulls memory/resource-matched vira necessário para atribuí-lo à topologia. PAM/PPL1 seguem como proxies engenheirados, connectome não é effectome e o PI permanece um piso de engenharia forte.
related_file: "audits/prior-art/malecns-run27-biological-sensory-addressing-2026-09-19.md"
relations:
  - type: extends
    target: malecns_connectome_reservoir_tagging
    note: "Transforma a pergunta antiga de um reservoir reduzido e open-loop num teste do connectome inteiro dentro de um ciclo sensor → CNS → ação → ambiente → reforço, preservando controles explícitos."
---
