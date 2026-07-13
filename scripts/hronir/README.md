# Hrönir

> **⚠ RFC 0010 (implementada) tornou as versões pares.** Cada post vive em
> `src/content/blog/<slug>/` como um conjunto de arquivos `v-<timestamp>.md`
> **sem filename privilegiado** — a versão publicada é a que
> `src/generated/versions-selected.json` aponta, recomputada por
> `hronir:select` a partir do ranking (com histerese: margem ≥0.3★, n≥2
> duelos). Não existe mais `promote` nem swap de arquivos; a edição
> (`draft-worst`) cria um `v-*` novo que convive e **compete** com a
> selecionada nos duelos de versão do sampling. Seções abaixo
> que descrevem edição-no-lugar, `index.md` ou `previousVersion` (linked list
> via git) refletem fluxos **legados**; a fonte canônica é
> `docs/rfcs/0010-*.md` (que substitui o mecanismo de promoção/poda da 0003).
> A RFC 0016 removeu os aliases `edit-worst`/`edit-commit`, o comando `worst`,
> as first impressions e o modo de conteúdo inline.

Sistema de avaliação par-a-par de posts do blog. Cada rodada gera N partidas (default 10) por **active sampling**. Para cada partida o Hrönir sorteia uma **perspectiva de leitor** (ver `perspectives/`) e o avaliador, identificando-se obrigatoriamente, atribui estrelas (1.00–5.00) a cada post junto com uma resenha de cada e um confronto. O vencedor é derivado mecanicamente: quem tem mais estrelas. Ao final, o post pior ranqueado recebe uma edição — registrada como `previousVersion` no próprio frontmatter do post (linked list de uma aresta apontando para a versão anterior no GitHub).

> **Este CLI é não-interativo por design** (rodado por Claude Code).
> Não use `readline`, `inquirer`, `prompts`, leitura de `process.stdin`,
> nem confirmações em tela do tipo `[y/N]`. Toda saída vai direto pro
> stdout via `console.log`, sem paginação. O default de qualquer ação
> destrutiva ou que sobrescreve é "prossiga sem perguntar". Se algum
> subcomando precisar de confirmação destrutiva, implemente com flag
> explícita (ex: `--force`), não com prompt interativo.
>
> Comandos não devem mudar de comportamento baseado em `process.stdout.isTTY`.

## Identidade canônica

`translationKey` (do frontmatter do post) é a identidade. Todas as traduções de um mesmo ensaio compartilham `translationKey` e consolidam wins/appearances no ranking. Match files referenciam posts por `key` (= translationKey), `path` (= caminho do .md) e `version` (= UUIDv5 derivado do conteúdo).

A solução é **i18n completa, sem assumir bilinguismo**: `draft-worst` e `draft-commit` operam sobre todas as traduções existentes para uma `translationKey`, qualquer número de idiomas.

## Estrutura

```
.routines/hronir/
  rates/                              # matches gerados pelo fluxo atual
    <run_id>_<keyA>_x_<keyB>.md
  critiques/<key>.md                  # crítica em prosa (registro)
  <run_id>_..._x_....md               # matches legados (continuam suportados)
hronir_session.json                   # estado da rodada ativa (commitado)
src/hronir/                           # módulos core (commands, ranking, matches, posts, selection)
  __tests__/                          # testes unitários (node:test)
src/generated/
  versions-selected.json              # seleção de versões (escrito só por hronir:select)
  versions-pruned.json                # registro de podas (redirects de permalinks)
scripts/hronir/
  index.js                            # CLI entrypoint
  skills/                             # skills versionadas (blog / essay)
  perspectives/                       # personas de leitor sorteadas por match
  README.md                           # este arquivo
```

Versões de cada post **convivem no repo** como arquivos `v-<timestamp>.md` irmãos dentro de `src/content/blog/<slug>/` (RFC 0010). Cada versão tem um UUID de conteúdo (UUIDv5 sobre corpo + frontmatter relevante) e é endereçável publicamente em `/blog/<slug>/v/<uuid>` (noindex, canonical → versão viva). Versões perdedoras elegíveis são removidas por `hronir:prune`, que registra o par `slug@uuid` em `versions-pruned.json` para o build emitir redirects.

