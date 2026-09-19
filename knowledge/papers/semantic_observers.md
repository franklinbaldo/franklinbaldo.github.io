---
type: paper
title: "Semantic Observers"
family: "Geometria semântica"
kind: "observabilidade semântica"
scientific_tier: "C"
interest_tier: "S"
confidence: "medium"
idea: >-
  Trata cada embedding como um observador parcial, não como o próprio espaço semântico: mede quais relações ele consegue enxergar em cada escala, onde distorce estrutura e o que sobra como parallax depois de alinhar modelos.
status: >-
  Position paper com formalização operacional, seis hipóteses falsificáveis e programa experimental por estágios; a auditoria reproduzível de prior art restringe a contribuição candidata ao protocolo conjunto de resolução multiescala, informativeness direcional, erros topológicos, parallax residual e fusão multiobservador.
limit: >-
  Common spaces, decomposição shared/private, residuais pós-alinhamento informativos e comparação topológica entre observadores já têm antecedentes fortes. Ainda falta demonstrar estabilidade dos perfis de resolução e ganho externo da fusão sobre o melhor observador isolado; a combinação completa não foi localizada antes do cutoff, mas busca negativa não prova novidade.
related_file: "audits/prior-art/semantic-observers-2026-09-17.md"
relations:
  - type: extends
    target: semantic_atlas_static_geometry
    note: "Estende a medição estática de acordo local para resolução, parallax e fusão entre múltiplos observadores."
---
