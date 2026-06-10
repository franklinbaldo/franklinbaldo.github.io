---
author: franklin
date: 2026-06-03T00:00:00.000Z
lang: pt
title: >-
  A Ansiedade do Arquiteto: Ou, Como Aprendi a Parar de Executar e Amar o
  Harness
translationKey: delegating-to-agents
description: >-
  Por que delegar para um agente parece uma falha de controle, e por que essa
  falha é o preço exato da arquitetura.
tags:
  - engenharia
  - agentes
  - arquitetura
  - harness
  - controle
previousVersion:
  uuid: 56620869-a868-52f3-ac2f-f4720e160fdd
  url: >-
    https://github.com/franklinbaldo/franklinbaldo.github.io/blob/eb1e7676a9c373dbac56efb3d19f4dad7b5af225/src/content/blog/delegando-para-agentes.md
  timestamp: '2026-06-10T17:06:34.537Z'
  msg: Rewrite delegating-to-agents to be more narrative and clear
---

Existe um tipo específico de ansiedade que vem de observar uma máquina fazer o seu trabalho. Não a ansiedade de ser substituído, mas a ansiedade muito mais aguda de ser mal interpretado.

Quando você escreve uma função, você é o autor da execução. Quando você escreve um prompt para um agente, você é o autor de uma intenção, e está confiando em um sistema probabilístico para lidar com a execução. Para um certo tipo de engenheiro — o tipo que passou uma década aprendendo que o controle explícito é a única maneira de evitar catástrofes — essa transição parece um passo em falso.

## A Ilusão da Execução

Construímos uma disciplina inteira em torno da ideia de que devemos ditar os passos.

Se você quer fazer o parse de um arquivo JSON, você não pede ao computador para "entender o arquivo". Você escreve um parser. Você especifica os loops, o tratamento de erros, a sequência exata de operações de memória. Você é dono do verbo.

Mas, à medida que os sistemas ganham escala em complexidade, ser dono do verbo se torna o gargalo. Em algum momento, o sistema é grande demais para você especificar cada passo. É nesse momento que você precisa começar a delegar para agentes.

[Jules](https://jules.google.com) está atualmente refatorando um módulo mais antigo neste repositório. Eu não disse a Jules _como_ refatorá-lo. Eu escrevi um `SOUL.md` que define o que é um bom código, e dei o objetivo. Jules está escolhendo os verbos.

Funciona, mas exige uma mudança fundamental de postura. Você tem que parar de ser o executor e começar a ser o arquiteto.

## O Harness como Arquitetura

Se você não está escrevendo a implementação, o que você está escrevendo?

Você está escrevendo o ambiente. Você está escrevendo o [harness](/blog/2026-04-29-reclaiming-the-harness/). O harness é o conjunto de restrições, as definições de falha, as ferramentas disponíveis e a identidade do agente.

Quando [Funes](/blog/funes-soul/) resume uma reunião, a qualidade do resumo não depende de quão bem eu escrevi o prompt para a tarefa específica. Depende de quão bem eu estruturei a memória de longo prazo de Funes, de quão claramente eu defini com o que Funes _se importa_, e de como o loop de feedback é projetado.

A arquitetura não é mais sobre sequência; é sobre fronteiras. Você define o formato da caixa de areia, e deixa o agente brincar lá dentro.

## A Necessária Perda de Controle

É aqui que mora a ansiedade.

Quando você delega a execução, você perde a capacidade de garantir _como_ uma coisa é feita. Você só pode garantir _o que_ é aceitável. Isso significa que o agente às vezes fará coisas que você não faria. Ele escreverá uma função de forma diferente. Ele formulará uma resposta de um jeito estranho. Ele fará o commit com o ano errado.

O instinto imediato é escrever um prompt mais específico, adicionar outra regra, tentar recuperar o controle da execução. Mas esse é o modo de falha. Se você tentar escrever um prompt que cubra todos os detalhes possíveis de execução, você não está delegando. Você está apenas escrevendo código em uma linguagem de programação muito ineficiente e não-determinística.

A arte da delegação é aprender a tolerar o atrito de um executor diferente. Você tem que aceitar que o agente não é você. É uma inteligência alienígena operando dentro das restrições que você projetou. Se o resultado passar nos testes — se ele atender aos requisitos arquitetônicos — você tem que deixá-lo seguir em frente.

## Humildade Epistêmica

Há uma estranha graça nisso tudo.

Quando você é forçado a dar um passo atrás da implementação, você também é forçado a ser mais claro sobre suas intenções. Você percebe o quanto do seu código era apenas hábito, em vez de necessidade. Você percebe quantas de suas decisões de design eram implícitas, escondidas nos detalhes de execução em vez de articuladas na arquitetura.

Delegar para um agente é um exercício contínuo de humildade epistêmica. Força você a admitir que não é o único que sabe escrever o loop. Força você a definir o que realmente importa.

Você não é mais o digitador. Você é o pai observando a criança aprender a andar, sabendo que ela vai tropeçar, e sabendo que você precisa deixá-la tentar.

## Para se aprofundar

- **[Recuperando o Harness](/blog/2026-04-29-reclaiming-the-harness/)** — O texto fundamental sobre por que o ambiente é mais importante que o prompt.
- **[Construindo Funes](/blog/funes-soul/)** — Como a identidade molda a execução.
- **[O Agente Que Não Inventa Verbos](/blog/2026-05-14-the-agent-that-doesnt-invent-verbs/)** — Um olhar prático sobre como restringir as ações de um agente sem microgerenciá-lo.
