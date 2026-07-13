# RFC 0015 — Versionamento single-file com histórico via git (avaliação)

|                 |                                                                                                                                                                                                                                                                                                    |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**      | Avaliação (parecer técnico contrário registrado em §1) seguida de **implementação parcial** a pedido explícito do dono, que optou por prosseguir apesar da recomendação do §6 — ver §7. Infraestrutura completa e testada; nenhum slug real foi achatado ainda (§7 explica por quê e o que falta). |
| **Autor**       | Franklin Baldo (proposta assistida)                                                                                                                                                                                                                                                                |
| **Criado em**   | 2026-07-08                                                                                                                                                                                                                                                                                         |
| **Branch / PR** | `claude/blog-versioning-strategy-n1aw5d`                                                                                                                                                                                                                                                           |
| **Depende de**  | RFC 0003 (introduziu versões-pares) e RFC 0010 (Implemented, Fases 0–4 — modelo atual). Esta RFC avalia **substituir** o modelo de versões-pares da 0010 por arquivo único + histórico via git; §2 e §3.6 listam o que seria eliminado, §3 o que quebra.                                           |
| **Afeta**       | `src/content/blog/**` (achataria `<slug>/v-*.*` → `<slug>.*`), `src/hronir/{posts,selection,commands,matches}.ts`, `src/content.config.ts`, `src/pages/blog/[slug]/v/[uuid].astro` (+ `pt/`), `.github/workflows/*` (fetch-depth), CLI do Hrönir                                                   |

---

## 1. Contexto e parecer técnico

O dono observou que `src/content/blog/` está disperso — uma pasta por post, várias
versões `v-*.mdx` convivendo dentro dela — e propôs manter só a versão mais
recente por post, usando o histórico do git como registro das anteriores.

Antes de responder, este documento foi precedido de uma investigação dos dados
ao vivo e do histórico de decisão do próprio repo:

- **208** pastas de post, **504** arquivos `v-*` hoje (`find src/content/blog
-mindepth 1 -maxdepth 1 -type d` retorna 209, mas uma delas, `images/`, guarda
  imagens de capa — `heroImage` —, não é um post). Dessas 208, apenas 207 têm
  versão publicável hoje —
  `the-art-of-delegating-orchestrating-jules-and-claude-in-everyday-life/` tem
  uma única versão marcada `draft: true` (§4 detalha).
- **144** pastas (69%) têm **2 ou mais** versões concorrentes ao mesmo tempo —
  20 com 4, 8 com 5, 6 com 6 (ex.: `vos/`).
- Dois slugs (`delegando-para-agentes`, `the-art-of-delegation`) têm, além da
  pasta `<slug>/` versionada normalmente, um arquivo `<slug>.md` solto na raiz
  de `src/content/blog/`. Nem o loader do Astro (que segue
  `versions-selected.json`) nem `listDirVersions`/a seleção por-versão os leem
  — mas não são totalmente inertes: `listPosts()` (`posts.ts`) varre
  recursivamente todo `.md`/`.mdx` sob `src/content/blog/`, incluindo esses
  dois, e alimenta `getRecentlyEditedKeys` (cooldown do `draft-worst`), o scan
  do `doctor` e o índice de `migrate` — hoje sem efeito prático só porque o
  `previousVersion.timestamp` de cada um coincide com o do irmão versionado.
  Arrumação fora do escopo deste documento, mas não tão inerte quanto uma
  primeira leitura sugere.
- `npm run hronir:prune -- --dry-run` **depende de `versions-selected.json`
  já existir** (gerado por um `hronir:select` real, não `--dry-run` — um
  checkout novo não tem esse arquivo, gitignorado); sem ele, `prune` itera
  `Object.keys(readSelection())` vazio e reporta "nenhuma versão elegível"
  **silenciosamente**, não porque não há acúmulo pendente. Rodando na ordem
  certa (`hronir:select` de verdade, depois `prune --dry-run`): **54** versões
  elegíveis para poda agora, em **46** diretórios (ex.:
  `postagem-inaugural-um-vislumbre-da-minha-mente` a -1.87★ n=5,
  `universal-threshold` a -1.63★ n=4). A dispersão observada é uma
  **mistura**: parte é competição genuinamente em aberto (ainda sem
  margem/duelos suficientes), parte é acúmulo real de perdedores já
  decididos que simplesmente nunca foram removidos — e uma fatia da própria
  parte "em aberto" não é maturação orgânica: o §5 (Causa 1) mostra um
  mecanismo de guard que deixa a mesma key ganhar um desafiante novo a cada
  ciclo, indefinidamente, antes de qualquer decisão por margem.
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
O §5 registra as causas-raiz precisas para o incômodo original (dispersão de
arquivos) — são duas, não uma — e correções que atacam **o componente evitável**
desse incômodo (pilhas e podas nunca executadas) por uma fração do custo,
achadas durante este desenho. Não eliminam o componente inerente ao desenho
do torneio — as 208 pastas continuam existindo (§5 detalha a distinção).

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

Isso **eliminaria de fato** `versions-selected.json` e a lógica de seleção sem
histerese do `hronir:select` (RFC 0010 §4.2, amendment 2026-07-01) —
"publicada" volta a ser "o que está no HEAD", sem artefato gerado no meio.
Esse é o ganho real da proposta, e é justo reconhecê-lo antes de listar o que
ela quebra. (`versions-pruned.json` **não** entra nessa lista — §3.3 mostra
que um manifesto equivalente teria que sobreviver.)

> Nota sobre a pasta-por-post: com um único arquivo, a pasta `<slug>/` deixa de
> carregar função — o mesmo motivo pelo qual a RFC 0006 achatou `musicas/`
> ("a pasta adiciona complexidade sem adicionar informação", RFC 0006 §2.1;
> "pasta tem que carregar função" é a paráfrase que a RFC 0003 §5 fez desse
> princípio, não uma citação literal da 0006). Migração completa flertaria com
> voltar a `<slug>.mdx` na raiz da collection, não `<slug>/post.mdx`.

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
(ex. Jules com 20 partidas)" porque a CLI imprime só o path e o agente lê o
arquivo direto. Um lado histórico não tem path real no working tree — a
alternativa é forçar `inline` para lados históricos (anula o motivo de existir
o modo, justo para os agentes de sessão longa que mais precisam dele) ou
escrever um arquivo de rascunho temporário e garantir que nenhuma sessão o
`git add` por engano.

**Custo de eficiência:** a RFC 0010 §4.7 (achado E3) eliminou especificamente
um subprocesso `git log` **por candidato** (`gitMtime`) porque custava ~200
subprocessos por partida gerada — substituído por uma chamada `git log`
batelada. Ler conteúdo de blob (`git show`) é a mesma classe de custo; sem a
mesma disciplina de processamento em lote, o duelo reintroduz exatamente o
problema que a 0010 acabou de resolver.

