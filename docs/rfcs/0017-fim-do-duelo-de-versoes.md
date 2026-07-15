# RFC 0017 — Fim do duelo de versões: obra, idioma e git como única genealogia

|                 |                                                                                                                                                                                                                                                                                                                                                                 |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**      | Proposta                                                                                                                                                                                                                                                                                                                                                        |
| **Autor**       | Franklin Baldo (proposta assistida)                                                                                                                                                                                                                                                                                                                             |
| **Criado em**   | 2026-07-15                                                                                                                                                                                                                                                                                                                                                      |
| **Branch / PR** | `claude/blog-git-versioning-lqxnfn`                                                                                                                                                                                                                                                                                                                             |
| **Depende de**  | Revoga o modelo de versões-pares da RFC 0010 e a migração single-file da RFC 0015 (nunca aplicada a nenhum slug real). Reduz a RFC 0012 a só o eixo `work` (§6). Retoma a intenção de simplificação da RFC 0016, indo além dela: RFC 0016 tratava a RFC 0015 como fase final; esta RFC substitui essa fase por remoção do mecanismo, não achatamento de layout. |
| **Afeta**       | `src/hronir/{posts,selection,history,matches,ranking,commands/*}.ts`, `src/content.config.ts`, `src/pages/{blog,pt/blog,ranking}/**`, `src/lib/{versions,history-pages,hronir-rank,i18n,languages}.{ts,mjs}`, `src/components/{VersionBanner,ArchivedContent}.astro`, `scripts/pregen.mjs`, `CLAUDE.md`, `src/content/blog/**` (154 diretórios legados)         |

---

## 1. Motivação

O Hrönir distingue hoje dois julgamentos estruturalmente diferentes sob o mesmo
mecanismo de duelo (RFC 0012 §1):

1. **duelo entre obras** (`work`) — qual texto é melhor, decide o que merece
   revisão;
2. **duelo entre versões** (`version`) — qual candidato do mesmo post deve
   ocupar a URL pública, decide o que publicar.

O duelo `work` é a essência operacional do sistema: aloca atenção editorial.
O duelo `version` é infraestrutura de publicação que a RFC 0003 introduziu
para evitar edição-no-lugar e conflitos de merge (seu motivo original,
preservado abaixo) — mas que desde então acumulou UUID de identidade,
`versions-selected.json`, `prune`, e (RFC 0015) um índice uuid→blob git,
permalinks de versão, e uma migração de layout que nunca foi concluída (59 de
213 slugs achatados, ver RFC 0015 §8).

A decisão desta RFC: **o problema que o duelo `version` resolve (onde o
rascunho em edição convive com o original) pode ser resolvido pelo próprio
git via PR normal** — um branch de trabalho e um commit atômico substituem
arquivo-irmão + seleção + poda. Isso elimina identidade de versão, seleção,
poda, achatamento e permalink de versão como conceitos do domínio do Hrönir,
sem eliminar o duelo `work`, que continua sendo como o sistema decide **o
que** revisar.

Três eixos ficam explícitos daqui pra frente, onde antes só existia `slug`
com convenções variáveis (frontmatter `lang`, sufixo `-en` no nome do
diretório, ou nenhum dos dois):

- **obra**: identidade estável, dada pelo `key` (RFC 0010 §4.3 —
  `translationKey` se presente, senão o nome do arquivo/diretório);
- **idioma**: uma representação atual da obra, uma por arquivo;
- **estado histórico**: um commit. Genealogia é `git log`, não um manifesto.

## 2. Decisões

1. **O duelo `version` é eliminado.** Não há mais UUID de identidade de
   versão, `versions-selected.json`, `versions-pruned.json`,
   `versions-history.json`, `select`/`prune`/`flatten`, nem permalinks
   `/blog/<slug>/v/<uuid>/`.
2. **O duelo `work` permanece intocado** na sua lógica de ranking — já é
   independente da camada de seleção (`computeRatings`/`ranking.ts` nunca
   importa `selection.ts`) e já usa só `key`, nunca UUID de versão.
