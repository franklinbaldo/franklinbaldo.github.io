---
type: paper
title: "ESHTR: torneios semânticos para decisões judiciais"
family: "Método formal"
kind: "avaliação por LLM"
scientific_tier: "C"
interest_tier: "A"
confidence: "medium"
idea: "Agrupa decisões semanticamente próximas por embeddings, faz comparações pareadas com um júri heterogêneo de LLMs dentro de cada grupo e depois compara os vencedores entre grupos. A hipótese adicional é que comparações semanticamente distantes geram mais ciclos de preferência porque mudam o enquadramento do que conta como melhor."
status: "Position paper não revisado por pares, com método, análise de custo e protocolo falsificável, mas ainda sem resultado empírico. A auditoria reproduzível encontra antecedentes fortes para quase todos os componentes isolados e preserva como questões abertas a conjunção ESHTR e a Semantic Proximity Hypothesis."
limit: "Pairwise LLM ranking, divide-and-conquer, pré-ordenação por representação, júris heterogêneos, não-transitividade e avaliação jurídica brasileira já têm antecedentes pre-cutoff. A fronteira restante é a combinação específica e, sobretudo, a relação direcional distância semântica → não-transitividade; ela precisa de teste controlado, e busca negativa não prova prioridade."
related_file: "audits/prior-art/embedding-seeded-tournament-2026-09-17.md"
---
