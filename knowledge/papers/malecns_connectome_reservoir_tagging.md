---
type: paper
title: "MaleCNS como reservoir para tagging jurídico"
family: "Neurocomputação experimental"
kind: "empírico"
scientific_tier: "C"
interest_tier: "S"
confidence: "high"
idea: >-
  Testa se um subgrafo real do sistema nervoso da mosca, usado como reservoir recorrente congelado, acrescenta sinal útil para tagging byte a byte de texto jurídico quando comparado com um grafo degree-preserving embaralhado e com um baseline sem recorrência.
status: >-
  A v0.1 permanece como diagnóstico histórico da formulação reduzida e open-loop: 512 neurônios, cinco seeds pareadas e um pequeno corpus jurídico. O MaleCNS obteve F1 médio 0,2753, contra 0,2782 no reservoir degree-preserving embaralhado e 0,2727 no baseline byte-only; as diferenças são pequenas e variáveis entre seeds. O resultado demonstra um pipeline reprodutível de tagging connectome-constrained, mas não sustenta vantagem específica da topologia biológica. A linha whole-CNS fechada deixou de ser uma promessa dentro deste mesmo paper: ela agora tem um sucessor results-bearing próprio, `malecns_whole_cns_speed_hold.md`, e deve ser avaliada separadamente.
limit: >-
  O experimento usa só um subgrafo de alta conectividade, dinâmica leaky-tanh engenheirada, projeção de entrada arbitrária e readout supervisionado open-loop; portanto o near-null não pode ser generalizado para MaleCNS inteiro nem para aprendizagem biologicamente endereçada em closed loop. O corpus também é pequeno e o experimento não resolve se recorrência, dinâmica ou topologia poderiam ajudar em outra formulação. O prior art já inclui connectome reservoirs, NLP com reservoirs e MaleCNS com linguagem, de modo que a contribuição defendível é a combinação estreita de tagging jurídico byte-level com controles pareados.
related_file: "audits/prior-art/malecns-tagging-falsification-2026-09-19.md"
relations:
  - type: contrasts_with
    target: malecns_whole_cns_speed_hold
    note: "Este é o diagnóstico reduzido, open-loop e textual; o sucessor executa o MaleCNS inteiro em closed loop com sensores, reforço e atuador declarados."
---
