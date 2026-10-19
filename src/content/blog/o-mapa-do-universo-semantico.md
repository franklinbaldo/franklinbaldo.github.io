---
type: Blog Post
title: 'O mapa do universo semântico'
description: >-
  Uma conversa sobre embeddings começou com a ideia de trajetórias semânticas,
  passou por quásares artificiais, gravidade, Jacobianos, Borges e terminou numa
  pergunta indecentemente prática: dá para compilar uma LLM num mapa e navegar
  nele antes de gastar tokens?
date: '2026-08-08'
lang: pt
docType: essay
tags:
  - ai
  - llm
  - embeddings
  - interpretability
  - control
  - research
emoji: '🗺️'
---

Tudo começou com uma linha.

Não uma linha de código. Uma linha meio literal mesmo.

Eu estava conversando com o ChatGPT sobre uma coisa que me incomoda nos embeddings. A gente fala de um texto como se ele tivesse “um embedding”, um ponto num espaço semântico. Só que um texto acontece em sequência. Uma palavra vem depois da outra. Um argumento vem depois do outro. Uma conversa vai tomando uma direção.

Então talvez um texto não seja um ponto.

Talvez seja um caminho.

E foi aí que a conversa começou a ficar perigosa.

## O token no meio de uma bolha

A primeira intuição era mais ou menos esta.

Pegue um token numa posição qualquer. Sozinho, ele tem pouquíssimo significado. Se eu aumento a janela para a esquerda e para a direita, ele começa a ganhar contexto. A mesma posição passa a significar coisas diferentes conforme eu aumento o raio.

```text
banco
↓
sentei no banco
↓
sentei no banco esperando o ônibus
```

Em outro texto:

```text
banco
↓
o banco aprovou
↓
o banco aprovou o financiamento
```

O token continua ali. Mas a região semântica em que ele vive muda.

A imagem que me ocorreu foi uma espécie de bolha: cada posição do texto tem um entorno semântico que vai se formando conforme o contexto cresce.

Matematicamente, alguma coisa como:

```text
S(i, r)
```

em que `i` é a posição e `r` é a escala do contexto.

Se eu congelar o raio e andar pelo texto, tenho uma sequência:

```text
S(1,r) → S(2,r) → S(3,r) → ...
```

E pronto: nasceu a linha.

Ou melhor, a curva.

Porque não existe motivo nenhum para ela ser reta.

## Conversas fazem curvas

A conversa então virou geometria.

Se cada posição produz um estado semântico, a sequência inteira produz uma trajetória num espaço de muitas dimensões.

Ela pode andar quase em linha reta:

```text
premissa → consequência → consequência → conclusão
```

Pode fazer uma curva:

```text
software → significado → Wittgenstein → linguagem → software
```

Pode dar voltas.

Pode voltar para o mesmo lugar.

Pode entrar num assunto, sair, retornar, ficar orbitando.

E aí apareceu a pergunta realmente interessante: se eu fizer isso com muitas conversas, eu começo a ter não só pontos, mas **tipos de caminho**.

Duas conversas podem falar sobre assuntos completamente diferentes e ainda assim ter uma dinâmica parecida.

Uma discussão jurídica e uma discussão sobre física podem fazer a mesma figura:

```text
abertura
   ↘
  conflito
     ↘
    bifurcação
      ↘
     síntese
```

Talvez eu consiga classificar conversas não apenas pelo que elas “são sobre”, mas por como elas se movem.

Isso já muda uma pergunta clássica.

Em vez de:

> qual é o próximo texto provável perto deste embedding?

você pode perguntar:

> conversas que chegaram aqui, vindo nessa direção e com essa curvatura, costumam ir para onde?

Uma espécie de meteorologia semântica.

Ainda estava razoável.

Aí eu lembrei dos quásares.

## Precisamos de quásares

Um problema apareceu logo em seguida: espaço de embedding não vem com longitude e latitude universais.

