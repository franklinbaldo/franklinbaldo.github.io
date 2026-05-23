# Hrönir

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

A solução é **i18n completa, sem assumir bilinguismo**: `edit-worst` e `edit-commit` operam sobre todas as traduções existentes para uma `translationKey`, qualquer número de idiomas.

## Estrutura

```
.routines/hronir/
  rates/                              # matches gerados pelo fluxo atual
    <run_id>_<keyA>_x_<keyB>.md
  critiques/<key>.md                  # crítica em prosa (registro)
  <run_id>_..._x_....md               # matches legados (continuam suportados)
hronir_session.json                   # estado da rodada ativa (commitado)
scripts/hronir/
  index.js                            # CLI entrypoint
  lib/                                # comandos
  skills/                             # skills versionadas (blog / essay)
  perspectives/                       # personas de leitor sorteadas por match
  README.md                           # este arquivo
```

Versões anteriores de cada post **não** são snapshotadas no repo — vivem no git. `edit-commit` grava `previousVersion: { uuid, url, timestamp, msg }` no frontmatter, onde `url` é um permalink GitHub (`blob/<sha>/<path>`) para o arquivo no commit imediatamente antes da edição. Para reconstruir a linhagem completa, abra o `url`: a versão anterior tem seu próprio `previousVersion`, e assim por diante até a primeira versão.

`hronir_session.json` é tracked de propósito: ele sinaliza que uma rodada está em andamento (e `doctor` reclama quando existe), evitando commits parciais.

## Comandos

Todos via npm scripts na raiz:

| Comando                                                                                                              | Função                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run hronir:init -- --agent-id <id> [opções]`                                                                    | Cria a sessão, vai direto pro primeiro match. `--agent-id <id>` é **obrigatório** (sem default). Opções: `--matches N` (default 10), `--eval-lang <lang>` (default `pt`), `--min-appearances N`, `--skip-edit`, `--skip-rating`                                                                                                        |
| `npm run hronir:continue`                                                                                            | Avança o estado da sessão: imprime a **perspectiva sorteada** + post A; depois imprime post B; depois espera decisão                                                                                                                                                                                                                   |
| `npm run hronir:decide -- --rate-a <1.00-5.00> --rate-b <1.00-5.00> --review-a "..." --review-b "..." --clash "..."` | Registra a decisão. Cada `--rate-*` é número 1.00–5.00 (até duas decimais, empate proibido). Cada `--review-*` e o `--clash` têm piso de 100 palavras. Vencedor é derivado: quem tem mais estrelas. Agente, perspectiva e idioma são fixos pela sessão (vêm de `init` / sorteio em `continue`). Devolve a sessão para `ready_for_next` |
| `npm run hronir:ranking`                                                                                             | Score acumulado de todos os matches preenchidos                                                                                                                                                                                                                                                                                        |
| `npm run hronir:worst`                                                                                               | Imprime translationKey do pior ranqueado                                                                                                                                                                                                                                                                                               |
| `npm run hronir:edit-worst`                                                                                          | Pior elegível + top 3 + defesas + crítica acumulada. Captura `git HEAD` na sessão (URL do GitHub pra versão prestes a ser substituída), injeta `replacedVersion` (marker transiente) no frontmatter dos posts, marca a sessão como `need_edit`                                                                                         |
| `npm run hronir:edit-commit -- --msg "..."`                                                                          | Valida que cada tradução foi efetivamente alterada (UUIDv5 mudou), grava `previousVersion: { uuid, url, timestamp, msg }` no frontmatter (substitui qualquer `replacedVersion`/`editHistory` legados), fecha a sessão                                                                                                                  |
| `npm run hronir:end -- [--skip-edit\|--force]`                                                                       | Encerra a rodada. Recusa se há matches pendentes ou edição pendente, a menos que `--force`                                                                                                                                                                                                                                             |
| `npm run hronir:migrate -- [--dry-run]`                                                                              | Normaliza matches legados (`slug:` → `key:`, renomeia arquivo)                                                                                                                                                                                                                                                                         |
| `npm run hronir:doctor`                                                                                              | Verifica inconsistências. Sai com código 1 se encontrar — usado no CI                                                                                                                                                                                                                                                                  |

Cada comando termina com uma linha `NEXT STEP:` apontando o próximo passo, exceto quando o fluxo termina.

## Fluxo

```
init
 └─> continue          # gera match 1, imprime post A
     └─> continue      # imprime post B
         └─> decide    # registra decisão
             └─> continue  # gera match 2, imprime post A
                 ...
                 └─> continue  # após N matches, sessão entra em 'need_edit'
                     └─> edit-worst   # mostra pior post + contexto, captura HEAD, marca posts
                         └─> [edição manual em todas as traduções]
                             └─> edit-commit --msg "..."  # grava previousVersion
