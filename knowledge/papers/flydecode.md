---
type: paper
title: "FlyDecode: Active Logit Sensing and Episodic Trajectory Memory for Stateful Connectome-Guided Decoding"
family: "Neurocomputação experimental"
kind: "conceitual / protocolo experimental"
scientific_tier: "C"
interest_tier: "S"
confidence: "medium"
idea: >-
  Trata a distribuição de próximos tokens de um LLM congelado como uma cena sensorial, não como decisão final. Antes de emitir um token, um controlador recorrente derivado do MaleCNS pode gastar alguns micro-passos baratos consultando estatísticas já cacheadas dos logits, contexto e memória episódica; essa memória guarda trajetórias de como o campo de logits evoluiu depois de ações anteriores e que recompensa apareceu mais tarde. A hipótese forte não é que a mosca “entenda linguagem”, mas que sua topologia recorrente possa funcionar como viés indutivo para valorar alternativas sob incerteza e feedback atrasado.
status: >-
  O paper está em `papers/main` como position paper e protocolo falsificável; ainda não reporta resultado empírico. O desenho já separa a hipótese de arquitetura da hipótese especificamente MaleCNS: todos os braços devem receber o mesmo cache sensorial, memória, orçamento de queries e compute, comparando o connectoma real com rewires degree-preserving, grafos recorrentes aleatórios, MLP/GRU/LSTM/Transformer pequeno e políticas adaptativas de decoding. O prior art ocupa partes importantes da ideia: cache/kNN para linguagem, adaptive computation e decoding aprendido de LLMs congelados já existem; trabalhos como Active Layer-Contrastive Decoding e Adaptive Decoding via Test-Time Policy Learning tratam a escolha de tokens como decisão sequencial adaptativa. A contribuição candidata fica na composição mais estreita de topologia whole-connectome, loop pré-COMMIT de active sensing barato, estado persistente e replay sensorial de trajetórias de logits ligadas a recompensa tardia.
limit: >-
  Sem execução não há evidência de melhora de reward, eficiência ou vantagem da topologia biológica. Um resultado convincente precisa vencer controles artificiais e rewired com privilégios e custo pareados, sobreviver a leakage/shuffled-reward controls, mostrar valor incremental de active sensing, estado persistente e memória de trajetória, e manter a vantagem depois de normalizar wall time/FLOPs/memória. Também deve separar ganho genérico da arquitetura de um eventual ganho específico do MaleCNS e replicar em mais de um backbone ou família de tarefa. A própria revisão de prior art do paper é declaradamente limitada, então qualquer claim de primeira ocorrência ainda exige busca sistemática adicional.
relations:
  - type: shares_mechanism_with
    target: malecns_whole_cns_speed_hold
    note: "Os dois papers usam o MaleCNS como operador recorrente congelado e exigem comparação contra rewires e controladores artificiais; FlyDecode transfere essa disciplina de controle fechado do domínio veicular para decisões sequenciais de tokens e feedback atrasado."
---
