# RFC 0014 — Adoção do Open Knowledge Format (OKF) para o conhecimento interno do Hrönir

|                 |                                                                                                                                                                                                                                                                                                                                               |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**      | Draft — implementação faseada nesta mesma branch                                                                                                                                                                                                                                                                                              |
| **Autor**       | Franklin Baldo (proposta assistida)                                                                                                                                                                                                                                                                                                           |
| **Criado em**   | 2026-07-03                                                                                                                                                                                                                                                                                                                                    |
| **Branch / PR** | `claude/open-knowledge-format-spec-tnvtkv`                                                                                                                                                                                                                                                                                                    |
| **Referência**  | [Open Knowledge Format](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing) (Google Cloud, jun/2026)                                                                                                                                                                                |
| **Afeta**       | `docs/okf/`, `CLAUDE.md`, `src/content.config.ts`, `src/hronir/{posts,commands,selection}.ts`, `src/lib/versions.ts`, `src/pages/**/v/[uuid].astro`, `astro.config.mjs`, `src/pages/{archive,pt/archive}.astro`, `src/components/PostCard.astro`, todo `src/content/blog/**` (503 arquivos), todo `.routines/hronir/rates/**` (1764 arquivos) |

> Mesmo padrão das RFCs anteriores: primeiro o documento, depois a
> implementação faseada, cada fase verde antes da próxima. Merge com merge
> commit, nunca squash.

---

## Histórico de revisões

| Data       | Mudança                                                                                                                                        |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-07-03 | Versão inicial — bundle `docs/okf/` descrevendo os conceitos do Hrönir.                                                                        |
| 2026-07-03 | r1 — escopo ampliado: os posts e os rate files passam a carregar literalmente o campo `type` do OKF (não só o bundle de documentação). Ver §7. |

---

## 1. Resumo

O **Open Knowledge Format (OKF)** é uma especificação aberta e vendor-neutral
publicada pelo Google Cloud: um bundle de arquivos Markdown com front-matter
YAML leve, um conceito por arquivo, organizados em diretório e interligados
por links relativos. A única exigência é o campo `type`; tudo o mais
(`title`, `description`, `resource`, `tags`, `timestamp`) é recomendado, não
obrigatório. O objetivo declarado é dar a agentes de IA (e a humanos) uma
forma de consumir conhecimento de domínio sem SDK, sem plataforma proprietária
e sem sair do controle de versão.

Isso já é, em espírito, o que o `CLAUDE.md` e o `scripts/hronir/README.md`
tentam fazer em prosa contínua: descrever para um agente os conceitos do
sistema Hrönir (sessão, match, rate file, ranking, seleção, perspectivas,
CLI). O que falta é a estrutura que o OKF formaliza — **um conceito por
arquivo, com metadata queryable e grafo de links explícito** — em vez de um
único documento monolítico.

Esta RFC adota o OKF para representar o conhecimento interno do Hrönir:
um bundle em `docs/okf/` com um arquivo por conceito central do sistema,
front-matter conforme a spec, e links cruzados entre eles e para as RFCs
que os definem.

---

## 2. Motivação

- **`CLAUDE.md` já documenta esses conceitos, mas como prosa linear.** Um
  agente que precisa só do schema do rate file, ou só do algoritmo de
  seleção, lê o arquivo inteiro (~450 linhas) para encontrar o trecho
  relevante. Um bundle OKF permite navegar direto ao conceito (`ranking.md`,
  `selection.md`) e seguir os links só onde precisar de mais contexto.
- **Front-matter estruturado é queryable; prosa não é.** Campos como
  `type`, `tags` e `resource` permitem que uma ferramenta (o visualizador
  de referência do OKF, ou um script local) liste "todos os Algorithm" ou
  "tudo relacionado a `tag: ranking`" sem parsing ad-hoc de Markdown.
- **O repo já tem 13 RFCs em prosa livre — sem um mapa.** `docs/okf/rfcs/index.md`
  vira o primeiro índice navegável e com metadata (status, tema) das RFCs,
  sem duplicar o conteúdo delas.
- **Custo de adoção é baixo.** OKF não exige SDK, servidor, nem dependência
  nova — é Markdown + YAML, o mesmo formato que o resto do repo já usa
  para posts e RFCs. Nenhuma migração é necessária: `CLAUDE.md` e os READMEs
  existentes continuam como estão; o bundle é um índice adicional.

### Não-objetivos

- **Não substitui `CLAUDE.md`** como fonte de instruções operacionais de
  sessão (comandos, constraints, exemplos passo a passo). O bundle documenta
  **conceitos**, não procedimento.
- **Não duplica o conteúdo das RFCs.** `docs/okf/rfcs/index.md` linka para
  `docs/rfcs/*.md`; a RFC continua sendo a fonte canônica de cada decisão.
- **Não adota o agente de enriquecimento nem o visualizador HTML de
  referência do OKF** — este repo não tem BigQuery nem necessidade de UI de
  grafo; a adoção aqui é só do **formato do bundle**, escrito à mão.

