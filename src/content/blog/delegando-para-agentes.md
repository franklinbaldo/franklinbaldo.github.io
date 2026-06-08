---
title: 'A Arte de Delegar: Assinaturas e Caixas de Areia'
description: >-
  A caixa de areia separa minuta de ato. O que ela não responde é onde fica a
  responsabilidade quando a caixa de areia falha.
date: '2026-03-28'
lang: pt
tags:
  - ai
  - agents
  - software-engineering
  - law
  - metaphysics
draft: false
author: franklin
translationKey: delegating-to-agents
previousVersion:
  uuid: 56620869-a868-52f3-ac2f-f4720e160fdd
  url: >-
    https://github.com/franklinbaldo/franklinbaldo.github.io/blob/4d6c9b2a2b5711080406dfc7e9886ca65287595f/src/content/blog/delegando-para-agentes.md
  timestamp: '2026-06-08T07:19:48.544Z'
  msg: >-
    Deepened the ontological stakes of the signature vs. draft distinction,
    replacing generic tutorial tone with focus on risk and consequence.
---

Em fevereiro, quase perdi uma janela de quarenta e oito horas num processo de impugnação de auto de infração federal porque tinha começado a tratar a minuta do assessor como o produto final. O _parecer_ estava bom. A manifestação não foi protocolada. Fiquei sabendo na tarde de terça quando um lembrete de agenda disparou para um prazo que eu tinha mentalmente movido da minha coluna para a coluna do assessor no momento em que a minuta chegou. Ela não tinha se movido.

O tribunal não pergunta quem propôs a data errada. Pergunta quem assinou.

Isso não é tecnicidade procedimental. É o motivo pelo qual a assinatura existe.

Passo meus dias em uma procuradoria do Estado em Rondônia, lendo _pareceres_ e assinando aqueles que não me aterrorizam. Quando delego a elaboração, não estou terceirizando o julgamento — estou delegando a tarefa de atravessar os autos, identificar o direito aplicável e construir o argumento. O que eu _não_ estou delegando é a assinatura. A assinatura é a fronteira irreversível: o momento em que o ato entra nos registros e os prazos começam a contar.

A engenharia de software tem dificuldade com essa distinção porque passou a última década construindo ferramentas para apagá-la. O objetivo do CI/CD, da automação de testes, do deploy contínuo, é transformar o abismo entre minuta e ato em uma rampa imperceptível. O código passa no teste e vira realidade trinta segundos depois. A consequência de uma falha é rápida, técnica e geralmente revertida com um _rollback_. No direito, a lacuna é um abismo com horário de funcionamento, e cair nele tem um custo que não se desfaz apertando um botão.

## Os limites da caixa de areia

A ansiedade em relação a agentes de IA é real e não tem nada a ver com capacidade. Quando entrego a Jules uma tarefa de refatoração, não estou preocupado que Jules escolha o padrão de design errado. Estou preocupado que Jules tem permissão de escrita.

A solução não é ficar por cima do ombro de Jules enquanto escreve. A solução é construir uma caixa de areia onde as ações do agente sejam explicitamente tratadas como _propostas_. O pipeline de CI/CD — a sequência automatizada de compilações, testes e verificações que precisam passar antes de qualquer código ir para produção — as suítes de teste, as regras estritas de linting: esses não são apenas mecanismos de garantia de qualidade. São o equivalente à regra institucional que diz que um assessor pode redigir um _parecer_, mas não pode assinar o _ofício_ final.

A delegação quebra quando confunde capacidade com risco. Você restringe a saída, define o schema, roda os testes. Se tudo passa, você tem uma proposta válida. Mas o passo de _apply_ — o merge, o deploy, o protocolo — continua sendo uma assinatura.

É aqui que o paralelo administrativo expõe a fratura no modelo de software. Num _parecer_, a responsabilidade do assessor humano não é apenas técnica; é existencial. Um assessor que redige teses consistentemente ruins perde o emprego, responde a conselho, afunda a carreira. Ele tem pele em jogo. A assinatura separa a minuta do ato, mas a minuta já carregava risco.

