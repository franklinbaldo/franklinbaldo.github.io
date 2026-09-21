---
type: paper
title: "Recursive Interventional Focusing"
family: "Interpretabilidade e descoberta intervencional"
kind: "metodológico / formal / protocolo experimental"
scientific_tier: "C"
interest_tier: "S"
confidence: "medium"
idea: >-
  Repete o próprio experimento de intervenção depois que uma etapa validada restringe o espaço de busca. A intuição é que, ao condicionar uma região onde o efeito dominante quase não varia, estruturas menores antes mascaradas podem se tornar observáveis. O loop alterna análise ou solver clássico, intervenções Pontifex, validação em evidência não usada para escolher o foco e nova restrição; Perquire, LLMs e outros propositores são módulos opcionais, não parte da definição.
status: >-
  O position paper, o protocolo prospectivo e o companion Lean 4 estão em `papers/main`; ainda não há resultado empírico. A auditoria de prior art estreitou a contribuição: iterative sure independence screening já cobre recuperação de variáveis fracas após condicionamento ou residualização, e métodos de busca hierárquica já cobrem redução recursiva seguida de novas avaliações. O protocolo agora compara RIF não só com one-shot e foco aleatório, mas também com iterative conditional screening (C5) e adaptive partitioning/search (C6), sob orçamento e oportunidades adaptativas pareados. Também inclui uma família negativa de seleção estrutural para testar associações que podem surgir apenas após a restrição. A formalização Lean continua provando somente a parte estrutural: uma cadeia de hard-focus steps individualmente sound preserva o alvo e termina sob shrinkage estrito.
limit: >-
  A hipótese distintiva ficou mais estreita: o campo Pontifex recomputado após cada restrição precisa acrescentar informação held-out além do melhor estado de C5/C6, sem excluir o ramo verdadeiro nem confundir estrutura induzida pela seleção com mecanismo do sistema original. Fresh validation controla reuso adaptativo de dados, mas não resolve por si só toda distorção estrutural causada pelo condicionamento. Se C5 ou C6 empatarem com RIF, há evidência para re-screening ou busca hierárquica, não para um mecanismo Pontifex-specific. Sem execução desse gate, o scientific tier permanece C e o interest tier S.
related_file: "experiments/recursive_interventional_focusing/protocol.md"
relations:
  - type: extends
    target: pontifex
    note: "Transforma a medição intervencional do Pontifex em um loop externo de foco validado e reintervenção, em vez de assumir que um único mapa de respostas basta em todas as escalas."
---