---

## 3. Desenho

### 3.1. Estrutura do bundle

```
docs/okf/
  README.md            # explicação humana do bundle (não é um "concept file")
  index.md              # raiz do bundle — type: Index
  concepts/
    index.md            # type: Index
    session.md           # type: Concept
    match.md              # type: Concept
    rate-file.md           # type: Data Schema
    ranking.md              # type: Algorithm
    selection.md             # type: Algorithm
    perspective.md            # type: Concept
  cli/
    index.md              # type: CLI
  rfcs/
    index.md                # type: Index — links para docs/rfcs/*.md
```

### 3.2. Front-matter

Cada arquivo de conceito segue o schema mínimo do OKF:

```yaml
---
type: Concept # único campo obrigatório da spec
title: ...
description: ...
resource: <caminho relativo ou RFC de origem>
tags: [hronir, ...]
timestamp: 2026-07-03T00:00:00Z
---
```

`resource` aponta para o arquivo-fonte real (ex. `src/hronir/ranking.ts`) ou
para a RFC que define o conceito, em vez de uma URL de console — não há
equivalente de "BigQuery console" neste repo; o arquivo de código/RFC é o
recurso canônico.

### 3.3. Links cruzados

Cada arquivo linka para os conceitos relacionados via Markdown relativo
(`[rate file](../concepts/rate-file.md)`), formando o grafo que o OKF
descreve. `rfcs/index.md` linka para cada `docs/rfcs/NNNN-*.md` existente.

### 3.4. Língua

Corpo dos arquivos em **português**, conforme a convenção do repo para docs
(`CLAUDE.md` §Convenções); valores de `type`/nomes de campo em inglês, como
a spec exige.

---

## 4. Fases de implementação

### Fase 0 — Bundle inicial

- Criar `docs/okf/README.md`, `docs/okf/index.md`,
  `docs/okf/concepts/{index,session,match,rate-file,ranking,selection,perspective}.md`,
  `docs/okf/cli/index.md`, `docs/okf/rfcs/index.md`.
- **Critério de aceite:** `prettier --check` limpo; todo link relativo entre
  os arquivos do bundle resolve para um arquivo existente (checado manualmente,
  já que `check:links` hoje só cobre `src/content/blog/`).

### Fase 1 — Referência a partir do `CLAUDE.md`

- Adicionar `docs/okf/` à seção "Key directories" do `CLAUDE.md`.
- **Critério de aceite:** `prettier --check` limpo.

---

## 5. Alternativas consideradas

- **Não adotar, manter só `CLAUDE.md`/READMEs em prosa.** Funciona hoje, mas
  não dá navegação por conceito nem metadata queryable; e a RFC 0004 já
  estabeleceu o princípio de que convenção que importa ganha estrutura
  (naquele caso, checks; aqui, um formato aberto já desenhado para isso).
  Rejeitado — o custo de adoção do OKF é baixo o bastante para justificar.
- **Gerar o bundle automaticamente a partir do código** (como o agente de
  enriquecimento de referência do OKF faz para BigQuery). Este repo não tem
  um catálogo de dados equivalente; os conceitos do Hrönir mudam por decisão
  de design (via RFC), não por introspecção de schema. Escrita à mão é mais
  apropriada aqui. Rejeitado por ora.
- **Um único arquivo grande em vez de um bundle.** Contraria o princípio
  central do OKF (um conceito, um arquivo, identidade = path) e reproduz o
  problema que motivou a RFC (`CLAUDE.md` já é grande demais para navegação
  direta). Rejeitado.

---

## 6. Questões em aberto

| ID  | Questão                                                                                                 | Decisão proposta                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Q1  | O bundle deve ganhar um script de validação (`check:okf`) análogo ao `check:links`?                     | Fora do escopo desta RFC — reavaliar se o bundle crescer além dos 9 arquivos iniciais.            |
| Q2  | Vale a pena rodar o visualizador HTML de referência do OKF sobre este bundle?                           | Não agora — nenhuma necessidade de UI de grafo para 9 conceitos; reavaliar se o bundle crescer.   |
| Q3  | Os 16 arquivos com histórico de duelo já órfão **antes** desta RFC (§7.2) merecem investigação própria? | Fora do escopo — pré-existente, não introduzido aqui; abrir issue/RFC separada se for investigar. |

---

## 7. r1 — conteúdo real conformante ao OKF (não só o bundle de docs)

A versão inicial desta RFC (§1–6) só descrevia o Hrönir _sobre_ o formato
OKF, em `docs/okf/`. O dono pediu um passo além: que os posts do blog e os
rate files **eles mesmos** carreguem o campo `type` do OKF — a diferença
entre documentar o formato e efetivamente adotá-lo nos dados.

### 7.1. Conflito de nome: `type` já existia em posts

