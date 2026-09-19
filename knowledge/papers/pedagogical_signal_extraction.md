---
type: paper
title: "Pedagogical Signal Extraction"
family: "Aprendizagem e tempo informacional"
kind: "aprendizagem de invariantes"
scientific_tier: "C"
interest_tier: "A"
confidence: "medium"
idea: >-
  Pergunta como um aprendiz pode distinguir ruído de estrutura ainda não decodificável e testar se evidência antiga se torna realmente útil depois que aprende uma representação capaz de interpretá-la.
status: >-
  Position paper não revisado por pares, sem resultados empíricos. A auditoria reproduzível mostra que machine teaching learner-relative, curricula sequenciais, ensino sob incerteza, retrospective revaluation e representações preditivas compactas já cobrem grande parte dos componentes. A fronteira candidata fica no teste conjunto de progressive decodability, structured irregularity e retrospective gain medido por ablação pós-unlock em held-out.
limit: >-
  O fenômeno amplo de 'evidência posterior muda o valor da evidência anterior' não é novo, nem são currículo adaptativo e predictive bottlenecks. O teste decisivo é remover a observação antes opaca depois que a regra de decodificação já foi aprendida e verificar se o desempenho held-out piora; se um baseline sequencial/preditivo pareado reproduzir o mesmo efeito, o framework adicional não foi necessário. Busca negativa não prova prioridade.
related_file: "audits/prior-art/pedagogical-signal-extraction-2026-09-18.md"
relations:
  - type: tests
    target: generative_machine_teaching
    note: "Testa quando uma observação inicialmente opaca passa a carregar valor preditivo depois que a representação é aprendida."
---
