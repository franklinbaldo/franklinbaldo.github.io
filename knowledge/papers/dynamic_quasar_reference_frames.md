---
type: paper
title: "Dynamic Quasar Reference Frames"
family: "Geometria semântica"
kind: "arquitetura dinâmica"
scientific_tier: "C"
interest_tier: "S"
confidence: "medium"
idea: >-
  Congela um campo vetorial externo antes de observar as transições dos modelos e pergunta se cada dinâmica pode ser descrita como uma amplitude de baixa capacidade sobre esse campo mais um residual mais simples.
status: >-
  A v0.1 continua semanticamente pronta como position paper sem resultados: o Dynamic Gauge Compression Test fixa antes da avaliação o campo externo, a família de amplitude por modelo, o vetor held-out de complexidade residual, os controles de campos alternativos e as regras aninhadas para claims de gauge, vórtice e Navier–Stokes. A auditoria de readiness mais recente detectou apenas um regresso de empacotamento/proveniência: depois da validação do SHA exato, o manuscrito recebeu a seção canônica de posição no programa Semantic Systems. Portanto os claims/citações/metadata permanecem prontos, mas o artefato Zenodo da fonte atual precisa ser reempacotado e ter a nova proveniência fixada antes de voltar a ser chamado de repository-ready.
limit: >-
  Coordenadas que simplificam dinâmica, shared latent dynamics, campo comum + desvio, residual ODE e semantic reference frames já têm antecedentes anteriores. Ainda falta executar DQRF-0B e mostrar em dados held-out/OOD que um gauge congelado vence campos alternativos pareados sem leakage; busca negativa não prova novidade. O refresh de packaging não acrescenta evidência científica e não muda o tier.
related_file: "audits/zenodo-readiness/2026-09-20-0005Z.md"
relations:
  - type: formalizes
    target: semantic_atlas
    note: "Formaliza a extensão dinâmica do Atlas com um campo externo congelado e um teste de compressão residual."
---
