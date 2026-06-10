# RFC 0007 — Ranking: UI e UX de leitura

|                 |                                                                                                                                                                                        |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**      | Proposta (r0)                                                                                                                                                                          |
| **Autor**       | Franklin Baldo (proposta assistida)                                                                                                                                                    |
| **Criado em**   | 2026-06-10                                                                                                                                                                             |
| **Branch / PR** | `claude/sweet-hypatia-1joz7o`                                                                                                                                                          |
| **Depende de**  | —                                                                                                                                                                                      |
| **Afeta**       | `src/pages/ranking.astro`, `src/pages/pt/ranking.astro`, `src/components/RankingView.astro`, `src/pages/ranking/perspectives/`, `src/hronir/perspectives.ts`, `src/lib/hronir-rank.ts` |

> **Etapa 1 — só o RFC.** Implementação faseada após merge, cada fase verde
> antes da próxima, conforme o padrão das RFCs anteriores.

---

## 1. Resumo

A página `/ranking/` cresceu por acreção: pódio, tabela OpenSkill, filtros,
cards de batalha com resenhas completas. O resultado funciona para quem já
conhece o Hrönir, mas tem três problemas estruturais para o leitor comum:

1. **Peso**: o HTML da página tem **3,1 MB por idioma** — todos os 338 duelos
   são renderizados integralmente no documento; a paginação só alterna
   `display: none`.
2. **Becos sem saída**: as páginas de perspectiva retornam **404 em produção**
   (bug de build silencioso), nada na página linka para elas, filtros não
   sobrevivem a um reload, e não existe visão "todos os duelos deste post".
3. **Hermetismo**: μ, σ e ordinal são apresentados sem mediação além de
   tooltips `abbr@title`, que não funcionam em touch. O leitor casual não tem
   como saber o que está olhando.

Esta RFC documenta o diagnóstico com evidências e propõe correções em cinco
fases: bugs imediatos, dieta da página, estado na URL, legibilidade para
leitores e dossiê por post.

---

## 2. Diagnóstico — evidência concreta

Números de referência (build de 2026-06-10): 225 arquivos de post,
338 rate files em `.routines/hronir/rates/` (1,6 MB), 12 perspectivas.

### D1. Página de 3,1 MB — paginação cosmética

```
dist/ranking/index.html        3.100.721 bytes
dist/pt/ranking/index.html     3.113.857 bytes
dist/archive/index.html          158.332 bytes   (referência)
dist/index.html                   74.220 bytes   (referência)
```

`RankingView.astro` renderiza **todos** os duelos de `getAllDuels()` no
documento, cada um com veredito + duas resenhas (≥100 palavras cada) passadas
pelo `marked.parse`, mais um atributo `data-search` que duplica todo o texto
em minúsculas para a busca client-side. A "paginação" (15 cards por página)
acontece depois, em JS, escondendo cards com `display: none` — o DOM e o
download carregam tudo sempre.

Cada duelo custa ~9 KB de HTML × 2 idiomas. Com o autopilot rodando, a página
cresce sem teto: mais um ano de sessões e passamos de 6 MB. Em mobile isso é
custo real de dados, parse e LCP.

### D2. Páginas de perspectiva: 404 em produção, bug silencioso

`src/pages/ranking/perspectives/[id].astro` existe, funciona no `astro dev`
(HTTP 200), mas **não é emitida no build estático** — verificado:
`https://franklinbaldo.github.io/ranking/perspectives/curious-outsider/`
retorna 404, e o build de 1180 rotas não contém nenhuma delas.

Causa raiz: `src/hronir/perspectives.ts:7-10` resolve o diretório de
perspectivas a partir de `import.meta.url`:

```ts
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const PERSPECTIVES_DIR = path.join(ROOT, "scripts/hronir/perspectives");
```

No dev server o módulo roda de `src/hronir/` e o caminho fecha. No build, o
vite reloca o chunk e `ROOT` aponta para fora do repo; `fs.existsSync`
falha, `listPerspectives()` retorna `[]` (linha 22), `getStaticPaths()`
retorna `[]` e o Astro emite **zero páginas sem nenhum erro**. Já
`posts.ts:8` usa caminho relativo ao cwd (`".routines/hronir"`) — por isso os
duelos da `/ranking/` funcionam no mesmo build.

Agravante de UX: mesmo se as páginas existissem, **nada na `/ranking/` linka
para elas**. Os chips de perspectiva apenas filtram batalhas; o leitor não
descobre que cada perspectiva tem ranking próprio.

### D3. Estado efêmero: nada é compartilhável

- Filtros (busca, season, agente, confiança, perspectiva, critério) e página
  atual vivem só em variáveis JS. Recarregar ou compartilhar a URL perde tudo.
