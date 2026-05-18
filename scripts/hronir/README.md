# Hrönir

Sistema de avaliação par-a-par de posts do blog. Cada rodada sorteia 10 posts EN com `translationKey`, monta 5 partidas, e um avaliador (humano ou modelo) escolhe um vencedor por partida defendendo apaixonadamente. O ranking acumulado identifica o post que mais perde, e esse post recebe uma crítica registrada.

> **Este CLI é não-interativo por design** (rodado por Claude Code).
> Não use `readline`, `inquirer`, `prompts`, leitura de `process.stdin`,
> nem confirmações em tela do tipo `[y/N]`. Toda saída vai direto pro
> stdout via `console.log`, sem paginação. O default de qualquer ação
> destrutiva ou que sobrescreve é "prossiga sem perguntar". Se algum
> subcomando futuro precisar de confirmação destrutiva (ex: `reset`),
> implemente com flag explícita `--yes`, não com prompt interativo.
>
> Comandos não devem mudar de comportamento baseado em `process.stdout.isTTY`.

## Identidade canônica

`translationKey` (do frontmatter do post) é a identidade. Versões em idiomas diferentes do mesmo ensaio compartilham a mesma `translationKey` e portanto consolidam wins/appearances no ranking. Match files referenciam posts por `key` (= translationKey) e `path` (= caminho do .md).

## Estrutura

```
.routines/hronir/
  <run_id>_<keyA>_x_<keyB>.md     # um arquivo por partida
  critiques/
    <key>.md                       # crítica do pior ranqueado de cada rodada
scripts/hronir/
  index.js                         # CLI entrypoint
  lib/                             # comandos
  package.json                     # devDeps (gray-matter)
  README.md                        # este arquivo
```

## Comandos

Todos via npm scripts no raiz:

| Comando | Função |
|---------|--------|
| `npm run hronir:init` | Sorteia posts EN, cria até 20 match files (n = min(20, ⌊corpus/2⌋); falha se corpus < 4) |
| `npm run hronir:present -- <match.md>` | Imprime os dois posts + instrução pro avaliador (meta de palavras na defesa) |
| `npm run hronir:resume` | Identifica a rodada mais recente, lista pendentes, aponta próximo |
| `npm run hronir:ranking` | Score acumulado de todos os matches preenchidos |
| `npm run hronir:worst` | Imprime translationKey do pior ranqueado (apenas inspeção) |
| `npm run hronir:edit-worst` | Pior elegível + top 3, defesas, registro auditável em `edits/`, e instrução pra ler as skills antes de editar |
| `npm run hronir:archive-post -- <key>` | Move todos os matches envolvendo `<key>` para `archive/`. Pós-edição, o post reinicia em 0 aparições |
| `npm run hronir:migrate` | Normaliza matches legados (slug → key, renomeia arquivos) |
| `npm run hronir:doctor` | Verifica inconsistências (keys, paths, duplicatas) |

Cada comando termina com uma linha `NEXT STEP:` apontando o próximo passo, exceto quando o fluxo termina.

## Fluxo

```
init → present (×n_matches) → edit-worst → (edição manual do post worst) → archive-post <key>
```

`resume` em qualquer ponto identifica a rodada mais recente e aponta o próximo pendente. Útil para crash recovery ou retomada entre sessões.

## Meta de palavras nas defesas

`present` instrui o avaliador que cada defesa deve ter mínimo 100 palavras (piso de qualidade), meta 200 (alvo natural), mencionar os dois posts pelo nome ou pela key, e explicar concretamente. Não há validação coerciva no `doctor` — é instrução proativa. Defesa muito curta ou genérica perde a função do sistema (`edit-worst` lê e cita essas defesas; pouca substância dá pouco sinal).

`worst` continua disponível para inspeção pontual, mas o fluxo automático termina em `edit-worst` + `archive-post`. A crítica em prosa em `.routines/hronir/critiques/` continua sendo um registro válido, mas não dirige a edição; o que dirige são as **skills versionadas** (próxima seção) e o registro auditável em `.routines/hronir/edits/<key>-<ts>.md`.

## Threshold de volume

`edit-worst` só considera posts com `appearances >= MIN_APPEARANCES` (default 3). Se nenhum post elegível, imprime mensagem informativa e termina com exit 0 (não é erro — apenas sinal de que a rodada ainda não acumulou volume suficiente para edição confiável).

Para ajustar o threshold, edite a constante no topo de `scripts/hronir/lib/commands.js`.

## Skills

Em `scripts/hronir/skills/`:

