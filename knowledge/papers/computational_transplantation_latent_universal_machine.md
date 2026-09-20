---
type: paper
title: "Computational Transplantation: From Latent Algorithm Transfer to a Programmable Universal Latent Machine"
family: "Aprendizagem de algoritmos e substratos latentes"
kind: "conceitual / protocolo experimental"
scientific_tier: "D"
interest_tier: "S"
confidence: "medium"
idea: >-
  Pergunta se uma computação já realizada por um sistema professor A pode ser ensinada a um substrato diferente B de modo que B continue executando a regra depois que A é removido, inclusive em comprimentos de execução não vistos. A versão mais forte tenta transplantar não algoritmos isolados, mas uma pequena base computacional: B seria então congelado e receberia programas novos como dados, aproximando-se de uma máquina latente programável.
status: >-
  O paper está em `papers/main` como proposta prospectiva, acompanhado de uma auditoria adversarial de prior art; ainda não reporta experimento executado. A escada começa com paridade recorrente e teacher removal, passa por contadores, aritmética e instruções composicionais e só depois testa programas inteiramente withheld num substrato congelado. A auditoria estreitou bastante a novidade: knowledge distillation e FitNets já cobrem transferência professor→aluno e hints internos; Network Transplanting já usa explicitamente a ideia de transplantar função neural; Algorithm Distillation transfere um processo algorítmico para outro modelo; Neural Programmer-Interpreters, Neural Virtual Machines e ProTo já cobrem executores neurais programáveis e generalização a programas. A hipótese residual é, portanto, mais específica: informação de execução de um professor já computante instala uma lei operacional num substrato estrangeiro não predesenhado para aquela computação, sobrevive à remoção do professor e acrescenta algo além de direct learning/distillation; a extensão H2 exige que o mesmo processo instale uma base reutilizável capaz de executar programas novos sem retreino do substrato.
limit: >-
  Ainda não há evidência de que “transplantação” seja um mecanismo distinto de aprendizagem supervisionada ou distillation, nem de que trajetória intermediária seja necessária: neural algorithmic reasoning endpoint-only já fornece um controle forte. Paridade também é altamente dependente do viés arquitetural e não pode carregar sozinha a interpretação causal. O primeiro gate precisa comparar B com baselines architecture/capacity-matched de endpoints, intermediate hints/FitNets, output distillation, Algorithm-Distillation-style, adapter-only e teacher-shuffle; remover A no teste; extrapolar em comprimento; e repetir em pelo menos uma computação com perfil estrutural diferente. Para H2, um executor genérico inspirado em NPI/Neural Virtual Machine/ProTo é baseline obrigatório. Sem esses resultados, a proposta permanece hipótese inicial, razão do scientific tier D apesar do alto interesse gerativo.
related_file: "audits/prior-art/computational-transplantation-2026-09-20.md"
relations:
  - type: contrasts_with
    target: generative_machine_teaching
    note: "Generative Machine Teaching faz a linguagem reutilizável crescer durante o currículo; Computational Transplantation pergunta se uma lei de execução já instanciada num professor pode migrar para outro substrato e, no limite, instalar um executor programável."
---
