---
type: paper
title: "ESHTR: torneios semânticos para decisões judiciais"
family: "Método formal"
kind: "avaliação por LLM"
scientific_tier: "C"
interest_tier: "A"
confidence: "medium"
idea: >-
  Agrupa decisões semanticamente próximas por embeddings, faz comparações pareadas com um júri heterogêneo de LLMs dentro de cada grupo e depois compara vencedores entre grupos. A hipótese testável restante é condicional: distância semântica pode piorar a estabilidade do julgamento mesmo depois de controlar dificuldade/margem de qualidade e outros confundidores.
status: >-
  Position paper v0.1 congelado e repository-ready para empacotamento Zenodo, sem depósito externo e ainda sem resultado empírico. O freeze credita explicitamente Pairwise Ranking Prompting, CrowDC, SCARPA, EZ-Sort/Dodgersort, trabalhos sobre não-transitividade de LLM judges e Magis-Bench; portanto não reivindica novidade para pairwise LLM ranking, ranking divide-and-conquer, pre-ordering por representação, júris heterogêneos ou avaliação jurídica multi-LLM por rubrica. A contribuição candidata foi estreitada para o grafo de comparação por tipo semântico judicial + Semantic Proximity Hypothesis condicional + championship cross-type, com protocolo pré-resultados, controles de perturbação, âncora humana e baselines de orçamento pareado congelados.
limit: >-
  A Semantic Proximity Hypothesis continua sem validação e pode estar confundida pela dificuldade/margem de qualidade. A Phase 3 produz uma hierarquia parcial, não um ranking global sem pontes cross-cluster ou modelo de ligação. O teste decisivo precisa usar ground truth de especialistas, cruzar distância semântica com margem de qualidade, comparar pairwise com scoring pointwise/reference-based e scheduling baselines a custo pareado e congelar modelos, prompts, seeds e grafo antes de olhar resultados. Readiness editorial e busca negativa não provam prioridade.
related_file: "audits/prior-art/embedding-seeded-tournament-falsification-2026-09-19.md"
---