### 3.2. Janela de rascunho em edição — o motivo original da RFC 0003

Editar precisa de um lugar para o conteúdo em progresso conviver com o
original ainda vivo — senão volta a ser edição-no-lugar, e duas sessões
mirando o mesmo "pior post" colidem no merge (era exatamente o item
"Conflito de git" da RFC 0003 §1 que motivou aquela RFC). Desenho de
compensação: `draft-worst` continuaria
criando um irmão temporário (`<slug>.draft.mdx` ou algo em
`.routines/hronir/drafts/`) que existe só durante a janela contestada;
resolver o duelo dobra de volta para um arquivo só — vitória: sobrescreve
`<slug>.mdx`, derrota: apaga o rascunho sem deixar rastro no arquivo canônico.

Isso reintroduz um swap tipo `promote` — a mesma sequência
rename/escreve/unlink que a RFC 0010 já identificou como **não-atômica**
(achado V3: "crash no meio deixa o post sem canônica ou com UUID duplicado").
Uma nova implementação precisaria resolver essa atomicidade de novo, com
cuidado (escrever-depois-renomear sobre o path canônico, `git rm` do irmão no
mesmo commit) — **sem nenhum precedente no repo para validar a técnica**: a
0010 nunca testou esse caso, só eliminou o path de código (§4, §6); não há
teste de injeção de falha em `src/hronir/__tests__/` para copiar. "Com
cuidado" aqui é uma promessa, não uma técnica verificada.

**Lacuna não resolvida:** este desenho cobre só **um** desafiante por vez. Os
dados do §1 mostram que hoje 144/208 diretórios (69%) têm **2 a 6** versões
concorrentes simultâneas — múltiplos desafiantes é a norma, não a exceção.
Como nomear, guardar e fazer N desafiantes concorrentes duelarem entre si (não
só contra o canônico) sob "um arquivo por slug" fica em aberto; sem resolver
isso, o desenho ou limita a concorrência a 1 desafiante por vez (mudança de
comportamento não reconhecida em nenhum outro lugar deste documento) ou
precisa de mais um mecanismo não esboçado aqui.

### 3.3. Permalinks públicos `/blog/<slug>/v/<uuid>/`

Rota real, **já publicada hoje** — confirmado em
`src/pages/blog/[slug]/v/[uuid].astro` (e o par `pt/`), alimentada pela
collection `blogVersions`, que lê arquivos irmãos de verdade. Sem arquivos,
o build precisaria de um loader que enumere todo UUID historicamente
testado em duelo (não todo commit — a maioria dos commits que tocam um post
é frontmatter/erro de digitação, não uma "versão" pelo critério de hoje) e materialize
cada um via `git show` no momento do build.

Isso torna o build **dependente de ter o histórico completo do git
disponível e rápido**. `check.yml` já usa `fetch-depth: 0` (build de CI
seguro). `hronir-autopilot.yml` usa checkout raso (padrão), mas hoje só faz
merge/gate (confirmado lendo o workflow) — não roda `hronir` nem lê blob —
então não é afetado por este risco específico. **`deploy.yml` já é afetado
hoje, não é hipotético:** usa checkout raso (sem `fetch-depth`) e roda
`npm run build`, que dispara o hook `prebuild` do `package.json`
(`node ... scripts/hronir/index.js select`) antes do Astro buildar —
confirmado rodando `npm run build` neste checkout e observando os logs de
`[select]` disparar. É o workflow que de fato publica o site
(`actions/deploy-pages`, gatilho em todo push a `main` e cron diário às
06h) — ao contrário do `hronir-autopilot.yml`, que só mescla e nunca lê
conteúdo. Fora dele, qualquer outro clone raso que vier a rodar comandos
hronir — local, de agente, ou um workflow futuro — falharia em silêncio ao
resolver blobs antigos. É uma classe de fragilidade nova: um
arquivo em disco não liga para profundidade de clone, squash-merge ou
reescrita de histórico; uma referência `slug@sha` liga. A convenção "merge
commits, não squash" do `CLAUDE.md` — hoje preferência de estilo — viraria
**requisito de corretude**.

Adicionalmente: hoje `prune` apaga o arquivo perdedor mas grava
`versions-pruned.json` para o permalink degradar a redirect, não a 404 (RFC
0010 §4.4, "a recuperabilidade via git não socorre o site estático"). Num
modelo git-only, nada é "podado" do git (histórico só cresce, nunca é
reescrito) — sem esse registro, cada revisão testada em duelo continuaria pedindo uma página
gerada para sempre, a menos que o mesmo tipo de manifesto de redirecionamento
seja mantido de qualquer forma.

### 3.4. Identidade de versão (uuid → commit)

Hoje o uuid é computado sob demanda do conteúdo de um arquivo vivo, memoizado
por `(mtimeMs, size)` (`posts.ts`, cache por arquivo — RFC 0010 §4.7 descreve
a memoização como `(path, mtime)`, uma simplificação da mesma ideia). Sem
arquivos-por-versão, responder "qual
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

Ver §2: `versions-selected.json` e a recomputação sem histerese do `select()`
desapareceriam de fato — "publicada" deixa de ser artefato calculado e volta a
ser "o que está no HEAD". Esse é o argumento mais forte a favor da proposta.
Os limiares de `prune` (`PRUNE_MARGIN`, `PRUNE_MIN_DUELS`) encolhem **só**
no caso que este desenho efetivamente cobre — 1 desafiante por vez, nada
para podar quando o duelo e a dobra de volta terminam com um único arquivo
em repouso. Mas §3.2 já registra que múltiplos desafiantes concorrentes são o
caso mais frequente **hoje** (69% dos diretórios), e esse caso não tem
solução esboçada — para ele os limiares de `prune` ficam em aberto junto,
não encolhidos. `versions-pruned.json` não encolhe de jeito nenhum em
nenhum dos dois casos — §3.3 mostra que sobrevive como manifesto de
redirecionamento.

---

## 4. Migração (esboço, caso se decida seguir em frente)

1. **Fase 0 — congelar:** rodar `hronir:select` uma última vez, o resultado
   vira o ponto de partida da migração.
2. **Fase 1 — achatar:** `hronir:select` real produz **207** entradas
   publicáveis, não 208 — `the-art-of-delegating-orchestrating-jules-and-claude-in-everyday-life/`
   fica fora porque sua única versão é `draft: true` (mesma regra 2 do RFC
   0010 §4.2). Para cada uma das 207, `git mv <slug>/<arquivo-selecionado>
<slug>.mdx`; as demais ~297 versões não-selecionadas de hoje saem do
   working tree (recuperáveis só via `git log -- <slug>/<arquivo-antigo>` a
   partir do commit de migração). Três diretórios precisariam de triagem
   manual antes desta fase — fora do escopo deste esboço: os dois slugs com
   arquivo solto órfão e este diretório sem versão publicável (ambos
   registrados em §1).
