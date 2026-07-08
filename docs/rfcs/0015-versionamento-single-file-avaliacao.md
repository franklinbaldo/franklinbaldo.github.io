# RFC 0015 — Versionamento single-file com histórico via git (avaliação)

|                 |                                                                                                                                                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**      | Avaliação — parecer técnico contrário registrado em §1; documento mantido como desenho de referência a pedido do dono. **Não implementado**, foge da "implementação faseada" padrão do processo de RFC porque a conclusão é não prosseguir (§6).         |
| **Autor**       | Franklin Baldo (proposta assistida)                                                                                                                                                                                                                      |
| **Criado em**   | 2026-07-08                                                                                                                                                                                                                                               |
| **Branch / PR** | `claude/blog-versioning-strategy-n1aw5d`                                                                                                                                                                                                                 |
| **Depende de**  | RFC 0003 (introduziu versões-pares) e RFC 0010 (Implemented, Fases 0–4 — modelo atual). Esta RFC avalia **substituir** o modelo de versões-pares da 0010 por arquivo único + histórico via git; §2 e §3.6 listam o que seria eliminado, §3 o que quebra. |
| **Afeta**       | `src/content/blog/**` (achataria `<slug>/v-*.*` → `<slug>.*`), `src/hronir/{posts,selection,commands,matches}.ts`, `src/content.config.ts`, `src/pages/blog/[slug]/v/[uuid].astro` (+ `pt/`), `.github/workflows/*` (fetch-depth), CLI do Hrönir         |

---

## 1. Contexto e parecer técnico

O dono observou que `src/content/blog/` está disperso — uma pasta por post, várias
versões `v-*.mdx` convivendo dentro dela — e propôs manter só a versão mais
recente por post, usando o histórico do git como registro das anteriores.

Antes de responder, este documento foi precedido de uma investigação dos dados
ao vivo e do histórico de decisão do próprio repo:

- **208** pastas de post, **504** arquivos `v-*` hoje (`find src/content/blog
-mindepth 1 -maxdepth 1 -type d` retorna 209, mas uma delas, `images/`, é
  assets de hero image, não um post).
- **144** pastas (69%) têm **2 ou mais** versões concorrentes ao mesmo tempo —
  20 com 4, 8 com 5, 6 com 6 (ex.: `f85fb538-6f59-4751-8629-da76665fc91e/`).
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
  **silenciosamente**, não porque não há backlog. Rodando na ordem certa
  (`hronir:select` de verdade, depois `prune --dry-run`): **54** versões
  elegíveis para poda agora, em ~30 diretórios (ex.:
  `postagem-inaugural-um-vislumbre-da-minha-mente` a -1.87★ n=5,
  `universal-threshold` a -1.63★ n=4). A dispersão observada é uma
  **mistura**: parte é competição genuinamente em aberto (ainda sem
  margem/duelos suficientes), parte é backlog real de perdedores já
  decididos que simplesmente nunca foram removidos.
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
arquivos) — são duas, não uma — e correções que resolvem o mesmo problema por
uma fração do custo, achadas durante este desenho.

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
mesmo commit).

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
é frontmatter/typo, não uma "versão" pelo critério de hoje) e materialize
cada um via `git show` no momento do build.

Isso torna o build **dependente de ter o histórico completo do git
disponível e rápido**. `check.yml` já usa `fetch-depth: 0` (build de CI
seguro). `hronir-autopilot.yml` usa checkout raso (padrão), mas hoje só faz
merge/gate — não roda `hronir` nem lê blob (§5) — então não é afetado por
este risco específico. Qualquer clone raso que vier a rodar comandos hronir,
porém — local, de agente, ou um workflow futuro — falharia em silêncio ao
resolver blobs antigos. É uma classe de fragilidade nova: um
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
Os limiares de `prune` (`PRUNE_MARGIN`, `PRUNE_MIN_DUELS`) encolhem junto
(nada para podar quando só existe um arquivo em repouso, §3.2), mas
`versions-pruned.json` não — §3.3 mostra que sobrevive como manifesto de
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
   arquivo solto órfão (§1) e este diretório sem versão publicável.
3. **Fase 2 — índice uuid→sha:** script que popula o índice inicial varrendo
   `git log --follow` de cada slug e hasheando cada blob com a mesma função
   de `getPostUuid`. **Não esboçado aqui:** manutenção contínua pós-backfill —
   §3.4 já observa que o índice precisa ser "mantido/estendido a cada mudança
   de conteúdo"; um commit que toque um post fora dos caminhos do CLI
   reescritos (edição direta, hotfix) dessincronizaria o índice do HEAD sem
   nada para detectar isso.
4. **Fase 3 — reescrever consumidores:** `computeVersionRatings`/
   `pickVersionDuel` (leitura de blob), `draft-worst`/`draft-commit` (irmão
   temporário + fold atômico, §3.2 — inclui decidir o fork `inline`/arquivo
   descartável do modo `path-only`, §3.1, e atualizar a documentação desse
   modo no `CLAUDE.md`), loader de `blogVersions` (materializa a partir do
   índice), `doctor` (checks de alcançabilidade).
