---
type: paper
title: "Recursive Interventional Focusing"
family: "Interpretabilidade e descoberta interventional"
kind: "metodológico / formal / protocolo experimental"
scientific_tier: "C"
interest_tier: "S"
confidence: "medium"
idea: >-
  Repete o próprio experimento de intervenção depois que uma etapa validada restringe o espaço de busca. A intuição é que, ao condicionar uma região onde o efeito dominante quase não varia, estruturas menores antes mascaradas podem se tornar observáveis. O loop alterna análise ou solver clássico, intervenções Pontifex, validação em evidência não usada para escolher o foco e nova restrição; Perquire, LLMs e outros propositores são módulos opcionais, não parte da definição.
status: >-
  O position paper, um protocolo prospectivo e um companion Lean 4 já estão em `papers/main`. O benchmark sintético congela uma hierarquia plantada A >> B >> C e compara, sob o mesmo orçamento, método clássico, Pontifex one-shot, foco recursivo aleatório, RIF validado e oracle; o endpoint principal é recuperar a hierarquia correta em teste intocado. A formalização Lean prova a parte estrutural do hard focusing: cada passo só encolhe o espaço e uma cadeia de passos individualmente sound preserva o alvo. Isso é uma garantia condicional de composição, não uma prova de que um foco aprendido estatisticamente é sound. Ainda não há resultado empírico do benchmark.
limit: >-
  O risco central é viés de seleção por adaptatividade: sem fresh validation, cross-fitting ou outro mecanismo prospectivo, a recursão pode fabricar estrutura ao condicionar repetidamente no ruído. O primeiro gate precisa superar Pontifex one-shot e foco aleatório em recuperação held-out, sem aumentar materialmente a exclusão do ramo verdadeiro e cobrando todo o orçamento. Se C1 ~= C3, uma única representação global já basta; se o braço aleatório empata com RIF, a informação Pontifex não causa o ganho. O Lean não formaliza p-values, adaptive inference, qualidade das respostas nem a hipótese A >> B >> C, portanto o tier científico permanece C até execução discriminante.
related_file: "experiments/recursive_interventional_focusing/PROTOCOL.md"
relations:
  - type: extends
    target: pontifex
    note: "Transforma a medição interventional do Pontifex em um loop externo de foco validado e reintervenção, em vez de assumir que um único mapa de respostas basta em todas as escalas."
---
