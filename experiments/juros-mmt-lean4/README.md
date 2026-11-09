# Juros brasileiros, Lara Resende e MMT — Lean 4

Três módulos pequenos, independentes de Mathlib:

- `JurosMMT/Resende.lean`: identidade de Fisher + hipótese `r = g`; pass-through de títulos indexados; dinâmica fiscal simplificada.
- `JurosMMT/MMT.lean`: contabilização de fluxos, liquidação em moeda própria e limites reais; contraexemplos à inferência de uma fórmula de inflação a partir **apenas** do núcleo MMT.
- `JurosMMT/Compatibility.lean`: testemunha comum com taxa nominal de 5,5%, crescimento real de 2,5% e inflação de 3%.

## Compilação

Requer `elan` e Lean 4 na versão definida em `lean-toolchain`:

```sh
cd experiments/juros-mmt-lean4
lake build --wfail
```

No GitHub, o workflow `lean4-monetary-models.yml` executa a compilação em PR/push. A compilação é o critério verificável de que o kernel aceitou as demonstrações — não é validação econômica ou estatística.

## Escopo epistemológico

- As taxas de juros/crescimento/inflação são inteiros em **pontos-base** (`550 = 5,5%`). Esta simplificação evita dependências matemáticas e perda de transparência nas hipóteses.
- As relações `i = r + π` e `r = g` são **assumidas**, não demonstradas empiricamente.
- O núcleo MMT é propositalmente **parcial**: não formaliza teoria de preços, emprego garantido, câmbio ou restrições jurídicas/institucionais.
- As conclusões da MMT formalizada não afirmam que juros menores reduzam inflação; apenas distinguem fluxo nominal, liquidação e capacidade real.
- O módulo de compatibilidade demonstra **satisfatibilidade conjunta** de hipóteses parciais, não equivalência de teorias completas.
- Não estão implementadas a Teoria Fiscal do Nível de Preços, trajetórias de transição, expectativas e testes de dados brasileiros. Isso impede afirmar que o modelo tenha demonstrado a política proposta.

Veja o artigo no blog: `/blog/lara-resende-mmt-lean4-compatibilidade/`.

**Fontes:** [Eu Acuso — Lara Resende (2026)](https://andrelararesende.substack.com/p/eu-acuso-uma-proposta-para-eliminar), [L. Randall Wray — MMT](https://www.levyinstitute.org/blog/modern-money-theory-how-i-came-to-mmt-and-what-i-include-in-mmt/).

## Experimentos discriminantes (2026-11-08)

Os módulos adicionais implementam **hipóteses condicionais**, não interpretações universais de MMT:

- `JurosMMT/NeoFisherian.lean`: impõe `Δi = Δr + Δπ`. Com `Δr = 0`, prova `Δπ = Δi`.
- `JurosMMT/FiscalTransmission.lean`: postula `ΔJ = exposição × Δi`, `ΔY = ΔJ + compensação` e `Δπ = sensibilidade × ΔY + outros`. A última equação é uma hipótese estilizada de transmissão fiscal inspirada na MMT — **não** um teorema geral da teoria.
- `JurosMMT/Identification.lean`: confronta ambos os mecanismos sob intervenções idênticas. Prova divergência no corte totalmente compensado e na transferência com juros constantes, convergência sob exposição unitária e efeitos heterogêneos para exposições zero e dois. Inclui os quatro braços de experimento com números sintéticos.

A compensação elimina **apenas** o canal de renda explicitamente modelado, mantendo os demais canais em zero por hipótese. Não há modelagem de financiamento, distribuição, substituição de portfólio, expectativa, credibilidade do regime ou câmbio. Os parâmetros são inteiros em unidades arbitrárias, **não** elasticidades estimadas ou percentuais do PIB. O experimento distingue duas especificações formais condicionais: observar o mesmo sinal de inflação não confirma a identidade do mecanismo, e uma divergência no modelo não refuta MMT ou o neofisherianismo empiricamente.

A CI compila `JurosMMT.lean` que importa todos os módulos; novas demonstrações somente estão verificadas depois do `lake build --wfail` passar na revisão correspondente.

### Identidade geral da divergência

Com a mesma variação da taxa nominal nos dois modelos, o novo teorema
`gap_decomposition` identifica precisamente a diferença de previsões:

```text
Δπ_fiscal - Δπ_neo =
    (sensibilidade * exposição - 1) * Δi
  + sensibilidade * compensação
  + outros_canais
  + Δr_neofisheriano
```

O teorema utiliza as relações assumidas de cada modelo e álgebra de inteiros.
Ele não estima os parâmetros nem define uma teoria completa de inflação.
O teorema `disagreement_iff_nonzero_gap` especifica o critério formal de
divergência: a diferença de previsões é distinta de zero.


### Identificação dos dois mecanismos sem confundir rubricas monetárias

O módulo `JurosMMT/HybridIdentification.lean` explicita um modelo de dois
coeficientes, deliberadamente **hipotético**:

```text
mudança_de_inflação = alfa * mudança_da_taxa + beta * mudança_da_renda_líquida
```

A interpretação de `alfa` é o efeito residual da taxa **mantida constante
a renda financeira medida** — não um efeito necessariamente neofisheriano.
`beta` é o canal condicional de renda, não uma lei geral da MMT.

O módulo exige invariância ao rótulo contábil: juros e transferências que
preservam o **mesmo total líquido para a mesma pessoa e data** não mudam a
previsão apenas porque a rubrica é outra. Alterar destinatários, condições,
tributação ou momento não é invariância de rótulo.

Os braços `(-5, 0)` e `(0, -10)` identificam separadamente `alfa` e
`beta` no modelo inteiro sintético. O quarto braço `(-5, -10)` fornece
uma **restrição que não foi usada no ajuste**:

```text
p_simples - p_compensado - p_renda + p_controle = 0
```

Uma interação entre taxa e renda pode violar esse contraste; o módulo traz
um contramodelo explícito. No sentido inverso, se toda variação de renda
for igual a `exposicao * variacao_taxa`, existem pares de parâmetros
distintos que geram as mesmas previsões para **todos** os cortes de taxas.
A questão de identificação não se resolve coletando mais cortes colineares.

Esses resultados são álgebra do modelo: não constituem estimação
econométrica, dados brasileiros ou prova causal do neofisherianismo.

## Recipient and period as first-class monetary coordinates

The independent module `JurosMMT/RecipientTimeFlows.lean` records each
nominal payment's **recipient, accounting period, signed amount, and
interest-versus-transfer label**. This module has no dependency on the
conditional neo-Fisherian/aggregate fiscal transmission models.

It formulates two distinct claims, not an economic equivalence by fiat:

1. **Non olet:** if labels are changed while recipients, dates, amounts,
   and the policy-rate input remain constant, the whole
   recipient-by-period **net income schedule** is unchanged. Any downstream
   predictor *defined to depend only on the rate change and that income
   schedule* has the same output, regardless of the payment's label.
   Splitting one same-recipient, same-date interest payment into lower
   interest plus a compensating transfer is an exact example.
2. **Equal aggregate is weaker than equal distribution:** different people
   or periods may receive the same total nominal payments, while the
   recipient-period income schedules differ. An explicitly hypothetical
   weighted-demand function gives a constructed counterexample to
   invariance under redistribution.

There is no new inflation law in this module. Effects on prices,
credit, asset valuation, tax, funding, capital gains and expectations are
not derived, and payment dates/recipient identifiers are simply formal
coordinates. The old aggregate intervention experiment remains a
separate, conditional model.
