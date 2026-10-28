---
type: Blog Post
title: "Todo mundo é matemático agora!"
description: "Um desenho animado de nove minutos sobre IA, Lean e o fiscal que só sabe fazer uma pergunta."
docType: essay
date: "2026-10-27"
lang: pt
translationKey: todo-mundo-e-matematico-agora
tags: ["matemática", "lean", "ia", "formalização", "vídeo"]
---

Fiz um desenho animado. Nove minutos, em português, para o Clube dos Silveira Baldo. É uma comédia sobre IA e matemática, e o protagonista é um assistente de provas com sotaque francês.

<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%;margin:1.5rem 0;">
  <iframe src="https://www.youtube.com/embed/OOsrkzIuorM" title="Todo mundo é matemático agora! — animação sobre IA e Lean" loading="lazy" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen></iframe>
</div>

A premissa cabe numa linha: a matemática foi, durante séculos, um clube com porteiro, e o porteiro acaba de perder o controle da portaria. Hoje qualquer pessoa pode ter uma ideia, explicar para uma IA com as próprias palavras e sair com definições, hipóteses, uma conjectura e um esboço de prova. É como ter um colega de matemática que nunca se cansa das suas perguntas.

O problema, e o vídeo inteiro mora nele, é que a IA erra. E erra com uma confiança espetacular.

## O fiscal

Aí entra o [Lean](https://lean-lang.org/). Para quem nunca esbarrou nele: é uma linguagem em que você escreve uma afirmação matemática e a demonstração dela de um jeito que o computador consegue conferir, passo a passo, se cada inferência respeita as regras. Não é uma IA. Não tem opinião. Não se impressiona. Se falta um passo, ele recusa, e diz qual.

No desenho ele virou um fiscal de repartição, com uma pergunta só: *cadê a prova?* A IA diz que é óbvio. Óbvio não é prova. A IA pede que confie nela. Confiança também não é prova. A IA diz que viu num vídeo da internet — e eu achei graça de pôr essa fala num vídeo da internet.

A divisão de trabalho que o desenho tenta mostrar é essa: a IA sugere, o Lean confere. Uma é generosa e mentirosa; o outro é mesquinho e honesto. Juntos, funcionam melhor do que cada um sozinho. Não sei se essa é a forma final da coisa. Parece, pelo menos, a forma de agora.

## As provas são de verdade

Isso foi a parte que mais me importou, e talvez a que menos apareça para quem assiste.

Todo código Lean que está na tela é um arquivo real, compilado de verdade. A saída do terminal que o personagem mostra é a saída capturada da execução, não um texto que eu escrevi para parecer saída. Quando o desenho diz que "par mais dois continua par" foi verificado sem `sorry` e sem nenhum axioma, isso foi checado — tem um script no repositório que falha se aparecer `sorry`, `admit` ou `axiom` em algum arquivo aceito. E falha também se o fiscal *aceitar* o "é óbvio", porque essa cena depende de a prova preguiçosa ser recusada.

Seria esquisito fazer um vídeo inteiro sobre "não aceite afirmação sem prova" e mentir na tela. Ninguém ia perceber. Eu ia.

> me: faz um vídeo sobre rigor
> also me: precisa que o terminal seja de verdade
> also me: precisa de um teste que garanta que a prova errada continua errada

## A pegadinha

A cena de que eu mais gosto é a da festa. Você vai receber dez pessoas. A IA entende doze. Faz a conta: doze convidados, três coxinhas cada, trinta e seis coxinhas. O Lean confere e aprova, porque doze vezes três é mesmo trinta e seis.

Parabéns: você demonstrou, com rigor absoluto, a solução do problema errado.

É a lição que eu gostaria que sobrasse se o resto fosse esquecido. O verificador checa o que decorre das hipóteses. Ele não checa as hipóteses. A escolha do que formalizar continua sendo nossa, e é ali que mora quase todo o erro interessante — no direito isso tem nome antigo, que é a diferença entre a subsunção estar certa e o fato estar provado. O Lean é ótimo no primeiro. Do segundo ele não quer saber.

O resto do elenco gira em torno da mesma coisa, que é a mania inconveniente da matemática de obrigar a gente a dizer o que as palavras significam. A vovó tenta formalizar o bolo perfeito e trava na "pitadinha de sal". O advogado escreve "é proibido entrar com veículos no parque" e o fiscal pergunta se bicicleta é veículo, e patinete, e carrinho de bebê[^hart]. O tio do churrasco propõe o teorema de que o churrasco dele é o melhor do universo. Qual a definição de melhor? *O meu.*

## Como foi feito

Animação em [Remotion](https://www.remotion.dev/), que é React gerando vídeo quadro a quadro. As vozes são sintéticas, em português; os personagens usam vozes multilíngues lendo português, o que deu de graça um professor com sotaque alemão, um Lean francês e um tio italiano.

A trilha e os efeitos sonoros foram sintetizados do zero, sem samples. E a animação inteira é dirigida pela duração real da narração: se eu mudo uma fala, o áudio é regerado e as cenas se reposicionam sozinhas. Roteiro e animação deixaram de brigar.

O código, o roteiro e as provas estão [no repositório](https://github.com/franklinbaldo/franklinbaldo.github.io/tree/main/experiments/todo-mundo-matematico). O vídeo também está no [Internet Archive](https://archive.org/details/todo-mundo-e-matematico-agora-2026), para o caso de o YouTube um dia mudar de ideia.

O desenho termina dizendo que o próximo matemático pode ser você. É um final de desenho animado, e eu sabia disso enquanto escrevia. Mas a versão modesta dele eu sustento: da próxima vez que tiver uma ideia maluca, a pergunta "dá para formalizar isso?" ficou muito mais barata de fazer.

Tem cena pós-créditos. A vovó ganha.

[^hart]: É o exemplo do [H. L. A. Hart](https://plato.stanford.edu/entries/legal-positivism/) sobre a textura aberta da linguagem jurídica, o do "nenhum veículo no parque". Hart num desenho animado, com carrinho de bebê.
