---
type: Blog Post
title: "A dobra sem vinco existe"
description: "Uma conversa sobre a imagem impossível, interrompida horas depois pela chegada do próprio polinômio."
docType: essay
date: 2026-07-20
lang: pt
translationKey: the-crease-free-fold-exists
tags:
  - matemática
  - conjectura jacobiana
  - geometria algébrica
  - visualização
  - filosofia da matemática
emoji: "🌀"
---

Hoje, 20 de julho de 2026,<sup><a href="#nota-1" aria-label="Ver nota 1">1</a></sup> de manhã eu estava conversando com uma IA sobre problemas matemáticos com implicações filosóficas. Chegamos à Conjectura Jacobiana, e a pergunta que ficou foi esta: se ela fosse falsa, daria para fazer uma imagem que só passaria a fazer sentido depois que alguém encontrasse um contraexemplo polinomial de verdade?

A resposta parecia segura: dava para desenhar analogias — uma malha que se enrola, duas folhas que se sobrepõem, o mapa exponencial —, mas a imagem decisiva teria que esperar. A conjectura continuava aberta havia mais de um século. Sem o polinômio, todo “dobramento sem vinco” seria metáfora.

Algumas horas depois apareceu o polinômio.

<figure class="meme">
  <img
    src="https://api.memegen.link/images/atis/E_entao_eu_disse/localmente_invertivel_entao_globalmente_injetivo.png?width=600"
    alt="Meme And Then I Said: a primeira fala diz 'E então eu disse'; a segunda, 'localmente invertível, então globalmente injetivo'."
    loading="lazy"
  />
  <figcaption>Uma intuição razoável o bastante para virar conjectura. Não razoável o bastante para sobreviver ao polinômio.</figcaption>
</figure>

## O mapa

Considere $F=(P,Q,R):\mathbb C^3\to\mathbb C^3$, com

$$
\begin{aligned}
P &= (1+xy)^3z+y^2(1+xy)(4+3xy),\\
Q &= y+3x(1+xy)^2z+3xy^2(4+3xy),\\
R &= 2x-3x^2y-x^3z.
\end{aligned}
$$

O cálculo direto dá

$$
\det JF\equiv -2.
$$

Portanto, a derivada é invertível em todos os pontos. Não existe lugar em que a transformação amasse uma dimensão, transforme área em linha ou volume em superfície. Pelo teorema da função inversa, cada ponto possui uma pequena vizinhança na qual $F$ pode ser desfeita.

Mesmo assim, os três pontos distintos

$$
A=\left(0,0,-\frac14\right),\qquad
B=\left(1,-\frac32,\frac{13}{2}\right),\qquad
C=\left(-1,\frac32,\frac{13}{2}\right)
$$

são enviados para o mesmo ponto:

$$
F(A)=F(B)=F(C)=\left(-\frac14,0,0\right).
$$

Não é uma inferência delicada. É possível verificar as duas afirmações expandindo o determinante e substituindo as três coordenadas. Como o determinante constante pode ser normalizado para $1$ multiplicando uma coordenada de saída por $-1/2$, isso fornece um contraexemplo à Conjectura Jacobiana em dimensão $3$ — e, acrescentando coordenadas identidade, em todas as dimensões superiores.

O caso de duas variáveis permanece aberto.

## A visualização que ontem seria ficção

A aplicação completa vive em $\mathbb C^3$, isto é, em seis dimensões reais. Mas há uma sorte visual extraordinária: os coeficientes são reais, os três pontos são reais e a imagem comum também é real. A colisão já acontece na restrição

$$
F:\mathbb R^3\to\mathbb R^3.
$$

Isso permite desenhar o fenômeno exato, e não um substituto exponencial. A projeção usada abaixo é apenas a velha projeção de três dimensões para a tela; os pontos, as matrizes jacobianas e as igualdades são os do mapa polinomial. As setas entre domínio e imagem indicam a relação $F$, não trajetórias percorridas pelos pontos.

