# RFC 0011 — Taxonomia de gêneros musicais: separar estilo Suno de label de filtro

|                 |                                                                                                                                         |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**      | Implementado (r1) — Fases 0–3 concluídas via PR #525; 280 posts migrados, 23 gêneros canônicos, doctor validando                        |
| **Autor**       | Franklin Baldo (proposta assistida)                                                                                                     |
| **Criado em**   | 2026-06-13                                                                                                                              |
| **Branch / PR** | `claude/modest-euler-27ofmr` / #525                                                                                                     |
| **Depende de**  | RFC 0008 (music player UX — `genre` field introduzido)                                                                                  |
| **Afeta**       | `src/content.config.ts`, `src/content/blog/**` (280 posts de música), `src/pages/pt/musicas.astro`, `src/pages/music.astro`, `scripts/` |

> Mesmo padrão das RFCs anteriores: primeiro o documento, depois a
> implementação faseada, cada fase verde antes da próxima.
> Merge com merge commit, nunca squash.

---

## Histórico de revisões

| Data       | Mudança                                                                                      |
| ---------- | -------------------------------------------------------------------------------------------- |
| 2026-06-13 | Versão inicial.                                                                              |
| 2026-06-13 | Implementação completa: Fases 0–3 concluídas em PR #525 (schema, migração, gêneros, doctor). |

---

## 1. Resumo

O campo `genre` nos posts de música (`postType: music`) foi criado para
alimentar os chips de filtro na página `/pt/musicas/`. Na prática, o campo
foi preenchido com os **prompts de estilo do Suno** — descrições longas e
detalhadas como `"Genre: Atmospheric Indie Folk/Electronic. Tempo: 72 BPM.
Mood: Introspective"` — em vez de labels curtos e canônicos como `["folk",
"indie"]`.

O resultado verificado em build (`/verify https://franklinbaldo.github.io/pt/musicas/`):
**307 chips de gênero com texto de parágrafo inteiro**, completamente
inutilizáveis como filtro.

Esta RFC define:

1. Um campo separado `sunoStyle` para preservar a descrição longa do Suno.
2. Um campo `genre` restrito a labels curtos de uma taxonomia curada.
3. Migração dos 280 posts existentes.
4. Validação no schema e no `hronir:doctor`.
5. Gating de UI na página de músicas.

---

## 2. Diagnóstico

### D1. Campo `genre` preenchido com prompts Suno

O `content.config.ts` define `genre` como `z.array(z.string()).optional()`
— sem limite de comprimento. Quem populou os posts copiou o campo
`metadata.tags` da API Suno ou o bloco de estilo do prompt, gerando entradas
com 50–300 caracteres cada.

Exemplo real (`veu-do-infinito`):

```yaml
genre:
  - "Genre: Atmospheric Indie Folk/Electronic. Tempo: 72 BPM. Mood: Introspective"
  - cosmic
  - melancholic—ethereal synth layers
  - subtle piano arpeggios
  - tango-infused strings
  - >-
    fractal echoes in percussion. Borges-inspired narration: spoken-word
    verses blending poetic recitation with soft vocals
```

### D2. Número de chips gerados

O build atual produz **307 botões de gênero** na página `/pt/musicas/`
(um por valor único de `genre` em todos os 280 posts). A UI é inutilizável:

- Cada botão exibe o texto completo do prompt, quebrando a linha.
- 307 botões = scroll infinito só para ver os filtros.
- Filtrar por `"fractal echoes in percussion"` não tem semântica.

### D3. Dados úteis estão misturados com lixo

Alguns valores curtos já existem (`"acoustic"`, `"cosmic"`, `"folk"`) e são
aproveitáveis. A limpeza não exige reescrever do zero — exige separar o
sinal do ruído.

### D4. Sem validação de comprimento no schema

`z.array(z.string())` aceita strings de qualquer tamanho. Nada impede que o
campo seja repreenchido com prompts longos no futuro.

---

## 3. Solução proposta

### 3.1 Dois campos com responsabilidades distintas

| Campo       | Tipo                      | Propósito                                         | Max por item |
| ----------- | ------------------------- | ------------------------------------------------- | ------------ |
| `genre`     | `string[]` (curado)       | Labels de filtro UI — curtos, canônicos, PT ou EN | 40 chars     |
| `sunoStyle` | `string` (opcional, free) | Descrição longa de estilo/prompt para referência  | ilimitado    |

`sunoStyle` é um campo de texto livre (pode ser multiline YAML), preservado
para documentação e futuras funcionalidades (e.g. regeneração no Suno).
Não é exposto na UI de filtro.

### 3.2 Taxonomia canônica de gêneros

Lista fechada de ~30 labels. Novos gêneros só entram por atualização desta
RFC. Labels em PT por padrão; inglês quando o gênero não tem equivalente
estabelecido em PT.

**Gêneros brasileiros:**
`forró`, `baião`, `sertanejo`, `samba`, `bossa nova`, `MPB`, `axé`,
`funk carioca`, `pagode`, `tropicália`, `choro`, `maracatu`, `cateretê`,
`moda de viola`, `capoeira`

**Gêneros internacionais / fusão:**
`folk`, `indie`, `rock`, `pop`, `hip-hop`, `jazz`, `eletrônico`,
`ambient`, `clássico`, `experimental`, `spoken word`, `glitch`,
`art pop`, `soul`

