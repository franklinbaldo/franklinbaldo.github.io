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
  O Pontifex v0.1 permanece congelado e repository-ready para empacotamento Zenodo, sem depósito externo. A linha de retrieval/reranking inclui SciFact, FiQA, ArguAna e SciDocs e mostra um regime estreito, não uma vantagem geral. SciFact e FiQA sustentam que correspondências A↔B verdadeiras podem melhorar seleção local dentro de uma região global fixa, mas sem economia correspondence-specific das chamadas caras. ArguAna continua sendo o único caso desta sequência em que Pontifex standalone supera A-only no endpoint oficial: em K=1024, 0,374652 contra 0,369728 nDCG@10, ainda longe do B-oracle em 0,434150. SciDocs é a replicação negativa decisiva desse efeito direto: A-only marca 0,216406, B-oracle 0,205184 e Pontifex standalone 0,175629; o próprio resolver caro também piora o benchmark. Separadamente, a linha experimental de descoberta de algoritmos já possui um recognizer Python e uma composição Lean executável que recuperam a representação de uma família canônica path-Tseitin a partir do CNF embaralhado. A auditoria atual, porém, mostrou que toda a família aceita já é 2-CNF e Tseitin em grafo de treewidth 1: o resultado sustenta recuperação explícita de representação e accounting, não uma nova classe de SAT tratável nem evidência sobre P versus NP. Contratos de discovery accounting e um Language-Switch Arena estão em branches experimentais posteriores, sem ampliar esse claim.
limit: >-
  Em retrieval, SciDocs transformou duas premissas em gates obrigatórios: B precisa oferecer headroom sobre A e o resolver caro precisa ser útil no domínio antes de qualquer claim de transporte ou economia de compute. O win direto de ArguAna permanece existência de regime e não replicou em SciDocs; efeitos residuais em Ridge ainda não distinguem Pontifex de adapters genéricos pair-budget-matched como Residual MLP ou Low-Rank Affine, e faltam incerteza pareada por query, múltiplos nulls/shuffles prospectivos e ganho em hosts fortes. Na trilha path-Tseitin, 2-SAT linear, o critério clássico de paridade Tseitin, baixa treewidth, SAT/XOR e solvers formalmente verificados são prior art decisivo para qualquer claim amplo; a formalização Lean ainda carece de recognize_sound, recognize_complete, recognize_cost e solve_correct end-to-end. A hipótese de trajetória ordenada também continua sem execução discriminante. Esses limites mantêm o tier científico em C.
related_file: "audits/prior-art/pontifex-path-tseitin-cnf-recognizer-2026-09-20.md"
relations:
  - type: contrasts_with
    target: semantic_atlas
    note: "Pontifex usa intervenções, trajetórias e correspondências locais entre espaços; Semantic Atlas mede estrutura relacional estática. Os benchmarks aninhados procuram separar geometria, intervenção, ordem e refinamento local."
  - type: shares_mechanism_with
    target: semantic_observers
    note: "Ambos tratam cada sistema como um observador local e evitam assumir coordenadas globais compartilhadas como ponto de partida."
---
