# RFC 0004 — Organização do repo e padronização de convenções (pré-RFC 0003)

|                 |                                                                                                                                                                                    |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**      | Draft / Proposed                                                                                                                                                                   |
| **Autor**       | Franklin Baldo (proposta assistida)                                                                                                                                                |
| **Criado em**   | 2026-06-09                                                                                                                                                                         |
| **Branch / PR** | `claude/vibrant-volta-3giul0`                                                                                                                                                      |
| **Relação**     | **Precede a aplicação** da RFC 0003 (PR #306) — numeração posterior, execução anterior. Incorpora os achados do review do PR #306.                                                 |
| **Afeta**       | raiz do repo, `scripts/**`, `scripts/lib/` (novo módulo), `.github/workflows/check.yml`, `.github/hronir-session-prompt.md`, `CLAUDE.md`, `README.md`, `docs/`, `src/lib/paths.ts` |

> Este documento é a **etapa 1** da PR: primeiro o RFC, depois a implementação
> incremental na mesma branch, fase a fase, cada fase verde (build + testes +
> `prettier --check`) antes da próxima. Mesmo padrão das RFCs 0001/0002/0003.

---

## 1. Resumo

A RFC 0003 propõe a maior mudança estrutural do repo até hoje: migrar
`src/content/blog/` de arquivos planos para **pasta por post** (`<slug>/index.md`).
O review do PR #306 revelou que essa migração tem uma superfície escondida:
**cinco scripts fora do `getCollection`** assumem o layout plano, e dois deles
falham **silenciosamente** quando o chão muda (hreflang do sitemap some, QRs
param de regenerar). Ao mesmo tempo, a higiene do repo degradou — scratch de
sessão commitado na raiz, lockfile duplo, pacote aninhado redundante — e as
convenções que governam o projeto vivem em três estados: enforçadas por CI
(seguram), escritas em prosa (derivam) ou implícitas (ninguém combina).

Esta RFC prepara o terreno em quatro entregas, **antes** de a 0003 mexer no
layout:

1. **Faxina** — remover o lixo acumulado na raiz e as duplicações de
   dependência (mecânico, zero comportamento).
2. **`check:hygiene`** — transformar a faxina em invariante de CI, no mesmo
   espírito de `doctor`/`check:links`.
3. **Ponto único de descoberta de posts** — um módulo `scripts/lib/content.mjs`
   que todos os scripts consomem; a Fase 0 da RFC 0003 passa a trocar o layout
   em **um lugar** em vez de cinco.
4. **Convenções escritas onde agente lê** — seção "Convenções" no `CLAUDE.md`,
   README verdadeiro, fonte única para instruções de sessão.

O princípio que organiza tudo: **convenção que importa vira check executável;
prosa só para o que check não alcança.**

---

## 2. Motivação — evidência concreta, não estética

### 2.1. Convenção em prosa derivou em 24 horas

O `.github/hronir-session-prompt.md` ordena: _"Only commit files under
`.routines/hronir/**` and `src/content/blog/**`"_. Em 2026-06-09, o commit
`hronir: 10 matches — jules` adicionou **12 arquivos na raiz** violando a
regra: `decide_args.json` … `decide_args10.json` (payloads de `hronir:decide`)
e `rewrite_en.mjs`/`rewrite_pt.mjs` (one-offs de um único post). Nem o
`doctor` nem o `check.yml` barraram; o merge passou. A regra existe, o check
não — e só convenção com check segura neste repo (prettier, doctor,
`check:links` e `check:translations` nunca derivaram).

Outros sintomas da mesma causa:

- **Lockfile duplo**: `bun.lock` (entrou de carona em 2026-06-07) ao lado de
  `package-lock.json`, com todo o CI rodando `npm ci`. Duas verdades de versão.
- **Pacote aninhado redundante**: `scripts/hronir/package.json` +
  `package-lock.json` declaram `gray-matter` e `openskill`, que já estão nas
  `devDependencies` da raiz — é de lá que `node scripts/hronir/index.js`
  resolve, pois `npm ci` na raiz não instala o pacote aninhado.
- **Planos na raiz**: `PLANO-MUSICAS.md`, `RANKING_UI_PLAN.md` — o lugar deles
  é `docs/` (o padrão bom já existe: `docs/rfcs/`).
- **`_review/`**: pasta criada para um único relatório de review (PR #208).

### 2.2. A superfície escondida da RFC 0003

O §5.1 da RFC 0003 afirma que, com o loader globando só `**/index.{md,mdx}`,
o site inteiro "automaticamente ignora versões". Verdadeiro para tudo que passa
pelo `getCollection` — e **falso para os scripts**, que varrem
`src/content/blog` por conta própria:

| Script                                             | Suposição de layout plano                   | Modo de falha pós-migração                                           |
| -------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `scripts/lib/blog-links.mjs` (`loadPosts`)         | `readdirSync` não-recursivo, id = basename  | `check:links` falha alto; **hreflang do sitemap some em silêncio**   |
| `scripts/generate-qrs.mjs` (`listPosts`)           | `readdirSync` não-recursivo, só `.md`       | QRs param de regenerar; fallback silencioso para QR simples          |
| `scripts/check-translations.mjs`                   | casa diff por `split("/").pop()` (basename) | tudo vira `index.md` → colisões de basename                          |
| `scripts/generate-music-posts.mjs` / `-companions` | escrevem arquivos **planos** em `musicas/`  | músicas novas não casam `**/index.*` → **despublicadas em silêncio** |
| `src/lib/paths.ts` (`READING_PATHS`)               | ids de post hardcodados                     | consumidor de id que a 0003 precisa listar                           |

E os pontos cegos **já existem hoje**, antes de qualquer migração:

- `blog-links.mjs` é não-recursivo → os **130 arquivos** de `musicas/` (todos
  com `translationKey`) são invisíveis ao `check:links`, ao
  `generate-redirects` e ao `generate-translation-pairs` — ou seja, músicas
  não têm hreflang no sitemap e links para elas não são validados.
- `src/lib/paths.ts:45` referencia o id
  `2026-05-14-pierre-menard-computational-researcher` — formato com prefixo de
  data que o repo **aboliu** (o arquivo hoje é
  `pierre-menard-computational-researcher.md`). O `.filter(Boolean)` engole o
  miss: o post **caiu da trilha de leitura "Memory and Funes" em silêncio**.

Esse segundo item é a tese da RFC em miniatura: uma convenção (slug = id)
mudou, nenhum check cobria o consumidor, e um pedaço do site quebrou sem
alarme. A migração da 0003 multiplicaria esse padrão por cinco.

### 2.3. Convenções implícitas sem dono

| Convenção                                                                                                 | Estado                                                                                        |
| --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Línguas: código/identificadores EN; RFCs/docs PT; `--after-mood` PT obrigatório                           | A língua das **reviews/clash nunca foi definida** — a sessão jules escreveu reviews em inglês |
| Default de língua **invertido por tipo**: blog → EN default; `musicas/` → PT default, EN com sufixo `-en` | Nunca escrito; armadilha para agentes                                                         |
| slug = filename = URL                                                                                     | Documentado só num comentário de `blog-links.mjs`                                             |
| Commits: conventional frouxo (`feat:`, `fix(escopo):`) + formato hronir (`hronir: N matches — agent`)     | Sem regra; agentes divergem                                                                   |
| `.ts` vs `.mjs` em `src/lib/`: `.mjs` = importável por scripts node e `astro.config`; `.ts` = só site     | Inferível, nunca dito                                                                         |
| Processo de RFC: `docs/rfcs/NNNN-kebab.md`, tabela de status, fases verdes na mesma branch, merge commit  | Vive só dentro das próprias RFCs                                                              |
| Padrão de dados: **schema versionado + script de migração + doctor** (`passion-v1`→`stars-v1`)            | O melhor padrão do repo, sem nome                                                             |

E a documentação dual diverge: o `README.md` anuncia "Svelte 5 islands
(`ThemeToggle`, `SecretNote`)" — não há Svelte nas dependências e
`ThemeToggle` é `.astro`; o "Project layout" omite `scripts/`, `docs/rfcs/`,
`.routines/` e o Hrönir inteiro. As instruções de sessão Hrönir existem em
**três cópias** (`CLAUDE.md`, `.github/hronir-session-prompt.md`,
`.canivete/routines/` — esta última ainda mandando `bun run`).

---

## 3. Objetivos e não-objetivos

### Objetivos

- Reduzir a Fase 0 da RFC 0003 a uma mudança **localizada**: loader do Astro +
  `scripts/hronir/lib/posts.js` + **um** módulo compartilhado de descoberta —
  em vez de cinco scripts com suposições próprias.
- Corrigir os pontos cegos **atuais** (musicas/ fora do check de links e do
  hreflang; id morto em `READING_PATHS`) antes que a migração mude o chão.
- Tornar a higiene da raiz um **invariante de CI**, não um mutirão periódico.
- Escrever as convenções load-bearing onde os agentes comprovadamente leem
  (`CLAUDE.md`), com fonte única por assunto.

### Não-objetivos (por ora)

- **Não** muda o layout de `src/content/blog/` nem qualquer URL — isso é a
  RFC 0003.
- **Não** mexe em ranking, rate files ou schema `stars-v1`.
- **Não** adota commitlint, ESLint ou husky — custo permanente de ferramenta
  para o que o `check.yml` já cobre melhor (repo solo com tráfego de agentes).
- **Não** move `.routines/hronir/` para um diretório visível (ex.
  `data/hronir/`) — candidato a pegar carona na Fase 0 da 0003, que já roda
  `migrate` nos rate files (§9).

---

## 4. Princípios de design

> **Convenção que importa vira check executável.** A evidência é local:
> prettier, `doctor`, `check:links` e `check:translations` nunca derivaram;
> o escopo de commit do autopilot — só prosa — foi violado em 24 horas.
> Prosa fica reservada ao que check não alcança (intenção, tom, processo).

> **Um assunto, uma fonte.** `README.md` fala com humanos (stack, comandos);
> `CLAUDE.md` é o manual de operação dos agentes; `scripts/hronir/README.md`
> é a mecânica interna do Hrönir. Todo o resto referencia, não copia.

---

## 5. Desenho

### 5.1. `check:hygiene` — higiene como invariante

Novo `scripts/check-hygiene.mjs` (~60 linhas, sem dependências), rodando no
`check.yml` ao lado dos checks existentes:

1. **Allowlist da raiz**: todo arquivo tracked na raiz precisa estar numa lista
   explícita (`README.md`, `CLAUDE.md`, `package.json`, `package-lock.json`,
   `astro.config.mjs`, `tsconfig.json`, dotfiles de config…). Arquivo novo na
   raiz = decisão consciente de editar a lista.
2. **Exatamente um lockfile**: `package-lock.json`. `bun.lock`, `yarn.lock`,
   `pnpm-lock.yaml` reprovam.
3. **Nenhum `package.json` fora da raiz.**
4. **Padrões banidos** no tree inteiro: `decide_args*`, `rewrite_*.mjs`,
   `*.tmp`, e o que mais a prática mostrar.

É o mesmo movimento que o repo já fez três vezes: regra → script → passo no
`check.yml`.

### 5.2. Ponto único de descoberta de posts

Novo `scripts/lib/content.mjs`:

```js
listPostFiles(); // varredura recursiva de src/content/blog (.md|.mdx)
postIdFromPath(p); // path relativo sem extensão — HOJE; a RFC 0003 troca AQUI
readPostMeta(p); // frontmatter via gray-matter (substitui 2 parsers artesanais)
```

Consumidores refatorados para o módulo:

- **`scripts/lib/blog-links.mjs`** (`loadPosts`) — alimenta `check:links`,
  `generate-redirects` e `generate-translation-pairs`. Vira recursivo →
  **corrige o ponto cego de `musicas/`** (hreflang e validação de links).
  De quebra aposenta o parser de frontmatter por regex.
- **`scripts/generate-qrs.mjs`** (`listPosts`) — passa a ver `.mdx` e posts
  aninhados (QRs para músicas: §9, _leaning_ incluir).
- **`scripts/check-translations.mjs`** — casa o diff por **path relativo**,
  não por basename (pré-requisito direto da 0003, onde todo basename vira
  `index.md`).
- **`scripts/generate-music-posts.mjs` / `-en-companions.mjs`** — a varredura
  de existentes passa pelo módulo; a escrita continua local (a 0003 muda o
  _destino_ da escrita na Fase 0 dela).

Fora do módulo, dois ajustes pontuais:

- **`scripts/hronir/lib/posts.js`** — **não** é refatorado para o módulo (a
  0003 vai reescrevê-lo; evitar churn duplo). Recebe só o _hardening_ do
  `keyForPath`: quando o basename for `index`, usar o nome da pasta como
  fallback de chave. Hoje é **no-op** (não existe nenhum `index.md` em
  `src/content/blog/`); elimina a armadilha apontada no review do PR #306
  (todo post sem `translationKey` colapsaria para a chave `"index"`).
- **`src/lib/paths.ts`** — corrigir o id morto
  (`2026-05-14-pierre-menard-computational-researcher` →
  `pierre-menard-computational-researcher`); o post volta à trilha. A 0003
  ganha `paths.ts` na sua tabela "Afeta" como consumidor de ids.

**Efeito líquido para a RFC 0003:** a Fase 0 dela passa a tocar o loader do
Astro (`content.config.ts`), o `posts.js` do Hrönir e **uma função**
(`postIdFromPath`) — em vez de cinco scripts com lógica própria.

### 5.3. Convenções escritas — `CLAUDE.md` ganha a seção "Convenções do repo"

~30 linhas, só o load-bearing:

- **Línguas**: identificadores e comentários de código em EN; RFCs, docs e
  prosa de processo em PT; nos rate files, `--after-mood`, `--review-*` e
  `--clash` em **PT** (fixado — hoje só o mood exige; §9).
- **Defaults de língua por tipo**: blog → EN default, PT marcado; `musicas/` →
  PT default, EN com sufixo `-en`.
- **slug = filename = URL** (e onde os redirects legados moram).
- **Commits**: conventional frouxo (`tipo(escopo): resumo`) + formato de
  sessão `hronir: N matches — <agent-id>`.
- **`.ts` vs `.mjs`**: `.mjs` para o que scripts node e `astro.config.mjs`
  importam; `.ts` para o que só o site importa.
- **Processo de RFC**: `docs/rfcs/NNNN-kebab.md`, tabela de status, fases
  verdes na mesma branch, merge commit (não squash).
- **Padrão-casa para dados**: schema versionado + script de migração +
  validação no doctor — qualquer dado novo (inclusive as versões da 0003)
  declara conformidade em vez de reinventar.

E a consolidação de fontes:

- **`README.md`** reescrito para o estado real: stack sem o Svelte fantasma,
  layout incluindo `scripts/`, `docs/rfcs/`, `.routines/`, e o Hrönir em duas
  linhas apontando para `CLAUDE.md` / `scripts/hronir/README.md`.
- **`.github/hronir-session-prompt.md`** reduzido ao **delta** de autopilot
  (escopo de commit, branch, PR) + referência ao `CLAUDE.md` — em vez de cópia
  paralela do fluxo.
- **`.canivete/routines/`**: nenhum código do repo o consome (é entrada de
  ferramenta externa do dono). Corrigir o `bun run` → `npm run` e marcar como
  espelho; aposentar ou não é decisão do dono (§9).

### 5.4. Realocações e remoções

| Hoje (raiz / espalhado)                           | Destino                                           |
| ------------------------------------------------- | ------------------------------------------------- |
| `decide_args*.json` ×10, `rewrite_{en,pt}.mjs`    | **deletar** (scratch de sessão; histórico no git) |
| `bun.lock`                                        | **deletar** (CI é `npm ci`)                       |
| `scripts/hronir/package.json` + `package-lock`    | **deletar** (deps já na raiz)                     |
| `PLANO-MUSICAS.md`, `RANKING_UI_PLAN.md`          | `docs/plans/`                                     |
| `_review/relatorio-208.md`                        | `docs/reviews/` (ou deletar — §9)                 |
| `scripts/analyze-takeout.py`, `youtube-weekly.gs` | `scripts/oneoff/` com README de 3 linhas          |

---

## 6. Plano de implementação (faseado)

### Fase 0 — Faxina mecânica (zero comportamento)

- Deletes e moves do §5.4; nada de código de build muda.
- **Critério de aceite:** `npm ci` + `npm run build` verdes; `prettier --check`
  limpo; raiz contém somente a futura allowlist.

### Fase 1 — `check:hygiene`

- `scripts/check-hygiene.mjs` + script npm + passo no `check.yml`.
- **Critério de aceite:** verde no estado pós-Fase 0; **vermelho** ao
  reintroduzir qualquer item banido (verificado localmente reintroduzindo um
  `decide_args.json` e um `bun.lock` de teste); uma linha no `CLAUDE.md`.

### Fase 2 — Ponto único de descoberta + correção dos pontos cegos

- `scripts/lib/content.mjs`; refactor dos quatro consumidores (§5.2);
  hardening do `keyForPath`; correção do id em `paths.ts`.
- **Critério de aceite:** diff das saídas geradas
  (`blog-translation-pairs.json`, `blog-redirects.json`, manifest de QR) contém
  **somente** as entradas novas de `musicas/` e nada mais (snapshot
  antes/depois anexado à PR); `check:links`, `check:translations`, `doctor`,
  `npm test` e build verdes; o post Pierre Menard reaparece na trilha
  "Memory and Funes".

### Fase 3 — Convenções e fontes únicas

- Seção "Convenções do repo" no `CLAUDE.md`; `README.md` real;
  `hronir-session-prompt.md` como delta; `.canivete` corrigido/marcado.
- **Critério de aceite:** `grep -i svelte README.md` vazio; fluxo de sessão
  descrito em **um** lugar e referenciado nos demais; `prettier --check` limpo.

---

## 7. Compatibilidade

- **URLs, ranking, rate files: intactos.** Nenhuma rota muda.
- O único delta observável é a **correção dos pontos cegos atuais**: hreflang
  do sitemap ganha os pares de `musicas/`, o `check:links` passa a validar
  links para músicas, QRs passam a cobrir `.mdx` (se §9.2 confirmar), e um
  post volta à trilha de leitura. Todos desejáveis e documentados no commit.
- **Para a RFC 0003:** após esta RFC, a tabela "Afeta" da 0003 encolhe — a
  migração estrutural troca `postIdFromPath` num lugar, e os critérios de
  aceite da Fase 0 dela (snapshot de URLs) ganham um chão já coberto por
  checks. O PR #306 rebaseia por cima do merge desta.

---

## 8. Alternativas consideradas

- **Fazer tudo dentro da própria RFC 0003.** Mistura faxina mecânica com a
  migração mais arriscada do repo numa PR só; qualquer regressão fica
  indistinguível. Rejeitado — preparação e migração têm perfis de risco
  opostos.
- **Só documentar, sem checks.** A evidência empírica local (§2.1) é que prosa
  derivou em 24 horas com agentes ativos. Rejeitado.
- **Adotar ferramental padrão** (commitlint, ESLint, husky, CONTRIBUTING.md).
  Audiência primária é agente lendo `CLAUDE.md` + CI que morde; cada
  ferramenta extra é superfície de manutenção permanente para ganho marginal.
  Rejeitado por ora — nada impede adoção futura se o time crescer.
- **npm workspaces para `scripts/hronir/`.** Formaliza o pacote aninhado em
  vez de removê-lo; as deps já vivem na raiz e o CLI roda via `node` direto.
  Complexidade sem ganho. Rejeitado.

---

## 9. Questões em aberto

1. **Língua das reviews/clash** nos rate files: fixar PT (coerente com mood e
   com o corpus majoritário) ou aceitar EN? _Leaning:_ fixar PT.
2. **QRs para `musicas/`**: gerar (são posts publicados) ou filtrar
   `postType: music`? _Leaning:_ gerar.
3. **`.canivete/`**: a ferramenta externa ainda roda contra este repo? Manter
   como espelho corrigido ou aposentar?
4. **`_review/relatorio-208.md`**: mover para `docs/reviews/` ou deletar (o
   conteúdo vive no PR #208)? _Leaning:_ mover.
5. **Journals de sessão `.routines/*.md`**: formalizar (um formato de nome, um
   schema mínimo) ou parar de escrever? Hoje há dois formatos de timestamp.
6. **`.routines/hronir/` → `data/hronir/`**: pegar carona na Fase 0 da 0003
   (que já migra rate files) ou ficar onde está? _Leaning:_ carona na 0003.

---

## 10. Plano de execução da PR

1. **Commit 1 (este):** RFC `0004`.
2. Após revisão: **Fase 0** (faxina) → **Fase 1** (`check:hygiene`) →
   **Fase 2** (módulo único + pontos cegos) → **Fase 3** (convenções), cada
   fase em commit próprio, build/testes/`prettier --check` verdes.
3. Merge com **merge commit** (não squash), conforme `CLAUDE.md`.
4. Em seguida, o PR #306 (RFC 0003) rebaseia e inicia a Fase 0 dele sobre o
   terreno preparado.

---

## Histórico de revisões

- **r0** (2026-06-09): versão inicial. Decisões do dono: aplicar **antes** da
  RFC 0003; abordagem convenção-como-check (sem commitlint/ESLint); incorporar
  os achados do review do PR #306 como motivação.
