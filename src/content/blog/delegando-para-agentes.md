---
title: 'A Arte da Delegação: Assinaturas e Sandboxes'
description: >-
  O sandbox separa o rascunho do ato. O que ele não faz é responder onde mora a
  responsabilidade quando o sandbox falha.
date: '2026-03-28'
lang: pt
tags:
  - ia
  - agentes
  - engenharia de software
  - direito
  - metafísica
draft: false
author: franklin
translationKey: delegating-to-agents
previousVersion:
  uuid: 56620869-a868-52f3-ac2f-f4720e160fdd
  url: >-
    https://github.com/franklinbaldo/franklinbaldo.github.io/blob/4d6c9b2a2b5711080406dfc7e9886ca65287595f/src/content/blog/delegando-para-agentes.md
  timestamp: '2026-06-08T15:29:03.290Z'
  msg: >-
    Rewrite 'The Art of Delegation' to improve tone, tighten the thesis, and
    bring it closer to the essayistic, philosophically ambitious voice used
    throughout the blog.
---

Em fevereiro, eu quase perdi uma janela de quarenta e oito horas num embargo de execução fiscal federal porque comecei a tratar o rascunho do assessor como a entrega final. O _parecer_ — a manifestação jurídica formal que sobe a cadeia de comando antes de qualquer coisa ser assinada — estava bom. A petição não foi protocolada. Descobri na tarde de terça-feira quando um alerta do calendário apitou para um prazo que eu tinha transferido mentalmente da minha coluna para a coluna do assessor no minuto em que o rascunho chegou. O prazo não tinha se movido.

O tribunal não pergunta quem propôs a data errada. Ele pergunta quem assinou.

Isso não é uma tecnicalidade processual. Essa é a razão pela qual a assinatura existe.

Passo meus dias numa procuradoria de estado em Rondônia, lendo _pareceres_ e assinando aqueles que não me deixam apavorado. Quando delego o rascunho, não estou terceirizando o julgamento — estou delegando a travessia dos autos, a identificação da lei aplicável, a construção do argumento. O que eu _não_ estou delegando é a assinatura. A assinatura é a fronteira irreversível: o momento em que o ato entra no registro e os prazos começam a correr.

A engenharia de software não reconhece nativamente essa distinção porque o ciclo de feedback a comprime. No direito, o fosso entre rascunho e ato é fisicamente legível — o assessor termina, o protocolo tem sua janela de tempo, a corte tem sua própria pauta. No código, o desenvolvedor escreve a função, os testes rodam em trinta segundos, o PR é mergeado no verde. Rascunho e ato se tornam um movimento contínuo, e ninguém anota onde um termina e o outro começa.

## As fronteiras do sandbox

A ansiedade sobre agentes de IA é real e não tem nada a ver com capacidade. Quando eu entrego uma tarefa de refatoração para o [Jules](/blog/2026-05-10-a-api-do-jules-como-backend-do-harness/), não estou preocupado que o Jules vá escolher o padrão de design errado. Estou preocupado que o Jules tem permissão de escrita.

A solução não é ficar espiando por cima do ombro do Jules enquanto ele escreve. A solução é um sandbox onde as ações do agente são tratadas explicitamente como _propostas_. A pipeline de CI/CD — a sequência automatizada de builds, testes e verificações que precisam passar antes de qualquer código ir para produção —, as suítes de testes, as regras rígidas de linting: essas coisas não são apenas mecanismos de garantia de qualidade. Elas são o equivalente institucional da regra que diz que um assessor pode redigir um _parecer_, mas não pode assinar o _ofício_ final (o despacho oficial que sai pela porta e vincula a instituição).

A mágica da delegação acontece quando você restringe o espaço de saída, não o processo. Você define os limites do sandbox — o schema, os invariantes, os testes — e permite que o agente navegue livremente no interior. Se os testes passam, a proposta é válida. Mas a etapa de _apply_ — o merge real do PR, o deploy em produção — essa continua sendo uma assinatura humana. Uma pipeline de CI que não pode ser contornada é um escritório de protocolo: uma etapa de processamento obrigatório entre o rascunho e o ato.

É aqui que o paralelo do direito administrativo lisonjeia o problema de software. Num _parecer_, a responsabilidade do assessor é profissional. Aconselhamento jurídico consistentemente ruim leva a revisão formal — a _corregedoria_ (o órgão de supervisão interna), o conselho profissional, e eventualmente a carreira. Há uma corrente que liga o ato à pessoa que o redigiu, e essa corrente tem dentes. A assinatura não separa apenas rascunho do ato: ela separa a carreira de quem está em jogo da de quem não está.

