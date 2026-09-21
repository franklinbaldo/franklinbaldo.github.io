---
date: 2026-06-05T14:00:00
slug: dual-rss-manifest-i18n-desc
branch: claude/great-mccarthy-YXAa4
status: pr-open
session: 31
---

# Sessão 2026-06-05 — Dual RSS no footer, Web App Manifest, leitura i18n, description PT

## Contexto

Trigésima-primeira sessão. Branch designado: `claude/great-mccarthy-YXAa4`.

Estado ao chegar:

- 2 PRs abertos: #229 (hronir: run 2026-06-05), #228 (takeout: session 11 — Dark Forest)
- Sessão anterior (#30): Font Inter weights 400/600/700, footer language switcher
- Sessão #29: color-scheme meta, RSS alternativo no head, article:author OG fix, focus h1

## PRs revisados

| PR | Título | CI | Ação |
|----|--------|----|------|
| #229 | hronir: run 2026-06-05 | ✅ check + GitGuardian green | **Merged** (merge commit) |
| #228 | takeout: session 11 — Dark Forest post (Liu Cixin + alignment) | ✅ check + GitGuardian green | **Merged** (merge commit) |

Nota: Kilo Code Review aparece como "failure" em ambos, mas é um serviço externo de revisão de código — não é o CI de build/deploy. O `check` (Prettier + Astro build) passou.

## Melhorias implementadas (branch: `claude/great-mccarthy-YXAa4`)

### 1. Footer: dual RSS links — sempre visíveis

**Problema (backlog):** O footer mostrava apenas o link RSS do idioma atual da página. Um visitante EN no blog PT (ou vice-versa) não via o link para o feed da sua língua preferida. Descoberta de feed dependia de o usuário saber que há dois feeds.

**Antes:**
```astro
<li><small><a href={rssHref}>RSS</a></small></li>
```
(onde `rssHref` era calculado com base no `lang` da página)

**Depois:**
```astro
<li><small><a href="/rss.xml" aria-label="RSS feed (English)">RSS EN</a></small></li>
<li><small><a href="/pt/rss.xml" aria-label="Feed RSS (Português)">RSS PT</a></small></li>
```

**Por que:** Ambos os feeds existem e têm conteúdo distinto. Exibir os dois sempre garante que qualquer usuário — independente de qual versão do blog está visitando — veja imediatamente os dois feeds disponíveis. Consistente com o requisito de bilinguismo total do blog.

**Arquivos:** `src/components/Footer.astro`

---

### 2. Web App Manifest (`site.webmanifest`)

**Problema:** O blog não tinha `<link rel="manifest">` nem `site.webmanifest`. Browsers modernos (Chrome, Firefox, Safari) usam o manifest para:
- "Adicionar à tela inicial" (mobile)
- Nome correto e ícone na lista de apps instalados
- Sinal de PWA-readiness para o Google Lighthouse

**Implementação:**
- Arquivo criado em `public/site.webmanifest` com:
  - `name`, `short_name`: "Franklin Baldo"
  - `description`: essays tagline (EN)
  - `start_url`: "/"
  - `display`: "minimal-ui" (sem barra de endereço, mantém navegação)
  - `theme_color`: "#c96a2b" (laranja do Pico orange theme)
  - `background_color`: "#fdfdfd" (fundo claro padrão)
  - `icons`: favicon-192.png (único ícone PWA disponível no public/)
  - `categories`: `["education", "news"]`

- `<link rel="manifest" href="/site.webmanifest" />` adicionado ao `<head>` do PageLayout, junto com o apple-touch-icon.

**Arquivos:** `public/site.webmanifest`, `src/layouts/PageLayout.astro`

---

### 3. PostCard: reading time usa i18n key `post.minutesRead`

**Problema:** O componente `PostCard.astro` exibia `{minutesRead} min` hardcoded. Para posts PT, o leitor via "5 min" quando deveria ver "5 min de leitura".

**Contexto:** O `RecentList.astro` já usava corretamente `t(lang, 'post.minutesRead')` que retorna:
- EN: `"min read"` → "5 min read"
- PT: `"min de leitura"` → "5 min de leitura"

**Antes:**
```astro
{' · '}{minutesRead} min
```

**Depois:**
```astro
{' · '}{minutesRead} {t(postLang, 'post.minutesRead')}
```

**Arquivos:** `src/components/PostCard.astro`

---

### 4. PageLayout: descrição padrão sensível ao idioma

**Problema:** A destructuring do `description` em `PageLayout.astro` tinha como default `"Franklin Baldo's Digital Garden"` (inglês). Qualquer página PT que não passasse `description` explicitamente herdaria uma descrição em inglês — prejudicando SEO em resultados de busca em português.

**Solução:** Derivar o `lang` antes de calcular o default da `description`:

**Antes:**
```typescript
const {
  description = "Franklin Baldo's Digital Garden",
  lang = DEFAULT_LANG,
  ...
} = source;
```

**Depois:**
```typescript
const {
  description: _description,
  lang = DEFAULT_LANG,
  ...
} = source;
const description =
  _description ??
  (lang === "pt"
    ? "Jardim Digital de Franklin Baldo"
    : "Franklin Baldo's Digital Garden");
```

**Impacto:** Todas as páginas PT que não passam `description` (ex: futuras páginas PT adicionadas sem descrição explícita) recebem automaticamente a descrição PT. Totalmente defensivo — todas as páginas PT atuais já passam `description` explicitamente, então não há mudança visível agora.

**Arquivos:** `src/layouts/PageLayout.astro`

---

## Build verificado

```
prettier --check . → All matched files use Prettier code style! ✅
```

Astro build não rodado localmente (sem Node completo no container), mas:
- Nenhuma mudança de lógica de routing
- Apenas adição de `<link>` tag no `<head>` e mudança de prop destructuring
- `site.webmanifest` é um arquivo estático em `public/` (copiado diretamente)

## Cobertura PT-BR

Verificada na sessão anterior (#30) — 100% de paridade para todas as páginas estáticas e posts. O requisito "default EN, versão PT para todo post e página, serve conforme preferência do usuário" está totalmente implementado:
- Redirect automático via LanguageSwitcher (localStorage → navigator.language)
- Toast informativo ao redirecionar
- Footer language switcher (JS-injected, link de texto)
- Footer dual RSS links (EN + PT, sempre visíveis) ← **novo nesta sessão**

## Estado após esta sessão

- PR #229 mergeado ✅
- PR #228 mergeado ✅
- Footer: dual RSS links EN + PT ✅
- Web App Manifest ✅
- PostCard reading time i18n ✅
- PageLayout description fallback PT ✅

## Plano para próximas sessões

### Alta prioridade

1. **`font-display: optional` para Inter** — @fontsource v5.x usa `font-display: swap` por padrão. Para mudar para `optional` (elimina FOIT mas não carrega fonte se não cacheada), seria preciso ou:
   a) Instalar `@fontsource-variable/inter` (variable font, mais leve)
   b) Criar @font-face overrides no CSS com o mesmo `src` mas `font-display: optional`
   
   Requer inspecionar o CSS gerado pelo @fontsource para obter o `src` exato. Impacto: Lighthouse + CrUX LCP.

