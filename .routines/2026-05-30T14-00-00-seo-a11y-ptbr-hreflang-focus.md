---
date: 2026-05-30T14:00:00
slug: seo-a11y-ptbr-hreflang-focus
branch: claude/great-mccarthy-yT6Zm
status: pr-open
session: 26
---

# Sessão 2026-05-30 — SEO pt-BR hreflang + acessibilidade focus management

## Contexto

Vigésima-sexta sessão. Branch designado: `claude/great-mccarthy-yT6Zm`.

Estado ao chegar:

- 3 PRs abertos: #200 (ranking/archive/mobile rail, CI failing), #201 (hronir run), #202 (takeout log)
- Cobertura bilíngue: todas as páginas e posts têm versão PT ✅
- Sistema de detecção de preferência de idioma já implementado no LanguageSwitcher
- Backlog: focus management, hreflang pt-BR, livros recentes no rail

## PRs revisados

| PR   | Título                                              | Ação                                                              |
| ---- | --------------------------------------------------- | ----------------------------------------------------------------- |
| #201 | hronir: run 2026-05-30                              | **Mergeado** — CI verde, squash merge                             |
| #202 | Add Takeout session log April–May 2026              | **Mergeado** — CI verde, squash merge                             |
| #200 | feat(ux): ranking in nav + archive year-jump        | **CI fix** — `.prettierignore` simplificado para `.routines/`     |

### Root cause CI #200

Arquivo `.routines/2026-05-29T14-00-00-ranking-nav-archive-jump-mobile-rail.md`
não passava no check de Prettier. O `.prettierignore` excluía `hronir/` e `takeout/`
mas não os arquivos `.md` de log diretos em `.routines/`. Fix: substituir as duas
linhas por `.routines/` (exclui o diretório inteiro, incluindo subdiretórios).
Push direto ao branch do PR #200.

## Ações realizadas nesta sessão

### 1. SEO: `hreflang` e `<html lang>` usando `pt-BR`

**Problema**: O blog usa `lang="pt"` no atributo HTML e `hreflang="pt"` nos links
de alternativa. Para conteúdo em Português Brasileiro, `pt-BR` é mais preciso e
distingue de `pt-PT` (Português Europeu) para engines de busca.

**Arquivo modificado**: `src/layouts/PageLayout.astro`

**Mudanças**:

```diff
- const langBcp47 = lang === "pt" ? "pt-BR" : "en-US";
+ const langBcp47 = lang === "pt" ? "pt-BR" : "en";
+ const hreflangFor = (code: string) => code === "pt" ? "pt-BR" : code;

- <html lang={lang}>
+ <html lang={langBcp47}>

- <link rel="alternate" hreflang={lang} href={canonical.href} />
- {alternateEntries.map(([code, href]) => (
-   <link rel="alternate" hreflang={code} href={...} />
- ))}
+ <link rel="alternate" hreflang={hreflangFor(lang)} href={canonical.href} />
+ {alternateEntries.map(([code, href]) => (
+   <link rel="alternate" hreflang={hreflangFor(code)} href={...} />
+ ))}
```

**Efeito secundário positivo**: O pagefind agora indexa a busca em `pt-BR` em
vez de `pt`, o que melhora os resultados de busca para falantes de Português
Brasileiro. Confirmado no output do build: "Discovered 2 languages: en, pt-br".

**`en-US` → `en` no JSON-LD**: O blog não targeta exclusivamente americanos —
o inglês aqui é para falantes globais. Mudança de `en-US` para `en` no campo
`inLanguage` do JSON-LD é mais precisa semanticamente.

### 2. Acessibilidade: focus management após ClientRouter

**Problema**: Após navegações SPA via Astro's ClientRouter (View Transitions), o
foco do teclado/leitor de tela não era movido para o novo conteúdo. Usuários de
teclado ficavam com foco "perdido" após cada navegação interna.

**Arquivo modificado**: `src/layouts/PageLayout.astro`

**Mudanças**:

1. `<main id="main">` → `<main id="main" tabindex="-1">` — permite foco programático
   sem inserir o elemento na ordem de tabulação normal.

2. Script no `<head>` registra listener para `astro:after-swap`:

```js
document.addEventListener('astro:after-swap', () => {
  const main = document.getElementById('main');
  if (main) main.focus({ preventScroll: true });
});
```

**Por que `astro:after-swap` e não `astro:page-load`**:
- `astro:page-load` dispara no carregamento inicial E em navegações → causaria
  foco inesperado no load inicial da página.
- `astro:after-swap` dispara SOMENTE após swaps de DOM (navegações SPA) → correto.

