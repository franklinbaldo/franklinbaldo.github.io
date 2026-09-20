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
  O paper original continua sendo um position paper pre-empírico, enquanto a linha experimental posterior já tem evidência mixed: correspondências verdadeiras superam controles destruídos em regimes concretos, mas FiQA/NFCorpus e o piloto MS MARCO impedem qualquer claim universal. O avanço metodológico mais recente tornou a trajetória ordenada o discriminante central do próximo benchmark. O Unified Semantic Identification Benchmark congela uma escada aninhada: geometria estática do Semantic Atlas → mesmas intervenções e respostas sem ordem → exatamente as mesmas intervenções e respostas com a ordem congelada. A auditoria de prior art deixa explícito que esse desenho é desenvolvimento posterior e não retrodata a formulação específica para o paper original.
limit: >-
  Ainda não há resultado demonstrando que a ordem ajuda. Além disso, efeitos de sequência, carryover, dynamic treatment regimes e representações order-sensitive de trajetórias têm prior art forte. O teste atual isola apenas se a ordem acrescenta informação preditiva ao mesmo multiset de respostas; ele não demonstra path dependence do substrato. Para sustentar essa interpretação mais forte será preciso executar ordens alternativas prospectivamente congeladas a partir de estados pareados/resetados e recolher novas respostas. O comparator sem ordem deve ser rico e permutation-invariant, não um bag fraco, e o benchmark precisa enfrentar path-signature, período/carryover, drift, estado suficiente e uma tarefa deliberadamente permutation-invariant como controles. Mesmo um ganho positivo não provaria por si só semântica narrativa, direção causal intrínseca, Torus ou geometria universal.
related_file: "audits/prior-art/pontifex-ordered-trajectory-discriminant-2026-09-20.md"
relations:
  - type: contrasts_with
    target: semantic_atlas
    note: "Pontifex mede respostas a intervenções e agora também sua ordem; Semantic Atlas mede estrutura relacional estática. O benchmark aninhado separa geometria, intervenção e trajetória."
  - type: shares_mechanism_with
    target: semantic_observers
    note: "Ambos tratam cada sistema como um observador local e evitam assumir coordenadas globais compartilhadas como ponto de partida."
---
