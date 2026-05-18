# Hrönir

Sistema de avaliação par-a-par de posts do blog. Cada rodada sorteia 10 posts EN com `translationKey`, monta 5 partidas, e um avaliador (humano ou modelo) escolhe um vencedor por partida defendendo apaixonadamente. O ranking acumulado identifica o post que mais perde, e esse post recebe uma crítica registrada.

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
| `npm run hronir:init` | Sorteia 10 posts EN, cria 5 match files `winner: TODO` |
| `npm run hronir:present -- <match.md>` | Imprime os dois posts + instrução pro avaliador |
| `npm run hronir:ranking` | Score acumulado de todos os matches preenchidos |
| `npm run hronir:worst` | Imprime translationKey do pior ranqueado |
| `npm run hronir:migrate` | Normaliza matches legados (slug → key, renomeia arquivos) |
| `npm run hronir:doctor` | Verifica inconsistências (keys, paths, duplicatas) |

Cada comando termina com uma linha `NEXT STEP:` apontando o próximo passo, exceto quando o fluxo termina.

## Ranking

Score = `floor(wins * 1000 / appearances) + appearances`. Tie-break por chave alfabética. O `worst` retorna o de menor score.

A componente `+ appearances` é deliberada: posts com mais aparições têm mais informação sobre eles, então um post com 0/1 fica acima de um post sem dados. O pior ranqueado precisa ter aparecido pelo menos uma vez.

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