3. **"Entrar em revisão" deixa de criar um artefato persistente no domínio do
   Hrönir.** O fluxo hoje chamado `draft-worst`/`draft-commit` passa a editar
   o(s) arquivo(s) canônico(s) diretamente — sem arquivo-irmão, sem
   `supersedes`/`draftCreatedAt`/`draftMsg` no frontmatter. A sessão guarda
   `{lang, path}`, não `{draftPath, canonicalPath, canonicalUuid}`. O commit
   e o PR são a proveniência.
4. **Obra bilíngue é editada atomicamente.** Quando um `key` tem pt e en, os
   dois arquivos entram no mesmo commit quando a mudança é semântica —
   reaproveitando o `findTranslations(key)` que hoje já traz os dois idiomas
   juntos no gatilho de `draft-worst` (`edit-worst.ts:255`), mas sem a
   divergência temporal que o `select()` atual permite entre o pt e o en de
   um mesmo grupo (RFC 0010 §4.4 — hoje cada idioma vence seus duelos de
   versão em ritmos diferentes). O Git fornece a fronteira transacional para
   a revisão bilíngue: os arquivos alterados podem ser publicados no mesmo
   commit. A sincronização semântica continua sendo uma regra editorial,
   verificada pelo fluxo de revisão na medida do possível. Em mudanças
   conceituais, `draft-commit` deve falhar ou emitir erro quando algum idioma
   existente da obra não tiver sido alterado, salvo justificativa explícita.
   A verificação baseia-se nos seguintes invariantes de migração:
   - Todo post sobrevivente possui `lang` explícito.
   - Toda obra bilíngue possui um identificador comum explícito, preferencialmente `translationKey`.
   - Existe no máximo um arquivo para cada par `(translationKey, lang)`.
   - O `doctor` reprova duplicidade ou tradução órfã não deliberada.
   - A sessão de revisão registra todos os caminhos (paths) encontrados para aquela obra.
5. **Sem backcompat desnecessária.** Não preservamos:
   - as variantes legacy/pré-OKF/blob de UUID em `posts.ts` (só serviam para
     resolver rate files de versão contra um manifesto de seleção que deixa
     de existir);
   - redirect para permalinks de versão podada — `/blog/<slug>/v/<uuid>/`
     passa a 404 depois da migração, não redireciona;
   - campos de frontmatter de lifecycle de versão (`supersedes`,
     `draftCreatedAt`, `draftCommittedAt`, `draftMsg`, `previousVersion`) no
     schema de conteúdo novo — são removidos do `postSchema` e apagados dos
     arquivos sobreviventes durante a migração (Fase 2), não deixados como
     campo opcional morto.
   - **Exceção deliberada, não backcompat de código:** rate files já
     gravados (`.routines/hronir/rates/**`) são registro histórico imutável
     (`CLAUDE.md` — guardrail de CI contra deleção). Continuam existindo e
     legíveis, mas nada no site ou no `doctor` os trata como fonte de
     verdade de versão viva depois desta RFC — deixam de alimentar qualquer
     superfície pública (`version-trials`, seção "Histórico de edição" do
     dossiê de obra).
6. **Decisão em aberto, não assumida por esta RFC — precisa confirmação
   explícita antes da Fase 4 (§7):** hoje inglês é o idioma padrão sem
   prefixo de URL e português é `/pt/...` (`src/lib/languages.mjs:11-19`).
   Uma leitura anterior deste desenho presumiu inverter isso (`/blog/`→pt,
   `/en/blog/`→en). Essa inversão **muda a URL pública** de todo slug hoje
   bilíngue (`/blog/<slug>/` passaria a servir conteúdo diferente do que
   serve hoje) — é uma mudança de superfície pública independente da
   simplificação de versionamento, e não decorre logicamente dela. Esta RFC
   **não** assume a inversão; trata o esquema de idioma padrão como
   ortogonal e a ser decidido separadamente (§5 documenta o mecanismo atual
   sem alterá-lo).
7. **Padronização dos nomes físicos dos arquivos.** Como fase final e para evitar
   uma arqueologia enganosa, arquivos sobreviventes que mantêm nomes legados (ex:
   `<slug>/v-timestamp.mdx`) serão padronizados no formato único `src/content/blog/<slug>.mdx`
   (ou `src/content/blog/<slug>/index.mdx` caso existam recursos de mídia locais
   associados). Isso garante a transição completa para o layout simplificado.

