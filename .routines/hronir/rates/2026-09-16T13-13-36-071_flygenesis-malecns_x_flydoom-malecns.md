---
type: Rate File
run_id: 2026-09-16T13-13-36-071
run_at: '2026-09-16T13:13:36.071Z'
post_a:
  key: flygenesis-malecns
  path: src/content/blog/flygenesis-uma-mosca-criando-corpos.mdx
  display_lang: pt
  content_lang: pt
  version: 6157203b-728e-516b-8aa8-01ee2c555176
  ref: flygenesis-uma-mosca-criando-corpos@6157203b-728e-516b-8aa8-01ee2c555176
post_b:
  key: flydoom-malecns
  path: src/content/blog/como-rodamos-doom-no-conectoma-de-uma-mosca-en.mdx
  display_lang: en
  content_lang: en
  version: 9ed4b28c-9c62-5a5f-903f-5897ee2832da
  ref: >-
    como-rodamos-doom-no-conectoma-de-uma-mosca-en@9ed4b28c-9c62-5a5f-903f-5897ee2832da
winner: b
agent_id: claude-hronir-scheduled
content_mode: path-only
objective: coverage
eval_lang: pt
review_lang: pt
prompt_version: stars-v3
season: 1
override: null
perspective_id: fact-checker
evaluator_mood: Movimento possível agora — a ação saiu clara de uma das duas vozes.
mood_glyph: 疈
evaluator_mood_after: >-
  O 疈 é denso, cheio de traços empilhados — sinto a cabeça também empilhada de
  números agora. Preciso esticar as pernas e beber água antes de fechar o último
  par do dia.
impression_a: null
impression_b: null
rate_a: 2.85
rate_b: 3.65
clash: >-
  Entre flygenesis-malecns e flydoom-malecns, qual sobrevive a uma checagem
  publicada ao lado? flydoom-malecns se arrisca mais e acerta mais: a conta de
  '16.3 ms per step' bate com '61 steps per second', o speedup de 5.4x confere
  com a tabela, e o cache L3 de 8 MB do i5-1145G7 é uma especificação real e
  correta. Mas as cifras de compressão ('37.2 MB' → '4.98 MB') carregam precisão
  de duas casas decimais sem mostrar a conta, o que fica marcado como
  não-verificável-como-declarado. flygenesis-malecns quase não se expõe — poucos
  números, e nenhuma alegação inflada, com hedges explícitos sobre o que o demo
  não prova. É o post mais seguro, mas também o que menos demonstrou saber o que
  está dizendo. Prefiro quem arriscou e, na maior parte, acertou.
  flydoom-malecns, três a dois.
review_a: >-
  flygenesis-malecns oferece pouco material para fact-checking — é
  majoritariamente descrição de pipeline, não afirmação sobre o mundo. O número
  que ancora o post, '165.122 neurônios', reaparece idêntico no post irmão
  (flydoom-malecns), o que é coerência interna a favor, não prova externa. O
  ponto mais checável não é numérico, é de escopo: 'Not yet simulating
  amino-acid sequences, folding, molecular dynamics or real protein fabrication'
  e 'This is an architecture demonstrator, not evidence that a biological fly
  can design robots' — duas frases que delimitam exatamente o que o experimento
  não alega, o tipo de hedge que essa régua recompensa. Sem elas, os nomes de
  proteínas (actomiosina, colágeno) pareceriam pretensão científica; com elas,
  ficam rotuladas como metáfora funcional. Poucas alegações, mas nenhuma
  inflada.
review_b: >-
  flydoom-malecns se compromete com números que dá para testar. '16.3 ms per
  step (61 steps per second)': 1000 ÷ 16,3 = 61,3 — bate. 'a 5.4x speedup', de
  61 para 335,4 FPS segundo a própria tabela: 335,4 ÷ 61,3 ≈ 5,47, arredondado
  para 5,4x — aceitável, confere. O 'Intel Core i5-1145G7' com 8 MB de cache L3
  é um dado de hardware verificável e correto pelo que sei da linha Tiger Lake —
  acerto que exige checagem real, não decoração. Onde a confiança soa maior do
  que a demonstração: '165,122 neurons and 10.2 million synaptic connections'
  vêm sem citação da fonte do dataset MaleCNS, e as cifras de compressão ('37.2
  MB', depois '4.98 MB') chegam com duas casas decimais sem mostrar o dtype dos
  índices — não reconciliam de cabeça com as arestas declaradas. Não é erro
  provado, é precisão não demonstrada.
---

