---
type: paper
title: "Pontifex"
family: "Interpretabilidade"
kind: "position paper"
scientific_tier: "C"
interest_tier: "S"
confidence: "medium"
idea: >-
  Trata sistemas diferentes como observadores locais e tenta descobrir estrutura semântica comum pelas respostas às mesmas intervenções, sem exigir alinhamento prévio de coordenadas latentes. A linha experimental posterior também pergunta se a ordem dessas respostas forma uma trajetória informativa e se correspondências locais entre espaços podem refinar regiões já encontradas por um mapa global.
status: >-
  O Pontifex v0.1 permanece congelado e repository-ready para empacotamento Zenodo, sem depósito externo. A linha experimental posterior agora tem três benchmarks de retrieval/reranking com resultado misto, mas mais concreto. Em SciFact e FiQA, correspondências A↔B verdadeiras melhoram a seleção local dentro de uma região global fixa no mesmo orçamento de cross-encoder; em FiQA, por exemplo, C=25 sobe de 0,311299 para 0,320932 nDCG@10 enquanto o residual embaralhado fica em 0,311619, mas os limiares prospectivos de 98%/99% não reduzem o número mínimo de chamadas caras. O ArguAna acrescenta o primeiro caso desta sequência em que o Pontifex standalone supera A-only no endpoint oficial: em K=1024, 0,374652 contra 0,369728 nDCG@10, ainda longe do B-oracle em 0,434150 e recuperando só cerca de 7,6% desse gap. No mesmo benchmark, Ridge+Pontifex melhora o Ridge selecionado de 0,355607 para 0,363678 enquanto o shuffled chega a 0,356157, e melhora o reranking em C=5–20. Porém a aparente economia no alvo de 99% também aparece no shuffled e em 98% todos empatam, então não há evidência de economia de compute correspondence-specific. O conjunto sustenta utilidade estreita de correspondências locais e um pequeno win direto externo, não superioridade arquitetural geral nem mecanismo especificamente Pontifex.
limit: >-
  A principal lacuna continua sendo atribuição mecanística e comparação operacional. A auditoria FiQA encontrou prior art forte para alinhamento assimétrico e adapters de embeddings, incluindo Residual MLP e Low-Rank Affine treinados em pares, então Pontifex precisa enfrentá-los sob o mesmo orçamento de correspondências; também faltam incerteza pareada por query, múltiplos shuffled/nulls ou uma estatística confirmatória prospectivamente congelada. No ArguAna, o seletor label-free por erro de coordenadas escolheu Ridge mesmo quando Procrustes/RankProcrustes tiveram retrieval oficial melhor, e A-only direto já supera o pipeline completo do host selecionado com cross-encoder. O próximo teste limpo deve manter hosts fortes lado a lado e passar A-only e, idealmente, B-oracle pelos mesmos candidate/resolver budgets antes de alegar ganho end-to-end. Separadamente, a hipótese de trajetória ordenada ainda não tem execução discriminante: ganho de ordem sozinho não prova path dependence sem ordens alternativas congeladas, resets/estados pareados e novas respostas. Esses limites mantêm o tier científico em C apesar do avanço experimental.
related_file: "audits/prior-art/pontifex-fiqa-hybrid-reranking-2026-09-20.md"
relations:
  - type: contrasts_with
    target: semantic_atlas
    note: "Pontifex usa intervenções, trajetórias e correspondências locais entre espaços; Semantic Atlas mede estrutura relacional estática. Os benchmarks aninhados procuram separar geometria, intervenção, ordem e refinamento local."
  - type: shares_mechanism_with
    target: semantic_observers
    note: "Ambos tratam cada sistema como um observador local e evitam assumir coordenadas globais compartilhadas como ponto de partida."
---
