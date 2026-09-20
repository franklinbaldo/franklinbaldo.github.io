---
type: paper
title: "Pontifex"
family: "Interpretabilidade"
kind: "position paper"
scientific_tier: "C"
interest_tier: "S"
confidence: "medium"
idea: >-
  Trata sistemas diferentes como observadores locais e tenta descobrir estrutura semântica comum pelas respostas às mesmas intervenções, sem exigir alinhamento prévio de coordenadas latentes. A hipótese metodológica mais recente vai além do conjunto das intervenções: testa se a ordem dessas mesmas respostas forma uma trajetória que acrescenta informação preditiva própria.
status: >-
  O paper original continua sendo um position paper, mas a linha experimental já tem evidência mixed: correspondências verdadeiras superam controles destruídos em regimes concretos, enquanto FiQA/NFCorpus e o piloto MS MARCO impedem qualquer claim universal. O avanço metodológico mais recente tornou a trajetória ordenada o discriminante central do próximo benchmark. O Unified Semantic Identification Benchmark agora congela uma escada aninhada: geometria estática do Semantic Atlas → mesmas intervenções e respostas sem ordem → exatamente as mesmas intervenções e respostas com a ordem congelada. Permutações completas, swaps locais, reversão e controles de boundary isolam a contribuição da sequência sem aumentar observações, capacidade ou orçamento.
limit: >-
  Ainda não há resultado demonstrando que a ordem ajuda. O teste central passa a exigir dois incrementos separáveis: intervenções não ordenadas precisam acrescentar informação além da geometria estática, e a trajetória ordenada precisa depois superar esse mesmo conjunto sem ordem sob orçamento pareado. Se o segundo passo falhar, o programa terá evidência para informação interventional, mas não para informação especificamente sequencial. Mesmo um ganho positivo não provaria por si só semântica narrativa, direção causal intrínseca, Torus ou geometria universal; promoção científica exige efeito held-out robusto e nulls prospectivamente congelados.
related_file: "experiments/unified_semantic_identification/protocol.md"
relations:
  - type: contrasts_with
    target: semantic_atlas
    note: "Pontifex mede respostas a intervenções e agora também sua ordem; Semantic Atlas mede estrutura relacional estática. O benchmark aninhado separa geometria, intervenção e trajetória."
  - type: shares_mechanism_with
    target: semantic_observers
    note: "Ambos tratam cada sistema como um observador local e evitam assumir coordenadas globais compartilhadas como ponto de partida."
---