Um modelo pode representar uma mesma geometria numa orientação. Outro pode rotacionar tudo. Outro pode esticar um eixo. As coordenadas absolutas não significam grande coisa.

Então pensei: como é que a gente se localiza no universo físico?

A resposta não é “o universo vem com uma grade cartesiana desenhada nele”.

A gente cria referenciais.

E, no céu, usa objetos extremamente estáveis e distantes como referências. Quásares são quase o exemplo perfeito de faróis cósmicos.

Aí a ideia virou:

> e se existissem quásares semânticos?

Não necessariamente atratores. Não coisas que puxam a conversa. Só landmarks suficientemente estáveis para eu dizer onde estou em relação a eles.

Em vez de representar um significado como:

```text
x = [0.173, -0.448, ...]
```

represento como:

```text
distância ao quásar 1
distância ao quásar 2
distância ao quásar 3
...
```

Ou similaridades, ângulos, projeções.

A coordenada passa a ser relacional.

O céu vira instrumento.

## A primeira heresia: fabricar os quásares

Foi aí que eu tive uma dúvida que melhorou a ideia.

Por que procurar esses faróis na natureza?

Nós controlamos o sistema de coordenadas.

Podemos fabricar os quásares.

Em 64 dimensões, por exemplo, dá para construir 65 pontos formando um simplex regular. Todos igualmente separados. Nenhum é semanticamente privilegiado. Nenhum precisa significar “causalidade”, “amor”, “direito”, “pato” ou “otimização convexa”.

Eles existem porque nós os definimos.

```text
Q1  Q2  Q3  ...  Q65
```

A função deles é só uma:

> servir de céu fixo.

O modelo então ganha um adapter, ou uma calibração, que traduz seu espaço nativo para esse referencial.

```text
embedding do modelo
      ↓
 whitening / alignment / adapter
      ↓
Semantic Reference Frame
      ↓
quásares fixos
```

E aqui apareceu uma pegadinha ótima, porque toda boa metáfora científica merece uma humilhação matemática.

**Inventar o céu é fácil. Fazer dois telescópios concordarem sobre onde ele está é outra história.**

Um simplex regular é perfeitamente simétrico. Eu posso rotacionar o céu inteiro e ele continua sendo o mesmo simplex. Portanto, escrever `Q17` em um vértice não faz aquele vértice adquirir magicamente o mesmo significado em duas LLMs.

Depois de whitening, isso fica ainda mais traiçoeiro: se eu igualei as variâncias, uma rotação ortogonal do espaço continua sendo igualmente válida. Corrigir o sinal de um eixo resolve `+/-`; não resolve o céu inteiro girando.

Então a frase “o telescópio muda, o céu continua o mesmo” precisava de uma nota de rodapé que virou parte da arquitetura.

O céu artificial fornece a **geometria**. A orientação semântica precisa de calibração empírica.

Pegamos um conjunto compartilhado de textos, observamos esses mesmos pontos com os dois modelos e obrigamos os telescópios a concordar sobre eles — por exemplo, com uma transformação de Procrustes para um alvo canônico congelado.

```text
mesmos textos de calibração
        ↓             ↓
   telescópio A   telescópio B
        ↓             ↓
      whitening     whitening
        ↓             ↓
        └── alinhamento pareado ──┐
                                  ↓
                         mesmo céu artificial
```

E o teste importante não é mais “as distâncias continuaram iguais?”. Uma rotação já preserva distâncias por construção.

O teste passa a ser:

> **em textos que não participaram da calibração, os dois telescópios realmente dão as mesmas coordenadas de quásares?**

Se eu embaralho as correspondências de calibração e o resultado continua bom, nosso GPS está fingindo trabalhar.

Essa complicação, aliás, deixou a ideia melhor. Os quásares continuam completamente artificiais. O que ganha ancoragem empírica é a transformação que coloca cada modelo diante daquele céu.