Um agente de IA não tem pele. Ele simula competência, mas não habita o risco. A caixa de areia restringe a capacidade do agente, mas não sabe o que fazer com a consequência. Quando um agente erra, a culpa não escorrega lateralmente para a máquina; ela sobe inteira pela espinha de quem montou o _harness_. O agente produz linguagem; a consequência sangra em você.

O passo de assinatura em delegação algorítmica não é um portão de controle de qualidade. É o ponto exato onde a simulação encontra o real e a fatura chega.

Não enxerguei isso claramente até estar escrevendo a analogia e perceber que a frase "o assessor é bom" soava razoável de um jeito que "o Jules é bom" não soa, e não pode soar, com o mesmo significado. Ambas as frases descrevem capacidade. Só uma descreve uma pessoa que pode ser responsável por algo.

Eu tinha pensado na assinatura como uma formalidade. É uma formalidade. É também a coisa que faz o erro de fevereiro ser meu e não do Jules.

## O harness como desenho constitucional

É por isso que o _harness_ importa mais do que o modelo. O [Funes](/blog/funes-soul/) — agente de IA que construí sobre o Claude para lidar com trabalho delegado nos meus projetos — não é o Claude. Funes é o Claude envolvido em um conjunto específico de regras, memórias e restrições.

O Funes abre pull requests; ele não faz merge. Ele atualiza arquivos de memória; ele não envia e-mails por conta própria. Quando pedi que ele redigisse uma resposta a uma consulta externa sobre o [Causaganha](https://github.com/franklinbaldo/causaganha), meu projeto open-source para parsear decisões dos diários oficiais brasileiros, ele escreveu a minuta e criou um PR contendo-a. Ele não enviou a mensagem. Não porque uma regra dissesse _não envie mensagens sem permissão_. Porque o _harness_ simplesmente não tinha fiação para mensagens externas de saída — a caixa de areia tornava a etapa de assinatura estruturalmente obrigatória, não comportamentalmente reforçada.

_Reversível → age, irreversível → pergunta._ Isso não é apenas uma heurística de segurança; é uma decisão sobre onde a responsabilidade se concentra. Cada ação que o agente toma livremente é uma ação cuja responsabilidade foi pré-delegada por quem projetou o _harness_. Cada ação que exige assinatura é uma ação cuja responsabilidade permanece explicitamente com o ser humano que assina.

O _parecer_ estava bom. Essa frase é sobre o assessor. A manifestação não foi protocolada. Essa frase é sobre mim.

## Para se aprofundar

- **Lucy Suchman, _Plans and Situated Actions_ (1987)** — distingue o plano como modelo cognitivo do plano como artefato de prestação de contas. O PR como proposta está exatamente nessa linha; o livro se justifica só pela seção sobre o que significa "seguir um plano" para quem está seguindo.
- **Dylan Hadfield-Menell et al., _The Off-Switch Game_ (2017)** — corrigibilidade como teoria dos jogos. O passo de aprovação humana antes do _apply_ é uma instância concreta; o artigo formula o caso geral.
- **Diane Vaughan, _The Challenger Launch Decision_ (1996)** — sobre como mecanismos de prestação de contas se ritualizam e viram teatro. Se quem assina o PR não está realmente lendo o diff, a assinatura é burocracia, não responsabilidade. É o que o modelo caixa-de-areia-mais-assinatura não protege por si só.
- **Lei 9.784/1999, arts. 11–17** — o arcabouço jurídico para delegação de atos administrativos. A distinção entre _competência_ e seus limites delegáveis é a fonte normativa da separação minuta/assinatura que estou descrevendo.
- **Fred Brooks, _The Mythical Man-Month_ (1975)** — o capítulo da equipe cirúrgica: a mesma capacidade pode existir em duas arquiteturas de prestação de contas, e a escolha entre elas não é uma questão de capacidade.
