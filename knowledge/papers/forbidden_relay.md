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
  A v0.1 continua semanticamente pronta como pré-registro congelado, sem resultados, e o regresso recente de packaging/proveniência já foi resolvido: a fonte atual voltou a passar empacotamento no SHA exato, com bundle reproduzível e tracker de readiness fechado. Isso significa repository-ready para o fluxo Zenodo, não depósito ou publicação externa. Permanecem congelados target families, budgets, regimes de canal, profundidades de treino e teste, memória, baseline ladder, endpoint de exact recovery sem leakage literal, controles de private code e side-channel, análise estatística e regra prospectiva de amendment.
limit: >-
  RL communication, sequential LLM relays, steganografia robusta a paraphrase/word blocking e decodabilidade relativa ao receptor são antecedentes materiais. O teste decisivo ainda não foi executado: se um codec fixo semantic/paraphrase-robust ou uma cifra in-context, com bandwidth e calls pareados, igualar o relay em profundidades e modelos não vistos, o maquinário RL específico não demonstrou valor adicional. A correção de packaging não acrescenta evidência científica e busca negativa não prova prioridade.
related_file: "audits/zenodo-readiness/2026-09-20-0044Z-fix-round-final.md"
relations:
  - type: tests
    target: rl_relay_transducers
    note: "Testa o canal relay sob recuperação exata, supressão literal, transferência e controles de private code."
---
