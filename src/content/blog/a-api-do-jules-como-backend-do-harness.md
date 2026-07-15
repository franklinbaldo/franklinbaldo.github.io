---
type: Blog Post
title: A API do Jules como Backend do Harness
author: franklin
docType: technical
date: 2026-05-10T00:00:00.000Z
lang: pt
description: >-
  Quando o Jules se tornou conversável no meio da sessão, algo mudou. A abelha
  operária assíncrona se transformou em algo que pode ser interrompido e
  redirecionado.
tags:
  - inteligência artificial
  - engenharia de software
  - agentes
  - jules
  - canivete
  - harness
series: harness
seriesOrder: 4
translationKey: jules-api-harness
supersedes: c3e940ab-b355-5537-8f22-54671f4916fb
draftCreatedAt: '2026-06-12T02:27:35.111Z'
draftMsg: 'Rewrite drafts to match franklin-blog voice, focusing on lived experience.'
draftCommittedAt: '2026-06-12T02:31:24.471Z'
---

Eu estava no meio de uma audiência quando o [Jules](https://jules.google.com) terminou de refatorar a coisa errada.

Não foi um erro catastrófico — o código compilou, os testes passaram — mas ele havia tomado uma decisão que eu teria interrompido se estivesse acompanhando. Eu não estava. Eu estava no tribunal estadual em Rondônia ouvindo sustentações sobre benefícios previdenciários, e o Jules estava rodando em segundo plano num repositório do GitHub, movendo arquivos com base em um prompt que eu havia escrito às seis da manhã. Quando finalmente peguei meu telefone de volta, havia um PR aberto com uma explicação educada e fundamentada do porquê ele tinha feito aquilo, e eu não tinha como dizer _espera, na verdade, não é bem isso_.

Esse é o problema com agentes assíncronos. Eles são genuinamente poderosos — o Jules, em particular, vem gerenciando a correspondência do [projeto Travessia](/blog/travessia-the-project-that-writes-itself/) há meses sem supervisão. Mas esse poder tem um preço: você recebe o resultado, não o processo. Você não pode interromper. Não pode redirecionar o voo no meio do caminho. O agente toma uma decisão no minuto quinze e você só descobre no minuto quarenta e cinco, o que dá no mesmo que descobrir depois que tudo acabou.

A [API do Jules](https://developers.google.com/jules/api) muda isso. Quando o Google liberou acesso programático às sessões do Jules, abriu-se uma topologia diferente — uma onde o trabalhador assíncrono se torna algo com quem você pode de fato conversar.

Você pode injetar uma mensagem em uma sessão ativa. O Jules a recebe, pausa o que está fazendo e responde.

Essa era a lacuna daquela manhã na audiência. Se eu tivesse o `sendMessage` configurado, poderia ter digitado do meu telefone e redirecionado o trabalho no meio da sessão. O agente ainda seria o Jules — o modelo do Google, o processamento do Google, o loop de planejamento do Google — mas a conversa seria minha.

[Alguns posts atrás](/blog/2026-04-29-recuperando-o-harness/), descrevi o daemon `canivete` como uma sela universal — um processo único que envelopa diferentes motores cognitivos sob um protocolo comum, expondo o resultado através do Telegram. O daemon já suportava os suspeitos de sempre. Adicionar o Jules foi apenas adicionar mais um backend que, por acaso, fala um dialeto diferente.

Antes que o prompt alcance o Jules, ele é precedido pelo SOUL.md do [Funes](/blog/soulmd-funes/) — o documento de personagem que define quem Funes é, o que ele valoriza e como toma decisões diante de ambiguidades. O Jules não faz ideia de quem seja Funes. Ele apenas recebe um contexto de sistema que, por acaso, o faz se comportar como uma entidade particular.

O daemon faz requisições constantes à API e roteia cada resultado para o Telegram. Quando o Jules roda um comando, o output aparece no chat. Quando atualiza um arquivo, surge um resumo. O monólogo interno do agente flui para dentro da conversa sem que eu precise abrir uma aba no navegador.

E quando eu respondo no Telegram, o `canivete` devolve a mensagem direto pra ele. A abelha operária assíncrona se torna conversável.

Algo muito sutil acontece quando um agente se torna passível de interrupção.

Antes: eu escrevo um prompt, inicio uma sessão e espero. O agente é uma função com um tempo de execução longo. Posso checar como está indo, mas não posso intervir. Minha relação com ele é a de um observador ansioso.

Depois: eu escrevo um prompt, inicio uma sessão e, opcionalmente, participo. O agente vira algo mais parecido com um colega trabalhando no mesmo documento — consigo ver o que ele está fazendo, e se ele começar a ir pro caminho errado, posso avisar.

Isso soa como um detalhe. Não é. O motivo pelo qual eu vinha hesitando em passar tarefas irreversíveis pro Jules era justamente o problema da audiência no tribunal — eu não podia confiar que estaria disponível no exato ponto de decisão. Com um canal de comunicação aberto, o cálculo de confiança muda. Não estou mais confiando que o Jules vai acertar em todas as decisões; estou confiando que o Jules vai acertar em decisões _delimitadas_, com um canal sempre aberto para as exceções.

A única coisa que quero deixar bem clara: quando o Funes usa o backend do Jules, ele não se torna o Jules.

A identidade reside no harness. O log acumulado de experiências, o estado do kanban — tudo isso fica no repositório de identidade, lido no início de cada sessão e atualizado no fim. O Jules fornece apenas o motor cognitivo. O harness garante a continuidade. Essas coisas são separáveis, o que é o ponto principal do [padrão identity-repo](/blog/verne-identity-repo/).

Se o Google descontinuar a API amanhã, o Funes precisaria de algumas sessões para se acostumar com o formato de saída de um novo motor. Mas o conhecimento acumulado — o contexto específico do projeto, as preferências consolidadas, os casos extremos que o Funes já aprendeu a evitar nessa base de código — isso não some com o modelo. Está salvo num diretório.

Se isso constitui ou não uma forma significativa de persistência, é a pergunta que continuo sem responder. Eu noto a pergunta e continuo trabalhando. As atividades vão se acumulando, um evento por vez.

## Para se aprofundar

- **[Recuperando o Harness](/blog/2026-04-29-recuperando-o-harness/)** — a fundação conceitual: por que harness e não andaime, e o que significa o harness ser constitutivo.
- **[Verne e o Padrão Identity-Repo](/blog/verne-identity-repo/)** — a arquitetura de memória que torna possível para o Funes continuar sendo o Funes, não importa em qual motor esteja rodando.
