---
date: 2026-06-01
slug: seo-ui-ux-improvements
branch: claude/great-mccarthy-rtg3Q
status: done
type: routine
session: run-2026-06-01-seo
---

# Sessão 2026-06-01 — SEO / UI / UX improvements

## Contexto

Rotina de manutenção do blog. Objetivos da sessão:
1. Ler arquivos recentes de `.routines/`
2. Rever últimos commits e contexto
3. Review de PRs abertos e merge das boas
4. Melhorar SEO/UI/UX e gerar PR para próxima run
5. Controlar melhorias com log por sessão

## O que foi feito

### PRs revisados

| PR | Título | Status CI | Ação |
|----|--------|-----------|------|
| #211 | hronir: run 2026-06-01 | ✅ All green | **Merged** (squash) |
| #210 | takeout session 8 + data portrait | ❌ CI falhou | **Corrigido** |

**PR #210** — causa da falha: dois posts novos (`the-data-portrait.md`, `o-retrato-de-dados.md`) com formatação fora do padrão Prettier, e `scripts/analyze-takeout.py` causando `exit 2` no Prettier (sem parser para Python). Fix: formatar os posts + adicionar `*.py` ao `.prettierignore`. Push enviado para `claude/keen-franklin-6exjZ`.

### Auditoria de cobertura PT-BR

Resultado: **0 posts EN com `translationKey` sem par PT**. Todos os pares bilíngues estão corretamente linkados. O único post EN sem `translationKey` é `the-art-of-delegating-orchestrating-jules-and-claude-in-everyday-life.md` — está marcado como `draft: true`, então não precisa de par agora.

### Melhorias implementadas (PR: `claude/great-mccarthy-rtg3Q`)

#### 1. Language redirect notification (LanguageSwitcher.astro)

**Problema**: quando o usuário é redirecionado automaticamente para PT (ou EN), isso acontecia em silêncio — sem nenhuma indicação do motivo.

**Solução**: toast dismissível no canto inferior direito que aparece exatamente uma vez após o redirecionamento automático. Mostra a língua atual e um link para voltar à versão original. Auto-desaparece em 7 segundos.

Implementação:
- Antes do redirect: `sessionStorage.setItem('lang-redirect-from', pageLang)`
- No carregamento da nova página: verifica o flag, cria o toast via DOM, limpa o flag

#### 2. JSON-LD BlogPosting melhorado (PageLayout.astro)

Campos adicionados ao schema `BlogPosting`:
- `publisher`: `{ "@type": "Person", name: "Franklin Baldo", url: site }` — ajuda Google a associar os posts a uma entidade publicadora
- `isAccessibleForFree: true` — sinaliza que o conteúdo é gratuito (pode ativar rich results)
- `url`: canonical URL explícita (redundante mas recomendada pelo schema.org)
- `timeRequired`: `"PT{n}M"` em formato ISO 8601 derivado do `wordCount` — usado pelo Google para estimated reading time em featured snippets

#### 3. OG image type (PageLayout.astro)

Adicionado `<meta property="og:image:type" content="image/png" />` para ajudar parsers de OG que validam o tipo da imagem antes de exibi-la (especialmente LinkedIn e Slack).

#### 4. PostCard "Featured" localizado (PostCard.astro)

**Problema**: o badge "Featured" no PostCard estava hardcoded em inglês, mesmo sendo exibido em posts PT.

**Solução**: substituído por `t(postLang, 'featured.label')` que já existe no sistema i18n como `"Ensaio em destaque"` (PT) e `"Featured essay"` (EN).

## Estado atual das melhorias

| Área | Antes | Depois |
|------|-------|--------|
| Redirect silencioso | Sem aviso | Toast informativo |
| JSON-LD BlogPosting | author, keywords, wordCount | + publisher, isAccessibleForFree, url, timeRequired |
| OG image type | Não declarado | `image/png` explícito |
| PostCard badge | "Featured" (hardcoded EN) | Localizado por lang |

## Plano para próximas sessões

### Alta prioridade

1. **Verificar PR #210 pós-fix** — CI deve passar agora com o fix de Prettier. Merge manual na próxima run se CI estiver verde.

2. **Internacionalização do ranking de Hrönir** — a página `/ranking/` mostra posts de ambas as línguas misturados. Considerar filtragem por lang do usuário.

3. **Melhorar Archive/Tags para PT** — verificar se o arquivo PT mostra apenas posts PT e se os filtros de tags estão bilíngues.

### Média prioridade

4. **Traduzir posts de alta conversão** — usar o ranking hronir para identificar posts EN de alta conversão sem par PT e criar as traduções. Candidatos principais: `reclaiming-the-harness`, `travessia-the-project-that-writes-itself`, `who-the-asterisk-protects`.

5. **Newsletter / RSS bilíngue** — verificar se há um link de assinar o RSS nas duas línguas na home e no footer.

6. **Core Web Vitals** — medir LCP, CLS, FID. Inter via @fontsource é local (bom), mas poderia considerar `font-display: optional` para evitar FOIT.

### Baixa prioridade

7. **`article:section` no OG** — já existe. Verificar se está sendo populado corretamente para todos os posts.

8. **Preload do font Inter** — atualmente carregado via `@import` no CSS. Um `<link rel="preload" as="font">` para o arquivo `.woff2` principal reduziria uma viagem de rede.

9. **`hreflang` no RSS** — considerar adicionar versões alternadas no RSS feed.

## Arquivos modificados

- `src/components/LanguageSwitcher.astro` — toast de redirect
- `src/layouts/PageLayout.astro` — JSON-LD + OG type
- `src/components/PostCard.astro` — localização do badge Featured
- `.routines/20260601-seo-ui-ux-improvements.md` — este arquivo

---

_Sessão: 2026-06-01 | Branch: `claude/great-mccarthy-rtg3Q` | franklinbaldo@gmail.com_
