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
  Position paper com definição matemática explícita e companion Lean 4 que verifica o núcleo mínimo: contraste binário como menor alfabeto discreto não trivial, intervenções como arestas, multiarestas, conectividade simétrica, composição e comprimento de walks e a possibilidade de endpoints discordarem. Ainda não relata medições empíricas; propõe testes sintéticos e entre representações heterogêneas.
limit: >-
  A dificuldade central é operacional: definir que uma intervenção é realmente a mesma em dois espaços sem pressupor o alinhamento que o método pretende descobrir. A redução a contrastes binários pode perder estrutura essencial, o multigrafo pode ser pobre demais para relações de ordem superior, e ainda falta uma auditoria sistemática de prior art antes de qualquer claim forte de novidade.
relations:
  - type: extends
    target: pontifex
    note: "Coloca antes da comparação Pontifex uma camada de incidência: a intervenção compartilhada cria a aresta; semelhança ou desacordo das respostas é medido depois."
  - type: constrains
    target: pontifex_torus
    note: "Torna ciclos e topologia toroidal hipóteses downstream que precisam competir com nulls e outras geometrias, em vez de fazê-los parte da definição do grafo."
---