```

A máquina de estados está em `hronir_session.json`: `ready_for_next → reading_a → reading_b → deciding → ready_for_next → … → need_edit → (sessão fechada)`.

### Atalhos

- `--skip-rating` em `init`: pula matches e vai direto pra `edit-worst` (útil quando só quer editar o pior acumulado).
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

No schema `stars-v1` o `decide` valida coercivamente: `--clash`, `--review-a` e `--review-b` precisam ter pelo menos **100 palavras** cada. O `doctor` repete a checagem nos arquivos persistidos. Resenha curta ou genérica perde a função do sistema (`edit-worst` lê e cita essas resenhas; pouca substância dá pouco sinal). Meta natural: 200 palavras por campo.

## Perspectivas (leitores do blog)

Cada match no schema `stars-v1` é avaliado a partir de uma **perspectiva de leitor** sorteada aleatoriamente no `continue` (estado `ready_for_next` → `reading_a`). A perspectiva é um arquivo em `scripts/hronir/perspectives/<id>.md` com frontmatter (`id`, `name`, `summary`) e um corpo de instruções dizendo o que premiar, o que penalizar, e como escrever a resenha e o confronto a partir daquela ótica.

As 8 perspectivas atuais derivam das categorias de leitores descritas em `skills/franklin-blog/SKILL.md`:

| id                        | leitor                                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------------------------- |
| `long-form-rationalist`   | Reader de Scott Alexander, Robin Hanson, Zvi, Gwern. Testa calibração epistêmica.                    |
| `lateral-essayist`        | Reader de Didion, Calvino, Pessoa, Sebald. Lê para estrutura-como-movimento.                         |
| `weird-clarity`           | Reader de Borges, Wittgenstein, Ted Chiang. Quer o frio de uma sentença clara que resiste paráfrase. |
| `internet-native`         | Viewer de Hbomberguy, Folding Ideas. Tolera digressão se o ritmo a paga.                             |
| `skeptical-specialist`    | Leitor adversarial bem-informado (do `franklin-essay`). Caça a alegação mais fraca.                  |
| `curious-outsider`        | Leitor inteligente sem contexto do tópico. Testa generosidade pedagógica.                            |
| `returning-reader`        | Leitor habitual do blog. Conhece os tiques; vigia auto-repetição entre posts recentes.               |
| `comedy-carries-argument` | Reader de Lem, Monterroso, Nelson Rodrigues. Testa se a piada é alavanca ou decoração.               |

A perspectiva é sorteada por match no `continue` e **imposta** ao avaliador via banner antes da decisão — não há flag para sobrescrever. As resenhas (`review_a`, `review_b`) e o confronto (`clash`) devem ser escritos **a partir da perspectiva sorteada**, não em registro neutro.

## Threshold de volume

`edit-worst` só considera posts com `appearances >= MIN_APPEARANCES` (default 3, override via `--min-appearances`). Se nenhum post elegível, imprime mensagem informativa e termina com exit 0 (não é erro — apenas sinal de que a rodada ainda não acumulou volume suficiente).

## Skills

Em `scripts/hronir/skills/`:

- `franklin-blog/SKILL.md` — para posts informais, ensaísticos, voz pessoal
- `franklin-essay/SKILL.md` — para posts argumentativo-formais (paper-shaped, defesa de tese, citação acadêmica densa)

O `edit-worst` instrui a leitura de **ambas** antes de editar e a escolher a aplicável (default: blog). Atenção especial à seção _Protection against tightening_ e ao _Voice-fidelity pass_ — o reflexo do LLM de tighten/smooth/fortify é o failure mode aqui.

## Ranking

Ranking via **OpenSkill** (modelo Weng-Lin, atualização bayesiana online de Plackett-Luce). Cada par é tratado como uma partida 1v1; vencedor sobe `mu` e desce `sigma`, perdedor o oposto. Três eixos saem da computação:

- **`mu`** — estimativa pontual da "qualidade" do post.
- **`sigma`** — incerteza sobre `mu`. Não diz que o post é ruim — diz que ainda não sabemos.
- **`ordinal = mu − 3·sigma`** — score conservador usado para a ordem global. Um post novo com mu alto fica atrás de um post estabelecido com mu um pouco menor.

A ordem da tabela é por `ordinal` descendente, tie-break alfabético por `key`. `worst` retorna o post com menor `ordinal` entre os elegíveis (`appearances >= MIN_APPEARANCES`).

### Active sampling

Cada chamada de `continue` (não `init` em bloco) gera um match. Para cada par possível, calcula:

```
score = -|predictWin(a, b) - 0.5| + sigma_a + sigma_b + stale_bonus(a) + stale_bonus(b)
```

- `predictWin` próximo de 0.5 → resultado mais incerto → mais informação.
- `sigma_a + sigma_b` → preferir pares com incerteza ainda alta.
- `stale_bonus` → `+3.0` se o post foi editado no git **depois** do match mais recente em que entrou; `0` caso contrário.

Ordena pares por score descendente (com jitter pra desempate no cold start) e pega o topo, evitando posts já usados no run atual.

### Por que MIN_APPEARANCES ainda importa com OpenSkill

OpenSkill já carrega incerteza em `sigma`. Mas:

1. **Sinal de defesa.** `edit-worst` consome as defesas como contexto. Um post com 1 derrota dá só 1 defesa pra trabalhar.
2. **Estabilidade.** Os 3 primeiros matches de um post podem oscilar muito. `MIN_APPEARANCES=3` evita editar com base num único par sortudo.

## Crítica do pior (registro)

`.routines/hronir/critiques/<key>.md` continua sendo um lugar válido pra registrar uma crítica em prosa do pior post, mas não é gerada nem requerida pelo fluxo automático — o que dirige a edição são as **skills** e as defesas/críticas dos matches.

## Migração

`migrate` é idempotente: lê cada match, resolve `post_a.path` e `post_b.path` para `translationKey` real, reescreve `slug:` como `key:`, e renomeia o arquivo se o nome não bate. `doctor` valida o resultado.
