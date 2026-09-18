---
type: paper
file: "semantic_tokenization_transformers.md"
title: "Semantic Tokenization Transformers"
family: "Método formal"
kind: "position paper"
scientific_tier: "D"
interest_tier: "A"
confidence: "medium"
idea: "Propõe mover a sequência principal de treino de subwords para chunks semânticos sobrepostos: um teacher fixo produz embeddings, RVQ os discretiza em códigos, o Transformer prevê esses códigos e a saída volta a texto por representantes reais do corpus."
status: "Position paper não revisado por pares e sem resultados empíricos. A auditoria reproduzível mostra antecedentes pre-cutoff fortes para quase todo o centro arquitetural: Ippolito et al. já modelavam no nível de sentenças, LCM/Quant-LCM já combinava representações semânticas pré-treinadas, RVQ e modelagem autoregressiva, e SemToken/H-Net ocupam boa parte da motivação de compressão semântica."
limit: "A fronteira candidata fica na composição fixed teacher + chunks sobrepostos + RVQ offline + semantic-code LM + reconstrução por medoids/path search + overlap stitching + normalização restrita. O teste decisivo é comparar diretamente com Quant-LCM e controles de retrieval: se eles reproduzirem os benefícios e a cadeia de reconstrução não melhorar fidelidade/controle sob orçamento pareado, a complexidade específica do STT não se justifica. Busca negativa não prova prioridade."
related_file: "audits/prior-art/semantic-tokenization-transformers-2026-09-18.md"
related_label: "ler auditoria de prior art"
updated: "2026-09-18"
---

# Semantic Tokenization Transformers

Canonical OKF card for the public Papers portfolio. The paper itself remains in `franklinbaldo/papers`.
