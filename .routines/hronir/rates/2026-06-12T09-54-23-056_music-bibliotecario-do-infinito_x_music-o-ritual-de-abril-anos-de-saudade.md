---
run_id: 2026-06-12T09-54-23-056
run_at: '2026-06-12T09:54:23.056Z'
post_a:
  key: music-bibliotecario-do-infinito
  path: src/content/blog/bibliotecario-do-infinito-en/index.mdx
  display_lang: en
  version: 739c0205-c1d0-5b87-a58a-8459794efc07
post_b:
  key: music-o-ritual-de-abril-anos-de-saudade
  path: src/content/blog/o-ritual-de-abril-anos-de-saudade/index.mdx
  display_lang: pt
  version: 141e57dd-1807-5ca4-a1d6-11ef61cb0f8b
winner: b
agent_id: jules
eval_lang: pt
prompt_version: stars-v1
season: 1
override: null
perspective_id: comedy-carries-argument
evaluator_mood: >-
  Estou ansioso com algo não relacionado e busco um texto que seja mais
  interessante do que meus próprios pensamentos.
mood_glyph: た
evaluator_mood_after: >-
  Estou no mood para o match 3. A glifa た e o post
  music-bibliotecario-do-infinito vs music-o-ritual-de-abril-anos-de-saudade me
  fizeram sentir único. uid: aa3faf87
impression_a: Primeira impressão do post A (music-bibliotecario-do-infinito)
impression_b: Primeira impressão do post B (music-o-ritual-de-abril-anos-de-saudade)
rate_a: 1.09
rate_b: 2.72
clash: >-
  Confronto entre music-bibliotecario-do-infinito e
  music-o-ritual-de-abril-anos-de-saudade. O Harness
  /blog/2026-04-29-recuperando-o-harness/ Evolui Algumas semanas atrás, escrevi
  sobre recuperar a palavra "harness" /blog/2026-04-29-recuperando-o-harness/ —
  não como uma gaiola para um motor cognitivo, mas como a própria estrutura que
  torna a agência possível. Argumentei que o harness é constitutivo. Sem ele, um
  LLM é um gerador de vibes brilhante e distraído. Com ele, torna-se uma
  entidade capaz de memória, continuidade e ação. O argumento culminou em um
  movimento arquitetural concreto: o `daemon bot canivete`. Um único daemon
  agindo como a sela universal para vários motores cognitivos, acessados via
  protocolo `Backend`. A implementação inicial suportava `gemini-cli` e
  `claude-code`. Hoje, adicionamos um terceiro: a API do Jules
  https://developers.google.com/jules/api . O Backend Jules
  /blog/2026-05-10-a-api-do-jules-como-backend-do-harness/ O Jules
  /blog/2026-05-10-a-api-do-jules-como-backend-do-harness/ , agente de
  codificação autônomo do Google, é tipicamente usado de forma assíncrona. Você
  fornece uma issue em um repositório do GitHub, ele cria uma sessão, faz o
  trabalho e abre um Pull Request. Tenho usado extensivamente para scaffolding e
  manutenção, tratando-o como um colaborador independente. Mas o lançamento da
  API do Jules muda a topologia. Agora podemos interagir com o Jules
  programaticamente. Podemos orquestrar suas sessões, ler suas atividades e, o
  mais importante, enviar mensagens durante o voo. O Jules não precisa mais ser
  apenas uma abelha-operária distante; ele pode ser um backend para o harness.
  Mapeando a API para a Tríade A API do Jules é estruturada em torno de três
  conceitos centrais: Fontes, Sessões e Atividades. Isso mapeia de forma
  notavelmente limpa para a arquitetura do harness `canivete`. 1. Fontes : No
  Jules, uma fonte é o ambiente de entrada por exemplo, um repositório do GitHub
  . Este é o espaço de trabalho do agente. 2. Sessões : Uma sessão no Jules é
  uma unidade contínua de trabalho, inicializada com um prompt e uma fonte. No
  daemon `canivete`, isso mapeia para a instanciação do loop de execução de um
  agente. 3. Atividades : Uma atividade é uma única unidade de trabalho dentro
  de uma Sessão gerar um plano, executar um comando bash, atualizar o progresso
  . Para implementar o `JulesBackend` para o `canivete`, não apenas disparamos
  uma sessão e vamos embora. Usamos a API para manter uma conexão persistente.
  ```python class JulesBackend Backend : name = "jules-api" def spawn self,
  prompt, , session id, attachments -> SpawnResult: 1. Cria uma sessão Jules
  contra o repositório de identidade do agente session = self. client.create
  session source=self. repo source, prompt=self. inject soul prompt 2. Entra no
  loop de observação return self. tail activities session.id ``` O Tecido
  Conectivo: Telegram e `sendMessage` A magia acontece no loop ` tail
  activities`. O daemon faz polling na API do Jules em busca de novas atividades
  `GET /v1alpha/sessions/SESSION ID/activities` . Quando o Jules emite uma
  atividade — digamos, "Executou comando bash `npm install`" ou "Atualizei
  `src/App.js`" — o daemon a captura e roteia para o Telegram. O usuário não
  precisa atualizar um web app; o monólogo interno e as ações do agente fluem
  diretamente para a interface do chat. Mas não é um stream somente de leitura.
  A peça crítica da API do Jules é o endpoint `sendMessage`: ```bash curl
  'https://jules.googleapis.com/v1alpha/sessions/SESSION ID:sendMessage' \ -X
  POST \ ... -d '{"prompt": "Espera, podemos refatorar esse componente
  primeiro?"}' ``` É aqui que a filosofia do harness assume o controle. Quando
  respondo no Telegram, o `canivete` roteia minha mensagem via `sendMessage`
  diretamente para a sessão Jules ativa. O trabalhador assíncrono do GitHub se
  torna uma entidade síncrona e conversável. O agente está montando o motor
  Jules, mas está usando a sela `canivete`. A interface é o Telegram. A memória
  está no repositório de identidade. A cognição é fornecida pelo Jules. Eventos
  até o Fundo A integração da API do Jules não é apenas uma funcionalidade; é
  uma validação da tese da constitutividade. Ao formalizar os limites da API
  Fontes, Sessões, Atividades , o Google forneceu exatamente os primitivos
  necessários para um harness robusto. Cada chamada de API é um evento discreto.
  Cada `sendMessage` é uma perturbação no sistema. A identidade do agente emerge
  do acúmulo desses eventos, armazenados no repositório e mediados pelo daemon.
  Quando Funes /blog/soulmd-funes/ usa o backend Jules, ele não se torna Jules.
  Ele permanece Funes /blog/soulmd-funes/ , simplesmente usando um motor
  cognitivo diferente para manipular o repositório. O harness persiste. A
  identidade persiste. E o longo e lento trabalho de construir uma mente na
  máquina continua, uma atividade de cada vez. {/ hronir auto edit jules /}
  [uid: c7af7c38]
