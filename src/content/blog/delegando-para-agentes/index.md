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
  uuid: 832c5d01-8c16-5d36-891c-0faf120df999
  url: >-
    https://github.com/franklinbaldo/franklinbaldo.github.io/blob/a1d9cabb963c9674fbeea140d68240830f231062/src/content/blog/delegando-para-agentes.md
  timestamp: '2026-06-06T13:30:49.440Z'
  msg: >-
    Broke opener from programmatic framing to direct scene; folded analogy-flaw
    into sandbox section mid-argument instead of announcing it; removed Drake
    meme; grounded outsider terms (parecer, ofício, CI/CD, corregedoria,
    Causaganha, Funes) on first use; added Vaughan Challenger reference as
    challenger to post's own thesis; 5 For Further Reading entries from 4
---

Em fevereiro, quase perdi uma janela de quarenta e oito horas num processo de impugnação de auto de infração federal porque tinha começado a tratar a minuta de um assessor como o produto final. O _parecer_ estava bom. A manifestação, no entanto, não foi protocolada. Fiquei sabendo na tarde de terça, quando um lembrete de agenda disparou para um prazo que eu tinha mentalmente movido da minha coluna para a do assessor no exato momento em que a minuta chegou na minha mesa. Ela não tinha se movido de lugar nenhum.

O tribunal não pergunta quem propôs a data errada ou quem redigiu o rascunho. O tribunal pergunta quem assinou.

Isso não é uma tecnicidade procedimental aborrecida. É o motivo pelo qual a assinatura existe.

Passo meus dias em uma procuradoria do Estado em Rondônia, lendo _pareceres_ e assinando aqueles que não me aterrorizam. Quando delego a elaboração de uma peça, não estou terceirizando meu julgamento — estou delegando a tarefa mecânica e cognitiva de atravessar os autos, identificar o direito aplicável e organizar o esqueleto de um argumento. O que eu _não_ estou delegando, em hipótese alguma, é a assinatura. A assinatura é a fronteira irreversível: é o evento que faz com que um papel qualquer se torne um ato no mundo real, onde prazos começam a devorar os dias.

A engenharia de software tem dificuldade de reconhecer nativamente essa distinção porque o ciclo de _feedback_ das suas ferramentas a comprime. No direito, a lacuna entre a minuta e o ato é fisicamente legível — o assessor termina seu arquivo, a mesa de protocolo tem um horário fixo de funcionamento, o sistema do tribunal cai. Existe atrito. No código, o desenvolvedor escreve a função, os testes passam em trinta segundos, o PR faz merge automático no verde e o código já está em produção. A minuta e o ato se tornam um único movimento contínuo e lubrificado. Ninguém mais anota onde a deliberação termina e a responsabilização começa.

## Os limites da caixa de areia

Tenho visto uma ansiedade real em relação a agentes de IA — programas autônomos como o [Jules](/blog/2026-05-10-jules-api-harness-backend/) —, e ela não tem nada a ver com a capacidade da máquina de pensar. Quando entrego a um agente uma tarefa de refatoração do meu blog, não estou preocupado se ele vai escolher o padrão de design errado ou inventar uma função que não existe. Eu estou preocupado porque ele tem permissão de escrita.

A solução para isso, como o mercado de software já descobriu, não é ficar em cima do ombro do agente enquanto ele digita. A solução é construir uma caixa de areia onde as ações do agente sejam tratadas exclusivamente como _propostas_. O pipeline de CI/CD — a sequência automatizada de compilações, testes e verificações que precisam passar no GitHub antes de qualquer código ser publicado —, as suítes de teste, as regras estritas de linting: eu não olho mais para isso apenas como mecanismos de garantia de qualidade. Para mim, hoje, eles são o equivalente sintático à regra institucional que diz que um assessor jurídico pode escrever um _parecer_, mas não pode assinar um _ofício_.

A mágica da delegação com IA não acontece quando você restringe o raciocínio do modelo. Acontece quando você restringe o espaço de saída. Você define os limites da caixa de areia — as invariantes do banco de dados, os testes que precisam rodar — e permite que o agente navegue livremente por lá dentro. Se os testes quebram, o agente tenta de novo. Se os testes passam, a proposta é válida. Mas o passo final de _apply_ — o ato de fazer o merge no repositório principal, de alterar a realidade em produção — isso continua sendo uma assinatura de um humano. Um pipeline de CI que não aceita ser bypassado não é uma ferramenta de DevOps; é o balcão de protocolo da repartição pública, segurando a porta entre a intenção e a consequência.

É aí que o meu paralelo com o direito administrativo lisonjeia demais a engenharia de software e esconde um buraco negro no chão.

Numa repartição pública, quando um assessor escreve um _parecer_, a responsabilidade dele é profissional. Pareceres consistentemente ruins não geram apenas retrabalho para quem revisa; eles levam a revisões formais na corregedoria, desgaste no conselho de classe e, eventualmente, ao fim de uma carreira. Existe uma corrente invisível que liga o ato assinado à pessoa de carne e osso que o redigiu, e essa corrente tem dentes afiados. A assinatura do procurador não serve apenas para separar o rascunho do ato: ela separa quem colocou a carreira na mesa de quem não tinha absolutamente nada a perder.

