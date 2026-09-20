---
type: paper
title: "Pontifex-NFS: Certified Interventional Search for Integer Factorization"
family: "Descoberta algorítmica"
kind: "computacional / protocolo experimental"
scientific_tier: "C"
interest_tier: "S"
confidence: "medium"
idea: >-
  Usa o Pontifex não como um novo algoritmo de fatoração, mas como controlador adaptativo ao redor do CADO-NFS: ele escolhe intervenções na busca, observa respostas e tenta aprender uma política melhor. O experimento central separa três hipóteses — informação estática, as mesmas intervenções sem ordem e a trajetória ordenada — para testar se a sequência das intervenções realmente acrescenta informação útil. Lean entra apenas como uma fronteira pequena e verificável para ações admissíveis e para o testemunho final de fatoração.
status: >-
  O paper/protocolo está em `papers/main`, mas a evidência continua exploratória e fora do CADO-NFS real. O sanity base-m mostrou apenas que uma medição barata de smoothness pode acrescentar informação a um baseline estático fraco. Depois, controles em SL(2,Z) criaram um caso positivo conhecido em que a ordem realmente importa: o mesmo multiconjunto de seis shears não comutativos tem 180 ordenações e chega a 31 matrizes finais distintas, todas com determinante um. Nesse endpoint estrutural, a representação ordenada supera a unordered quando o modelo consegue representar interações: quadratic ridge melhora a seleção em 1,046 unidade de log-norma, com bootstrap exploratório de 95% [0,051, 2,029], e o MLP em 2,897 [2,171, 3,650]; o ridge linear é inconclusivo. Isso mostra que o aparato detecta informação de ordem e que o efeito não depende de uma única classe de learner. Ao mesmo tempo, a trajetória atual de respostas de smoothness não ganha do controle unordered no mesmo toy, então ainda não há evidência de que observar respostas acrescenta valor além da própria sequência de ações. O harness de CADO-NFS e a pequena fronteira Lean já existem, mas a execução hospedada falhou antes de qualquer step. A auditoria de prior art permanece material: Kim, Lee & Yoon (junho de 2026) já usam PPO para explorar parâmetros de polyselect do CADO-NFS, estreitando a contribuição candidata ao discriminante estático → unordered → ordered, ao accounting da informação e à certificação pequena.
limit: >-
  Nada disso demonstra speedup de fatoração, relation yield por CPU superior no CADO-NFS, vantagem sobre PPO/SMAC/BO/TPE, nem ganho incremental de respostas observadas sobre uma sequência de ações já informativa. Os resultados SL(2,Z) usam semiprimos sintéticos e funcionam como calibração positiva da ablação de ordem, não como resultado de NFS real. O teste decisivo continua sendo a ablação CADO congelada com baselines estáticos fortes, actions-only, unordered e ordered+responses sob o mesmo orçamento, cobrando probe compute e validando proxies como Murphy-E contra custo downstream. Mesmo um ordered-over-unordered positivo precisa controlar suficiência de estado, lineage, RNG/cache/worker state e usar replay alternativo dinamicamente executável. Gramática candidata, bounds, operadores, compiler e verifier seguem contabilizados como informação fornecida. Esses limites preservam o tier científico em C apesar do alto valor gerativo.
related_file: "experiments/pontifex_nfs/FINDINGS-SL2-MODEL-ROBUSTNESS-v1.md"
relations:
  - type: applies
    target: pontifex
    note: "Transfere o discriminante central do Pontifex — estático vs intervenções sem ordem vs trajetória ordenada — para a otimização de uma pipeline computacional madura de fatoração."
---
