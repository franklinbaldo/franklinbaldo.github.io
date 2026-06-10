# RFC 0008 — Music Player: UX e novas funcionalidades

|                 |                                                                                                                                                                                           |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**      | Proposta (r0)                                                                                                                                                                             |
| **Autor**       | Franklin Baldo (proposta assistida)                                                                                                                                                       |
| **Criado em**   | 2026-06-10                                                                                                                                                                                |
| **Branch / PR** | —                                                                                                                                                                                         |
| **Depende de**  | RFC 0006 (flatten musicas — implementado)                                                                                                                                                 |
| **Afeta**       | `src/components/GlobalMusicPlayer.astro`, `src/pages/music.astro`, `src/pages/pt/musicas.astro`, `src/pages/blog/[...slug].astro`, `src/pages/pt/blog/[...slug].astro`, `src/lib/suno.ts` |

> **Etapa 1 — só o RFC.** Implementação faseada após merge, cada fase verde
> antes da próxima, conforme o padrão das RFCs anteriores.

---

## 1. Resumo

O player global (`GlobalMusicPlayer.astro`) e as páginas de música
(`/music/`, `/pt/musicas/`) funcionam como infraestrutura de reprodução, mas
ficam aquém como experiência de descoberta e leitura. Dois problemas
centrais:

1. **O player é uma caixa preta**: mostra título e controles, mas não
   conecta a música ao contexto do blog. Não há link para a página do post,
   nem modo de ver fila, nem controles básicos (volume, shuffle, repeat).
2. **A galeria é passiva**: exibe uma grade de cards sem ações em massa
   ("tocar tudo", "embaralhar"), sem filtros por gênero, sem indicação do que
   está tocando agora e sem navegação entre músicas.

Esta RFC documenta o diagnóstico e propõe melhorias em quatro fases:
link ao post (Fase 0), controles e galeria ativa (Fase 1), descoberta e
navegação (Fase 2), estado persistido e histórico (Fase 3).

---

## 2. Diagnóstico — estado atual

### D1. Nenhum link do player para o post

O `GlobalMusicPlayer` exibe o título da música mas ele não é clicável.
O campo `slug` do post (derivável do `sunoId` pelo mapa construído em
`src/lib/hronir-rank.ts`) não é passado para o player. O ouvinte não tem
como ir da barra de reprodução para a letra, história ou contexto da música.

```html
<!-- estado atual: título estático, sem link -->
<span id="gmp-title" class="gmp-title">…</span>
```

### D2. Sem controles básicos de reprodução

A barra tem play/pause, prev, next e fechar — e só. Faltam:

- **Volume**: não há slider de volume. O único controle de volume é o
  sistema operacional.
- **Shuffle**: a fila sempre segue a ordem do ranking. Não há embaralhamento.
- **Repeat**: ao terminar a fila, reinicia silenciosamente do início sem
  indicação visual de modo.

### D3. Galeria sem ações em massa

As páginas `/music/` e `/pt/musicas/` listam cards individuais, cada um
com `<audio controls>` nativo. Não há:

- Botão "tocar tudo" ou "embaralhar tudo" que alimente o player global.
- Filtro por gênero (os tags estão no card, mas não são interativos).
- Destaque visual do card que está tocando agora.
- Sort alternativo (por data, por rating, por duração).

### D4. Sem navegação entre posts de música

Nos posts de blog comuns há padrão de "post anterior / próximo". Nos posts
de música (`postType: music`) não existe navegação equivalente. O ouvinte
que termina de ler a letra não tem caminho óbvio para a próxima música.

### D5. Sem link de volta do post para a galeria

A página do post de música mostra botão "▶ Tocar" e link "Ouvir no Suno",
mas não linka para `/music/` ou `/pt/musicas/`. A galeria e os posts são
ilhas sem ponte de volta.

---

## 3. Objetivos e não-objetivos

### Objetivos

- Player linka para a página do post da música em reprodução.
- Controles mínimos: volume, shuffle, repeat.
- Galeria com "tocar tudo" / "embaralhar tudo" e filtro por gênero.
- Card ativo destacado na galeria durante reprodução.
- Navegação prev/next entre posts de música.
- Link de volta da página do post para a galeria.

### Não-objetivos

- Não construir sistema de playlists editáveis pelo usuário (pode vir
  depois, fora desta RFC).
- Não implementar karaokê sincronizado (exige timing data que o Suno
  não exporta).
