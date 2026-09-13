---
type: Blog Post
title: 'Uma mosca tentou ler decisões judiciais — e ainda não ganhou do controle'
description: >-
  Transformei parte do conectoma MaleCNS em um reservoir para marcar o resultado
  de decisões judiciais. O primeiro resultado não é uma vitória da biologia — e
  justamente por isso o experimento ficou mais interessante.
date: '2026-09-13'
lang: pt
tags:
  - ai
  - malecns
  - drosophila
  - reservoir-computing
  - legal-tech
  - experiments
draft: true
author: franklin
translationKey: malecns-legal-tagger
---

Eu coloquei um cérebro de mosca para tentar marcar o resultado de decisões judiciais.

A frase parece uma piada de laboratório, mas a implementação é bastante literal. O **MaleCNS** é um mapa recém-publicado das conexões do sistema nervoso central de uma mosca-da-fruta macho. Eu peguei uma parte desse grafo, congelei suas conexões e usei aquilo como a rede recorrente de um pequeno modelo de *sequence tagging*.

A mosca não recebe palavras, tokens de um LLM nem embeddings semânticos sofisticados. Ela recebe **bytes UTF-8**.

```text
texto jurídico
    ↓
bytes UTF-8
    ↓
embedding treinável de 64 dimensões
    ↓
64 neurônios de entrada
    ↓
512 neurônios conectados segundo o MaleCNS
    ↓
readout linear
    ↓
"resultado" ou "O"
```

O objetivo é marcar, byte por byte, onde aparece o trecho `resultado` em uma decisão judicial do CausaGanha.

Isso não é uma simulação fiel do cérebro de uma Drosophila. As conexões vêm do conectoma; a dinâmica matemática que passa atividade por elas é nossa. O experimento pergunta uma coisa mais modesta e, para mim, mais interessante: **a estrutura real de um sistema nervoso pode servir como um bom substrato computacional congelado?**

## O primeiro resultado parecia promissor

Na primeira execução real, com uma única seed, a mosca chegou a F1 **0,33236**.

Um modelo muito mais simples — embedding de bytes seguido diretamente pelo classificador, sem rede recorrente — ficou em **0,32203**.

Era uma diferença pequena, mas na direção divertida. Além disso, a loss do MaleCNS caiu bastante nas três épocas de treino:

```text
0,61896 → 0,36773 → 0,28081
```

Era tentador olhar para isso e dizer: "há alguma coisa no cérebro da mosca".

Só que esse seria exatamente o tipo de conclusão que eu não queria permitir ao experimento.

## A pergunta certa não é "a recorrência ajuda?"

Uma rede recorrente qualquer pode carregar contexto. Se eu comparasse MaleCNS apenas contra um classificador sem recorrência, qualquer melhoria poderia vir simplesmente do fato de existir memória temporal.

Então construímos um adversário muito mais incômodo.

Pegamos exatamente o mesmo grafo e embaralhamos as conexões usando *directed double-edge swaps*. O controle preserva:

- o mesmo número de neurônios;
- o mesmo número de conexões;
- o *in-degree* de cada neurônio;
- o *out-degree* de cada neurônio;
- o mesmo conjunto de pesos;
- o mesmo modelo treinável;
- a mesma seed;
- as mesmas janelas de texto.

O que ele destrói é boa parte da organização de ordem superior do wiring biológico.

A comparação interessante passa a ser:

```text
MaleCNS verdadeiro
        versus
MaleCNS embaralhado preservando graus
```

Se o primeiro vencer consistentemente, começa a existir alguma evidência de que a organização específica do conectoma importa.

Na primeira seed, não venceu.

```text
MaleCNS               0,33236
shuffled              0,33609
byte-only             0,32203
```

A mosca verdadeira ficou um pouquinho acima do modelo sem memória e um pouquinho abaixo da "mosca falsa".

## Cinco moscas depois

Uma seed não é resultado. Rodamos então cinco seeds pareadas, sempre mudando juntos a inicialização e a amostragem de janelas.

O resultado agregado foi:

| modelo | F1 médio | desvio-padrão |
|---|---:|---:|
| MaleCNS | **0,2753** | 0,0682 |
| MaleCNS embaralhado | **0,2782** | 0,0610 |
| byte-only | **0,2727** | 0,0562 |

A diferença pareada MaleCNS menos shuffled ficou em:

```text
-0,0029 ± 0,0284 F1
```

Em três seeds o MaleCNS verdadeiro venceu. Em duas perdeu. A média ficou ligeiramente negativa.

Contra o byte-only:

```text
+0,0026 ± 0,0140 F1
```