- Cards de batalha não têm `id`/anchor — é impossível linkar um duelo
  específico, embora cada rate file tenha identificador estável.
- O botão "voltar" do navegador ignora qualquer interação com filtros.

### D4. Tabela hermética para o leitor casual

- μ, σ e ordinal só são explicados via `abbr@title` — invisível em touch
  (maioria do tráfego mobile) e sem affordance além de um pontilhado.
- O win rate existe mas está escondido num `title` do `<td>`
  (`RankingView.astro:273`).
- Não há indicação de movimento (subiu/desceu desde a última rodada).
- O top-3 vive só no pódio e **não aparece na tabela** (`rows.slice(3)`):
  Ctrl+F e leitura sequencial da tabela começam no #4.

### D5. Sem visão por post

Não existe página que responda "por que este post está em #12?": histórico de
duelos do post, resenhas que recebeu, trajetória de rating. O leitor que chega
pelo post também não tem caminho para o ranking — a ligação é unidirecional.

### D6. Vazamento de idioma na página EN

`RankingView.astro:299` hardcoda o texto do link da CTA de posts não
avaliados em português ("Abra uma issue sugerindo um duelo.") mesmo na página
EN. Deveria ser uma string de `RankingStrings`.

### D7. Barra de tensão fabrica dados

`RankingView.astro:404-406`: quando o duelo não tem `rate_a`/`rate_b`, a
barra de tensão usa `65%` como default — o leitor lê uma proporção que não
existe. Dado ausente deve ser apresentado como ausente.

### D8. Acessibilidade dos filtros

- Chips e pills são `<button>` sem `aria-pressed`/`role` — leitores de tela
  não anunciam o estado ativo.
- O contador "Showing X of Y battles" não tem `aria-live`, então mudanças de
  filtro são silenciosas.
- Botões dentro de form-less markup sem `type="button"` (inofensivo aqui, mas
  frágil).

### D9. Dados carregados e nunca exibidos

`DuelEntry` carrega `evaluatorMood` e `evaluatorMoodAfter` para todos os
duelos (`hronir-rank.ts:153-158`) e a UI nunca os mostra — e o mood é
justamente a assinatura narrativa do Hrönir. A string `ratesLabel` em
`RankingStrings` está morta. Custo zero de remoção, ganho narrativo real de
exibição.

---

## 3. Objetivos e não-objetivos

### Objetivos

- `/ranking/` com peso de página normal (≤ ~300 KB) e crescimento O(1) com o
  número de duelos.
- Toda visão tem URL: filtros, página do arquivo de batalhas, duelo
  individual, perspectiva, dossiê de post.
- Leitor casual entende o ranking sem conhecer OpenSkill; o detalhe técnico
  (μ, σ) fica a um clique, não na cara.
- Bug das páginas de perspectiva corrigido **com guarda contra regressão**
  (build falha se `getStaticPaths` de perspectivas retornar vazio).
- Ligação bidirecional post ↔ ranking.

### Não-objetivos

- Não mudar o motor de rating (OpenSkill, ordinal = μ − 3σ), o schema
  `stars-v1`, nem o CLI do Hrönir.
- Não introduzir framework de UI/ilha hidratada — a página continua
  Astro estático + JS vanilla progressivo.
- Não redesenhar a identidade visual (Pico CSS, tema atual).
- Não mexer nas OG images do ranking.

---

## 4. Proposta por fases

### Fase 0 — Correções imediatas (bugs, sem mudança de design)

1. **Perspectivas no build (D2):** trocar a resolução de `PERSPECTIVES_DIR`
   para caminho relativo ao cwd, alinhada com `posts.ts` (o build sempre roda
   da raiz do repo — mesma premissa que `.routines/hronir` já assume).
   Adicionar guarda: `getStaticPaths()` de `[id].astro` lança erro se
   `getPerspectives()` vier vazio — o build quebra alto em vez de emitir
   silenciosamente zero páginas.
2. **i18n da CTA (D6):** mover o texto do link para `RankingStrings.unratedCTALink`.
3. **Barra de tensão honesta (D7):** sem rates, não renderizar a barra.
4. **A11y básica (D8):** `aria-pressed` nos chips/pills, `aria-live="polite"`
   no contador, `type="button"` nos botões de filtro.
5. **Limpeza (D9):** remover `ratesLabel` morto.

**Critério de aceite:** `dist/ranking/perspectives/<id>/index.html` existe
para as 12 perspectivas; curl em produção retorna 200 após deploy;
`npm run build` + `npx astro check` + prettier verdes.

### Fase 1 — Dieta da página: arquivo de batalhas paginado

A raiz do problema D1 é arquitetural: um arquivo crescente renderizado numa
página só.

