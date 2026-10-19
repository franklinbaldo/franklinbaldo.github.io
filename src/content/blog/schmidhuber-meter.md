---
type: Blog Post
title: "Precisamos falar sobre o Schmidhuber Meter"
description: "Uma tentativa semi-séria de medir quanto crédito bibliográfico parece estar faltando quando um trabalho posterior redescobre uma claim pública, específica e encontrável sem citar o antecedente."
docType: essay
date: 2026-09-18
lang: pt
author: franklin
tags:
  - ciência
  - bibliometria
  - inteligência artificial
  - prior art
  - citações
  - schmidhuber meter
emoji: "🤨"
---

Existe uma unidade informal de tempo na inteligência artificial.

É o intervalo entre alguém publicar uma ideia revolucionária e Jürgen Schmidhuber aparecer para dizer:

> Sim. Fizemos isso em 1991.

Às vezes ele tem razão.

Às vezes a discussão é bem mais complicada.

Às vezes você começa comparando duas arquiteturas e, meia hora depois, está lendo um PDF escaneado dos anos 1990 tentando decidir se aquele diagrama conta ou não como ancestral de um mecanismo moderno.

Foi daí que surgiu uma pergunta que é ao mesmo tempo ridícula e estranhamente séria:

**dá para medir o quanto um trabalho deveria provavelmente ter citado um antecedente e não citou?**

A resposta provisória é: talvez.

E o nome, obviamente, tinha que ser **Schmidhuber Meter**.

O nome sério é *Claim-Level Citation Debt Index*.

O nome sério não vai ganhar essa disputa.

## O problema

Imagine o seguinte.

Paper A, 2025:

> Propomos um mecanismo específico com cinco componentes pouco usuais, publicamos o código e descrevemos um experimento.

Quase ninguém vê.

Paper B, 2027:

> Apresentamos um novo mecanismo com aqueles mesmos cinco componentes pouco usuais, mais um nome melhor.

Nature.

20 mil citações.

GitHub com 90 mil estrelas.

Palestra chamada “How We Invented X”.

Nenhuma referência ao paper A.

Há várias explicações possíveis.

Pode ser coincidência.

Pode ser descoberta independente.

Pode ser que a combinação fosse óbvia para qualquer pessoa trabalhando no problema.

Pode ser que o paper A fosse praticamente impossível de encontrar.

Pode ser que B tenha chegado a uma formulação muito melhor.

Ou pode ser apenas aquele fenômeno cientificamente conhecido como:

**hmmmmmmmm. 🤨**

O Schmidhuber Meter tenta medir o tamanho desse “hmmmm”.

## A primeira fórmula era ótima para causar briga

Minha primeira versão era aproximadamente:

[
SM =
rac{
similaridade 	imes citações do paper famoso
}{
citações ao antecedente + 1
}
]

É uma fórmula maravilhosa se o objetivo for começar guerras no Twitter.

Como bibliometria, tem um problema.

Se o paper B deveria citar A quando foi escrito, essa obrigação não fica maior porque cinco anos depois B recebeu 30 mil citações.

O sucesso posterior mede outra coisa:

**o tamanho da consequência da omissão.**

Então precisamos separar duas perguntas.

1. Quão forte é o déficit bibliográfico observável?
2. Quanto esse déficit passou a importar porque o trabalho posterior se tornou influente?

Essa separação acabou virando o coração do modelo.

## Primeiro: quem veio antes?

Antes de embeddings, LLMs, citation graphs e qualquer coisa bonita:

**data.**

Mas não vale olhar a data atual do PDF.

Queremos a primeira aparição pública verificável **daquela claim específica**.

Pode ser:

- arXiv v1;
- DOI online-first;
- proceedings;
- release;
- commit;
- pull request;
- versão pública anterior do arquivo.

Isso importa porque um paper pode existir desde janeiro e receber sua claim principal em agosto.

Se o concorrente publicou em junho, acabou a discussão sobre dívida bibliográfica daquele lado.

Ele não deixou de citar algo que ainda não existia.

Essa regra parece trivial.

Ela também elimina uma quantidade surpreendente de histórias mal contadas de prioridade científica.

## Depois: quão parecido é, de verdade?

Eu não quero um índice que descubra que dois trabalhos são iguais porque ambos contêm as palavras “neural network”.

Então o overlap é dividido.