**Por que `preventScroll: true`**: Após navegação, o usuário já está no topo da
nova página. Sem `preventScroll`, `focus()` causaria scroll desnecessário.

**Por que no `<head>`**: Scripts no `<head>` com `is:inline` (sem `define:vars`)
rodam uma vez por carregamento de página. O listener persiste no `document` para
todas as navegações subsequentes via ClientRouter.

## Estado após esta sessão

- PRs #201 e #202 mergeados ✅
- PR #200 CI fix empurrado → aguardando CI verde ✅
- `<html lang="pt-BR">` para páginas PT ✅ (SEO)
- `hreflang="pt-BR"` para todos os links PT ✅ (SEO)
- `JSON-LD inLanguage: "en"` (era `"en-US"`) ✅ (semântica)
- `<main tabindex="-1">` ✅ (acessibilidade)
- `astro:after-swap` focus management ✅ (acessibilidade)

## Cobertura bilíngue

Estado verificado nesta sessão:

| Métrica                              | Status  |
| ------------------------------------ | ------- |
| Páginas EN com tradução PT declarada | 100% ✅ |
| Páginas PT com tradução EN declarada | 100% ✅ |
| Auto-redirect por preferência de lang| ✅ (implementado no LanguageSwitcher) |
| hreflang correto (pt-BR)             | ✅ (esta sessão) |
| html lang correto (pt-BR)            | ✅ (esta sessão) |

## Próximas sessões — backlog priorizado

### Alta prioridade

1. **Merge PR #200** — Fix do Prettier já empurrado; aguardando CI verde.
   Entrega: ranking no nav, year-jump no arquivo, AuthorRail mobile compacto.

2. **Livros recentes no HomeAuthorRail** — Mostrar 2–3 livros recentes do
   Goodreads RSS no rail do autor (desktop). Parser já existe em `BooksPage.astro`.
   Boa adição de conteúdo dinâmico ao rail. Baixo custo de implementação.

3. **PT translation do post `the-art-of-delegating-orchestrating-jules...`** —
   A versão PT (`delegando-para-agentes.md`) já existe e está publicada (`draft: false`).
   A versão EN está em `draft: true`. Revisar o rascunho EN e publicá-lo, ou vincular
   explicitamente os dois posts como par de tradução via `translationKey`.

### Média prioridade

4. **Archive pagination** — Com 40+ posts em 2026, a seção domina o arquivo.
   Year-jump (PR #200) mitiga o problema mas não resolve longo prazo.
   Threshold para implementar: 50+ posts EN no mesmo ano.

5. **Pixel art avatar** — BLOQUEADO: requer `/public/avatar-pixel.png` de Franklin.

6. **Focus management refinement** — Verificar em produção que o foco vai para
   `<main>` corretamente. Em alguns casos pode ser preferível focar o `<h1>` da
   nova página em vez de `<main>` para melhor anúncio em screen readers.

### Baixa prioridade

7. **`skip-link` melhorado** — O "Skip to content" link já existe. Verificar se
   está visível ao receber foco (CSS `:focus-visible` adequado).

8. **lang switch com `navigate()`** — Atualmente o auto-redirect usa `location.href`
   (reload completo). Migrar para `navigate()` da `astro:transitions/client` daria
   uma experiência SPA mais fluida. Custo: médio; benefício: percepção de velocidade.

## Decisões arquiteturais

- **`pt-BR` vs `pt` para hreflang**: O Google Indexing aceita ambos, mas `pt-BR`
  é preferível quando o conteúdo é especificamente Português Brasileiro (não lusitano).
  O blog é escrito por um autor brasileiro sobre contexto brasileiro — `pt-BR` é
  semânticamente correto.

- **`en` em vez de `en-US` no JSON-LD**: `en-US` no campo `inLanguage` seria
  preciso apenas se o conteúdo fosse exclusivamente para americanos. O inglês
  deste blog é para leitores globais. `en` (BCP 47 genérico) é mais adequado.

- **`astro:after-swap` para focus, não `astro:page-load`**: O evento `page-load`
  dispara no carregamento inicial da página, o que causaria comportamento indesejado
  (foco automático no main ao abrir o site pela primeira vez). `after-swap` é
  exclusivo de navegações SPA, que é exatamente quando o foco precisa ser gerenciado.

- **`{ preventScroll: true }` no focus()**: Sem esta opção, chamar `.focus()` num
  elemento fora da viewport causa scroll automático. Após uma navegação SPA, o
  usuário já está no topo da página — scroll adicional seria disruptivo.
