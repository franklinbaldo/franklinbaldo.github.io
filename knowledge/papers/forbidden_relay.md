---
type: paper
title: "Forbidden Relay"
family: "Comunicação emergente e agência"
kind: "pré-registro experimental"
scientific_tier: "C"
interest_tier: "S"
confidence: "high"
idea: >-
  Pré-registra um teste de comunicação composta: pequenos relays treinados por RL só podem editar ou recuperar texto entre chamadas de LLMs black-box, e o receptor final deve reconstruir exatamente um alvo benigno mesmo quando o literal não aparece nos outputs intermediários.
status: >-
  A v0.1 agora é um pré-registro congelado, sem resultados, marcado no repositório como pronto para empacotamento Zenodo. Estão fixados target families, budgets, regimes de canal, profundidades de treino e teste, memória, baseline ladder, endpoint de exact recovery sem leakage literal, controles de private code e side-channel, análise estatística e regra prospectiva de amendment.
limit: >-
  RL communication, sequential LLM relays, steganografia robusta a paraphrase/word blocking e decodabilidade relativa ao receptor são antecedentes materiais. O teste decisivo ainda não foi executado: se um codec fixo semantic/paraphrase-robust ou uma cifra in-context, com bandwidth e calls pareados, igualar o relay em profundidades e modelos não vistos, o maquinário RL específico não demonstrou valor adicional; busca negativa não prova prioridade.
related_file: "audits/prior-art/forbidden-relay-2026-09-18.md"
relations:
  - type: tests
    target: rl_relay_transducers
    note: "Testa o canal relay sob recuperação exata, supressão literal, transferência e controles de private code."
---
