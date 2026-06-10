---
date: 2026-06-10T05:09:10
slug: content-type-taxonomy
branch: claude/sleepy-pasteur-ugxe5d
status: pr-open
issues: [241]
pr_opened: null
pr_merged: null
---

## Contexto ao chegar

Nenhum PR `routine` pendente de run anterior — nada a mergear. Backlog com 11 issues abertas (dentro da faixa 10–20, sem necessidade de reabastecer). PR #326 (RFC 0007, trabalho do Franklin) e PR #319 (hronir/jules) ignorados.

## O que foi feito

Implementação da issue #241 (`priority:alta`): taxonomia de tipo de documento para posts do blog.

### Mudanças entregues

**Schema** (`src/content.config.ts`):  
Campo `type: z.enum(['essay', 'letter', 'fiction', 'technical', 'dialogue']).optional()` adicionado ao `postSchema`. Separado do `postType: music` já existente — os dois coexistem sem conflito.

**i18n** (`src/lib/i18n.ts`):  
7 novas chaves tipadas: `post.typeEssay`, `post.typeLetter`, `post.typeFiction`, `post.typeTechnical`, `post.typeDialogue`, `archive.filterType`, `archive.filterAll` — com traduções EN e PT.

**Archive filter** (`src/pages/archive.astro` + `src/pages/pt/archive.astro`):  
Barra de botões de filtro por tipo com contagem em build time. Filtro client-side em ~15 linhas de JS inline (sem framework, sem rerouting). Seções de ano se ocultam automaticamente quando todas as linhas estão filtradas. ARIA: `role=group`, `aria-pressed`.

**PostCard badge** (`src/components/PostCard.astro`):  
Badge de tipo discreto (uppercase, muted) exibido na linha de metadados, ao lado de "featured". Aparece só quando o post tem `type` definido.

**Frontmatter bulk** (73 posts não-música):  
- `essay`: 67 posts — ensaios analíticos, argumentativos, pessoais  
- `technical`: 4 posts — guias de implementação, experimentos com LLMs  
- `fiction`: 2 posts — monólogos ficcionais (Funes)  
- Música (130 posts) deixada sem `type` (já identificada por `postType: music`)

### Verificações

- `npm run build` → 679 páginas, sem erros  
- `npx astro check` → 0 erros, 0 warnings (novos)  
- `npx prettier --check .` → OK  
- `npm run hronir:doctor` → 0 inconsistências

## O que fica para a próxima run

Nenhum item urgente. PR #326 (RFC 0007) pode precisar de atenção se CI ficar vermelho. O screenshot de prod do archive EN/PT será verificado na run seguinte após o merge.

**Nota visual para Franklin:** A URL a conferir é `/archive/` (EN) e `/pt/archive/` (PT) — os botões de filtro aparecem acima da tabela anual. Clicar em "Essay" oculta os posts sem tipo e os técnicos/ficção; "All" restaura tudo.
