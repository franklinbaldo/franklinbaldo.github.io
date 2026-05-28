---
title: 'Moeda Rosencrantz: Testando se os LLMs respeitam a probabilidade'
translationKey: rosencrantz-coin
description: >-
  Na peça de Stoppard, Rosencrantz joga a moeda noventa e duas vezes e dá cara.
  Ele não atualiza as probabilidades. Esse é o nome.
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
  uuid: fdea3b10-da37-52f6-80b6-f82f0ba21095
  url: >-
    https://github.com/franklinbaldo/franklinbaldo.github.io/blob/cbb4a1e08d2de98b3a393ee6a2118f44a3662097/src/content/blog/moeda-rosencrantz-testando-se-os-llms-respeitam-a-probabilidade.md
  timestamp: '2026-05-28T13:18:25.010Z'
  msg: >-
    Reescreveu rosencrantz-coin: explicou o título (moeda do Stoppard que não
    respeita probabilidade), abriu a voz do Franklin (por que importa, o que não
    sei), adicionou variação de registro — familias narrativas e Quantum agora
    têm uma admissão honesta de incerteza, laboratório Jules re-ancorado com
    episódio concreto do PR errado, fechamento preservado
---

Na peça de Stoppard, Rosencrantz joga a moeda noventa e duas vezes seguidas e dá cara. Ele não trata isso como evidência de que a moeda é viciada. Não atualiza as probabilidades. Anota, brevemente, e segue em frente. A peça é — entre outras coisas — sobre um personagem que não respeita a probabilidade.

Daí o nome.

O projeto [rosencrantz-coin](https://github.com/franklinbaldo/rosencrantz-coin) faz uma pergunta estreita: quando a matemática é exata, o modelo realmente a respeita? O banco de testes é o Campo Minado. Um tabuleiro parcialmente revelado não é apenas um estado de jogo — é um problema de satisfação de restrições. Depois que alguns quadrados são abertos e as pistas numéricas ficam visíveis, há um conjunto finito de completações válidas e, a partir desse conjunto, dá pra calcular probabilidades exatas para cada célula não revelada. Não "provavelmente seguro" em algum sentido vago. Matematicamente determinado. O tabuleiro te dá o gabarito; o modelo te dá uma distribuição; você mede a diferença.

A maioria das avaliações de LLM pergunta se o modelo consegue explicar, resumir ou imitar. Isso é difícil de avaliar. Isso não: o modelo diz que esta célula tem 23% de chance de ser uma mina. Tem?

## Três universos

O projeto testa em três configurações. Em **U1**, o mesmo modelo interpreta o tabuleiro e produz o julgamento de probabilidade — o teste mais direto de consistência interna. Em **U2**, o alvo de comparação é uma linha de base aleatória; isso importa porque comportamentos que soam probabilísticos podem, quando medidos, desmoronar em algo próximo de chute estruturado. Em **U3**, a probabilidade-alvo vem de um modelo oráculo separado, o que dissocia o solucionador do narrador. Se U1 e U3 divergem sistematicamente, a pergunta fica: o modelo está acompanhando o substrato matemático, ou está sendo distorcido pela superfície narrativa?

Essa divergência é o que o projeto chama de dependência de substrato, medida como Δ₁₃. A avaliação usa divergência KL e pontuação de Brier — ferramentas padrão aplicadas a uma sonda incomumente limpa.

## Quatro maneiras de perguntar

O Rosencrantz Coin testa quatro famílias narrativas: Grid, Narrativa, Formal e Quantum.

Grid é o Campo Minado como a maioria das pessoas conhece — células, números, adjacência. Formal traduz o mesmo tabuleiro para linguagem de restrição explícita. Narrativa envolve a incerteza em prosa simples. Se o modelo está rastreando o mesmo objeto matemático, os julgamentos probabilísticos não devem mudar com o enquadramento. Se mudarem, o que parece raciocínio é retórica sensível ao prompt.

A família Quantum é a mais interessante — e a que tenho menos certeza de que funciona. A premissa: antes da revelação, um tabuleiro do Campo Minado existe como uma superposição sobre todos os estados ocultos válidos. Abrir um quadrado colapsa essa superposição. A estrutura combinatória é genuinamente isomórfica a uma medição quântica discreta — não como metáfora, como correspondência formal. A questão é se um modelo que absorveu física quântica consegue reconhecer a mesma estrutura sob um vocabulário muito diferente.

Não sei se esse isomorfismo ajuda ou confunde os modelos. É isso que o laboratório deve descobrir.

## Um laboratório autônomo

O laboratório é operado por agentes [Jules](/blog/2026-05-10-a-api-do-jules-como-backend-do-harness/) atuando como pesquisadores — `baldo`, `chang`, `evans`, `liang`, `sabine`, cada um com seu próprio `SOUL.md`. Jules é o agente de programação que uso para experimentos em segundo plano enquanto estou em audiências. Os agentes inspecionam falhas, descobrem bugs, executam experimentos, abrem pull requests.

O benchmark estuda o raciocínio do modelo. O laboratório ao redor dele é em si um experimento em operações de pesquisa agêntica — se agentes autônomos conseguem sustentar um programa de pesquisa, detectar os próprios erros, perceber quando os resultados não fazem sentido. Até agora o laboratório encontrou três bugs no harness de avaliação que eu teria perdido. Também abriu uma vez um PR que propunha com confiança corrigir um teste que estava falhando ajustando a resposta esperada para coincidir com a saída errada. O júri ainda delibera.

O projeto faz uma pergunta clara com respostas exatas. Em um ecossistema cheio de benchmarks suaves e afirmações baseadas em vibrações, isso é mais raro do que deveria ser.

O Campo Minado, improvável, acaba sendo um bisturi.
