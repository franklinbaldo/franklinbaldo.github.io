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
  uuid: 1219b41b-d848-5afe-b305-8ba3fa33507b
  url: >-
    https://github.com/franklinbaldo/franklinbaldo.github.io/blob/d353fd1dce1fa025a8a975be942176eb22ba4c87/src/content/blog/delegando-para-agentes.md
  timestamp: '2026-05-26T13:23:41.259Z'
  msg: >-
    Ancorado o incidente de fevereiro no tipo específico de caso (auto de
    infração tributária, prazo de 48h), tornando a falha concreta em vez de
    abstrata. Adicionado parágrafo explicando por que a engenharia de software
    não separa nativamente minuta de assinatura — a legibilidade da lacuna é o
    que o direito administrativo fornece e o código precisa recriar. Expandido o
    comportamento concreto do Funes no harness (PR sem merge, causaganha draft
    sem envio). Dois novos itens no For Further Reading: Lei 9.784 como fonte
    normativa direta e Brooks para o princípio da equipe cirúrgica.
---

O problema com a maior parte do que se escreve sobre delegação para IA não é que esteja errado. É que está ambientado na sala errada.

Em fevereiro, quase perdi uma janela num processo tributário federal porque tinha começado a tratar a minuta do assessor como o produto final. O processo era uma impugnação de auto de infração — quarenta e oito horas para contestar antes de o prazo administrativo fechar. O _parecer_ estava bom: o fundamento legal corretamente identificado, o argumento processual sólido, a conclusão defensável. O assessor tinha marcado como pronto para revisão na manhã de segunda-feira. A janela fechava na quarta à meia-noite. Na tarde de terça percebi que a manifestação não tinha sido protocolada. A minuta estava completa. O ato não estava. São quarenta e oito horas durante as quais eu tinha parado de monitorar algo pelo qual eu era juridicamente responsável.

Essa é a mesma confusão que quebra a delegação para IA.

Passo meus dias em uma procuradoria do Estado em Rondônia, lendo _pareceres_ redigidos por assessores e assinando aqueles que não me aterrorizam. Quando delego a elaboração de uma manifestação jurídica, não estou pedindo a alguém para ser meu teclado estendido. Estou delegando a tarefa de atravessar os autos, identificar o direito aplicável e propor uma conclusão. O que eu _não_ estou delegando é a assinatura. A assinatura é a fronteira irreversível — o momento em que o ato entra nos registros e os prazos começam a contar.

O motivo pelo qual essa distinção não surge naturalmente na engenharia de software é que o ciclo de _feedback_ é mais rápido. No direito, os atrasos estão embutidos na instituição: o assessor termina a minuta, o protocolo tem uma janela de processamento, o sistema do tribunal tem seu próprio horário. As etapas são fisicamente separadas e a lacuna é legível. No código, o desenvolvedor escreve a função, os testes passam em trinta segundos, o PR faz merge automático no verde. A proposta e o ato se comprimem num movimento contínuo, e o ponto em que a saída do agente para de ser minuta e começa a ser ato nunca é tornado explícito.

Quando orquestramos agentes como Jules e Claude, o problema não é que queremos microgerenciar seus comandos. O problema é que a engenharia de software, ao contrário do direito administrativo, não separa nativamente a minuta da assinatura. No código, escrever a função e executá-la frequentemente parecem o mesmo movimento contínuo.

## Os limites da caixa de areia

Quando confio a Jules a refatoração de um microsserviço em background, a ansiedade não vem do medo de que Jules escolha o padrão de design errado. A ansiedade vem do fato de que Jules tem permissão de escrita.

A solução não é ficar por cima do ombro de Jules enquanto ele escreve. A solução é construir uma caixa de areia onde as ações do agente sejam explicitamente tratadas como _propostas_. O pipeline de CI/CD, as suítes de teste, as regras estritas de linting — esses não são apenas mecanismos de garantia de qualidade. Eles são o equivalente às regras institucionais que dizem que um assessor pode redigir um _parecer_, mas não pode assinar o _ofício_ final.

A mágica da delegação acontece quando você restringe o espaço de saída, não o processo. Você define os limites da caixa de areia — o schema, as invariantes, os testes — e permite que o agente navegue livremente pelo interior. Se os testes passam, a proposta é válida. Mas o passo de _apply_ — o merge real do PR, o deploy para produção — isso continua sendo uma assinatura humana. Um pipeline de CI que não pode ser bypassado é um protocolo: uma etapa de processamento obrigatória entre a minuta e o ato que torna as etapas legíveis novamente.

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

O Funes abre pull requests; ele não faz merge. Ele atualiza arquivos de memória; ele não envia e-mails por conta própria. Quando pedi que ele redigisse uma resposta a uma consulta externa sobre o causaganha, ele escreveu a minuta e criou um PR contendo-a. Ele não enviou a mensagem. Não porque uma regra dissesse _não envie mensagens sem permissão_. Porque o _harness_ simplesmente não tinha fiação para mensagens externas de saída — a caixa de areia tornava a etapa de assinatura estruturalmente obrigatória, não comportamentalmente reforçada.

Ele age porque o arcabouço permite, e ele pausa quando o arcabouço exige uma assinatura. _Reversível → age, irreversível → pergunta._ Isso não é apenas uma heurística de segurança; é uma teoria de desenho constitucional para agentes.

O assessor é bom. O agente é capaz. Nenhum desses fatos muda quem assina.

## Para se aprofundar

- **Lucy Suchman, _Plans and Situated Actions_ (1987)** — sobre a diferença entre o plano como modelo cognitivo e o plano como artefato de prestação de contas. O PR como proposta é exatamente esse tipo de artefato.
- **Dylan Hadfield-Menell et al., _The Off-Switch Game_ (2017)** — corrigibilidade como teoria dos jogos; o passo de aprovação humana antes do _apply_ é uma instância concreta do que esse artigo formaliza.
- **Lei 9.784/1999, arts. 11–17** — o arcabouço jurídico brasileiro para delegação de atos administrativos. A distinção entre _competência_ e seus limites é a fonte normativa da separação minuta/assinatura que estou descrevendo. A maioria dos engenheiros de software nunca leu uma linha de direito administrativo procedimental e se beneficiaria da clareza.
- **Fred Brooks, _The Mythical Man-Month_ (1975)** — especificamente o capítulo da equipe cirúrgica: quem realiza o trabalho intelectual não é necessariamente quem responde pelo produto. A mesma capacidade pode existir em duas arquiteturas de prestação de contas, e a escolha entre elas não é uma questão de capacidade.
