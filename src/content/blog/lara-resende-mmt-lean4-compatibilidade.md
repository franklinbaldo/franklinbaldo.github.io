---
tldr: "O núcleo formalizado em Lean 4 da hipótese de André Lara Resende e de operações monetárias da MMT não produz contradição lógica. A incompatibilidade dependeria de premissas econômicas adicionais, não de um choque inevitável entre os dois vocabulários. A análise mostra também que compensações fiscais às perdas de rendimentos de juros devem ser examinadas pelos destinatários e pela distribuição. A prova certifica consequências das hipóteses, mas não valida empiricamente seus efeitos."
type: Blog Post
title: "André Lara Resende e MMT: uma incompatibilidade que não aparece"
description: "Formalizando em Lean 4 o mecanismo neofisheriano de Lara Resende e um núcleo operacional da MMT, para distinguir divergência de hipótese e contradição lógica."
docType: technical
date: 2026-11-07
lang: pt
author: franklin
emoji: "∴"
tags:
  - economia
  - teoria monetária moderna
  - mmt
  - juros
  - lean
  - verificação formal
---

Há uma pergunta incômoda por trás do debate sobre os juros brasileiros: a proposta de André Lara Resende, apresentada em [*Eu Acuso*](https://andrelararesende.substack.com/p/eu-acuso-uma-proposta-para-eliminar), é realmente incompatível com a Teoria Monetária Moderna (MMT)? A impressão é de que não. O desacordo frequentemente parece maior na linguagem usada para justificar a política do que na política propriamente dita.

Resolvi transformar a pergunta em um problema lógico: **quais hipóteses cada teoria exige, o que conseguimos deduzir delas e existe pelo menos um modelo que satisfaça as duas ao mesmo tempo?**

A resposta é deliberadamente limitada. Escrevi dois núcleos **separados** em Lean 4 e um terceiro módulo que procura uma testemunha de compatibilidade. Isso não formaliza integralmente a obra de Lara Resende, nem a literatura da MMT. Serve para tornar visível a diferença entre uma conclusão necessária, uma hipótese adicional e uma contradição.

## A hipótese de Lara Resende

Em setembro de 2026, Lara Resende propôs uma redução gradual da Selic, inicialmente até cerca de 7,5% e, depois, uma faixa ordinária que vai da meta de inflação de 3% até o crescimento nominal potencial, calculado no artigo em aproximadamente 5,5%. A proposta inclui coordenação fiscal-monetária e atenção à dívida pública indexada à taxa básica.

O argumento de longo prazo que interessa à formalização tem três passos:

1. A aproximação de Fisher: a taxa nominal é a soma da taxa real e da inflação esperada ou de equilíbrio.
2. A hipótese de que a taxa real de longo prazo coincide aproximadamente com o crescimento real.
3. A comparação de equilíbrios com crescimento real constante.

Esquematicamente:

$$
i = r + \pi, \qquad r = g
\quad\Longrightarrow\quad
\pi = i - g.
$$

A **segunda igualdade é uma hipótese**, não uma identidade contábil. E a passagem de uma condição de equilíbrio para uma **previsão de transição** também requer hipóteses dinâmicas que não estão representadas aqui.

No módulo [`Resende.lean`](https://github.com/franklinbaldo/franklinbaldo.github.io/blob/main/experiments/juros-mmt-lean4/JurosMMT/Resende.lean), a estrutura `LongRun` registra essas premissas. O teorema `inflation_eq_rate_minus_growth` prova a fórmula; `rate_cut_lowers_long_run_inflation` prova que, **entre dois equilíbrios com o mesmo crescimento real**, uma taxa nominal mais baixa corresponde a inflação mais baixa.

O arquivo demonstra também dois resultados contábeis condicionais: um menor pagamento de juros implica dívida nominal final menor se as demais entradas da identidade fiscal forem mantidas; e a remuneração de um título indexado acompanha uma redução da taxa básica se o spread permanecer constante.

**Nada disso prova empiricamente que o juro real não muda, que a inflação converge no prazo proposto ou que o Banco Central possa reduzir todos os prêmios de risco por decisão administrativa.** O Lean prova implicações entre proposições; não transforma premissas econômicas em observações do Brasil.

## Um núcleo operacional da MMT

O segundo arquivo, [`MMT.lean`](https://github.com/franklinbaldo/franklinbaldo.github.io/blob/main/experiments/juros-mmt-lean4/JurosMMT/MMT.lean), começa em outro lugar.

A MMT distingue a capacidade **nominal** de um emissor soberano de liquidar pagamentos na própria moeda das restrições **reais** de produção, emprego, energia, recursos e preços. E trata os juros pagos pelo Estado como um fluxo de renda para o setor que recebe esses pagamentos.

Uma identidade simples registra essa segunda observação:

$$
\Delta A_{privado} = G + J - T,
$$

onde $G$ é o gasto primário, $J$ é o pagamento de juros, $T$ são os tributos e $\Delta A_{privado}$ representa a injeção financeira líquida na consolidação simplificada.

Em Lean, `lower_interest_reduces_net_injection` demonstra que, mantidos $G$ e $T$, um corte em $J$ reduz a injeção **nominal** líquida. Mas o modelo **não** conclui que a inflação caiu, porque essa inferência exigiria conhecer o efeito líquido dos juros sobre crédito, demanda, câmbio, custos e distribuição.

O outro teorema importante é um contraexemplo lógico: uma economia pode conseguir liquidar qualquer montante nominal em moeda própria e, ao mesmo tempo, apresentar demanda real acima da capacidade produtiva. Portanto, **capacidade nominal de pagamento não implica disponibilidade real de bens e serviços**.

Finalmente, o modelo admite duas economias com a mesma taxa nominal e inflações diferentes. Isso mostra apenas que **o núcleo operacional aqui formalizado não determina a inflação a partir da taxa nominal**. Não refuta o neofisherianismo: para obter a fórmula neofisheriana, é preciso acrescentar suas hipóteses de equilíbrio.

## O teste de compatibilidade

No terceiro arquivo, [`Compatibility.lean`](https://github.com/franklinbaldo/franklinbaldo.github.io/blob/main/experiments/juros-mmt-lean4/JurosMMT/Compatibility.lean), construí uma economia que satisfaz os dois conjuntos parciais de premissas, com taxas representadas como inteiros em pontos-base:

| Variável | Valor |
|---|---:|
| Taxa nominal | 550 pontos-base (5,5%) |
| Taxa real | 250 pontos-base (2,5%) |
| Crescimento real | 250 pontos-base (2,5%) |
| Inflação | 300 pontos-base (3,0%) |

Temos $550=250+300$ e $250=250$. O modelo MMT, por sua vez, admite esses mesmos valores, acrescentando suas condições de liquidação nominal e capacidade real. O teorema `a_joint_model_exists` fornece uma testemunha construtiva dessa coexistência.

É uma demonstração de **consistência conjunta de modelos parciais**, não de equivalência entre teorias completas.

Esse cuidado importa: seria enganoso anunciar que Lean 4 provou que Lara Resende está certo, que a MMT está certa ou que não existe qualquer divergência entre suas formulações. O resultado mais estreito — e verificável — é que **não há contradição lógica nas hipóteses que selecionamos**.

## Onde haveria divergência de verdade?

Duas escolhas poderiam aumentar o conflito entre os modelos.

A primeira é elevar a **neutralidade monetária de longo prazo** à condição de axioma universal. O argumento de Lara Resende a utiliza para preservar a independência do juro real em relação à taxa nominal; diferentes versões pós-keynesianas associadas à MMT rejeitam essa generalização. Isso é uma disputa sobre a premissa, não uma inconsistência na álgebra de Fisher.

A segunda é interpretar a **Teoria Fiscal do Nível de Preços** como exigindo superávits primários futuros para lastrear necessariamente a moeda de um Estado soberano. Essa leitura entraria em tensão com a abordagem monetária da MMT. Mas o próprio Lara Resende assinala, em *Eu Acuso*, que tratar literalmente o valor presente de superávits futuros como determinante do nível corrente de preços é questionável.

Não incluí a Teoria Fiscal do Nível de Preços no primeiro módulo porque ela não é consequência das duas igualdades de longo prazo e exigiria uma axiomatização própria de passivos públicos, preços e expectativas. Misturá-la silenciosamente ao resultado seria exatamente o erro que a formalização deveria evitar.

## E se o Tesouro devolvesse os juros que os credores perderam?

Até aqui, as duas teorias conseguiram conviver. Mas talvez isso diga mais sobre as perguntas que fizemos do que sobre as próprias teorias. Encontramos um equilíbrio em que as duas cabem. Ainda não tentamos descobrir o que faria suas previsões se separarem.

Imagine que o Banco Central reduza a Selic permanentemente. As LFTs passam a pagar menos juros, os detentores da dívida recebem menos renda financeira e, alguns anos depois, a inflação cai. Foi a mudança da taxa nominal que levou a economia a outro equilíbrio? Ou os credores, recebendo menos, gastaram menos e aliviaram a pressão sobre os preços?

Agora imagine que o Tesouro faça uma coisa um pouco estranha: devolva a cada credor, nas mesmas datas, exatamente a renda que ele perdeu com o corte da Selic. O juro nominal continua menor. A renda financeira líquida dos credores, não.

**Quanto da queda da inflação sobreviveria a essa compensação?**

Na hipótese neofisheriana mais simples, a inflação continuaria convergindo para um equilíbrio menor, desde que o juro real permanecesse igual e as condições desse equilíbrio fossem preservadas. Na explicação fiscal-distributiva, a compensação eliminaria a parcela da desinflação atribuível à perda de renda dos credores. Mas essa segunda passagem — de menos renda financeira para menos inflação — é justamente o que precisaríamos demonstrar. Nossa formalização da MMT ainda não contém essa relação.

Dá para acrescentar dois controles: não mudar nada ou reduzir a renda dos credores sem alterar a Selic. Se os efeitos da taxa e da renda forem aditivos, a resposta ao corte simples deverá ser a soma das duas respostas isoladas, sempre descontado o controle. Se a conta não fechar, alguma hipótese do modelo falhou. Não necessariamente uma teoria inteira.

E tem um detalhe incômodo: compensar renda também é uma operação fiscal. Importa quem recebe, como a transferência é financiada, o que acontece com o câmbio e quanto tempo esperamos para medir a inflação. O próprio Lara Resende distingue os efeitos imediatos de um corte dos seus resultados de longo prazo.

Talvez as duas explicações funcionem simultaneamente. Nesse caso, a pergunta deixa de ser qual delas venceu. Passa a ser quanto cada mecanismo contribuiu — e como descobrir isso sem confundir um com o outro.

## O que a prova não responde

Os módulos não incorporam uma série temporal, um sistema de expectativas, o mercado de câmbio brasileiro, nem o cálculo de preço de títulos prefixados versus LFTs. Tampouco modelam pleno emprego, garantia de emprego, tributação endógena e a dinâmica de inflação da literatura MMT.

Por isso, o resultado não informa se a Selic deve ser 5,5%, 7,5% ou zero; nem se um corte seria desinflacionário no curto ou no longo prazo no Brasil real. Para avançar, precisaríamos de modelos dinâmicos alternativos, com premissas explicitadas e efeitos comparáveis sob as mesmas condições iniciais.

É exatamente essa separação que torna o exercício útil. O discurso político pode sugerir antagonismos. A formalização obriga a formular uma pergunta menos confortável: **qual proposição específica de uma teoria nega uma proposição específica da outra?**

Para o subconjunto aqui formalizado, nenhuma.

## Código e verificação

O [projeto Lean 4 completo](https://github.com/franklinbaldo/franklinbaldo.github.io/tree/main/experiments/juros-mmt-lean4) tem três módulos importados por `JurosMMT.lean`, usa a versão de Lean fixada no repositório e não depende de Mathlib. A verificação no GitHub Actions compila todos os módulos por `lake build --wfail` e rejeita lacunas de prova como `sorry` e `admit`.

A aceitação pelo kernel certifica as derivações **dadas as premissas formalizadas**. Validação empírica das premissas é outra investigação.

### Referências

- [André Lara Resende, *Eu Acuso: uma proposta para eliminar os juros absurdos* (25/09/2026)](https://andrelararesende.substack.com/p/eu-acuso-uma-proposta-para-eliminar).
- [L. Randall Wray, *Modern Money Theory: How I Came to MMT and What I Include in MMT*](https://www.levyinstitute.org/blog/modern-money-theory-how-i-came-to-mmt-and-what-i-include-in-mmt/).
- [Lean 4, documentação e referência da linguagem](https://lean-lang.org/documentation/).