- Não redesenhar identidade visual — Pico CSS e tema atual permanecem.
- Não introduzir framework de UI além do vanilla JS existente.
- Não mudar o motor de ranking (OpenSkill) nem os rate files.

---

## 4. Proposta por fases

### Fase 0 — Link player → post (uma linha de impacto)

**Problema**: D1.

O array `songs` já passado via `data-songs` no `GlobalMusicPlayer` inclui
`id` (sunoId). O que falta é o `slug` do post correspondente.

**Proposta:**

1. Em `src/lib/hronir-rank.ts`, a função `getRankedMusicSongs()` (ou
   equivalente que alimenta o player) passa a incluir o campo `slug` em cada
   item — derivado do mapa `sunoId → slug` que já existe para os posts de
   música.
2. No `GlobalMusicPlayer.astro`, o elemento `#gmp-title` vira um `<a>`
   cujo `href` é atualizado via JS para `/blog/{slug}/` (EN) ou
   `/pt/blog/{slug}/` (PT) a cada troca de música. Fallback: se o slug for
   vazio (música sem post), permanece `<span>`.
3. A imagem de capa (`#gmp-cover`) recebe o mesmo link — clicar na capa
   também navega para o post.

**Critério de aceite:** título e capa no player são links clicáveis que
navegam para o post correto; música sem post associado mantém comportamento
atual sem errar; `astro check` + `prettier` verdes.

---

### Fase 1 — Controles do player e galeria ativa

**Problemas:** D2, D3.

#### 1.1 Volume

- Adicionar `<input type="range" id="gmp-volume" min="0" max="1" step="0.01"
value="1">` à barra do player.
- Conectar ao `audioEl.volume` via `input` event.
- Persistir em `localStorage` chave `gmp-volume` (restaurar na montagem).
- Mobile (< 480 px): ocultar o slider de volume (o SO controla o volume por
  hardware); o elemento fica no DOM mas com `display: none` no breakpoint.

#### 1.2 Shuffle

- Botão ícone shuffle (`⇌`) com estado ativo/inativo (`aria-pressed`).
- Quando ativo, a fila é permutada (Fisher-Yates) na montagem e a cada
  "próxima música". A fila embaralhada é armazenada em memória (não em
  localStorage) — reload reinicia.
- Ícone recebe classe `.active` + cor primária quando ativo.

#### 1.3 Repeat

- Botão ícone repeat com três estados: off → repeat-all → repeat-one → off.
- `repeat-one`: ao terminar, `audioEl.currentTime = 0; audioEl.play()`.
- `repeat-all` (padrão atual, sem indicação): ao terminar a fila, volta
  ao índice 0.
- `aria-label` atualizado conforme estado: "Sem repetição", "Repetir tudo",
  "Repetir esta música".
- Estado persistido em `localStorage` chave `gmp-repeat`.

#### 1.4 "Tocar tudo" e "Embaralhar tudo" na galeria

- Dois botões no topo da seção "Todas as músicas" em `/music/` e
  `/pt/musicas/`: **▶ Tocar tudo** e **⇌ Embaralhar**.
- "Tocar tudo" dispara `gp:queue` com todos os IDs na ordem de exibição
  atual (depois dos filtros, se ativos — ver Fase 2).
- "Embaralhar" dispara `gp:queue` com os IDs em ordem aleatória gerada
  client-side antes do dispatch.
- Botões também aparecem no cabeçalho de cada playlist.

#### 1.5 Destaque do card ativo

- O `GlobalMusicPlayer` expõe o `sunoId` atual via atributo
  `data-playing-id` no elemento `#gmp` (atualizado a cada troca de música).
- Na galeria, um pequeno script de hidratação leve aplica classe `.is-playing`
  ao card correspondente via `MutationObserver` no `#gmp[data-playing-id]`.
- Estilo: borda `2px solid var(--pico-primary)` + ícone de onda animado
  (CSS-only, sem canvas) sobreposto à capa.

**Critério de aceite:** slider de volume funciona e persiste; botões
shuffle/repeat atualizam estado visual com `aria-pressed`/`aria-label`;
"Tocar tudo" carrega fila e começa reprodução; card ativo tem borda
destacada e ícone de onda.

---

### Fase 2 — Descoberta: filtros, sort e navegação entre posts

**Problemas:** D3 (filtros), D4 (navegação entre posts).

#### 2.1 Filtros por gênero na galeria

