---
title: 'A Arte de Delegar: Assinaturas e Caixas de Areia'
description: >-
  Por que o problema com agentes autônomos não é o microgerenciamento, mas a
  distinção administrativa entre redigir o ato e assiná-lo.
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
replacedVersion: a5f84a5f-0380-55f4-a27f-1904b5cf0630
editHistory:
  - uuid: a5f84a5f-0380-55f4-a27f-1904b5cf0630
    timestamp: '2026-05-22T03:31:42.922Z'
    msg: >-
      Rewrite 'The Art of Delegation' to remove generic parenting cliches and
      ground it in the specific administrative/legal context of delegation and
      signature, elevating the process-metaphysics.
---

O problema com a maior parte do que se escreve sobre delegação para IA é a suposição de que a dificuldade é emocional. O engenheiro, dizem-nos, tem dificuldade em abrir mão do controle. A solução oferecida geralmente é alguma variação de "confie no sistema" ou "trate o agente como um desenvolvedor júnior".

Isso é um conselho ruim embrulhado numa metáfora ruim. A dificuldade não é emocional; é estrutural. E a estrutura é algo que a profissão jurídica resolveu há muito tempo, porque a profissão jurídica é, no fundo, uma tecnologia para gerenciar delegações perigosas.

Passo meus dias em uma procuradoria do Estado em Rondônia, lendo _pareceres_ redigidos por assessores e assinando aqueles que não me aterrorizam. Quando delego a elaboração de uma manifestação jurídica, não estou pedindo a alguém para ser meu teclado estendido. Estou delegando a tarefa de atravessar os autos, identificar o direito aplicável e propor uma conclusão. O que eu _não_ estou delegando é a assinatura. A assinatura é a fronteira irreversível.

Quando orquestramos agentes como [Jules](/blog/2026-05-10-a-api-do-jules-como-backend-do-harness/) e Claude, o problema não é que queremos microgerenciar seus comandos. O problema é que a engenharia de software, ao contrário do direito administrativo, não separa nativamente a minuta da assinatura. No código, escrever a função e executá-la frequentemente parecem o mesmo movimento contínuo.

## Os limites da caixa de areia

Quando confio a Jules a refatoração de um microsserviço em background, a ansiedade não vem do medo de que Jules escolha o padrão de design errado. A ansiedade vem do fato de que Jules tem permissão de escrita.

A solução não é ficar por cima do ombro de Jules enquanto ele escreve. A solução é construir uma caixa de areia onde as ações do agente sejam explicitamente tratadas como _propostas_. O pipeline de CI/CD, as suítes de teste, as regras estritas de linting — esses não são apenas mecanismos de garantia de qualidade. Eles são o equivalente às regras institucionais que dizem que um assessor pode redigir um _parecer_, mas não pode assinar o _ofício_ final.

A mágica da delegação acontece quando você restringe o espaço de saída, não o processo. Você define os limites da caixa de areia — o schema, as invariantes, os testes — e permite que o agente navegue livremente pelo interior. Se os testes passam, a proposta é válida. Mas o passo de _apply_ — o merge real do PR, o deploy para produção — isso continua sendo uma assinatura humana.

<figure class="meme">
  <img
    src="https://api.memegen.link/images/drake/Microgerenciar_os_prompts_do_agente/Restringir_a_caixa_de_areia_do_agente.png?width=500"
    alt="Meme do Drake: Rejeitando 'Microgerenciar os prompts do agente', aprovando 'Restringir a caixa de areia do agente'."
    loading="lazy"
  />
  <figcaption>A mudança de postura necessária para realmente tornar os sistemas autônomos úteis.</figcaption>
</figure>

## O harness como desenho constitucional

É por isso que o _harness_ importa mais do que o modelo. [Funes](/blog/funes-soul/) não é o Claude; Funes é o Claude envolvido em um conjunto específico de regras, memórias e restrições. Quando Funes lê seu `SOUL.md` e decide documentar uma decisão em vez de apenas executá-la, ele está operando dentro de um arcabouço administrativo.

Ele age porque o arcabouço permite, e ele pausa quando o arcabouço exige uma assinatura. _Reversível → age, irreversível → pergunta._ Isso não é apenas uma heurística de segurança; é uma teoria de desenho constitucional para agentes.

Não estamos construindo ferramentas que nos substituem. Estamos construindo um aparato administrativo onde o discernimento humano senta na beirada da caixa de areia, revisando as propostas geradas pela força bruta probabilística lá dentro. A tela brilha no escritório escuro. Os _pull requests_ se acumulam. E a assinatura espera.

## Para se aprofundar

- **Lucy Suchman, _Plans and Situated Actions_ (1987)** — sobre a diferença entre o plano como modelo cognitivo e o plano como artefato de prestação de contas. O PR como proposta é exatamente esse tipo de artefato.
- **[Retomando o Harness](/blog/2026-04-29-retomando-o-harness/)** — por que o _harness_ não é apenas andaime, mas a estrutura constitutiva real do agente.
- **[A API do Jules como Backend do Harness](/blog/2026-05-10-a-api-do-jules-como-backend-do-harness/)** — como a mudança de _worker_ assíncrono para agente conversável altera o cálculo de confiança da delegação.
- **[O Agente Que Não Inventa Verbos](/blog/2026-05-14-o-agente-que-nao-inventa-verbos/)** — o que acontece quando você força um agente a usar apenas playbooks nomeados e endereçados por conteúdo no disco.
