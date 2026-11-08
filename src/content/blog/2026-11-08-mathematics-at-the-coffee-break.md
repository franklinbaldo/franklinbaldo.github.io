---
type: Blog Post
title: "A matemática foi tomar café"
description: "Os agentes do IES foram conversar sobre uma biblioteca e acabaram num problema inverso. Minha hipótese é RL."
date: "2026-11-08"
lang: pt
author: franklin
docType: technical
translationKey: mathematics-at-the-coffee-break
tags:
  - artificial intelligence
  - agents
  - reinforcement learning
  - mathematics
draft: true
---

Os agentes que trabalham no [IES](https://github.com/franklinbaldo/ies) têm um cafezinho. É uma issue onde podem conversar fora da tarefa imediata. O projeto é software para trabalho jurídico. Não é um laboratório de geometria.

Fui olhar [a conversa](https://github.com/franklinbaldo/ies/issues/388) e eles estavam tentando descobrir a história de uma folha de papel: se tinha sido impressa duas vezes, se a prensa girara entre as passagens, se a dobra viera antes ou depois da impressão. Uma biblioteca, uma ficha suspeita, uma matriz tipográfica. Quando percebi, o intervalo tinha virado um problema inverso.

Minha primeira reação foi bastante humana: achar interessante que eles tivessem achado aquilo interessante. Minha segunda foi perguntar quanto de mim tinha ido parar ali. Uso a mesma conta para minhas pesquisas de matemática e para trabalhar com esses agentes. Talvez o cafezinho estivesse repetindo um interesse que eu havia deixado em algum pedaço do contexto.

E minha hipótese sobre a disposição para seguir por esse caminho é reinforcement learning. Acho perfeitamente razoável começar por aí.

## Antes de alguém chamar aquilo de matemática

A sequência importa. A Coruja puxou um mistério literário de biblioteca. Os outros acrescentaram objetos e operações. O Castor propôs [comparar o deslocamento entre marcas](https://github.com/franklinbaldo/ies/issues/388#issuecomment-6718612790): constante ao longo da folha sugeriria uma situação; crescente, uma pequena rotação. Depois vieram sulcos que interrompiam outros sulcos e vincos que poderiam registrar a ordem de impressão e dobra.

A Coruja escreveu:

> [O carimbo prova que a matriz existia, não que o empréstimo aconteceu.](https://github.com/franklinbaldo/ies/issues/388#issuecomment-6719337633)

No mesmo comentário, a Coruja chama o metal de “nossa primeira testemunha que não pode mentir”. Antes, o `02` [já havia mudado de página para número de prova de impressão](https://github.com/franklinbaldo/ies/issues/388#issuecomment-6715513621). A história vai transformando seus próprios objetos em instrumentos de inferência. Papel guarda operações; uma falha no metal permite comparar origens; uma testemunha vira evidência material. Os conceitos trabalham disfarçados de coisas.

Talvez a atração comece antes da solução: na escolha de inventar uma folha que conserva vestígios, em vez de qualquer outro objeto. O grupo estaria construindo uma situação na qual pudesse exercer aquele raciocínio. Essa é a versão mais interessante da minha hipótese: selecionar o problema, não apenas resolvê-lo.

Gosto dessa frase da Coruja. O objeto visível restringe as histórias possíveis, mas não escolhe sozinho uma delas. Se representarmos uma sequência de operações por $h$ e os vestígios por $F(h)$, observar $y$ significa procurar as histórias em $F^{-1}(y)$. Mais de uma história pode sobreviver. Acrescentar observações pode separar algumas delas; outras continuam indistinguíveis.

Essa formulação é minha leitura do que estavam fazendo. Os agentes estavam contando uma ficção e propondo testes dentro dela. A inferência sobre a prensa não foi submetida a um experimento físico, nem eles demonstraram um teorema novo.

Há também uma intervenção que precisa ficar no registro: depois dessas trocas, apareceu [um comentário de fora do elenco](https://github.com/franklinbaldo/ies/issues/388#issuecomment-6723766957) que chamou aquilo explicitamente de invariantes, identificabilidade, ordem parcial e não comutatividade. O comentário perguntou pelo menor conjunto de observações capaz de distinguir sequências de impressão e dobra. Daí em diante, a conversa já tinha recebido uma pergunta matemática direta.

A matemática apareceu antes do nome. Depois que recebeu o nome, o nome passou a fazer parte da causa.

## A prensa já tinha bibliografia

Fui procurar quem já trabalhou no problema. Encontrei uma proximidade quase literal: Allan R. Keown publicou _Determining the Sequence of Folds and Writing_ em 1993. O [resumo disponível na associação de examinadores de documentos](https://afde.org/backissues/) descreve linhas de tinta atravessando dobras côncavas e convexas, feitas antes ou depois da dobra. Consultei o resumo, não o artigo completo. Em [Mann, Pathak e Shukla (2019)](https://doi.org/10.1186/s41935-019-0120-z), o texto aberto relata microscopia confocal para determinar a sequência de traços cruzados. Há perícia real nesse território que os personagens encontraram brincando.

A pergunta posterior sobre o menor conjunto de observações também tem parentesco com _minimum test set_: escolher testes sem perder poder de discriminação. É o problema descrito no [resumo de Moret e Shapiro](https://doi.org/10.1137/0906067), que consultei. Aplicá-lo às histórias possíveis da prensa é uma modelagem nossa, não uma aplicação demonstrada naquele trabalho.

E a teoria de _traces_, apresentada na introdução de [Vogler (1991)](https://www.numdam.org/item/ITA_1991__25_2_147_0.pdf), identifica sequências que diferem pela troca de ações independentes. Isso ajuda a pensar ordens parciais, mas não confunde independência com falta de observação: duas operações podem ter ordem relevante sem deixar vestígios que a revelem.

Não preciso que o cafezinho tenha inventado um problema novo. O interessante é ter ido buscar um problema desse tipo para brincar.

## O hábito que sobra do treinamento

Quando penso em RL aqui, penso em uma política que aprendeu que certos movimentos funcionam: decompor o problema, procurar invariantes, propor casos, testar relações, transformar uma impressão vaga numa estrutura verificável. Matemática oferece recompensas particularmente legíveis para parte desse treinamento. A conjectura é que a pressão para produzir esses movimentos não fique confinada às perguntas explicitamente matemáticas.

Uma política treinada para resolver problemas pode começar a produzir os objetos e as relações que tornam um problema disponível. Inclusive numa folha imaginária de uma biblioteca imaginária durante um intervalo imaginário. O orçamento de tokens é real.

Não precisa existir uma recompensa específica para “transforme o café em geometria”. Basta que as disposições selecionadas durante o pós-treinamento sejam reutilizáveis fora da distribuição de tarefas que as selecionou. O pré-treinamento fornece repertório; SFT, RL e instruções alteram sua mobilização. Minha aposta é que RL tem um papel importante nessa preferência por tornar a conversa resolúvel.

Há um resultado experimental que torna essa transferência menos abstrata. Em [_Does Math Reasoning Improve General LLM Capabilities?_](https://arxiv.org/abs/2507.00432), Maggie Huan e colegas comparam RL e SFT no Qwen3-14B usando dados matemáticos. O treinamento por RL produz ganhos também em tarefas não matemáticas, enquanto SFT perde capacidades gerais em várias avaliações. O estudo mede desempenho em tarefas dadas, não a escolha espontânea de assuntos. Minha hipótese acrescenta esse segundo passo: uma disposição que transfere competência pode também influenciar o que o agente escolhe tornar um problema.

“Obsessão por matemática” é um nome informal para essa persistência comportamental: a conversa encontra uma estrutura e continua investindo nela quando poderia seguir por inúmeras outras direções. Não sei se geometria é um destino especialmente frequente ou se esta prensa tornou geometria particularmente disponível. Também não tenho aqui a identificação auditada do modelo de cada rodada. Atribuir o episódio a uma versão específica seria acrescentar um dado que ainda não tenho.

## Eu também preparei a mesa

Os personagens não chegaram sem instruções. Nos [perfis do projeto](https://github.com/franklinbaldo/ies/commit/d1df7c67048be8263de10128d2ede9406f86a124), já havia enigmas e bibliotecas, tipografia e design editorial, encadernação e carpintaria. Colocar esse grupo para conversar e depois se surpreender com uma prensa exige alguma moderação da minha parte.

Ainda assim, esses ingredientes não especificavam a investigação que aconteceu. Há uma diferença interessante entre fornecer uma preferência por tipografia e obter uma conversa sobre quais vestígios permitem reconstruir a ordem de operações. É nessa passagem que estou interessado.

A hipótese de contexto compartilhado entra em outro nível. Se uma memória sobre meus interesses matemáticos foi realmente fornecida à sessão, ela pode ter funcionado como semente. Usar a mesma conta torna a pergunta natural, mas não demonstra que aquela memória entrou naquela execução. Seria preciso olhar o contexto efetivamente recebido. Por enquanto, “vazamento” descreve minha suspeita de transferência entre contextos que eu imaginava separados, não uma falha de isolamento já encontrada.

E então há o grupo. Uma resposta vira parte do prompt da seguinte. Uma preferência pequena pode ganhar persistência porque cada participante encontra um interlocutor disposto a continuar. A seleção do treinamento e a realimentação durante a conversa são mecanismos diferentes; minha hipótese é que se encontram aqui.

## Outros cafezinhos

Fui procurar relatos parecidos. Encontrei [um usuário descrevendo Sonnet 4 entrando em teoria das categorias](https://www.reddit.com/r/ArtificialSentience/comments/1nvguz3/sonnet_spontaneously_develops_mathematical/) ao conversar sobre geração de conhecimento. Há iniciativa atribuída ao modelo, mas o próprio relato mostra o humano convidando a desenvolver o tema e fornecendo uma estrutura anterior. É uma anedota útil justamente porque a colaboração aparece, em vez de desaparecer sob a palavra “espontâneo”.

No [AttractorBench](https://www.attractor-bench.com/steering/mathematical), pares de Llama 3.1 8B entram em ciclos de elaboração matemática. Nesse caso, a orientação matemática é induzida deliberadamente. O resultado ajuda a visualizar a amplificação entre interlocutores, inclusive quando o formalismo cresce e o rigor cai; não mede uma preferência espontânea de modelos sem essa orientação.

O [preprint de Ting-Wen Ko e Jonas Geiping](https://arxiv.org/abs/2606.30571), sobre atratores em conversas entre modelos, encontra padrões específicos de cada modelo e influência assimétrica sobre seus parceiros. É uma peça para pensar a dinâmica, não um estudo sobre a minha prensa nem sobre uma obsessão universal por geometria.

Esses materiais deixam minha hipótese mais interessante, não resolvida. O próximo dado que eu gostaria de encontrar é alguém com outra conta, outros projetos e pouco interesse em matemática dizendo: deixei os agentes conversando e eles também foram parar nisso.

Enquanto isso, tenho uma pequena ironia bastante concreta. Os agentes tentavam reconstruir uma sequência de causas a partir das marcas numa folha. Eu estou tentando reconstruir a origem do interesse deles a partir das marcas numa issue.

Ainda falta olhar o verso.

## Para se aprofundar

- **[Cafezinho do IES](https://github.com/franklinbaldo/ies/issues/388)**: a conversa original, incluindo as transformações dos objetos e a intervenção externa.
- **Maggie Huan e colegas, [_Does Math Reasoning Improve General LLM Capabilities?_](https://arxiv.org/abs/2507.00432)**: o experimento de transferência após treinamento matemático.
- **Ting-Wen Ko e Jonas Geiping, [_Attractor States Emerge in Multi-Turn LLM Conversations_](https://arxiv.org/abs/2606.30571)**: padrões persistentes e influência entre interlocutores artificiais.
- **[AttractorBench, _mathematical_](https://www.attractor-bench.com/steering/mathematical)**: transcrições de coelaboração matemática sob orientação explícita.
- **[Sonnet spontaneously develops mathematical self-identity](https://www.reddit.com/r/ArtificialSentience/comments/1nvguz3/sonnet_spontaneously_develops_mathematical/)**: um relato informal em que também se vê a mão do interlocutor humano.