- Extrair todos os gêneros únicos dos clips durante o build e renderizá-los
  como chips filtráveis acima da grade.
- Click num chip: filtra a grade client-side (toggle `hidden` nos cards) e
  atualiza query param `?genre=cosmic` via `history.replaceState`.
- Múltipla seleção: chips acumulam filtros (OR dentro do gênero, AND entre
  chips de categorias distintas — definição a confirmar com Franklin antes
  de implementar).
- "Tocar tudo" após filtro usa apenas os cards visíveis (não todos).
- Chip "Todos" reseta o filtro e o query param.

#### 2.2 Sort alternativo

- Selector `<select>` discreto ("Ordenar por: Mais recentes · Melhor
  avaliadas · Mais longas · Mais curtas") acima da grade.
- Sort é client-side: reordena os cards via `Element.insertBefore` sem
  rebuild.
- Estado refletido em `?sort=rating`.

#### 2.3 Navegação prev/next entre posts de música

- Em `src/pages/blog/[...slug].astro` e `src/pages/pt/blog/[...slug].astro`,
  quando `postType === 'music'`, gerar listas `prevMusic` e `nextMusic` no
  `getStaticPaths` — posts de música adjacentes na ordem cronológica.
- Renderizar links de navegação abaixo do conteúdo, estilizados de forma
  consistente com a `music-header`:

```html
<nav class="music-post-nav" aria-label="Navegação entre músicas">
  <a href="/blog/{prevSlug}/" rel="prev">← {prevTitle}</a>
  <a href="/blog/{nextSlug}/" rel="next">{nextTitle} →</a>
</nav>
```

- Link "← Todas as músicas" (`/music/` ou `/pt/musicas/` conforme `lang`)
  no mesmo bloco de navegação — resolve D5.

**Critério de aceite:** chips de gênero filtram e acumulam com query param
preservado; sort funciona client-side; posts de música têm prev/next e
link para galeria; `?genre=` + `?sort=` reproduzem a visão ao colar URL.

---

### Fase 3 — Estado persistido e histórico de reprodução

Esta fase é a de maior impacto qualitativo para o ouvinte frequente e a
de maior complexidade de estado. Implementar somente após Fases 0–2 estarem
em produção e o comportamento de base estar estável.

#### 3.1 Favoritos

- Botão ♡ no card da galeria e na `music-header` do post.
- Toggle de favorito persiste em `localStorage` chave `gmp-favorites`
  (array de sunoIds).
- Seção "Favoritas" no topo da galeria (colapsável, visível só se houver
  ao menos um favorito).
- Ícone ♥ no player quando a música atual é favorita; click no ícone
  adiciona/remove.

#### 3.2 Histórico de reprodução

- `localStorage` chave `gmp-history`: array circular de até 50 sunoIds
  (FIFO), atualizado a cada troca de música.
- Seção "Ouvidas recentemente" na galeria: os últimos 5 IDs do histórico
  renderizados como rail horizontal acima da grade principal.
- "Continuar ouvindo": se `gmp-suno-id` estiver em localStorage ao carregar
  a galeria, o card correspondente recebe badge "Continue ouvindo ▶" com
  o tempo salvo (`gmp-time`).

#### 3.3 Queue drawer (fila expandida)

- Botão "↑ fila" na barra do player (ícone de lista) exibe painel slide-up
  com as músicas na fila atual.
- Item ativo destacado; clique em outro item da fila navega para ele.
- Painel fecha ao clicar fora ou no botão ✕.
- A fila é somente-leitura nesta fase (reordenação drag-and-drop é
  não-objetivo desta RFC).

**Critério de aceite:** favoritos persistem entre reloads e aparecem na
seção dedicada; histórico aparece na galeria; "continuar ouvindo" funciona
com o tempo correto; queue drawer abre/fecha e navega entre músicas.

---

## 5. Análise de impacto

| Componente                                   | Fases afetadas                                                                        |
| -------------------------------------------- | ------------------------------------------------------------------------------------- |
| `src/components/GlobalMusicPlayer.astro`     | 0 (link), 1 (volume/shuffle/repeat/data-playing-id), 3 (queue drawer, favorito ativo) |
| `src/pages/music.astro`                      | 1 (tocar tudo, destaque), 2 (filtros, sort, link nav), 3 (favoritos, histórico)       |
| `src/pages/pt/musicas.astro`                 | Idem (versão PT)                                                                      |
| `src/pages/blog/[...slug].astro`             | 2 (prev/next música, link para galeria)                                               |
| `src/pages/pt/blog/[...slug].astro`          | Idem (versão PT)                                                                      |
| `src/lib/hronir-rank.ts` / `src/lib/suno.ts` | 0 (incluir `slug` no array de songs)                                                  |
| `localStorage` (chaves novas)                | 1 (`gmp-volume`, `gmp-repeat`), 3 (`gmp-favorites`, `gmp-history`)                    |
| Build (getStaticPaths)                       | 2 (prev/next calculado no build)                                                      |
| Scripts de geração / CLI Hrönir              | Sem mudança                                                                           |
| Schema de rate files / `.routines/hronir/`   | Sem mudança                                                                           |

---

## 6. Alternativas consideradas

- **Usar `<audio controls>` nativo nos cards da galeria como player
  principal.** O site já faz isso hoje. Problema: cada card tem player
  separado, nenhum estado persiste entre páginas, e a reprodução para ao
  navegar. O `GlobalMusicPlayer` resolve isso — esta RFC o aprimora em vez
  de substituí-lo.
- **Framework de UI (React/Svelte) para a galeria.** Resolveria o problema
  de estado com menos JS manual, mas adiciona runtime a um site
  deliberadamente estático + vanilla. Rejeitado.
- **Playlist editável com drag-and-drop na Fase 1.** Seria um ganho real
  mas sobe a complexidade e o escopo de uma vez. Fase 3 entrega a fila
  somente-leitura como base; reordenação pode ser adicionada depois.
- **Karaokê sincronizado (highlight de linha de letra).** O Suno não
  exporta timestamps de sílaba. Fora de escopo até a API suportar.
- **Persistir a fila embaralhada em localStorage.** Shuffle por sessão é
  comportamento esperado em players nativos; reload reiniciando não
  surpreende o usuário e simplifica a lógica de sincronização.
- **Filtros multi-select com AND semântico (gênero A E gênero B).** Pode
  produzir grades vazias frequentemente dado que os tags de gênero do Suno
  são strings livres e raramente se acumulam. Decidir OR vs AND com dados
  reais na Fase 2 antes de implementar.

---

## 7. Questões em aberto

1. **Slug no array `songs`:** confirmar que todos os posts de música têm
   `sunoId` único e mapeável — verificar se há músicas no Suno sem post
   correspondente (músicas sem post não terão link, comportamento esperado).
2. **Idioma do link "← Todas as músicas":** post EN → `/music/`; post PT
   → `/pt/musicas/`. Confirmar se `lang` do frontmatter é a fonte correta
   ou se é melhor derivar da URL atual.
3. **Comportamento do "Tocar tudo" na página de playlist individual:** tocar
   só as músicas daquela playlist ou adicionar à fila global? Proposta
   atual: substituir fila (como `gp:queue` já faz).
4. **Filtros de gênero — granularidade dos tags:** os `metadata.tags` do
   Suno são strings livres (ex. `"Genre: Atmospheric Indie Folk/Electronic.
Tempo: 72 BPM. Mood: Introspective"`). A Fase 2 vai requerer uma camada
   de normalização (split, trim, deduplicate) para chips úteis. Definir
   esse pipeline de limpeza antes de implementar.
5. **Volume no iOS Safari:** `audioEl.volume` é somente-leitura no iOS
   (sistema ignora e usa hardware). O slider deve ser ocultado também em
   iOS (detecção via `navigator.platform` ou feature flag) para evitar
   confusão.

---

## 8. Plano de execução da PR

1. **Commit 1 (RFC r0):** este arquivo.
2. Após merge: cada fase em PR própria.
   - **Fase 0** — pequena, deve sair primeiro (1–2 arquivos, sem risco).
   - **Fase 1** — player + galeria ativa; requer testes manuais de
     reprodução no mobile antes de merge.
   - **Fase 2** — filtros e navigação; confirmar Q3 e Q4 antes de
     implementar filtros.
   - **Fase 3** — somente após Fases 0–2 em produção sem regressões.
3. Merge sempre com **merge commit** (`gh pr merge --merge`), nunca squash.

---

## Histórico de revisões

- **r0** (2026-06-10): versão inicial. Diagnóstico baseado no código atual
  de `GlobalMusicPlayer.astro`, `music.astro` e `[...slug].astro`.
  Quatro fases propostas: link ao post (0), controles + galeria ativa (1),
  filtros + navegação (2), persistência + histórico (3).
