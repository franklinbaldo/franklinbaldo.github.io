# RFC 0005 — Hrönir como módulo TypeScript

|                 |                                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Status**      | Draft / Proposed                                                                                                               |
| **Autor**       | Franklin Baldo (proposta assistida)                                                                                            |
| **Criado em**   | 2026-06-09                                                                                                                     |
| **Branch / PR** | `claude/vibrant-volta-3giul0`                                                                                                  |
| **Depende de**  | RFC 0003 (migração de layout) — a Fase 0 da 0003 reescreve `posts.js`; migrar direto para `.ts` evita conversão dupla          |
| **Afeta**       | `scripts/hronir/lib/*.js`, `src/lib/hronir-rank.ts`, `src/content.config.ts` (tipos), `package.json` (runner), `tsconfig.json` |

> Este documento é a **etapa 1**: só o RFC. Implementação após o merge da RFC 0003.
> Mesmo padrão das RFCs anteriores.

---

## 1. Resumo

O Hrönir (`scripts/hronir/lib/`) é o subsistema mais complexo do repo e o
único sem tipos. Ele roda como CLI Node.js (`node scripts/hronir/index.js`) e
seus tipos são implícitos e duplicados: `RankEntry`, `MatchData`, `PostMeta` e
o schema `stars-v1` existem em comentários e duck-typing no código e como
suposições silenciosas em `src/lib/hronir-rank.ts`, que lê os mesmos dados
para o site. Essa fronteira invisível acumulou três custos concretos:

1. **Bugs silenciosos de tipo.** A RFC 0002 (de-confounding) introduziu campos
   novos nos rate files; o `hronir-rank.ts` ficou com uma versão desatualizada
   do schema até ser corrigido manualmente. Sem tipos compartilhados, qualquer
   campo novo repete esse ciclo.
2. **`commands.js` com ~1500 linhas.** Sem tipos, refatorar é arriscado — não
   há feedback antes do runtime. A RFC 0003 vai reescrever partes significativas
   de `posts.js` e `commands.js`; TypeScript tornaria essa reescrita segura.
3. **Pacote aninhado redundante** (removido pela RFC 0004): `scripts/hronir/`
   tentava ser um pacote separado porque precisava de isolamento — mas o
   problema real era a falta de tipos compartilhados, não o isolamento.

A proposta: converter `scripts/hronir/lib/*.js` para TypeScript, mover para
`src/hronir/`, e compartilhar tipos com o site diretamente.

---

## 2. Motivação — evidência concreta

### 2.1. Tipos duplicados hoje

`src/lib/hronir-rank.ts` (consumido pelas páginas de ranking) define:

```ts
interface RankEntry {
  key: string;
  mu: number;
  sigma: number;
  ordinal: number;
  appearances: number;
  // ...
}
```

`scripts/hronir/lib/ranking.js` produz o mesmo objeto sem tipagem. Toda
mudança no schema exige atualizar dois lugares — sem nada que aponte o segundo.

### 2.2. `getPostUuid` e `readPostMeta` divergentes

`scripts/hronir/lib/posts.js:getPostUuid` e
`scripts/lib/content.mjs:readPostMeta` (introduzido pela RFC 0004) lêem os
mesmos arquivos com propósitos sobrepostos. Em TypeScript, um único módulo
`src/hronir/posts.ts` poderia exportar para ambos os consumidores.

### 2.3. O timing perfeito é pós-RFC 0003

A Fase 0 da RFC 0003 reescreve `posts.js` de qualquer forma (nova lógica de
`listPosts`, `keyForPath`, `isCanonical`). Fazer essa reescrita diretamente em
TypeScript custa o mesmo e evita uma segunda conversão.

---

## 3. Objetivos e não-objetivos

### Objetivos

- Tipos compartilhados entre CLI e site: `MatchData`, `RankEntry`, `PostMeta`,
  schema `stars-v1` — definidos uma vez, usados em ambos.