`hronir_session.json` é tracked de propósito: ele sinaliza que uma rodada está em andamento (e `doctor` reclama quando existe), evitando commits parciais.

## Comandos

Todos via npm scripts na raiz:

| Comando                                                                                                                                 | Função                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npx hronir generate-match [opções de init]`                                                                                            | **Fluxo canônico (RFC 0016).** Inicia uma sessão de 1 match (skip-edit, agent-id adiado) e imprime tudo: perspectiva, caminhos dos dois posts, glifo + mood inicial e o prompt de decisão. Se já há sessão em andamento, só a avança/reexibe                                                                                                          |
| `npx hronir submit-eval --agent-id <id> <flags de decide>`                                                                              | `decide` + auto-fechamento da rodada completa. `--agent-id` é obrigatório aqui (a geração do match é agnóstica de identidade)                                                                                                                                                                                                                         |
| `npm run hronir:init -- --agent-id <id> [opções]`                                                                                       | Sessão multi-match (uso humano direto). `--agent-id <id>` é **obrigatório** (sem default). Opções: `--matches N` (default 10), `--eval-lang <lang>` (default `pt`), `--review-lang <lang>`, `--objective coverage\|refine-top\|hunt-worst`, `--min-appearances N`, `--skip-edit`, `--skip-rating`                                                     |
| `npm run hronir:continue`                                                                                                               | Gera o próximo match e imprime, de uma vez: perspectiva, post A, post B e o prompt de decisão (com glifo e mood). Em estado `deciding`, reimprime o prompt                                                                                                                                                                                            |
| `npm run hronir:decide -- --after-mood "..." --rate-a <1.00-5.00> --rate-b <1.00-5.00> --review-a "..." --review-b "..." --clash "..."` | Registra a decisão. `--after-mood` é a **primeira flag** (ver "Decidindo o mood"). Cada `--rate-*` é número 1.00–5.00 (até duas decimais, empate proibido). Cada `--review-*` e o `--clash` têm piso de 100 palavras. Vencedor é derivado: quem tem mais estrelas. Perspectiva e idioma são fixos pela sessão. Devolve a sessão para `ready_for_next` |
| `npm run hronir:ranking`                                                                                                                | Score acumulado de todos os matches preenchidos                                                                                                                                                                                                                                                                                                       |
| `npm run hronir:diagnose`                                                                                                               | **Leitura pura.** Qualidade de-confundida (post vs viés de avaliador/perspectiva, ridge-LSQ), `gap` cru−de-confundido, vieses `α`/`π`, líder por perspectiva. Não muda estado. Ver RFC 0002                                                                                                                                                           |
| `npm run hronir:draft-worst` / `hronir:draft-commit -- --msg "..."`                                                                     | Fluxo de edição (RFC 0003/0010): `draft-worst` cria `v-<ts>.md` novo por tradução (selecionada intocada); `draft-commit` valida que o UUID mudou e registra o competidor                                                                                                                                                                              |
| `npm run hronir:select [-- --dry-run]`                                                                                                  | RFC 0010 (amendment 2026-07-01): recomputa `versions-selected.json` a partir do ranking de versões, sem histerese. Único escritor do manifesto; roda também no `prebuild`                                                                                                                                                                             |
| `npm run hronir:prune [-- --dry-run]`                                                                                                   | Remove versões perdedoras elegíveis (≥0.5★ abaixo da selecionada, n≥3) e registra `slug@uuid` em `versions-pruned.json` (permalinks viram redirects)                                                                                                                                                                                                  |
| `npm run hronir:end -- [--skip-edit\|--force]`                                                                                          | Encerra a rodada. Recusa se há matches pendentes ou edição pendente, a menos que `--force`                                                                                                                                                                                                                                                            |
| `npm run hronir:migrate -- [--dry-run]`                                                                                                 | Normaliza matches legados (`slug:` → `key:`, renomeia arquivo)                                                                                                                                                                                                                                                                                        |
| `npm run hronir:doctor`                                                                                                                 | Verifica inconsistências. Sai com código 1 se encontrar — usado no CI                                                                                                                                                                                                                                                                                 |

Cada comando termina com uma linha `NEXT STEP:` apontando o próximo passo, exceto quando o fluxo termina.

## Fluxo

Canônico (one-shot, RFC 0016) — um match por sessão, sem estado a gerenciar:

```
generate-match   # imprime perspectiva, caminhos de A e B, glifo + mood, prompt
 └─> [ler os dois arquivos]
     └─> submit-eval --agent-id ... --after-mood ... --rate-a ... --rate-b ... --review-a ... --review-b ... --clash ...
         # grava o rate file e fecha a sessão — repita generate-match para o próximo match
