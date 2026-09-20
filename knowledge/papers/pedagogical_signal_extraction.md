---
type: paper
title: "Structured Irregularity"
family: "Aprendizagem e tempo informacional"
kind: "aprendizagem de invariantes"
scientific_tier: "C"
interest_tier: "A"
confidence: "medium"
idea: >-
  Pergunta como um aprendiz pode distinguir ruído, opacidade temporária, padrão acidental e ocultação, e testar se uma observação antiga se torna realmente útil depois que aprende uma estrutura capaz de reinterpretá-la.
status: >-
  Position paper v0.1 agora congelado e repository-ready para empacotamento Zenodo, sem depósito externo e sem resultados empíricos. A versão auditada trata machine teaching learner-relative, curricula sequenciais, ensino sob incerteza, retrospective revaluation e representações preditivas compactas como antecedentes. A contribuição candidata foi estreitada para a conjunção de opacidade temporária relativa ao aprendiz, uma taxonomia operacional de quatro tipos de irregularidade e uma ablação pós-unlock em held-out que mede se uma observação anterior passa a carregar valor depois que a estrutura de decodificação foi adquirida.
limit: >-
  O paper ainda não demonstra empiricamente que o diagnóstico separa estrutura útil de reconstrução retrospectiva. O teste decisivo continua sendo remover a observação antes opaca depois do unlock e verificar perda held-out contra baselines sequenciais/preditivos pareados; se eles reproduzirem o mesmo efeito, o framework adicional perde necessidade explicativa. Readiness editorial e busca negativa não estabelecem prioridade nem eficácia.
related_file: "audits/prior-art/pedagogical-signal-extraction-2026-09-18.md"
relations:
  - type: tests
    target: generative_machine_teaching
    note: "Testa quando uma observação inicialmente opaca passa a carregar valor preditivo depois que a representação é aprendida."
---
