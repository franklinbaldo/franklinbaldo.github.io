# RFC 0015 — Versionamento single-file com histórico via git (avaliação)

|                 |                                                                                                                                                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Status**      | Avaliação — parecer técnico contrário registrado em §1; documento mantido como desenho de referência a pedido do dono. **Não implementado.**                                                                                                     |
| **Autor**       | Franklin Baldo (proposta assistida)                                                                                                                                                                                                              |
| **Criado em**   | 2026-07-08                                                                                                                                                                                                                                       |
| **Branch / PR** | `claude/blog-versioning-strategy-n1aw5d`                                                                                                                                                                                                         |
| **Depende de**  | RFC 0003 (introduziu versões-pares) e RFC 0010 (Implemented, Fases 0–4 — modelo atual). Esta RFC avalia **substituir** o modelo de versões-pares da 0010 por arquivo único + histórico via git; §7 lista o que seria revertido.                  |
| **Afeta**       | `src/content/blog/**` (achataria `<slug>/v-*.*` → `<slug>.*`), `src/hronir/{posts,selection,commands,matches}.ts`, `src/content.config.ts`, `src/pages/blog/[slug]/v/[uuid].astro` (+ `pt/`), `.github/workflows/*` (fetch-depth), CLI do Hrönir |

---

## 1. Contexto e parecer técnico

O dono observou que `src/content/blog/` está disperso — uma pasta por post, várias
versões `v-*.mdx` convivendo dentro dela — e propôs manter só a versão mais
recente por post, usando o histórico do git como registro das anteriores.

Antes de responder, este documento foi precedido de uma investigação dos dados
ao vivo e do histórico de decisão do próprio repo:

- **209** pastas de post, **504** arquivos `v-*` hoje.
- **145** pastas (69%) têm **2 ou mais** versões concorrentes ao mesmo tempo —
  20 com 4, 8 com 5, 6 com 6 (ex.: `f85fb538-6f59-4751-8629-da76665fc91e/`).
- `npm run hronir:prune -- --dry-run` nesta data: **zero** versões elegíveis
  para poda. A dispersão observada não é lixo acumulado por falta de limpeza —
  é competição em aberto, ainda não decidida.
- A pergunta "por que não só a versão atual + git" **já foi feita e respondida
  duas vezes** neste repo: a RFC 0003 nasceu justamente abandonando o modelo
  "edita no lugar, linhagem só no git" (era a arquitetura _anterior_), e a RFC
  0010 revisou o resultado da 0003 e dobrou a aposta em "toda versão é um
  arquivo par, sem canônica privilegiada". Isso não torna a pergunta inválida,
  mas significa que qualquer novo desenho precisa endereçar explicitamente os
  três motivos mecânicos que motivaram as duas rodadas anteriores (§3).

**Parecer:** não recomendo a substituição integral pelos motivos do §3. Só que
o dono pediu o desenho mesmo assim — o resto deste documento é esse desenho,
incluindo os pontos que ele quebra e como cada um teria que ser compensado.
O §6 registra uma causa-raiz precisa para o incômodo original (dispersão de
arquivos) e uma correção que resolve o mesmo problema por uma fração do custo,
achada durante este desenho.

---

## 2. O que a proposta muda

**Hoje** (RFC 0010): cada post é uma pasta `<slug>/` contendo N arquivos
`v-<timestamp>.mdx` pares entre si; qual deles o site publica é decidido por
`hronir:select`, que recomputa `src/generated/versions-selected.json`
(gitignorado, função pura de rate files + arquivos de versão, sem memória
entre execuções) a cada build.

**Proposto:** um arquivo por slug, sempre — `src/content/blog/<slug>.mdx`, sem
subpasta. Toda edição é um commit normal nesse arquivo; a linhagem é `git log`.
O endereçamento de versão passa de `slug@uuid` (resolvido varrendo os arquivos
irmãos do diretório, RFC 0010 §4.3) para `slug@<sha>` ou `slug@uuid` resolvido
via um índice uuid→commit (§3.4).

