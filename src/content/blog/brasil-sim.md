---
tldr: "O texto apresenta o BrasilSim como proposta de simulação econômica construída a partir de pessoas, atividades e distribuições observáveis, em vez de tomar empresas representativas como unidades fundamentais. Seu objetivo é explorar como heterogeneidade individual, produção, renda e políticas econômicas se combinam em resultados agregados. Trata-se de um projeto e de hipóteses de modelagem, não de uma previsão empiricamente demonstrada sobre a economia brasileira."
type: Blog Post
title: "BrasilSim: uma economia sem empresas, num laboratório aberto"
description: "Um simulador econômico interativo com 100 mil agentes ponderados, distribuições de produtividade, conservação monetária e dados oficiais do Banco Central."
docType: technical
date: 2026-11-08
lang: pt
author: franklin
emoji: "∑"
tags:
  - economia
  - simulacao
  - ciencia aberta
  - dados oficiais
  - modelagem
---

Comecei com uma pergunta um pouco incômoda: por que um simulador econômico precisa de empresas?

Se a produção é realizada por pessoas, com tempo, recursos e conhecimento, talvez possamos começar por aí. E quando encontramos uma correlação entre variáveis, talvez ela deva aparecer porque uma equação as relaciona, não porque escolhemos um coeficiente numa tabela.

O [**BrasilSim já tem um primeiro laboratório interativo**](/brasil-sim/). Dá para mudar a distribuição de produtividade, a distribuição inicial dos saldos monetários, o tempo produtivo, a capacidade por hora e a propensão a consumir. Cem mil agentes ponderados representam 215 milhões de pessoas. O modelo calcula doze meses de produção, preços, trocas monetárias e desigualdade, mantendo a quantidade total de dinheiro constante.

Também há um painel que consulta dados oficiais do Banco Central: meta Selic, IPCA e IBC-Br. Quando o site conseguir coletar séries suficientes, publicará um benchmark de projeções mensais. A coleta é diária, mas não inventa observações quando a fonte oficial ainda não publicou um indicador.

O protótipo ainda não é uma representação validada da economia brasileira. A mercadoria é genérica, não há sistema de crédito, produtos diferenciados ou efeitos sobre longevidade e valência. Nem a simulação estrutural nem o benchmark de séries temporais devem ser tratados como previsões confiáveis. O interessante, para mim, é justamente poder expor as contas e enxergar onde as hipóteses falham.

A próxima etapa é ligar as relações matemáticas do [Universal Equation Knowledge Graph](https://github.com/franklinbaldo/papers/blob/main/universal_equation_knowledge_graph.md), o [núcleo formal de MMT](https://github.com/franklinbaldo/papers/blob/main/monetary-formalization/mmt-minimal-core-lean4.md) e dados observados aos parâmetros livres. Idealmente, a maior parte das distribuições que medimos será resultado do sistema, não uma entrada adicionada por conveniência.

[**Abrir o BrasilSim →**](/brasil-sim/)
