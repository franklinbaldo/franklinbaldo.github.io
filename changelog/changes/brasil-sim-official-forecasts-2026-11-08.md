---
type: changelog
date: 2026-11-08
description: Introduzir BrasilSim com séries oficiais do BCB, previsões probabilísticas e painel público diário
tags: [brasil-sim, economia, dados-abertos, mcmc, simulacao]
---

O laboratório BrasilSim passa a gerar cenários econômicos experimentais de 24 meses
a partir da Selic, IPCA e IBC-Br do Banco Central, consultados no deploy do blog.
O modelo inclui amostragem MCMC de parâmetros macro, backtest fora da amostra,
100.000 agentes sintéticos representando 215 milhões de pessoas e 127 categorias
com estoques, preços, escassez e variedades dinâmicas.

O painel em /brasil-sim/ expõe indicadores, distribuições e arquivos JSON/CSV.
A distinção entre observações oficiais, previsões e métricas hipotéticas é
explícita; dados de fixture não são usados na publicação.