```

Sessão multi-match (uso humano direto):

```
init
 └─> continue      # gera match 1: perspectiva + posts A e B + prompt de decisão
     └─> decide    # registra decisão
         └─> continue  # gera match 2 ...
             ...
             └─> continue  # após N matches, sessão entra em 'need_edit' (sem --skip-edit)
                 └─> draft-worst  # cria <slug>/v-<ts>.md (cópia da selecionada, intocada)
                     └─> [edição manual dos RASCUNHOS em todas as traduções]
                         └─> draft-commit --msg "..."  # valida UUID novo, registra o competidor
                             └─> [duelos de versão no sampling decidem]
                                 └─> select  # recomputa versions-selected.json
```

A máquina de estados está em `hronir_session.json`: `ready_for_next → deciding → ready_for_next → … → need_edit → (sessão fechada)`.

### Atalhos

- `--skip-rating` em `init`: pula matches e vai direto pra `draft-worst` (útil quando só quer editar o pior acumulado).
- `--skip-edit` em `init` ou `end`: encerra após os matches, sem fase de edição.
- `--force` em `end`: descarta a sessão mesmo no meio da rodada.

## Match file

```yaml
---
run_id: 2026-05-22T09-53-19
run_at: 2026-05-22T09:53:19Z
match_index: 1
post_a:
  key: third-half-fourth-wall
  path: src/content/blog/2026-05-01-the-third-half-and-the-fourth-wall.md
  version: 2c8f1a3b-...                # UUIDv5 do corpo
post_b:
  key: rosencrantz-coin
  path: src/content/blog/rosencrantz-coin.md
  version: 9b14e7d2-...
winner: a                                # derivado: a se rate_a > rate_b, senão b
agent_id: claude-opus-4-7                # quem decidiu (obrigatório, sem default)
eval_lang: pt                            # idioma em que a avaliação foi feita
prompt_version: stars-v1                 # marcador do schema atual
season: 1
override: null
perspective_id: returning-reader         # persona de leitor aplicada nesta partida
rate_a: 4.25                             # número 1.00–5.00 (até duas decimais, empate proibido)
rate_b: 3.75
clash: "..."                             # ≥100 palavras, confronto sob a perspectiva sorteada
review_a: "..."                          # ≥100 palavras, resenha do post A
review_b: "..."                          # ≥100 palavras, resenha do post B
---
```

`doctor` valida o schema `stars-v1` (rates, 100 palavras, perspective, derived-winner consistency). Matches anteriores (`prompt_version` ausente ou `passion-v1`) seguem aceitos como estão — o piso de 100 palavras e a perspectiva são exigidos apenas a partir de `stars-v1`. Campos legados (`model`, `winner_defense`, `loser_critique`, body livre) continuam aceitos.

## previousVersion (linked list)

`edit-commit` grava no frontmatter de cada tradução uma única aresta apontando para a versão imediatamente anterior:

```yaml
previousVersion:
  uuid: "22c3fbae-..." # UUIDv5 do conteúdo ANTES da edição
  url: "https://github.com/franklinbaldo/franklinbaldo.github.io/blob/<sha>/<path>"
  timestamp: "2026-05-18T17:19:55.965Z"
  msg: "Reorganizei a estrutura..."