**Conceito:** é a mesma ideia?

**Mecanismo:** funciona essencialmente do mesmo jeito?

**Experimento:** há escolhas experimentais distintivamente parecidas?

**Predição ou resultado:** chegam às mesmas consequências incomuns?

E a minha favorita:

**Rare conjunction.**

Porque uma combinação de ideias comuns vale pouco como evidência.

“Reinforcement learning + memória” em 2026 não assusta ninguém.

Agora imagine algo como:

> uma chave semântica congelada, uma segunda chave funcional treinável, e feedback downstream que move essa segunda chave na direção da query quando a vantagem é positiva e para longe quando é negativa.

Se um trabalho posterior aparece com a mesma salada específica de escolhas...

O medidor começa a emitir pequenos ruídos alemães.

## Mas dava para encontrar o antecedente?

Essa é provavelmente a variável mais importante.

Imagine que eu tenha inventado tudo em 1994.

Escrevi num `.txt`.

Compactei em ZIP.

Coloquei num FTP.

O servidor morreu em 1996.

Tenho uma fita DAT.

Tecnicamente:

**prioridade histórica gloriosa.**

Bibliograficamente:

boa sorte.

Por isso entra a **discoverability**.

O trabalho anterior estava indexado?

Tinha DOI ou arXiv?

O texto completo era público?

Buscas naturais para aquela claim encontrariam o paper?

Estava perto, no grafo de citações, dos trabalhos que o paper posterior efetivamente cita?

Essa variável impede que o índice vire uma máquina de:

> EU TIVE ESSA IDEIA NO BANHO EM 2007.

A ciência não exige telepatia.

## O score-base

A versão 0.1 ficou deliberadamente simples:

[
SM_{base}=10	imes P	imes O	imes D	imes(1-C)
]

onde:

- (P) = confiança na prioridade pública;
- (O) = overlap substantivo;
- (D) = discoverability histórica;
- (C) = crédito recebido.

Tudo vai de 0 a 1.

Se a prioridade é duvidosa, o score cai.

Se o overlap é superficial, cai.

Se o antecedente era praticamente impossível de achar, cai.

Se houve uma citação apropriada, cai muito ou zera.

É um produto simples porque a primeira versão precisa ser auditável com lápis, papel e browser.

Não quero começar com um modelo que diz:

> probability of citation obligation: 0.8732

sem que exista um dataset bom o suficiente para justificar aquelas quatro casas decimais.

Primeiro a régua.

Depois a estatística.

## Impacto fica fora

Essa foi uma correção importante.

O impacto do paper posterior não entra no score-base.

Se B recebeu 10 citações ou 100 mil, isso não muda retroativamente o que era encontrável e citável no momento em que ele foi escrito.

Então existe uma segunda medida:

**SM-impact**.

Ela responde:

> se havia um déficit de crédito, quão grande ficou a consequência desse déficit ao longo do tempo?

Isso captura o caso engraçado — ou menos engraçado — em que um paper A continua com 3 citações e B vira o nome de uma área inteira.

A prioridade não mudou.

O overlap não mudou.

O que mudou foi a distribuição de reconhecimento.

## E plágio?

Não.

Esse é o ponto que precisa sobreviver à piada.

Um Schmidhuber Meter alto **não significa plágio**.

Também não significa cópia.

Nem má-fé.

Nem que alguém viu o paper anterior.

O índice mede apenas uma combinação observável:

**prioridade pública + overlap substantivo + encontrabilidade + crédito ausente.**

Dependência causal fica em outro campo.

Por padrão:

```
dependency_evidence: unknown
```

Se houver uma discussão pública anterior, reuse de código, email tornado público de maneira legítima, erro distintivo copiado, ou outra evidência positiva, isso pode ser registrado.

Mas não sai da fórmula por mágica.

Temporalidade mais similaridade não lê mentes.

## A escala, porque naturalmente precisamos de uma escala

**0–2 — Tudo normal**

Ciência acontecendo.

Pessoas têm ideias parecidas.

**2–4 — Reinvenção perfeitamente plausível**

Há antecedente, mas a combinação é genérica ou o original estava enterrado no porão digital.

**4–6 — Citation Eyebrow Raised 🤨**

Seria razoável esperar aquela referência.

Nada dramático.

Mas hm.

**6–8 — Schmidhuber Territory**

A claim veio antes.

É específica.

