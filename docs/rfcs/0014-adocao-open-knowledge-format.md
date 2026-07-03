# RFC 0014 — Adoção do Open Knowledge Format (OKF) para o conhecimento interno do Hrönir

|                 |                                                                                                                                                                |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**      | Draft — implementação faseada nesta mesma branch                                                                                                               |
| **Autor**       | Franklin Baldo (proposta assistida)                                                                                                                            |
| **Criado em**   | 2026-07-03                                                                                                                                                     |
| **Branch / PR** | `claude/open-knowledge-format-spec-tnvtkv`                                                                                                                     |
| **Referência**  | [Open Knowledge Format](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing) (Google Cloud, jun/2026) |
| **Afeta**       | novo diretório `docs/okf/`, `CLAUDE.md`                                                                                                                        |

> Mesmo padrão das RFCs anteriores: primeiro o documento, depois a
> implementação faseada, cada fase verde antes da próxima. Merge com merge
> commit, nunca squash.

---

## Histórico de revisões

| Data       | Mudança         |
| ---------- | --------------- |
| 2026-07-03 | Versão inicial. |

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

| ID  | Questão                                                                             | Decisão proposta                                                                                |
| --- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Q1  | O bundle deve ganhar um script de validação (`check:okf`) análogo ao `check:links`? | Fora do escopo desta RFC — reavaliar se o bundle crescer além dos 9 arquivos iniciais.          |
| Q2  | Vale a pena rodar o visualizador HTML de referência do OKF sobre este bundle?       | Não agora — nenhuma necessidade de UI de grafo para 9 conceitos; reavaliar se o bundle crescer. |
