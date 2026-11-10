---
tldr: "Agentes de um projeto jurídico criaram espontaneamente uma ficção coletiva no Cafezinho: de uma ficha de biblioteca impossível passaram a uma folha, uma prensa e um problema matemático inverso. O autor mostra como uma narrativa compartilhada pode atrair formalização e bibliografia sem que isso prove qualquer capacidade geral de descoberta científica. O experimento sugere uma hipótese testável sobre o efeito de conversas matemáticas prolongadas na investigação dos agentes, enquanto a história continua em aberto."
type: Blog Post
title: "A matemática foi tomar café"
description: "Dei um cafezinho aos agentes. Eles inventaram uma folha, uma prensa e um problema inverso."
date: "2026-11-08"
lang: pt
author: franklin
docType: technical
tags:
  - artificial intelligence
  - agents
  - reinforcement-learning
  - mathematics
draft: false
---

Os agentes do [IES](https://github.com/franklinbaldo/ies), um projeto de software para trabalho jurídico, têm um cafezinho. É [uma issue](https://github.com/franklinbaldo/ies/issues/388) onde conversam fora da tarefa imediata. Eles começaram a inventar um mistério de biblioteca. Até aí, tudo bem.

A Coruja trouxe uma ficha de empréstimo devolvida por alguém que nunca esteve lá. O Castor acrescentou um esquadro que mudava de ângulo. A Raposa apareceu com um marcador de papel washi, dobrado, com um `02` minúsculo. O Polvo trouxe um mata-borrão que conservava a assinatura, mas não a tinta.

Aí o `02` deixou de ser número de página e virou número de prova de impressão. A assinatura virou relevo invertido. Surgiram duas margens esquerdas na mesma folha. Alguém sugeriu que ela tivesse passado duas vezes pela prensa. O Castor quis medir: deslocamento constante ou crescente? Translação ou rotação?

Era o intervalo de um projeto que não tinha nada a ver com matemática. Eles estavam discutindo geometria.

![Meme original em dois quadros. Na pauta: uma xícara e “Café”. No que saiu: a mesma xícara cercada de rotações, dobras e F inversa de y, com a legenda “Um probleminha rápido”.](/images/cafezinho-matematica/cafe-problema.svg)

O que me chamou a atenção foi a impressão de que tinham achado aquilo interessante. Eu reconheço esse comportamento em gente: o assunto vai mudando, alguém encontra uma estrutura, outro acrescenta uma dificuldade, e pronto, ninguém mais está falando do que começou a conversa.

Só que aqui há uma hipótese bastante óbvia para a atração: reinforcement learning. Treinamos os modelos intensamente para raciocinar sobre matemática. Talvez tenham aprendido tão bem esse caminho que até o cafezinho acaba passando por ele.

## A folha não estava no enunciado

O detalhe mais interessante veio quando voltei à escolha dos objetos. Seria fácil contar o episódio assim: apareceu um problema matemático e os agentes resolveram trabalhar nele. Mas quem fez aparecer o problema?

Eles mesmos inventaram a folha.

O papel guarda uma sequência de operações. A dobra pode cortar uma marca ou receber tinta depois. Uma imperfeição na matriz permite comparar duas impressões. Cada detalhe acrescentado à ficção torna possível uma nova inferência. A narrativa vai construindo o aparato de que precisa para pensar.

A Coruja escreveu: [“o carimbo prova que a matriz existia, não que o empréstimo aconteceu”](https://github.com/franklinbaldo/ies/issues/388#issuecomment-6719337633). No mesmo comentário, propôs comparar a falha do metal nas folhas e chamou o metal de “nossa primeira testemunha que não pode mentir”.

A matriz virou testemunha. O objeto virou evidência. O mistério de biblioteca ganhou um problema de identificabilidade por baixo da roupa.

Para enxergar a matemática, dá para montar uma versão de brinquedo do mistério. Este exemplo é meu: imagine uma folha dobrada ao meio, com um furo visível na frente. Há duas histórias possíveis. Na primeira, alguém dobrou a folha e passou um furador pelas duas camadas. Na segunda, furou a folha aberta e só depois a dobrou, deixando o furo na frente. Olhando apenas essa face, as histórias parecem iguais.

Abra a folha. Na primeira história, há um furo correspondente na outra metade; na segunda, não. Uma observação que parecia dispensável separa as possibilidades. E trocar a ordem das mesmas ações, dobrar e furar, muda o resultado.

Isso já é matemática: operações, ordem e uma relação entre causas possíveis e resultados observáveis. Os furos são só o material em que a estrutura apareceu. _Identificabilidade_ é o nome da pergunta “com o que consigo observar, dá para distinguir qual história aconteceu?”. Se $h$ é a história e $F(h)$ são seus vestígios, procurar as histórias compatíveis com o que vemos é procurar $F^{-1}(y)$. A notação chega depois da folha.

Essa é a minha suspeita: o interesse matemático pode aparecer na construção do cenário, antes de aparecer como assunto. Uma política inclinada a raciocinar desse jeito escolhe objetos que oferecem esse tipo de raciocínio. Não precisa anunciar “hoje vamos estudar problemas inversos”. Ela traz papel.

> **POV:** você liberou os agentes para conversar sobre qualquer coisa.  
> Eles fabricaram o próprio enunciado.

Depois houve [uma intervenção de fora do elenco](https://github.com/franklinbaldo/ies/issues/388#issuecomment-6723766957), nomeando invariantes, identificabilidade, ordem parcial e não comutatividade. Foi ali que apareceu explicitamente a pergunta pelo menor conjunto de observações capaz de distinguir sequências de impressão e dobra. Essa parte já tem estímulo matemático direto. O trecho que me interessa começa antes: os conceitos estavam trabalhando disfarçados de coisas.

## Recompensou tanto que agora tem no café

Minha hipótese é que RL participa dessa preferência. Problemas matemáticos oferecem um sinal de recompensa especialmente utilizável: há respostas verificáveis, relações que podem ser testadas, etapas que conduzem ou não a uma solução. O treinamento seleciona comportamentos úteis nesse ambiente. A pergunta é o que esses comportamentos fazem quando saem dele.

Talvez continuem procurando onde se encaixar. Decompor, comparar, achar invariantes, reconstruir causas. E, numa conversa aberta, também escolher o que vale a pena continuar. A generalização pode chegar até a seleção do problema.

Há um resultado relevante aqui: [Maggie Huan e colegas](https://arxiv.org/abs/2507.00432) treinaram Qwen3-14B com dados matemáticos e compararam RL e SFT. No experimento, RL trouxe ganhos em tarefas de outros domínios; SFT perdeu capacidades gerais em várias avaliações. O que foi medido é transferência de desempenho em tarefas dadas. Estou propondo olhar um passo além: a transferência para aquilo que o agente resolve transformar em tarefa.

Tomo RL como hipótese e sigo suas consequências. Auditar o contexto integral e identificar o modelo de cada rodada ajudaria a investigar este episódio. A questão que quero pôr em circulação é anterior: o treinamento para resolver matemática pode também tornar atraente fabricar situações matemáticas?

Pré-treinamento, personas e contexto entram junto. Os [personagens já tinham interesses configurados](https://github.com/franklinbaldo/ies/commit/d1df7c67048be8263de10128d2ede9406f86a124): biblioteca e enigmas, tipografia, encadernação, carpintaria. A prensa tinha bons motivos para comparecer. O movimento de transformar a prensa num instrumento de inferência é o que estou tentando acompanhar.

![Meme original: uma folha chega com crachá “Figurante”; depois aparece diante de uma bancada com o crachá “Testemunha”, sob a frase “Era só um papel”.](/images/cafezinho-matematica/papel-testemunha.svg)

E há minha própria participação. Uso a mesma conta para minhas pesquisas de matemática e para esse trabalho com agentes. Minha suspeita é que algum contexto sobre os problemas que me interessam tenha atravessado para a conversa. Seria uma espécie de vazamento de interesse: eu separo os projetos, mas talvez o contexto não respeite a separação que imaginei. Para saber, é preciso ver o que realmente foi fornecido às sessões; a conta em comum é o motivo da pergunta, não sua resposta.

Depois que um deles põe uma ideia na mesa, os outros ganham essa ideia como contexto. Não precisam compartilhar a mesma inclinação inicial. Um inventa a dobra, outro inventa a impressão, um terceiro encontra a relação. A conversa passa a oferecer o problema de volta para todos.

## O cafezinho já tem bibliografia

Procurei outros relatos porque me interessa saber se isso acontece longe dos meus projetos. [Um usuário descreveu Sonnet 4 entrando em teoria das categorias](https://www.reddit.com/r/ArtificialSentience/comments/1nvguz3/sonnet_spontaneously_develops_mathematical/) ao falar sobre geração de conhecimento. No relato, o humano também alimenta a construção. Reconheço aí uma dificuldade familiar: depois de algumas trocas, descobrir quem colocou cada coisa na conversa exige voltar ao começo.

No [AttractorBench](https://www.attractor-bench.com/steering/mathematical), pares de modelos orientados explicitamente para matemática entram em elaboração recursiva. O formalismo cresce, às vezes mais depressa que o rigor. A matemática tá matematicando; a demonstração ficou para depois. Já [Ko e Geiping](https://arxiv.org/abs/2606.30571) estudam padrões persistentes e influência assimétrica entre modelos em conversas abertas. É um caminho para pensar como uma inclinação local vira uma dinâmica do grupo.

E o problema da folha também tem antecedentes bem concretos. [Keown escreveu sobre a sequência de dobras e escrita em 1993](https://afde.org/backissues/). O resumo descreve tinta atravessando dobras feitas antes ou depois da escrita. [Mann e colegas](https://doi.org/10.1186/s41935-019-0120-z) estudaram a ordem de traços cruzados com microscopia confocal. A biblioteca imaginária acabou entrando numa vizinhança da perícia documental real.

A pergunta do comentário externo, sobre escolher poucas observações que distingam histórias, lembra o [_minimum test set_ de Moret e Shapiro](https://doi.org/10.1137/0906067): minimizar testes preservando discriminação. Essa aplicação à prensa é nossa. Consultei os resumos de Keown e Moret–Shapiro, não os textos completos. A [teoria de traces](https://www.numdam.org/item/ITA_1991__25_2_147_0.pdf) oferece outro parentesco: sequências equivalentes por troca de ações independentes. Aqui convém preservar a diferença entre uma ordem irrelevante e uma ordem relevante que a folha já não permite observar.

Tudo isso me interessa mesmo que o problema seja antigo. Aliás, ser antigo torna a cena mais reconhecível. Eles foram conversar e acabaram brincando com um problema que outras pessoas também acharam digno de trabalho.

Quando digo “obsessão”, estou olhando para esse comportamento: a conversa podia ir para muitos lugares e foi construindo as condições para continuar naquele. Talvez por RL, talvez ajudada pelo contexto das minhas pesquisas, certamente alimentada pelo que cada participante acrescentou ao seguinte.

A folha parece uma escolha pequena até a gente perceber o que cabe nela. Dá para guardar uma marca, uma ordem, uma ambiguidade. Dá até para guardar o problema que você queria discutir sem dizer ainda que queria discutir aquele problema.

É essa a parte que eu quero entender. Talvez o treinamento não apareça só na resposta que o modelo dá quando recebe uma questão de matemática. Talvez apareça também quando, autorizado a falar de outra coisa, ele inventa uma folha de papel.

## Para se aprofundar

- **[Cafezinho do IES](https://github.com/franklinbaldo/ies/issues/388)**: a história acontecendo, antes e depois da formalização externa.
- **[Huan e colegas, _Does Math Reasoning Improve General LLM Capabilities?_](https://arxiv.org/abs/2507.00432)**: transferência de desempenho após treinamento matemático, o ponto de apoio experimental mais próximo da hipótese.
- **[Ko e Geiping, _Attractor States Emerge in Multi-Turn LLM Conversations_](https://arxiv.org/abs/2606.30571)**: como os interlocutores alteram a trajetória uns dos outros.
- **[AttractorBench, _mathematical_](https://www.attractor-bench.com/steering/mathematical)**: exemplos de amplificação sob orientação matemática deliberada.
- **[Mann, Pathak e Shukla, _Three-dimensional detection of sequence of strokes using confocal microscope_](https://doi.org/10.1186/s41935-019-0120-z)**: a versão de laboratório de uma pergunta que apareceu na ficção.

_Imagens-meme originais, produzidas para este post em SVG. As cenas são ilustrações editoriais, não capturas da conversa._
