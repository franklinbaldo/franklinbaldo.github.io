# RFC 0006 — Flatten `musicas/` subfolder

|                 |                                                                                                             |
| --------------- | ----------------------------------------------------------------------------------------------------------- |
| **Status**      | Draft / Proposed                                                                                            |
| **Autor**       | Franklin Baldo (proposta assistida)                                                                         |
| **Criado em**   | 2026-06-09                                                                                                  |
| **Branch / PR** | `claude/vibrant-volta-3giul0`                                                                               |
| **Depende de**  | RFC 0004 (higiene e convenções) — em execução                                                               |
| **Afeta**       | `src/content/blog/musicas/`, `scripts/generate-music-posts.mjs`, `scripts/generate-music-en-companions.mjs` |

> **Etapa 1 — só o RFC.** Implementação após merge da RFC 0004.
> Mesmo padrão das RFCs anteriores.

---

## 1. Resumo

Os posts de música vivem em `src/content/blog/musicas/` e são servidos em
`/blog/musicas/<slug>/`. Todo o resto do blog vive diretamente em
`src/content/blog/` e é servido em `/blog/<slug>/`. A pasta `musicas/` não
traz nenhum benefício de organização: ela não tem rota própria no Astro, não
tem loader separado, e o único diferenciador semântico é o campo
`postType: music` no frontmatter — que já existe em todos os 130 arquivos.

A proposta: mover os 130 arquivos para `src/content/blog/`, remover a pasta
`musicas/`, e emitir 130 pares de redirects 301 para preservar URLs existentes.

---

## 2. Motivação — evidência concreta

### 2.1. Subfolder sem função

`src/content/blog/musicas/` não corresponde a nenhum padrão do Astro (não é
um `getCollection` separado, não tem `content.config.ts` próprio). A
distinção música/blog hoje é exclusivamente via `postType: music` no
frontmatter. A pasta adiciona complexidade sem adicionar informação.

### 2.2. Scripts cegos a `musicas/` antes da RFC 0004

Antes da RFC 0004, `blog-links.mjs` era não-recursivo e não enxergava os 130
posts em `musicas/` — eles estavam invisíveis para `check:links`, para a
geração de hreflang, e para o ranking do Hrönir. A RFC 0004 corrigiu isso
via `scripts/lib/content.mjs` recursivo. Mas o código resultante tem dois
casos especiais: `"musicas/"` aparece como prefixo de `post.id` em
`blog-translation-pairs.json` e como prefixo de `post.file` em
`check-translations.mjs`. Esses casos especiais somem com o flatten.

### 2.3. URLs inconsistentes

URLs publicadas de música têm a forma `/blog/musicas/666/` enquanto posts de
blog têm `/blog/construindo-funes/`. A inconsistência confunde leitores e
dificulta decisões de SEO (uma URL mais curta é melhor, e.g. `/blog/666/`).

### 2.4. Zero colisões de slug

Verificado: nenhum slug em `musicas/` colide com um slug no nível raiz de
`src/content/blog/`. O flatten é seguro sem renomear arquivos.

---

## 3. Objetivos e não-objetivos

### Objetivos

- Um único diretório `src/content/blog/` para todos os posts.
- `postType: music` no frontmatter como único diferenciador semântico.
- URLs `/blog/musicas/<slug>/` resolvem via redirect 301 para `/blog/<slug>/`.
- `generate-music-posts.mjs` e `generate-music-en-companions.mjs` escrevem
  para `src/content/blog/` em vez de `src/content/blog/musicas/`.
- Hrönir: nenhuma mudança. Os rate files usam `translationKey` (ex:
  `music-666`) como chave — o campo vem do frontmatter, não do caminho do
  arquivo. Mover os arquivos não altera nenhuma chave existente.

### Não-objetivos

- Não mudar `postType: music` nem nenhum campo de frontmatter.
- Não mudar a página de listagem `/music/` nem `/pt/musicas/`.
- Não alterar o comportamento do player Suno nos posts.
- Não mudar schema de rate files nem reprocessar nenhum match.

---

## 4. Análise de impacto

| Componente                                  | Impacto                                                            |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `src/content/blog/musicas/*.mdx`            | 130 arquivos movidos para `src/content/blog/`                      |
| `src/pages/blog/[...slug].astro`            | Sem mudança — slug routing já cobre qualquer depth                 |
| `src/pages/pt/blog/[...slug].astro`         | Sem mudança                                                        |
| `src/pages/music.astro`                     | Sem mudança — busca Suno API diretamente                           |
| `src/pages/pt/musicas.astro`                | Sem mudança — busca Suno API diretamente                           |
| `src/generated/blog-redirects.json`         | +130 entradas (EN) + 130 entradas (PT) = +260 redirects            |
| `src/generated/blog-translation-pairs.json` | Regenerado (sem `musicas/` prefix nos IDs)                         |
| `scripts/generate-music-posts.mjs`          | `OUT_DIR` atualizado para `src/content/blog/`                      |
| `scripts/generate-music-en-companions.mjs`  | `MUSICAS_DIR` atualizado para `src/content/blog/`                  |
| `scripts/check-translations.mjs`            | Comentário de exemplo atualizado (não altera lógica)               |
| `scripts/lib/content.mjs`                   | Comentário de exemplo atualizado (não altera lógica)               |
| `scripts/hronir/lib/posts.js`               | Sem mudança — `keyForPath` usa `translationKey`, não o path        |
| `.routines/hronir/rates/*.json`             | Sem mudança — chaves são `translationKey`, não paths               |
| `astro.config.mjs`                          | Redirects `/music/` e `/musicas/` são para a listagem; sem mudança |
| `check:hygiene`                             | Adicionar `musicas/` à lista de prefixos banidos em blog           |

