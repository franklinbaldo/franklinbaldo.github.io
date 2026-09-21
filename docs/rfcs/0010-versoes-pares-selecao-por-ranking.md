# RFC 0010 — Versões como pares: seleção por ranking e correções do ciclo de versões

|                 |                                                                                                                                                                                                                                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**      | Implemented (Fases 0–4, PR #451)                                                                                                                                                                                                                                                                                                |
| **Autor**       | Franklin Baldo (proposta assistida)                                                                                                                                                                                                                                                                                             |
| **Criado em**   | 2026-06-12                                                                                                                                                                                                                                                                                                                      |
| **Branch / PR** | `claude/festive-hawking-a0ccne`                                                                                                                                                                                                                                                                                                 |
| **Depende de**  | RFC 0003 (versões lado a lado — esta RFC **substitui** o mecanismo de promoção/poda dela), RFC 0009 (margin weighting simétrico)                                                                                                                                                                                                |
| **Afeta**       | `src/content.config.ts`, `src/content/blog/**` (migração `index.*` → `v-*`), `src/hronir/{commands,ranking,posts,matches}.ts`, `scripts/hronir/index.js`, `src/lib/hronir-rank.ts`, `src/components/RankingView.astro`, `src/pages/ranking/battles/*`, `scripts/generate-ranking-snapshot.mjs`, `src/generated/` (novo arquivo) |

> Mesmo padrão das RFCs 0001/0002/0003: primeiro o documento, depois a
> implementação incremental na mesma branch, fase a fase, cada fase verde
> (build + testes + `prettier --check` + `hronir:doctor`) antes da próxima.
> Merge com merge commit, nunca squash.

---

## Histórico de revisões

| Data       | Mudança                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-06-12 | Versão inicial.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 2026-06-12 | Review (Codex + autor): seleção idempotente, fallback publicável e acoplado, acoplamento atômico com qualificação de contrapartes, endereçamento `slug@uuid`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 2026-06-12 | Fases 0–4 implementadas (PR #451): migração `index.*` → `v-*`, seleção via JSON com histerese, caches de fase 3, limpeza §4.8 (teste em `src/hronir/__tests__/`, `collectDefenses` unificado, docs).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 2026-07-01 | Amendment (PR #862): `versions-selected.json` deixa de ser commitado (gitignorado, como `hronir_session.json`) e `select()` deixa de ter histerese. A regra 1 antiga ("mantém a seleção atual a menos que o desafiante vença por margem") dependia de memória entre execuções — inviável sem commit. Nova regra: por diretório, vence a versão publicável com mais estrelas entre as que já têm `n ≥ SELECT_MIN_DUELS` (piso estatístico, mantido); sem nenhuma candidata qualificada, cai para a versão sem `draftCreatedAt` (o original, nunca um rascunho fresco — ver correção de review abaixo). `SELECT_MARGIN` deixa de valer para a seleção exibida — sobrevive só como heurística de agendamento em `pickVersionDuel` (prioriza testar num idioma a revisão que já lidera no outro). O acoplamento de grupos de tradução (§4.4) é mantido, mas avaliado do zero a cada chamada em vez de incrementalmente: se nenhuma revisão comum qualificada existir, cada idioma decide sozinho e o `doctor` reporta o grupo como divergente — isso passou a aparecer com mais frequência do que antes (a histerese represava esse avanço independente; sem ela, um idioma com evidência suficiente publica sua melhor versão na hora, mesmo que o par ainda não tenha alcançado). `hronir:select` roda localmente (sem commit) logo no início de qualquer sessão, antes do primeiro comando que lê a seleção (`hronir:init` via `listEnglishWithKey()`, `hronir:draft-worst`) — um checkout novo não tem o arquivo. |
| 2026-07-01 | Correção de review (Codex, P1, mesmo PR #862): a regra 2 acima tinha caído para a versão **mais recente** publicável em vez do original — um rascunho recém-criado pelo `draft-worst` (zero duelos) virava a seleção exibida imediatamente, publicando conteúdo nunca testado e contradizendo o próprio "só depois de vencer duelos" deste RFC. Confirmado empiricamente: o rascunho de `quem-sou-eu`/`quem-sou-eu-en` desta mesma PR tinha sido selecionado sem nenhum duelo. Trocado para "vence a versão sem `draftCreatedAt`" (ver regra 2 revisada em §4.2); o acoplamento de grupo (§4.4) ganhou a mesma guarda — só avança para uma revisão comum se **cada** contraparte estiver individualmente qualificada, nunca por um par novo sem duelos.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

---

## 1. Resumo

Um code review completo do sistema Hrönir (7 ângulos de busca + verificação
individual de cada achado) confirmou **14 bugs de correção**, dos quais quatro
estão **ativos hoje** no ciclo de versões da RFC 0003:

1. Duelos de versão (mesma `key` dos dois lados) **corrompem o ranking por
   perspectiva**: `computePerPerspectiveRatings` não tem o guard
   `aKey === bKey` que `_computeRatings` tem (`ranking.ts:102` vs `:539`) — o
   `ratings.set()` do perdedor sobrescreve o do vencedor, então toda vitória
   de versão **rebaixa** o post. Há ~330 rate files de mesma key em 27 keys
   alimentando isso agora.
2. A auto-promoção compara o draft contra `canonicalStars ?? 0`
   (`commands.ts:2273`). Como o UUID de versão deriva do conteúdo, **qualquer
   edição na canônica órfã o histórico de duelos dela** — e aí qualquer draft
   com 2 duelos promove com margem "automática" (estrelas são sempre ≥ 1).
3. O arquivo morto `v-*-prev` que a promoção cria é contado como **draft
   pendente** pelo `draft-worst` (`commands.ts:1406`) — post já promovido
   nunca mais é editado — e o `pickVersionDuel` o seleciona como "draft mais
   fresco" (sort lexical + take-last, `:350`): a ex-canônica recém-demovida
   volta a duelar contra quem a venceu. Caso real no repo: `vos/` e `vos-en/`.
4. `pickVersionDuel` só olha canônicas EN (`listEnglishWithKey`), mas o
   `draft-worst` cria drafts para **todas** as traduções: ~30 drafts PT no
   repo hoje com **zero** rate files referenciando-os. Promoção atualiza o EN
   e deixa o PT para trás — as línguas divergem permanentemente.

O diagnóstico de fundo: a RFC 0003 introduziu versões, mas manteve uma
**canônica privilegiada** definida por convenção de nome de arquivo
(`index.*` vs `v-*` vs `v-*-prev`), com um swap destrutivo de 3 passos na
promoção. Cada consumidor reimplementa as convenções de nome de um jeito, e os
bugs moram exatamente nessas costuras.

Esta RFC adota o princípio oposto: **não existe versão canônica. Todas as
versões são pares; a mais bem ranqueada é a que o site mostra.** "Publicada"
deixa de ser identidade de arquivo e vira **resultado da seleção** — um
mapeamento gerado (`versions-selected.json`), recomputado a partir do ranking
e lido por um loader custom do Astro. Promoção e poda destrutivas desaparecem;
sobra um único mecanismo: ranquear e selecionar.

Além do redesenho, a RFC corrige os bugs independentes do modelo (sessão,
`decide`, CLI, exibição de duelos, snapshot) e ataca os achados de eficiência
e limpeza.

---

## 2. Inventário dos problemas confirmados

Todos verificados contra o código e os dados em disco; linhas referem-se ao
estado atual da `main`.

### 2.1. Ciclo de versões (o modelo de canônica é a causa-raiz)

| #   | Local                                | Defeito                                                                                                                                                  |
| --- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V1  | `ranking.ts:539` (e `:329`, `:430`)  | `computePerPerspectiveRatings` sem guard `aKey === bKey`; update do perdedor sobrescreve o do vencedor; appearances +2 por duelo. **Ativo** (~330 files) |
| V2  | `commands.ts:2273`                   | `canonicalStars ?? 0` + n≥2 só do desafiante → auto-promoção sem evidência após qualquer edição da canônica                                              |
| V3  | `commands.ts:2378`                   | `promoteFile` = rename → write → unlink, não-atômico; crash no meio deixa o post **sem canônica** (some do build) ou com UUID duplicado                  |
| V4  | `commands.ts:1406`, `:343-350`       | Arquivo `v-*-prev` conta como draft pendente (bloqueia `draft-worst` para sempre) e é escolhido como "draft mais fresco". **Ativo** (`vos`, `vos-en`)    |
| V5  | `commands.ts:343`                    | Duelos de versão só para canônicas EN; drafts PT órfãos (nunca duelam, nunca promovem, nunca podam). **Ativo** (~30 drafts PT)                           |
| V6  | `RankingView.astro:351`, `battles/*` | `winnerIsA = postAKey === winnerKey` é vacuamente true em duelo de versão → rates trocados, barra invertida, cards "X beat X". **Ativo**                 |
| V7  | `commands.ts:1329` vs `:393`         | Dois mecanismos divergentes de "última edição"; `previousVersion` nunca é escrito pelo fluxo atual → cooldown e staleness discordam                      |

### 2.2. Sessão e CLI

| #   | Local                                    | Defeito                                                                                                                                                           |
| --- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1  | `commands.ts:957-966`                    | `decide` grava o rate file **antes** do estado da sessão; retry após crash gera segundo arquivo com `run_id` novo → duelo contado em dobro                        |
| S2  | `commands.ts:288` (+9 sites)             | `hronir_session.json` escrito com `writeFileSync` cru (sem tmp+rename); leitores com `JSON.parse` sem try/catch; `init` sobrescreve sessão em andamento sem aviso |
| S3  | `commands.ts:835-863`                    | Parsing de flags do `decide` com `args[++i]` sem guard (ao contrário do `readFlagValue` do `index.js`)                                                            |
| S4  | `commands.ts:946-948`                    | `--after-mood` ausente é aceito em silêncio (grava `null`); mood >250 chars é truncado em silêncio em vez de rejeitado                                            |
| S5  | `index.js:78`, `:115`, `commands.ts:276` | `parseInt(x) \|\| 10` transforma `--matches 0` (e lixo não-numérico) em sessão de 10 partidas                                                                     |
| S6  | `ranking.ts:31` + `commands.ts:1475`     | Post deletado mantém linha no ranking, pode virar "worst" → `editWorst` grava sessão `need_edit` com `drafts: []` → beco sem saída (`end --force`)                |

### 2.3. Consumidores e dados

| #   | Local                              | Defeito                                                                                                            |
| --- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| C1  | `generate-ranking-snapshot.mjs:17` | Filtro de override **invertido** em relação ao `_loadMatchData` → `totalDuels` divergirá no primeiro override real |
| C2  | `posts.ts:85`                      | `listEnglishWithKey` ignora `draft: true` e `publishDate` futuro → post não-publicado pode entrar no torneio       |

### 2.4. Eficiência (confirmados, sem cache em lugar nenhum)

| #   | Local                                 | Custo                                                                                                              |
| --- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| E1  | `ranking.ts` geral                    | Cada `compute*` relê os ~1.200 rate files; `generateNextMatch` faz 4-5 passadas completas **por partida**          |
| E2  | `commands.ts:2193`                    | `promote --all` recomputa `computeVersionRatings()` + `findTranslations()` **por key** → ~280k leituras de arquivo |
| E3  | `matches.ts:59` via `commands.ts:399` | `gitMtime` = um `execFileSync("git", ["log", "-1", ...])` por candidato → até ~200 subprocessos por partida        |

### 2.5. Limpeza

Blocos `init`/`next` do `index.js` duplicados byte a byte (~30 linhas);
`collectDefensesForLoser`/`ForWinners` ~80 linhas copiadas e já divergidas;
~45 linhas de código morto pré-RFC 0003 (`ARCHIVE_DIR`, `githubBlobUrl`,
`isFileDirtyAtHead`); 18 sites de leitura/escrita inline do JSON de sessão;
shims de backfill de `perspective_id` que não disparam mais; teste encalhado
em `scripts/hronir/lib/__tests__/` (CLAUDE.md ainda documenta módulos lá).

---

## 3. Princípio de design

> **Não há canônica. Toda versão é um arquivo `v-*` par das outras; o que o
> site publica em `/blog/<slug>/` é a versão selecionada pelo ranking.** A
> seleção é um artefato gerado (`versions-selected.json`), não um nome de
> arquivo privilegiado. Mudar a versão exibida é mudar uma linha num JSON —
> atômico, reversível — nunca um swap de arquivos. Diferente de outros
> artefatos gerados do repo, este não é commitado (amendment 2026-07-01):
> `select()` é uma função pura de rate files + arquivos de versão, sem
> memória de execuções passadas, então o `prebuild` recomputa o resultado
> correto do zero a cada build.

Consequências diretas:

- `promote`, `promoteFile`, o arquivo `v-*-prev` e `isCanonical` **deixam de
  existir** → V2, V3 e V4 são eliminados por construção, não corrigidos.
- A "frescura" de uma versão é o timestamp no próprio nome do arquivo → V7
  colapsa num mecanismo único.
- Duelo de versão vira duelo comum entre dois arquivos do mesmo diretório,
  para **qualquer língua** → V5 eliminado.
- O eixo "versão" (UUID de conteúdo, já gravado em cada match como
  `post_a.version`) finalmente vira identidade de primeira classe, como o §2.2
  da RFC 0003 já pedia.

A restrição da RFC 0003 §2.1 continua valendo — todo `.md` em
`src/content/blog/` que casar com o glob da collection `blog` vira rota — e é
resolvida no loader, não no filesystem (§4.2).

---

## 4. Desenho

### 4.1. Layout de arquivos

Cada post continua em sua pasta `<slug>/`, mas **sem `index.*`**:

```
src/content/blog/vos/
  v-2026-06-08T14-02-11.mdx     ← versão (par)
  v-2026-06-10T02-12-45.mdx     ← versão (par)
src/generated/versions-selected.json
```

O nome `v-<timestamp>` já é o formato dos drafts atuais; a migração renomeia
cada `index.*` para `v-<timestamp-do-último-commit-do-arquivo>.*`. O slug (e
portanto a URL) continua sendo o nome da pasta — nada muda para o leitor.

### 4.2. Seleção: `versions-selected.json` + loader custom

Novo comando `hronir:select` computa, por diretório, a versão exibida:

```jsonc
// src/generated/versions-selected.json
{
  "_meta": { "schema": "selection-v1", "generatedAt": "..." },
  "vos": { "file": "vos/v-2026-06-10T02-12-45.mdx", "uuid": "..." },
  "vos-en": { "file": "vos-en/v-2026-06-10T02-02-50.mdx", "uuid": "..." }
}
```

Regra de seleção (amendment 2026-07-01: sem histerese — função pura do
ranking atual, recomputada do zero a cada chamada, sem depender de qual
versão estava selecionada antes):

1. **Vence a versão com mais estrelas entre as candidatas qualificadas**
   (publicáveis, com **n ≥ 2 duelos de versão** — piso estatístico contra
   promover uma versão nova por um único duelo de sorte). Empate desfeito por
   mais duelos, depois pelo arquivo mais novo.
2. **Sem nenhuma candidata qualificada** (diretório estreando, ou nenhuma
   versão publicável ainda acumulou duelos suficientes): vence a versão
   **sem `draftCreatedAt`** — o arquivo original, anterior a qualquer
   rascunho — nunca um rascunho fresco sem duelos. Se toda versão já tiver
   `draftCreatedAt` (original podado), cai para a mais antiga por nome.
   Corrigido em review (P1, PR #862): a regra antiga caía para a versão
   **mais recente** publicável, o que publicava qualquer edição do
   `draft-worst` na hora, com zero duelos — o oposto do "só depois de vencer
   duelos" que o resto do RFC promete. Sem publicável nenhuma, o slug fica
   fora do JSON.
3. A seleção nunca aponta para arquivo inexistente — `hronir:doctor` valida.

Grupos de tradução (§4.4) só avançam juntos para uma revisão comum quando
**cada** contraparte da revisão é individualmente qualificada (regra 1); um
par novo e não testado nunca vence por padrão, pelo mesmo motivo da regra 2.
Entre revisões comuns qualificadas, vence a de maior nota mínima entre os
membros. Sem nenhuma revisão comum qualificada, cada idioma decide sozinho
(regras 1/2 acima, sobre o próprio conjunto de versões, não restrito à
revisão comum) e o `doctor` reporta o grupo como divergente.

No Astro, a collection `blog` troca o glob `**/index.{md,mdx}` por um **loader
custom** que lê `versions-selected.json` e carrega exatamente um arquivo por
slug (id = nome da pasta, preservando todas as URLs). A collection
`blogVersions` (histórico em `/blog/<slug>/v/<uuid>`, noindex) passa a listar
todas as versões **exceto** a selecionada.

O arquivo **não é commitado** (amendment 2026-07-01: gitignorado, como
`hronir_session.json`). O build é reprodutível a partir dos rate files e dos
arquivos de versão, ambos commitados — `select()` é puro e determinístico,
sem I/O externo, então o JSON em si não carrega informação que não esteja já
no resto do repo. Ainda segue o padrão de dados persistidos do repo onde faz
sentido — schema `selection-v1`, validação no doctor — mas sem script de
migração e sem histórico via `git log` (não há commits para um arquivo
gitignorado).

`hronir:select` é **idempotente**: antes de gravar, compara o novo mapeamento
(`slug → file`) com o conteúdo atual do JSON ignorando `_meta.generatedAt`; se
o mapeamento é idêntico, não escreve nada — o arquivo não é dirtied e o build
é estritamente reprodutível. `generatedAt` só avança quando pelo menos uma
seleção muda.

### 4.3. Endereçamento `slug@uuid` e um único leitor de matches (corrige V1, V6, C1)

**Referências estáveis.** Sessões e rate files novos referenciam versões por
`slug@uuid` — e.g. `vos@3f2a9c1e-...` — em vez de path de arquivo:

- `slug` = nome da pasta = identidade da URL (estável por construção);
- `uuid` = UUID de conteúdo = identidade da versão, imutável porque arquivos
  de versão são cópias congeladas.

**Definição do UUID (corrigida).** O `getPostUuid` atual hasheia **só o corpo**
markdown — duas versões que diferem apenas no frontmatter (título, descrição)
colidem. Não é teórico: `riobaldo-e-o-aleph/index.mdx` e
`v-2026-06-10T12-09-24.mdx` têm hoje o mesmo UUID
(`fd4bbbbe-…`) — pós-migração seriam duas versões-pares com a mesma ref,
ambíguas para `computeVersionRatings`, para a seleção e para as rotas
`/v/<uuid>`. O UUID de versão passa a ser UUIDv5 sobre o corpo normalizado
**mais o frontmatter relevante à versão** (título, descrição, heroImage, lang
etc.), **excluindo os campos de ciclo de vida e de controle de publicação**
(`draftCreatedAt`, `draftCommittedAt`, `draftMsg`, `supersedes`,
`previousVersion`, `draft`, `publishDate`) — para que a migração, o
`draft-commit` e um despublicar/reagendar possam carimbar metadados sem mudar
a identidade (alternar `draft`/`publishDate` dispara o fallback da regra 1 do
§4.2; se isso mudasse o UUID, órfã exatamente as refs `slug@uuid` no momento em
que o fallback roda).
Complementos:

- o doctor **proíbe** duas versões no mesmo diretório com o mesmo UUID
  (arquivos de fato idênticos são um estado degenerado — a migração colapsa
  duplicatas exatas como o caso `riobaldo` acima, mantendo a mais antiga);
- o UUID legado (só-corpo), gravado nos rate files `stars-v1` como
  `post_a.version`, continua resolvível pelo leitor normalizado; a ambiguidade
  residual dele é limitação dos dados históricos, não do esquema novo.

O path do arquivo deixa de ser identidade e vira **cache de resolução**: o
leitor resolve `slug@uuid` varrendo as versões do diretório (UUIDs memoizados,
§4.7). Isso elimina a classe inteira de problemas de path quebrado:

- versão **podada** não quebra referência histórica — o `slug@uuid` continua
  nomeando exatamente aquele conteúdo (recuperável do git); o doctor para de
  precisar do hack `tolerableGone`;
- a migração §6 não invalida rate files antigos (o passo 4 vira só uma regra
  de leitura para o formato legado, não uma tolerância de erro);
- renomear/mover arquivos de versão deixa de ser uma operação perigosa.

Separador `@` (e não `#`): `#` não-quotado inicia comentário em YAML — os rate
files são frontmatter YAML, e `vos#3f2a` seria truncado para `vos` em
silêncio. `@` segue a convenção `pacote@versão` (npm) / `image@digest`
(Docker) e não colide com nada nos formatos do repo.

Os rate files novos gravam `post_a.ref: "slug@uuid"` (schema `stars-v2`,
conforme o padrão de dados persistidos: schema versionado + migração + check
no doctor); os campos legados (`path`, `key`, `version`) continuam legíveis
pelo normalizador abaixo — rate files antigos nunca são reescritos. O
`versions-selected.json` usa a mesma identidade (o `uuid` de cada entrada é a
seleção; `file` é cache). A sessão (`currentMatch`) também passa a guardar
`ref_a`/`ref_b`.

**Leitor único.** Hoje há **quatro** parsers independentes de rate file
(`_loadMatchData`, `computePerPerspectiveRatings` inline, `hronir-rank.ts
loadDuelData`, `latestMatchTimeByKey`) — e o guard de duelo de versão existe
em só um deles. A RFC consolida num único normalizador em `matches.ts`, que
também é o único lugar que entende os dois formatos (`stars-v1` por
path/key/version; `stars-v2` por `ref`):

```ts
export type NormalizedMatch = {
  aKey: string;
  bKey: string;
  aVersion: string | null;
  bVersion: string | null;
  winnerSide: "a" | "b"; // override já resolvido AQUI, uma vez só
  isVersionDuel: boolean; // aKey === bKey
  rateA: number | null;
  rateB: number | null;
  perspectiveId: string | null;
  runAt: Date | null;
  // ...
};
export function loadNormalizedMatches(): NormalizedMatch[];
```

Consumidores:

- `_computeRatings` e `computePerPerspectiveRatings` (e as trilhas de
  qualidade) filtram `!m.isVersionDuel` para o ranking **entre ensaios**;
- `computeVersionRatings` filtra `m.isVersionDuel` e ranqueia por
  `aVersion`/`bVersion` (UUIDs), nunca por key — é isso que alimenta o
  `hronir:select`;
- `hronir-rank.ts`, `RankingView.astro` e as páginas de battles recebem
  `winnerSide` pronto (fim do `winnerIsA = postAKey === winnerKey` vacuoso) e
  rotulam duelos de versão como tal ("vos: v2 venceu v1") em vez de
  "vos beat vos";
- `generate-ranking-snapshot.mjs` conta duelos com o **mesmo** resolvedor de
  override do ranking (fim do filtro invertido, C1).

A semântica do guard que a RFC 0003 §7 pedia ("mesma key dos dois lados
corrompe o OpenSkill") passa a ser **estrutural**: o tipo separa os dois
universos, e nenhum consumidor novo precisa redescobrir a regra.

### 4.4. Duelos de versão para todas as línguas e seleção acoplada (corrige V5)

`pickVersionDuel` deixa de partir de `listEnglishWithKey()` e passa a iterar
**todos os diretórios com ≥ 2 versões**, qualquer língua (PT, EN, músicas). O
desafiante é a versão não-selecionada com menos duelos (desempate: mais
recente). A avaliação segue a convenção de língua do repo: review na língua do
post (`lang` do frontmatter), que agora vale por construção porque o duelo é
sempre dentro de um diretório monolíngue.

**Seleção acoplada entre traduções (atômica).** Permitir que EN e PT
selecionem independentemente reabre a divergência de conteúdo que era o V5
original. Para evitar isso, `hronir:select` trata o grupo de traduções de um
mesmo `translationKey` como **unidade atômica**: quando a regra 1 qualifica
uma troca em qualquer diretório do grupo, o comando verifica se **todos** os
diretórios irmãos que contêm versões possuem uma contraparte da mesma revisão
(mesmo `draftCreatedAt`, campo gravado pelo `draft-worst` em todas as
traduções da mesma rodada) que **também se qualifica**: publicável, com
**n ≥ 2 duelos de versão** e `stars` **não inferiores** aos da versão
atualmente selecionada naquele diretório. A contraparte não precisa repetir a
margem de 0.3★ — o ônus da histerese é da língua que disparou a troca — mas
precisa de evidência própria de não-regressão: existir não basta, senão uma
vitória em PT publicaria um EN com zero duelos (ou pior que a seleção EN
vigente). Se alguma contraparte não se qualificar, **nenhum** membro do grupo
avança; para destravar rápido, o `pickVersionDuel` **prioriza** contrapartes
sub-dueladas de revisões já qualificadas em outra língua. Diretórios sem
nenhuma versão (tradução ainda não criada) não fazem parte do grupo para fins
de acoplamento. Resultado: as línguas de um ensaio **sempre avançam juntas** ou
não avançam — sem divergência parcial e sem regressão carona.

O acoplamento vale também para o **fallback por seleção inválida** (exceção da
regra 1 do §4.2): quando a seleção de um diretório é descartada por deixar de
ser publicável, a reseleção não escolhe cegamente a mais recente — escolhe a
versão publicável mais recente **cujo `draftCreatedAt` (ou revisão de
migração) tenha contraparte publicável em todos os irmãos com versões**, e
move o grupo inteiro para essa revisão. Só se nenhuma revisão comum publicável
existir é que o diretório cai sozinho para sua versão publicável mais recente
— publicar conteúdo válido tem precedência sobre paridade de línguas — e nesse
caso o `hronir:doctor` passa a reportar o grupo como **divergente**, para que
a próxima rodada de `draft-worst`/`select` o reconvirja em vez de a divergência
ficar invisível.

`prune` sobrevive, simplificado: remove versões **não-selecionadas** com
n ≥ 3 duelos de versão e ≥ 0.5★ abaixo da selecionada — nunca a selecionada,
nunca a última do diretório. Sem categoria "arquivo `-prev`": a ex-exibida é
só mais uma versão, elegível a poda pelos mesmos critérios de todas.

**Permalinks de versões podadas não viram 404.** A rota `/blog/<slug>/v/<uuid>`
só existe enquanto o arquivo existe (a collection `blogVersions` gera rotas do
que está em disco), então deletar o arquivo mataria um permalink já publicado —
e a recuperabilidade via git não socorre o site estático. O `prune` registra
cada `slug@uuid` removido num arquivo gerado e commitado
(`src/generated/versions-pruned.json`, schema `pruned-v1`), e o build emite
para cada entrada um **redirect** `/blog/<slug>/v/<uuid>/` → `/blog/<slug>/`
— a mesma maquinaria dos redirects legados de
`src/generated/blog-redirects.json`. Precisão sobre a promessa do §4.3: as
referências **internas** (`slug@uuid` em rate files) seguem válidas após a
poda; o permalink **público** degrada para redirect à versão viva, nunca para 404. O doctor valida que todo uuid podado está no registro.

### 4.5. Sessão robusta e idempotente (corrige S1–S6)

- **`readSession()`/`writeSession()`** únicos: escrita via
  `tmp + renameSync` (atômica no mesmo filesystem), leitura com try/catch e
  erro acionável ("sessão corrompida — rode `hronir:end --force`"). Substitui
  os 18 sites inline.
- **Idempotência do `decide` (S1):** o `run_id` passa a ser gerado em
  `generateNextMatch` e gravado em `session.currentMatch.run_id`. O `decide`
  usa esse run_id no nome do rate file — um retry **sobrescreve o mesmo
  arquivo** em vez de criar um segundo. Só depois da escrita o estado avança.
  O doctor ganha um check de pares duplicados por sessão como cinto de
  segurança para dados antigos.
- **Guard no `init` (S2):** com sessão em andamento, `init` aborta e instrui
  `end --force` (ou `next`, que já retoma). Nada de reset silencioso no meio
  da partida 7/10.
- **Parsing do `decide` (S3):** `readFlagValue` sai do `index.js` para um
  módulo compartilhado e o loop `args[++i]` do `decide` passa a usá-lo
  (rejeita valor ausente e valor começando com `--`).
- **`--after-mood` (S4):** obrigatório — ausência é erro, igual aos outros
  campos; > 250 chars é **rejeitado** com mensagem, nunca truncado.
- **`--matches` (S5):** parser numérico explícito — `0` é válido
  (sessão só-edição), não-número é erro; o fallback `|| 10` morre nos três
  lugares. O parsing de `init`/`next` é extraído para um
  `parseInitOptions(args)` único.
- **Worst fantasma (S6):** as linhas do ranking são filtradas para keys cujo
  diretório existe antes da escolha do worst; e `editWorst` se recusa a gravar
  sessão `need_edit` com `drafts: []` — se não criou rascunho, reporta e não
  trava o fluxo.

### 4.6. Elegibilidade publicada (corrige C2)

A entrada no torneio passa pelo mesmo `isPublished` do site (`draft: true` e
`publishDate` futuro ficam de fora), usando `readPostMeta` de
`scripts/lib/content.mjs` — que volta a ser, como a RFC 0004 declarou, a fonte
única de descoberta de posts. `posts.ts` mantém só o que é específico do
Hrönir (UUID de conteúdo, listagem de versões).

### 4.7. Eficiência (E1–E3)

- **Cache por processo:** `loadNormalizedMatches()` memoiza na primeira
  chamada (cada invocação do CLI é um processo novo — invalidação é trivial).
  Os `compute*` puros que já aceitam `raw` viram o caminho padrão. Resultado:
  **uma** passada pelos ~1.200 rate files por comando, não 4-5 por partida.
- **`gitMtime` em lote:** um único
  `git log --format=%ct --name-only -- src/content/blog` na inicialização do
  `generateNextMatch`, parseado para um `Map<path, mtime>` — substitui os
  ~200 subprocessos por partida. (No modelo novo o uso encolhe: a frescura
  primária é o timestamp do nome `v-*`.)
- **`getPostUuid` memoizado** por `(path, mtime)`; o pipeline remark inteiro
  só roda quando o arquivo muda.
- O hotspot E2 (`promote --all`) **desaparece com o promote**; o
  `hronir:select` computa `computeVersionRatings()` e o índice de diretórios
  **uma vez** e itera.

### 4.8. Limpeza (§2.5)

Remoção do código morto pré-RFC 0003 e dos shims de backfill; unificação de
`collectDefensesForLoser/Winners` num `collectDefenses(keys, side, opts)`
sobre o leitor normalizado do §4.3; teste movido para
`src/hronir/__tests__/`; `scripts/hronir/lib/` removido; CLAUDE.md
atualizado (diretórios, comandos `promote`/`draft-commit` substituídos por
`select`, constraint do `--after-mood`).

---

## 5. O que acontece com os comandos

| Hoje                                 | Depois                                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------------------------ |
| `hronir:promote --draft/--key/--all` | **Removido.** `hronir:select` recomputa a seleção (com histerese) e reescreve o JSON.      |
| `hronir:prune`                       | Mantido, simplificado (§4.4).                                                              |
| `hronir:draft-worst`                 | Mantido — cria `v-*` novo; sem checagem de "draft pendente" via `-prev` (não existe mais). |
| `hronir:draft-commit`                | Mantido (registra o rascunho; a seleção decide sozinha quando ele passa a ser exibido).    |
| `hronir:edit-worst`/aliases          | Mantidos como aliases.                                                                     |
| `hronir:doctor`                      | Ganha: validação `selection-v1`, pares duplicados por sessão, `after-mood` obrigatório.    |

Workflow de build: `hronir:select` roda antes do `astro build` via
`prebuild` (junto do `generate-translation-pairs`/`generate-redirects`); o
JSON gerado não é commitado (amendment 2026-07-01, ver histórico de
revisões) — sessões rodam `select` localmente para o próprio CLI e o
`doctor` funcionarem, mas o resultado fica de fora do `git add`.

---

## 6. Migração

Script one-off preservado em `scripts/oneoff/` (padrão do repo):

1. Para cada `index.{md,mdx}` em `src/content/blog/**`: renomear para
   `v-<timestamp do último commit do arquivo>.<ext>` via `git mv` (preserva
   história), e gravar no frontmatter um `draftCreatedAt` **compartilhado por
   grupo de tradução**: todas as ex-canônicas de um mesmo `translationKey`
   recebem o mesmo valor (e.g. o timestamp da migração). É esse identificador
   que o §4.4 usa para casar contrapartes — **valores ausentes nunca casam
   entre si** (dois arquivos sem `draftCreatedAt` não são tratados como par).
2. Gerar `versions-selected.json` inicial apontando cada slug para o arquivo
   renomeado (a seleção inicial = estado publicado de hoje; zero mudança
   visível no site).
3. Arquivos `v-*-prev` existentes (`vos`, `vos-en`): viram versões comuns.
   Quando a história de promoção permitir identificar as contrapartes (via
   `supersedes` da então-canônica e a mesma rodada de promoção), o script
   grava nelas um `draftCreatedAt` compartilhado; quando não, cada uma fica
   **sem** identificador de pareamento — continuam reselecionáveis pela regra
   1 dentro do próprio diretório, mas nunca participam de avanço acoplado
   (a regra "ausente nunca casa" impede parear versões não relacionadas).
   Validar que não são as selecionadas.
4. Rate files antigos (`stars-v1`) referenciam paths `index.*` que deixarão
   de existir: o leitor normalizado (§4.3) resolve o formato legado via
   key + `version` (UUID), que não mudam — é regra de leitura, não tolerância
   de erro. Rate files novos usam `ref: slug@uuid` (`stars-v2`) e são imunes a
   renames por construção.
5. Atualizar `src/lib/versions.mjs` (`fileForId`/`uuidForId`): atualmente
   resolve IDs de entradas `blog` para `<slug>/index.{md,mdx}`; após a
   migração, deve ler `versions-selected.json` para obter o path real da
   versão selecionada. Sem esta atualização, `uuidForId(c.id)` retorna `null`
   para toda entrada e os permalinks `/blog/<slug>/v/<uuid>/` perdem o redirect
   para a versão canônica vigente (404s para URLs previamente publicadas).
6. `npm run build` antes/depois deve produzir o mesmo conjunto de URLs
   (checado no CI da fase).

Rollback: a migração é um commit de renames + um JSON; reverter o merge
restaura o estado anterior por inteiro.

---

## 7. Fases de implementação

Cada fase é um commit (ou grupo) verde antes da próxima, na mesma branch.

- **Fase 0 — leitor único e correções de ranking** (sem mudar o modelo):
  `loadNormalizedMatches()` com `isVersionDuel`/`winnerSide`; guard nos
  per-perspectiva (V1); `hronir-rank.ts` + `RankingView` + battles via
  `winnerSide` e rótulo de duelo de versão (V6); snapshot com o mesmo
  resolvedor (C1); filtro de posts existentes no worst (S6). Testes de
  regressão com rate files de mesma key. **Esta fase já estanca a corrupção
  ativa do ranking por perspectiva.**
- **Fase 1 — sessão e CLI:** `readSession`/`writeSession` atômicos; guard do
  `init`; `run_id` pré-gerado e `decide` idempotente (S1); parsing
  compartilhado no `decide` (S3); `--after-mood` obrigatório e sem truncação
  (S4); `parseInitOptions` e fim do `|| 10` (S5); doctor com os checks novos.
- **Fase 2 — versões como pares:** migração §6; loader custom + collections;
  `hronir:select` com histerese; `pickVersionDuel` para todos os diretórios
  (V5); remoção de `promote`/`promoteFile`/`isCanonical`/`-prev` (V2, V3,
  V4); `prune` simplificado; elegibilidade via `isPublished` (C2);
  `previousVersion` aposentado como mecanismo (V7 — frescura = timestamp do
  arquivo).
- **Fase 3 — eficiência:** cache por processo, `gitMtime` em lote, memoização
  do `getPostUuid` (E1, E3). Meta mensurável: `hronir:continue` e
  `generateNextMatch` com **uma** passada pelos rate files; zero subprocessos
  git por candidato.
- **Fase 4 — limpeza e docs:** §4.8 + atualização de CLAUDE.md e README do
  Hrönir; nota de status nesta RFC e na 0003 (seções de promoção/poda marcadas
  como substituídas).

---

## 8. Riscos e alternativas consideradas

- **Loader custom vs. materializar `index.md` gerado.** Materializar (um passo
  de build copia a selecionada para `index.md`) manteria o glob atual, mas
  reintroduz exatamente o swap de arquivos que causa V3 e suja o working tree.
  O loader custom não toca o filesystem. Risco do loader: depende de API do
  Astro menos batida que o `glob()`; mitigação: o loader é ~30 linhas sobre o
  mesmo `glob()` interno, com teste de build no CI comparando o conjunto de
  rotas antes/depois.
- **Flapping da seleção.** Sem histerese, duas versões próximas trocariam de
  posto a cada sessão. A regra do §4.2 (margem ≥ 0.3★, n ≥ 2, empate fica com
  a atual) é a mesma barra da promoção de hoje — só que agora simétrica e
  reversível.
- **SEO/conteúdo duplicado.** Igual à RFC 0003: só a selecionada tem rota
  indexável; as demais vivem em `/blog/<slug>/v/<uuid>` com `noindex` +
  `rel=canonical`. A troca de seleção não muda a URL pública.
- **Dados históricos.** Rate files nunca são reescritos (princípio das RFCs
  anteriores). Toda compatibilidade com formatos antigos vive num único lugar
  novo: o leitor normalizado (§4.3).
