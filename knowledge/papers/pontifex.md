---
type: paper
title: "Pontifex"
family: "Interpretabilidade"
kind: "position paper"
scientific_tier: "C"
interest_tier: "S"
confidence: "medium"
idea: >-
  Trata sistemas diferentes como observadores locais e tenta descobrir estrutura semântica comum pelas respostas às mesmas intervenções, sem exigir alinhamento prévio de coordenadas latentes. A linha experimental posterior também pergunta se a ordem dessas respostas forma uma trajetória informativa e se correspondências locais entre espaços podem refinar regiões já encontradas por um mapa global.
status: >-
  O Pontifex v0.1 permanece congelado e repository-ready para empacotamento Zenodo, sem depósito externo. O harvest canônico de benchmarks externos agora consolida AG News, Banking77, CLINC150, MASSIVE, SciFact, FiQA, ArguAna e SciDocs: o padrão mais repetível não é transporte standalone universal, mas valor marginal de correspondências verdadeiras como refinamento local sobre um mapa global competente. CLINC150 e MASSIVE mostram ganhos em regimes de poucos exemplos; no MASSIVE, o híbrido atinge o gate congelado de 50% do gap para B com K=512 enquanto Ridge precisa de K=1024. SciFact e FiQA replicam melhora de reranking no mesmo orçamento de chamadas caras, mas não economia quality-matched; ArguAna permanece o único win standalone desta sequência; AG News, Banking77 e SciDocs delimitam fortemente o claim. Os resultados absorvidos foram fechados e preservados no findings record, enquanto Quora segue como confirmação fresca ainda sem abrir o teste canônico. Separadamente, path-Tseitin continua um positive control simples e RuleIR G2b/G2c recupera programas sob scaffold explícito, mas a auditoria o enquadra como scaffolded relational program completion sob prior art de sketching, ILP e CEGIS. A hipótese de trajetória E5 continua sem execução discriminante.
limit: >-
  A evidência atual sustenta um regime estreito de refinamento correspondence-specific, não superioridade geral de transporte, economia total de compute ou mecanismo puramente localizador. Ganhos residuais ainda precisam sobreviver a hosts fortes, adapters genéricos pair-budget-matched, nulls e shuffles prospectivos e uma confirmação fresca em Quora com gates de target headroom e resolver viability. Em path-Tseitin, 2-SAT e baixa treewidth impedem claims amplos; em RuleIR, gramática, bounds, slots, programa circundante, compiler e verifier fornecem informação material e exigem comparação direta com ILP, sketch ou PBE sob a mesma hipótese e orçamento. Esses limites mantêm o scientific tier em C; o interest tier permanece S pela quantidade de falsificadores e linhas experimentais concretas.
related_file: "research/pontifex-benchmark-evidence-2026-09-20.md"
relations:
  - type: contrasts_with
    target: semantic_atlas
    note: "Pontifex usa intervenções, trajetórias e correspondências locais entre espaços; Semantic Atlas mede estrutura relacional estática. Os benchmarks aninhados procuram separar geometria, intervenção, ordem e refinamento local."
  - type: shares_mechanism_with
    target: semantic_observers
    note: "Ambos tratam cada sistema como um observador local e evitam assumir coordenadas globais compartilhadas como ponto de partida."
---