Essa é a parte em que o meme do Drake começa a ficar útil.

> ❌ “Descobrir o conceito universal absolutamente imóvel que existe em todas as LLMs.”
>
> ✅ “Inventar uma régua, calibrar os instrumentos com pontos compartilhados e testar se eles concordam fora da calibração.”

Menos mágico. Muito mais útil.

## Não quero só saber onde estou. Quero dirigir.

Até aqui o sistema era cartografia.

Mas uma conversa não é uma pedra no mapa. Ela está andando.

Então veio a pergunta seguinte:

> se eu sei onde estou, sei para onde estou indo e sei onde quero chegar, consigo escolher uma rota?

Suponha que eu esteja no último token da conversa. Sou a cabeça da fila, não o rabo. O futuro ainda não existe.

Tenho uma posição atual:

```text
S
```

Tenho um destino:

```text
G
```

E talvez já tenha um mapa de milhares de trajetórias anteriores.

Eu posso simplesmente deixar a conversa seguir a dinâmica mais provável.

Ou posso procurar uma rota.

```text
S ──────── provável ─────────→
 \
  \__ waypoint __ waypoint __→ G
```

Isso fica mais interessante quando há vários objetivos.

Uma resposta jurídica precisa passar por uma premissa normativa, depois por uma distinção factual, depois pelo precedente.

Uma conta precisa decompor a expressão, resolver duas partes e só então recombinar.

Um argumento científico precisa chegar em três subproblemas antes da conclusão.

Então o objetivo não é “teletransportar” a conversa para o embedding final.

É descobrir uma rota que atravesse os pontos necessários **sem fazer curvas idiotas**.

Não quero sair de teoria de embeddings e, no próximo token, aparecer magicamente na solução de uma equação diferencial como quem caiu de paraquedas.

Quero uma rota semanticamente transitável.

## Temperatura não é criatividade

Aqui apareceu uma distinção que eu gosto bastante.

Hoje, quando queremos que uma LLM seja mais “criativa”, uma das coisas mais grosseiras que fazemos é aumentar temperatura.

Ou seja:

> escolha tokens localmente menos prováveis.

Mas uma ideia nova não precisa usar palavras improváveis.

Ela pode usar palavras completamente banais e ainda assim percorrer um caminho conceitual que ninguém percorreu.

Então talvez exista outra regulagem:

```text
novelty pressure
```

Em vez de procurar tokens estranhos, procuro **rotas semanticamente pouco exploradas**, mas ainda naturais.

É outra forma de criatividade.

Menos “jogue dados com o vocabulário”.

Mais “pegue uma estrada secundária que ainda chega no destino”.

## A gravidade apareceu sem ser convidada

Se existem estradas, algumas devem ser fáceis e outras difíceis.

A conversa naturalmente cai em certos lugares. Certas regiões têm muitas trajetórias. Outras parecem ilhas. Algumas talvez sejam muito fáceis de entrar e difíceis de sair.

Eu comecei a chamar isso, meio abusivamente, de **gravidade semântica**.

Não porque exista uma lei de Newton escondida dentro do Transformer.

A ideia é operacional:

> quanto custa tirar uma geração desta região e fazê-la permanecer fora?

Uma região pode ser uma bacia.

```text
       \       /
        \     /
         \___/
           ●
```

Se um pequeno steering tira a conversa dali, o poço é raso.

Se qualquer continuação tende a voltar, o poço é profundo.

Então aparece algo parecido com energia de escape.

E, mais importante, aparece **alcançabilidade**.

Para um modelo pequeno, determinado destino pode existir no mapa e ainda assim não ser alcançável com o orçamento atual.

É a diferença entre:

```text
“esse conceito não existe”
```

e

```text
“esse conceito existe, mas este viajante não chega lá com este veículo”
```

A metáfora Terra/avião/foguete ficou inevitável.

A pé, tenho um raio.

