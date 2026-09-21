---
type: paper
source_url: "https://github.com/franklinbaldo/papers/blob/main/semantic-atlas/manifolds.md"
title: "Semantic Atlas em manifolds"
family: "Geometria semântica"
kind: "extensão geométrica"
scientific_tier: "C"
interest_tier: "S"
confidence: "low"
idea: >-
  Substitui a ideia de um espaço semântico global simples por vários mapas locais, tentando respeitar curvas, gargalos e direções que vivem perto do suporte real dos dados.
status: >-
  A v0.1 está tecnicamente pronta para empacotamento como preprint no Zenodo. O manuscrito incorporou a auditoria dedicada de prior art, estreitou a contribuição para a integração SRF/quasar + charts locais + separação inter/intra-manifold + alinhamento local falsificável e acrescentou baselines de rejeição e metadados de publicação; continua sendo uma extensão conceitual/experimental sem demonstração empírica de vantagem da camada manifold.
limit: >-
  Prontidão arquivística não é validação científica. MSMA, DMET, concept manifolds, Procrustes, steering geométrico e métodos espectrais já cobrem componentes importantes; o teste decisivo continua sendo mostrar que a integração SRF + charts locais melhora previsão, navegação ou controle sob complexidade comparável, com alinhamento local sobrevivendo a held-out e shuffled-pair controls. Se esse ganho não aparecer, a extensão manifold deve ser rejeitada sem derrubar o Semantic Atlas mais amplo.
related_file: "semantic-atlas/prior-art/manifolds-2026-09-19.md"
relations:
  - type: extends
    target: semantic_atlas
    note: "Estende a geometria global do Atlas para charts locais e estrutura manifold-aware."
---