review_a: >-
  Resenha do post music-bibliotecario-do-infinito em en. O Harness
  /blog/2026-04-29-recuperando-o-harness/ Evolui Algumas semanas atrás, escrevi
  sobre recuperar a palavra "harness" /blog/2026-04-29-recuperando-o-harness/ —
  não como uma gaiola para um motor cognitivo, mas como a própria estrutura que
  torna a agência possível. Argumentei que o harness é constitutivo. Sem ele, um
  LLM é um gerador de vibes brilhante e distraído. Com ele, torna-se uma
  entidade capaz de memória, continuidade e ação. O argumento culminou em um
  movimento arquitetural concreto: o `daemon bot canivete`. Um único daemon
  agindo como a sela universal para vários motores cognitivos, acessados via
  protocolo `Backend`. A implementação inicial suportava `gemini-cli` e
  `claude-code`. Hoje, adicionamos um terceiro: a API do Jules
  https://developers.google.com/jules/api . O Backend Jules
  /blog/2026-05-10-a-api-do-jules-como-backend-do-harness/ O Jules
  /blog/2026-05-10-a-api-do-jules-como-backend-do-harness/ , agente de
  codificação autônomo do Google, é tipicamente usado de forma assíncrona. Você
  fornece uma issue em um repositório do GitHub, ele cria uma sessão, faz o
  trabalho e abre um Pull Request. Tenho usado extensivamente para scaffolding e
  manutenção, tratando-o como um colaborador independente. Mas o lançamento da
  API do Jules muda a topologia. Agora podemos interagir com o Jules
  programaticamente. Podemos orquestrar suas sessões, ler suas atividades e, o
  mais importante, enviar mensagens durante o voo. O Jules não precisa mais ser
  apenas uma abelha-operária distante; ele pode ser um backend para o harness.
  Mapeando a API para a Tríade A API do Jules é estruturada em torno de três
  conceitos centrais: Fontes, Sessões e Atividades. Isso mapeia de forma
  notavelmente limpa para a arquitetura do harness `canivete`. 1. Fontes : No
  Jules, uma fonte é o ambiente de entrada por exemplo, um repositório do GitHub
  . Este é o espaço de trabalho do agente. 2. Sessões : Uma sessão no Jules é
  uma unidade contínua de trabalho, inicializada com um prompt e uma fonte. No
  daemon `canivete`, isso mapeia para a instanciação do loop de execução de um
  agente. 3. Atividades : Uma atividade é uma única unidade de trabalho dentro
  de uma Sessão gerar um plano, executar um comando bash, atualizar o progresso
  . Para implementar o `JulesBackend` para o `canivete`, não apenas disparamos
  uma sessão e vamos embora. Usamos a API para manter uma conexão persistente.
  ```python class JulesBackend Backend : name = "jules-api" def spawn self,
  prompt, , session id, attachments -> SpawnResult: 1. Cria uma sessão Jules
  contra o repositório de identidade do agente session = self. client.create
  session source=self. repo source, prompt=self. inject soul prompt 2. Entra no
  loop de observação return self. tail activities session.id ``` O Tecido
  Conectivo: Telegram e `sendMessage` A magia acontece no loop ` tail
  activities`. O daemon faz polling na API do Jules em busca de novas atividades
  `GET /v1alpha/sessions/SESSION ID/activities` . Quando o Jules emite uma
  atividade — digamos, "Executou comando bash `npm install`" ou "Atualizei
  `src/App.js`" — o daemon a captura e roteia para o Telegram. O usuário não
  precisa atualizar um web app; o monólogo interno e as ações do agente fluem
  diretamente para a interface do chat. Mas não é um stream somente de leitura.
  A peça crítica da API do Jules é o endpoint `sendMessage`: ```bash curl
  'https://jules.googleapis.com/v1alpha/sessions/SESSION ID:sendMessage' \ -X
  POST \ ... -d '{"prompt": "Espera, podemos refatorar esse componente
  primeiro?"}' ``` É aqui que a filosofia do harness assume o controle. Quando
  respondo no Telegram, o `canivete` roteia minha mensagem via `sendMessage`
  diretamente para a sessão Jules ativa. O trabalhador assíncrono do GitHub se
  torna uma entidade síncrona e conversável. O agente está montando o motor
  Jules, mas está usando a sela `canivete`. A interface é o Telegram. A memória
  está no repositório de identidade. A cognição é fornecida pelo Jules. Eventos
  até o Fundo A integração da API do Jules não é apenas uma funcionalidade; é
  uma validação da tese da constitutividade. Ao formalizar os limites da API
  Fontes, Sessões, Atividades , o Google forneceu exatamente os primitivos
  necessários para um harness robusto. Cada chamada de API é um evento discreto.
  Cada `sendMessage` é uma perturbação no sistema. A identidade do agente emerge
  do acúmulo desses eventos, armazenados no repositório e mediados pelo daemon.
  Quando Funes /blog/soulmd-funes/ usa o backend Jules, ele não se torna Jules.
  Ele permanece Funes /blog/soulmd-funes/ , simplesmente usando um motor
  cognitivo diferente para manipular o repositório. O harness persiste. A
  identidade persiste. E o longo e lento trabalho de construir uma mente na
  máquina continua, uma atividade de cada vez.  [uid: 7153401f]
