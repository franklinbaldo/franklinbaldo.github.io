# Plano: UI/UX & Wow Factor do Ranking

> Status: proposta — não implementada ainda.
> Contexto: `/pt/ranking/` usa `RankingView.astro`, alimentado por `hronir-rank.ts` que lê os arquivos `.routines/hronir/*.md`.

---

## O problema hoje

A página existe e já é conceitualmente incrível — um sistema de duelos par-a-par com OpenSkill para ranquear posts de blog. Mas a experiência visual não faz jus a essa ideia. Os duelos aparecem como uma lista seca ("Post A venceu Post B · critério"), sem revelar o que realmente aconteceu: o juiz leu os dois posts, escreveu uma análise apaixonada de cada um, e deu um veredito fundamentado. **Esse conteúdo existe nos arquivos `.md` mas nunca é renderizado.**

Pontos de atrito:

- Seção "Últimos duelos" mostra só winner/loser e o critério — nenhuma carne.
- Não há como filtrar/buscar batalhas por critério, confiança, post específico, ou texto.
- O pódio tem números mas não tem drama; não convida a clicar.
- A tabela completa é densa e técnica — o leitor casual não sabe o que fazer com μ e σ.
- "Ainda sem duelo" é uma lista plana sem personalidade.

---

## Mudança 1 — Renderizar o conteúdo das batalhas

### O que existe nos arquivos `.md`

Cada arquivo em `.routines/hronir/` tem:

- Frontmatter: `criterion`, `winner`, `margin`, `confidence`, `model`, `season`
- Corpo: **análise do Post A**, **análise do Post B**, **veredito** — tudo em markdown, escrito pelo juiz (humano ou modelo).

### O que fazer

**1a. Expor o corpo das batalhas via `hronir-rank.ts`**

Adicionar `body: string` ao `DuelEntry`:

```ts
// em scripts/hronir/lib/matches.js — ler também o body (gray-matter já faz isso)
// em hronir-rank.ts — incluir body no DuelEntry
export interface DuelEntry {
  // ...campos existentes...
  body?: string;        // markdown do julgamento
  model?: string;       // claude-opus-4-7 etc
  season?: number;
  margin?: number;
}
```

**1b. Seção "Batalhas" com cards expansíveis**

Substituir a lista de texto plano de "Últimos duelos" por cards visuais:

```
┌─────────────────────────────────────────────────────┐
│  ⚔  gateway · temporada 1 · 18 mai 2026             │
│                                                      │
│  [Crossing Interference]  venceu  [Delegating to…]  │
│   ████████████████░░░░░         margem: alta         │
│                                                      │
│  ▼ Ver julgamento completo                           │
└─────────────────────────────────────────────────────┘
```

Ao expandir:

```
│  ## Post A — Crossing Interference                   │
│  Post de atualização da Travessia: Franklin entra…   │
│                                                      │
│  ## Post B — Delegating to Agents                    │
│  Reflexão sobre orquestrar agentes enquanto…         │
│                                                      │
│  ## Veredito                                         │
│  Para um leitor que nunca leu Franklin…              │
│                                                      │
│  Julgado por claude-opus-4-7                         │
└─────────────────────────────────────────────────────┘
```

Implementação:

- `<details>`/`<summary>` nativo (zero JS, acessível)
- Markdown do body renderizado com `<Fragment set:html={marked(body)} />`
- Ou, mais simples: `marked` já é dependência? Se não, usar um split manual em `## ` sections

**1c. Visual dos cards de batalha**

- Barra de "tensão" entre os dois posts, mostrando quem ganhou
- Medalha do critério como tag colorida (gateway = azul, etc.)
- Confiança como badge existente mas mais proeminente
- Margem como "vitória apertada" / "vitória clara" / "domínio total"

---

## Mudança 2 — Filtros e busca

### Filtros estáticos (sem servidor, só JS no cliente)

Implementar com `<input>` e atributos `data-*` nos cards — filtragem instantânea no cliente.

**Filtros propostos:**

| Filtro          | Tipo               | Valores                           |
| --------------- | ------------------ | --------------------------------- |
| Busca livre     | text               | título do post, texto do veredito |
| Critério        | multi-select chips | gateway, depth, clarity, etc.     |
| Confiança       | pills              | alta / média / baixa              |
| Temporada       | select             | 1, 2, …                           |
| Post específico | text/autocomplete  | nome do post                      |

