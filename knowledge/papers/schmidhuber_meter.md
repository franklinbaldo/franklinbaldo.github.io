---
type: paper
title: "Schmidhuber Meter"
family: "Método formal"
kind: "metaciência/bibliometria"
scientific_tier: "C"
interest_tier: "A"
confidence: "medium"
idea: >-
  Transforma uma pergunta nebulosa — quando um trabalho posterior parece dever crédito bibliográfico a uma claim anterior? — num índice auditável por claim, separando prioridade pública, overlap substantivo, discoverability histórica e crédito efetivamente recebido.
status: >-
  A v0.1 está congelada e tecnicamente pronta para Zenodo como metodologia explícita, não como escala validada. A auditoria adversarial foi incorporada: o score 10·P·O·D·(1−C) passa a ser tratado como indicador composto não calibrado; comparações consequenciais devem preservar o vetor bruto, explicitar missingness e testar sensibilidade a pesos, normalização, agregação e tratamento de dados ausentes. O texto também restringe a novidade à conjunção operacional claim-level e mantém dependência causal, plágio e intenção fora do índice.
limit: >-
  Continua faltando a validação que justificaria subir o tier científico: calibração empírica, concordância entre avaliadores, controles negativos/positivos em escala e validação externa contra tarefas de missed citations ou julgamentos especialistas. A análise de sensibilidade agora é requisito do método, mas ainda não transforma a fórmula v0.1 em medida universal nem garante estabilidade de rankings.
relations:
  - type: applies
    target: proveniencia_claims
    note: "Aplica a disciplina de proveniência ao problema de crédito científico em nível de claim."
---
