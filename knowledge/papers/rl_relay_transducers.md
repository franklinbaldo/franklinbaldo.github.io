---
type: paper
file: "rl_relay_transducers.md"
title: "Relay transducers por RL"
family: "Comunicação emergente e agência"
kind: "controle/representação"
scientific_tier: "C"
interest_tier: "S"
confidence: "medium"
idea: "Coloca transdutores discretos treináveis entre modelos maiores e combina esse canal com memória associativa: recall semântico propõe candidatos, enquanto uma chave funcional separada tenta aprender quais memórias realmente ajudam a recompensa downstream."
status: "Position paper não revisado por pares, com arquitetura e programa de avaliação, mas sem implementação ou resultados empíricos. A auditoria reproduzível mostra que semantic recall seguido de reranking por utilidade aprendida, crédito tardio para memórias recuperadas e retrieval aprendido ao lado de LMs congelados já eram prior art pre-cutoff em trabalhos como MemRL, MemQ, REPLUG e PRCA. O residual mais estreito é o mecanismo dual-key: chave semântica congelada + chave funcional treinável movida por vantagem assinada dentro do relay bind/reject/commit."
limit: "Novidade ampla em reward-aware retrieval não se sustenta, e a ausência de antecedente exato para a conjunção não prova prioridade. O teste que importa é parear orçamento e memória contra baselines simples de Q-value/utility reranking: se eles reproduzirem utilidade, transferência e custo sem a functional key e sua atualização assinada, o mecanismo adicional não demonstrou valor causal."
related_file: "audits/prior-art/rl-relay-reward-conditioned-retrieval-2026-09-18.md"
related_label: "ler auditoria de prior art"
updated: "2026-09-18"
---

# Relay transducers por RL

Canonical OKF card for the public Papers portfolio. The paper itself remains in `franklinbaldo/papers`.
