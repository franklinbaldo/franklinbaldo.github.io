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
  A baseline v0.1 de cinco seeds continua sendo um diagnóstico reproduzível da formulação reduzida de 512 neurônios, open-loop e com readout supervisionado. A linha whole-CNS avançou materialmente: o repositório agora congelou um protocolo prospectivo C0→C6 para percepção→estado→ação→reinforcement com interfaces sensoriais, appetitive/aversive/omission-relief e saídas motoras biologicamente endereçadas, adapters externos pareados e controles rewired/random/adapter-only/conventional. Isso formaliza o teste pretendido, mas ainda não produz evidência whole-CNS; os experimentos de engenharia de sensores/clock do programa de carro são infraestrutura e não contam como ganho da topologia MaleCNS.
limit: >-
  O principal blocker deixou de ser a ausência de protocolo e passou a ser sua execução: ainda falta rodar C1 whole-CNS com um atuador/um sinal, matched controls, split train/validation/test e endpoint congelado, depois integrar o resultado ao paper e repetir a auditoria claim-specific antes de qualquer freeze arquival. O resultado antigo permanece limitado ao reservoir reduzido e não deve ser generalizado ao sistema whole-CNS.
related_file: "experiments/malecns_car_interface/PROTOCOL-WHOLE-CNS-CLOSED-LOOP-v1.md"
---
