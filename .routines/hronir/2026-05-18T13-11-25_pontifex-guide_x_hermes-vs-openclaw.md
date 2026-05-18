---
run_id: 2026-05-18T13-11-25
run_at: '2026-05-18T13:11:25Z'
match_index: 1
post_a:
  key: pontifex-guide
  path: src/content/blog/pontifex-architecture-implementation-guide.md
post_b:
  key: hermes-vs-openclaw
  path: >-
    src/content/blog/2026-04-04-hermes-agent-vs-openclaw-why-my-experience-got-so-much-better.md
winner: b
model: claude-sonnet-4-6
prompt_version: passion-v1
season: 1
override: null
---

O `hermes-vs-openclaw` vence por uma margem considerável. O `pontifex-guide`, mesmo reformulado como "notas de construção antes da construção", ainda é especulação arquitetural — o autor admite explicitamente que não rodou o sistema em escala, não sabe se o sinal bilateral é independente, não tem GPU. Isso é honesto, mas limita o alcance do texto.

O `hermes-vs-openclaw` faz algo diferente e mais difícil: é uma análise retrospectiva com dados reais. 81 sessões do OpenClaw com 1.414 chamadas de ferramentas e 137 erros documentados, comparadas com 3 sessões do Hermes com 225 chamadas e 22 erros. Os padrões de falha têm nomes concretos (`Missing required parameter: newText`, `kanban: command not found`). O comportamento pós-erro está descrito com precisão — o loop do OpenClaw contra o pivô imediato do Hermes.

A seção sobre a sessão do CausaGanha mostra o argumento em vez de apenas afirmá-lo: investigação em camadas, separação entre "atualização de catálogo" e "avanço real de backfill", instruções mais afiadas para o Jules com base no que o agente descobriu sozinho. O fechamento — "routine wins" — é ganho, não declarado. Isso é o que um post de blog deve fazer: mostrar o raciocínio de Franklin funcionando, não descrever uma arquitetura que poderia existir.