1. **`/ranking/` enxuta:** mantém pódio, stats, tabela completa (incluindo
   top-3 — resolve parte de D4), seção de não avaliados e **apenas os ~10
   duelos mais recentes** como cards resumidos, com link "ver todas as
   batalhas".
2. **`/ranking/battles/[page]/`:** rota estática paginada (20 cards por
   página, mais recente primeiro), gerada no build via `getStaticPaths` —
   paginação real, por URL, sem JS obrigatório.
3. **`/ranking/battles/<id>/`:** página por duelo com o conteúdo completo
   (veredito, resenhas A/B, mood do avaliador — D9), usando identificador
   estável derivado do rate file. Os cards nas listagens carregam só o
   cabeçalho (data, tags, versus, rates) e linkam para a página do duelo —
   o corpo sai do HTML das listagens, e `<details>` deixa de ser o container
   do conteúdo pesado.
4. **Busca via Pagefind (substitui `data-search`):** as páginas de duelo
   entram no índice Pagefind que o site já usa (`pagefind --site dist` já
   roda no build). A caixa de busca de batalhas passa a consultar o índice —
   busca melhor (stemming, ranking) e elimina a duplicação de texto nos
   atributos.

Os filtros estruturados (season, agente, perspectiva, confiança, critério)
continuam client-side, mas operando sobre os cabeçalhos leves da página
corrente do arquivo.

**Critério de aceite:** `dist/ranking/index.html` ≤ 300 KB; soma de páginas
do arquivo cobre 100% dos duelos válidos; cada duelo tem URL própria estável;
busca encontra texto que hoje só existe no corpo das resenhas.

### Fase 2 — Estado na URL

1. Filtros e página refletidos em query params
   (`?q=…&season=2&perspective=curious-outsider`), aplicados na carga e
   atualizados via `history.replaceState`.
2. Anchors nos cards (`id` = identificador do duelo) para deep-link dentro
   de uma página do arquivo.

**Critério de aceite:** colar uma URL filtrada reproduz exatamente a visão;
back/forward não perde estado; sem JS, as URLs continuam resolvendo (filtros
são progressive enhancement).

### Fase 3 — Legibilidade para leitores

