---
type: paper
title: "Interventional Latent Graphs"
family: "Interpretabilidade"
kind: "conceitual/formal"
scientific_tier: "C"
interest_tier: "A"
confidence: "medium"
idea: >-
  Trata sistemas de representação inteiros como vértices e cada identidade experimental compartilhada como uma aresta, mesmo quando cada substrato realiza fisicamente o contraste de maneira diferente. A aresta diz apenas que a mesma pergunta experimental pode ser operacionalizada nos dois lados; similaridade, alinhamento, causalidade e geometria aparecem depois como medições, não como premissas.
status: >-
  Position paper com definição matemática explícita, companion Lean 4 e auditoria claim-specific de prior art já incorporada. A v0.1 está tecnicamente pronta para empacotamento no Zenodo e restringe a contribuição ao pacote em que espaços inteiros são vértices e identidades de intervenção são arestas primitivas independentes da resposta. A revisão transversal do programa corrigiu uma ambiguidade importante: "mesma intervenção" agora significa a mesma identidade/contrato experimental, não necessariamente a mesma perturbação física. Realizações substrate-native, como os proxies entre linguagem e MaleCNS, são portanto uma especialização legítima do ILG. Ainda não há validação empírica do formalismo como ferramenta de identificação.
limit: >-
  O risco principal continua sendo identificabilidade e circularidade: o contrato que declara duas realizações como a mesma intervenção não pode importar justamente o alinhamento que deveria ser descoberto. Contrastes binários não garantem identificabilidade, e transports ou testes de closure flexíveis demais podem produzir alinhamentos espúrios; os próximos testes precisam de intervenções held-out, nulls/capacity-matched e realizadores alternativos antes que ciclos, Torus ou manifolds contem como evidência.
related_file: "audits/prior-art/interventional-latent-graph-2026-09-19.md"
---
