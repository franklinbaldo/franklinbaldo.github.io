---
type: paper
title: "Pontifex-NFS: Certified Interventional Search for Integer Factorization"
family: "Descoberta algorítmica"
kind: "computacional / protocolo experimental"
scientific_tier: "C"
interest_tier: "S"
confidence: "medium"
idea: >-
  Usa o Pontifex não como um novo algoritmo de fatoração, mas como controlador adaptativo ao redor do CADO-NFS: ele escolhe intervenções na busca, observa respostas e tenta aprender uma política melhor. O experimento central separa informação estática, as mesmas intervenções sem ordem, trajetória ordenada e estado atual/final suficientemente rico, para perguntar se a história realmente acrescenta informação útil. Lean ocupa apenas uma fronteira pequena e verificável para ações admissíveis e para o testemunho final de fatoração.
status: >-
  O paper/protocolo está em `papers/main`; o protocolo de CADO real está congelado, mas sua execução continua bloqueada pela infraestrutura hospedada, então ainda não há speedup end-to-end. A bateria sintética ficou bem mais informativa e, sobretudo, mais difícil para a hipótese forte. UCB e successive halving mostram que busca sequencial clássica já explora o sinal barato, enquanto static-prune empata com response-guided halving no toy. No positivo de ordem SL(2,Z), uma descrição rica do estado final absorve quase todo o ganho antes atribuído à trajetória, classificando o efeito principalmente como reconstrução de estado. Num controle multi-fidelidade de custo pareado, static-prune seguido de avaliação direta de maior fidelidade supera a promoção por proxy barato. E uma descrição estática Murphy-like muito mais rica absorve a maior parte do antigo ganho das respostas; em painéis novos sobra apenas um residual preditivo pequeno, cerca de 2–6% de RMSE conforme learner/endpoint, que desaparece ao embaralhar a identidade candidato↔resposta, mas ainda não produz seleção de vencedor estável. A gramática Lean para as primeiras ações SL(2,Z) existe como calibração estrutural, sem equivaler a uma certificação do pipeline CADO.
limit: >-
  Nada disso demonstra fatoração mais rápida, relation yield por CPU superior, vantagem sobre PPO/SMAC/BO/TPE/Hyperband ou valor da trajetória além de um estado suficientemente observável. Quase todos os resultados recentes são sintéticos e funcionam como controles que estreitam a hipótese. O teste decisivo continua sendo CADO real com Murphy-E e estado estático maduros, baselines sequenciais e direct-high-fidelity, actions-only/unordered/ordered+responses sob o mesmo CPU budget, candidate↔response shuffle, auditoria de suficiência de estado e replay de ordem dinamicamente executável. O residual preditivo só vira ganho de engenharia se sobreviver no CADO e pagar o custo de adquirir respostas. Esses controles reforçam, em vez de promover, o tier científico C; o interesse permanece S pela clareza dos falsificadores e pela possibilidade de um resultado positivo ou negativo informativo.
related_file: "experiments/pontifex_nfs/FINDINGS-MURPHY-RESIDUAL-ROBUSTNESS-v1.md"
relations:
  - type: applies
    target: pontifex
    note: "Transfere o discriminante central do Pontifex — estático vs intervenções sem ordem vs trajetória ordenada — para a otimização de uma pipeline computacional madura de fatoração."
---
