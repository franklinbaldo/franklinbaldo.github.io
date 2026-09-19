---
type: paper
title: "Semantic Atlas em manifolds"
family: "Geometria semântica"
kind: "extensão geométrica"
scientific_tier: "C"
interest_tier: "S"
confidence: "low"
idea: >-
  Substitui a ideia de um espaço semântico global simples por vários mapas locais, tentando respeitar curvas, gargalos e direções que vivem perto do suporte real dos dados.
status: >-
  Extensão manifold-aware do Atlas com auditoria dedicada de prior art concluída. A auditoria encontrou antecedentes fortes para manifolds semânticos, geometria global/local, alinhamento por Procrustes, dinâmica/geodesic steering e diagnósticos espectrais; a contribuição que ainda merece teste fica na integração ancorada no SRF, com roteamento inter-manifold versus movimento intra-manifold, alinhamento cross-model tratado como camada falsificável e controles pareados contra representações mais simples.
limit: >-
  Os componentes geométricos isolados não sustentam novidade: MSMA (2025) e DMET (2025) são antecedentes particularmente próximos, além de trabalhos anteriores sobre concept manifolds, steering e atlas locais. A versão arquivável ainda precisa incorporar esses limites explicitamente e mostrar que a integração SRF + charts locais melhora previsão, navegação ou controle sob complexidade comparável; sem esse ganho, a camada manifold é custo extra sem benefício demonstrado.
related_file: "audits/prior-art/semantic-atlas-manifolds-2026-09-19.md"
relations:
  - type: extends
    target: semantic_atlas
    note: "Estende a geometria global do Atlas para charts locais e estrutura manifold-aware."
---
