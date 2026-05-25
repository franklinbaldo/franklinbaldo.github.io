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
previousVersion:
  uuid: b02fe317-ce8a-52f5-9685-6241cc495f97
  url: >-
    https://github.com/franklinbaldo/franklinbaldo.github.io/blob/d2a4c9283e2693e9083a7f71e0cd012de28b25a2/src/content/blog/2026-03-28-delegando-para-agentes.md
  timestamp: '2026-05-24T13:14:42.583Z'
  msg: >-
    Adicionou incidente concreto de fevereiro (prazo processual quase perdido)
    que âncora a distinção draft/assinatura em evento real. Substituiu
    fechamento atmosférico pela linha deadpan: 'O assessor é bom. O agente é
    capaz. Nenhum desses fatos muda quem assina.' Cortou 3 auto-links do For
    Further Reading; manteve Suchman e adicionou Off-Switch Game como referência
    externa.
---

O problema com a maior parte do que se escreve sobre delegação para IA não é que esteja errado. É que está ambientado na sala errada.

Em fevereiro, quase perdi uma janela recursal num processo federal porque tinha começado a tratar a minuta do assessor como o produto final. O parecer estava bom — a análise era cuidadosa, o direito corretamente identificado, a conclusão defensável. O que eu tinha parado de monitorar era a distância entre "o assessor terminou de redigir" e "eu assinei a manifestação oficial". Essa distância é onde o prazo mora. A minuta estava pronta quarenta e oito horas antes do corte. Eu quase não percebi que ela ainda não tinha sido protocolada. Tinha confundido a proposta com o ato.

Essa é a mesma confusão que quebra a delegação para IA.

Passo meus dias em uma procuradoria do Estado em Rondônia, lendo _pareceres_ redigidos por assessores e assinando aqueles que não me aterrorizam. Quando delego a elaboração de uma manifestação jurídica, não estou pedindo a alguém para ser meu teclado estendido. Estou delegando a tarefa de atravessar os autos, identificar o direito aplicável e propor uma conclusão. O que eu _não_ estou delegando é a assinatura. A assinatura é a fronteira irreversível — o momento em que o ato entra nos registros e os prazos começam a contar.

Quando orquestramos agentes como Jules e Claude, o problema não é que queremos microgerenciar seus comandos. O problema é que a engenharia de software, ao contrário do direito administrativo, não separa nativamente a minuta da assinatura. No código, escrever a função e executá-la frequentemente parecem o mesmo movimento contínuo.

## Os limites da caixa de areia

Quando confio a Jules a refatoração de um microsserviço em background, a ansiedade não vem do medo de que Jules escolha o padrão de design errado. A ansiedade vem do fato de que Jules tem permissão de escrita.

A solução não é ficar por cima do ombro de Jules enquanto ele escreve. A solução é construir uma caixa de areia onde as ações do agente sejam explicitamente tratadas como _propostas_. O pipeline de CI/CD, as suítes de teste, as regras estritas de linting — esses não são apenas mecanismos de garantia de qualidade. Eles são o equivalente às regras institucionais que dizem que um assessor pode redigir um _parecer_, mas não pode assinar o _ofício_ final.

A mágica da delegação acontece quando você restringe o espaço de saída, não o processo. Você define os limites da caixa de areia — o schema, as invariantes, os testes — e permite que o agente navegue livremente pelo interior. Se os testes passam, a proposta é válida. Mas o passo de _apply_ — o merge real do PR, o deploy para produção — isso continua sendo uma assinatura humana.

<figure class="meme">
  <img
    src="https://api.memegen.link/images/drake/Micromanaging_the_agent's_prompts/Constraining_the_agent's_sandbox.png?width=500"
    alt="Meme do Drake: Rejeitando 'Microgerenciar os prompts do agente', aprovando 'Restringir a caixa de areia do agente'."
    loading="lazy"
  />
  <figcaption>A mudança de postura necessária para realmente tornar os sistemas autônomos úteis.</figcaption>
</figure>

## O harness como desenho constitucional

É por isso que o _harness_ importa mais do que o modelo. [Funes](/blog/funes-soul/) não é o Claude; Funes é o Claude envolvido em um conjunto específico de regras, memórias e restrições. Quando Funes lê seu `SOUL.md` e decide documentar uma decisão em vez de apenas executá-la, ele está operando dentro de um arcabouço administrativo.

Ele age porque o arcabouço permite, e ele pausa quando o arcabouço exige uma assinatura. _Reversível → age, irreversível → pergunta._ Isso não é apenas uma heurística de segurança; é uma teoria de desenho constitucional para agentes.

O assessor é bom. O agente é capaz. Nenhum desses fatos muda quem assina.

## Para se aprofundar

- **Lucy Suchman, _Plans and Situated Actions_ (1987)** — sobre a diferença entre o plano como modelo cognitivo e o plano como artefato de prestação de contas. O PR como proposta é exatamente esse tipo de artefato.
- **Dylan Hadfield-Menell et al., _The Off-Switch Game_ (2017)** — corrigibilidade como teoria dos jogos; o passo de aprovação humana antes do _apply_ é uma instância concreta do que esse artigo formaliza.