`src/content.config.ts` já definia `type` como a taxonomia de documento
(`essay | letter | fiction | technical | dialogue`), sem relação com o
`type` do OKF (que classifica o _tipo de concept_ — aqui, "Blog Post" ou
"Music Post"). Resolução: a taxonomia existente foi renomeada para
`docType`, liberando `type` para o OKF. `docType` some de ~150 arquivos
(mantendo a semântica idêntica) e reaparece com o valor idêntico sob o novo
nome; código consumidor (`src/pages/{archive,pt/archive}.astro`,
`src/components/PostCard.astro`) foi atualizado para ler `docType`.

Rate files não tinham conflito — ganharam `type: "Rate File"` diretamente.

### 7.2. Risco descoberto: `type`/`docType` mexem no hash de identidade de versão

`src/hronir/posts.ts` calcula a identidade de cada versão (`getPostUuid`)
como um UUIDv5 sobre o corpo normalizado **mais o front-matter**, exceto um
conjunto de campos de lifecycle (`UUID_EXCLUDED_FIELDS`, RFC 0010 §4.3).
`type`/`docType` não estavam nessa lista — logo, adicionar ou renomear esses
campos muda a identidade de toda versão que os carrega, órfãos do histórico
de duelos registrado nos rate files (`select()` passaria a tratá-los como
estreantes).

Verificado empiricamente antes de tocar em qualquer arquivo real:

1. **Fix 1 — excluir os dois campos do hash** (`UUID_EXCLUDED_FIELDS` ganha
   `"type"` e `"docType"`): impede que edições _futuras_ a esses campos
   voltem a causar essa churn. Insuficiente sozinho: o histórico gravado
   **antes** desta mudança já contava com `type: essay` (não excluído
   quando foi escrito), então renomear a chave ainda quebra a correspondência
   para os posts que já tinham a taxonomia preenchida.
2. **Fix 2 — terceiro fallback de UUID** (`getPostUuidPreOkfType`,
   mesmo padrão que `getPostUuidLegacy` já usa para a transição da RFC 0010):
   reconstrói o front-matter exatamente como estava antes desta migração
   (descarta o novo `type`, devolve `docType` para o nome original `type`) e
   aplica o conjunto de exclusão **anterior** (sem `type`/`docType`) —
   reproduzindo bit a bit o hash histórico. `versionStars()`,
   `resolveSidePath()`, o checker de versões-fantasma do `doctor`, o registro
   de poda (`PrunedEntry`) e as rotas `/v/[uuid].astro` (permalinks públicos)
   passam a tentar `uuid ?? legacyUuid ?? preOkfUuid` nessa ordem.

Verificação: dos 3498 pares post↔rate-file com duelo de versão existentes
no corpus, **3458 casam via um dos três UUIDs** após a migração completa
(zero regressão introduzida por esta RFC); os 16 remanescentes já estavam
órfãos **antes** de qualquer mudança desta sessão (drift de front-matter
pré-existente, não relacionado ao OKF — confirmado recomputando o UUID a
partir do conteúdo em `HEAD`, antes de qualquer commit desta RFC).

### 7.3. Migração aplicada

- **Posts** (`scripts/migrate-okf-post-type.mjs`): edição textual do bloco
  de front-matter (sem re-serializar YAML via `gray-matter` — verificado que
  isso reformataria aspas/scalars em 84/101 arquivos amostrados). Para cada
  um dos 503 arquivos (`.md`/`.mdx`) em `src/content/blog/`: insere
  `type: Blog Post` ou `type: Music Post` (conforme `postType: music`) como
  primeira linha; renomeia `type: <taxonomia>` → `docType: <taxonomia>` onde
  presente. Diff: exatamente 653 inserções (503 `type:` + 150 `docType:`
  renomeados), 150 remoções (as linhas `type:` originais) — nada mais.
- **Rate files** (`scripts/migrate-okf-rate-type.mjs`): mesma técnica
  (inserção textual, não `gray-matter.stringify` — que reformataria ~80/1764
  arquivos). Insere `type: Rate File` como primeira linha em cada um dos
  1764 arquivos em `.routines/hronir/rates/`. Diff: exatamente 1764 inserções,
  zero remoções.
- **`type` vira campo obrigatório** em `postSchema` (não mais `.optional()`)
  — os 503 arquivos já cobrem 100% do schema; `astro check` confirma 0 erros.
- **Escrita futura**: `scripts/generate-music-posts.mjs` grava `type: Music
Post` em posts novos; `src/hronir/commands.ts` (comando `decide`/
  `submit-eval`) grava `type: "Rate File"` em todo rate file novo — verificado
  com uma rodada real (`generate-match` + `submit-eval`, revertida após
  confirmar o campo).

### 7.4. Verificação

`prettier --check`, `check:hygiene`, `astro check` (0 erros), `npm test`
(39/39), `npm run build` (3855 páginas), `hronir:doctor` (0 inconsistências,
mesmos 15 avisos pré-existentes) e `hronir:select` (206 slugs, seleção
idêntica à anterior à migração) — todos verdes antes e depois da migração.