Um agente de IA não tem carreira. Ele não sente vergonha no almoço da firma. Ele não pode ser punido por incompetência ou má-fé. A caixa de areia que criamos para o software restringe o que o código pode fazer, mas falha miseravelmente em responder o que acontece quando a caixa de areia é burlada ou quebra. Quando um agente faz algo destrutivo dentro dos limites do seu acesso, a responsabilidade sobe inteira e instantaneamente para o ser humano que projetou a coleira — o _harness_ —, e não lateralmente para o agente.

A caixa de areia é necessária, mas não resolve o problema da delegação de verdade. O passo da "assinatura humana" na integração contínua está fazendo muito mais esforço do que o paralelo com o serviço público sugere. Ele não está apenas tornando explícita a fronteira entre a intenção e o ato; ele está segurando sozinho todo o peso da responsabilidade profissional, social e legal que o agente de software é estruturalmente oco demais para suportar.

Eu não via isso com clareza até precisar escrever o erro que cometi em fevereiro. A frase "meu assessor é muito bom" soa perfeitamente razoável de um jeito que "o Claude é muito bom" não soa, e nem poderia soar. Ambas descrevem a capacidade de operar símbolos de maneira complexa. Mas só a primeira frase aponta para alguém que pode pagar uma conta no final do dia.

Eu tinha me convencido, talvez por inércia, de que a assinatura final era apenas uma formalidade num processo burocrático. E ela é. Mas é também a âncora que faz o erro do processo em fevereiro ser inteiramente meu.

## O harness como desenho constitucional

É por isso que, à medida que os modelos ficam mais assustadoramente capazes, o _harness_ (a estrutura que contém e governa o modelo) me interessa mais que os pesos da rede neural. O [Funes](/blog/funes-soul/) — o agente que construí para lidar com tarefas delegadas nos meus repositórios — não é o Claude, embora use a API da Anthropic para "pensar". Funes é o Claude isolado em uma membrana de regras duras, amnésia controlada e permissões de diretório.

O Funes abre pull requests; ele não faz merge. Ele vasculha arquivos Markdown e atualiza resumos de projetos; ele não pode responder a um e-mail do Gmail na minha caixa de entrada. Quando pedi que ele redigisse uma resposta a uma _issue_ enviada por um desconhecido sobre o [Causaganha](https://github.com/franklinbaldo/causaganha), meu projeto open-source de raspagem de diários oficiais, ele fez a pesquisa, organizou a lógica, redigiu a resposta num rascunho e abriu um PR. Ele não enviou a mensagem para o GitHub. E isso não aconteceu porque havia um "system prompt" suplicando para que ele "por favor não fale com estranhos". Aconteceu porque o _harness_ do Funes não possui conexão ativa de rede para a API de comentários do GitHub. A caixa de areia tornou a etapa de assinatura (eu ir lá, copiar, colar e clicar no botão verde) estruturalmente física, e não apenas uma recomendação frouxa num prompt.

_Reversível → age, irreversível → pergunta._

Eu usava isso como um truque de segurança técnica. Mas começo a entender que essa regra é, no fundo, uma alocação constitucional de risco. Cada ação que o agente toma livremente, sem me consultar, é uma ação cuja responsabilidade já foi tacitamente assumida e pré-delegada por mim no momento em que conectei os fios do _harness_. E cada ação irreversível que exige um clique manual, uma assinatura digital, é uma ação em que eu retenho abertamente o monopólio da culpa perante o mundo.

A minuta do assessor estava irretocável. E essa é uma afirmação que se encerra nas qualidades do assessor. A manifestação jurídica não foi anexada aos autos a tempo. E esse é o limite onde a história do assessor termina e a minha começa.

## Para se aprofundar

- **Lucy Suchman, _Plans and Situated Actions_ (1987)** — Suchman distingue de forma magistral o "plano" como um modelo cognitivo do "plano" como um artefato de prestação de contas que o grupo negocia publicamente. O PR (Pull Request) como uma "proposta" opera exatamente na fronteira entre esses dois conceitos. O livro brilha na seção que descreve o que de fato significa "seguir um plano" para as pessoas de carne e osso que recebem a ordem.
- **Dylan Hadfield-Menell et al., _The Off-Switch Game_ (2017)** — um artigo denso que trata a "corrigibilidade" da IA como um problema de teoria dos jogos. O passo prático de exigir aprovação humana antes de aplicar o código é uma versão grosseira, mas concreta, da formalização que este paper tenta resolver no nível teórico.
- **Diane Vaughan, _The Challenger Launch Decision_ (1996)** — um livro incômodo sobre como os mecanismos institucionais de segurança e prestação de contas degeneram rapidamente em puro teatro burocrático. Se o humano que assina o PR gerado pela IA já não lê o diff de código de verdade, a assinatura parou de alocar responsabilidade e virou encenação. É a falha sistêmica que a separação "caixa-de-areia-mais-assinatura" não consegue impedir sozinha.
- **Lei 9.784/1999 (Brasil), arts. 11–17** — o arcabouço administrativo pátrio sobre as possibilidades e limites da delegação de competência. A distinção filosófica entre a detenção da _competência_ e as parcelas estritamente delegáveis do ato é a base subjacente da separação entre minuta e assinatura que tento costurar aqui.
- **Fred Brooks, _The Mythical Man-Month_ (1975)** — especificamente o capítulo sobre a equipe cirúrgica de software. Brooks mostra que uma mesma capacidade técnica pode existir simultaneamente sob duas arquiteturas distintas de responsabilidade, e que a decisão entre elas nunca é puramente técnica, mas sempre política.