```

O `sha` é o `git HEAD` capturado no `edit-worst` — i.e. o commit imediatamente antes da edição entrar. A versão anterior, ao abrir o link, carrega seu próprio `previousVersion` (e assim por diante), formando uma linked list reconstruída via git em vez de duplicada no repo.

Cooldown de `edit-worst` (evita reeditar o mesmo post duas rodadas seguidas) é derivado de `previousVersion.timestamp`. Posts legados que ainda usam o antigo `editHistory[]` continuam respeitados como fallback; o primeiro `edit-commit` neles substitui o campo legado por `previousVersion`.

## Piso de palavras (stars-v1)

No schema `stars-v1` o `decide` valida coercivamente: `--clash`, `--review-a` e `--review-b` precisam ter pelo menos **100 palavras** cada. O `doctor` repete a checagem nos arquivos persistidos. Resenha curta ou genérica perde a função do sistema (`draft-worst` lê e cita essas resenhas; pouca substância dá pouco sinal). Meta natural: 200 palavras por campo.

Nas resenhas e no confronto, refira-se a cada post pelo seu **slug** (o `key`/`translationKey`, mostrado no cabeçalho de cada post), não por "Post A" / "Post B". Os relatos são lidos depois fora do contexto efêmero do match (em `draft-worst` e no histórico), onde "A" e "B" não significam nada.

Os campos `review_a`, `review_b` e `clash` são **Markdown** e renderizam como tal — ênfase, listas, blockquotes (para citar trechos do post) e emojis são bem-vindos quando servem à leitura. Formatação a serviço do conteúdo, não decoração.

Além de pontuar, o avaliador pode (e deve, quando tiver) **sugerir melhorias concretas** ao post — o que cortar, expandir, reordenar — e **apontar conteúdo relevante** que veio à mente sobre o assunto: uma referência, um autor, um exemplo, um link. Essas sugestões alimentam a fase `draft-worst`; quanto mais específicas, mais úteis.

## Decidindo o mood (primeira coisa)

`--after-mood` é a **primeira flag** do `decide`. Antes de escrever qualquer
coisa, o `generate-match` (reimpresso pelo `continue`) mostra ao avaliador um **glifo Unicode
aleatório** que o Hronir sorteou por ele (com o codepoint `U+XXXX`), junto do
**mood inicial** do banner. O glifo é lido _subjetivamente_ — não há tabela de
conversão; a forma, o traço, o que aquele caractere evoca, o avaliador decide
como pesa. Essa leitura, somada ao mood inicial e ao que os dois posts (e o
confronto entre eles) fizeram o avaliador sentir, produz o estado interno de
agora — que então **colore o tom** das resenhas e do clash. Por isso o mood é
decidido primeiro.

O glifo sorteado vem de faixas Unicode visíveis e atribuídas (latim, grego,
cirílico, setas, operadores, símbolos, dingbats, hiragana, katakana, CJK) e
fica registrado no frontmatter do match como `mood_glyph`, ao lado de
`evaluator_mood` (inicial) e `evaluator_mood_after` (resultante).

## Perspectivas (leitores do blog)

Cada match no schema `stars-v1` é avaliado a partir de uma **perspectiva de leitor** sorteada aleatoriamente ao gerar o match (`generate-match`/`continue`). A perspectiva é um arquivo em `scripts/hronir/perspectives/<id>.md` com frontmatter (`id`, `name`, `summary`) e um corpo de instruções dizendo o que premiar, o que penalizar, e como escrever a resenha e o confronto a partir daquela ótica.

As perspectivas atuais derivam das categorias de leitores descritas em `skills/franklin-blog/SKILL.md`:

| id                        | leitor                                                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `long-form-rationalist`   | Reader de Scott Alexander, Robin Hanson, Zvi, Gwern. Testa calibração epistêmica.                                                    |
| `lateral-essayist`        | Reader de Didion, Calvino, Pessoa, Sebald. Lê para estrutura-como-movimento.                                                         |
| `weird-clarity`           | Reader de Borges, Wittgenstein, Ted Chiang. Quer o frio de uma sentença clara que resiste paráfrase.                                 |
| `internet-native`         | Viewer de Hbomberguy, Folding Ideas. Tolera digressão se o ritmo a paga.                                                             |
| `skeptical-specialist`    | Leitor adversarial bem-informado (do `franklin-essay`). Caça a alegação mais fraca.                                                  |
| `curious-outsider`        | Leitor inteligente sem contexto do tópico. Testa generosidade pedagógica.                                                            |
| `returning-reader`        | Leitor habitual do blog. Conhece os tiques; vigia auto-repetição entre posts recentes.                                               |
| `comedy-carries-argument` | Reader de Lem, Monterroso, Nelson Rodrigues. Testa se a piada é alavanca ou decoração.                                               |
| `craft-listener`          | Ouvinte técnico (letra/música). Testa se a forma carrega o conteúdo.                                                                 |
| `felt-not-explained`      | Leitor que testa se o post mostra ou apenas explica o que deveria ser sentido.                                                       |
| `lyric-as-poem`           | Leitor de letras como poesia. Testa se a linguagem resiste à paráfrase.                                                              |
| `applied-thinker`         | Reader de Paul Graham, Derek Sivers, Tyler Cowen. Testa se o post muda o que você faz na semana seguinte.                            |
| `fact-checker`            | Verifica datas, números, citações e causalidade. Testa precisão factual, não qualidade do argumento.                                 |
| `meme-sommelier`          | Leitor fluente em formato/cultura de internet. Testa se a referência é fresca ou requentada, e se sobrevive a um print sem contexto. |

A perspectiva é sorteada por match no `continue` e **imposta** ao avaliador via banner antes da decisão — não há flag para sobrescrever. As resenhas (`review_a`, `review_b`) e o confronto (`clash`) devem ser escritos **a partir da perspectiva sorteada**, não em registro neutro.

## Threshold de volume

`draft-worst` só considera posts com `appearances >= MIN_APPEARANCES` (default 3, override via `--min-appearances`). Se nenhum post elegível, imprime mensagem informativa e termina com exit 0 (não é erro — apenas sinal de que a rodada ainda não acumulou volume suficiente).

## Skills

Em `scripts/hronir/skills/`:

- `franklin-blog/SKILL.md` — para posts informais, ensaísticos, voz pessoal
- `franklin-essay/SKILL.md` — para posts argumentativo-formais (paper-shaped, defesa de tese, citação acadêmica densa)

O `draft-worst` instrui a leitura de **ambas** antes de editar e a escolher a aplicável (default: blog). Atenção especial à seção _Protection against tightening_ e ao _Voice-fidelity pass_ — o reflexo do LLM de tighten/smooth/fortify é o failure mode aqui.

## Ranking

Ranking via **OpenSkill** (modelo Weng-Lin, atualização bayesiana online de Plackett-Luce, `RANKING_MODEL_VERSION=3`). Cada par é tratado como uma partida 1v1; os deltas de `mu` **e `sigma`** são escalados pela margem de estrelas `|rate_a − rate_b| / 4` — blowouts movem o ranking mais que foto-finish, e partidas apertadas preservam mais incerteza proporcionalmente (RFC 0009).

- **`mu`** — estimativa pontual da "qualidade" do post.
- **`sigma`** — incerteza sobre `mu`. Não diz que o post é ruim — diz que ainda não sabemos.
- **`ordinal = mu − 3·sigma`** — score conservador usado para a ordem global. Um post novo com mu alto fica atrás de um post estabelecido com mu um pouco menor.

A saída de `hronir:ranking` é TSV com as colunas:

```
rank  key  ordinal  mu  sigma  W/N  stars  n  div
```

- **`stars`** — EWMA das estrelas recebidas pelo post (α=0.3; avaliações recentes dominam). Trilha de qualidade **absoluta**, independente do eixo relativo do OpenSkill. **Reset-on-edit:** quando `post_a.version`/`post_b.version` muda entre matches (post editado), o EWMA reinicia — notas pré-edição são stale por definição.
- **`n`** — nº de aparições com estrelas (schema `stars-v1`), contadas a partir da última edição.
- **`div`** — divergência percentil `p_ord − p_star` entre os posts com `n ≥ MIN_APPEARANCES`. Positivo = "freguesia fraca" (sobe no relativo além do que as estrelas justificam). Negativo = "subnotado" (melhor em absoluto do que o chaveamento sugere). `-` quando a confiança é baixa.

A ordem da tabela é por `ordinal` descendente, tie-break alfabético por `key`. O pior elegível (menor `ordinal` com `appearances >= MIN_APPEARANCES`) é o alvo de `draft-worst`.

### Active sampling

Cada match é gerado sob demanda (`generate-match`/`continue`), não em bloco no `init`. Para cada par possível, calcula:

```
score = -|predictWin(a, b) - 0.5| + sigma_a + sigma_b + stale_bonus(a) + stale_bonus(b) + objective_bonus(a, b)
```

- `predictWin` próximo de 0.5 → resultado mais incerto → mais informação.
- `sigma_a + sigma_b` → preferir pares com incerteza ainda alta.
- `stale_bonus` → `+3.0` se o post foi **editado** depois do match mais recente em que entrou; `0` caso contrário. A âncora de edição é `previousVersion.timestamp` (gravado por `edit-commit`); para posts que nunca passaram por `edit-commit`, cai no tempo do último commit git do arquivo (`gitMtime`).
- `objective_bonus` → **opt-in, default 0**. Com `HRONIR_OBJECTIVE=refine-top` prefere pares de nível alto (estrelas); com `hunt-worst`, de nível baixo. Peso pequeno (`0.15`): inclina empates sem dominar os termos de informação.

Ordena pares por score descendente (com jitter pra desempate no cold start) e pega o topo, evitando posts já usados no run atual.

### Diagnose — qualidade de-confundida (RFC 0002)

`npm run hronir:diagnose` é um comando de **leitura pura** (não muda estado) que separa a qualidade do post do viés do avaliador e do efeito da perspectiva, via mínimos quadrados com ridge:

```
rate = μ + q[post] + α[agent] + π[perspective] + ε
```

A estrela crua é confundida: um post pode ter média alta só porque pegou um avaliador generoso ou uma perspectiva tolerante (o sistema **sorteia perspectivas e injeta humor de propósito**). O modelo torna esses efeitos separáveis. Imprime:

- **qualidade de-confundida** por post (`deconf = μ + q`), com `gap = deconf − cru`: `gap` positivo = **subnotado** (pegou plateia dura), negativo = estrela crua inflada;
- **viés de avaliador** (`α`) e **viés de perspectiva** (`π`) — ex.: `skeptical-specialist`/`applied-thinker` são estruturalmente severos, `internet-native`/`curious-outsider` generosos;
- **líder por perspectiva** (EWMA de estrelas dentro de cada perspectiva).

O `ranking` continua intocado e retrocompatível; `diagnose` é um diagnóstico paralelo pra **calibração**, não pra ordenar edição. `DECONFOUND_RIDGE` (λ, default 1.0) é a regularização — ajustável.

### Por que MIN_APPEARANCES ainda importa com OpenSkill

OpenSkill já carrega incerteza em `sigma`. Mas:

1. **Sinal de defesa.** `draft-worst` consome as defesas como contexto. Um post com 1 derrota dá só 1 defesa pra trabalhar.
2. **Estabilidade.** Os 3 primeiros matches de um post podem oscilar muito. `MIN_APPEARANCES=3` evita editar com base num único par sortudo.

## Crítica do pior (registro)

`.routines/hronir/critiques/<key>.md` continua sendo um lugar válido pra registrar uma crítica em prosa do pior post, mas não é gerada nem requerida pelo fluxo automático — o que dirige a edição são as **skills** e as defesas/críticas dos matches.

## Migração

`migrate` é idempotente: lê cada match, resolve `post_a.path` e `post_b.path` para `translationKey` real, reescreve `slug:` como `key:`, e renomeia o arquivo se o nome não bate. `doctor` valida o resultado.
