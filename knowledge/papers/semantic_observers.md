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
  A v0.1 foi congelada em main como position paper pré-empírico e está repository-ready para o fluxo Zenodo no SHA canônico validado, sem depósito externo. O manuscrito agora integra explicitamente hyperalignment/common-space, Shared Response Models, estrutura individual confiável após alinhamento, shared/private factorization, comparação topológica entre observadores, fusão complementar e cross-subject semantic decoding como antecedentes; nem aligned residuals nem o termo parallax são tratados como novidade em si. A contribuição candidata fica restrita à conjunção registrada de perfis locais multiescala de resolução, testes direcionais de informativeness/refinement, falhas topológicas controladas, utilidade residual com nuisance controls, fusão reliability-aware que deve superar o melhor observador isolado em estrutura externa e falsificação por estágios. H1–H6 permanecem prospectivas; autor, licença, versão e metadata Zenodo estão completos, e o SHA mergeado exato passou o validate do repositório.
limit: >-
  Continua sem resultado empírico próprio: o programa precisa mostrar que perfis de resolução são estáveis sob resampling, escolha de modelo/camada e null calibration; que a ordem direcional de informativeness prevê recoverability fora da amostra; e que residuals e fusão acrescentam informação externamente validada além de baselines alinhados e do melhor observador isolado. Se esses ganhos desaparecerem com nuisance controls, orçamento pareado ou transferência cross-corpus, a interpretação forte de observadores/parallax perde suporte. A busca temporal limitada que não encontrou a conjunção completa não prova firstness.
related_file: "audits/prior-art/semantic-observers-2026-09-17.md"
relations:
  - type: extends
    target: semantic_atlas_static_geometry
    note: "Estende a medição estática de acordo local para resolução, parallax e fusão entre múltiplos observadores."
---