De avião, aumento o conjunto alcançável.

Com um foguete, atravesso uma barreira completamente diferente.

Para uma LLM, prompting, retrieval, ferramentas, activation steering e fine-tuning podem ser veículos diferentes.

E aí o mapa deixa de ser apenas mapa de conhecimento.

Ele vira também um mapa de **capacidade**.

## A parte em que Borges entra na sala

Nesse ponto eu percebi que estava descrevendo um mapa do mundo semântico e pensei imediatamente em Borges.

Em _Do rigor na ciência_, um império aperfeiçoa tanto a cartografia que acaba produzindo um mapa na escala do próprio império.

O mapa cobre o território.

Parabéns, senhores cartógrafos. Vocês reinventaram o chão.

Isso é um problema perfeito para uma LLM.

Se o meu mapa precisar guardar cada detalhe de cada contexto possível e cada próximo token possível, eu não comprimi nada.

Só construí outra LLM pior.

Então o atlas precisa ter uma propriedade essencial:

> ser grosseiro em quase todo lugar e ficar detalhado só onde eu estou olhando.

Como Google Maps.

No zoom mais distante:

```text
matemática
filosofia
direito
biologia
```

Mais perto:

```text
otimização
  ↳ gradiente
  ↳ controle
  ↳ busca
```

Mais perto:

```text
controle ótimo
  ↳ MPC
  ↳ função de custo
  ↳ horizonte
```

Mais perto ainda:

```text
“portanto”
“daí segue”
“isso implica”
```

Essa última parte foi a que me pegou.

## Dar zoom até minerar o token

Se o mapa é multirresolução, talvez a linguagem apareça quando eu aumento suficientemente a resolução.

No começo, eu só sei que estou numa região de “conclusão de uma derivação”.

Dou zoom.

A região vira “expressão curta de consequência lógica”.

Dou zoom.

Aparecem possibilidades lexicais:

```text
portanto
logo
assim
consequentemente
```

Dou mais zoom, condicionado pela sintaxe que já existe.

Talvez reste:

```text
portanto
```

Isso me levou a uma ideia meio borgiana ao contrário.

O mapa não precisa ser 1:1 em todo o Império.

Ele só precisa conseguir **virar localmente 1:1 onde eu coloco a lupa**.

Globalmente:

```text
mapa << território
```

Localmente:

```text
mapa(zoom máximo) ≈ território
```

Depois eu tiro a lupa e jogo fora o detalhe.

É uma cartografia preguiçosa.

Lazy Borges.

## E se o mapa simplesmente lembrar onde já pisou?

A essa altura apareceu uma saída bem menos heroica para o problema de “como eu tiro palavras de uma posição do mapa?”.

Talvez eu não precise inverter a LLM matematicamente logo de saída.

Toda vez que eu faço uma inferência, eu já tenho um pequeno evento completo:

```text
contexto
  ↓
posição no SRF
  ↓
próximo token / bloco
```

Então por que jogar isso fora?

Cada inferência pode deixar um alfinete no atlas.

```text
(q_t, contexto, token, q_t+1)
```

Depois de milhões desses alfinetes, quando eu estiver em uma região do mapa, posso procurar os estados já observados mais próximos e perguntar:

> o que a LLM fez quando esteve por aqui antes?

Isso é bastante próximo da ideia dos **kNN language models**, que guardam representações de contextos junto com o próximo token e consultam vizinhos durante a geração. A diferença que quero testar aqui é colocar essa memória no nosso referencial semântico e deixar o **destino da rota** participar da busca.

Dois registros podem estar igualmente perto de onde eu estou, mas um deles saiu para leste e o outro para oeste.

Se meu planner quer leste, isso importa.

```text
          vizinho A ───→
        /
      ● você
        \
          vizinho B ←───
```

A memória deixa de perguntar apenas “qual contexto é parecido?” e passa a perguntar também “qual contexto conhecido realizou um movimento parecido com o que eu quero realizar agora?”.

