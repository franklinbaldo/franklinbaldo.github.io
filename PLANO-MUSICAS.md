# Plano: Posts de Músicas + Player Global Persistente

## Por que isso melhora o blog

O blog hoje trata as músicas como um catálogo externo — um espelho do Suno, sem voz, sem contexto, sem memória. Cada música é só um card com título, capa e player. O leitor não sabe **por que** aquela música existe, o que você estava sentindo, qual era a ideia, de onde vieram as letras.

Transformar cada música em um post muda completamente a natureza do blog:

- **Narrativa autoral**: você conta a história por trás da criação, como escreve nos posts de texto.
- **SEO real**: letras completas + texto reflexivo criam conteúdo indexável e único; hoje o Google não tem nada para indexar nas suas músicas.
- **Continuidade de leitura**: um player persistente significa que o visitante pode tocar uma música e continuar navegando — como num Spotify embutido no blog, sem ser jogado para fora da experiência.
- **Coerência de identidade**: suas ideias, livros, textos e músicas ficam integrados sob uma mesma voz, não espalhados em plataformas separadas.
- **Arquivo pessoal vivo**: cada post com data de publicação cria uma linha do tempo da sua produção musical, como um diário.

---

## Visão Geral da Arquitetura

```
Hoje:
  /music/ → grid de cards puxados da API do Suno (build-time)
  Sem player persistente. Clicar num link Suno mostra um mini-bar.

Depois:
  /music/           → índice (existente, melhorado)
  /music/[slug]/    → post completo da música (novo)
  /pt/musicas/[slug]/ → versão em PT (novo)
  Player global     → barra inferior fixa, persiste entre páginas (upgrade)
  Coleção `music`   → src/content/music/*.mdx (nova coleção)
```

---

## Fase 1 — Nova Coleção de Conteúdo `music`

### 1.1 Schema (`src/content.config.ts`)

Adicionar ao lado da coleção `blog`:

```ts
const music = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/music" }),
  schema: ({ image }) =>
    z.object({
      title:        z.string(),
      description:  z.string(),
      date:         z.coerce.date(),          // data de publicação do post
      sunoId:       z.string(),               // UUID do Suno (ex: "abc-123-...")
      sunoUrl:      z.string().url().optional(), // link canônico no Suno
      coverImage:   image().optional(),       // capa local (override do Suno)
      genre:        z.array(z.string()).optional(),
      mood:         z.array(z.string()).optional(),
      duration:     z.number().optional(),    // segundos
      lyrics:       z.string().optional(),    // letra completa em frontmatter OU no corpo
      lang:         z.enum(["en", "pt"]).optional().default("pt"),
      translationKey: z.string().optional(),
      draft:        z.boolean().optional(),
      tags:         z.array(z.string()).optional(),
      featured:     z.boolean().optional(),
    }),
});

export const collections = { blog, music };
```

### 1.2 Estrutura de um arquivo de música

`src/content/music/nome-da-musica.mdx`:

```mdx
---
title: "Nome da Música"
description: "Uma frase sobre o que é essa música"
date: 2024-03-15
sunoId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
genre: ["MPB", "bossa nova"]
mood: ["melancólico", "contemplativo"]
duration: 187
tags: ["saudade", "memória"]
lang: pt
---

import SunoPlayer from '../../components/SunoPlayer.astro';

<SunoPlayer id={frontmatter.sunoId} title={frontmatter.title} />

## Letra

```

[Verso 1]
Primeira estrofe aqui
Segunda linha

[Refrão]
O refrão
que se repete

```

## Notas do compositor

Escreva aqui à vontade sobre a música. O que motivou? Qual era a ideia?
Como foi o processo no Suno? O que você mudaria? Qual sensação você
queria transmitir?

Esse espaço é completamente seu — pode ser um parágrafo ou dez.
```

### 1.3 Por que MDX e não frontmatter puro?

- A letra pode ter formatação (estrofes, seções `[Verso]`, etc.)
- O bloco "Notas do compositor" pode ter links, citações, imagens
- Permite embutir o `<SunoPlayer>` inline no texto
- Mesma ergonomia dos posts do blog — zero curva de aprendizado

---

## Fase 2 — Rota de Post Individual de Música

### 2.1 Arquivos novos

