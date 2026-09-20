---
type: paper
title: "FlyDecode: Active Logit Sensing and Episodic Trajectory Memory for Stateful Connectome-Guided Decoding"
family: "Neurocomputação experimental"
kind: "conceitual / protocolo experimental"
scientific_tier: "C"
interest_tier: "S"
confidence: "medium"
idea: >-
  Trata a distribuição de próximos tokens de um LLM congelado como uma cena sensorial, não como decisão final. Antes de emitir um token, um controlador recorrente derivado do MaleCNS pode gastar micro-passos baratos consultando estatísticas já cacheadas dos logits, contexto e memória episódica; essa memória guarda trajetórias de como o campo de logits evoluiu depois de ações anteriores e que recompensa apareceu mais tarde. O programa também propõe aterrar instruções em linguagem natural num pequeno Valence Program verificável, para testar se paráfrases e composições diferentes produzem a mesma trajetória funcional de valoração, atenção, memória e compromisso. A hipótese forte não é que a mosca “entenda linguagem”, mas que sua topologia recorrente possa funcionar como viés indutivo para decisões stateful sob incerteza e feedback atrasado.
status: >-
  O paper está em `papers/main` como position paper e protocolo falsificável; ainda não reporta resultado empírico. A extensão mais recente congelou um programa prospectivo text-to-valence: primeiro testa se o controlador carrega estado atrasado e melhora escolhas top-k teacher-forced; depois mede active sensing, grounding de Valence Programs e paráfrases naturais, memória de trajetórias com recompensa atrasada e, por último, se algum ganho depende especificamente da topologia MaleCNS. O desenho separa essas hipóteses: H1–H4 podem funcionar mesmo se H5, a vantagem do connectoma real, falhar. Todos os braços devem receber os mesmos dados, cache sensorial, memória, orçamento de queries e compute, comparando MaleCNS com rewires degree-preserving, grafos recorrentes aleatórios, GRU/MLP e outros controladores artificiais. O prior art ocupa partes importantes — cache/kNN, adaptive computation, decoding aprendido, language-conditioned RL e reward learning — de modo que a contribuição candidata fica na composição estreita de whole-connectome, loop pré-COMMIT de active sensing barato, estado persistente, replay sensorial de trajetórias de logits e grounding text-to-valence submetido a intervenções comportamentais objetivas.
limit: >-
  Sem execução não há evidência de melhora de reward, eficiência, grounding ou vantagem da topologia biológica. Um resultado convincente precisa vencer controles artificiais e rewired com privilégios e custo pareados, sobreviver a leakage/shuffled-reward e lexical-baseline controls, mostrar valor incremental de active sensing, estado persistente e memória de trajetória, e avaliar instruções por predicados/intervenções observáveis em vez de usar um LLM professor como único juiz. A eventual vantagem deve sobreviver à normalização de wall time/FLOPs/memória e replicar em mais de um backbone ou família de tarefa. A revisão de prior art continua delimitando componentes em vez de provar primeira ocorrência; qualquer claim forte de novidade composta ainda exige busca sistemática adicional.
related_file: "experiments/flydecode/PROTOCOL-TEXT-TO-VALENCE-v1.md"
relations:
  - type: shares_mechanism_with
    target: malecns_whole_cns_speed_hold
    note: "Os dois papers usam o MaleCNS como operador recorrente congelado e exigem comparação contra rewires e controladores artificiais; FlyDecode transfere essa disciplina de controle fechado do domínio veicular para decisões sequenciais de tokens e feedback atrasado."
---