Duas vitórias da mosca, três do baseline.

Ou seja: **até aqui não existe evidência de que a topologia biológica seja melhor**.

E eu gosto muito mais desse resultado do que gostaria de uma vitória frágil em uma única seed.

Agora temos um experimento que sabe dizer "não sei".

## Só que há um problema no experimento

O protocolo inicial treinava por exatamente **três épocas** e reportava o último epoch.

Não havia *best checkpoint*. Não havia *early stopping*. E, pelo menos na primeira execução, a loss ainda estava despencando quando mandamos o treinamento parar.

Então há uma hipótese muito simples que precisa morrer antes de começarmos a aumentar o cérebro:

> talvez os modelos estejam apenas subtreinados.

Eu já tinha preparado experimentos com 5.000 e 10.000 neurônios. Mas aumentar a mosca agora misturaria duas perguntas:

1. mais capacidade ajuda?;
2. três épocas eram insuficientes?

É melhor responder uma de cada vez.

## Tagger v2: mesma mosca, mais tempo para aprender

A segunda rodada mantém exatamente o que importa congelado:

- mesmos 512 neurônios;
- mesmos 64 neurônios de entrada;
- mesmos dados;
- mesmas cinco seeds;
- mesmo MaleCNS;
- mesmo controle embaralhado;
- mesmo byte-only;
- mesma dinâmica recorrente.

Só muda o regime de treino:

```text
máximo: 30 epochs
mínimo: 5 epochs
best checkpoint por F1 de validação
early stopping: patience 5
redução de learning rate em plateau
```

Além do F1, agora registramos o `best_epoch` de cada modelo em cada seed.

Esse número por si só já responde uma pergunta interessante. Se os melhores checkpoints aparecerem em epochs 8, 12, 17, fica claro que o protocolo de três épocas estava truncando o treinamento. Se quase tudo atingir o melhor resultado no epoch 2 ou 3, essa desculpa desaparece.

A validação continua sendo usada para escolher checkpoint. Portanto esse novo resultado ainda **não** será a estimativa final do modelo. O `test.jsonl` continua intocado para uma futura rodada confirmatória.

## A parte que eu quero descobrir

Há pelo menos três histórias possíveis.

A primeira é a mais divertida: depois de treinar adequadamente, o MaleCNS começa a vencer de forma consistente o grafo embaralhado. Nesse caso temos uma razão real para investigar que propriedade da topologia biológica está ajudando.

A segunda é menos cinematográfica, mas ainda interessante: os dois reservoirs melhoram bastante e continuam empatados. Isso significaria que recorrência ajuda, mas **não há evidência de que seja necessário um cérebro de mosca**.

A terceira é igualmente útil: nem MaleCNS nem shuffled se afastam do byte-only. Nesse caso provavelmente estamos olhando para o lugar errado. Antes de jogar mais neurônios no problema, teremos que melhorar cobertura das janelas, entrada sensorial do reservoir ou a própria dinâmica.

Só depois disso faz sentido voltar à escala:

```text
512 → 1k/2k → 5k → 10k
```

## Por que bytes?

Uma pergunta óbvia é por que não dar ao connectoma embeddings produzidos por algum modelo de linguagem.

Justamente porque eu queria começar com o mínimo possível.

Se o input já viesse de um Transformer que sabe português jurídico, seria muito difícil saber o que a mosca acrescentou. Bytes + embedding pequeno criam uma interface quase bruta. O reservoir precisa transformar uma sequência local em algum estado temporal útil para o readout.

É um teste duro e provavelmente ineficiente. Mas é também um teste limpo.

## O resultado que eu não quero

Eu não quero terminar esse projeto com a frase:

> "um cérebro de mosca fez NLP".

Isso é fácil demais de dizer e difícil demais de justificar.

O resultado interessante seria muito mais específico:

> "mantendo tamanho, graus, pesos, input, readout, seeds e dados comparáveis, a organização real do MaleCNS produziu uma vantagem reproduzível sobre controles que destroem sua organização superior."

Ou então descobrir que isso é falso.

Os dois resultados me interessam.

Por enquanto, a evidência é simples: **a mosca consegue participar do cálculo, mas ainda não mostrou que sua topologia é especial para esta tarefa**.

E a próxima rodada já está desenhada justamente para descobrir se o primeiro experimento parou cedo demais.

---

Este experimento também está sendo mantido como um paper técnico vivo no repositório `franklinbaldo/papers`. O post continuará em draft enquanto o gate de treinamento v2 não estiver fechado; depois os resultados entram nos dois lugares sem apagar o baseline original.
