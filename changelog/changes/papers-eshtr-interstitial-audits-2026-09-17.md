---
type: changelog
date: 2026-09-17
description: Atualiza o mapa de papers após auditorias de prior art de ESHTR e Interstitial Agent.
tags: [papers, research, eshtr, interstitial-agent, prior-art]
---

# ESHTR e Interstitial Agent: fronteiras de novidade mais estreitas

- `franklinbaldo/papers` incorporou em `main` a auditoria `audits/prior-art/embedding-seeded-tournament-2026-09-17.md`; a auditoria de `interstitial_agent.md` está em revisão na PR #502.
- Em ESHTR, pairwise LLM ranking, divide-and-conquer, pré-ordenação por representação, júris heterogêneos, não-transitividade e avaliação jurídica brasileira têm antecedentes pre-cutoff. A questão distintiva restante é a conjunção completa e, sobretudo, a hipótese direcional de que distância semântica aumenta não-transitividade.
- Em Interstitial Agent, comunicação oculta, decodabilidade relativa ao receptor e o `compositional safety gap` têm antecedentes fortes; a combinação ainda não localizada é o relay discreto aprendido entre LLMs black-box, com recompensa tardia, controles de memória e atribuição explícita de agência ao relay.
- Os tiers permanecem estáveis: ESHTR em `scientific_tier=C`, `interest_tier=A`, confiança `medium`; Interstitial Agent em `scientific_tier=C`, `interest_tier=S`, confiança `medium`. As auditorias alteram a fronteira de originalidade, mas não a maturidade empírica dos papers.
- O mapa de relações agora explicita que `empirical_evaluation.md` testa a Semantic Proximity Hypothesis de ESHTR ao comparar concordância dentro e entre clusters.
- Resultados negativos de busca continuam tratados como evidência limitada, nunca como prova de prioridade.