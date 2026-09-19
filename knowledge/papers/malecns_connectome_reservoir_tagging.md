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
  A baseline v0.1 de cinco seeds está congelada como candidata de arquivo e continua sendo um resultado negativo/indeterminado para vantagem da topologia biológica. A auditoria adversarial mais recente corrigiu o mapa de prior art: nanoFLY já combinava MaleCNS, linguagem e a necessidade de controles degree-matched antes do nosso cutoff; além disso, nosso null, conn2res e um controle direct-input mais simples reduzem a confiança numa vantagem genérica da topologia. Evidência posterior do nanoFLY aponta na direção oposta em outro regime, então a leitura atual é dependência de tarefa/dinâmica, não abandono da hipótese.
limit: >-
  O pacote exato de tagging jurídico byte-level com null recorrente degree-preserving e baseline sem recorrência continua não localizado antes do cutoff, mas isso é só uma busca negativa. Para sustentar uma claim positiva, ainda falta um teste untouched com baseline sequencial simples e pareado, controle de sensibilidade às dinâmicas recorrentes e ganho estável sobre wiring embaralhado; o corpus atual é pequeno e a evidência existente favorece cautela sobre interpretar escala ou recorrência como benefício específico do connectoma.
related_file: "audits/prior-art/malecns-tagging-falsification-2026-09-19.md"
---