2. **Livros recentes no HomeAuthorRail** — Mostrar 2–3 livros do Goodreads RSS no rail do autor (desktop). O parser de livros existe em `BooksPage.astro`. Fetch no build com fallback `[]`. Adiciona contexto sobre o autor na homepage.

3. **Archive pagination** — 2026 está com ~90+ posts (EN + PT combinados). Monitor. Threshold de 50+ por ano/língua.

### Média prioridade

4. **Taxonomia de tipo de documento** — PR #219 foi fechado (base antiga, labels PT-only). Reimplementar corretamente:
   - Campo `type` no content schema: `z.enum(['essay', 'letter', 'fiction', 'technical', 'dialogue', 'music']).optional()`
   - Labels bilíngues no i18n
   - Filter UI no arquivo EN e PT
   - Aplicar `type` retroativamente nos frontmatters existentes (bulk update)

5. **Pagefind PT warnings** — Investigar por que algumas páginas PT emitem "has no `<html>` element" durante o build do Pagefind. Suspeita: algum endpoint de API (rss.xml, sitemap) sendo indexado incorretamente. Fix: pagefind config `--glob` para excluir não-HTML.

6. **Webmentions display** — Os endpoints webmention estão registrados (`webmention.io`) mas sem exibição visual. Decidir: implementar `Webmentions.astro` com fetch no build, ou remover os links.

### Baixa prioridade

7. **`<link rel="preconnect">` revisão** — Todas as fonts são locais (@fontsource), então `preconnect` só seria relevante para CDNs externos. Não há necessidade atual.

8. **RSS: adicionar `<atom:link rel="self">`** — Padrão para RSS autodiscovery. Verificar se os feeds PT e EN já incluem isso.

9. **Sitemap: `hreflang` no sitemap-index** — O Google recomenda declarar hreflang tanto no `<head>` quanto no sitemap para cobertura máxima. Verificar se `@astrojs/sitemap` já gera isso ou se precisa de config.

## Decisões arquiteturais

- **`display: "minimal-ui"` no manifest**: Preferido a `"standalone"` porque mantém os botões de navegação do browser — importante para um blog onde o leitor frequentemente navega para fora (links externos, citações). `"standalone"` removeria a barra de endereço, o que prejudicaria UX para conteúdo editorial.

- **Dual RSS sempre visível vs. só a da língua atual**: A alternativa seria mostrar apenas a RSS do idioma oposto no footer (complementar à que já está no header). Mas como o footer é um ponto de saída/descoberta, exibir as duas é mais simples e não cria ambiguidade.

- **`_description` como intermediário**: Alternativa seria mudar a ordem da destructuring e calcular `lang` antes, mas a forma `_description ?? (lang === "pt" ? ...)` é idiomática e mais clara. O comentário no código explica o `why` (dependência entre lang e description default).

## Arquivos modificados

- `src/components/Footer.astro` — dual RSS links EN + PT
- `public/site.webmanifest` — novo arquivo (Web App Manifest)
- `src/layouts/PageLayout.astro` — link rel="manifest" + description fallback PT
- `src/components/PostCard.astro` — reading time usa t(postLang, 'post.minutesRead')
- `.routines/2026-06-05T14-00-00-dual-rss-manifest-i18n-desc.md` — este arquivo

---

_Sessão: 2026-06-05 | Branch: `claude/great-mccarthy-YXAa4` | franklinbaldo@gmail.com_