1. **Explicação em camadas:** um parágrafo curto em linguagem comum no topo
   ("posts duelam em pares; vence quem convence; a posição combina força
   estimada e incerteza") + `<details>` "como funciona o ranking" com a
   explicação completa de μ/σ/ordinal — substitui os tooltips `abbr@title`
   como canal principal (D4).
2. **Tabela com modos:** por padrão, colunas Post / ★ posição / vitórias
   (win rate visível, D4) / confiança; μ, σ e ordinal ficam atrás de um
   toggle "detalhes técnicos" (persistido em `localStorage`). Top-3 também
   listado na tabela, com destaque.
3. **Movimento (Δ):** persistir snapshot do ranking por build em
   `src/generated/ranking-snapshot.json` (schema versionado + validação no
   `hronir:doctor`, conforme o padrão de dados persistidos do `CLAUDE.md`) e
   exibir ▲/▼/— por linha comparando com o snapshot anterior.
4. **Seção de perspectivas:** grid de cards (nome, resumo de uma linha,
   líder atual) linkando para `/ranking/perspectives/<id>/` — resolve a
   descobribilidade de D2. Os chips de filtro continuam com papel separado.

**Critério de aceite:** nenhum jargão estatístico visível sem interação;
win rate legível na tabela; perspectivas alcançáveis em 1 clique da
`/ranking/`.

### Fase 4 — Dossiê por post e ligação bidirecional

1. **`/ranking/posts/<key>/`:** página por post ranqueado com posição atual
   (global e por perspectiva), histórico de duelos com links para as páginas
   de batalha, e trajetória do ordinal como sparkline SVG gerado no build
   (sem JS).
2. **Link no post:** rodapé dos posts ranqueados ganha uma linha discreta
   ("**#12** no ranking Hrönir · 7 duelos · ver dossiê") — fecha o ciclo
   leitor → post → ranking → resenhas (D5).
3. A coluna Post da tabela linka título → post e um ícone/posição → dossiê.

**Critério de aceite:** todo post com ≥1 duelo tem dossiê; post linka dossiê
e vice-versa; sparkline renderiza sem JS.

### Fase 5 — Narrativa (opcional, pode ser cortada)

1. Exibir `evaluatorMood` → `evaluatorMoodAfter` na página do duelo como
   citação curta ("estado do avaliador antes/depois") — é o material mais
   idiossincrático do sistema e hoje é invisível (D9).
2. Ordenação client-side da tabela por coluna (vitórias, duelos, Δ) como
   progressive enhancement sem dependências.

---

## 5. Análise de impacto

| Componente                                     | Impacto                                                                            |
| ---------------------------------------------- | ---------------------------------------------------------------------------------- |
| `src/hronir/perspectives.ts`                   | Fase 0 — resolução de caminho via cwd                                              |
| `src/pages/ranking/perspectives/[id].astro`    | Fase 0 — guarda contra `getStaticPaths` vazio; Fase 3 — versão PT (questão aberta) |
| `src/components/RankingView.astro`             | Fases 0–3 — emagrece: perde corpo dos duelos e `data-search`                       |
| `src/pages/ranking.astro` / `pt/ranking.astro` | Fases 1–3 — novas strings, menos dados passados                                    |
| `src/pages/ranking/battles/…` (novo)           | Fase 1 — listagem paginada + página por duelo                                      |
| `src/pages/ranking/posts/…` (novo)             | Fase 4 — dossiê por post                                                           |
| `src/lib/hronir-rank.ts`                       | Fases 1/3/4 — id estável de duelo, snapshot Δ, trajetória por post                 |
| `src/generated/ranking-snapshot.json` (novo)   | Fase 3 — schema versionado + validação no doctor                                   |
| `scripts/hronir/`                              | Sem mudança no CLI/engine                                                          |
| `.routines/hronir/rates/*`                     | Sem mudança de schema                                                              |
| Pagefind                                       | Fase 1 — páginas de duelo entram no índice existente                               |
| OG images                                      | Sem mudança                                                                        |

---

## 6. Alternativas consideradas

- **Hidratar a lista de batalhas como ilha (React/Svelte) com fetch de
  JSON.** Resolve o peso, mas adiciona framework e runtime a um site que é
  deliberadamente estático + vanilla. Rejeitado.
- **Lazy-load do corpo do duelo via `fetch` no primeiro expand** (cards
  continuam `<details>`, corpo vem de fragmento JSON/HTML). Menos navegação
  que páginas por duelo, mas não cria URLs compartilháveis nem entra no
  Pagefind, e mantém a listagem como única visão. Rejeitado em favor de
  páginas estáticas por duelo — mais barato, mais indexável, mais linkável.
- **Virtualização client-side da lista** (renderizar do JSON sob demanda).
  Mantém um JSON de 1,6 MB+ no payload e quebra sem JS. Rejeitado.
- **Truncar o arquivo (mostrar só N duelos recentes e descartar o resto da
  UI).** Perde o acervo de resenhas, que é conteúdo original do site.
  Rejeitado.
- **Δ de ranking computado por replay dos rate files** (sem snapshot):
  reprocessar o ranking em t−1 a partir dos próprios arquivos. Elegante (sem
  estado novo), mas "t−1" é ambíguo (último build? última season?) e o replay
  acopla a UI ao motor. O snapshot por build é mais simples e auditável.
  Escolhido snapshot; replay fica como fallback se o snapshot se provar
  ruidoso.

---

## 7. Questões em aberto

1. **Identificador público do duelo:** derivar do nome do rate file (estável,
   mas expõe o timestamp/convention interna) ou de um hash curto do conteúdo?
   Proposta r0: nome do arquivo sem extensão — já é estável e legível.
2. **Versão PT das páginas de perspectiva e de duelo:** o conteúdo dos duelos
   é misto (resenha na língua do post avaliado). r0 propõe páginas únicas
   (sem par PT/EN) com `lang` do chrome herdado da seção — confirmar se isso
   convive bem com o padrão hreflang do sitemap.
3. **Granularidade do snapshot de Δ:** por build pode gerar ▲▼ ruidoso quando
   várias sessões mergeiam no mesmo dia. Alternativa: snapshot por season.
   Decidir na Fase 3 com dados reais.
4. **Onde mora a CTA de "sugerir duelo"** depois da Fase 1 — na `/ranking/`,
   no arquivo de batalhas, ou em ambos.

---

## 8. Plano de execução da PR

1. **Commit 1 (este):** RFC 0007.
2. Após merge: Fase 0 em PR própria (pequena, só bugs — pode sair antes das
   demais). Fases 1–4 em PRs separadas, cada uma verde
   (`build` + `astro check` + `prettier` + `hronir:doctor`) antes da próxima.
3. Fase 5 só se as anteriores não revelarem custo inesperado.
4. Merge sempre com **merge commit**, conforme `CLAUDE.md`.

---

## Histórico de revisões

- **r0** (2026-06-10): versão inicial. Diagnóstico medido em build local
  (3,1 MB/idioma; 404 das perspectivas confirmado em produção; causa raiz
  `import.meta.url` vs cwd). Decisões: arquivo de batalhas como rotas
  estáticas paginadas + página por duelo; busca via Pagefind; jargão atrás
  de progressive disclosure; snapshot versionado para Δ.