| Arquivo                                | Descrição                                    |
| -------------------------------------- | -------------------------------------------- |
| `src/pages/music/[...slug].astro`      | Rota EN para post de música                  |
| `src/pages/pt/musicas/[...slug].astro` | Rota PT para post de música                  |
| `src/layouts/MusicPostLayout.astro`    | Layout específico para posts de música       |
| `src/components/SunoPlayer.astro`      | Player embutido no post (substitui o inline) |

### 2.2 Layout do post de música (`MusicPostLayout.astro`)

O layout herda de `PageLayout.astro` e adiciona:

```
┌──────────────────────────────────┐
│  Capa da música (quadrada, 400px)│
│  Título                          │
│  Data · Duração · Gênero         │
│  [Player embutido]               │
├──────────────────────────────────┤
│  Letra (section colapsável)      │
├──────────────────────────────────┤
│  Notas do compositor (MDX body)  │
├──────────────────────────────────┤
│  Tags | ← Post anterior | Próximo→│
└──────────────────────────────────┘
```

### 2.3 Índice melhorado (`/music/`)

A página existente vira um híbrido:

- Cards das músicas que têm post linkam para `/music/[slug]/`
- Músicas sem post ainda abrem no Suno
- Badge visual diferencia "com post" de "só no Suno"

---

## Fase 3 — Player Global Persistente

### 3.1 O problema atual

O `SunoInlinePlayer.astro` já existe mas é reativo: aparece só quando o
usuário clica num link Suno. Não tem lista de músicas, não tem prev/next,
e não sobrevive a navegações via View Transitions (reaparece do zero).

### 3.2 Solução: `GlobalMusicPlayer.astro` com `transition:persist`

O Astro tem a diretiva `transition:persist` que mantém um elemento DOM
**exatamente como está** entre navegações de página — sem re-render,
sem perder estado de áudio. É a solução nativa e zero-overhead para esse problema.

**Implementação:**

```astro
<!-- src/components/GlobalMusicPlayer.astro -->
<div id="global-player" transition:persist>
  <!-- Este componente é renderizado UMA vez e nunca desmontado -->
  <audio id="gp-audio" preload="none"></audio>
  <!-- controles, capa, título, progresso, prev/next -->
</div>
```

Inserido em `PageLayout.astro` (que envolve TODAS as páginas):

```astro
<!-- src/layouts/PageLayout.astro (trecho) -->
<body>
  <Header />
  <main>
    <slot />
  </main>
  <Footer />
  <GlobalMusicPlayer />  <!-- ← aqui, depois do footer -->
</body>
```

### 3.3 Design do player

```
┌─────────────────────────────────────────────────────────┐
│ [Capa 48px] Título da música        ◀  ▶▐▐  ▶▶  🔀  🔉 │
│             Gênero · 2:47 / 3:07   ════════════════     │
└─────────────────────────────────────────────────────────┘
```

- **Fixo na parte inferior** da viewport (como Spotify Web)
- **Largura total** em mobile, com padding
- **Barra de progresso** clicável
- **Botões**: anterior · play/pause · próximo · shuffle · volume
- **Toca qualquer música** do blog: posts de música, links Suno inline,
  ou botão "tocar todos" na página `/music/`

### 3.4 Fila de reprodução (queue)

O player recebe a lista completa de músicas via atributo `data-*` no build:

```astro
const allSongs = await getCollection('music');
const audioMap = await fetchAudioMap(); // IDs → URLs de áudio CDN
```

```html
<div id="global-player"
     transition:persist
     data-songs={JSON.stringify(songList)}
     data-audio-map={JSON.stringify(audioMap)}>
```

O JS do player gerencia:

- `currentIndex` — posição na fila
- `queue` — lista de IDs na ordem atual (embaralhável)
- `localStorage['gp-state']` — persiste a música atual e posição entre sessões

### 3.5 Integração com posts

Qualquer página pode controlar o player via eventos customizados:

```js
// Em qualquer post ou componente:
document.dispatchEvent(new CustomEvent('gp:play', {
  detail: { sunoId: 'abc-123', title: 'Minha Música' }
}));

document.dispatchEvent(new CustomEvent('gp:queue', {
  detail: { sunoIds: ['abc', 'def', 'ghi'] }
}));
```

O botão de play num post de música dispara `gp:play`. A página `/music/`
tem um botão "Tocar tudo" que dispara `gp:queue` com todas as músicas.

### 3.6 Substituição do player antigo

- `SunoInlinePlayer.astro` é aposentado
- Links `suno.com/song/` agora disparam `gp:play` em vez de mostrar a mini-barra
- A lógica de interceptação de links migra para `GlobalMusicPlayer.astro`