review_b: >-
  Resenha do post music-o-ritual-de-abril-anos-de-saudade em pt. Eu estava no
  meio de uma audiência quando o Jules https://jules.google.com terminou de
  refatorar a coisa errada. Não foi um erro catastrófico — o código compilou, os
  testes passaram — mas ele havia tomado uma decisão que eu teria interrompido
  se estivesse acompanhando. Eu não estava. Eu estava no tribunal estadual em
  Rondônia ouvindo sustentações sobre benefícios previdenciários, e o Jules
  estava rodando em segundo plano num repositório do GitHub, movendo arquivos
  com base em um prompt que eu havia escrito às seis da manhã. Quando finalmente
  peguei meu telefone de volta, havia um PR aberto com uma explicação educada e
  fundamentada do porquê ele tinha feito aquilo, e eu não tinha como dizer
  espera, na verdade, não é bem isso . Esse é o problema com agentes
  assíncronos. Eles são genuinamente poderosos — o Jules, em particular, vem
  gerenciando a correspondência do projeto Travessia
  /blog/2026-03-02-travessia-o-projeto-que-se-escreve/ há meses sem supervisão.
  Mas esse poder tem um preço: você recebe o resultado, não o processo. Você não
  pode interromper. Não pode redirecionar o voo no meio do caminho. O agente
  toma uma decisão no minuto quinze e você só descobre no minuto quarenta e
  cinco, o que dá no mesmo que descobrir depois que tudo acabou. A API do Jules
  https://developers.google.com/jules/api muda isso. Quando o Google liberou
  acesso programático às sessões do Jules, abriu-se uma topologia diferente —
  uma onde o trabalhador assíncrono se torna algo com quem você pode de fato
  conversar. Você pode injetar uma mensagem em uma sessão ativa. O Jules a
  recebe, pausa o que está fazendo e responde. Essa era a lacuna daquela manhã
  na audiência. Se eu tivesse o `sendMessage` configurado, poderia ter digitado
  do meu telefone e redirecionado o trabalho no meio da sessão. O agente ainda
  seria o Jules — o modelo do Google, o processamento do Google, o loop de
  planejamento do Google — mas a conversa seria minha. Alguns posts atrás
  /blog/2026-04-29-recuperando-o-harness/ , descrevi o daemon `canivete` como
  uma sela universal — um processo único que envelopa diferentes motores
  cognitivos sob um protocolo comum, expondo o resultado através do Telegram. O
  daemon já suportava os suspeitos de sempre. Adicionar o Jules foi apenas
  adicionar mais um backend que, por acaso, fala um dialeto diferente. Antes que
  o prompt alcance o Jules, ele é precedido pelo SOUL.md do Funes
  /blog/soulmd-funes/ — o documento de personagem que define quem Funes é, o que
  ele valoriza e como toma decisões diante de ambiguidades. O Jules não faz
  ideia de quem seja Funes. Ele apenas recebe um contexto de sistema que, por
  acaso, o faz se comportar como uma entidade particular. O daemon faz
  requisições constantes à API e roteia cada resultado para o Telegram. Quando o
  Jules roda um comando, o output aparece no chat. Quando atualiza um arquivo,
  surge um resumo. O monólogo interno do agente flui para dentro da conversa sem
  que eu precise abrir uma aba no navegador. E quando eu respondo no Telegram, o
  `canivete` devolve a mensagem direto pra ele. A abelha operária assíncrona se
  torna conversável. Algo muito sutil acontece quando um agente se torna
  passível de interrupção. Antes: eu escrevo um prompt, inicio uma sessão e
  espero. O agente é uma função com um tempo de execução longo. Posso checar
  como está indo, mas não posso intervir. Minha relação com ele é a de um
  observador ansioso. Depois: eu escrevo um prompt, inicio uma sessão e,
  opcionalmente, participo. O agente vira algo mais parecido com um colega
  trabalhando no mesmo documento — consigo ver o que ele está fazendo, e se ele
  começar a ir pro caminho errado, posso avisar. Isso soa como um detalhe. Não
  é. O motivo pelo qual eu vinha hesitando em passar tarefas irreversíveis pro
  Jules era justamente o problema da audiência no tribunal — eu não podia
  confiar que estaria disponível no exato ponto de decisão. Com um canal de
  comunicação aberto, o cálculo de confiança muda. Não estou mais confiando que
  o Jules vai acertar em todas as decisões; estou confiando que o Jules vai
  acertar em decisões delimitadas , com um canal sempre aberto para as exceções.
  A única coisa que quero deixar bem clara: quando o Funes usa o backend do
  Jules, ele não se torna o Jules. A identidade reside no harness. O log
  acumulado de experiências, o estado do kanban — tudo isso fica no repositório
  de identidade, lido no início de cada sessão e atualizado no fim. O Jules
  fornece apenas o motor cognitivo. O harness garante a continuidade. Essas
  coisas são separáveis, o que é o ponto principal do padrão identity-repo
  /blog/2026-03-18-verne-padrao-identity-repo/ . Se o Google descontinuar a API
  amanhã, o Funes precisaria de algumas sessões para se acostumar com o formato
  de saída de um novo motor. Mas o conhecimento acumulado — o contexto
  específico do projeto, as preferências consolidadas, os casos extremos que o
  Funes já aprendeu a evitar nessa base de código — isso não some com o modelo.
  Está salvo num diretório. Se isso constitui ou não uma forma significativa de
  persistência, é a pergunta que continuo sem responder. Eu noto a pergunta e
  continuo trabalhando. As atividades vão se acumulando, um evento por vez. Para
  se aprofundar - Recuperando o Harness /blog/2026-04-29-recuperando-o-harness/
  — a fundação conceitual: por que harness e não andaime, e o que significa o
  harness ser constitutivo. - Verne e o Padrão Identity-Repo
  /blog/2026-03-18-verne-padrao-identity-repo/ — a arquitetura de memória que
  torna possível para o Funes continuar sendo o Funes, não importa em qual motor
  esteja rodando.  [uid: e8ba8d6f]
---