- `commands.js` refatorável com segurança de tipos.
- CLI continua rodando via `node` (sem build step separado, usando `tsx` ou
  Astro's own TS execution).
- `src/lib/hronir-rank.ts` importa tipos de `src/hronir/` em vez de duplicar.

### Não-objetivos

- Não adicionar um servidor HTTP, API REST, ou qualquer interface nova.
- Não mudar o schema `stars-v1` dos rate files (compatibilidade total).
- Não mudar comandos do CLI nem os npm scripts existentes.
- Não TypeScript estrito para os testes node (`--test`): manter `.js` ou usar
  `ts-node` conforme for mais simples.

---

## 4. Princípio de design

> **`src/hronir/` é o módulo; `scripts/hronir/index.js` é o CLI.**
> O módulo vive em `src/` porque o site Astro precisa importar seus tipos —
> não porque seja parte do site. O CLI é um wrapper fino que importa do módulo
> e é invocado pelo `npm run hronir:*`. Sem build step extra: o Astro já sabe
> processar TypeScript em `src/`.

---

## 5. Estrutura proposta

```
src/hronir/
  types.ts          Schema dos rate files (stars-v1), RankEntry, PostMeta, MatchData
  posts.ts          listPosts, keyForPath, isCanonical, getPostUuid, readPost
  matches.ts        listMatchFiles, readMatch, writeMatch, postKey, gitMtime
  ranking.ts        computeRatings, computeVersionRatings, ordinal, EWMA
  moods.ts          randomMood, moodGlyph
  perspectives.ts   listPerspectives, readPerspective
  commands.ts       init, continue, decide, editWorst, draftCommit, promote, doctor, migrate…
  index.ts          CLI entry — re-exports para o site + main() para o CLI

scripts/hronir/
  index.js          ← wrapper: import('../src/hronir/index.ts').then(m => m.main())
  lib/__tests__/    Testes mantidos em .js ou migrados para .ts
```

### 5.1. Runner: `tsx` via `node --import`

O CLI precisa executar TypeScript sem build. Opção mais leve:

```json
// package.json
"hronir": "node --import tsx/esm scripts/hronir/index.js"
```

`tsx` é um devDependency (zero impacto no bundle do site). O Astro já lida com
`src/hronir/*.ts` nativamente no build via `astro check` e `getCollection`.

Alternativa mais conservadora: usar o `ts-node` já disponível via `@astrojs/check`.
A verificar na Fase 0 qual resolve módulos ESM corretamente no Node 22.

### 5.2. Tipos compartilhados

```ts
// src/hronir/types.ts
export interface PostMeta {
  translationKey?: string;
  lang: "en" | "pt";
  draft?: boolean;
  publishDate?: Date;
  // ...
}

export interface RateFile {
  schema: "stars-v1";
  agent_id: string;
  run_at: string;
  post_a: PostSide;
  post_b: PostSide;
  winner: "a" | "b";
  rate_a: number;
  rate_b: number;
  // ...
}

export interface RankEntry {
  key: string;
  mu: number;
  sigma: number;
  ordinal: number;
  appearances: number;
  ewmaStars?: number;
}
```

`src/lib/hronir-rank.ts` passa a importar `RankEntry` de `src/hronir/types.ts`
e apaga sua cópia local.

---

## 6. Plano de implementação (faseado)

### Fase 0 — Infraestrutura e tipos (pós-RFC 0003 Fase 0)

- Adicionar `tsx` como devDependency.
- Criar `src/hronir/types.ts` com todos os tipos e schemas.
- Migrar `src/lib/hronir-rank.ts` para importar de `src/hronir/types.ts`.
- Atualizar npm scripts para usar `--import tsx/esm`.
- **Critério de aceite:** `npm test`, `npx astro check`, `npm run build`
  verdes; CLI operacional com `npm run hronir:ranking`.

### Fase 1 — Migrar módulos puros (sem side-effects)

Ordem recomendada (menor dependência → maior):
`types.ts` → `posts.ts` → `matches.ts` → `moods.ts` → `perspectives.ts` → `ranking.ts`

Cada módulo: converter para `.ts`, adicionar tipos, manter API pública idêntica.
Fase determinística — testes do ranking existentes garantem regressão zero.

- **Critério de aceite:** `npm test` verde após cada módulo; zero mudança de comportamento.

### Fase 2 — Migrar `commands.ts`

O módulo mais complexo (~1500 linhas). Migrar em sub-fases seguindo o padrão
da própria RFC 0003 (cada grupo de comandos verde antes do próximo):

1. Comandos de leitura: `ranking`, `worst`, `diagnose`
2. Comandos de sessão: `init`, `continue`, `decide`
3. Comandos de edição: `editWorst` → `draftWorst` (RFC 0003), `draftCommit`, `promote`
4. Comandos de manutenção: `doctor`, `migrate`, `end`

- **Critério de aceite:** sessão completa de 10 matches com `npm run hronir:init`
  e `npm run hronir:doctor` verdes.

### Fase 3 — Limpeza

- Apagar `scripts/hronir/lib/*.js` (substituídos pelos `.ts`).
- `scripts/lib/content.mjs` pode ser absorvido por `src/hronir/posts.ts` ou
  mantido como adaptador leve (a decidir — custo baixo em ambas as direções).
- Migrar testes para `.ts` se a complexidade de setup for aceitável.

---

## 7. Compatibilidade

- **Rate files:** inalterados (schema `stars-v1` vira tipo TypeScript, não muda
  o formato em disco).
- **npm scripts:** mesmos nomes; só o runner muda internamente.
- **URLs e site:** `src/hronir/` é código de infra; nada novo é publicado.
- **CI:** `npx astro check` já cobre `src/hronir/` (está dentro de `src/`).

---

## 8. Alternativas consideradas

- **Manter `.js` com JSDoc types.** Resolve a autocomplete no editor mas não
  pega erros em CI (`astro check` não cobre `scripts/`). Rejeitado: sem check
  de CI, tipos derivam igual ao que acontece com convenções em prosa (RFC 0004).
- **npm workspaces para `scripts/hronir/`.** Formaliza isolamento mas mantém
  o problema de tipos duplicados. Mais burocracia, mesmo custo. Rejeitado.
- **Deixar em `scripts/hronir/` como `.ts` + `tsc` próprio.** Separa o CLI
  do site (bom) mas exige build step extra e um `tsconfig` adicional. E o
  problema central (tipos duplicados com `src/lib/`) não é resolvido. Rejeitado
  em favor de `src/hronir/`.
- **Mover depois da RFC 0003 vs. antes.** Mover antes exige duas reescritas de
  `posts.js` (JS→TS agora, depois TS de novo para a nova lógica de paths). Mover
  depois é uma reescrita só: TS + nova lógica juntos. **Decisão: depois.**

---

## 9. Questões em aberto

1. **Runner:** `tsx` (recomendado) ou `ts-node`? Testar compatibilidade ESM
   no Node 22 na Fase 0.
2. **`scripts/lib/content.mjs` pós-migração:** absorver em `src/hronir/posts.ts`
   ou manter como adaptador? Se a RFC 0003 já reutiliza `content.mjs` nos
   scripts de build (não-hronir), manter faz sentido.
3. **Testes:** migrar `ranking.test.js` para `.ts` junto com a Fase 1 ou na
   Fase 3? _Leaning:_ junto com a Fase 1 (pois o teste usa os tipos diretamente).

---

## 10. Plano de execução da PR

1. **Commit 1 (este):** RFC `0005`.
2. Após merge da RFC 0003: **Fase 0** → **Fase 1** → **Fase 2** → **Fase 3**,
   cada fase em commit próprio, verde antes de avançar.
3. Merge com **merge commit**, conforme `CLAUDE.md`.

---

## Histórico de revisões

- **r0** (2026-06-09): versão inicial. Decisão: `src/hronir/` como localização
  do módulo; `tsx` como runner; timing pós-RFC 0003.
