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