3. **Fase 2 — índice uuid→sha:** script que popula o índice inicial varrendo
   `git log --follow` de cada slug e hasheando cada blob com a mesma função
   de `getPostUuid`. Isso cobre, por construção, todo UUID que uma rate file
   já commitada referencia — era conteúdo de algum arquivo em algum commit
   histórico, então `git log --follow` alcança; mas nada nesta fase confirma
   isso automaticamente, ficaria a cargo do `doctor` reescrito (§3.5)
   verificar. **Não esboçado aqui:** manutenção contínua pós-backfill —
   §3.4 já observa que o índice precisa ser "mantido/estendido a cada mudança
   de conteúdo"; um commit que toque um post fora dos caminhos do CLI
   reescritos (edição direta, correção urgente) dessincronizaria o índice do
   HEAD sem nada para detectar isso.
4. **Fase 3 — reescrever consumidores:** `computeVersionRatings`/
   `pickVersionDuel` (leitura de blob), `draft-worst`/`draft-commit` (irmão
   temporário + dobra atômica de volta a um arquivo, §3.2 — inclui resolver a
   lacuna de múltiplos desafiantes concorrentes que o próprio §3.2 deixa em
   aberto, e decidir entre `inline`/arquivo descartável para o modo
   `path-only`, §3.1, atualizando a documentação desse modo no `CLAUDE.md`),
   `prune` (§3.3/§3.6 já estabelecem que `versions-pruned.json` sobrevive
   como manifesto de redirecionamento — esta fase precisa gerá-lo e mantê-lo, tarefa
   que nenhuma versão anterior deste plano listou), loader de `blogVersions`
   (materializa a partir do índice), `doctor` (checks de alcançabilidade).
