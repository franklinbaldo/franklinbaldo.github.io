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
  O paper está em PR aberta (#873), ainda fora de main e sem resultado empírico Pontifex-NFS. O primeiro alvo é seleção de polinômios do GNFS sobre semiprimos sintéticos com splits separados de assembly, treino, validação e teste; só depois do congelamento do protocolo entram desafios históricos públicos. O desenho já inclui CADO-NFS como executor forte, controles estático e interventional-unordered, destruição de ordem por permutação, swaps locais, reversão e ablação de fronteira, além de uma escada de interpretação que distingue autotuning, ganho interventional, ganho específico da trajetória e descoberta transferível. A formalização Lean está planejada em gates pequenos — estado, invariantes modulares, primeira ação certificada, trace checker e witness final — e não pretende verificar o CADO-NFS end-to-end. A auditoria de prior art encontrou um antecedente de domínio direto de junho de 2026: Kim, Lee & Yoon já aplicam PPO à exploração de parâmetros de seleção de polinômios do CADO-NFS e reportam tendência de obter Murphy-E comparável ou melhor. Isso ocupa fortemente a ideia ampla de busca aprendida sobre polyselect, mas não o discriminante Pontifex estático → unordered → ordered, a fronteira Lean ou um ganho end-to-end de CPU. O tracker de readiness #874 permanece prospectivo.
limit: >-
  Toda a evidência específica ainda é prospectiva: não há speedup, melhora end-to-end de relation yield/CPU, ganho ordered-over-unordered, execução Lean integrada nem replicação externa. Um resultado futuro só será distintivo se vencer, com o mesmo espaço de ações e orçamento total, baselines modernos como PPO equivalente ao antecedente de 2026 e pelo menos um otimizador sequencial forte (SMAC/BO/TPE; e Hyperband/Successive Halving quando houver promoção por fidelidade). Além disso, C4>C3 deve ser interpretado primeiro como evidência de que o estado declarado é insuficiente; para atribuir efeito à ordem, é preciso controlar lineage, budget, RNG/cache/worker state e outras variáveis latentes, e usar pelo menos um controle de ordem dinamicamente executável, pois permutar tuples já observadas pode produzir trajetórias impossíveis. Proxies baratos como Murphy-E precisam demonstrar relação com relation yield e CPU final sob custo total pareado. A disciplina de discovery accounting também se aplica: gramática/linguagem candidata, bounds, operadores, compiler e superfície do verifier não podem carregar informação extra para a condição ordenada. Esses limites mantêm o tier científico em C apesar do alto valor experimental como teste da hipótese de trajetória fora do domínio semântico.
related_file: "audits/prior-art/pontifex-nfs-adaptive-search-trajectory-order-2026-09-20.md"
relations:
  - type: applies
    target: pontifex
    note: "Transfere o discriminante central do Pontifex — estático vs intervenções sem ordem vs trajetória ordenada — para a otimização de uma pipeline computacional madura de fatoração."
---
