---
type: paper
title: "MaleCNS como reservoir para tagging jurídico"
family: "Neurocomputação experimental"
kind: "empírico"
scientific_tier: "C"
interest_tier: "S"
confidence: "high"
idea: >-
  Usa a conectividade real do sistema nervoso da mosca como uma rede recorrente congelada e pergunta se essa topologia ajuda a marcar trechos de texto jurídico melhor que controles embaralhados e um baseline sem recorrência.
status: >-
  A baseline v0.1 de cinco seeds permanece reproduzível, mas foi reclassificada como diagnóstico metodológico de uma formulação reduzida: 512 neurônios de alto grau, reservoir open-loop e readout supervisionado. O resultado negativo/indeterminado vale para esse desenho; ele não testa de forma decisiva a hipótese hoje pretendida de um MaleCNS inteiro, em closed loop, com entradas sensoriais, reinforcement e saídas motoras biologicamente endereçadas. A auditoria de prior art continua relevante: nanoFLY já combinava MaleCNS, linguagem e controles degree-matched antes do cutoff.
limit: >-
  A principal lacuna agora é arquitetural, não apenas de duração do treino. Falta executar o CNS inteiro em percepção→estado→ação→reward, com reward/value e crédito temporal explícitos, interfaces sensoriais e neuromodulatórias biologicamente plausíveis e nulls whole-system pareados no mesmo orçamento. O baseline antigo ainda pede controles sequenciais/untouched para interpretar aquele regime, mas não deve ser generalizado para a arquitetura whole-CNS que ainda não foi testada.
related_file: "audits/prior-art/malecns-tagging-falsification-2026-09-19.md"
---