Um agente de IA não tem carreira. Ele não pode ser disciplinado. O sandbox restringe o que ele pode fazer, mas o sandbox não responde o que acontece quando o sandbox falha. Quando um agente faz algo errado dentro dos limites do seu acesso, a responsabilidade flui para cima, para o humano que projetou o harness — não lateralmente para o agente. Isso não é uma propriedade que eu construí; é uma propriedade de agentes sem status institucional.

O sandbox é necessário. Ele não é suficiente para a responsabilidade. O passo da assinatura na delegação de software faz mais trabalho do que o paralelo administrativo sugere: ele não apenas torna explícita a fronteira proposta-versus-ato. Ele também carrega todo o peso profissional que o agente estruturalmente não consegue carregar.

Eu não via isso com clareza até estar escrevendo essa analogia e notar que a frase "o assessor é bom" soava razoável de um jeito que "o Jules é bom" não significa, e não poderia significar, exatamente a mesma coisa. As duas frases descrevem capacidade. Apenas uma descreve uma pessoa que pode ser responsabilizada por qualquer coisa.

Eu vinha pensando na assinatura como uma formalidade. E é uma formalidade. Mas também é a coisa que faz o erro de fevereiro ser meu e não do Jules.

## O harness como desenho constitucional

É por isso que o harness importa mais que o modelo. [Funes](/blog/soulmd-funes/) — o agente de IA que eu construí em cima do Claude para lidar com trabalho delegado através dos meus projetos — não é o Claude. Funes é o Claude envolvido num conjunto específico de regras, memórias e restrições.

O Funes abre pull requests; ele não faz o merge deles. Ele atualiza arquivos de memória; ele não manda e-mails por conta própria. Quando pedi a ele para rascunhar uma resposta a uma consulta externa sobre o [Causaganha](https://github.com/franklinbaldo/causaganha), meu projeto de código aberto para análise do diário oficial brasileiro, ele escreveu o rascunho e abriu um PR com ele. Ele não enviou a mensagem. Não porque uma regra dizia _não envie mensagens sem permissão_. Mas porque o harness não tinha a fiação para mensagens externas de saída — o sandbox tornava a etapa da assinatura estruturalmente necessária, não imposta pelo comportamento.

_Reversível → age, irreversível → pergunta._ Isso não é apenas uma heurística de segurança; é uma decisão sobre onde a responsabilidade se concentra. Cada ação que o agente realiza livremente é uma ação cuja responsabilidade foi pré-delegada por quem projetou o harness. Cada ação que exige uma assinatura é uma ação cuja responsabilidade permanece explicitamente com o humano que assina.

O _parecer_ estava bom. Essa frase é sobre o assessor. A petição não foi protocolada. Essa frase é sobre mim.

## Para se aprofundar

- **Lucy Suchman, _Plans and Situated Actions_ (1987)** — distingue o plano como um modelo cognitivo do plano como um artefato de responsabilidade. O PR-como-proposta senta-se exatamente nessa linha, e o livro justifica a leitura na seção sobre o que "seguir um plano" realmente significa para as pessoas que estão seguindo um.
- **Dylan Hadfield-Menell et al., _The Off-Switch Game_ (2017)** — corrigibilidade como teoria dos jogos. O passo de aprovação-humana-antes-de-aplicar é uma instância concreta; o paper formula o caso geral.
- **Diane Vaughan, _The Challenger Launch Decision_ (1996)** — sobre como mecanismos de responsabilidade se ritualizam em teatro. Se o humano que assina o PR não está de fato lendo o diff, a assinatura é burocracia, não responsabilidade. Isso é o que o design sandbox-mais-assinatura não protege por conta própria.
- **Lei 9.784/1999 (Brasil), arts. 11–17** — o quadro jurídico doméstico para a delegação de atos administrativos. A distinção entre _competência_ e os seus limites delegáveis é a fonte estatutária para a separação rascunho/assinatura que venho descrevendo.
- **Fred Brooks, _The Mythical Man-Month_ (1975)** — o capítulo sobre a equipe cirúrgica: a mesma capacidade pode existir em duas arquiteturas de responsabilidade, e a escolha entre elas não é uma questão de capacidade.
