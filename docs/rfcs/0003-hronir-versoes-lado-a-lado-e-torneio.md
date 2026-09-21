# RFC 0003 — Versões lado a lado e torneio de versões no Hrönir

|                 |                                                                                                                                                                                                                                                                                                                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Status**      | Superseded by RFC 0010 (Fases 0–3 implemented; RFC 0010 extends with peer-version layout and selection-via-JSON)                                                                                                                                                                                                                                                                                       |
| **Autor**       | Franklin Baldo (proposta assistida)                                                                                                                                                                                                                                                                                                                                                                    |
| **Criado em**   | 2026-06-09                                                                                                                                                                                                                                                                                                                                                                                             |
| **Branch / PR** | `claude/nifty-wright-z96lj3`                                                                                                                                                                                                                                                                                                                                                                           |
| **Depende de**  | RFC 0001 (trilha de qualidade absoluta), RFC 0002 (de-confounding) — reusa `getPostUuid`, `version` nos rate files, `computeAbsoluteQuality`. **RFC 0004 (#307), já mergeada** — consolidou a descoberta de posts em `scripts/lib/content.mjs` (ver §5.4 e §12). **Coordena com:** RFC 0006 (mergeada, achatou `musicas/` — §2.1/§5) e RFC 0005 (Hrönir→TS, _downstream_: depende da Fase 0 desta RFC) |
| **Afeta**       | `src/content.config.ts`, `src/content/blog/**` (migração estrutural), `scripts/hronir/lib/{posts,commands,ranking,matches}.js`, rate files, `scripts/lib/content.mjs` (módulo único de descoberta de posts, provido pela RFC 0004 — §5.4), e os pontos de rename do §8 (Fase 1)                                                                                                                        |

> Este documento é a **etapa 1** da PR: primeiro o RFC, depois a implementação
> incremental na mesma branch, fase a fase, cada fase verde (build + testes +
> `prettier --check`) antes da próxima. Mesmo padrão das RFCs 0001/0002.

---

## 1. Resumo

Hoje o `edit-worst` → `edit-commit` **reescreve o pior post no lugar**: o agente
edita `src/content/blog/<slug>.md` diretamente, e o `edit-commit` grava
`previousVersion: { uuid, url, timestamp, msg }` no frontmatter — a versão
anterior **não** fica no repo, vive só no git (uma linked-list reconstruída via
permalink do GitHub). Isso tem três custos:

1. **Conflito de git.** A edição reescreve trechos grandes do mesmo arquivo.
   Duas sessões em paralelo (autopilot + manual, ou duas branches `claude/*`)
   miram naturalmente o **mesmo pior post** → colisão no merge.
2. **Destrutivo.** O conteúdo publicado muda silenciosamente sob a mesma URL; a
   versão anterior some da árvore de trabalho. O reflexo do LLM de
   _tighten/smooth/fortify_ (o failure mode documentado nas skills) sobrescreve
   a voz do autor de forma irreversível no working tree.
3. **Anti-Hrönir.** O sistema inteiro existe para **comparar**, mas a edição não
   compete com nada — ela substitui. A versão nova nunca é posta à prova contra
   a antiga; a EWMA até reseta na edição, jogando fora o sinal da versão velha.

Esta proposta troca "editar no lugar" por **adicionar uma nova versão que convive
lado a lado** com a canônica, e faz as versões **competirem** no Hrönir: a
vencedora vira a canônica (a publicada). A operação frequente e paralela (criar
versão) passa a ser sempre **arquivo novo** → zero conflito. A reescrita só
acontece na **promoção**, rara, single-writer e com diff limpo.

---

## 2. Motivação e restrições do repo

Duas restrições concretas do código atual moldam o desenho — não dá para ignorar
nenhuma das duas.

### 2.1. Todo `.md` em `src/content/blog/` vira rota

`getStaticPaths` (`src/pages/blog/[...slug].astro:23-29`) publica **todo** post
via `isPublished` (`src/lib/publish.ts`), com a URL derivada do id do arquivo
(`params: { slug: post.id }`, linha 26). O loader é um glob amplo
(`src/content.config.ts`):

```ts
loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
```

O id é o caminho relativo sem extensão — um arquivo aninhado vira id `sub/arquivo`
(o glob loader recorre `**/*`). Logo: **se versões forem irmãs soltas no
diretório, todas publicam** — conteúdo duplicado, canibalização de SEO, e
index/RSS/archive/tags/OG/sitemap listando cada versão. Qualquer desenho precisa
garantir que **só a canônica** apareça para o Astro. (A RFC 0006 acabou de achatar
`src/content/blog/musicas/`, que era o único aninhamento vivo; o Shape B
reintroduz aninhamento, mas **por post**, não por categoria — §5.)

### 2.2. `translationKey` hoje consolida _tudo_

O ranking consolida por `translationKey` (`ranking.js:24-25`, `postKey` →
`key`), e a página de post trata "mesmo `translationKey`, id diferente" como
**tradução** (`[...slug].astro:64-79`, "leia em outra língua"). Duas versões do
**mesmo idioma** apareceriam como uma tradução falsa e seriam **fundidas** no
ranking. Pior: o `translations` é um Record chaveado por língua
(`[...slug].astro:67-71`) — uma versão do mesmo idioma sobrescreveria a entrada e
renderizaria um link "leia em outra língua" apontando para a própria língua.

Ou seja: versão é um **terceiro eixo** que hoje não existe. Precisamos separar:

| Eixo              | Hoje               | Papel                                 |
| ----------------- | ------------------ | ------------------------------------- |
| **ensaio**        | `translationKey`   | a obra, independente de língua/versão |
| **língua**        | `lang`             | tradução                              |
| **versão** (novo) | UUIDv5 de conteúdo | revisão ao longo do tempo             |

O UUID de conteúdo **já existe** (`getPostUuid`, `posts.js:87-97`) e **já está
gravado** em cada match como `post_a.version` / `post_b.version`
(`ranking.js:54-55`). O eixo de versão está latente nos dados; falta torná-lo
identidade de primeira classe.

---

## 3. Objetivos e não-objetivos

### Objetivos

- Substituir a edição-no-lugar por **criação de versão aditiva** (arquivo novo →
  zero conflito na operação frequente).
- Manter **todas as versões no repo, lado a lado** (linhagem deixa de depender de
  arqueologia no git e passa a ser legível como arquivos).
- Fazer versões **competirem** no Hrönir; a canônica é a vencedora.
- **Não desestabilizar o site:** URLs, roteamento, RSS, OG, tradução, sitemap
  ficam idênticos. Versões não-canônicas são invisíveis ao Astro.
- Preservar o contrato não-interativo do CLI e o schema `stars-v1` dos rate files.

### Não-objetivos (por ora)

- Não publicar histórico navegável de versões no site (`/blog/<slug>/v/<uuid>`
  com `rel=canonical`) — fica como add-on aditivo, §9.
- Não trocar o motor de ranking (OpenSkill segue como eixo relativo).
- Não podar automaticamente versões perdedoras antigas (Fase 3).

---

## 4. Princípio de design

> **A canônica é definida por nome de arquivo, não por flag mutável.** O Astro
> só enxerga `index.md`; o que distingue "publicada" de "competidora" é o nome do
> arquivo, não um campo de frontmatter que duas PRs poderiam ambos virar. Isso
> confina o conflito a um único ato deliberado (a promoção) e mantém a superfície
> de merge mínima.

> **Trilha paralela, não jam.** Assim como a RFC 0001 não enfiou o "nível" dentro
> do OpenSkill, aqui a competição entre versões é uma **trilha por-versão**
> paralela. O ranking público continua **por-ensaio** (a canônica representa o
> ensaio); a trilha por-versão só decide **qual versão promover**.

---

## 5. Estrutura proposta (Shape B refinado)

Uma pasta por **post publicado** (= um par `(translationKey, lang)`); dentro
dela, a canônica é `index.md(x)` e as versões competidoras/superadas são irmãs:

```
src/content/blog/
  rosencrantz-coin/
    index.md          # ← canônica: ÚNICA que o Astro publica
    v1.md             # ← versão anterior (invisível ao Astro)
    v2.md             # ← rascunho competidor (invisível ao Astro)
  censo-nao-amostra/  # tradução PT é OUTRO post publicado → pasta própria
    index.md
  666-en/             # post de música (postType: music) na RAIZ — pós-RFC 0006
    index.mdx         # NÃO recriar musicas/ (check-hygiene §6 a bane)
```

> **Pasta-por-post ≠ pasta-de-categoria (relação com a RFC 0006).** A RFC 0006
> achatou `musicas/` porque era uma **pasta de categoria** — agrupava 130 posts
> sem função no Astro, com o único diferenciador (`postType: music`) já no
> frontmatter. O Shape B é o oposto: **uma pasta por post**, que carrega função
> real (o eixo de versão — `index.md` + `v*.md` da _mesma_ obra). O princípio da
> 0006 ("pasta tem que carregar função") **endossa** o Shape B. E a trava é
> específica: `check-hygiene.mjs §6` bane só `src/content/blog/musicas/`, não
> subpastas em geral — então o Shape B fica desbloqueado, desde que os posts de
> música (agora na raiz) recebam suas pastas `<slug>/` também na raiz, sem
> ressuscitar `musicas/`.

### 5.1. O loader passa a globar só a canônica

```ts
loader: glob({
  pattern: "**/index.{md,mdx}",
  base: "./src/content/blog",
  generateId: ({ entry }) => entry.replace(/\/index\.(md|mdx)$/, ""),
}),
```

- `rosencrantz-coin/index.md` → id `rosencrantz-coin` → `/blog/rosencrantz-coin`
  (**idêntico** à URL de hoje).
- `v1.md` / `v2.md` **não casam** com `**/index.*` → nunca entram em
  `getCollection('blog')`. Index, RSS, archive, tags, OG, sitemap, related,
  prev/next e a lógica de tradução **automaticamente** ignoram versões, sem
  precisar de um filtro `isCanonical` espalhado pelo site. **Ressalva:** isso vale
  só para o que passa pelo loader; alguns scripts de build varrem
  `src/content/blog` direto e precisam da mesma consciência de canônica — §5.4. A
  superfície ainda é menor que a do Shape C, e o critério por nome (`**/index.*`)
  é mais robusto que flag de frontmatter. **Esse é o ganho central do Shape B
  sobre o C** (§10).
- `generateId` preserva os slugs planos atuais. **A verificar na Fase 0** que o
  glob loader do Astro 6 respeita `generateId` exatamente assim (um snapshot de
  URLs antes/depois trava isso).

### 5.2. O Hrönir enxerga todas as versões

`listPosts()` (`posts.js:24-35`) recorre o FS direto e **vê** `index.md` +
`v*.md`. É exatamente o que queremos para a competição. O que muda na lib:

- **`isCanonical(path)`** → `basename` é `index`. Único critério.
- **`listVersions(translationKey, lang)`** → todos os arquivos da pasta.
- `findTranslations` (`posts.js:73-82`) passa a casar **só canônicas** (senão
  versões do mesmo `translationKey` seriam confundidas com traduções, §2.2).
- **`keyForPath` (`posts.js:43-47`) precisa de fix.** Seu fallback sem
  `translationKey` é o basename sem extensão — após a migração **todo** post sem
  `translationKey` chavearia como `"index"` (colisão). Hoje só 1 post está nessa
  situação, mas `keyForPath` alimenta `buildPathToKeyIndex`/`migrate`. Correção
  barata: usar o nome da **pasta** quando o basename é `index`. **Delegado à RFC
  0004** (hardening do fallback `"index"` em `posts.js`); esta PR só depende dele,
  não o duplica.

### 5.3. Identidade de versão = UUID de conteúdo (já existe)

Nada novo obrigatório no frontmatter. Opcional, por ergonomia de leitura humana
da linhagem:

```yaml
revision: 3                    # ordinal legível (1, 2, 3…)
supersedes: "22c3fbae-..."     # UUID da versão que esta sucede
```

O `previousVersion` legado continua **aceito e lido** como linhagem histórica,
mas deixa de ser o mecanismo: a linhagem agora vive como **arquivos no repo**, não
como permalink no git.

### 5.4. Scripts fora do `getCollection` (consciência de canônica)

A alegação "automaticamente ignoram versões" (§5.1) vale **só para o que passa
pelo loader**. Estes scripts varrem `src/content/blog` direto, com `readdirSync`
**não-recursivo** e `id`/`slug` = basename — e quebram na migração da Fase 0,
alguns **silenciosamente**:

| Script                                                    | Quebra na Fase 0                                                                            | Modo de falha                                                                            |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `scripts/lib/blog-links.mjs:31-53` (`loadPosts`)          | alimenta `check-links.mjs` (CI), `generate-redirects.mjs`, `generate-translation-pairs.mjs` | check de links falha **alto** (bom); pares **hreflang** do sitemap somem **em silêncio** |
| `scripts/generate-qrs.mjs:64-85`                          | `readdirSync` plano, só `.md`                                                               | QRs param de regenerar, cai no QR simples — **silencioso**                               |
| `scripts/generate-music-posts.mjs` / `-en-companions.mjs` | escrevem `.mdx` **plano** em `musicas/`                                                     | stubs futuros não casam `**/index.*` → **despublicados em silêncio**                     |
| `scripts/check-translations.mjs:71`                       | casa mudados por `split("/").pop()`                                                         | tudo vira `index.md` → colisão de basename; `v*.md` entram no diff de sync               |

`blog-links.mjs` **já está cego** hoje para os posts aninhados de `musicas/`
(não-recursivo) — a migração converte um ponto cego parcial em total. A correção
(Fase 0) é tornar essas varreduras **recursivas e cientes de canônica**
(`**/index.*`). Isso **não** invalida o §10: a superfície é menor que a do Shape C
e o critério por nome de arquivo é mais robusto que uma flag de frontmatter — mas
**não é zero**, e a RFC reconhece isso.

> **Resolvido pela RFC 0004 (#307).** A 0004 consolida toda a descoberta de posts
> num módulo único `scripts/lib/content.mjs` (com `postIdFromPath`) e adiciona
> `check:hygiene` no CI (allowlist da raiz, `musicas/` no `check:links`+hreflang,
> id morto em `src/lib/paths.ts` corrigido). Com a 0004 **já mergeada**, a Fase 0
> da 0003 troca **uma função** (`postIdFromPath`) em vez de corrigir os cinco
> scripts acima um a um. A RFC 0006 (mergeada) também já achatou `musicas/`, então
> os geradores de música escrevem na raiz — suas pastas de versão `<slug>/` ficam
> na raiz (§5), nunca sob `musicas/`. A tabela permanece como **diagnóstico** do que estava
> frágil; a correção mora na 0004.

---

## 6. Fluxo novo (substitui o edit-worst destrutivo)

```
init … matches … (need_edit)
  └─> draft-worst                # cria v<n>.md na pasta do pior post (NÃO toca index.md)
      └─> [edição do rascunho em todas as línguas]
          └─> draft-commit --msg "..."   # valida UUID novo; registra o competidor
              └─> [matches futuros sorteiam DUELOS DE VERSÃO: index vs v<n>]
                  └─> promote <key>       # swap de arquivos: vencedora vira index.md
```

- **`draft-worst`** (evolução do `edit-worst`): em vez de injetar `replacedVersion`
  e editar `index.md`, **copia a canônica para `v<n>.md`** e manda o agente editar
  _esse_ arquivo. Aditivo, arquivo novo, **zero conflito**. As skills e as defesas
  dos matches continuam guiando a edição igual a hoje.
- **`draft-commit`**: valida que o draft difere da canônica (UUID mudou, mesma
  checagem que o `edit-commit` faz hoje), grava `supersedes`/`revision`, fecha a
  rodada. **Não toca a canônica** → nenhuma URL muda, nenhum conflito.
- **Competição**: `generateNextMatch` (`commands.js:288`) ganha probabilidade de
  sortear um **duelo de versão** — `index.md` contra um `v<n>.md` do mesmo
  `(translationKey, lang)`. Ambos os lados têm o mesmo `key` mas `path`/`version`
  diferentes.
- **`promote <key>`**: escolhe a versão de maior `ordinal` na trilha por-versão;
  faz o **swap de arquivos** — `index.md` atual → `v<next>.md`, vencedora →
  `index.md`. Único momento de reescrita: raro, single-writer, diff limpo,
  URL preservada (nome da pasta).

---

## 7. Ranking ciente de versão

A trilha pública **continua por-ensaio** (retrocompatível). Em paralelo, uma
**trilha por-versão** decide a promoção:

- Duelista da trilha por-versão = `(translationKey, lang, version)` em vez de só
  `translationKey`. Os dados já bastam: `ranking.js:54-55` já carrega
  `aVersion`/`bVersion`.
- Duelos **inter-versão** (mesmo `key`, `version` distinta) hoje seriam fundidos
  por `computeRatings` (chaveado em `aKey`/`bKey`). A mudança é localizada: uma
  variante `computeVersionRatings()` que chaveia por `version` (espelhando o loop
  determinístico já existente, §RFC 0001 Fase 0).
- A **canônica** de um `(key, lang)` = a versão de maior `ordinal` por-versão (ou
  promoção manual). O rank público do ensaio = o da canônica.
- `doctor`: hoje não proíbe `key` igual nos dois lados, mas a consolidação os
  fundiria. Passa a **reconhecer duelos de versão** como válidos quando
  `version_a ≠ version_b`.
- **A trilha pública por-ensaio PULA duelos de versão.** Um duelo de versão tem
  `aKey === bKey`; alimentar o OpenSkill por-ensaio com um time contra si mesmo
  corromperia (ou explodiria) o rating. `computeRatings()` deve **descartar**
  matches com `aKey === bKey` — eles só alimentam `computeVersionRatings()`.
- **Trilha de qualidade absoluta (EWMA de estrelas, RFC 0001):** decisão — num
  duelo de versão, só as estrelas do **lado canônico** entram na EWMA por-ensaio
  (a nota da versão não-canônica fica restrita à trilha por-versão). Assim a
  qualidade absoluta pública reflete só o que está publicado.
- **`path` é informacional; `version` é autoritativo.** Após um `promote`, os
  rate files antigos com `post_a.path: .../index.md` passam a apontar para outro
  conteúdo. A identidade de versão é o **UUID** (acertado); o `doctor` resolve por
  ele e **tolera divergência `path`×`version`** pós-promoção.

---

## 8. Plano de implementação (faseado)

### Fase 0 — Migração estrutural (preserva comportamento)

Espelha a "Fase 0 / golden tests" da RFC 0001: nada de comportamento novo, só a
fundação travada por testes.

- Script de migração: cada `src/content/blog/<...>/<slug>.md(x)` →
  `<...>/<slug>/index.md(x)` (inclui `musicas/`).
- `content.config.ts`: glob `**/index.{md,mdx}` + `generateId` (§5.1).
- Migrar `post_a.path`/`post_b.path` nos rate files (estender o `migrate`, que já
  reescreve paths/keys, `commands.js:1490`).
- **Rebaseia sobre a RFC 0004 (#307)** (pré-requisito de merge): a descoberta de
  posts já estará em `scripts/lib/content.mjs`. A Fase 0 então troca **uma função**
  (`postIdFromPath`) para a convenção `<slug>/index.*`, em vez de corrigir os cinco
  scripts do §5.4. O hardening de `keyForPath` (§5.2) e o `musicas/` no
  `check:links`+hreflang já vêm da 0004 — não duplicar.
- **Critério de aceite:** (a) snapshot de todas as URLs (e ids) **idêntico**
  antes/depois; (b) `check:hygiene` da 0004 verde (sitemap+`hreflang`, allowlist da
  raiz) — esta PR só **declara a dependência**, o check já existe; `npm run build`
  verde; `doctor` verde; `prettier --check` limpo.

### Fase 1 — Draft não-destrutivo (resolve o conflito git)

- `edit-worst` vira `draft-worst`: cria `v<n>.md`, **não** edita `index.md`, não
  injeta `replacedVersion`.
- `draft-commit`: valida UUID novo, grava `revision`/`supersedes`.
- `posts.js`: `isCanonical`, `listVersions`; `findTranslations` só-canônicas.
- **O rename `edit-worst`→`draft-worst` toca mais que o CLI:** `package.json`
  (`hronir:edit-worst`/`-commit`, linhas 27-28), `CLAUDE.md` (3 menções) e
  `.github/hronir-session-prompt.md` (prompt do autopilot). Manter aliases dos
  scripts npm antigos por uma versão evita quebrar fluxos externos.
- **Critério de aceite:** uma rodada de edição gera **só arquivo novo**; dois
  drafts simultâneos do mesmo post **não** conflitam; site inalterado.

### Fase 2 — Competição e promoção

- `computeVersionRatings()` (trilha por-versão) + `promote` (swap de arquivos).
- `generateNextMatch`: probabilidade de duelo de versão; `doctor` reconhece-os.
- **Critério de aceite:** um `v2` melhor que o `index` vence os duelos e
  `promote` o torna canônico sem mudar a URL; golden tests da trilha por-versão.

### Fase 3 — Futuro (fora desta PR, esboçado)

- Auto-promoção por margem de `ordinal` sobre N duelos.
- Poda/arquivamento de versões perdedoras antigas.
- Add-on aditivo: publicar versões superadas em `/blog/<slug>/v/<uuid>` com
  `rel=canonical` (o "flavor publicável" do Shape B, §9).

---

## 9. Compatibilidade e migração

- **Schema dos rate files:** inalterado (`stars-v1` já tem `version`).
- **URLs:** preservadas (`generateId`). Nenhum redirect necessário se o snapshot
  da Fase 0 bater.
- **`previousVersion` legado:** lido como linhagem histórica; o primeiro
  `draft-commit` num post passa a registrar a linhagem como arquivos.
- **Fase 0 e 1 não mudam nenhum número de ranking.** A Fase 2 adiciona a trilha
  por-versão sem mexer no ranking público por-ensaio.

---

## 10. Alternativas consideradas

- **Shape A — canônica fixa, versões fora da coleção** (`.routines/hronir/versions/`).
  Menor raio de impacto, mas versões não "convivem" no diretório de conteúdo nem
  são publicáveis. **Rejeitado** pelo dono: o objetivo é lado-a-lado de verdade.
- **Shape C — irmãos achatados + flag `canonical`** (`foo.md`, `foo~v2.md` soltos
  no dir, slug no frontmatter, roteamento filtra a canônica). **Vantagem real:**
  zero migração — arquivos existentes ficam onde estão. **Custo decisivo:** como
  as versões **entram** em `getCollection('blog')`, é preciso um filtro
  `isCanonical` em ~10 pontos do site (index, RSS, archive, tags, OG, sitemap,
  related, prev/next, tradução, busca/pagefind), e **esquecer um** vaza um
  rascunho para SEO/sitemap. Além de sujar o diretório e tornar a linhagem um
  scan de frontmatter em vez de um `ls`. O Shape B confina o novo a `index.md`
  (Astro só vê a canônica) e a um `generateId` — **trocamos uma migração
  única e roteirizável por uma superfície de filtro permanente e arriscada**.
  (Honestidade: B **não** zera o custo — alguns scripts de build precisam da mesma
  consciência de canônica, §5.4; mas o critério por nome de arquivo é mais robusto
  que uma flag de frontmatter, e a superfície é menor e estática.) Por isso B
  refinado vence o C.
- **Marcar canônica por frontmatter (em vez de `index.md`).** Reintroduz o campo
  mutável compartilhado (conflito) e impede o loader de filtrar por padrão de
  nome — cai no problema de filtragem do Shape C. Rejeitado pelo §4.
- **Enfiar versões no ranking por-ensaio existente.** Fundiria versões (§2.2).
  A trilha por-versão paralela (§7) mantém o ranking público estável, no espírito
  da RFC 0001.

---

## 11. Questões em aberto

1. **Nome dos arquivos de versão:** `v<n>.md` (legível, ordenável) vs `<uuid>.md`
   (estável, content-addressed) vs `<timestamp>.md`. _Leaning:_ `v<n>.md` com
   `revision` no frontmatter; o UUID continua sendo a identidade real.
2. **Probabilidade de duelo de versão** no `generateNextMatch`: peso fixo pequeno
   (estilo `OBJECTIVE_WEIGHT`, RFC 0002 §5) ou só quando existe versão competidora
   "fresca"? Calibrar contra os dados.
3. **Critério de promoção:** manual (`promote`) na Fase 2; auto por margem de
   `ordinal` sobre N duelos fica para a Fase 3.
4. **Publicar histórico** (`/blog/<slug>/v/<uuid>` + `rel=canonical`): add-on
   aditivo; decidir se entra ou se a linhagem fica só no repo/git.
5. **`generateId` no Astro 6:** confirmar na Fase 0 que preserva os slugs planos
   (snapshot de URLs como rede de segurança). Nota: `generateId` customizado
   **desliga a slugificação default** do loader; os filenames atuais já são slugs
   limpos, então o snapshot pega qualquer exceção.
6. **`supersedes`/`revision` no schema e na UI de `previousVersion`:** os campos
   precisam entrar no schema zod de `content.config.ts` (zod descarta campos
   desconhecidos). E a UI de "versão anterior" (`[...slug].astro:37,218-228`) some
   para posts promovidos (a nova canônica não tem `previousVersion`): decidir se
   `promote` grava o equivalente ou se a UI passa a ler `supersedes`.
7. **`promote` e o `migrate`:** com `version` autoritativo (§7), resta confirmar a
   tolerância `path`×`version` no `doctor` e se vale um modo de "reescrever paths"
   no `migrate` após promoções. _Resolvido na PR #321:_ o `doctor` tolera path
   `v-*` ausente quando o lado tem UUID de versão e a pasta do post existe
   (promote renomeia o rascunho; prune remove o arquivo); reescrever paths no
   `migrate` foi dispensado — o path gravado é registro histórico fiel.
8. **Promoção × sincronia bilíngue (descoberto na primeira promoção real,
   PR #321):** a trilha por-versão é por-língua, mas o `check:translations`
   exige que o par PT/EN evolua **junto** no mesmo PR. Quando só um lado
   acumula duelos suficientes (o sorteio é independente por língua), o
   `promote --all` promove um lado e quebra o CI. Workaround atual: promover o
   espelho manualmente via `promote --draft` (os rascunhos nascem em par pelo
   `draft-worst`). Fix candidato: `promote` tratar o par como unidade — quando
   qualquer língua cruza o limiar, promover os espelhos do mesmo round juntos.

---

## 12. Plano de execução da PR

1. **Commit 1 (este):** RFC `0003`.
2. **Feito:** RFC 0004 (#307) **mergeada** na `main`; esta branch **rebaseada**
   sobre ela (limpo). A descoberta de posts já está em `scripts/lib/content.mjs`;
   a Fase 0 implementa sobre ele.
3. Após revisão: **Fase 0** (migração + `generateId`, comportamento preservado) →
   **Fase 1** (draft não-destrutivo) → **Fase 2** (competição + promoção), cada
   fase em commit próprio, build/testes/`prettier --check` verdes.
4. Fase 3 sai do escopo e vira issue/RFC futuro.

Merge com **merge commit** (não squash), conforme `CLAUDE.md`.

---

## Histórico de revisões

- **r0** (2026-06-09): versão inicial. Decisões do dono: **competição já** (não só
  armazenamento) e **Shape B refinado** (pasta por post, `index.md` canônica) em
  vez de C, pelo argumento de superfície de filtro do §10.
- **r1** (2026-06-09): emendas após review do dono no PR #306. **Problema 1** —
  §5.4 nova (scripts fora do `getCollection`: `blog-links.mjs`, `generate-qrs.mjs`,
  `check-translations.mjs`, geradores de música) + critério de aceite da Fase 0
  ampliado (snapshot de sitemap/`hreflang`, varredura de `scripts/`); §5.1
  suavizado; §10 honesto quanto ao custo. **Problema 2** — §7: a trilha pública
  pula duelos `aKey===bKey`; EWMA absoluta usa só o lado canônico. **Problema 3** —
  fix do `keyForPath` (colapso para `"index"`) na Fase 0/1. **Problemas 4-6** —
  `path` informacional/`version` autoritativo (§7); `supersedes` no zod + UI de
  `previousVersion` (QA 6); pontas do rename `edit-worst`→`draft-worst` (Fase 1).
- **r2** (2026-06-09): nota operacional do dono no PR #306 — a **RFC 0004 (#307)**
  vira **dependência de merge**. Tabela "Afeta" troca os 5 scripts do §5.4 por
  `scripts/lib/content.mjs` (provido pela 0004); §5.4 ganha o box "Resolvido pela
  RFC 0004"; Fase 0 passa a **rebasear sobre a 0004** e trocar `postIdFromPath` em
  vez de corrigir script a script; `keyForPath` e o check sitemap+`hreflang`
  (`check:hygiene`) delegados à 0004 (não duplicar); §12 ganha a ordem de merge.
- **r3** (2026-06-09): branch **rebaseada** sobre `main` (RFC 0004/#307 já
  mergeada). Reconciliação com a **RFC 0006** (mergeada, achatou `musicas/`): o
  exemplo do §5 e o §2.1 deixam de usar caminhos `musicas/` (que hoje quebram o
  `check-hygiene §6`); novo box "pasta-por-post ≠ pasta-de-categoria" deixa
  explícito que o princípio da 0006 **endossa** o Shape B. Coordenação com a
  **RFC 0005** (Hrönir→TS, _downstream_ desta) anotada.
- **r4** (2026-06-09): **Fases 0–2 implementadas** na PR #306. Fase 0: migração
  203 posts → `<slug>/index.md`, loader `**/index.*` + `generateId`,
  `content.mjs` e paths dos rate files atualizados — URLs idênticas. Fase 1:
  `draft-worst` cria `<slug>/v-<ts>.md` (canônica intocada), `draft-commit`
  valida/registra; `posts.js` ganha `isCanonical`/`listVersions` e
  `findTranslations` vira canônica-only. Fase 2: guard `aKey===bKey` nas trilhas
  públicas, `computeVersionRatings`, duelo de versão no `generateNextMatch`, e o
  comando `promote` (swap com `supersedes`; `supersedes` entra no schema zod).
  Aliases `edit-worst`/`edit-commit` mantidos. Verde: build, doctor, golden
  20/20, check:links/translations/hygiene.
- **r5** (2026-06-10): **Fase 3 implementada**. `promote --all` varre todas as
  chaves canonicais e auto-promove as que cruzaram o limiar (margem ≥0.3★,
  n≥2 duelos). `prune [--dry-run]` remove versões que perderam para a canônica
  por ≥0.5★ em ≥3 duelos. `npm run hronir:prune` adicionado ao `package.json`.
  RFC 0003 status atualizado para "Implemented (Fases 0–3)".
- **r6** (2026-06-10): erratum pós **primeira promoção real** (PR #321,
  `music-vos`: rascunho EN venceu por +1.63★ em 3 duelos). Dois achados de
  produção: (a) o `doctor` exigia que `post_a/b.path` existissem, mas
  promote/prune apagam o path gravado — tolerância do §7 implementada (QA 7
  resolvida); (b) **gap novo**: promoção por-língua × `check:translations`,
  que exige o par PT/EN evoluindo junto — registrado como QA 8, com fix
  candidato (promover espelhos do mesmo round como unidade). Workaround
  aplicado na #321: `promote --draft` do espelho PT.