E dá para guardar mais que o token sorteado.

Se a inferência já calculou a distribuição de logits, jogar tudo fora e salvar apenas uma amostra é uma espécie de amnésia voluntária. Posso guardar pelo menos um `top-k` comprimido e construir uma distribuição lexical local ponderando os vizinhos.

Aí o zoom ganha uma definição bem operacional.

De longe, muitos vizinhos diferentes competem e a entropia lexical é alta.

Quando eu aproximo:

```text
H(próximo token | vizinhança local) ↓
```

Se a entropia cai o suficiente, talvez o próprio atlas consiga propor o próximo token ou bloco sem chamar a LLM inteira.

Se não cai, tudo bem: o mapa admite que está borrado e chama o motor.

E ainda existe um fallback meio engraçado para uma região onde temos dois ou três exemplos próximos, mas nenhum exatamente no alvo.

Podemos pedir à própria LLM:

> misture essas realizações e tente chegar semanticamente aqui.

Mas com uma regra importante: **não acreditar nela**.

Geramos a síntese, calculamos novamente onde ela caiu no SRF e só aceitamos se de fato ficou mais perto do alvo.

Misturar dois textos não garante que o embedding da mistura seja o ponto médio. A LLM vira um solver iterativo, não uma régua.

Essa camada virou um novo experimento no programa: um **inverse atlas empírico**, uma memória do território já percorrido que tenta devolver linguagem para uma rota planejada.

Borges provavelmente aprovaria, desde que a lookup table não cresça até cobrir o Império também.

## Mas ainda tinha um problema caríssimo

Até aí eu ainda estava supondo que construir o mapa exigiria percorrer a LLM.

Gerar token por token.

Observar.

Triangular.

Atualizar o mapa.

Gerar de novo.

Isso é como cartografar um país andando com uma trena.

Aí veio a pergunta que, para mim, é a mais importante economicamente:

> se eu já tenho os pesos da LLM, eu realmente preciso percorrer o território inteiro para construir o mapa?

Uma LLM é um objeto matemático gigantesco, mas é um objeto que eu tenho inteiro na minha frente.

Não é o planeta Terra escondendo a geologia embaixo do solo.

Eu tenho `weights`.

Eu tenho `lm_head`.

Eu tenho matrizes de MLP.

Eu tenho atenção.

Então talvez exista uma etapa de **compilação**.

```text
LLM
 ↓
compilador semântico
 ↓
Semantic Atlas
```

Não exato.

Provavelmente nunca uma multiplicação mágica `weights -> universo inteiro`.

O Transformer é não linear, contexto importa, atenção muda com o estado.

Mas talvez dê para extrair um mapa-base estático e usar amostragem apenas para calibrar as regiões dinâmicas.

Isso é muito diferente de descobrir tudo token por token.

## A `lm_head` é um ótimo lugar para começar a cavar

A saída de uma LLM tem uma coisa maravilhosamente linear no fim:

```text
logits = W · hidden_state
```

Se eu decomponho essa matriz com SVD:

```text
W ≈ U Σ Vᵀ
```

posso perguntar quanto da escolha lexical cabe num subespaço muito menor.

Se rank 64, 128 ou 256 preserva uma boa parte dos top tokens, eu tenho uma espécie de decoder lexical comprimido.

Aí o caminho fica curioso:

```text
posição no atlas
      ↓
coordenada reduzida
      ↓
matriz compilada
      ↓
logits aproximados
      ↓
tokens
```

O mapa começa a conseguir falar.

Ainda não pensa como a LLM inteira.

Ainda não modela o contexto inteiro.

Mas já existe uma ponte algébrica entre uma região reduzida e vocabulário.

E isso é justamente uma das coisas que o experimento vai tentar medir, em vez de apenas admirar no quadro branco.

## O Jacobiano apareceu no momento certo

