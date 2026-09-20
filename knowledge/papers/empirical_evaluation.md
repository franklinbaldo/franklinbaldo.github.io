---
type: paper
title: "Avaliação empírica no TJRO"
family: "Raciocínio jurídico auditável"
kind: "protocolo empírico / pré-registro planejado"
scientific_tier: "D"
interest_tier: "A"
confidence: "high"
idea: >-
  Define como testar empiricamente parte do programa jurídico em decisões reais do TJRO, antes de olhar os resultados.
status: >-
  O estudo continua sem resultados, mas a execução Q1 avançou materialmente. O corpus público CausaGanha/TJRO JURIS e o sample manifest reproduzível deixaram de ser blockers; o runner batched reduziu o desenho de 60 para 16 requests, a falha de JSON truncado foi reproduzida e isolada, envelopes structured-output foram adicionados e o retry para 408/429/5xx foi congelado sem alterar amostra, condições, rubrica, blinding ou agregação. No head atual do piloto, OKF conformance e o workflow da amostra passam; a execução externa para no limite gratuito do Gemini 2.5 Flash-Lite — 20 GenerateRequestsPerDayPerProjectPerModel — depois de seis retries 429. Nenhum output parcial foi promovido a claim.
limit: >-
  O gargalo atual é externo e transitório, mas a ausência de resultado continua material: ainda não há comparação observada entre as condições nem evidência de eficácia. Além disso, o piloto Q1 usa P_proxy como proxy de structured prompting para a pipeline de seis fases e não executa Lean compilation, portanto um eventual resultado será exploratório e não confirmará a pipeline Lean completa. A tier científica permanece D até existir uma execução prospectiva completa, com provenance dos modelos/prompts/outputs e integração explícita da evidência no paper; o manuscrito ainda precisa manter a fronteira entre desenho pré-registrado e resultado executado auditável.
related_file: "audits/zenodo-readiness/2026-09-20-0350Z.md"
relations:
  - type: tests
    target: embedding_seeded_tournament
    note: "Leva a hipótese de proximidade semântica e comparação de decisões para um protocolo empírico em julgados do TJRO."
---
