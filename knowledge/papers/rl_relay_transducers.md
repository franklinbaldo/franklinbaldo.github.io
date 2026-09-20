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
  A v0.1 foi congelada em main como position paper pré-empírico e está repository-ready para o fluxo Zenodo no objeto canônico atual. O manuscrito absorve diretamente as auditorias de prior art, trata discrete black-box RL prompting, learned communication, serial LLM relays, covert/receiver-relative channels, learning-progress curricula e broad reward-aware retrieval como antecedentes, e restringe a contribuição candidata à conjunção auditável do relay: política discreta de edit/retrieval entre transformações LLM repetidas, memória com proveniência e split semântico/funcional, regimes frozen/adapted/co-trained, depth transfer, endpoints separados e controles de side-channel. A functional key atualizada por vantagem assinada permanece apenas como residual de busca negativa limitada, não como prova de prioridade. Autor, licença, versão e metadata Zenodo foram incorporados; o SHA mergeado exato passou o `validate` do repositório, incluindo o contrato de packaging dos papers `ready`, e o tracker #568 foi legitimamente fechado. Isso não significa depósito ou publicação externa, e H1–H11 continuam prospectivas.
limit: >-
  O programa continua sem implementação ou resultado empírico próprio: ainda não sabemos se o relay acrescenta capacidade, robustez ou transferência além de baselines mais simples. O teste causal central exige comparar, sob o mesmo orçamento e fronteira de informação, relay completo, relay sem functional key, reranking utility/Q simples, codecs fixos e canais frozen/coadapted, além de swaps de modelo, receptores independentes, profundidades não vistas e controles de side-channel. Se esses controles reproduzirem utilidade e transferência, a arquitetura adicional não demonstrou valor específico; e uma busca de prior art limitada continua sem sustentar firstness.
related_file: "audits/zenodo-readiness/2026-09-20-0205Z.md"
---