5. **Fase 4 — CI:** `fetch-depth: 0` em todo workflow que roda comandos
   hronir ou build (hoje só `check.yml` tem isso). Sozinho não basta para o
   requisito de corretude do §3.3 ("merge commits, não squash") — precisaria
   também de proteção de branch ou de desabilitar squash-merge no GitHub.

Critério de aceite, no mesmo padrão de 0003/0010: snapshot de URLs idêntico
antes/depois, build e doctor verdes, golden tests dos duelos de versão
passando lendo blobs em vez de arquivos, **e** um teste de regressão de
subprocessos `git` por partida — sem ele, nada detecta o duelo reintroduzindo
o achado E3 que a 0010 já corrigiu (§3.1).

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
assentada... não pode bloquear o draft-worst para sempre" — comentário
correto para o bug que resolvia, a `-prev` fantasma da 0003/V4) — mas
continua existindo como arquivo até acumular o duelo extra **e** a margem
de 0.5★ que o `prune` exige. Como matches rodam a cada hora e `draft-worst`
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

**Correção 2 (Causa 2):** agendar `hronir:select && hronir:prune` (sem
`--dry-run`) periodicamente, para que perdedores resolvidos sejam de fato
removidos em vez de esperar alguém lembrar de rodar os comandos manualmente —
fecha o laço que a Correção 1 sozinha não fecha (ela para o empilhamento
novo; o agendamento limpa o que já empilhou). Esta parte não depende de
código novo — é imediata e independente do resto desta RFC: rodar os dois
comandos manualmente agora já removeria as 54 versões decididas. `hronir-heartbeat.yml`
existe mas seu `cron` está comentado/desabilitado hoje ("Heartbeat
desabilitado — Jules substituído por outro agente") e, mesmo ativo, nunca
invocou comandos hronir (era só refil do pool de sessões Jules) — não há
cadência pronta para anexar `prune`. Viável do mesmo jeito (reativar o cron
do heartbeat para essa finalidade, ou um novo workflow agendado pequeno), só
não é reaproveitar infraestrutura já rodando.

Isso ataca exatamente o incômodo original ("o blog dispersa demais") sem
tocar no mecanismo de torneio, na feature de permalink, ou introduzir git
como dependência de runtime para resolver conteúdo.

---

## 6. Recomendação

Não recomendo a substituição integral: o custo (duelos precisam materializar
blobs com disciplina de processamento em lote para não reabrir o achado E3 da
0010, e quebram o modo `path-only` que o `CLAUDE.md` recomenda justo para
agentes de sessão longa, §3.1; a janela de rascunho reintroduz o swap
não-atômico que a 0010 já corrigiu como achado V3 e não cobre múltiplos
desafiantes concorrentes — a norma hoje, §3.2; permalinks passam a depender
de histórico completo e de nunca squashar, sem mecanismo de CI que imponha
isso, §3.3; `doctor` ganha uma classe de falha nova, §3.5; uuid→sha não é
mais simples que o manifesto atual e precisa de manutenção contínua não
esboçada, §3.4) supera o ganho (eliminar `versions-selected.json` e a
recomputação sem histerese do `select()` — não `versions-pruned.json`, que
sobrevive, §3.3), principalmente porque o §5 entrega o mesmo alívio prático
por uma fração do risco — uma cláusula de guard e dois comandos já
existentes rodados na ordem certa, sem RFC nem migração.

Se a decisão for seguir com este documento mesmo assim, ele é o ponto de
partida para fases reais (com testes de aceite e PR incremental, no padrão
0003/0010/0014). Se a escolha for o §5, é uma PR pequena e dispensa RFC.

---

## Histórico de revisões

- **r0** (2026-07-08): rascunho inicial. Motivado por pergunta do dono sobre
  dispersão de arquivos de versão em `src/content/blog/`; parecer técnico
  contrário registrado em conversa (§1); dono pediu o desenho de qualquer
  forma. Levantamento de dados ao vivo (208 pastas, 504 arquivos, 144 com
  2+ versões, 0 elegíveis para poda) e diagnóstico de causa raiz do
  empilhamento (§5, gap entre `SELECT_MIN_DUELS` e `PRUNE_MIN_DUELS`) feitos
  nesta mesma sessão.
- **r1** (2026-07-08): revisão adversarial (5 agentes de fact-check +
  consistência interna) achou e corrigiu: contagem de pastas inflada por
  `images/` (209→208, 145→144 com 2+ versões, com nota sobre dois slugs com
  arquivo órfão solto na raiz); referência quebrada a um inexistente "§7";
  off-by-one "§6" → "§5"; contradição entre §2/§3.6 (alegava eliminar
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
  desafiantes concorrentes não resolvidos; fork do `path-only` sem fase
  atribuída; manutenção contínua do índice uuid→sha não esboçada;
  "não-squash" sem enforcement de CI; critério de aceite sem teste de
  regressão de subprocessos; custo do `path-only` ausente do §6); três
  palavras em inglês soltas na prosa (`housekeeping`, `batching`, `tally`)
  traduzidas. Sem mudança na recomendação — o achado dos 54 reforça a
  Correção 2 do §5, não o desenho git-only.
