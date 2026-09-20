---
type: paper
title: "Pontifex"
family: "Interpretabilidade"
kind: "position paper"
scientific_tier: "C"
interest_tier: "S"
confidence: "medium"
idea: >-
  Trata sistemas diferentes como observadores locais e tenta descobrir estrutura semântica comum pelas respostas às mesmas intervenções, sem exigir alinhamento prévio de coordenadas latentes. A linha experimental posterior vai além do conjunto das intervenções: testa se a ordem dessas mesmas respostas forma uma trajetória que acrescenta informação preditiva própria.
status: >-
  O objeto original Pontifex v0.1 está agora congelado e repository-ready para empacotamento Zenodo, sem depósito externo: byte-level post-hoc occlusion, comparação bilateral de similaridade, sondagem paralela de múltiplos encoders não alinhados e uma cabeça de convergência aprendida sobre esses padrões escalares. O paper original permanece pre-empírico; a literatura anterior cobre occlusion/leave-one-out, byte-level/tokenizer-free representations e consenso entre modelos, então a contribuição candidata é a conjunção específica, não cada ingrediente. A linha experimental posterior continua separada e já tem evidência mixed: correspondências verdadeiras superam controles destruídos em alguns regimes, enquanto FiQA/NFCorpus e o piloto MS MARCO impedem claims universais. O benchmark mais recente congela a escada geometria estática → mesmas intervenções sem ordem → mesmas respostas com ordem congelada.
limit: >-
  O v0.1 original ainda não traz validação empírica da conjunção proposta, e a linha posterior ainda não demonstrou que a ordem acrescenta informação preditiva. Mesmo um ganho da versão ordenada não provaria path dependence do substrato sem ordens alternativas prospectivamente congeladas, estados pareados/resetados e novas respostas. Baselines permutation-invariant fortes, path signatures, carryover, drift e estado suficiente continuam controles essenciais; busca negativa e readiness editorial não estabelecem prioridade nem geometria universal.
related_file: "audits/prior-art/pontifex-ordered-trajectory-discriminant-2026-09-20.md"
relations:
  - type: contrasts_with
    target: semantic_atlas
    note: "Pontifex mede respostas a intervenções e agora também sua ordem; Semantic Atlas mede estrutura relacional estática. O benchmark aninhado separa geometria, intervenção e trajetória."
  - type: shares_mechanism_with
    target: semantic_observers
    note: "Ambos tratam cada sistema como um observador local e evitam assumir coordenadas globais compartilhadas como ponto de partida."
---
