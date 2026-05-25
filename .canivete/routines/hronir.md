---
name: hronir
description: Rodada completa de avaliação par-a-par e active sampling do blog.
checks:
  - shell: "bun run hronir:doctor"
    message: "A base de dados de partidas e posts do blog deve passar na verificação do doctor sem inconsistências."
---

## Step 1: Executar Rodada de Matches
```routine
call: hronir-match
while_json:
  file: hronir_session.json
  completed: "< target"
  skipRating: false
```
Execute todos os matches sugeridos pelo active sampling. O sistema continuará chamando a sub-rotina `hronir-match` de forma concorrente até que a meta de partidas da sessão atual seja alcançada.

## Step 2: Analisar e Editar o Pior Post
```routine
call: hronir-edit
```
Esta etapa identifica o post elegível de pior desempenho histórico, compila os contrastes com o top 3 e as críticas acumuladas das derrotas, e orienta a reescrita do post nas suas respectivas traduções.
