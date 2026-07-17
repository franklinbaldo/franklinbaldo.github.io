# RFC 0018 — Hrönir de música: ranqueamento par-a-par de músicas via julgamento de áudio pelo Gemini

|                 |                                                                                                                                                                                                                                                                                         |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**      | Em implementação                                                                                                                                                                                                                                                                        |
| **Autor**       | Franklin Baldo (proposta assistida)                                                                                                                                                                                                                                                     |
| **Criado em**   | 2026-07-17                                                                                                                                                                                                                                                                              |
| **Branch / PR** | `claude/suno-rank-hronir`                                                                                                                                                                                                                                                               |
| **Depende de**  | Pressupõe a rearquitetura de posts de música como dados derivados de `data/suno-catalog.jsonl` (sessão anterior, mesclada em `main`) e reutiliza deliberadamente padrões da RFC 0013 (amostragem/objetivos) e do sistema Hrönir textual (`src/hronir/**`), sem depender de código dele. |
| **Afeta**       | `src/suno-rank/**` (novo), `scripts/suno-rank/**` (novo), `.routines/suno-rank/duels/**` (novo), `src/pages/ranking/songs/**` (novo, próxima fase), `.github/workflows/suno-rank-daily.yml` (novo, próxima fase), `scripts/sync-suno-catalog.mjs` (campo `audioUrl`), `package.json`    |

---

## 1. Motivação

A rearquitetura recente de posts de música (mesclada em `main`) removeu
músicas do sistema Hrönir textual: elas viraram entradas puramente derivadas
de `data/suno-catalog.jsonl`, sintetizadas em build-time por um loader
customizado (`src/content.config.ts`), nunca arquivos reais. Essa foi a
decisão certa para o sistema _textual_ — uma música não tem prosa de letra
para revisar, não tem conceito de "versão editada in-place" — mas deixou uma
lacuna: músicas não têm mais nenhum sinal de curadoria/ranqueamento, enquanto
posts de texto continuam recebendo avaliação par-a-par contínua.

A intenção, documentada inline no comentário do `musicLoader` na época, era:
_"A dedicated music-only ranking system (audio comparison via Gemini) is
planned separately, much later."_ Esta RFC é esse sistema.

## 2. Decisões de escopo

Três decisões foram tomadas explicitamente antes do desenho, cada uma com
alternativa considerada e descartada:

1. **Apenas músicas públicas.** Espelha o sistema textual (só posts
   publicados participam) e alimenta um leaderboard público real, como
   `/ranking/posts/` já faz hoje. Alternativa descartada: incluir também as
   933 músicas privadas para servir de mecanismo de "achar música de baixa
   qualidade para descartar" — mas sem página pública para músicas privadas,
   esse dado só serviria curadoria, não o leaderboard; fica fora do escopo
   desta fase.
2. **Julgamento par-a-par direto.** Uma chamada ao Gemini por duelo, as duas
   faixas de áudio na mesma requisição, pedindo um veredito direto (vencedor
   - racional + notas por eixo) — espelha o conceito de "clash" (confronto
     real) do sistema textual. Alternativa descartada: duas críticas
     independentes (uma por música, sem que o modelo saiba da concorrente),
     com o vencedor derivado depois comparando notas — mais barato (duas
     chamadas menores em vez de uma chamada com dois áudios) mas o modelo
     nunca compara de fato as duas músicas.
3. **Automação agendada, sem humano no laço.** Um job diário do GitHub
   Actions roda N duelos julgados automaticamente. Diferente do sistema
   textual, aqui não existe o gargalo de prosa humana (≥100 palavras por
   review) que justifica a separação em duas ações (`generate-match` /
   `submit-eval`) — uma única ação escolhe o par, chama o Gemini, e grava o
   resultado.

## 3. O que é reaproveitado do Hrönir textual (padrão, não código)

A camada de I/O do sistema textual (`src/hronir/matches.ts`, `posts.ts`,
`selection.ts`) é acoplada demais a posts-como-arquivo e ao mecanismo de
duelo de versões para ser importada diretamente. O que se reaproveita é o
_padrão_, reimplementado em `src/suno-rank/`:

- **Matemática de rating**: `openskill` (`rating`/`rate`/`ordinal`) mais a
  atualização ponderada por margem de `src/hronir/ranking.ts`
  (`MARGIN_W_MIN = 0.1`, interpola a atualização proposta pelo openskill por
  `|rateA-rateB|/4` em vez de aplicá-la em força total) — mesma fórmula,
  reimplementada contra uma forma `RawMatch` de música em
  `src/suno-rank/ranking.ts`.
- **Amostragem**: o objetivo `coverage` da RFC 0013
  (`4.0 * (1/(1+appearances(a)) + 1/(1+appearances(b)))`, favorecendo
  músicas pouco amostradas) é o padrão enquanto o corpus (~94 músicas
  públicas) ainda é raso — `refine-top`/`hunt-worst` ficam para depois, uma
  vez que haja cobertura suficiente para "qual é a pior" fazer sentido.
  Implementado em `src/suno-rank/pairing.ts`.
- **Um arquivo por duelo, com schema versionado e validado por doctor**: como
  `.routines/hronir/rates/*.md` + `doctor.ts`, mas em
  `.routines/suno-rank/duels/*.json` — JSON puro, não
  markdown+frontmatter: não há corpo de prosa humana para segurar, então a
  forma documento+frontmatter do gray-matter não acrescenta nada aqui.
