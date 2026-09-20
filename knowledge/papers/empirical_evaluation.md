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
  O estudo continua sem resultados, mas a fronteira de dados avançou materialmente: o corpus público CausaGanha/TJRO JURIS já foi confirmado como fonte, e um sampler determinístico em DuckDB congelou com sucesso 30 decisões RPPS/IPERON em workflow reproduzível, com manifestos e hashes preservados. Portanto aquisição de corpus deixou de ser blocker; o trabalho restante é executar a comparação pipeline-vs-baselines sobre essa amostra e registrar prompts, modelos, rubrica, outputs brutos e estatística. O manuscrito ainda se apresenta como desenho pré-registrado sem um identificador público de preregistração verificável, então esse rótulo também precisa ser alinhado antes do arquivamento.
limit: >-
  O avanço é de infraestrutura e desenho, não de evidência sobre a hipótese: ainda não há comparação observada entre o pipeline Lean/Argdown e os baselines, nem resultado sobre validade processual, persuasão ou estabilidade do ESHTR. A tierização científica permanece D enquanto faltar a execução prospectiva e um objeto público que fixe de forma verificável a versão decisória do protocolo; o sample freeze por si só não demonstra eficácia.
related_file: "audits/zenodo-readiness/2026-09-20-0044Z-fix-round-final.md"
relations:
  - type: tests
    target: embedding_seeded_tournament
    note: "Leva a hipótese de proximidade semântica e comparação de decisões para um protocolo empírico em julgados do TJRO."
---
