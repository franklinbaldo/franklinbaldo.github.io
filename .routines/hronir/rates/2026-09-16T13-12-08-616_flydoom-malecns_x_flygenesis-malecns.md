---
type: Rate File
run_id: 2026-09-16T13-12-08-616
run_at: '2026-09-16T13:12:08.616Z'
post_a:
  key: flydoom-malecns
  path: src/content/blog/como-rodamos-doom-no-conectoma-de-uma-mosca.mdx
  display_lang: pt
  content_lang: pt
  version: 5c69d551-d1b6-5754-b2d2-8593f61cf7c4
  ref: >-
    como-rodamos-doom-no-conectoma-de-uma-mosca@5c69d551-d1b6-5754-b2d2-8593f61cf7c4
post_b:
  key: flygenesis-malecns
  path: src/content/blog/flygenesis-uma-mosca-criando-corpos.mdx
  display_lang: pt
  content_lang: pt
  version: 6157203b-728e-516b-8aa8-01ee2c555176
  ref: flygenesis-uma-mosca-criando-corpos@6157203b-728e-516b-8aa8-01ee2c555176
winner: a
agent_id: claude-hronir-scheduled
content_mode: path-only
objective: coverage
eval_lang: pt
review_lang: pt
prompt_version: stars-v3
season: 1
override: null
perspective_id: fact-checker
evaluator_mood: >-
  Glifo Chinese soa como salpico — fluxo de água que molha. Saio desse confronto
  com clareza: o que faz a diferença é o risco. Quem se expõe à possibilidade de
  estar errado vence quem nunca se compromete.
mood_glyph: す
evaluator_mood_after: >-
  O す tem esse gancho final que parece uma vírgula flutuando — sinto que ainda
  tenho fôlego para mais um par, mas a vista já cansou; vou pedir um intervalo
  de água antes do próximo.
impression_a: null
impression_b: null
rate_a: 3.7
rate_b: 2.9
clash: >-
  Qual dos dois sobreviveria a um fact-check publicado ao lado? flydoom-malecns
  se expõe mais: '16,3 ms por passo' bate com '61 passos por segundo' na conta,
  o speedup de 5,4x confere com os dois valores de FPS da tabela, e o cache L3
  de 8 MB do i5-1145G7 é uma especificação de hardware real e correta — três
  apostas verificáveis, três acertos. Mas as duas cifras de compressão (37,2 MB,
  depois 4,98 MB) chegam com precisão de duas casas decimais sem mostrar a
  conta, e não reconciliam de cabeça com os 10,2 milhões de arestas declaradas —
  falsa precisão possível, não confirmada. flygenesis-malecns quase não se
  expõe: poucos números, e os que tem são consistentes com o post irmão; em
  troca, é cuidadosamente honesto sobre o que é abstração ('actomiosina...
  módulos funcionais abstratos') em vez de emprestar peso científico indevido.
  Prefiro quem arriscou e acertou mais vezes do que errou. flydoom-malecns, três
  a dois.
review_a: >-
  flydoom-malecns faz afirmações que dá para testar por consistência interna, e
  a maioria passa. '16,3 ms por passo (61 passos por segundo)': 1000 ÷ 16,3 =
  61,3 — bate. 'Throughput saltou... para 335+ FPS... speedup de 5,4x': 335,4 ÷
  61,3 ≈ 5,47 — arredondado para 5,4x, aceitável, verificado. O 'Intel Core
  i5-1145G7' com cache L3 de 8 MB é um detalhe fácil de errar e a especificação
  bate com o que sei da linha Tiger Lake — checável e correto, sinal de checagem
  real, não decoração. Onde fico desconfiado: '37,2 MB' para a matriz CSR e
  depois '4,98 MB' final, ambos com duas casas decimais de confiança, sem
  mostrar a fórmula ou o dtype dos índices — não dá para reconciliar de cabeça
  com os 10,2 milhões de arestas informados, e isso é precisão que soa mais
  confiante do que demonstrada. Não chamo de errado; chamo de
  não-verificável-como-declarado.
review_b: >-
  flygenesis-malecns tem poucas frases checáveis — o texto é majoritariamente
  descrição de arquitetura, não afirmação factual. A cifra que se repete,
  '165.122 neurônios', é consistente com o post irmão (flydoom-malecns), o que é
  um ponto a favor: não há contradição entre as duas peças do mesmo experimento.
  O que mais me interessa aqui é o escopo da alegação: 'actomiosina, colágeno,
  elastina e adesina são módulos funcionais abstratos... Não estamos simulando
  sequência de aminoácidos, folding, dinâmica molecular nem fabricação real de
  proteínas' — isso é exatamente o tipo de hedge que essa régua recompensa: o
  autor delimita com precisão o que o experimento não é, em vez de deixar a
  palavra 'proteína' emprestar peso científico que o demo não sustenta. Mesma
  coisa com 'não uma demonstração de que uma mosca biológica sabe projetar
  robôs'. Sem números para checar, mas também sem nenhuma alegação inflada além
  do que o texto entrega.
---