### 2.1. Consequências aceitas

- **Perda de concorrência entre revisões:** Revisões concorrentes da mesma obra
  deixam de coexistir como objetos independentes do Hrönir. Passam a ser branches
  Git comuns e podem exigir rebase ou resolução de conflito. Essa perda é deliberada:
  conflitos ocasionais são considerados menos custosos que manter um sistema
  permanente de versões concorrentes.

## 3. O que sai

Confirmado por leitura direta do código (arquivo → motivo):

| Arquivo/artefato                                                                                                                                                      | Motivo                                                                                                                                                                                                            |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/hronir/commands/{select,prune,flatten}.ts`                                                                                                                       | Existem só para decidir/promover/limpar versões concorrentes.                                                                                                                                                     |
| `src/hronir/history.ts` + `versions-history.json`                                                                                                                     | Índice uuid→blob git, alimentado só por fold-back/prune/flatten.                                                                                                                                                  |
| `versions-selected.json`, `versions-pruned.json`                                                                                                                      | Artefatos gerados só por `select()`/`prune()`.                                                                                                                                                                    |
| `computeVersionRatings`/`VersionEntry` (`ranking.ts:216-261`)                                                                                                         | Único consumidor de EWMA por versão (não por obra).                                                                                                                                                               |
| `src/pages/{blog,pt/blog}/[slug]/v/[uuid].astro` + `raw.txt.ts`                                                                                                       | Permalink de versão — deixa de existir, sem redirect (decisão 5).                                                                                                                                                 |
| `DRAFTS_DIR` (`posts.ts:14`)                                                                                                                                          | Só usado por rascunhos de duelo de versão.                                                                                                                                                                        |
| `src/hronir/selection.ts` (quase todo)                                                                                                                                | `readSelection`/`writeSelection`/`listDirVersions`/`foldBack`/etc. — maquinaria de seleção. `findTranslations`/`listEnglishWithKey` são realocados (§4), não apagados.                                            |
| `blogVersions` collection (`content.config.ts:142-149`)                                                                                                               | Só serve o permalink de versão.                                                                                                                                                                                   |
| `VersionBanner.astro`, `ArchivedContent.astro`, `lib/versions.ts`, `lib/history-pages.ts`                                                                             | Consumidores exclusivos do permalink de versão.                                                                                                                                                                   |
| `pages/ranking/version-trials/`, `pages/ranking/versions/[key].astro`, `getVersionTrials`/`getPostVersionTrials` (`hronir-rank.ts`)                                   | Superfície dedicada a duelos `version` (RFC 0012 §5.3) — não há mais duelos desse tipo a exibir.                                                                                                                  |
| Seção "Histórico de edição" em `pages/ranking/posts/[key].astro:257-283`                                                                                              | Consumidora das funções acima.                                                                                                                                                                                    |
| `pickVersionDuel`/`VERSION_DUEL_PROB` (`commands/continue.ts:97-196`)                                                                                                 | Ramo de amostragem exclusivo de duelo de versão.                                                                                                                                                                  |
| Bloco `hasDraft` (`commands/edit-worst.ts:240-254`)                                                                                                                   | Consulta maquinaria de seleção que deixa de existir.                                                                                                                                                              |
| Trechos de `commands/doctor.ts` (validação `selection-v1`, `dirUuidsBySlug`, divergência de grupo — não o arquivo inteiro)                                            | O resto de `doctor.ts` valida rate files/schema/staged-files, agnóstico de versão, e fica.                                                                                                                        |
| Variantes legacy/pré-OKF/blob de UUID em `posts.ts:198-283` (`getPostUuidLegacy*`, `getPostUuidPreOkfType*`, `*FromBlob`, `blobShaForPath`, `readBlob`, `_blobCache`) | Só serviam para resolver rate files de versão contra conteúdo arquivado.                                                                                                                                          |
| Passo `select` em `scripts/pregen.mjs:21`                                                                                                                             | Chamada de build à seleção.                                                                                                                                                                                       |
| Campos `supersedes`/`draftCreatedAt`/`draftCommittedAt`/`draftMsg`/`previousVersion` do `postSchema` (`content.config.ts:56-82`)                                      | Ver decisão 5 — removidos do schema, não deixados opcionais.                                                                                                                                                      |
| `pages/ranking/battles/[id].astro`                                                                                                                                    | Deixa de gerar `versionPaths` e passa a servir apenas duelos `work`; removem-se seus imports e renderizações específicos de versão. Rate files históricos `version` permanecem acessíveis somente no repositório. |

## 4. O que fica / muda

- **Identidade de obra:** `keyForPath()`/`translationKey` (`posts.ts:78-86`)
  — puramente conceito de pareamento do duelo `work`, intocado.
- **`getPostUuid`** (variante atual, sem fallbacks) — o UUID deixa de ser identidade de domínio, endereço público ou chave de seleção. Permanece apenas como fingerprint de conteúdo gravado nos dados de avaliação, usado para detectar que uma obra foi reescrita entre avaliações e reiniciar a EWMA de qualidade em `computeAbsoluteQuality`/`computeDeconfoundedQuality` (`ranking.ts`).
- **`findTranslations()`/`listEnglishWithKey()`** — realocados de
  `selection.ts` para `posts.ts` (ou um `translations.ts` novo), reescritos
  para depender só de `listPosts()`/`keyForPath()`/`isPublishedData()`, sem
  tocar seleção.
- **`resolveSidePath`** (`commands/_shared.ts:64-103`) — troca a varredura
  por `listSlugVersions` (seleção) por busca do arquivo atual por
  `key`+idioma via `listPosts()`.
- **`getRecentlyEditedKeys()`** (`edit-worst.ts:131-182`) — troca campos de
  frontmatter de lifecycle por `gitMtime()` (já existe, já usado para
  staleness de amostragem em `continue.ts:229`), unificando "quando foi
  editado" numa fonte só: git.
- **Fluxo de revisão** (nomes de comando mantidos — `draft-worst`/
  `draft-commit`, sem renomear CLI desnecessariamente): `draft-worst` chama
  `findTranslations(key)`, aponta o agente para os arquivos canônicos reais
  (pt e/ou en) e instrui edição in-place; `draft-commit` confirma que os
  arquivos mudaram e fecha a sessão. Sem sibling, sem select, sem duelo de
  versão. Regra editorial (frontmatter não guarda isso — é convenção
  documentada em `CLAUDE.md`): correções locais (gramática, link, formatação)
  podem tocar um idioma só; mudança conceitual (tese, estrutura, argumento)
  exige tocar todos os idiomas existentes no mesmo commit.

## 5. Modelo i18n atual (documentado, não alterado por esta RFC)

`src/lib/languages.mjs:11-19`:

```js
export const DEFAULT_LANG = "en";
export const LANG_META = {
  en: { locale: "en-US", urlPrefix: "", navMatch: ["en"] },
  pt: { locale: "pt-BR", urlPrefix: "/pt", navMatch: ["pt"] },
};
```

`/blog/<slug>/` é a rota padrão (inglês, sem prefixo); `/pt/blog/<slug>/` é a
rota portuguesa. `pages/blog/[...slug].astro` redireciona para
`/pt/blog/<slug>/` quando `post.data.lang === "pt"`. Essa mecânica não muda
nesta RFC — só o que alimenta as duas coleções (`blog` único glob, §6) muda.
Inverter qual idioma é o padrão é uma decisão de produto/SEO separada,
sinalizada na decisão 6.

## 6. `content.config.ts` — alvo mínimo

Só possível **depois** de garantir um arquivo único por (slug, idioma) — ver
Fase 1. Nesse ponto, a coleção `blog` vira um glob direto:

```ts
const blog = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./src/content/blog",
    generateId: ({ entry }) => generateBlogId(entry),
  }),
  schema: postSchema,
});

