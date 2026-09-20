---
type: paper
source_url: "https://github.com/franklinbaldo/papers/blob/paper/pontifex-nfs/pontifex_nfs.md"
title: "Pontifex-NFS: Certified Interventional Search for Integer Factorization"
family: "Descoberta algorítmica"
kind: "computacional / protocolo experimental"
scientific_tier: "C"
interest_tier: "S"
confidence: "medium"
idea: >-
  Usa o Pontifex não como um novo algoritmo de fatoração, mas como controlador adaptativo ao redor do CADO-NFS: ele escolhe intervenções na busca, observa respostas e tenta aprender uma política melhor. O experimento central separa três hipóteses — informação estática, as mesmas intervenções sem ordem e a trajetória ordenada — para testar se a sequência das intervenções realmente acrescenta informação útil. Lean entra apenas como uma fronteira pequena e verificável para ações admissíveis e para o testemunho final de fatoração.
status: >-
  O paper está em PR aberta (#873), ainda fora de main e sem resultado empírico Pontifex-NFS. O primeiro alvo é seleção de polinômios do GNFS sobre semiprimos sintéticos com splits separados de assembly, treino, validação e teste; só depois do congelamento do protocolo entram desafios históricos públicos. O desenho já inclui CADO-NFS como baseline/executor forte, controles estático e interventional-unordered, destruição de ordem por permutação, swaps locais, reversão e ablação de fronteira, além de uma escada de interpretação que distingue autotuning, ganho interventional, ganho específico da trajetória e descoberta transferível. A formalização Lean está planejada em gates pequenos — estado, invariantes modulares, primeira ação certificada, trace checker e witness final — e não pretende verificar o CADO-NFS end-to-end. A auditoria de readiness já o reconheceu como novo candidato prospectivo e abriu o tracker #874, sem tratá-lo como resultado existente.
limit: >-
  Toda a evidência específica ainda é prospectiva: não há speedup, melhora de relation yield, ganho ordered-over-unordered, execução Lean integrada nem replicação externa. A literatura de NFS já contém décadas de otimização especializada de seleção de polinômios, e o Pontifex só acrescentará evidência própria se vencer controles fortes sob orçamento e capacidade pareados; melhorar um proxy sem reduzir custo downstream não conta. Também é preciso preservar a nova disciplina de discovery accounting: gramática/linguagem candidata, bounds, operadores, compiler e superfície do verifier não podem carregar informação extra para a condição ordenada. Esses limites mantêm o tier científico em C apesar do alto valor experimental como teste da hipótese de trajetória fora do domínio semântico.
relations:
  - type: applies
    target: pontifex
    note: "Transfere o discriminante central do Pontifex — estático vs intervenções sem ordem vs trajetória ordenada — para a otimização de uma pipeline computacional madura de fatoração."
---