Em algum ponto da conversa eu perguntei como fazer steering de verdade.

Porque calcular uma rota sem conseguir virar o volante é um recurso muito conhecido de aplicativos de GPS ruins.

A solução natural é olhar para o estado interno da LLM e perguntar:

> se eu mexer um pouco aqui, para onde o futuro semântico vai?

Isso é uma derivada.

Um Jacobiano.

Algo como:

```text
J = ∂(posição semântica futura) / ∂(hidden state atual)
```

Coincidentemente, a Anthropic publicou em julho de 2026 o trabalho da **Jacobian Lens / J-space**, mostrando que Jacobianos podem revelar representações internas verbalizáveis que participam de raciocínio e planejamento futuro.

Isso não quer dizer que “a LLM calcula um Jacobiano”.

Quer dizer que o Jacobiano descreve uma sensibilidade causal útil do sistema.

É como pilotar um avião usando a derivada de pitch em relação ao elevator sem imaginar que o avião está filosofando sobre cálculo diferencial.

O nosso controlador poderia fazer:

```text
rota desejada
     ↓
erro semântico
     ↓
Jacobian local
     ↓
pequena correção no hidden state
     ↓
LLM gera normalmente
     ↓
mede de novo
```

Um servo.

A LLM continua sendo o motor.

O mapa diz onde estamos.

O planner diz para onde ir.

O Jacobiano mexe no volante.

## E se a LLM pequena só estiver se perdendo?

A parte mais interessante, para mim, apareceu quando a ideia voltou para eficiência.

Uma LLM pequena pode saber fazer várias operações locais e ainda assim ser ruim em organizar a sequência inteira.

Ela sabe calcular A.

Sabe inferir B.

Sabe aplicar C.

Mas, quando precisa chegar até D, dá voltas, repete, abandona caminhos e consome tokens tentando reencontrar a direção.

Então talvez parte do que chamamos de “capacidade de raciocínio” seja um problema de navegação.

Não em todos os casos, obviamente.

Mas em alguns.

A hipótese divertida é:

> talvez modelos menores não precisem sempre pensar mais; talvez precisem se perder menos.

Se eu já sei que uma resposta correta exige os waypoints:

```text
G1 → G2 → G3 → resposta
```

posso testar se um modelo pequeno consegue executá-los quando recebe apenas a rota semântica — não o texto da solução.

Depois diminuo o orçamento:

```text
256 tokens
128 tokens
64 tokens
32 tokens
```

E vejo quem ainda chega.

Se o modelo navegado mantém a acurácia com menos tokens, aconteceu alguma coisa interessante.

Se ele usa menos tokens mas gasta vinte rollouts descartados para escolher cada trecho, aconteceu outra coisa: controle sem eficiência.

Também é resultado.

## O paper nasceu quando a conversa ficou grande demais

Em algum momento já tínhamos:

- trajetórias multiescala;
- quásares artificiais;
- um referencial semântico calibrado;
- gravidade e alcançabilidade;
- rotas multiobjetivo;
- um atlas com resolução variável;
- Borges;
- steering por MPC;
- Jacobianos;
- um servo;
- compilação dos pesos;
- uma memória de inferência / inverse atlas;
- e a possibilidade de minerar tokens dando zoom.

Ou seja: a conversa tinha adquirido massa suficiente para criar seu próprio campo gravitacional.

A saída razoável era abrir um paper.

Foi o que fiz.

