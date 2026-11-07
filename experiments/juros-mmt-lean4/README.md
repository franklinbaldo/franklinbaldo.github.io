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