---

## Fase 4 — Seção "Escrever sobre música"

### 4.1 Posts do blog com tag `musica`

Posts reflexivos sobre música em geral (não sobre uma música específica)
ficam no blog normal com tag `musica`. Exemplos de tópicos:

- "O que aprendi fazendo X músicas no Suno"
- "Por que comecei a compor"
- Resenhas de álbuns
- Reflexões sobre processo criativo

### 4.2 Página de índice de música expandida

A página `/music/` vira uma hub com três seções:

```
/music/
├── [Hero com player "tocar tudo"]
├── Posts de músicas (coleção music) — grid de cards
├── Escritos sobre música (blog tag:musica) — lista
└── Playlists do Suno
```

---

## Ordem de Implementação Recomendada

```
Sprint 1 — Fundação (1-2h)
  ✓ Criar coleção `music` no content.config.ts
  ✓ Criar 1-2 arquivos MDX de exemplo em src/content/music/
  ✓ Criar rota src/pages/music/[...slug].astro
  ✓ Criar MusicPostLayout.astro (básico)

Sprint 2 — Player Global (2-3h)
  ✓ Criar GlobalMusicPlayer.astro com transition:persist
  ✓ Inserir no PageLayout.astro
  ✓ Implementar fila, prev/next, barra de progresso
  ✓ Aposentar SunoInlinePlayer.astro

Sprint 3 — Integração (1h)
  ✓ Botão "play" nos posts de música dispara gp:play
  ✓ Botão "Tocar tudo" em /music/ dispara gp:queue
  ✓ Links Suno inline disparam gp:play
  ✓ Badge "com post" no índice /music/

Sprint 4 — Conteúdo (contínuo)
  ✓ Escrever posts MDX para cada música existente
  ✓ Adicionar posts de reflexão sobre música no blog
  ✓ Versões PT das rotas
```

---

## Arquivos a Criar / Modificar

### Novos

```
src/content/music/                        ← nova pasta
src/content/music/exemplo.mdx             ← primeiro post
src/pages/music/[...slug].astro           ← rota individual EN
src/pages/pt/musicas/[...slug].astro      ← rota individual PT
src/layouts/MusicPostLayout.astro         ← layout do post
src/components/GlobalMusicPlayer.astro    ← player persistente
src/components/SunoPlayer.astro           ← player embutido no post
```

### Modificados

```
src/content.config.ts          ← adicionar coleção `music`
src/layouts/PageLayout.astro   ← incluir GlobalMusicPlayer
src/pages/music.astro          ← índice híbrido (posts + Suno)
src/pages/pt/musicas.astro     ← idem PT
astro.config.mjs               ← adicionar /music/* ao sitemap
```

### Aposentados

```
src/components/SunoInlinePlayer.astro  ← substituído pelo GlobalMusicPlayer
```

---

## Notas Técnicas

### `transition:persist` — Como funciona

O Astro View Transitions (já ativo no blog via `prefetch: "viewport"`)
detecta elementos com `transition:persist` e, ao navegar, **re-usa o DOM
node existente** em vez de desmontar e remontar. O `<audio>` interno
continua tocando sem interrução. Zero JavaScript adicional necessário
para a persistência — é garantia do framework.

### Build-time vs. Runtime

A lista de músicas é injetada no player **no build** (como o Suno API já faz).
Não há chamada de API no cliente. Se uma música nova for adicionada no Suno,
basta fazer um novo build (o GitHub Actions já faz isso automaticamente).

### Músicas sem arquivo MDX

O índice `/music/` continua mostrando TODAS as músicas do Suno (como hoje).
A diferença é que as que têm um arquivo MDX ganham um link para o post.
Não é obrigatório ter um post para cada música — você escreve quando quiser.

### SEO dos posts de música

Cada post de música terá:

- `<title>` e `<meta description>` específicos
- JSON-LD `MusicRecording` (estruturado para Google)
- URL canônica `/music/nome-da-musica/`
- Hreflang EN ↔ PT
- OG image gerada automaticamente (como os posts do blog)
- A letra indexável pelo Google — isso é ouro para busca de letras

### Compatibilidade mobile

O player global usa `position: fixed; bottom: 0` com altura de ~72px.
O body já vai precisar de `padding-bottom: 72px` quando o player estiver
ativo para não sobrepor o conteúdo. Isso é gerenciado via classe CSS no
`<body>` controlada pelo JS do player.