- `franklin-blog/SKILL.md` — para posts informais, ensaísticos, voz pessoal
- `franklin-essay/SKILL.md` — para posts argumentativo-formais (paper-shaped, defesa de tese, citação acadêmica densa)

O `edit-worst` instrui a leitura de **ambas** antes de editar e a escolher a aplicável (default: blog). Atenção especial à seção *Protection against tightening* e ao *Voice-fidelity pass* — o reflexo do LLM de tighten/smooth/fortify é o failure mode aqui.

## Archive

`archive-post <key>` move todos os matches envolvendo `<key>` para `.routines/hronir/archive/<key>-<timestamp>/`. O agregador (`ranking`/`worst`/`edit-worst`) ignora arquivos em subdiretórios — apenas matches diretos em `.routines/hronir/` contam. Intenção: pós-edição, o post é objeto novo; appearances reinicia em zero, evitando arrastar o veredito pré-edição como dado válido.

## Registro auditável

`edit-worst` cria `.routines/hronir/edits/<key>-<timestamp>.md` com frontmatter contendo `post_key`, `post_path`, `model`, `skill_used`, `appearances_at_edit`, `wins_at_edit`, `defenses_archived_to` (placeholder). Campos `model`, `skill_used` e o corpo (resumo do que foi mudado e por quê) são preenchidos pelo agente após editar o post. O arquivo serve como linhagem da edição.

## Ranking

Ranking via **OpenSkill** (modelo Weng-Lin, atualização bayesiana online de Plackett-Luce). Cada par é tratado como uma partida 1v1; vencedor sobe `mu` e desce `sigma`, perdedor o oposto. Três eixos saem da computação, todos exibidos lado a lado em `hronir:ranking`:

- **`mu`** — estimativa pontual da "qualidade" do post. Sobe quando o post vence, desce quando perde, com magnitude proporcional à surpresa (vencer um post de mu alto vale mais).
- **`sigma`** — incerteza sobre `mu`. Começa alta (pouca informação) e cai a cada partida. Não diz que o post é ruim — diz que ainda não sabemos.
- **`ordinal = mu − 3·sigma`** — score conservador usado para a ordem global. Penaliza incerteza explicitamente: um post novo, mesmo com mu alto, fica atrás de um post estabelecido com mu um pouco menor.

A ordem da tabela é por `ordinal` descendente. Tie-break alfabético por `key`. O `worst` retorna o post com menor `ordinal` entre os elegíveis (`appearances >= MIN_APPEARANCES`) — note que aqui não é "tie-break", é filtro: posts sem volume mínimo são ignorados antes de pegar o último.

### Por que MIN_APPEARANCES ainda importa com OpenSkill

OpenSkill já carrega incerteza em `sigma`, então em tese seria possível ranquear posts com 1 partida. Mas duas razões mantêm o threshold:

1. **Sinal de defesa.** `edit-worst` consome as defesas como contexto. Um post com 1 derrota dá só 1 defesa pra trabalhar; com 3+ derrotas, o conjunto de defesas começa a triangular o problema do post.
2. **Estabilidade.** Os 3 primeiros matches de um post podem oscilar muito (sigma alto, ordinal sensível). MIN_APPEARANCES=3 evita editar com base num único par que pode ter sido sorte/azar.

`appearances` continua reportado ao lado de `mu`/`sigma` exatamente para isso ser legível.

## Match file

```yaml
---
run_id: 2026-05-18T02-48-18
run_at: 2026-05-18T02:48:18Z
match_index: 1
post_a:
  key: third-half-fourth-wall
  path: src/content/blog/2026-05-01-the-third-half-and-the-fourth-wall.md
post_b:
  key: rosencrantz-coin
  path: src/content/blog/rosencrantz-coin.md
winner: TODO              # 'a', 'b', ou TODO
model: TODO               # identificador do modelo executando
prompt_version: passion-v1
season: 1
override: null            # se preenchido, sobrescreve winner
---

<!-- defesa em português aqui -->
```

## Crítica do pior

Template em `.routines/hronir/critiques/<key>.md`:

```markdown
---
post_key: <translationKey>
post_path: <caminho>
run_id: <run_id da rodada>
model: <modelo executando>
prompt_version: critique-v1
---

Crítica honesta respondendo:
- O que o post tenta fazer?
- Por que provavelmente perdeu as comparações?
- Se você fosse editá-lo, o que mudaria — e por quê?

A crítica é registro. Não edite o post original.
```

## Migração

`migrate` é idempotente: lê cada match, resolve `post_a.path` e `post_b.path` para `translationKey` real (lookup no frontmatter do post), reescreve `slug:` como `key:`, e renomeia o arquivo se o nome não bate. `doctor` valida o resultado.
