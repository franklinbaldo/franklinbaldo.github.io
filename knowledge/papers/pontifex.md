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
  O Pontifex v0.1 permanece congelado e repository-ready para empacotamento Zenodo, sem depósito externo. Em retrieval/reranking, SciFact e FiQA sustentam refinamento local por correspondências verdadeiras, ArguAna continua sendo o único caso desta sequência em que Pontifex standalone supera A-only no endpoint oficial, e SciDocs é a replicação negativa que impõe os gates de headroom e utilidade do resolver caro. Na trilha de descoberta algorítmica, path-Tseitin permanece um positive control de recuperação de representação, não evidência sobre SAT difícil: a família aceita é 2-CNF sobre path/treewidth 1. A linha RuleIR avançou de um recognizer de paridade sob DFA de dois estados para G2b/G2c: um seletor exaustivo family-agnostic, recebendo um programa parcial, slots e gramática fixos, recupera de forma única os pares de regras registrados para paridade e Horn a partir apenas de labels finais e os produtos selecionados fazem 1.000/1.000 nos holdouts declarados. A auditoria posterior, porém, classifica esse resultado como scaffolded relational program completion: program sketching, ILP, multi-clause induction, CEGIS e predicate invention são prior art direto, e a própria expansão da hipótese de paridade de dois para três estados transforma uma solução única em 80 candidatos consistentes, 28 já errados em comprimentos posteriores. O Language-Switch Arena continua preregistrado, sem resultado científico E5 ainda.
limit: >-
  Em retrieval, o ganho direto de ArguAna continua sendo existência de regime, não vantagem geral, e efeitos residuais ainda precisam vencer adapters genéricos pair-budget-matched e nulls prospectivos em hosts fortes. Em path-Tseitin, 2-SAT linear, o critério clássico de paridade Tseitin, baixa treewidth e solvers SAT/XOR formalmente verificados impedem claims amplos; a formalização Lean segue sem recognize_sound/complete/cost e solve_correct end-to-end. Em RuleIR, a evidência atual mostra que uma hipótese finita bem especificada pode ser identificada por labels finais, mas não que o Pontifex descobriu a estrutura de programa sem scaffold: linguagem candidata, bounds, slots, programa circundante, compiler e verifier carregam informação material. O próximo gate precisa comparar um solver convencional ILP/sketch/PBE sob exatamente a mesma gramática e orçamento, além de capacity/version-space, slot-location e cross-encoding ablations. A hipótese de trajetória ordenada E5 continua sem execução discriminante. Esses limites mantêm o tier científico em C apesar do alto valor gerativo.
related_file: "audits/prior-art/pontifex-passive-final-label-multirule-induction-2026-09-20.md"
relations:
  - type: contrasts_with
    target: semantic_atlas
    note: "Pontifex usa intervenções, trajetórias e correspondências locais entre espaços; Semantic Atlas mede estrutura relacional estática. Os benchmarks aninhados procuram separar geometria, intervenção, ordem e refinamento local."
  - type: shares_mechanism_with
    target: semantic_observers
    note: "Ambos tratam cada sistema como um observador local e evitam assumir coordenadas globais compartilhadas como ponto de partida."
---
