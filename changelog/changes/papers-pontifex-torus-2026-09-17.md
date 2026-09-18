---
type: changelog
date: 2026-09-17
description: Adiciona Pontifex Torus e sua auditoria de prior art ao mapa público de papers.
tags: [papers, research, pontifex, interpretability, prior-art]
---

# Pontifex Torus entra no mapa de papers

- O `franklinbaldo/papers` incorporou em `main` a auditoria `audits/prior-art/pontifex-torus-occlusion-cartography-2026-09-17.md`, enquanto o living paper `pontifex_torus.md` permanece na PR #485.
- A página passa a tratar `Pontifex Torus` como extensão empírica/exploratória separada de `Pontifex`, com link para o paper no branch da PR e para a auditoria já mergeada em `main`.
- `scientific_tier=C`, `interest_tier=S`, confiança `medium`: há estrutura técnica, resultados toy e controles suficientes para sair de hipótese puramente verbal, mas ainda não há validação downstream em corpus real, revisão independente nem maturidade para tier B.
- A auditoria estreita a novidade: probes compartilhados, relative representations, relações de resposta a intervenções, geometria/ciclos e seleção k-center têm antecedentes claros. A combinação mais estreita — coordenadas de oclusão compartilhadas + response fields dentro de cada encoder + predição entre campos + travessia ativa parcial — não foi localizada antes do cutoff, e isso continua sendo evidência negativa, não prova de prioridade.
- A relação narrativa agora registra `Pontifex → Pontifex Torus` como `extends/tests`: o Torus nasce da pressão falsificadora sobre a cabeça de convergência direta e passa a testar cartografia local entre campos de resposta. Também registra que a semelhança com `Semantic Atlas` é de mecanismo/cartografia, não uma dependência histórica assumida, e que `Semantic Observers` funciona como contraponto de medição multiescala.
- O commit `e5f2243191a43fc3fb09d17a4e14a3f2cb55c76c` em `franklinbaldo/papers` adiciona apenas cinco explicações visuais Mermaid e declara não alterar claims/resultados; por isso não move tiers nesta rodada.
