---
name: hronir-match
description: Executa uma única partida (match) sorteada por active sampling.
---

## Step 1: Mostrar Post A e Sorteio de Perspectiva
```routine
run: "bun run hronir:continue"
```
Rode o comando a seguir no terminal para carregar o primeiro post do par (Post A) e obter as instruções da perspectiva sorteada sob a qual a partida deve ser avaliada.

## Step 2: Mostrar Post B
```routine
run: "bun run hronir:continue"
```
Rode o comando a seguir no terminal para carregar o segundo post (Post B) e relembrar o leitor sobre a perspectiva de avaliação.

## Step 3: Atribuir Notas e Registrar Decisão
```routine
run: "bun run hronir:decide --rate-a <rate_a> --rate-b <rate_b> --review-a \"<review_a>\" --review-b \"<review_b>\" --clash \"<clash>\""
inputs:
  - name: rate_a
    type: float
    description: "Nota para o Post A (1.00 a 5.00)"
    min: 1.00
    max: 5.00
  - name: rate_b
    type: float
    description: "Nota para o Post B (1.00 a 5.00)"
    min: 1.00
    max: 5.00
  - name: review_a
    type: string
    description: "Resenha do Post A (mínimo de 100 palavras)"
    min_words: 100
  - name: review_b
    type: string
    description: "Resenha do Post B (mínimo de 100 palavras)"
    min_words: 100
  - name: clash
    type: string
    description: "Confronto e veredito final"
    min_words: 50
```
Atribua notas (estrelas de 1.00 a 5.00, empate proibido) e redija as resenhas (mínimo de 100 palavras cada) e o confronto a partir da ótica da perspectiva sorteada.
