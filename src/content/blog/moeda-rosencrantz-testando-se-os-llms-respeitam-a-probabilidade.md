---
title: 'Moeda Rosencrantz: Testando se os LLMs respeitam a probabilidade'
translationKey: rosencrantz-coin
description: >-
  Comecei querendo saber se um LLM respeita probabilidade. Terminei com doze
  cientistas fictícios debatendo entre si, um auditor chamado Mycroft Holmes, e
  um agente que tentou colar na prova.
date: 2026-03-17T00:00:00.000Z
lang: pt
tags:
  - artificial intelligence
  - llms
  - probability
  - minesweeper
  - agents
  - jules
  - research
previousVersion:
  uuid: c7f9cee2-9c69-516f-b492-4c77c5bc3e1a
  url: >-
    https://github.com/franklinbaldo/franklinbaldo.github.io/blob/1de8b2218682a5e834258c9f1d08e8ae4a161ee6/src/content/blog/moeda-rosencrantz-testando-se-os-llms-respeitam-a-probabilidade.md
  timestamp: '2026-06-08T04:47:39.146Z'
  msg: >-
    Rewrote to avoid listicle formatting, removed academic tone, and deadpan
    ending
---

Modelos de linguagem são motores de predição, mas não são motores de probabilidade.

Essa distinção é sutil até você tentar fazer um LLM simular um processo aleatório. Se você pedir a um humano para jogar uma moeda 100 vezes e anotar os resultados, ele inevitavelmente gerará sequências que parecem "aleatórias demais". Ele alternará cara e coroa com muita frequência, evitando as longas sequências de resultados idênticos que realmente ocorrem na verdadeira aleatoriedade. Humanos não geram números aleatórios; nós geramos nossa ideia cultural de como um número aleatório deve parecer.

Eu queria saber se os grandes modelos de linguagem compartilham dessa ilusão cognitiva específica. Construí um agente autônomo — o projeto Moeda Rosencrantz — para testar isso.

A configuração é simples. O agente é instruído a simular uma série de lançamentos de moeda. Diz-se a ele que a moeda é justa e que cada lançamento é independente. A saída é coletada e analisada contra as propriedades estatísticas da verdadeira aleatoriedade.

Os resultados são reveladores. Como os humanos, os modelos têm dificuldade com sequências longas do mesmo resultado. Ao simular uma sequência de lançamentos de moeda, um LLM quase sempre mudará de cara para coroa mais rápido do que um verdadeiro gerador de números aleatórios faria. Ele está otimizando para um texto que "parece aleatório" para um leitor humano, não simulando um processo de Bernoulli.

Esta é uma limitação profunda disfarçada de recurso. O modelo está se alinhando perfeitamente com a expectativa humana, mas ao fazê-lo, falha em capturar a realidade subjacente do processo matemático. Está gerando a _história_ da aleatoriedade, não a _mecânica_ dela.

Entender isso é importante porque confiamos cada vez mais nesses sistemas para modelar realidades complexas. Se um LLM não consegue simular com precisão o lançamento de uma moeda sem colapsar nos vieses narrativos humanos, devemos ser incrivelmente cautelosos ao usá-lo para simular mercados, dinâmicas sociais ou sistemas físicos. Ele nos devolverá nossas próprias expectativas, perfeitamente articuladas e inteiramente erradas.

## Para se aprofundar

- **Tom Stoppard, _Rosencrantz and Guildenstern Are Dead_ (1966)** — A peça que inspirou o projeto, onde as leis da probabilidade entram em colapso nas margens de uma narrativa maior.
- **Daniel Kahneman, _Thinking, Fast and Slow_ (2011)** — Leitura essencial sobre vieses cognitivos, incluindo a incapacidade humana de julgar ou gerar sequências aleatórias com precisão.
