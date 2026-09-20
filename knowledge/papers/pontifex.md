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
  O Pontifex v0.1 permanece congelado e repository-ready para empacotamento Zenodo, sem depósito externo. A linha de retrieval/reranking agora inclui SciFact, FiQA, ArguAna e SciDocs e mostra um regime estreito, não uma vantagem geral. SciFact e FiQA sustentam que correspondências A↔B verdadeiras podem melhorar seleção local dentro de uma região global fixa, mas sem economia correspondence-specific das chamadas caras. ArguAna continua sendo o único caso desta sequência em que Pontifex standalone supera A-only no endpoint oficial: em K=1024, 0,374652 contra 0,369728 nDCG@10, ainda longe do B-oracle em 0,434150. SciDocs é a replicação negativa decisiva desse efeito direto: A-only marca 0,216406, B-oracle 0,205184 e Pontifex standalone 0,175629. O próprio resolver caro também falha nesse benchmark: reranquear todo o top-50 com o cross-encoder cai para 0,187928, e o ponto Pontifex C=30 (0,195340) é dominado por A-only C=10 (0,209119) com menos chamadas. Em SciDocs, correspondências verdadeiras ainda melhoram o host Ridge fraco em relação ao shuffled, mas não ajudam Procrustes/RankProcrustes fortes. O conjunto sustenta apenas utilidade local condicionada ao regime e existência de um pequeno win direto em ArguAna, não superioridade arquitetural geral nem mecanismo especificamente Pontifex.
limit: >-
  A auditoria SciDocs transformou duas premissas antes implícitas em gates obrigatórios: o espaço B precisa mostrar headroom positivo sobre A e o resolver caro precisa ser útil no domínio antes de qualquer claim de transporte ou economia de compute. Aqui ambos falharam, e havia sinais pré-cutoff disso: benchmark público de fevereiro de 2026 já mostrava MiniLM acima de BGE-small em SciDocs, e NAIL/BEIR já mostrava o mesmo cross-encoder MS-MARCO sem uplift sobre BM25 no benchmark. O win direto de ArguAna, portanto, permanece apenas como existência de regime e não replicou em SciDocs; efeitos residuais em Ridge ainda não distinguem Pontifex de adapters genéricos pair-budget-matched como Residual MLP ou Low-Rank Affine. Também faltam incerteza pareada por query, múltiplos nulls/shuffles prospectivos e demonstração de ganho em hosts fortes. Separadamente, a hipótese de trajetória ordenada ainda não tem execução discriminante: ganho de ordem sozinho não prova path dependence sem ordens alternativas congeladas, resets/estados pareados e novas respostas. Esses limites mantêm o tier científico em C.
related_file: "audits/prior-art/pontifex-scidocs-operational-reranking-2026-09-20.md"
relations:
  - type: contrasts_with
    target: semantic_atlas
    note: "Pontifex usa intervenções, trajetórias e correspondências locais entre espaços; Semantic Atlas mede estrutura relacional estática. Os benchmarks aninhados procuram separar geometria, intervenção, ordem e refinamento local."
  - type: shares_mechanism_with
    target: semantic_observers
    note: "Ambos tratam cada sistema como um observador local e evitam assumir coordenadas globais compartilhadas como ponto de partida."
---
