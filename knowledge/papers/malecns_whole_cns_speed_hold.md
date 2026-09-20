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
  A v0.2 continua repository-ready para empacotamento Zenodo, sem depósito externo, e o C1 já acumulou uma sequência de resultados negativos mecanisticamente informativos no grafo inteiro de 166.700 neurônios e 25.582.938 conexões. Rescues simples de interface/readout não produziram vantagem de topologia; um ridge supervisionado por professor PI resgatou fortemente o adapter sem grafo, mas não os braços MaleCNS, e o baseline causal de histórico OBD prevê o professor melhor do que a direção escalar MaleCNS. O ramo barato de interface agora avançou até o Run 47. Runs 44–45 mostraram que uma ponte causal Android-IMU melhora a estimação quando o OBD é esparso e passa a melhorar o tracking na segunda metade de episódios de 12 s, embora continue pior no MAE do episódio completo. O Run 46 selecionou ganhos PI numa grade 3x3 usando somente validação e depois abriu seeds held-out novos: ambos os estimadores escolheram o mesmo par `kp=0.06, ki=0.005`, melhoraram muito, mas a ponte continuou pior no episódio completo e melhor no tail, enfraquecendo a explicação de mero gain mismatch. O Run 47 então expôs ao controlador apenas a idade lawful do último sample OBD e ajustou um único coeficiente em validação; o termo trouxe melhora mínima, foi rejeitado em 1 Hz e não inverteu o ranking full-episode, falsificando a versão mais simples da hipótese de que um escalar explícito de freshness explica a vantagem transitória do sample-and-hold. Nenhum desses dois runs altera a evidência da topologia MaleCNS em si.
limit: >-
  Ainda não existe vantagem de topologia biológica sobre adapter, PI ou nulls pareados, e Runs 46–47 são experimentos leves da interface/controlador, não novas execuções whole-CNS. A grade PI é pequena e terminou numa borda; o termo de sample age é linear e unidimensional; os resultados continuam num plant sintético sem orientação/gravity leakage, vibração, jitter, telefone real ou bias variável. O próximo controle barato mais discriminante é de fase: comparar hold, full IMU bridge e uma ponte causal low-pass/lag-matched prospectivamente congelada para separar qualidade de informação de casamento dinâmico com o controlador. No ramo whole-CNS, o Run 39 permanece prioridade com OLS, ridge fixo e ridge selecionado só no treino; se seguir negativo, phase-lead causal e readouts temporais com capacidade/nulls pareados continuam em aberto. Qualquer claim de topologia ainda exige seleção simétrica de readout no grafo verdadeiro e rewired, ensembles de nulls e controles memory/resource-matched.
related_file: "experiments/malecns_car_interface/FINDINGS-WHOLE-CNS-C1-RUN-47-SAMPLE-AGE-CONTROLLER.md"
relations:
  - type: extends
    target: malecns_connectome_reservoir_tagging
    note: "Transforma a pergunta antiga de um reservoir reduzido e open-loop num teste do connectome inteiro dentro de um ciclo sensor → CNS → ação → ambiente → reforço, preservando controles explícitos."
---