Era encontrável.

O trabalho posterior sobrepõe bastante.

Não localizamos crédito.

A sobrancelha agora está estruturalmente elevada.

**8–9.5 — Full Schmidhuber**

O tipo de situação em que alguém começa uma palestra dizendo:

> Actually, in our 1993 technical report...

**9.5–10 — I EMAILED THEM IN 1997**

Eu colocaria uma trava metodológica aqui.

A nota extrema só faz sentido quando toda a evidência pública é muito forte.

Mesmo assim, a nota continua não sendo uma sentença de plágio.

É só um nível extremamente alto de déficit bibliográfico observável.

## Isso já existe em pedaços

A literatura já mede fenômenos vizinhos.

Há as **sleeping beauties**: trabalhos que ficam ignorados por anos e depois acordam bibliometricamente. Ke e colegas chegaram a propor um *beauty coefficient* para medir isso em grande escala.

Há o **Matthew effect**, sobre como reconhecimento acumulado pode gerar mais reconhecimento.

Há a **obliteration by incorporation**, quando uma ideia fica tão incorporada ao conhecimento comum que as pessoas param de citar a fonte original.

E há uma coisa especialmente útil para este projeto: pesquisadores já construíram datasets de **citações que revisores disseram estar faltando**.

Long e colegas publicaram em 2024 o CitationR, baseado justamente em papers em que revisores recomendaram referências que os autores não haviam incluído.

Ou seja:

> “esse paper deveria provavelmente ter citado aquele”

não é apenas fofoca acadêmica.

Já dá para transformar isso em tarefa de avaliação.

## A parte que ficou séria demais

O índice começou como piada, mas acabou sugerindo um pipeline razoavelmente concreto:

```
claim
→ primeira aparição pública
→ trabalhos anteriores e posteriores
→ overlap técnico
→ discoverability histórica
→ crédito observado
→ Schmidhuber Meter
```

Isso fica particularmente interessante quando se usa Git.

Em vez de dizer que “o paper é de março”, conseguimos descobrir que:

- o paper apareceu em março;
- a claim X entrou em maio;
- a claim Y entrou numa PR de agosto;
- o resultado experimental só apareceu em setembro.

Prioridade deixa de ser uma propriedade mística de um PDF.

Vira provenance.

## Naturalmente eu quero rodar isso nos nossos próprios papers

É aqui que a brincadeira fica útil.

Já estamos auditando prior art claim por claim.

Para cada claim registramos:

- cutoff público;
- antecedente real;
- prior art parcial;
- trabalho adjacente;
- trabalho posterior;
- trabalho posterior sem citação localizada;
- buscas negativas;
- força da sobreposição.

Agora acrescentamos os componentes do Schmidhuber Meter.

Isso nos dá duas possibilidades igualmente interessantes.

**Hipótese A:** estamos sendo sistematicamente Schmidhuberizados.

**Hipótese B:** inventamos coisas que outras 400 pessoas também inventariam numa terça-feira.

A hipótese B é muito boa.

Talvez seja até a mais saudável.

## O detalhe que eu mais gosto

O score precisa ser auditável.

Se alguém olhar uma avaliação e disser:

> overlap de mecanismo 0.9 está absurdo; esses dois passos são tecnicamente diferentes.

Ótimo.

Mostre os trechos.

Talvez seja 0.6.

Recalcula.

Essa é uma conversa muito melhor do que:

> vocês copiaram nossa ideia.

versus:

> não copiamos.

A ambição do Schmidhuber Meter não é provar intenção.

É transformar uma discussão nebulosa de crédito em um conjunto de afirmações menores que podem ser verificadas uma a uma.

## Então, afinal, o que ele mede?

Não:

> Quem roubou de quem?

Mas:

> Dado o que estava publicamente disponível, quão forte é a combinação de prioridade, overlap técnico, encontrabilidade e ausência de crédito?

É menos explosivo.

Também é muito mais útil.

E, principalmente, é reproduzível.

O paper metodológico completo está no repositório [franklinbaldo/papers](https://github.com/franklinbaldo/papers/blob/main/schmidhuber_meter.md), e a definição operacional usada pelos agentes fica no conceito OKF [Schmidhuber Meter](https://github.com/franklinbaldo/papers/blob/main/okf/schmidhuber-meter.md).

Em outras palavras:

**Schmidhuber, mas com provenance.**