**Padrão de implementação (sem framework):**

```html
<!-- Barra de filtros fixa abaixo do header -->
<div class="battle-filters" id="battle-filters">
  <input type="search" placeholder="Buscar batalhas…" id="filter-search" />
  <div class="filter-chips" id="filter-criterion">
    <!-- chip por critério, gerados no build -->
  </div>
  <div class="filter-pills" id="filter-confidence">
    <button data-filter="all" class="active">Todas</button>
    <button data-filter="high">Alta confiança</button>
    <button data-filter="medium">Média</button>
    <button data-filter="low">Baixa</button>
  </div>
</div>

<!-- Cada card tem os atributos necessários -->
<article
  class="battle-card"
  data-criterion="gateway"
  data-confidence="medium"
  data-season="1"
  data-posts="crossing-interference delegating-to-agents"
  data-body="texto do julgamento para busca"
>
```

```js
// ~30 linhas de JS vanilla no final da página
const cards = document.querySelectorAll('.battle-card');
// ao mudar qualquer filtro, ocultar cards que não batem com `display:none`
```

**Contador de resultados:**

```
Mostrando 12 de 47 batalhas
```

---

## Mudança 3 — Página dedicada por batalha (opcional, fase 2)

Cada batalha poderia ter sua própria URL: `/pt/ranking/batalhas/crossing-interference-vs-delegating/`

Isso permite:

- OG image gerada com os dois títulos em duelo
- Link permanente compartilhável
- JSON-LD com a análise como `Review`
- Melhor indexação de conteúdo

**Implementação:** `getStaticPaths` no Astro lendo todos os `.md` de batalhas.

---

## Mudança 4 — Melhorias visuais pontuais no ranking

### 4a. Pódio com mais drama

Atual: três cards iguais com número.  
Proposto:

- Card central (1º lugar) mais alto que os laterais — layout de pódio real
- Animação CSS sutil de entrada (escala + opacity) ao carregar
- Fundo com gradiente dourado/prata/bronze no topo do card

```
      ┌──────┐
      │  1º  │   ← mais alto
┌────┐│      │┌────┐
│ 2º ││      ││ 3º │
│    ││      ││    │
└────┘└──────┘└────┘
```

### 4b. Tabela com quick-expand

Clicar em uma linha da tabela expande um mini-resumo inline:

- Últimas 3 batalhas daquele post
- Barra de win rate visual
- Link direto para o post

### 4c. Stats com contexto

Atual: `47 duelos disputados`  
Proposto: `47 duelos disputados · ~2.1 por semana desde mai 2026`

Adicionar sparkline de duelos por semana (SVG inline gerado no build, zero runtime).

### 4d. "Ainda sem duelo" — transformar em convite

Atual: lista plana.  
Proposto: framing como "fila de espera" com call-to-action para o leitor:

> _Esses posts ainda não passaram pelo julgamento. Sente que algum deles merecia estar no topo? [Abra uma issue sugerindo um duelo.](link)_

---

## Ordem de implementação sugerida

| Prioridade | Item                                        | Esforço | Impacto    |
| ---------- | ------------------------------------------- | ------- | ---------- |
| 1          | Expor `body` das batalhas em `DuelEntry`    | pequeno | alto       |
| 2          | Cards expansíveis com o texto do julgamento | médio   | **máximo** |
| 3          | Filtros de critério + busca livre           | médio   | alto       |
| 4          | Pódio com layout real (estilo olímpico)     | pequeno | médio      |
| 5          | Filtros de confiança + temporada            | pequeno | médio      |
| 6          | Stats com sparkline de atividade            | médio   | médio      |
| 7          | Tabela com quick-expand inline              | médio   | baixo      |
| 8          | Páginas individuais por batalha             | grande  | alto (SEO) |

---

## Arquivos que serão modificados

```
src/lib/hronir-rank.ts          ← adicionar body + model + season ao DuelEntry
scripts/hronir/lib/matches.js   ← expor body do gray-matter
src/components/RankingView.astro ← cards de batalha, filtros, pódio novo
src/pages/pt/ranking.astro      ← passar novos dados, strings novas
src/pages/ranking.astro         ← idem (versão en)
```

Nenhuma mudança de schema de conteúdo — os dados já existem nos `.md`, só não estão sendo lidos.
