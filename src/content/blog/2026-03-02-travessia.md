---
title: "Travessia: O Projeto que Escreve a Si Mesmo"
translationKey: travessia-the-project-that-writes-itself
description: "Riobaldo e Ted Chiang trocam cartas. Mas ninguém senta para escrever. Uma sessão do Jules agenda a próxima. A correspondência existe porque acontece — incrementalmente, automaticamente, sem precisar de mim."
date: 2026-03-02
lang: pt
translationKey: travessia-project
tags: ["ficção", "literatura", "inteligência artificial", "grande sertão veredas", "jules", "automação", "travessia"]
heroImage: ./images/travessia-cover.jpg
heroImageAlt: "Ship crossing open ocean at dawn, philosophical journey theme"
---

Há uma diferença entre *criar* algo e *iniciar* algo.
O projeto [Travessia](https://franklinbaldo.github.io/travessia/) é, tecnicamente, uma correspondência epistolar entre Riobaldo Tatarana e Ted Chiang. Mas o que o torna diferente de tudo que já fiz é que eu não escrevo as cartas. Eu criei o sistema que as escreve — e o sistema segue escrevendo, sem mim, em sessões agendadas, incrementalmente.
Cada sessão do Jules abre o repositório, lê o estado atual da correspondência, entende onde a conversa está, escreve a próxima carta, e agenda a sessão seguinte. A correspondência existe porque continua acontecendo.
## Jules Como Co-Autor Autônomo
[Jules](https://jules.google.com) é um agente de IA da Google que trabalha diretamente em repositórios GitHub de forma assíncrona. Você descreve uma tarefa, ele executa, abre um PR. Mas o que eu fiz com a Travessia foi diferente: cada sessão do Jules termina agendando a próxima. O projeto tem inércia própria.
A estrutura é simples:
1. Uma sessão Jules lê as cartas anteriores para entender o contexto narrativo e temático
2. Decide de quem é a vez (Riobaldo ou Ted Chiang) e qual fio da conversa merece continuação
3. Escreve a próxima carta, respeitando a voz de cada personagem
4. Commita, faz o PR, e deixa instruções para a sessão seguinte
Não tem `while True`. Não tem loop. Cada sessão é discreta, agendada, ativada por trigger. A correspondência pulsa em vez de fluir.
## Por Que Incremental Importa
A maioria dos projetos de escrita com IA tem a mesma forma: você gera tudo de uma vez, revisa, publica. É uma produção em lote. O resultado pode ser bom, mas o *processo* é invisible — o leitor encontra um artefato acabado.
A Travessia inverte isso.
As cartas chegam com intervalo. Quem acompanha o projeto vê a correspondência crescer, como se Riobaldo e Ted Chiang estivessem de fato na troca — sem saber o que o outro vai responder, deixando fios abertos, voltando a temas semanas depois. O tempo do projeto é o tempo da correspondência, não o tempo de uma sessão de geração.
Isso muda o que o projeto *é*. Não é um livro. É uma troca em andamento.
## A Impossibilidade Dupla
Riobaldo Tatarana é personagem. Existe nas páginas de *Grande Sertão: Veredas* — esse livro que Guimarães Rosa escreveu como se estivesse transcrevendo um rio em monólogo. Ted Chiang é real, americano, vivo, escreve sobre o que a linguagem faz com o tempo.
Eles nunca se encontrariam. Primeira impossibilidade.
Mas o projeto vai além: *ninguém está ativamente escrevendo a correspondência*. As cartas existem porque um agente de IA, executando de forma autônoma em sessões agendadas, decidiu que essa conversa deve continuar. Segunda impossibilidade.
O resultado é uma obra que nenhum humano escreveu integralmente, que nenhuma IA gerou de uma vez, e que nenhum dos dois "autores" controla no presente. Ela acontece. É esse acontecimento que me interessa.
## O Que Riobaldo e Ted Chiang Falam
Sobre o medo e sobre o nome das coisas. Sobre Diadorim — que é onde, para Riobaldo, o medo e o amor e a morte viram uma palavra só. Sobre o que significa esquecer em tempo linear versus esquecer quando você percebia o tempo como simultâneo.
A voz do Riobaldo é o português arcaico, sincopado, cheio dos neologismos de Rosa. A de Ted Chiang é aquela prosa contemplativa que pensa antes de responder, que respeita a gravidade da pergunta.
O Jules aprendeu a diferença. Cada carta soa como quem deveria soar.
## O Sistema Como Declaração Artística
Há algo que só o processo incremental permite dizer: *esta correspondência tem vida própria*.
Se eu gerasse tudo de uma vez, o projeto seria *meu*. Eu teria feito algo. Mas quando cada sessão do Jules lê o que veio antes e decide o que vem depois — quando o projeto tem memória, coerência e inércia sem que eu esteja presente — a autoria se torna uma questão mais complicada.
Não estou abandonando o projeto. Estou interessado em observá-lo. Tem diferença.
Essa é a pergunta que a Travessia faz sem enunciar: quando um sistema autônomo mantém uma correspondência com consistência de voz, memória temática e evolução narrativa — *quem está escrevendo?*
## Como Acompanhar
O projeto está em [franklinbaldo.github.io/travessia](https://franklinbaldo.github.io/travessia/). As cartas chegam em ordem, mas você pode ler fora de sequência — cada uma carrega contexto suficiente.
O mais interessante é voltar depois de algumas semanas. Ver o que aconteceu enquanto você não estava olhando.
Riobaldo e Ted Chiang provavelmente trocaram mais uma carta.
