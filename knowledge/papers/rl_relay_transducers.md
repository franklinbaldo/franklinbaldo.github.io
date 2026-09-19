---
type: paper
title: "Relay transducers por RL"
family: "Comunicação emergente e agência"
kind: "controle/representação"
scientific_tier: "C"
interest_tier: "S"
confidence: "medium"
idea: >-
  Coloca transdutores discretos treináveis entre modelos maiores e combina esse canal com memória associativa: recall semântico propõe candidatos, enquanto uma chave funcional separada tenta aprender quais memórias realmente ajudam a recompensa downstream.
status: >-
  Position paper não revisado por pares, com arquitetura e programa de avaliação, mas sem implementação ou resultados empíricos. A auditoria whole-paper de dez claims consolidou o prior art: discrete black-box RL prompting, learned communication, serial LLM relays, covert/steganographic channels, receiver-relative decoding, learning-progress curricula e reward-aware retrieval já têm antecedentes pré-cutoff. O residual defensável ficou na conjunção de relay discreto auditável entre transformações LLM repetidas, memória com proveniência, split semântico/funcional, regimes frozen/adapted/co-trained, depth transfer, endpoints separados e controles de side-channel; dentro dela, o update assinado de uma functional key separada continua sendo o mecanismo mais específico não localizado no corte auditado.
limit: >-
  Busca negativa limitada não prova prioridade, e o manuscrito ainda não integrou a auditoria whole-paper. Antes do freeze precisa incorporar as citações e o claim narrowing, sincronizar a fronteira com Forbidden Relay sem importar resultados não executados, completar metadata de autores/Zenodo e gerar o bundle do SHA exato. Cientificamente, continua faltando implementação: se baselines simples de utility/Q reranking e um relay sem functional key reproduzirem utilidade, transferência e custo sob orçamento pareado, o mecanismo adicional não demonstrou valor causal.
related_file: "audits/prior-art/rl-relay-transducers-2026-09-19.md"
---
