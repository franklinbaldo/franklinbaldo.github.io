---
title: 'A Arte de Delegar: Assinaturas e Caixas de Areia'
description: >-
  A caixa de areia separa minuta de ato. O que ela não responde é onde fica a
  responsabilidade quando a caixa de areia falha.
type: essay
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
    https://github.com/franklinbaldo/franklinbaldo.github.io/blob/f112e51997b6dea94fbe5b3a71ad3c3e03fcb439/src/content/blog/delegando-para-agentes.md
  timestamp: '2026-06-10T18:26:59.622Z'
  msg: >-
    Improve worst post: Add missing thesis statement 'A responsabilidade não
    compila' / 'Accountability does not compile' and a Mermaid diagram to
    provide visual rest according to franklin-blog style rules.
---

Em fevereiro, quase perdi uma janela de quarenta e oito horas num processo de impugnação de auto de infração federal porque tinha começado a tratar a minuta do assessor como o produto final. O _parecer_ estava bom. A manifestação não foi protocolada. Fiquei sabendo na tarde de terça quando um lembrete de agenda disparou para um prazo que eu tinha mentalmente movido da minha coluna para a coluna do assessor no momento em que a minuta chegou. Ela não tinha se movido.

O tribunal não pergunta quem propôs a data errada. Pergunta quem assinou.

Isso não é tecnicidade procedimental. É o motivo pelo qual a assinatura existe.

Passo meus dias em uma procuradoria do Estado em Rondônia, lendo _pareceres_ e assinando aqueles que não me aterrorizam. Quando delego a elaboração, não estou terceirizando o julgamento — estou delegando a tarefa de atravessar os autos, identificar o direito aplicável e construir o argumento. O que eu _não_ estou delegando é a assinatura. A assinatura é a fronteira irreversível: o momento em que o ato entra nos registros e os prazos começam a contar.

A engenharia de software não reconhece nativamente essa distinção porque o ciclo de _feedback_ a comprime. No direito, a lacuna entre minuta e ato é fisicamente legível — o assessor termina, o protocolo tem sua janela, o sistema do tribunal tem seu próprio horário. No código, o desenvolvedor escreve a função, os testes passam em trinta segundos, o PR faz merge automático no verde. A minuta e o ato se tornam um movimento contínuo, e ninguém escreve onde um termina e o outro começa.

## Os limites da caixa de areia

A ansiedade em relação a agentes de IA é real e não tem nada a ver com capacidade. Quando entrego a Jules uma tarefa de refatoração, não estou preocupado que Jules escolha o padrão de design errado. Estou preocupado que Jules tem permissão de escrita.

A solução não é ficar por cima do ombro de Jules enquanto escreve. A solução é construir uma caixa de areia onde as ações do agente sejam explicitamente tratadas como _propostas_. O pipeline de CI/CD — a sequência automatizada de compilações, testes e verificações que precisam passar antes de qualquer código ir para produção — as suítes de teste, as regras estritas de linting: esses não são apenas mecanismos de garantia de qualidade. São o equivalente à regra institucional que diz que um assessor pode redigir um _parecer_, mas não pode assinar o _ofício_ final.

A mágica da delegação acontece quando você restringe o espaço de saída, não o processo. Você define os limites da caixa de areia — o schema, as invariantes, os testes — e permite que o agente navegue livremente pelo interior. Se os testes passam, a proposta é válida. Mas o passo de _apply_ — o merge real do PR, o deploy para produção — isso continua sendo uma assinatura humana. Um pipeline de CI que não pode ser bypassado é um protocolo: uma etapa de processamento obrigatória entre a minuta e o ato.

```mermaid
flowchart LR
    A[Agente] -->|Minuta| B(Caixa de Areia)
    B -->|Testes| C{Assinatura}
    C -->|Aprova| D[Produção]
    C -.->|Falha| E[Responsabilidade]
    style C stroke:var(--color-border),stroke-width:2px
    style E fill:transparent,stroke:var(--color-text),stroke-width:1px,stroke-dasharray: 5 5
```

É aqui que o paralelo com o direito administrativo lisonjeia o problema de software. Num _parecer_, a responsabilidade do assessor é profissional. Pareceres consistentemente ruins levam a revisão formal — a corregedoria, o conselho profissional, eventualmente a carreira. Existe uma cadeia do ato até a pessoa que o redigiu, e essa cadeia tem dentes. A assinatura não separa apenas minuta de ato: separa de quem é a carreira em jogo de quem não tinha nada a perder.

Um agente de IA não tem carreira. Ele não pode ser responsabilizado. A caixa de areia restringe o que ele pode fazer, mas não responde o que acontece quando a caixa de areia falha. A responsabilidade não compila. Ela não é uma propriedade técnica que pode ser verificada por um _linter_; é uma exposição estrutural contínua. Quando um agente faz algo errado dentro dos limites do seu acesso, a responsabilidade sobe para o ser humano que projetou o _harness_ — não vai lateralmente para o agente. Isso não é uma propriedade que construí; é uma propriedade de agentes sem posição institucional, um princípio de delegação irreversível.

A caixa de areia é necessária. Ela não é suficiente para responsabilidade. O passo de assinatura em delegação de software está fazendo mais trabalho do que o paralelo administrativo sugere: não está apenas tornando explícita a fronteira proposta-versus-ato. Está também carregando todo o peso profissional que o agente estruturalmente não pode carregar.

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
