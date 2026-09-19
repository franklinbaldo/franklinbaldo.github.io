---
type: paper
title: "Interventional Latent Graphs"
family: "Interpretabilidade"
kind: "conceitual/formal"
scientific_tier: "C"
interest_tier: "A"
confidence: "medium"
idea: >-
  Trata espaços de representação inteiros como vértices e cada intervenção controlada que pode ser aplicada aos dois extremos como uma aresta distinta. A aposta é separar a possibilidade de fazer a mesma pergunta experimental da semelhança das respostas, para que alinhamento, desacordo e topologia apareçam depois como medições — não como premissas.
status: >-
  Position paper com definição matemática explícita, companion Lean 4 e auditoria claim-specific de prior art já incorporada. A v0.1 está tecnicamente pronta para empacotamento no Zenodo: o texto agora reconhece antecedentes para correspondência de intervenções, causal abstraction, transportability e identifiability e restringe a contribuição ao pacote mais estreito em que espaços inteiros são vértices e intervenções compartilhadas são arestas primitivas independentes da resposta. Ainda não há validação empírica.
limit: >-
  O risco principal é operacional e potencialmente circular: demonstrar que uma intervenção é realmente a mesma nos dois espaços sem usar justamente o alinhamento que o método pretende descobrir. Contrastes binários não garantem identificabilidade, e transports ou testes de closure flexíveis demais podem produzir alinhamentos espúrios; os próximos testes precisam de intervenções held-out e nulls/capacity-matched antes que ciclos, Torus ou manifolds contem como evidência.
related_file: "audits/prior-art/interventional-latent-graph-2026-09-19.md"
relations:
  - type: extends
    target: pontifex
    note: "Coloca antes da comparação Pontifex uma camada de incidência: a intervenção compartilhada cria a aresta; semelhança ou desacordo das respostas é medido depois."
  - type: constrains
    target: pontifex_torus
    note: "Torna ciclos e topologia toroidal hipóteses downstream que precisam competir com nulls e outras geometrias, em vez de fazê-los parte da definição do grafo."
---