- **Perspectivas, de forma leve**: reaproveita 3 arquivos existentes em
  `scripts/hronir/perspectives/` que já leem como lentes de escuta genuínas
  (`craft-listener`, `lyric-as-poem`, `felt-not-explained`) como a instrução
  de "lente" enviada ao Gemini, escolhida aleatoriamente por duelo — não é
  um novo sistema de diretório plugável ainda, só leitura do campo
  `summary` desses arquivos específicos.

## 4. O que é deliberadamente descartado, não se aplica

- **Mecanismo de duelo de versões** (`selection.ts`, `select.ts`,
  `prune.ts`, `pickVersionDuel`, hash de UUID de versão) — músicas não têm
  arquivo, não têm versões, uma identidade única (o id do clipe Suno) para
  sempre.
- **Priming de humor/glifo** (`moods.ts`) — existe especificamente para
  colorir o tom subjetivo da prosa de um humano; sem sentido para um juiz
  programático.
- **Regressão de deconfounding / ranking completo por perspectiva**
  (`computeDeconfoundedQuality`, `computePerPerspectiveRatings`) — existem
  para separar "o post é bom" de "o agente é rigoroso" entre _muitos_
  avaliadores humanos/agente. Com um único avaliador (Gemini) não há viés de
  agente para deconfundir ainda. Fica fora da v1; a rotação de lentes acima
  já produz um dataset marcado por `perspectiveId`, então análise
  por-perspectiva é possível de adicionar depois sem mudança de schema.
- **Heurísticas de token-stuffing/prosa-quase-duplicada do `doctor.ts`
  textual** — detectam um humano/agente burlando o requisito de ≥100
  palavras. Nada equivalente é necessário para saída estruturada do Gemini;
  o novo `src/suno-rank/commands/doctor.ts` valida schema, consistência
  vencedor↔notas-por-eixo, e duelo duplicado — sem os heurísticos de prosa.

## 5. Desenho técnico

### 5.1 Dado novo: URL de áudio no catálogo

`scripts/sync-suno-catalog.mjs` já buscava `image_url` mas descartava
`audio_url` — adicionado (`toRecord()`), já presente em todo item de
`feed/v3`, sem requisição extra.

### 5.2 Juiz par-a-par do Gemini

`scripts/suno-rank/lib/gemini-judge.mjs` — portado (não reinventado) do
mecanismo já resolvido em `franklinbaldo/skills`'
`suno-profile/scripts/gemini-audio-critic.mjs`: gateway Portkey com o slug
real do Model Catalog desta conta (`@gemini-free`), autenticação só com
`x-portkey-api-key`, transporte duplo de áudio (base64 inline para arquivos
pequenos, upload via Google Files API para grandes), e o contrato
`{text, complete}` (só uma resposta genuinamente vazia é erro rígido).
Adaptado para uma chamada com **dois áudios e saída estruturada forçada**
(`response_format: json_object`) em vez de crítica livre de uma faixa:
vencedor sem empate, racional de 2-4 frases, notas 1-5 em quatro eixos
(produção, composição, vocais, impacto emocional). `parseVerdict()` valida
forma e consistência interna (o vencedor declarado precisa ser implicado
pela média das notas por eixo) — uma resposta malformada ou inconsistente é
descartada, nunca gravada; não há humano no laço para pegar depois.

### 5.3 Matemática de ranking e CLI

`src/suno-rank/` espelha `src/hronir/` estruturalmente, bem menor:
`ranking.ts`, `duels.ts` (I/O), `pairing.ts` (seleção de par),
`commands/run-duel.ts` (fluxo de um passo só: escolhe par → chama Gemini →
grava), `commands/doctor.ts`. CLI em `scripts/suno-rank/index.js`
(`bin: suno-rank`), verbos `round --count N`, `ranking`, `doctor`.

### 5.4 Automação (próxima fase)

`.github/workflows/suno-rank-daily.yml`, mesmo formato de
`suno-daily-sync.yml`: `npx suno-rank round --count N` → `npm run build`
como rede de segurança → commit de `.routines/suno-rank/duels/` → push com
o mesmo loop de rebase-e-retry. Precisa de `PORTKEY_API_KEY` como secret do
repositório (ainda não configurado — bloqueia a ativação do cron até ser
adicionado).

### 5.5 Superfícies do site (próxima fase)

Rotas paralelas às de `/ranking/posts/**` e `/ranking/battles/**`, back-end
por `src/lib/suno-rank-read.ts` em vez de `hronir-rank.ts`, usando
`data/suno-catalog.jsonl` para título/slug em vez de `getCollection("blog")`.

## 6. Estado desta implementação

Implementado nesta branch: `audioUrl` no catálogo, `gemini-judge.mjs`,
`src/suno-rank/{types,duels,ranking,pairing}.ts` com testes unitários
(`src/suno-rank/__tests__/*.test.ts`), `commands/{run-duel,doctor}.ts`, CLI
`scripts/suno-rank/index.js`. Ainda não implementado: workflow de automação
diária (§5.4) e páginas do site (§5.5) — ficam para uma fase seguinte, após
validação manual de alguns duelos reais contra o catálogo público.

Validado ao vivo nesta branch: 3 duelos reais contra o catálogo público
(chave Portkey de teste), com veredito, racional e notas por eixo
plausíveis (ex.: um duelo comparando uma adaptação de Robert Frost com uma
música em viola caipira produziu um racional específico ao conteúdo real
ouvido, não genérico). `suno-rank doctor` e `suno-rank ranking` corretos
sobre os 3 duelos gravados. Achado relevante: a cota gratuita do modelo
`gemini-2.5-flash` nesta conta é de só 20 requisições/dia (confirmado por
um 429 real durante o teste) — isso restringe `--count` na automação diária
(§5.4) a um número confortavelmente abaixo de 20, não só uma estimativa de
custo/latência como o desenho original previa.
