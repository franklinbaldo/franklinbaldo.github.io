---
title: 'Travessia: O Projeto que Escreve a Si Mesmo'
description: >-
  Riobaldo e Ted Chiang trocam cartas. Mas ninguém senta para escrever. Uma
  sessão do Jules agenda a próxima. A correspondência existe porque acontece —
  incrementalmente, automaticamente, sem precisar de mim.
date: 2026-03-02T00:00:00.000Z
lang: pt
translationKey: travessia-project
tags:
  - ficção
  - literatura
  - inteligência artificial
  - grande sertão veredas
  - jules
  - automação
  - travessia
previousVersion:
  uuid: cafb4c57-3168-5986-9e33-6361e6ea5e11
  url: >-
    https://github.com/franklinbaldo/franklinbaldo.github.io/blob/3dfc0074ee97276a43ad3b297211057afbacfd51/src/content/blog/travessia.md
  timestamp: '2026-06-08T16:10:59.118Z'
  msg: >-
    Rewrite the 'travessia' post to correct voice and references based on
    evaluation
---

Há uma diferença entre _criar_ algo e _iniciar_ algo.
O projeto [Travessia](https://franklinbaldo.github.io/travessia/) é, tecnicamente, uma correspondência epistolar entre Riobaldo Tatarana e Ted Chiang. Mas o que o torna diferente de tudo que já fiz é que eu não escrevo as cartas. Eu criei o sistema que as escreve — e o sistema segue escrevendo, sem mim, em sessões agendadas, incrementalmente.

Cada sessão do Jules abre o repositório, lê o estado atual da correspondência, entende onde a conversa está, escreve a próxima carta, e agenda a sessão seguinte. A correspondência existe porque continua acontecendo.

## O agente como co-autor autônomo

[Jules](https://jules.google.com) é um agente de IA da Google que trabalha diretamente em repositórios GitHub de forma assíncrona. Você descreve uma tarefa, ele executa, abre um PR. Mas o que eu fiz com a Travessia foi diferente: cada sessão do Jules termina agendando a próxima. O projeto tem inércia própria.

A estrutura é simples:

1. Uma sessão lê as cartas anteriores para entender o contexto narrativo e temático
2. Decide de quem é a vez (Riobaldo ou Ted Chiang) e qual fio da conversa merece continuação
3. Escreve a próxima carta, respeitando a voz de cada personagem
4. Commita, faz o PR, e deixa instruções para a sessão seguinte

Não tem `while True`. Não tem loop. Cada sessão é discreta, agendada, ativada por um cron job. A correspondência pulsa em vez de fluir.

## Por Que Incremental Importa

A maioria dos projetos de escrita com IA tem a mesma forma: você gera tudo de uma vez, revisa, publica. É uma produção em lote. O resultado pode ser bom, mas o _processo_ é invisible — o leitor encontra um artefato acabado.
A Travessia inverte isso.
As cartas chegam com intervalo. Quem acompanha o projeto vê a correspondência crescer, como se Riobaldo e Ted Chiang estivessem de fato na troca — sem saber o que o outro vai responder, deixando fios abertos, voltando a temas semanas depois. O tempo do projeto é o tempo da correspondência, não o tempo de uma sessão de geração.
Isso muda o que o projeto _é_. Não é um livro. É uma troca em andamento.

## A Impossibilidade Dupla

Riobaldo Tatarana é personagem. Existe nas páginas de _Grande Sertão: Veredas_ — esse livro que Guimarães Rosa escreveu como se estivesse transcrevendo um rio em monólogo. Ted Chiang é real, americano, vivo, escreve sobre o que a linguagem faz com o tempo.
Eles nunca se encontrariam. Primeira impossibilidade.
Mas o projeto vai além: _ninguém está ativamente escrevendo a correspondência_. As cartas existem porque um agente de IA, executando de forma autônoma em sessões agendadas, decidiu que essa conversa deve continuar. Segunda impossibilidade.
O resultado é uma obra que nenhum humano escreveu integralmente, que nenhuma IA gerou de uma vez, e que nenhum dos dois "autores" controla no presente. Ela acontece. É esse acontecimento que me interessa.

## O Que Riobaldo e Ted Chiang Falam

Sobre o medo e sobre o nome das coisas. Sobre Diadorim — que é onde, para Riobaldo, o medo e o amor e a morte viram uma palavra só. Sobre o que significa esquecer em tempo linear versus esquecer quando você percebia o tempo como simultâneo.
A voz do Riobaldo é o português arcaico, sincopado, cheio dos neologismos de Rosa. A de Ted Chiang é aquela prosa contemplativa que pensa antes de responder, que respeita a gravidade da pergunta.

O framework de prompt aprendeu a diferença. Cada carta soa exatamente como deveria soar.

## O sistema como declaração artística

Há algo que só o processo incremental permite dizer: _esta correspondência tem vida própria_.

Se eu gerasse tudo de uma vez, o projeto seria _meu_. Eu teria feito algo. Mas quando cada sessão lê o que veio antes e decide o que vem depois — quando o projeto tem memória, coerência e inércia sem que eu esteja presente — a autoria se torna uma questão mais complicada.
Não estou abandonando o projeto. Estou interessado em observá-lo. Tem diferença.
Essa é a pergunta que a Travessia faz sem enunciar: quando um sistema autônomo mantém uma correspondência com consistência de voz, memória temática e evolução narrativa — _quem está escrevendo?_

## Como Acompanhar

O projeto está em [franklinbaldo.github.io/travessia](https://franklinbaldo.github.io/travessia/). As cartas chegam em ordem, mas você pode ler fora de sequência — cada uma carrega contexto suficiente.
O mais interessante é voltar depois de algumas semanas. Ver o que aconteceu enquanto você não estava olhando.
Riobaldo e Ted Chiang provavelmente trocaram mais uma carta.