**Labels descritivos permitidos (transversais):**
`instrumental`, `acústico`, `ao vivo`, `trilha sonora`

> A lista pode ser ampliada em revisões futuras desta RFC. O schema não
> valida contra uma enum fixa (para não bloquear CI em extensões futuras),
> mas o `hronir:doctor` avisa sobre labels fora da taxonomia.

### 3.3 Regras de validação

No `content.config.ts`:

```ts
genre: z
  .array(
    z.string().max(40, "genre label deve ter no máximo 40 caracteres")
  )
  .max(5, "máximo 5 gêneros por post")
  .optional(),

sunoStyle: z.string().optional(),
```

No `hronir:doctor` (warning, não erro):

- Avisa se algum label de `genre` contém dois pontos, ponto-e-vírgula ou
  vírgula (sinal de prompt colado).
- Avisa se algum label tem mais de 40 chars.
- Avisa se `genre` tem mais de 5 itens.

### 3.4 UI: gating dos chips

Em `musicas.astro` e `music.astro`, os chips só são renderizados quando:

```ts
const showGenreChips =
  allGenres.length >= 2 &&
  allGenres.length <= 25 &&
  allGenres.every((g) => g.length <= 40);
```

Se o gating falhar (e.g. dados corrompidos em produção), a galeria aparece
sem filtro — sem crash, sem chips quebrados.

---

## 4. Migração dos posts existentes

### Escopo

- **280 posts** com `postType: music` têm o campo `genre`.
- A migração aplica as regras: extrair labels curtos existentes, mover
  todo o resto para `sunoStyle`, preencher `genre` com 1–5 labels da
  taxonomia baseados no conteúdo do post (título, letra, contexto).

### Critério de atribuição de gêneros

Para cada post, ler: título, `sunoStyle` (o prompt migrado), letra e
contexto. Atribuir 1–3 labels da taxonomia que melhor descrevem o som.
Não é necessário cobrir todos os aspectos — um `["folk", "experimental"]`
é suficiente; não é um dicionário.

### Script de migração

Um script `scripts/migrate-genre.mjs` faz a passagem nos posts:

1. Concatena todos os valores atuais de `genre[]` em uma string e salva em
   `sunoStyle` (concatenada com `\n`).
2. Apaga `genre`.
3. Os labels limpos são preenchidos **manualmente** (ou por um agente com
   acesso ao conteúdo), post a post, após a migração mecânica.

A migração mecânica é separada do preenchimento semântico para garantir que
nenhum label longo sobreviva.

---

## 5. Fases de implementação

### Fase 0 — Schema + gating de UI (sem migração de conteúdo)

- Atualizar `content.config.ts`: adicionar `sunoStyle`, adicionar `.max(40)`
  e `.max(5)` no `genre`.
- Atualizar `musicas.astro` e `music.astro`: adicionar gating `showGenreChips`.
- Resultado: o build continua funcional; os chips simplesmente não aparecem
  (falha no gating de comprimento) até a migração ser feita.
- CI deve ficar verde. `astro check` vai falhar em posts com `genre` > 40
  chars → isso é esperado e indica o escopo da migração.

### Fase 1 — Script de migração mecânica

- `scripts/migrate-genre.mjs`: lê todos os posts com `postType: music`,
  move `genre[]` para `sunoStyle` (string), zera `genre: []`.
- Resultado: todos os posts passam no `astro check` (genre vazio é válido).
- CI verde. Chips não aparecem (sem dados de genre) — correto.

### Fase 2 — Preenchimento semântico dos gêneros

- Para cada slug de música, ler conteúdo + `sunoStyle` e atribuir 1–5
  labels da taxonomia.
- O preenchimento pode ser feito por agente (passando o conteúdo do post)
  ou manualmente.
- Recomendação: priorizar os posts com mais plays (campo `play_count` na
  API Suno) — os mais ouvidos devem ser filtráveis primeiro.
- Resultado: chips aparecem na UI com labels curtos e semânticos.

### Fase 3 — Validação no doctor

- Adicionar checks ao `hronir:doctor`:
  - Warning: `genre` com label > 40 chars.
  - Warning: `genre` com > 5 itens.
  - Warning: label contém `:`, `;` ou `,` (provável prompt colado).
- CI não quebra em warning — só em error. Isso evita bloquear PRs de hronir
  por posts ainda não migrados, se a Fase 2 for incremental.

---

## 6. Questões em aberto

| ID  | Questão                                                                                                       | Decisão proposta                                              |
| --- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Q1  | A taxonomia deve ser uma enum no schema (CI bloqueia labels fora dela) ou apenas advisory no doctor?          | Advisory no doctor — enum bloqueia extensões legítimas.       |
| Q2  | `sunoStyle` deve ser um campo `string` ou `string[]`?                                                         | `string` — concatenação facilita leitura no frontmatter.      |
| Q3  | O preenchimento semântico da Fase 2 é feito por agente (Jules/Claude) ou manualmente?                         | Agente com acesso ao conteúdo do post; revisão humana.        |
| Q4  | Os chips devem aparecer nas páginas de post individuais (`/pt/blog/[slug]/`) ou só na galeria `/pt/musicas/`? | Só na galeria — posts individuais não têm contexto de filtro. |
| Q5  | Após a Fase 2, a taxonomia deve ser publicada em `/pt/musicas/#generos` como índice navegável?                | Futuro — fora do escopo desta RFC.                            |
