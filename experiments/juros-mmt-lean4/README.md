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