Isso **eliminaria de fato** `versions-selected.json`, a lógica de seleção sem
histerese do `hronir:select` (RFC 0010 §4.2, amendment 2026-07-01),
`versions-pruned.json` e os limiares de `prune` — "publicada" volta a ser
"o que está no HEAD", sem artefato gerado no meio. Esse é o ganho real da
proposta, e é justo reconhecê-lo antes de listar o que ela quebra.

> Nota sobre a pasta-por-post: com um único arquivo, a pasta `<slug>/` deixa de
> carregar função (o próprio critério da RFC 0006 que já achatou `musicas/`:
> "pasta tem que carregar função"). Migração completa flertaria com voltar a
> `<slug>.mdx` na raiz da collection, não `<slug>/post.mdx`.

---

## 3. Pontos de fricção e como cada um teria que ser compensado

### 3.1. Duelos de versão precisam ler os dois lados ao mesmo tempo

O núcleo do Hrönir é comparar duas versões lado a lado. Hoje
`computeVersionRatings`/`pickVersionDuel` leem dois arquivos irmãos reais.
Com um único arquivo por slug, o lado "atual" tem arquivo; o lado "desafiante"
(uma revisão anterior) não tem. Para sustentar o duelo, seria preciso resolver
`slug@uuid` para um commit (§3.4) e materializar o conteúdo via
`git show <sha>:<path>` — em memória para o modo `inline`, ou em arquivo
descartável para o modo `path-only`.

Isso **quebra path-only conceitualmente**: `CLAUDE.md` documenta esse modo
como "recomendado para agentes com sessões longas ou compressão de contexto
(ex. Jules com 20 matches)" porque a CLI imprime só o path e o agente lê o
arquivo direto. Um lado histórico não tem path real no working tree — a
alternativa é forçar `inline` para lados históricos (anula o motivo de existir
o modo, justo para os agentes de sessão longa que mais precisam dele) ou
escrever um arquivo de rascunho temporário e garantir que nenhuma sessão o
`git add` por engano.

**Custo de performance:** a RFC 0010 §4.7 (achado E3) eliminou especificamente
um subprocesso `git log` **por candidato** (`gitMtime`) porque custava ~200
subprocessos por partida gerada — substituído por uma chamada `git log`
batelada. Ler conteúdo de blob (`git show`) é a mesma classe de custo; sem a
mesma disciplina de batching, o duelo reintroduz exatamente o problema que a
0010 acabou de resolver.

### 3.2. Janela de rascunho em edição — o motivo original da RFC 0003

Editar precisa de um lugar para o conteúdo em progresso conviver com o
original ainda vivo — senão volta a ser edição-no-lugar, e duas sessões
mirando o mesmo "pior post" colidem no merge (era exatamente o **problema 1**
que a RFC 0003 resolveu). Desenho de compensação: `draft-worst` continuaria
criando um irmão temporário (`<slug>.draft.mdx` ou algo em
`.routines/hronir/drafts/`) que existe só durante a janela contestada;
resolver o duelo dobra de volta para um arquivo só — vitória: sobrescreve
`<slug>.mdx`, derrota: apaga o rascunho sem deixar rastro no arquivo canônico.

Isso reintroduz um swap tipo `promote` — a mesma sequência
rename/escreve/unlink que a RFC 0010 já identificou como **não-atômica**
(achado V3: "crash no meio deixa o post sem canônica ou com UUID duplicado").
Uma nova implementação precisaria resolver essa atomicidade de novo, com
cuidado (escrever-depois-renomear sobre o path canônico, `git rm` do irmão no
mesmo commit).

### 3.3. Permalinks públicos `/blog/<slug>/v/<uuid>/`

Rota real, **já publicada hoje** — confirmado em
`src/pages/blog/[slug]/v/[uuid].astro` (e o par `pt/`), alimentada pela
collection `blogVersions`, que lê arquivos irmãos de verdade. Sem arquivos,
o build precisaria de um loader que enumere todo UUID historicamente
testado em duelo (não todo commit — a maioria dos commits que tocam um post
é frontmatter/typo, não uma "versão" pelo critério de hoje) e materialize
cada um via `git show` no momento do build.

