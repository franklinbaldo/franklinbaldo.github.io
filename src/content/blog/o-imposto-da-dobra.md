---
type: Blog Post
title: "O imposto da dobra"
description: "Uma suposta prova diz que um dos problemas mais difíceis da computação é um pouquinho menos difícil. O pouquinho é enorme."
date: "2026-10-28"
docType: essay
lang: pt
translationKey: eth-eli13
tags: [complexidade, matemática, IA, explicação]
---

Esta semana apareceu [um repositório no GitHub da Anthropic](https://github.com/anthropics/formal-math/tree/16a5ce41304fcdaea4e0be7c132e1c361dc26da5/eth) com uma formalização em [Lean](https://lean-lang.org/) e [um artigo](https://hexagonmath.org/2610.00577v1) com um título modesto: *A 2^o(n) Time Algorithm for 3-SAT*. Se o que ele diz estiver certo, uma das apostas mais usadas da ciência da computação teórica acabou de perder.

Confissão logo de saída: eu não consegui abrir o repositório. O GitHub bloqueia robôs, e quem estava lendo por mim era um robô. Então este post faz o que os matemáticos fazem quando não sabem se uma coisa é verdade. Supõe que é, e vê o que acontece.

Vou tentar explicar para alguém de treze anos. Ou para um aluno esperto do segundo grau. Ou para mim, há três semanas.

## A festa

Você vai dar uma festa e tem uma lista de amigos. Cada um vem ou não vem. Só que eles têm exigências:

- A Ana só vem se o Bruno não vier.
- O Caio vem se a Duda vier, ou se o Edu não vier.
- Pelo menos um entre Bruno, Duda e Fábio tem que estar lá, senão ninguém se diverte.

A pergunta é se existe *alguma* lista de convidados que deixa todo mundo satisfeito ao mesmo tempo.

Esse é o problema chamado [SAT](https://pt.wikipedia.org/wiki/Problema_de_satisfatibilidade_booleana). A versão 3-SAT é quando cada exigência menciona no máximo três pessoas. Parece um passatempo de revista. Não é. Um número absurdo de problemas reais vira esse aqui com um pouco de tradução: montar horário escolar, verificar se um chip tem defeito, planejar entregas, resolver sudoku.

O jeito óbvio de resolver é testar todas as listas possíveis. Com 1 amigo são 2 listas: vem ou não vem. Com 2 amigos, 4. Com 3, 8. Cada amigo novo **dobra** o trabalho.

| Amigos | Listas possíveis |
| --- | --- |
| 10 | 1.024 |
| 30 | ~1 bilhão |
| 60 | mais que os segundos desde o Big Bang |
| 300 | mais que os átomos do universo observável |

É a lenda do grão de arroz no tabuleiro de xadrez, só que com convites. A dobra come qualquer computador.

## A aposta

A pergunta que os cientistas fazem há uns cinquenta anos é: dá pra fugir da dobra?

Fugir *completamente* seria resolver em tempo "polinomial": o trabalho cresce como n², ou n³, onde n é o número de amigos. Isso é a famosa pergunta [P vs NP](https://pt.wikipedia.org/wiki/P_versus_NP), que vale um milhão de dólares e ninguém sabe responder. Quase todo mundo aposta que não dá.

Mas existe uma aposta mais forte, de 2001, chamada **Hipótese do Tempo Exponencial**, ou ETH. Ela diz algo assim: você pode ser esperto, pode cortar caminho, mas vai sempre pagar um imposto fixo por amigo. Talvez não dobrar. Talvez multiplicar por 1,3 a cada amigo novo. Ou por 1,0001. Mas algum número maior que 1, fixo, pra sempre.

Os melhores algoritmos conhecidos pagam algo perto de 1,3 por amigo. A ETH dizia que nunca chegaríamos a 1, nem chegando perto aos pouquinhos.

E muita gente construiu em cima dessa aposta. Literalmente centenas de artigos começam com "supondo a ETH, então tal problema não pode ser resolvido mais rápido que tanto". A ETH virou o chão onde se apoiam os andares de cima.

## O que a prova diz

O algoritmo novo paga um imposto por amigo que **vai diminuindo** à medida que a festa cresce. Com mil amigos ele ainda paga quase o mesmo que a dobra. Com um milhão também. Mas a conta vai baixando, e com amigos suficientes ela chega tão perto de 1 quanto você quiser.

Em matemática: o trabalho é 2 elevado a uma coisa que cresce *mais devagar* que n. Os matemáticos escrevem 2^o(n), e lê-se "dois elevado a ozinho de n". O ozinho quer dizer "menor que qualquer fatia fixa de n, no longo prazo".

Isso derruba a ETH. A aposta era que existia um imposto fixo mínimo. Não existe.

Agora a parte engraçada. Quanto o algoritmo economiza, de verdade? O ganho no expoente é dividir por uma coisa parecida com √(log n), que cresce *muito* devagar. Para uma festa de um milhão de convidados, essa divisão dá um fator de uns 1,03.

Três por cento. Foi isso que derrubou a hipótese.

> **Como os matemáticos veem o 1,03:**
> - Para o engenheiro: "não serve pra nada."
> - Para o matemático: "serve pra tudo."
> - Para o matemático, depois de pensar mais um pouco: "é a diferença entre *nunca* e *um dia*."

O matemático tem razão, e isso é o mais difícil de explicar. A ETH não era uma afirmação sobre computadores de hoje. Era uma afirmação sobre o *infinito*: por maior que fosse a festa, o imposto nunca baixaria de certo valor. Basta *uma* festa grande o bastante para desmentir isso. E três por cento que continuam crescendo, mesmo que devagar, um dia viram qualquer número.

## Por que isso não é P = NP

Aqui todo mundo tropeça, inclusive eu na primeira leitura.

Pensa num prédio. No térreo estão os problemas fáceis, que crescem como n² ou n³. Na cobertura estão os problemas de dobra cheia, 2^n. A pergunta P vs NP é se o problema da festa mora no térreo.

A prova nova não desce o problema pro térreo. Ela tira o problema da cobertura e põe no último andar *abaixo* da cobertura. E entre esse andar e o térreo há **infinitos** andares: 2^√n, 2^(n^0,99), 2^(n/log²n). Todos ainda monstruosos, todos diferentes entre si, e isso é teorema, não opinião.

Então a festa continua impossível de organizar para listas grandes. Só ficou impossível de um jeito ligeiramente menos impossível.

## O que cai, o que fica

Como a ETH era o chão, os andares de cima balançam. Mas balançar não é desabar, e aqui eu precisei de calma pra separar uma coisa da outra.

**Cai, com certeza:**

- A ETH e sua irmã mais forte, a SETH. Também a versão que fala de *contar* soluções, a #ETH, porque o algoritmo novo não só diz se existe uma lista boa: ele conta quantas existem. Isso é surpreendente. Contar costuma ser muito mais difícil que achar uma.
- Vários problemas de grafos que se traduzem para a festa sem inflar o tamanho: o maior grupo de pessoas em que ninguém se conhece, colorir um mapa com três cores. Todos ganham a mesma economia.

**Perde a justificativa, mas não cai:** um monte de "limites inferiores" que diziam "tal problema não pode ser mais rápido que X, *supondo a ETH*". Agora o "supondo" não vale mais. Mas ninguém achou algoritmo mais rápido para eles. É como um prédio cujo alvará foi cassado, mas que continua em pé. Alguém vai ter que ir lá conferir a estrutura.

**Não cai:** P vs NP, que continua aberto. E, principalmente...

## Seu WhatsApp está bem

A primeira pergunta que um adolescente esperto faz é se dá pra hackear o banco. Não dá.

A criptografia que protege o seu celular se apoia em problemas como fatorar números enormes. Dá pra traduzir "fatorar" pro problema da festa? Dá. Mas a tradução **incha**: um número de 2.000 dígitos vira uma festa com milhões de convidados. E aí os 3% de economia somem num oceano. O melhor método atual de fatorar é muito, muito mais rápido que passar pela festa.

Com a criptografia nova, a "pós-quântica", vale a mesma coisa. Os problemas dela não são do formato festa, e traduzi-los custa caro demais.

A única coisa criptográfica que cai são algumas construções teóricas que, de propósito, usam exigências pequenininhas, cada saída dependendo de poucos bits. Ninguém usa isso no seu banco.

## A parte mágica

Agora a coisa que me fez levantar da cadeira, às duas da manhã, falando sozinho.

Uma combinação de resultados de Ryan Williams e de três pesquisadores chamados Jahanjou, Miles e Viola diz, mais ou menos, o seguinte: *se a ETH for falsa, então existe uma função, numa certa classe chamada E^NP, que nenhum circuito pequeno consegue calcular.*

Traduzindo. Circuito é tipo um chip feito de portas lógicas. Provar que uma tarefa precisa de um chip grande é uma das coisas mais difíceis da área. Faz décadas que estamos presos em provar coisas fracas, do tipo "precisa de pelo menos três vezes mais portas do que entradas".

E essa combinação de resultados diz: se alguém achar um algoritmo *rápido* para a festa, ganha de brinde uma prova de que outra coisa é *impossível* de fazer barato.

Saber fazer uma coisa rápido prova que outra coisa não dá pra fazer barato. É como descobrir um atalho para a escola e, por causa do atalho, conseguir provar que não existe ponte sobre um rio do outro lado da cidade. Não deveria funcionar. Funciona. A ideia faz parte do "método algorítmico", desenvolvido por [Ryan Williams](https://people.csail.mit.edu/rrw/), e esse é provavelmente o efeito mais profundo da prova nova. Mais que o algoritmo em si.

(Isso vale *se* não tiver aparecido entre 2023 e hoje algum resultado que já prove o mesmo por outro caminho. Eu não conferi. O post é de madrugada.)

## E daí, na vida real?

Na vida real, nada.

Fiz a conta supondo que a constante escondida na fórmula vale 1. Ninguém me disse quanto ela vale, então chutei um número redondo. Para o algoritmo novo superar os melhores programas atuais, a festa teria que ter mais convidados que átomos no universo. Com folga. Muita folga.

Os programas que resolvem SAT no mundo real resolvem casos com milhões de variáveis em segundos. Não é porque fogem da dobra. É porque problemas reais têm estrutura, e esses programas são ótimos em achar estrutura. A prova nova é sobre o pior caso possível, a festa mais malvada que alguém consegue inventar.

Isso já aconteceu antes. Em 2002, três indianos provaram que testar se um número é primo é fácil, no sentido técnico. Foi uma revolução teórica. Até hoje ninguém usa o algoritmo deles. Usam os antigos, que são aleatórios e mais rápidos.

## E a IA?

O título diz Anthropic, o arquivo é Lean, e a Anthropic atribui a descoberta da ideia central a um modelo interno Claude. Não conferi independentemente a história da descoberta. Isso importa, mas menos do que parece.

Lean é um verificador de provas. Pensa num professor chatíssimo que confere cada passo da sua conta e não deixa passar nada. Se o Lean aceitou, a prova está certa. Mas tem um detalhe: o Lean confere se você respondeu *a pergunta que está escrita no arquivo*. Ele não confere se a pergunta escrita é a pergunta que interessa. Alguém humano tem que ler o enunciado e dizer: sim, isto aqui é mesmo o 3-SAT, isto aqui é mesmo tempo de computador, isto aqui não tem truque.

Se essa atribuição à IA estiver correta, aprendemos que máquinas conseguem chegar na fronteira e derrubar uma aposta da comunidade. Não aprendemos que elas "entendem" o que fizeram. E ganhamos um problema novo: uma prova certa que ninguém consegue explicar é um teorema sem teoria. Alguém ainda vai ter que traduzir aquilo para gente.

## O que fica de lição

Uma coisa que eu achava e que agora acho que estava errada.

Eu achava que o problema da festa era difícil porque tem *possibilidades demais*. 2^n listas, não tem como olhar todas. Mas a prova nova não olha todas, e também não olha "menos" de um jeito bobo. Pelo pouco que dá pra ler da descrição, ela usa álgebra: trata cada exigência como uma pecinha matemática, encaixa as pecinhas e descobre que algumas combinações se simplificam.

Então talvez a dificuldade nunca tenha sido a quantidade de possibilidades. Talvez seja a falta de padrão nas exigências. Onde há padrão, mesmo escondido, a álgebra acha um atalho. Exigências pequenas, com três pessoas cada, têm mais padrão do que a gente imaginava.

Não sei se isso é a lição certa. É a que eu consegui tirar às duas da manhã.

A festa continua impossível. Só não é mais impossível por princípio.

## Para se aprofundar

- **Lance Fortnow, *The Golden Ticket*** — o livro de divulgação sobre P vs NP que eu daria para o aluno esperto do segundo grau.
- **Scott Aaronson, [*Why Philosophers Should Care About Computational Complexity*](https://arxiv.org/abs/1108.1791)** — para quando a festa virar pergunta filosófica.
- **Russell Impagliazzo, *A Personal View of Average-Case Complexity*** — o texto dos "cinco mundos": Algorítmica, Heurística, Pessiland, Minicrypt e Cryptomania. Bom para pensar em que mundo a gente acordou hoje.
- **Avi Wigderson, *Mathematics and Computation*** — o mapa inteiro, do autor que ganhou o Abel e o Turing. Exige fôlego.
- **Jahanjou, Miles e Viola, [*Local Reductions*](https://arxiv.org/abs/1311.3171)** — o artigo da parte mágica. Os Corolários 2 e 3 dizem, em linguagem técnica, o que eu tentei dizer com a ponte e o rio.