<div style="margin:1.75rem 0;border:1px solid var(--pico-muted-border-color);border-radius:1rem;overflow:hidden;background:#09090b;">
  <iframe
    src="/experimentos/dobra-sem-vinco/"
    title="Visualização interativa do contraexemplo jacobiano em dimensão 3"
    style="display:block;width:100%;height:760px;border:0;"
    loading="lazy"
  ></iframe>
</div>

[Abra a visualização em tela cheia](/experimentos/dobra-sem-vinco/).

## Uma curva que encontra o mesmo ponto três vezes

Há uma maneira ainda mais compacta de ver a colisão. Tome a curva

$$
\gamma(t)=\left(t,-\frac32t,-\frac14+\frac{27}{4}t^2\right).
$$

Ela passa por $C$, $A$ e $B$ quando $t=-1,0,1$, respectivamente. Ao compor o mapa com essa curva, duas coordenadas adquirem imediatamente o fator $t(t-1)(t+1)$:

$$
\begin{aligned}
Q(\gamma(t))&=\frac{9}{16}t(t-1)(t+1)(81t^4-84t^2+4),\\
R(\gamma(t))&=-\frac14t(t-1)(t+1)(27t^2+8).
\end{aligned}
$$

E a primeira coordenada vale $-1/4$ nos mesmos três valores. Uma linha atravessando o domínio encontra três lugares diferentes que o mapa não consegue distinguir.

## O que a imagem realmente diz

“Dobra sem vinco” ainda é uma metáfora, mas agora é uma metáfora rigorosamente ancorada.

Uma dobra comum explica a sobreposição por um ponto crítico: em algum lugar a superfície perde posto, achata ou muda de orientação. Aqui não há esse lugar. O determinante vale $-2$ em $A$, em $B$, em $C$ e em todos os demais pontos. Cada pequeno cubo continua tridimensional depois da transformação. A falha só aparece quando colocamos regiões distantes lado a lado e percebemos que elas receberam a mesma identidade global.

Isso corrige também uma intuição que eu tinha formulado cedo demais. A questão não é que “alguma informação infinitesimal foi esmagada”. Nenhuma foi. A informação perdida é outra: **de qual vizinhança globalmente distinta aquele ponto veio**.

Em símbolos:

$$
\text{reversibilidade em toda vizinhança}
\;\not\Rightarrow\;
\text{reversibilidade do espaço inteiro}.
$$

A conjectura dizia que a rigidez dos polinômios impediria essa traição. Em dimensão três, não impede.

## O que caiu — e o que não caiu

Caiu a Conjectura Jacobiana como afirmação para todas as dimensões. Caiu também a expectativa de que a condição jacobiana, combinada com a natureza polinomial, fosse suficiente para transformar controle infinitesimal em controle global.

Não caiu o teorema da função inversa: ele continua garantindo precisamente o que sempre garantiu, uma inversa local. Não caiu automaticamente o caso $\mathbb C^2\to\mathbb C^2$. E não surgiu uma contradição na matemática: surgiu um objeto que a conjectura dizia não poder existir.

<p id="nota-1"><small><sup>1</sup> O mapa foi <a href="https://x.com/__alpoge__/status/2079028340955197566">divulgado por Levent Alpöge</a>, que atribuiu a pergunta a Akhil e a produção do exemplo a Fable. A fórmula recebeu <a href="https://zzhang-iu.github.io/papers/direct-consequences-jacobian/">verificação pública independente</a>, mas a história da descoberta, a atribuição completa e uma apresentação acadêmica formal ainda estão sendo consolidadas. Este texto se apoia somente nas identidades algébricas diretamente verificáveis: $\det JF=-2$ e $F(A)=F(B)=F(C)$.</small></p>

Há uma ironia boa nisso tudo. A pergunta filosófica era se o todo poderia esconder uma ambiguidade ausente de cada parte local. A resposta chegou não como ensaio, mas como três pontos e um determinante:

> Não existe local do crime. Existe apenas o crime global.