Isso torna o build **dependente de ter o histórico completo do git
disponível e rápido**. `check.yml` já usa `fetch-depth: 0` (build de CI
seguro); mas `hronir-autopilot.yml` e `hronir-heartbeat.yml` usam checkout
raso (padrão), e qualquer clone raso — local ou de agente — falharia em
silêncio ao resolver blobs antigos. É uma classe de fragilidade nova: um
arquivo em disco não liga para profundidade de clone, squash-merge ou
reescrita de histórico; uma referência `slug@sha` liga. A convenção "merge
commits, não squash" do `CLAUDE.md` — hoje preferência de estilo — viraria
**requisito de corretude**.

Adicionalmente: hoje `prune` apaga o arquivo perdedor mas grava
`versions-pruned.json` para o permalink degradar a redirect, não a 404 (RFC
0010 §4.4, "a recuperabilidade via git não socorre o site estático"). Num
modelo git-only, nada é "podado" do git (histórico é append-only) — sem esse
registro, cada revisão testada em duelo continuaria pedindo uma página
gerada para sempre, a menos que o mesmo tipo de manifesto de redirecionamento
seja mantido de qualquer forma.

### 3.4. Identidade de versão (uuid → commit)

Hoje o uuid é computado sob demanda do conteúdo de um arquivo vivo, memoizado
por `(mtime, size)` (RFC 0010 §4.7). Sem arquivos-por-versão, responder "qual
commit tem o conteúdo do uuid X" sem re-hashear todo blob histórico a cada
consulta exige um índice persistido uuid→sha, mantido/estendido a cada
mudança de conteúdo — ou seja, reinventar um manifesto, só que sobre
plumbing do git em vez de listagem de diretório. Não é necessariamente pior,
mas não é o "sem manifesto" que a proposta sugere à primeira vista — é outro
manifesto.

### 3.5. `hronir:doctor`

Os checks de hoje são existência de arquivo — baratos, sempre corretos se o
arquivo está lá. Um doctor git-only precisaria confirmar que cada sha
referenciado é (a) um commit real e (b) alcançável a partir do HEAD (não
órfão por rebase/force-push) — uma classe de validação que hoje não existe
porque arquivos não têm "alcançabilidade".

### 3.6. O que de fato fica mais simples (justo reconhecer)

`versions-selected.json`, toda a recomputação sem histerese do `select()`,
`versions-pruned.json` e os limiares de `prune` (`PRUNE_MARGIN`,
`PRUNE_MIN_DUELS`) encolheriam ou desapareceriam — "publicada" deixa de ser
artefato calculado e volta a ser "o que está no HEAD". Esse é o argumento
mais forte a favor da proposta.

---

## 4. Migração (esboço, caso se decida seguir em frente)

1. **Fase 0 — congelar:** rodar `hronir:select` uma última vez, o resultado
   vira o ponto de partida da migração.
2. **Fase 1 — achatar:** para cada uma das 209 pastas,
   `git mv <slug>/<arquivo-selecionado> <slug>.mdx`; as demais ~295 versões
   não-selecionadas de hoje saem do working tree (recuperáveis só via
   `git log -- <slug>/<arquivo-antigo>` a partir do commit de migração).
3. **Fase 2 — índice uuid→sha:** script que popula o índice inicial varrendo
   `git log --follow` de cada slug e hasheando cada blob com a mesma função
   de `getPostUuid`.
4. **Fase 3 — reescrever consumidores:** `computeVersionRatings`/
   `pickVersionDuel` (leitura de blob), `draft-worst`/`draft-commit` (irmão
   temporário + fold atômico, §3.2), loader de `blogVersions` (materializa a
   partir do índice), `doctor` (checks de alcançabilidade).
5. **Fase 4 — CI:** `fetch-depth: 0` em todo workflow que roda comandos
   hronir ou build (hoje só `check.yml` tem isso).

Critério de aceite, no mesmo padrão de 0003/0010: snapshot de URLs idêntico
antes/depois, build e doctor verdes, golden tests dos duelos de versão
passando lendo blobs em vez de arquivos.

