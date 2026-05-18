# Hrönir

Sistema de avaliação par-a-par de posts do blog. Cada rodada gera N partidas (default 10) por **active sampling**, um avaliador (humano ou modelo) escolhe um vencedor por partida defendendo apaixonadamente, e ao final o post pior ranqueado recebe uma edição — registrada como `editHistory[]` no próprio frontmatter do post.

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
  edit-history/<key>/<lang>/<uuid>.md # snapshot do post antes da edição
  critiques/<key>.md                  # crítica em prosa (registro)
  <run_id>_..._x_....md               # matches legados (continuam suportados)
hronir_session.json                   # estado da rodada ativa (commitado)
scripts/hronir/
  index.js                            # CLI entrypoint
  lib/                                # comandos
  skills/                             # skills versionadas (blog / essay)
  README.md                           # este arquivo
```

`hronir_session.json` é tracked de propósito: ele sinaliza que uma rodada está em andamento (e `doctor` reclama quando existe), evitando commits parciais.

## Comandos

Todos via npm scripts na raiz:

| Comando                                                                                                | Função                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run hronir:init -- [opções]`                                                                      | Cria a sessão, vai direto pro primeiro match. Opções: `--matches N` (default 10), `--agent-id <id>` (default `human`), `--eval-lang <lang>` (default `pt`), `--min-appearances N`, `--skip-edit`, `--skip-rating` |
| `npm run hronir:continue`                                                                              | Avança o estado da sessão: gera próximo match, imprime post A, depois post B, depois espera decisão                                                                                                               |
| `npm run hronir:decide -- --winner <a\|b> --clash "..." --winner-defense "..." --loser-critique "..."` | Registra a decisão do match atual e devolve a sessão para `ready_for_next`                                                                                                                                        |
| `npm run hronir:ranking`                                                                               | Score acumulado de todos os matches preenchidos                                                                                                                                                                   |
| `npm run hronir:worst`                                                                                 | Imprime translationKey do pior ranqueado                                                                                                                                                                          |
| `npm run hronir:edit-worst`                                                                            | Pior elegível + top 3 + defesas + crítica acumulada. Faz snapshot de cada tradução em `edit-history/`, injeta `replacedVersion` no frontmatter dos posts, marca a sessão como `need_edit`                         |
| `npm run hronir:edit-commit -- --msg "..."`                                                            | Valida que cada tradução foi efetivamente alterada (UUIDv5 mudou), injeta `editHistory[]` no frontmatter de cada arquivo, fecha a sessão                                                                          |
| `npm run hronir:end -- [--skip-edit\|--force]`                                                         | Encerra a rodada. Recusa se há matches pendentes ou edição pendente, a menos que `--force`                                                                                                                        |
| `npm run hronir:migrate -- [--dry-run]`                                                                | Normaliza matches legados (`slug:` → `key:`, renomeia arquivo)                                                                                                                                                    |
| `npm run hronir:doctor`                                                                                | Verifica inconsistências. Sai com código 1 se encontrar — usado no CI                                                                                                                                             |

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
                     └─> edit-worst   # mostra pior post + contexto, snapshot, marca posts
                         └─> [edição manual em todas as traduções]
                             └─> edit-commit --msg "..."  # registra editHistory[]
```

A máquina de estados está em `hronir_session.json`: `ready_for_next → reading_a → reading_b → deciding → ready_for_next → … → need_edit → (sessão fechada)`.

### Atalhos

- `--skip-rating` em `init`: pula matches e vai direto pra `edit-worst` (útil quando só quer editar o pior acumulado).
- `--skip-edit` em `init` ou `end`: encerra após os matches, sem fase de edição.
- `--force` em `end`: descarta a sessão mesmo no meio da rodada.

## Match file

```yaml
---
run_id: 2026-05-18T20-28-00
run_at: 2026-05-18T20:28:00Z
match_index: 1
post_a:
  key: third-half-fourth-wall
  path: src/content/blog/2026-05-01-the-third-half-and-the-fourth-wall.md
  version: 2c8f1a3b-...                # UUIDv5 do corpo
post_b:
  key: rosencrantz-coin
  path: src/content/blog/rosencrantz-coin.md
  version: 9b14e7d2-...
winner: a                                # 'a' | 'b' | 'TODO'
agent_id: claude-opus-4-7                # quem decidiu
eval_lang: pt                            # idioma em que a avaliação foi feita
prompt_version: passion-v1
season: 1
override: null
clash: "..."                             # o confronto em prosa
winner_defense: "..."                    # defesa apaixonada do vencedor
loser_critique: "..."                    # crítica do perdedor (alimenta edit-worst)
---
```

Campos legados (`model`, body livre) continuam aceitos por `doctor` quando `agent_id` está ausente, para não invalidar matches antigos.

## editHistory

`edit-commit` injeta uma entrada por edição no frontmatter de cada tradução:

```yaml
editHistory:
  - uuid: "22c3fbae-..."                 # UUIDv5 do conteúdo ANTES da edição
    timestamp: "2026-05-18T17:19:55.965Z"
    msg: "Reorganizei a estrutura..."
```

Esse é o registro auditável da linhagem do post. Substitui o antigo `.routines/hronir/edits/<key>-<ts>.md`. O cooldown de `edit-worst` (que evita reeditar o mesmo post duas rodadas seguidas) é derivado desse campo.

## Meta de palavras nas defesas

`continue` (estado `reading_b`) instrui o avaliador que cada defesa deve ter mínimo 100 palavras (piso de qualidade), meta 200 (alvo natural), mencionar os dois posts pelo nome ou pela key, e explicar concretamente. Não há validação coerciva no `doctor` — é instrução proativa. Defesa muito curta ou genérica perde a função do sistema (`edit-worst` lê e cita essas defesas; pouca substância dá pouco sinal).

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
