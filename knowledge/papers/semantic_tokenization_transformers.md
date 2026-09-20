---
type: paper
title: "Semantic Tokenization Transformers"
family: "Método formal"
kind: "position paper"
scientific_tier: "D"
interest_tier: "A"
confidence: "medium"
idea: >-
  Propõe mover a sequência principal de treino de subwords para chunks semânticos sobrepostos: um teacher fixo produz embeddings, RVQ os discretiza em códigos, o Transformer prevê esses códigos e a saída volta a texto por representantes reais do corpus.
status: >-
  Position paper não revisado por pares e ainda sem resultados empíricos. A v0.1 já incorporou a auditoria de prior art, trata LCM/Quant-LCM e outros predecessores como baselines em vez de novidade própria, separa os erros da cadeia de reconstrução e está tecnicamente pronta para empacotamento no Zenodo como preprint aberto; nenhum depósito foi feito.
limit: >-
  A contribuição candidata ficou estreita: chunks sobrepostos + códigos semânticos fixos + medoids reais + seleção coerente de caminho + stitching + normalização restrita. O teste decisivo é comparar essa cadeia com Quant-LCM e controles de retrieval/decoding sob orçamento pareado; sem ganho de fidelidade, controle ou custo, a complexidade específica do STT não se justifica. Readiness editorial não é evidência empírica.
related_file: "audits/prior-art/semantic-tokenization-transformers-2026-09-18.md"
---
