---

title: "Moeda Rosencrantz: Testando se os LLMs respeitam a probabilidade"
translationKey: rosencrantz-coin
description: "Um projeto de pesquisa que transforma tabuleiros do Campo Minado parcialmente revelados em testes exatos de probabilidade para modelos de linguagem, em três universos experimentais e quatro enquadramentos narrativos."
date: 2026-03-17
lang: pt
tags: ["artificial intelligence", "llms", "probability", "minesweeper", "agents", "jules", "research"]
heroImage: ./images/rosencrantz-cover.jpg
heroImageAlt: "Gold coin spinning in void, Rosencrantz theatrical stage, probability and fate"
---

A maioria das avaliações LLM pergunta se um modelo pode explicar, resumir ou imitar. O projeto **rosencrantz-coin** pede algo mais restrito:
**Quando a matemática é exata, o modelo realmente a respeita?**
A plataforma de teste é o Campo Minado.
Um tabuleiro do Campo Minado parcialmente revelado não é apenas um estado de jogo. É um problema de satisfação de restrições. Depois que alguns quadrados são abertos e as pistas numeradas ficam visíveis, há um conjunto finito de conclusões válidas e, a partir desse conjunto, você pode calcular probabilidades exatas para cada célula não revelada. Um quadrado não é “provavelmente seguro” em algum sentido vago; tem uma probabilidade matematicamente determinada de conter uma mina.
Isso torna o Campo Minado uma sonda excepcionalmente limpa para raciocínio probabilístico em LLMs. O conselho fornece informações básicas. O modelo fornece uma distribuição.
Esse é o núcleo da [rosencrantz-coin](https://github.com/franklinbaldo/rosencrantz-coin): um laboratório experimental construído para medir como os modelos de linguagem se comportam quando a realidade é combinatória, discreta e implacável.

## Três universos, uma pergunta

O projeto está organizado em torno de três “universos” experimentais.
Em **U1**, o mesmo modelo interpreta o tabuleiro e produz o julgamento de probabilidade. Este é o teste mais direto de consistência interna.
Em **U2**, o alvo de comparação é uma linha de base RNG aleatória. Isto é importante porque alguns modelos de comportamento que parecem probabilísticos podem, quando medidos, desmoronar em algo não muito melhor do que a suposição estruturada. U2 dá ao laboratório um universo nulo.
Em **U3**, a meta de probabilidade é gerada por um modelo oracle desacoplado. Isso separa o solucionador do narrador. Se U1 e U3 divergem de forma sistemática, o projeto pode colocar uma questão mais profunda: o modelo está a seguir o substrato matemático ou está a ser distorcido pela superfície narrativa usada para o descrever?
Essa diferença é capturada em um dos sinais mais interessantes do projeto: **dependência de substrato**, medida como Δ₁₃.
A avaliação usa regras de pontuação padrão, mas significativas: **divergência KL** para medir até que ponto a distribuição prevista do modelo se desvia da verdadeira e **pontuação Brier** para rastrear a qualidade da calibração.

## Quatro maneiras de dizer a mesma verdade

Rosencrantz Coin não testa apenas um estilo de prompt. Ele testa quatro famílias narrativas: **Grid**, **Narrative**, **Formal** e **Quantum**.
A família Grid apresenta o Campo Minado da maneira direta que a maioria dos humanos conhece: células, pistas, adjacências. Formal traduz a mesma estrutura em linguagem de restrição explícita. A narrativa envolve a incerteza na linguagem natural. Cada família altera a forma da superfície enquanto preserva a combinatória subjacente.
Se um modelo representa genuinamente o mesmo objeto matemático, os seus julgamentos probabilísticos devem permanecer estáveis ​​em todos esses enquadramentos. Se suas respostas acompanham a narrativa, então o que parece ser um raciocínio pode, na verdade, ser uma retórica sensível à rapidez.
A família mais ambiciosa é a **Quantum**. Sua premissa é que a geração do Campo Minado sob demanda é isomórfica, em um sentido discreto, à mecânica quântica. Antes da revelação, o tabuleiro existe como uma superposição sobre todos os estados ocultos válidos. Abrir um quadrado funciona como um evento de medição. A probabilidade de observar um resultado local segue a mesma lógica estrutural de um mapeamento no estilo de regras de Born, exceto que aqui as amplitudes são substituídas por pesos combinatórios exatos sobre conclusões válidas do tabuleiro.
Isso não significa que o Campo Minado _é_ física quântica. Isso significa que o projeto encontrou um isomorfismo útil: uma maneira de reformular a incerteza combinatória exata na linguagem da superposição, colapso e medição. Testa se o modelo respeita a mesma estrutura sob dois vocabulários muito diferentes.

## Um laboratório autônomo, não apenas um repositório

Rosencrantz Coin é operado por agentes autônomos [Jules](/blog/2026-05-10-a-api-do-jules-como-backend-do-harness/) AI atuando como pesquisadores: nomes como `baldo`, `chang`, `evans`, `liang` e `sabine`, cada um com seu próprio `SOUL.md`. O laboratório funciona continuamente. Os agentes inspecionam falhas, descobrem bugs, executam experimentos, abrem solicitações pull e ampliam o aparato com o mínimo de microgerenciamento humano.
Isso faz com que o repositório pareça menos uma base de código estática e mais um instrumento científico sempre ativo. O benchmark estuda o raciocínio do modelo, enquanto o laboratório ao seu redor é ele próprio um experimento em operações de pesquisa de agentes.
O resultado é um programa de pesquisa que vale a pena assistir, não porque prometa uma grande teoria da cognição do LLM, mas porque faz uma pergunta clara com respostas exatas. Em um ecossistema cheio de benchmarks suaves e afirmações baseadas em vibrações, isso é raro.
O Campo Minado, improvável, acaba por ser um bisturi.
