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
  Position paper não revisado por pares e ainda sem resultado empírico. A auditoria adversarial mais recente corrigiu duas claims materiais: rankings locais mais o torneio de campeões formam apenas uma hierarquia parcial, não um ranking global sem pontes cross-cluster ou modelo de ligação; e, para n=1000 e k=20 no protocolo all-pairs descrito, são 24.690 comparações (~95,1% de redução), não ~1.250 (~99,7%). O manuscrito foi estreitado para refletir essas correções.
limit: >-
  A Semantic Proximity Hypothesis continua sem validação e pode estar confundida pela própria dificuldade das comparações. O teste decisivo precisa cruzar distância semântica com margem de qualidade usando ground truth de especialistas, comparar pairwise com scoring pointwise/reference-based e baselines de scheduling a custo pareado, e usar pontes entre clusters se quiser identificar um ranking global.
related_file: "audits/prior-art/embedding-seeded-tournament-falsification-2026-09-19.md"
---