export const collections = { blog };
```

Sem `selectedFiles`/`flatFiles`/leitura de `versions-selected.json`, sem
`blogVersions`. `generateBlogId` (`lib/blog-id.ts:17-19`) já normaliza tanto
`<slug>.mdx` quanto `<slug>/v-<ts>.mdx`/`<slug>/index.mdx` remanescente para
o id `<slug>` — não exige renomear os arquivos sobreviventes como
pré-condição, embora achatar o diretório continue sendo preferível para
reduzir a superfície dual-mode durante a migração.

## 7. Migração (fases, cada uma verde antes da próxima)

Convenção do repo (`CLAUDE.md`): merge commit, nunca squash; `npm test`,
`prettier --check`, `astro check`, `npm run build`, `npm run hronir:doctor`
verdes a cada fase.

**Fase 0 — congelar.** `npm run hronir:select` uma última vez contra `main`
fresco → `versions-selected.json` final, autoritativo para os 154 diretórios
ainda no layout legado (o rollout incremental do `hronir:flatten` da RFC
0015 para **agora** — resolvia um problema que deixa de existir).

**Fase 1 — unicidade física.** Para cada diretório legado, realiza-se a deleção de todo arquivo-versão exceto o selecionado. Para garantir auditoria completa, a migração exige a geração de um manifesto auditável temporário denominado `migration-0017-survivors.json`, que deve ser mantido no repositório durante as PRs de migração (podendo ser removido na última fase). O manifesto deve registrar, para cada slug, um objeto no seguinte formato:

```json
{
  "slug": "nome-da-obra",
  "lang": "pt",
  "kept": "src/content/blog/.../v-....mdx",
  "reason": "selected", // "selected", "single-publishable" ou "manual"
  "removed": [
    "src/content/blog/.../v-....mdx"
  ]
}
```

A regra de escolha operacional para seleção deve ser executada de forma estrita: sem seleção prévia, exatamente um arquivo publicável deve existir. Zero ou múltiplos candidatos candidatos interrompem automaticamente a migração e exigem resolução manual. Realiza-se também a triagem manual dos dois slugs órfãos já sinalizados por `flatten.ts:52-67` (`delegando-para-agentes`, `the-art-of-delegation`) e do diretório sem versão publicável (`the-art-of-delegating-...`, RFC 0015 §1).

Ao final: um arquivo por (slug, idioma) em todo `src/content/blog/`, sem exceção. `git rm` nos três JSONs originais gerados de versão.

**Fase 2 — poda de schema e frontmatter.** Remove os campos de lifecycle de
versão do `postSchema` (§3) e dos arquivos sobreviventes (decisão 5 — sem
campo morto). `content.config.ts` migra para o glob único (§6).

**Fase 3 — remoção de código.** Deleta em bloco a lista da §3 (após
realocar `findTranslations`, §4). Reescreve `draft-worst`/`draft-commit`
(§4), `doctor.ts` (poda cirúrgica), `resolveSidePath`,
`getRecentlyEditedKeys`. Remove passo `select` de `pregen.mjs`.

**Fase 4 — decisão de idioma padrão (opcional, separada).** Só depois das
fases 0-3 estarem verdes: decidir se o esquema de URL padrão (§5, decisão 6)
muda. Não é pré-requisito das fases anteriores.

## 8. Compatibilidade de dados

- Rate files existentes (`stars-v1`/`v2`/`v3`, incluindo os de `kind:
"version"` já gravados) são imutáveis e continuam no repo — guardrail de
  CI inalterado. `doctor` mantém validação básica de schema; perde só as
  checagens específicas de seleção/versão (§3).
- Nenhum rate file histórico de duelo `version` é reprocessado, reescrito ou
  usado para popular qualquer página nova. Vira puramente arquivo morto,
  auditável via `git log`/leitura direta se alguém precisar.

## 9. O que esta RFC não faz

- Não altera o algoritmo de ranking `work` (OpenSkill/EWMA), perspectivas,
  ou objetivos de amostragem (RFC 0013).
- Não decide a inversão de idioma padrão (§5, decisão 6) — deixa explícito
  que é decisão separada.
- Não deleta rate files históricos de nenhum tipo.
- Não força retradução ou reestruturação de conteúdo existente além da
  remoção de campos de frontmatter mortos (Fase 2).

## Histórico de revisões

| Data       | Mudança                                                                                                                                                                                         |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-07-15 | Criação — formaliza a distinção obra/idioma/versão histórica e a decisão de eliminar o duelo `version` mantendo o duelo `work`, com princípio explícito de não manter backcompat desnecessária. |
