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
  O paper/protocolo já foi mergeado em `papers/main`. O primeiro sanity executável também foi mergeado e produziu apenas evidência exploratória em um toy NFS base-m, não no CADO-NFS: em 30 semiprimos sintéticos, acrescentar uma pequena medição de smoothness às features estáticas elevou o relation yield médio do candidato selecionado em 1,433x, 1,463x, 1,328x e 1,388x para probes de 20, 50, 100 e 150 pares, respectivamente; em 100 pares o intervalo bootstrap exploratório da diferença ainda inclui zero. Isso limpa somente o gate fraco de que uma resposta medida pode carregar informação adicional num ambiente simplificado. A etapa seguinte já está instrumentada contra o CADO-NFS real: um sweep low/default/high de esforço de polynomial selection congela o polinômio escolhido, o reinsere numa execução nova e separa custo de busca de custo downstream. A mesma mudança implementa a primeira fronteira Lean para um testemunho de fator não trivial, com teorema exatamente `1 < d ∧ d < n ∧ d ∣ n`. Porém o workflow disparado após o merge falhou antes de executar qualquer step nos dois jobs, de modo que ainda não existe resultado empírico do sweep CADO nem execução hospedada do Lean. A auditoria de prior art continua material: Kim, Lee & Yoon (junho de 2026) já aplicam PPO à exploração de parâmetros de polyselect do CADO-NFS, estreitando a novidade ao discriminante Pontifex estático → unordered → ordered, ao accounting da informação e à pequena fronteira formal.
limit: >-
  A evidência positiva atual é exploratória, usa baseline estático deliberadamente fraco e não demonstra speedup, relation yield/CPU superior no CADO-NFS, ganho ordered-over-unordered, nem vantagem sobre PPO, SMAC, BO ou TPE. O passo decisivo é fazer o sinal sobreviver a features fortes de qualidade como Murphy-E e ao relation yield/custo downstream reais, cobrando todo o probe compute; o harness já existe, mas a infraestrutura hospedada ainda não executou seus jobs. Mesmo um ganho ordered-over-unordered precisa controlar suficiência de estado e variáveis latentes de lineage, budget, RNG/cache/worker state, além de usar pelo menos um replay alternativo dinamicamente executável em vez de apenas permutar tuples observadas. Proxies baratos precisam demonstrar relação com custo final, e gramática candidata, bounds, operadores, compiler e verifier continuam parte explícita do discovery accounting. Esses limites preservam o tier científico em C apesar do alto valor gerativo da linha.
related_file: "experiments/pontifex_nfs/FINDINGS-BASE-M-SANITY-v1.md"
relations:
  - type: applies
    target: pontifex
    note: "Transfere o discriminante central do Pontifex — estático vs intervenções sem ordem vs trajetória ordenada — para a otimização de uma pipeline computacional madura de fatoração."
---