5. **Fase 4 — CI:** `fetch-depth: 0` em todo workflow que roda comandos
   hronir ou build (hoje só `check.yml` tem isso — `deploy.yml` também
   builda, portanto também dispara `hronir:select` via `prebuild`, §3.3, e
   hoje não tem `fetch-depth: 0`; precisaria do mesmo tratamento). Sozinho
   não basta para o requisito de corretude do §3.3 ("merge commits, não
   squash") — precisaria também de proteção de branch ou de desabilitar
   squash-merge no GitHub. Clones locais/de agente (§3.3) ficam fora do
   alcance de qualquer mudança de CI — nenhuma fase deste esboço os cobre.

**Lacuna na própria ordenação das fases:** como listada acima, a Fase 1
(`git mv` + remoção de ~297 arquivos-irmãos) roda antes da Fase 3 (reescrita
de `pickVersionDuel`/`computeVersionRatings` e do loader de `blogVersions`
para ler blobs via o índice). Isso quebra a convenção que este próprio
documento invoca para o critério de aceite ("no mesmo padrão de 0003/0010" —
processo de RFC do `CLAUDE.md`: cada fase verde antes da próxima): entre o
fim da Fase 1 e o fim da Fase 3, os arquivos-irmãos que os duelos e o loader
de `blogVersions` hoje leem ("lê arquivos irmãos de verdade", §3.3) já não
existem no working tree, e o código que leria blobs no lugar deles ainda não
foi escrito — duelos e permalinks `/v/<uuid>/` ficariam quebrados nesse
intervalo, não apenas mais lentos. Uma ordenação real precisaria intercalar
as fases (ex.: índice e reescrita de leitura antes de qualquer remoção de
arquivo) em vez da lista plana numerada acima — este esboço não resolve essa
dependência, só a numera incorretamente.

Critério de aceite, no mesmo padrão de 0003/0010: snapshot de URLs idêntico
antes/depois, build e doctor verdes, golden tests dos duelos de versão
passando lendo blobs em vez de arquivos, um teste de regressão de
subprocessos `git` por partida — sem ele, nada detecta o duelo reintroduzindo
o achado E3 que a 0010 já corrigiu (§3.1) —, **e** um teste que force um
crash no meio da dobra de `draft-worst`/`draft-commit` (§3.2) e confirme que
nenhum slug fica sem canônica nem com UUID duplicado — sem ele, nada detecta
o mesmo desenho reintroduzindo o achado V3. **Sem precedente no repo:** ao
contrário do teste de subprocessos (que estende infraestrutura existente),
não há teste de injeção de falha em `src/hronir/__tests__/` para copiar, e a
0010 nunca escreveu um teste assim para V3 — ela eliminou o path de código,
não testou em volta dele (ver §6). Esta lista também não é exaustiva: §3.2
(múltiplos desafiantes), §3.4 (dessincronia do índice fora do CLI), §3.3/Fase
4 (squash-merge sem imposição de CI, e clones locais/de agente que nenhuma
fase de CI alcança) e a ordenação Fase 1/Fase 3 acima são riscos de
regressão igualmente reais sem critério de aceite correspondente — um plano
de implementação real precisaria fechá-los, não só E3/V3.

**Rollback:** ao contrário da migração da RFC 0010 (só renomes + um JSON
gerado, reversível de graça), esta é **destrutiva no working tree** — remove
~297 arquivos (mesmo que recuperáveis via git). Reverter o merge desfaz os
renomes, mas exige recomputar o índice uuid→sha do zero.

---

## 5. Alternativa mais barata — achada durante este desenho

Investigando por que 144 pastas acumulam 2-6 versões **mesmo com** um guard
explícito contra empilhar rascunhos, achei duas causas distintas — não uma:

**Causa 1 (por que novos desafiantes continuam sendo criados).**
`draft-worst` já tenta não empilhar — `commands.ts:1948-1962` pula uma key
que ainda tem "um desafiante pendente" definido como versão não-selecionada,
**publicável**, com `n < SELECT_MIN_DUELS` (= **2**). Mas `prune` só remove uma versão com
`n ≥ PRUNE_MIN_DUELS` (= **3**) **e** margem `≥ PRUNE_MARGIN` (= **0.5★**)
abaixo da selecionada. Ou seja: assim que um rascunho acumula 2 duelos
inconclusivos, ele **para de contar como "pendente"** para fins do guard
("uma versão que já duelou o suficiente e não venceu é uma perdedora
assentada... não pode bloquear o `draft-worst` para sempre" — comentário
correto para o bug que resolvia, a `-prev` fantasma da 0003/V4) — mas
continua existindo como arquivo até acumular o duelo extra **e** a margem
de 0.5★ que o `prune` exige. Como partidas rodam a cada hora e `draft-worst`
uma vez por dia, qualquer rascunho ultrapassa `n ≥ 2` bem dentro de 24h — a
mesma key pode ganhar um irmão novo a cada ciclo, indefinidamente, sempre que
nenhuma versão perde pela margem cheia (plausível para revisões de qualidade
parecida). Esse é o mecanismo preciso por trás das pastas com 4-6 arquivos.

**Causa 2 (por que o que já foi decidido não some).** `prune` é manual
(`npm run hronir:prune`) e ninguém necessariamente roda. Confirmado ao vivo
nesta investigação (§1): com `versions-selected.json` gerado corretamente,
`prune --dry-run` reporta **54** versões já resolvidas — perderam por margem
e duelos suficientes — que continuam ocupando o diretório só porque o comando
não foi executado. Essa causa é independente da Causa 1: mesmo que o guard do
`draft-worst` fosse perfeito, esses 54 arquivos continuariam lá até alguém
rodar `prune` de verdade.

**Correção 1 (Causa 1):** subir a barra do guard "não empilhar" para
acompanhar a barra do `prune`, não a barra estatística do `select` — pular a
key enquanto existir uma versão não-selecionada publicável ainda não elegível
para poda (em vez de `n < SELECT_MIN_DUELS`). Uma cláusula de guard em
`commands.ts` (~linha 1953-1961), zero mudança de schema, zero mudança em
duelos, permalinks ou seleção.

**Correção 2 (Causa 2):** duas partes de custo bem diferente, que não devem
ser confundidas.

A **limpeza pontual** — rodar `hronir:select && hronir:prune` (sem
`--dry-run`) manualmente agora — é barata em esforço (dois comandos, zero
código novo), mas **não é "abre PR como qualquer outra sessão hronir"** sem
ressalva: um `prune` de verdade também grava
`src/generated/versions-pruned.json` (`registerPruned`,
`commands.ts:3175-3210`, chamada por `prune()` antes de deletar,
`commands.ts:3251`) — e, ao contrário de `versions-selected.json`, esse
arquivo **não é gitignorado** nem cai em nenhum `SAFE_PREFIXES` do
`hronir-autopilot.yml` (`.routines/hronir/`, `src/content/blog/`) nem nas
exceções de `.routines/*`. O gate por-arquivo do autopilot trata
`src/generated/versions-pruned.json` como arquivo fora de escopo e pula a PR
**inteira** — não só esse arquivo — silenciosamente (só no log do Actions,
nada visível na PR). As 54 deleções de versão em si não são o problema
(batem com `src/content/blog/`); é o manifesto novo que barra o merge
automático. A limpeza continua barata de executar, mas precisa de merge
manual (ou de estender o gate do autopilot) — não é tão automática quanto
"qualquer outra sessão hronir" sugere.
(Nota: fazer isso antes de reler o §4 deixa desatualizados o "504 arquivos"
e o "144 (69%)" do §1 e o "~297" que §4 deriva de "504" — reconferido nesta
rodada: uma poda real deixaria 450 arquivos, com dirs em 2+ versões caindo
de 144 (69%) para 125 (60%) e a distribuição "20 com 4, 8 com 5, 6 com 6"
encolhendo para 17/5/3. São uma fotografia de hoje, não um valor fixo;
recontar antes de usá-los para dimensionar uma migração real.)

Já o **agendamento** — rodar isso periodicamente sem intervenção, para
fechar o laço que a Correção 1 sozinha não fecha (ela para o empilhamento
novo; o agendamento limpa o que já empilhou) — não é tão simples quanto
"achar um cron para anexar". `hronir-heartbeat.yml` existe, mas seu `cron`
está comentado/desabilitado hoje ("Heartbeat desabilitado — Jules
substituído por outro agente"), nunca invocou comandos hronir (era só
reabastecimento do conjunto de sessões Jules), e roda hoje com
`permissions: contents: read` — reativá-lo para isso não é só descomentar o
cron, é decidir elevar um workflow ocioso e só-leitura para escrita/push na
branch padrão. **Esse é o
ponto central do §6**: automatizar significa `prune` apagando arquivos
direto em `main`, sem PR e sem revisão — desenho de segurança que este
documento não resolve, só aponta.

Isso ataca o componente evitável da dispersão — pilhas de 4-6 arquivos por
diretório e podas já decididas nunca executadas — sem tocar no mecanismo de
torneio, na funcionalidade de permalink, ou introduzir git como dependência de
runtime para resolver conteúdo. Não elimina o componente inerente ao
desenho: as 208 pastas continuam existindo, e qualquer diretório em
competição ativa ainda terá 2 arquivos por definição (a versão selecionada +
um desafiante) — isso é o preço de manter o torneio, não um bug a corrigir.
E a Correção 2 sozinha não é permanente: sem agendar de verdade
`select`/`prune` (reativar o cron do heartbeat ou criar um workflow novo,
como já dito acima), o acúmulo da Causa 2 volta a se formar — rodar os
comandos manualmente uma vez limpa o estoque atual, não fecha o problema.
A dependência também corre no sentido inverso: o novo limiar da Correção 1
("ainda não elegível para poda") é definido em termos da própria
elegibilidade de poda — assim que um irmão perdedor cruza
`n ≥ PRUNE_MIN_DUELS` e a margem `≥ PRUNE_MARGIN`, o guard libera um
desafiante novo mesmo que ninguém tenha rodado `prune` ainda. As duas
causas são independentes no sentido que este documento já registra (um
guard perfeito não faz os 54 arquivos existentes sumirem sozinho), mas não
no sentido oposto: sem a Correção 2 rodando com regularidade, a Correção 1
não elimina o empilhamento — só o limita ao ritmo em que `prune` atrasa, de
"indefinido" (hoje) para "até o próximo `prune`", não para zero.

---

## 6. Recomendação

Não recomendo a substituição integral: o custo (duelos precisam materializar
blobs com disciplina de processamento em lote para não reabrir o achado E3 da
0010, e quebram o modo `path-only` que o `CLAUDE.md` recomenda justo para
agentes de sessão longa, §3.1; a janela de rascunho reintroduz o swap
não-atômico que a 0010 **eliminou removendo o mecanismo** (achado V3 —
`promote`/`promoteFile` deixaram de existir, não foram corrigidos; a 0010
nunca escreveu um teste para esse caso, só o path de código inteiro) e não
cobre múltiplos desafiantes concorrentes — a norma hoje, §3.2; permalinks
passam a depender
de histórico completo e de nunca squashar, sem mecanismo de CI que imponha
isso, §3.3; uuid→sha não é mais simples que o manifesto atual e precisa de
manutenção contínua não esboçada, §3.4; `doctor` ganha uma classe de falha
nova, §3.5; e a migração em si é destrutiva no working tree e cara de
reverter, ao contrário do precedente "reversível de graça" da 0010, §4)
supera o ganho (eliminar `versions-selected.json` e a
recomputação sem histerese do `select()` — não `versions-pruned.json`, que
sobrevive, §3.3), principalmente porque o §5 ataca o componente evitável do
mesmo incômodo por uma fração do risco — não o componente inerente ao
torneio, que nenhuma das duas propostas remove (§5). A Correção 1 (cláusula
de guard) é de fato barata. A Correção 2 (agendar `select`/`prune`) precisa
de um cron novo ou reativado — e, ao contrário do resto da automação hronir
(`hronir-autopilot.yml`, que só mescla depois de gate de PR + CI, com um
guard explícito contra deletar rate files), esse cron rodaria `prune`
**sem PR e sem revisão**, apagando arquivos de conteúdo direto na branch
padrão — um desenho de permissão e segurança que este documento não
resolve, só aponta.

Se a decisão for seguir com este documento mesmo assim, ele é o ponto de
partida para fases reais (com testes de aceite e PR incremental, no padrão
0003/0010/0014). Se a escolha for o §5, a Correção 1 é uma PR pequena e
dispensa RFC; a Correção 2 precisa do desenho de segurança do parágrafo
acima antes de virar automação — não é tão pequena quanto parece.

---

## 7. Implementação (2026-07-08, sessão de execução)

O dono pediu explicitamente para prosseguir com a migração apesar da
recomendação do §6 ("You need to write scripts to make the migration, test
the migration, etc"). Esta seção documenta o que foi de fato construído,
as decisões de desenho tomadas para as lacunas que o resto deste documento
deixava em aberto, o que foi deliberadamente escopado fora, e como
verificar.

### 7.1 O que foi construído

- **`src/hronir/history.ts`** (novo): registro append-only `slug@uuid` →
  `{sha, path, metadata}`. Mescla o papel que `versions-pruned.json` (RFC
  0010 §4.4) tinha com um índice uuid→blob — sob o modelo single-file,
  _toda_ versão não-canônica vira arquivo ausente, não só as podadas.
  Committed (não gitignorado): ao contrário de `versions-selected.json`,
  não é recomputação pura — é a única memória de um blob depois que seu
  arquivo some do working tree.
- **`src/hronir/posts.ts`**: leitura de conteúdo via git plumbing
  (`blobShaForPath` com `-w` — grava o objeto, não só calcula o hash;
  `readBlob`, `readPostFromBlob`) e `uuidsFromRaw` extraído para computar
  identidade a partir de conteúdo de blob, byte-idêntica à computada a
  partir de arquivo (testado diretamente).
- **`src/hronir/selection.ts`**: `listSlugVersions`/`listAllVersionSlugs`
  (dual-mode — arquivo achatado `<slug>.mdx` + desafiantes em
  `.routines/hronir/drafts/<slug>/`, ou fallback para o layout legado por
  diretório) e `foldBack` (swap atômico escrever-depois-renomear — não
  renomear/escrever/unlink, o padrão do achado V3 da RFC 0010 §4.7; a
  canônica nunca fica ausente, nem no meio de um crash simulado).
- **`src/hronir/commands.ts`**: `select`/`prune`/`doctor`/`pickVersionDuel`/
  `editWorst` reescritos para funcionar com os dois layouts
  transparentemente — mesma lógica de decisão (ratings, margem,
  acoplamento de grupo de tradução), só "como o vencedor vira ao vivo"
  muda por slug. Novo comando **`flatten`** (§7.2).
- **`src/content.config.ts`** / **`src/lib/versions.ts`**: o site
  reconhece um slug achatado tanto na collection `blog` quanto na
  resolução de UUID/permalink que `pages/blog/[...slug].astro` usa.
- **`.github/workflows/deploy.yml`**: `fetch-depth: 0` — já dispara
  `hronir:select` via `prebuild` em checkout raso hoje, achado inédito
  (§3.3 só discutia `check.yml`/`hronir-autopilot.yml`).
- **`package.json`**: `--test-concurrency=1` — achado ao testar: módulos
  que memoizam estado por processo (`_selectionCache`, `_uuidCache`) não
  são seguros sob a concorrência de arquivo padrão do `node:test` quando
  os testes isolam fixtures via `chdir`.

**78 testes** (`history.test.js`, `posts-blob.test.js`,
`slug-versions.test.js`, `fold-back.test.js`, `flatten.test.js`), incluindo
o teste de injeção de falha que o §3.2/§4 registravam como sem nenhum
precedente no repo — construído à mão o estado em disco que um crash em
cada ponto da sequência de `foldBack` deixaria, confirmando que a canônica
nunca fica ausente nem duplicada. Verificado também contra o repo real:
`doctor` (0 inconsistências, mesmos avisos pré-existentes), `select`/
`prune --dry-run` (resultados idênticos aos de antes das mudanças), e um
build de produção completo (4513 páginas, pagefind indexou 209 páginas) —
nenhuma regressão contra o corpus atual, 100% layout legado.

### 7.2 Decisões de desenho para as lacunas que este documento deixava em aberto

- **Múltiplos desafiantes concorrentes (§3.2, lacuna não resolvida):**
  resolvida mantendo desafiantes fora da content collection, em
  `.routines/hronir/drafts/<slug>/`, em vez de inventar um mecanismo de N
  desafiantes dentro de um esquema pensado para um arquivo só. Cada
  desafiante é um arquivo normal nesse diretório; `foldBack` funde o
  vencedor, os outros continuam competindo. Isso ataca diretamente a queixa
  original (menos arquivos em `src/content/blog/`) sem precisar resolver o
  problema mais difícil de nomear/ordenar N competidores num único
  namespace de arquivo.
- **Ordenação de fases (achado da r7, §4):** em vez de Fase 1 (achatar)
  antes da Fase 3 (reescrever consumidores) — que a r7 mostrou deixar o
  site quebrado no intervalo — os leitores (`listSlugVersions` etc.) são
  **dual-mode desde o primeiro commit**: funcionam com os dois layouts
  simultaneamente, então achatar um slug não depende mais de nenhuma
  ordem — pode acontecer a qualquer momento, slug por slug.
- **Permalinks de versões históricas (§3.3):** `ArchivedContent.astro` já
  busca o conteúdo arquivado **client-side** via `raw.githubusercontent.com`
  em vez de renderizar no build — achado nesta sessão, não estava
  documentado em nenhuma revisão anterior. Isso significa que um loader
  Astro customizado lendo blobs via `git show` no build (o que §3.3
  presumia ser necessário) não é preciso para o caso comum: bastaria trocar
  a URL de `.../main/<path>` para `.../<commit-sha>/<path>` — GitHub serve
  raw content pineado em qualquer sha, não só branch. **Não implementado
  nesta sessão** (§7.3) — só a observação que simplifica o problema.

### 7.3 Escopo explicitamente deixado de fora

- **Nenhum slug foi achatado de verdade.** Só `--dry-run`, verificado
  contra dois slugs reais (`vos`, e um slug com histórico real de poda —
  a classificação pendente-vs-decidido bateu exatamente com o que
  `prune --dry-run` já achava para os mesmos desafiantes). Motivo: esta
  branch já nasceu dezenas de commits atrás de `main` e fica mais defasada
  a cada hora (o autopilot mescla sessões hronir por hora) — achatar a
  fotografia de hoje quebraria contra o `main` real no momento em que isto
  pudesse ser mesclado. Por isso `flatten` foi desenhado como comando
  incremental e repetível (§4 original previa um corte único) — para rodar
  fresco contra o estado real a qualquer momento, não para ser executado
  por esta sessão.
- **Permalink `/v/<uuid>/` para desafiante achatado ainda em competição:**
  `blogVersions` continua só-legado; um rascunho em
  `.routines/hronir/drafts/` não gera página enquanto ainda compete. Não é
  um esquecimento — fechar isso exigiria um segundo diretório-base no
  loader do Astro (`astro/loaders`' `glob()` só aceita um `base`), e o que
  de fato importa (permalink sobreviver depois que a versão já não é mais
  arquivo) não depende disso: uma vez arquivada em `versions-history.json`,
  a rota resolveria dali — só que essa rota (ler `versions-history.json`
  em `[uuid].astro` e gerar a página) também não foi implementada nesta
  sessão.
- **A simplificação de raw URL pineada em commit** (§7.2) não foi
  implementada — `archivedContentUrls` (`src/lib/versions.ts`) ainda usa
  `GITHUB_BRANCH` fixo, não o `commitSha` que `history.ts` já armazena por
  entrada.
- **Manutenção contínua do índice** fora do CLI (§3.4, edição direta
  dessincronizando) continua sem mecanismo — mesma lacuna, herdada.

---

## 8. Retomada (2026-07-13, RFC 0016 fase 3)

A pedido do dono, a implementação foi retomada como fase final da
simplificação da RFC 0016. Fechadas três das lacunas do §7.3, na ordem
recomendada pelo relatório de escopo (rota histórica antes de qualquer
achatamento real):

- **Rota de permalink histórica (Fase A).** `src/lib/history-pages.ts`
  materializa blobs do histórico no build (`git cat-file blob`, memoizado,
  aviso + skip quando o objeto é inalcançável — nunca quebra o build). Um
  endpoint estático `/blog/<slug>/v/<uuid>/raw.txt` serve o corpo bruto de
  cada entrada de `versions-history.json`, e `[uuid].astro` (EN e PT) emite
  páginas arquivadas para todo uuid do histórico (uuid atual + aliases
  legacy/pre-OKF) que as collections não cobrem — collections sempre vencem.
  `archivedContentUrls` aceita pin opcional de `commitSha` (default `main`
  para arquivos vivos). Blob inalcançável degrada para a página sem
  `rawUrl` (link de fallback do GitHub), preservando o permalink.
  Verificado: build sem histórico é byte-idêntico ao atual; build com
  histórico sintético (blob real + sha inexistente) emite as páginas e o
  `raw.txt` corretos e degrada o caso quebrado sem falhar.
- **Gate do autopilot (Fase B).** `SAFE_PREFIXES` agora inclui
  `src/generated/versions-pruned.json` e `versions-history.json` (outputs
  commitados de prune/flatten), e drafts de slug achatado
  (`.routines/hronir/drafts/**`) contam como draft para o gate — sem isso,
  toda PR de sessão pós-achatamento seria barrada em silêncio.
- **Wiring do flatten (Fase C).** `npm run hronir:flatten` (alias que
  faltava). O teste de contagem de subprocessos git por match (critério E3
  do §4) segue não implementado — o desenho atual não materializa via
  `git show` em caminho de match (pendentes viram arquivos em `drafts/`),
  então não há regressão a guardar ainda.

**Segue de fora (Fase D):** nenhum slug real foi achatado. O runbook é o do
relatório de escopo: rodar `hronir:select` real contra `main` fresco, depois
`npm run hronir:flatten -- --slug <um-slug>` começando por um slug simples
(sem desafiantes pendentes, sem grupo de tradução), PR pequeno, conferir
permalinks e build, repetir. Os dois slugs órfãos do §1 são triagem manual.
`stampHistoryCommit` continua não ligado a fluxo de commit (`commitSha`
fica `null` → fallback de link para a raiz do repo) — aceitável até o
primeiro achatamento real exigir melhor.

## Histórico de revisões

- **r0** (2026-07-08): rascunho inicial. Motivado por pergunta do dono sobre
  dispersão de arquivos de versão em `src/content/blog/`; parecer técnico
  contrário registrado em conversa (§1); dono pediu o desenho de qualquer
  forma. Levantamento de dados ao vivo (208 pastas, 504 arquivos, 144 com
  2+ versões, 0 elegíveis para poda) e diagnóstico de causa raiz do
  empilhamento (§5, lacuna entre `SELECT_MIN_DUELS` e `PRUNE_MIN_DUELS`) feitos
  nesta mesma sessão.
- **r1** (2026-07-08): revisão adversarial (5 agentes de verificação de
  fatos + consistência interna) achou e corrigiu: contagem de pastas
  inflada por `images/` (209→208, 145→144 com 2+ versões, com nota sobre
  dois slugs com arquivo órfão solto na raiz); referência quebrada a um
  inexistente "§7"; erro de um-a-mais "§6" → "§5"; contradição entre §2/§3.6
  (alegava eliminar
  `versions-pruned.json`, que §3.3 já mostrava sobreviver); citação errada da
  chave de memoização do UUID; `hronir-heartbeat.yml` citado como cadência
  "já existente" para `prune` quando seu cron está de fato desabilitado; e o
  custo de atomicidade do §3.2 (swap tipo `promote`, achado V3) faltando no
  balanço do §6. Sem mudança na recomendação.
- **r2** (2026-07-08): segunda revisão adversarial (5 agentes independentes,
  sem contexto da r1). Achado mais significativo: a alegação "`prune --dry-run`:
  zero elegíveis" (§1) media contra um `versions-selected.json` **ausente**
  (checkout sem `hronir:select` real rodado antes — a própria r0/r1 caiu
  nessa armadilha). Reproduzido nesta revisão: na ordem certa, são **54**
  versões elegíveis para poda agora. §1 reescrito para refletir isso; §5
  reestruturado em duas causas-raiz distintas (guard vs. `prune` nunca
  rodado) com correções separadas. Também corrigidos: os arquivos órfãos do
  §1 não são totalmente inertes (lidos por consumidores baseados em
  `listPosts()` — cooldown do `draft-worst`, `doctor`, `migrate`);
  `hronir:select` real produz 207 entradas publicáveis, não 208 (~297
  arquivos sobrariam na Fase 1, não ~296, e um terceiro diretório — sem
  versão publicável — precisa da mesma triagem manual dos dois órfãos); §3.3
  ainda citava `hronir-heartbeat.yml` como exposto ao risco de clone raso
  depois do §5 já ter estabelecido que ele não roda comandos hronir; a
  citação "pasta tem que carregar função" corrigida — é paráfrase da RFC
  0003 sobre a RFC 0006, não citação literal; §5 (guard também exige
  `v.published`) e §3.2/§4/§6 ganharam as lacunas que faltavam (múltiplos
  desafiantes concorrentes não resolvidos; decisão do modo `path-only` sem
  fase atribuída; manutenção contínua do índice uuid→sha não esboçada;
  "não-squash" sem imposição de CI; critério de aceite sem teste de
  regressão de subprocessos; custo do `path-only` ausente do §6); três
  palavras em inglês soltas na prosa (`housekeeping`, `batching`, `tally`)
  traduzidas. Sem mudança na recomendação — o achado dos 54 reforça a
  Correção 2 do §5, não o desenho git-only.
- **r3** (2026-07-08): terceira revisão adversarial (5 agentes independentes).
  Dois erros factuais tinham sobrevivido às duas rodadas anteriores: o
  exemplo de "6 com 6" (§1) apontava para `f85fb538-.../`, que na verdade
  tem 5 versões (corrigido para `vos/`, que tem 6 de fato) — erro do r0,
  nunca verificado nas rodadas seguintes; e "~30 diretórios" para as 54
  versões podáveis (achado do r2) nunca tinha sido contado de verdade —
  são **46**. Também corrigida uma referência que a própria correção do r2
  deixou pela metade: §3.3 trocou a citação de `hronir-heartbeat.yml` para
  `hronir-autopilot.yml`, mas manteve um "(§5)" que só sustenta a alegação
  para o workflow errado — removida a citação, mantido o fato (verificado
  direto no arquivo do workflow). §3.6 e §4/Fase 3 passaram a reconhecer
  que a lacuna de múltiplos desafiantes concorrentes do §3.2 também deixa
  os limiares de `prune` e a fase de reescrita em aberto, não só o desenho
  do irmão temporário. §5/Correção 2 ganhou uma nota: rodar a correção
  antes de reler o §4 deixa os números "504"/"~297" desatualizados. Seis
  anglicismos a mais traduzidos (`matches`, `backlog` ×2, `pool`, `fork` ×2,
  `enforcement`, `append-only`) — dois deles dentro da própria entrada do
  r2 que alegava ter corrigido todos os anglicismos. Sem mudança na
  recomendação.
- **r4** (2026-07-08): quarta revisão adversarial (5 agentes independentes).
  Achados desta vez foram sobre completude e precisão, não mais números
  errados — os dados voltaram a bater exatamente (208/504/144/54/46/207
  reconfirmados ao vivo). Uma lacuna real sobreviveu às três rodadas
  anteriores apesar do fato-base ter sido citado três vezes em seções
  diferentes: §4 nunca atribuía a nenhuma fase a geração/manutenção de
  `versions-pruned.json`, mesmo §3.3/§3.6/§6 já estabelecendo que ele
  sobrevive — corrigido, adicionado à Fase 3. §5 fechava com "ataca
  exatamente o incômodo original", alegação forte demais: as 208 pastas
  continuam existindo e qualquer diretório em competição ativa ainda terá 2
  arquivos por definição — reescrito para separar o componente evitável
  (pilhas e podas não executadas) do componente inerente ao desenho do
  torneio. §6 não custava a infraestrutura de agendamento que a própria
  Correção 2 exige; critério de aceite não tinha teste para o achado V3
  (só para o E3); terceiro diretório sem versão publicável (§4) nunca
  citado em §1, quebrando o padrão dos outros dois casos especiais; nota
  do §5 sobre números desatualizados atribuía "504" a §4 quando esse
  número só aparece em §1; §3.6 lia como autocontradição ("caso comum" vs.
  "caso mais frequente hoje" para o mesmo cenário) — reescrito para deixar
  claro que são o mesmo caso, descrito de dois jeitos. Mais quatro
  anglicismos traduzidos (`matches` de novo — a própria r3 alegava tê-lo
  corrigido —, `performance`, `typo`, `hotfix`) e dois dentro da entrada
  do r1, nunca revisitada até agora (`fact-check`, `off-by-one`). Sem
  mudança na recomendação.
- **r5** (2026-07-08): quinta revisão adversarial (5 agentes independentes).
  Achado mais significativo: §6 dizia que a RFC 0010 "já corrigiu" o achado
  V3, mas a 0010 na verdade eliminou o mecanismo (`promote`/`promoteFile`
  deixaram de existir) sem nunca escrever um teste para o caso — o próprio
  §3.2 já usava a redação certa ("identificou como não-atômica"), só §6
  estava errado, sobrevivendo desde a r1. Isso também explica por que o
  critério de aceite para V3 (adicionado na r4) não tinha precedente para
  copiar — corrigido, com nota explícita sobre a ausência de teste de
  injeção de falha no repo e reconhecimento de que a lista de critérios
  ainda não é exaustiva (múltiplos desafiantes, dessincronia do índice,
  squash-merge também carecem de critério, não só E3/V3). Achado 2: a
  honestidade que o §5 ganhou na r4 (componente evitável vs. inerente) não
  tinha sido propagada para §1 e §6, que ainda alegavam resolução completa
  — corrigidos §1 e §6 (§5 já estava certo desde a r4). Achado 3: §6 nunca precificava o que a
  Correção 2 realmente exige — um cron rodando `prune` sem PR/revisão,
  apagando conteúdo direto na branch padrão, sem os gates que o resto da
  automação hronir usa para esse tipo de escrita — adicionado como
  desenho de segurança em aberto, não resolvido por este documento. Mais
  seis anglicismos traduzidos (`fold-back` ×2, `manifesto de redirect`,
  `feature`, `gap`, um novo `enforcement` que a própria correção deste
  parágrafo reintroduziu e teve que ser corrigido de novo). Avaliação
  honesta de dois agentes independentes: a dimensão de tradução/prosa
  convergiu (achados cada vez menores, alta taxa de falso-positivo em
  candidatos), mas a dimensão de completude técnica ainda achava coisas
  reais nesta rodada — sinal misto, não uma convergência limpa. Sem
  mudança na recomendação.
- **r6** (2026-07-08): sexta revisão adversarial (5 agentes independentes).
  Achado mais significativo, convergente entre dois agentes independentes
  (leitura "olhos frescos" e completude técnica): §5/Correção 2 afirmava que
  a correção da Causa 2 "é imediata... não depende de código novo", mas essa
  frase descreve só a limpeza pontual — o desenho de segurança do
  agendamento (cron sem PR/revisão apagando conteúdo na branch padrão) só
  aparecia na seção seguinte (§6), nunca qualificando a alegação de §5
  onde o leitor de fato agiria. Reescrito: Correção 2 agora separa
  explicitamente "limpeza pontual" (de fato imediata) de "agendamento" (não
  trivial, remete ao desenho de segurança do §6, cita
  `permissions: contents: read` do `hronir-heartbeat.yml`). Achado 2: §3.2
  descrevia a técnica de dobra atômica ("com cuidado") sem registrar que não
  há nenhum precedente no repo para validá-la — nem teste de injeção de
  falha existente para copiar, nem a própria 0010 testou esse caso (só
  eliminou o path de código) — adicionado como ressalva explícita. Mais
  anglicismos traduzidos: `fault-injection` (reintroduzido pela própria r5
  no texto que ela mesma adicionou, escapando da varredura de anglicismos
  daquela rodada) e `branch default` ×2. Dois erros achados na própria
  entrada da r5 deste changelog, não no corpo do documento: "mischaracterizava"
  (palavra em inglês) → "estava errado"; "corrigido nos três lugares"
  imprecisava a contagem real (era §1 e §6 — §5 já estava certo desde a r4)
  → corrigido para refletir isso. Padrão notado por um dos agentes: cada
  rodada introduz uma taxa pequena de erros novos (anglicismos, referências
  soltas) no texto que ela mesma escreve — proporcional ao volume de prosa
  nova, não um poço de erros antigos que se renova sozinho; consistente com
  a leitura de "sinal misto" da r5. Sem mudança na recomendação.
- **r7** (2026-07-08): sétima revisão adversarial (5 agentes independentes,
  desta vez com lentes deliberadamente diferentes das rodadas 1-6: fact-check
  ao vivo, consistência interna, completude/lacunas, convenções, e uma
  passada de "leitor novo" fazendo o walkthrough de execução do §4 em vez de
  só checar fatos). Ao contrário do sinal de convergência da r6, esta rodada
  achou problemas mais numerosos e mais graves — a mudança de lente importou
  mais do que mais uma rodada do mesmo método.

  **Novos e substanciais:** (1) `deploy.yml` — o workflow que de fato publica
  o site — usa checkout raso e já dispara `hronir:select` via `prebuild`
  antes de todo `npm run build` (confirmado rodando o comando); §3.3/§4 só
  discutiam `check.yml` e `hronir-autopilot.yml`, tratando qualquer outro
  caso como hipotético — não é. (2) A "limpeza pontual" da Correção 2 (§5,
  reescrita na r6) alegava abrir PR "como qualquer outra sessão hronir", mas
  um `prune` de verdade também grava `versions-pruned.json`, que não é
  gitignorado nem cai em nenhum `SAFE_PREFIXES` do `hronir-autopilot.yml` —
  o gate rejeitaria a PR inteira, silenciosamente. (3) A ordenação das fases
  do §4 está quebrada: a Fase 1 remove os arquivos-irmãos que duelos e o
  loader de `blogVersions` leem hoje antes da Fase 3 reescrever esses
  consumidores para ler blobs — entre as duas fases, duelos e permalinks
  ficariam quebrados, não só mais lentos, violando a própria convenção
  "cada fase verde antes da próxima" que o documento invoca para seu
  critério de aceite. (4) Uma terceira ocorrência de "branch default" (a
  original, introduzida pela r5 no corpo do §6) sobreviveu à correção da r6
  porque o texto-fonte quebra "branch" e "default" em duas linhas do
  markdown — a busca literal de linha única da r6 nunca podia encontrá-la;
  dois agentes independentes desta rodada a acharam com busca tolerante a
  quebra de linha.

  **Convergente entre 2 agentes** (mesmo padrão da r6): o balanço de custo do
  §6 nunca incluía o achado do §4 de que a migração é destrutiva no working
  tree e cara de reverter — adicionado à enumeração.

  **Também corrigidos:** a Correção 1 (§5) não é totalmente independente da
  Correção 2 no sentido inverso — seu novo limiar libera assim que um irmão
  cruza elegibilidade de poda, mesmo sem `prune` ter rodado, então sozinha
  ela limita o empilhamento, não o elimina; a leitura "competição
  genuinamente em aberto" do §1 ganhou ressalva de que uma fatia dessa parte
  também é artefato do mesmo guard da Causa 1, não maturação orgânica; a
  nota de números desatualizados do §5 não cobria "144 (69%)" — expandida
  com os números reconferidos ao vivo desta rodada (cairia para 125/60%,
  distribuição 17/5/3); Fase 2 ganhou uma frase confirmando que o backfill
  cobre por construção todo UUID de rate file já commitada; a lista "não
  exaustiva" do critério de aceite ganhou clones locais/de agente como
  lacuna própria. Anglicismo novo (`hedge`, introduzido pela própria entrada
  da r6 no changelog); a mesma entrada da r6 também errava "três seções
  depois" para uma alegação que na verdade está na seção seguinte (§5→§6 são
  adjacentes); calque sintático na linha de Status, sobrevivendo desde a r1
  ("da 'implementação faseada' padrão" → "do padrão de 'implementação
  faseada'"); um `draft-worst` sem backtick; três "pra" substituídos por
  "para" no parágrafo de agendamento.

  Sem mudança na recomendação — nenhum achado torna o desenho git-only mais
  barato; a maioria reforça riscos já listados ou expõe que a Correção 2 e o
  próprio esboço de migração do §4 tinham menos acabamento do que pareciam.
  Diferente da leitura de convergência da r6: esta rodada mostra que
  fact-checking e consistência interna (o método das rodadas 1-6) chegam a
  um teto real, mas outras lentes sobre o mesmo texto — "isso funcionaria se
  alguém executasse?", "este comando real dispara este workflow real?" —
  continuam achando problemas de fundo. Convergência do documento como um
  todo permanece em aberto.

- **r8 — implementação** (2026-07-08): o dono pediu explicitamente para
  prosseguir apesar da recomendação do §6 ("You need to write scripts to
  make the migration, test the migration, etc"). Construída e testada a
  infraestrutura completa do modelo single-file — índice de histórico
  (`history.ts`), leitura dual-mode (`selection.ts`), fold-back atômico com
  testes de injeção de falha (o precedente que §3.2/§4 registravam como
  inexistente no repo), comando `flatten` incremental (§4 original previa
  corte único; redesenhado como comando repetível por slug depois de achar
  que esta branch já estava defasada de `main` e ficando mais defasada a
  cada hora), `content.config.ts`/`versions.ts` reconhecendo slugs
  achatados, `fetch-depth: 0` em `deploy.yml`. 78 testes, verificado contra
  o repo real (`doctor`/`select`/`prune --dry-run` idênticos a antes, build
  de produção completo sem regressão) e com dois `flatten --dry-run` reais.
  Nenhum slug foi achatado de verdade nesta sessão — ver §7.3 para o que
  ficou de fora e por quê. Achado durante a implementação, não previsto por
  nenhuma rodada de revisão anterior: `ArchivedContent.astro` já busca
  conteúdo arquivado client-side via `raw.githubusercontent.com`, o que
  simplifica o problema de permalink histórico que §3.3 assumia exigir um
  loader Astro customizado lendo blobs no build — só a observação foi
  registrada (§7.2), a simplificação em si não foi implementada. Detalhes
  completos em §7.
