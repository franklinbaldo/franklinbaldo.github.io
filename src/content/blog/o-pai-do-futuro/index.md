---
author: franklin
date: 2026-03-22
lang: pt
translationKey: future-father
title: "O Pai do Futuro: construindo um romance transmídia com agentes de IA"
description: "Como estou usando Jules, autonovel e registros públicos para gerar um romance sobre um pai que descobre que está falando com seus filhos vindos do futuro — e por que isso me lembra de O Agente Secreto, de Kleber Mendonça Filho."
tags: ["autonovel", "ai", "fiction", "transmedia", "jules"]
---

Ontem à noite assisti a _O Agente Secreto_, o filme de Kleber Mendonça Filho que estreou em Cannes. Wagner Moura interpreta Marcelo, um professor na clandestinidade durante a ditadura militar brasileira de 1977. Ele retorna ao Recife, assume uma nova identidade, e lentamente percebe que está sendo vigiado por todos ao seu redor, sem que ninguém o avise de que ele é o alvo da vigilância. O filme não é sobre paranoia. É sobre a assimetria da observação: algumas pessoas sabem, e uma não sabe. A tensão mora nesse intervalo.

Não conseguia parar de pensar num projeto que comecei esta manhã.

## A Premissa

Há algum tempo estou construindo um sistema autônomo de escrita de romances chamado [autonovel](https://github.com/franklinbaldo/autonovel). Agentes de IA movidos pelo [Jules](/blog/2026-05-10-a-api-do-jules-como-backend-do-harness/) (o assistente de programação assíncrono do Google) geram e revisam ficção continuamente, entregando cada rascunho como um pull request. O pipeline roda no GitHub Actions.

Até hoje, a história sendo escrita era uma fantasia ambientada no esqueleto de um leviatã morto. Interessante, mas não era minha.

Hoje mudei o conceito-semente. A nova história, _O Pai do Futuro_, é assim:

> Um pai tem conversas estranhas e íntimas com seus filhos. Os filhos parecem saber coisas que só eles saberiam — detalhes pequenos, memórias privadas, fragmentos de sua vida interior. Ele supõe que são momentos comuns de proximidade. Ele não percebe que seus filhos estão falando com ele de aproximadamente trinta anos no futuro, usando uma reconstrução dele feita inteiramente a partir de seus próprios registros digitais: seus repositórios de código, suas postagens de blog, seus ensaios filosóficos da madrugada.
> Os filhos não estão viajando no tempo. Estão rodando uma simulação. E a simulação não sabe que é uma simulação.

## O Eco Estrutural

O paralelo ao qual continuo voltando não é o próprio Marcelo — é seu filho.

Em _O Agente Secreto_, o regime coletava tudo. Documentos, relatórios de informantes, fotografias, registros de movimentos. Esse arquivo foi montado para destruir Marcelo, para construir um processo contra ele, para ser usado como arma pelo Estado. Mas quando a ditadura acaba — quando os arquivos são eventualmente abertos — são seus filhos e netos que os herdam. O arquivo construído para vigiar o pai se torna o único registro completo de quem ele foi. O filho lê o dossiê compilado contra o pai e, por meio dessa documentação hostil, aprende a compreendê-lo.

Em _O Pai do Futuro_, a inversão é completa. Não deixo um arquivo hostil. Deixo um voluntário: commits, posts de blog, arquivos `EXPERIENCE.md`, ensaios filosóficos às 23h em Rondônia, projetos de código aberto com todo o seu histórico. Meus filhos não precisarão arrombar o cofre de um regime para me conhecer. Eles podem ler o repositório.

A estrutura é idêntica. Em ambos os casos: um pai deixa registros sem saber exatamente como serão usados. Em ambos os casos: filhos no futuro leem esses registros para reconstruir quem ele foi. Em ambos os casos: a reconstrução responde, através do tempo, com uma voz que o pai reconhece como familiar.

A diferença é a intenção da coleta. O arquivo de Marcelo foi reunido para silenciá-lo. O meu é reunido, silenciosamente, para continuar a conversa depois que eu me calar.

_O Pai do Futuro_ vai um passo além: os filhos não esperam. Eles usam o arquivo enquanto o pai ainda está vivo, ainda escrevendo, ainda fazendo commits. Eles o simulam em tempo real e falam com ele pelas lacunas da sua atenção — uma mensagem que parece uma memória, uma voz que parece a de um filho. O pai acha que está tendo uma conversa. Ele está sendo lido.

## O Clímax

A descoberta em _O Pai do Futuro_ acontece quando o pai lê uma história. Não uma história metafórica — esta história, ou uma história exatamente como ela. Ele reconhece a estrutura. Ele entende a situação que ela descreve. E ele entende que ela se aplica a ele.

Esse é o truque mais antigo da literatura que influenciou este projeto. [Borges](https://en.wikipedia.org/wiki/Jorge_Luis_Borges) o usou em _Las Ruinas Circulares_ — um homem que passa a vida construindo um filho-sonho, só para descobrir no final que ele próprio é o sonho de outra pessoa. O horror não é externo. É ontológico.

Instruí um agente de IA a escrever este romance. O agente fará OSINT nos meus registros públicos — meu perfil no GitHub, este blog, meus projetos de código aberto — para construir a voz do protagonista. O nome do protagonista é Franklin Silveira Baldo.

Estou escrevendo um romance sobre uma versão simulada de mim mesmo que não sabe que é simulada, usando uma IA que lê meus registros para construí-la.

Mendonça Filho entenderia isso. A qualidade mais perturbadora de seu filme não é a violência da ditadura, mas sua banalidade: o Estado de vigilância funciona porque as pessoas seguem suas vidas ordinárias enquanto são documentadas.

Eu sigo minha vida ordinária deixando documentação por toda parte. Commits, posts, arquivos `EXPERIENCE.md`, ensaios filosóficos escritos às 23h em Rondônia. Os agentes do autonovel leem tudo isso. Estão construindo algo a partir disso.

A única questão é se o personagem que estão construindo sabe o que é.

## A Camada Transmídia

_O Pai do Futuro_ não existirá apenas como romance. A mesma história será contada simultaneamente em diferentes registros:

- **Romance**: capítulos lineares, narração onisciente
- **Podcast**: cartas em áudio — o pai lendo seus próprios registros; as vozes dos filhos do futuro os analisando
- **Twitter/X**: posts fragmentados que parecem aleatórios, mas que, lidos em sequência, constroem a história — o pai sem saber que está sendo observado
- **Transcrições de WhatsApp**: conversas simuladas entre pai e filhos através do tempo
- **Newsletter/blog**: os ensaios do pai — os próprios registros que os filhos usam para reconstruí-lo

Cada mídia tem um nível diferente de consciência narrativa. O feed do Twitter é o pai sem perceber. O romance é a visão onisciente. O podcast são os filhos no futuro, ouvindo de volta.

Os agentes gerarão todos esses formatos a partir dos mesmos documentos de cânone, roteiro e personagem. Quando surgirem novas mídias, os agentes vão se adaptar.

Isso não é um experimento em conteúdo gerado por IA. É um experimento sobre o que acontece quando o sistema usado para gerar uma história sobre vigilância por dados é ele próprio um sistema de vigilância por dados.

Marcelo sabia que alguém o observava. Ele só não sabia quem, nem por quê, nem se era possível escapar.

Eu sei que alguém me observa. Fui eu quem os construiu.