---

## 5. Plano de implementação (faseado)

### Fase 0 — Redirects (antes de mover os arquivos)

Adicionar as 260 entradas de redirect ao `blog-redirects.json` **antes** de
mover os arquivos. Isso garante que as URLs antigas continuem resolvendo mesmo
durante o deploy incremental.

Padrão das entradas a adicionar:

```json
"/blog/musicas/666/": "/blog/666/",
"/pt/blog/musicas/666/": "/pt/blog/666/",
"/blog/musicas/666-en/": "/blog/666-en/"
```

Extensão do `generate-redirects.mjs`: adicionar uma nova fonte que escaneia
`src/content/blog/musicas/` (enquanto ainda existe) e emite os pares
`/blog/musicas/<id>/` → `/blog/<id>/` para PT e
`/blog/musicas/<id>/` → `/blog/<id>/` para EN (onde EN usa o id do arquivo
`*-en.mdx` que termina em `-en`).

- **Critério de aceite:** `blog-redirects.json` gerado contém 260 novas
  entradas; `npm run build` verde; nenhuma URL existente quebrada.

### Fase 1 — Mover os 130 arquivos

```bash
git mv src/content/blog/musicas/* src/content/blog/
rmdir src/content/blog/musicas
```

Regenerar `blog-translation-pairs.json`:

```bash
npm run build:translation-pairs
```

- **Critério de aceite:** `npm run build` verde; `npx astro check` verde;
  `npm run hronir:doctor` verde (zero inconsistências).

### Fase 2 — Atualizar scripts geradores

- `scripts/generate-music-posts.mjs`: `OUT_DIR` → `src/content/blog/`
- `scripts/generate-music-en-companions.mjs`: `MUSICAS_DIR` → `src/content/blog/`
- Atualizar comentários de exemplo em `content.mjs` e `check-translations.mjs`.

- **Critério de aceite:** `npm run music:generate -- --dry-run` (se suportado)
  aponta para o diretório correto; ou verificação manual do `OUT_DIR`.

### Fase 3 — Limpeza e CI

- Adicionar à checagem de `check:hygiene` uma regra que proíbe novos arquivos
  em `src/content/blog/musicas/` (pasta não deve existir).
- Adicionar `npx astro check` + `npm run build` ao critério final de CI para
  garantir zero regressões de tipo.

- **Critério de aceite:** `npm run check:hygiene` verde; CI verde.

---

## 6. Redirects — detalhe técnico

O `astro.config.mjs` consome `src/generated/blog-redirects.json` via spread:

```js
import blogRedirects from "./src/generated/blog-redirects.json";
// ...
redirects: {
  ...blogRedirects,
  // ...outros redirects
}
```

O `generate-redirects.mjs` é o único ponto de escrita de `blog-redirects.json`.
A Fase 0 estende esse script — não edita o JSON à mão — para que o padrão de
geração permaneça centralizado.

A URL PT de um post de música (e.g. `musicas/666.mdx`) é
`/pt/blog/musicas/666/` (em Astro, a versão PT usa o prefixo `/pt/blog/`).
A URL EN de `musicas/666-en.mdx` é `/blog/musicas/666-en/`. Ambas precisam
de redirect.

---

## 7. Compatibilidade com o Hrönir

Os rate files armazenados em `.routines/hronir/rates/` usam o campo
`translationKey` do frontmatter como chave do post (e.g. `music-666`). Esse
campo não muda com o flatten — a chave de cada post permanece a mesma antes e
depois da migração. **Não é necessário rodar `hronir:migrate` nem modificar
nenhum rate file.**

---

## 8. Alternativas consideradas

- **Manter `musicas/` como namespace de slug** (e.g., slug `musicas/666` →
  URL `/blog/musicas/666/`). Resolve a hierarquia conceptual mas mantém o
  prefixo especial no código. Rejeitado: o prefixo não tem benefício funcional
  e o `postType` já faz o trabalho semântico.
- **Página de categoria dinâmica `/blog/musicas/`** (listagem de posts
  `postType: music`). Adiciona feature nova fora do escopo desta RFC. Não
  rejeitado — mas separar em RFC futura se necessário.
- **Renomear slugs** (e.g. `music-666` em vez de `666`). Mais descritivo, mas
  exige mudar 130 frontmatters e criar redirects de qualquer forma. Custo maior,
  benefício marginal. Rejeitado.

---

## 9. Questões em aberto

1. **Redirect PT via `/pt/blog/musicas/<slug>/` ou `/pt/musicas/<slug>/`?**
   Verificar qual é a URL canônica atual dos posts PT de música. O padrão do
   site é `/pt/blog/<slug>/` para posts e `/pt/musicas/` para a listagem.
   _Leaning:_ verificar com `npm run build` e inspecionar o output em `dist/`.

2. **`npm run music:generate` após o flatten:** Se alguém rodar o gerador com
   a versão antiga (apontando para `musicas/`), ele vai criar a pasta novamente
   e silenciosamente reverter o flatten. Solução: fazer o `check:hygiene` da
   Fase 3 pegar esse caso rapidamente.

---

## 10. Plano de execução da PR

1. **Commit 1 (este):** RFC `0006`.
2. Após merge da RFC 0004: **Fase 0** → **Fase 1** → **Fase 2** → **Fase 3**,
   cada fase em commit próprio, verde antes de avançar.
3. Merge com **merge commit**, conforme `CLAUDE.md`.

**Ordem de execução das RFCs:**
`0004 (ativo) → 0006 → 0003 → 0005`

---

## Histórico de revisões

- **r0** (2026-06-09): versão inicial. Decisão: flatten + redirects 1:1 +
  `postType: music` como único diferenciador; sem `hronir:migrate` necessário.
