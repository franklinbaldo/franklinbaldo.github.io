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
  O paper está em `papers/main` como position paper e protocolo falsificável; ainda não reporta resultado empírico. O programa prospectivo separa transporte de estado, escolha top-k, active sensing, grounding text-to-valence, memória de trajetórias com recompensa atrasada e, por último, eventual vantagem específica da topologia MaleCNS; H1–H4 podem funcionar mesmo se H5 falhar. A auditoria de prior art estreitou materialmente a novidade: MaleCNS acoplado a LLM congelado e readout de logits já aparece em “Flies Are All You Need”; decoding adaptativo token-a-token com reward, recuperação de contexto→logits, reservoirs de connectoma, memória sequencial e “logit trajectory” em outro eixo também têm precedentes fortes. O que não foi localizado na rodada foi a composição completa de whole-MaleCNS + queries baratas pré-COMMIT + estado persistente + replay sensorial de trajetórias pós-ação ligadas a recompensa + accounting explícito de custo + controles de topologia. Todos os braços devem receber os mesmos dados, cache sensorial, memória, orçamento de queries e compute, comparando MaleCNS com rewires degree-preserving e controladores artificiais.
limit: >-
  Sem execução não há evidência de melhora de reward, eficiência, grounding ou vantagem da topologia biológica. Há inclusive um antecedente diretamente desconfortável para H5: o experimento prévio “Flies Are All You Need” encontrou um controle direct-input pareado ligeiramente melhor que o readout MaleCNS, então superioridade de topologia deve ser tratada como hipótese com prior negativo, não pressuposto. O primeiro resultado precisa superar rerankers/GRUs e políticas adaptativas comuns, static-logit/kNN/interpolation memories e nulls de topologia sob orçamento justo; sobreviver a leakage, shuffled-reward, exposição a prefixes gerados e sparse-reward instability; e mostrar valor incremental de active sensing, estado persistente e replay temporal em endpoints de geração/tarefa, não só NLL ou acurácia top-k. A ausência de antecedente para a composição inteira é apenas busca negativa delimitada, não prova de primeira ocorrência.
related_file: "audits/prior-art/flydecode-active-logit-memory-2026-09-20.md"
relations:
  - type: shares_mechanism_with
    target: malecns_whole_cns_speed_hold
    note: "Os dois papers usam o MaleCNS como operador recorrente congelado e exigem comparação contra rewires e controladores artificiais; FlyDecode transfere essa disciplina de controle fechado do domínio veicular para decisões sequenciais de tokens e feedback atrasado."
---
