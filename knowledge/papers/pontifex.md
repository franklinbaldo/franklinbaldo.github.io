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
  O Pontifex v0.1 permanece congelado e repository-ready para empacotamento Zenodo, sem depósito externo. A linha experimental posterior continua produzindo evidência mixed. No experimento SciFact mais recente, dentro de uma região top-100 fixada por Ridge e com o mesmo orçamento de pares enviados ao cross-encoder, Ridge+Pontifex selecionou subconjuntos melhores que Ridge em C=10, 20 e 50; em C=50, o nDCG@10 pós-cross-encoder foi 0,652883 contra 0,645452. Um residual com correspondências embaralhadas não reproduziu o ganho, mostrando que as correspondências A↔B verdadeiras carregam informação útil de refinamento local. Ao mesmo tempo, A-only continua melhor no retrieval direto, e a literatura anterior já cobre reranking em cascata, mapas locais/piecewise e combinações global+local; portanto o resultado sustenta uma utilidade estreita de correspondências locais, não uma novidade arquitetural ampla nem um mecanismo especificamente Pontifex.
limit: >-
  A atribuição mecanística ainda é o principal gargalo. O benchmark SciFact precisa comparar Pontifex, sob o mesmo orçamento de pares, com mapeadores locais genéricos fortes — por exemplo k-NN local ridge/affine, local Procrustes ou piecewise-linear — porque prior art prévio já prevê ganhos de alinhamento local. O ganho de C=10/20/50 também é qualidade no mesmo número de chamadas caras, não economia end-to-end medida; A-only segue superior no retrieval direto e a generalização para outro dataset/model triplet ainda falta. Separadamente, a hipótese de trajetória ordenada continua sem execução discriminante: um ganho de ordem não provaria path dependence sem ordens alternativas congeladas, resets/estados pareados e novas respostas. Esses limites mantêm o tier científico em C apesar do avanço experimental.
related_file: "audits/prior-art/pontifex-scifact-hybrid-reranking-2026-09-20.md"
relations:
  - type: contrasts_with
    target: semantic_atlas
    note: "Pontifex usa intervenções, trajetórias e correspondências locais entre espaços; Semantic Atlas mede estrutura relacional estática. Os benchmarks aninhados procuram separar geometria, intervenção, ordem e refinamento local."
  - type: shares_mechanism_with
    target: semantic_observers
    note: "Ambos tratam cada sistema como um observador local e evitam assumir coordenadas globais compartilhadas como ponto de partida."
---