**Rollback:** ao contrário da migração da RFC 0010 (só renomes + um JSON
gerado, reversível de graça), esta é **destrutiva no working tree** — remove
~295 arquivos (mesmo que recuperáveis via git). Reverter o merge desfaz os
renomes, mas exige recomputar o índice uuid→sha do zero.

---

## 5. Alternativa mais barata — achada durante este desenho

Investigando por que 145 pastas acumulam 2-6 versões **mesmo com** um guard
explícito contra empilhar rascunhos, achei a causa raiz exata:

`draft-worst` já tenta não empilhar — `commands.ts:1948-1962` pula uma key
que ainda tem "um desafiante pendente" definido como versão não-selecionada
com `n < SELECT_MIN_DUELS` (= **2**). Mas `prune` só remove uma versão com
`n ≥ PRUNE_MIN_DUELS` (= **3**) **e** margem `≥ PRUNE_MARGIN` (= **0.5★**)
abaixo da selecionada. Ou seja: assim que um rascunho acumula 2 duelos
inconclusivos, ele **para de contar como "pendente"** para fins do guard
("uma versão que já duelou o suficiente e não venceu é uma perdedora
assentada... não pode bloquear o draft-worst para sempre" — comentário
correto para o bug que resolvia, a `-prev` fantasma da 0003/V4) — mas
continua existindo como arquivo até acumular o duelo extra **e** a margem
de 0.5★ que o `prune` exige. Como matches rodam a cada hora e `draft-worst`
uma vez por dia, qualquer rascunho ultrapassa `n ≥ 2` bem dentro de 24h — a
mesma key pode ganhar um irmão novo a cada ciclo, indefinidamente, sempre que
nenhuma versão perde pela margem cheia (plausível para revisões de qualidade
parecida). Esse é o mecanismo preciso por trás das pastas com 4-6 arquivos.

**Correção:** subir a barra do guard "não empilhar" para acompanhar a barra
do `prune`, não a barra estatística do `select` — pular a key enquanto
existir uma versão não-selecionada publicável ainda não elegível para poda
(em vez de `n < SELECT_MIN_DUELS`). Uma cláusula de guard em `commands.ts`
(~linha 1953-1961), zero mudança de schema, zero mudança em duelos,
permalinks ou seleção. Combinar com agendar `hronir:prune` (sem `--dry-run`)
na cadência que já existe em `hronir-heartbeat.yml`, para que perdedores
resolvidos sejam de fato removidos em vez de esperar alguém lembrar de rodar
o comando manualmente — fecha o laço que o guard sozinho não fecha (o guard
para o empilhamento novo; o agendamento limpa o que já empilhou).

Isso ataca exatamente o incômodo original ("o blog dispersa demais") sem
tocar no mecanismo de torneio, na feature de permalink, ou introduzir git
como dependência de runtime para resolver conteúdo.

---

## 6. Recomendação

Não recomendo a substituição integral: o custo (duelos precisam materializar
blobs com disciplina de batching para não reabrir o achado E3 da 0010,
permalinks passam a depender de histórico completo e de nunca squashar,
`doctor` ganha uma classe de falha nova, uuid→sha não é mais simples que o
manifesto atual) supera o ganho (eliminar `versions-selected.json`/`prune`),
principalmente porque o §5 entrega o mesmo alívio prático por uma fração do
risco — uma cláusula de guard, sem RFC nem migração.

Se a decisão for seguir com este documento mesmo assim, ele é o ponto de
partida para fases reais (com testes de aceite e PR incremental, no padrão
0003/0010/0014). Se a escolha for o §5, é uma PR pequena e dispensa RFC.

---

## Histórico de revisões

- **r0** (2026-07-08): rascunho inicial. Motivado por pergunta do dono sobre
  dispersão de arquivos de versão em `src/content/blog/`; parecer técnico
  contrário registrado em conversa (§1); dono pediu o desenho de qualquer
  forma. Levantamento de dados ao vivo (209 pastas, 504 arquivos, 145 com
  2+ versões, 0 elegíveis para poda) e diagnóstico de causa raiz do
  empilhamento (§5, gap entre `SELECT_MIN_DUELS` e `PRUNE_MIN_DUELS`) feitos
  nesta mesma sessão.