No [`franklinbaldo/papers`](https://github.com/franklinbaldo/papers), o programa começa no [issue #260](https://github.com/franklinbaldo/papers/issues/260), e o primeiro manuscrito está na [PR #271](https://github.com/franklinbaldo/papers/pull/271).

Depois vêm os experimentos empilhados:

```text
paper
  ↓
SRF + quásares + atlas observacional
  ↓
MPC semântico
  ↓
Semantic Servo / Jacobiano
  ↓
atlas compilado dos pesos
  ↓
inverse atlas / memória de inferência
```

O ponto importante é que o paper ainda não diz “isso funciona”.

Ele diz exatamente o contrário:

> aqui estão as peças que precisam falhar separadamente.

Se os quásares preservam geometria mas dois modelos não concordam em coordenadas held-out, o céu compartilhado não foi calibrado.

Se o atlas não prediz transições, mata essa parte.

Se o MPC só funciona gastando computação absurda, temos controle mas não eficiência.

Se o Jacobiano altera a cabeça preditiva mas não a geração real, o volante é decorativo.

Se a SVD da `lm_head` preserva tokens mas não dinâmica, temos compressão lexical, não um universo compilado.

Se a lookup table só funciona quando encontra quase o mesmo contexto exato, o inverse atlas virou memorização borgiana.

É bem menos romântico.

E exatamente por isso ficou mais interessante.

## O mapa não é a LLM

A distinção que eu quero preservar é esta:

```text
LLM = território microscópico
Atlas = representação macroscópica
```

A LLM sabe produzir linguagem.

O atlas sabe dizer onde estamos, quais caminhos existem, quais custam caro e quanto detalhe precisamos carregar naquele ponto.

Às vezes o atlas pode ser suficiente para decidir o próximo grande passo.

Às vezes precisamos dar zoom.

Às vezes a memória de inferência já conhece realizações linguísticas muito próximas daquele lugar.

Às vezes precisamos chamar a LLM inteira porque o mapa admite que não sabe.

Isso é importante.

Um atlas útil não é uma LLM disfarçada.

É uma forma de **não precisar usar toda a LLM para toda decisão**.

Se der certo, talvez uma query futura pareça menos com:

```text
pergunta
  ↓
token
  ↓
token
  ↓
token
  ↓
...
  ↓
resposta
```

E mais com:

```text
pergunta
  ↓
localização
  ↓
rota no atlas
  ↓
zoom / memória local onde suficiente
  ↓
execução da LLM onde necessário
  ↓
resposta
```

A economia estaria justamente nos saltos em que o mapa consegue trabalhar numa escala maior do que um token — ou reutilizar território lexical que já foi observado.

Talvez não consiga.

Talvez a linguagem seja borgiana demais e o mapa precise crescer até virar o próprio modelo.

Esse é um ótimo resultado negativo.

Mas eu gosto mais da outra possibilidade.

A de que exista uma camada intermediária — grande o bastante para conter a geografia do raciocínio, pequena o bastante para caber num mapa.

## No fim, a pergunta é bem simples

Existe um universo semântico grande demais para enxergarmos diretamente.

Nós já temos instrumentos que produzem coordenadas locais: embeddings.

Talvez possamos construir um céu artificial: quásares.

Talvez possamos calibrar telescópios diferentes para esse mesmo céu.

Talvez possamos observar trajetórias.

Talvez essas trajetórias revelem vales, montanhas e corredores.

Talvez possamos planejar rotas.

Talvez possamos usar Jacobianos como volante.

Talvez possamos compilar parte do mapa diretamente dos pesos.

Talvez o mapa possa lembrar os lugares onde a LLM já esteve e recuperar linguagem por vizinhança.

E talvez, quando chegarmos perto do destino, possamos dar zoom até a linguagem reaparecer.

Ou talvez Borges esteja esperando no final da estrada, rindo, porque passamos meses construindo um mapa de 14 terabytes que é exatamente tão caro quanto a LLM original.

Também seria justo.

Por enquanto, a experiência começa pequena: um modelo de 0,6B, um embedding da mesma família, 64 dimensões, 65 quásares artificiais e uma pergunta que dá para medir.

**Dá para fazer uma conversa ir a algum lugar porque conhecemos a geografia do caminho — e não apenas porque continuamos pedindo o próximo token?**

É o tipo de pergunta que começa com uma linha e, quando você percebe, já precisa de um mapa.
