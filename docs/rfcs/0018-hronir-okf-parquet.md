# RFC 0018 — Hrönir como OKF canônico e dataset Parquet público

| | |
|---|---|
| **Status** | Implemented |
| **Criado em** | 2026-09-18 |
| **Afeta** | Hrönir, build do blog, GitHub Pages, OKF |

## Resumo

Hrönir deixa de ser apenas um "Rate File com type" e passa a ter contrato OKF explícito.
Novas avaliações usam `type: Hronir Evaluation` e `schema: hronir-evaluation-v1`.
O histórico permanece imutável e é normalizado no carregamento.

O build publica uma projeção tabular do corpus em `/data/hronir.json`; no deploy,
essa mesma projeção é materializada como `/data/hronir.parquet` e servida pelo
GitHub Pages.

## Princípios

1. Markdown/OKF em `.routines/hronir/rates/` continua sendo a fonte canônica.
2. JSON e Parquet são projeções derivadas e descartáveis.
3. `prompt_version` descreve o contrato do prompt; `schema` descreve o contrato dos dados.
4. Rates históricos não são reescritos apenas para ganhar o novo schema.
5. Rankings são projeções computáveis, não autoridade semântica independente.
6. O dataset público deve ser amigável a DuckDB, agentes e exploração client-side.

## Schema de novas avaliações

Campos de identidade:

- `type: Hronir Evaluation`
- `schema: hronir-evaluation-v1`
- `id: hronir:<match-id>`
- `run_id`, `run_at`
- `prompt_version`

Relações:

- `post_a`, `post_b`
- `perspective_id`
- `agent_id`

Julgamento:

- `rate_a`, `rate_b`, `winner`
- `review_a`, `review_b`, `clash`
- `review_lang`
- `evaluator_mood`, `evaluator_mood_after`

## Projeção pública

`scripts/materialize-hronir.mjs` executa o normalizador único de Hrönir e produz
linhas achatadas em `public/data/hronir.json`. Isso inclui os rates legados.

No workflow de deploy, DuckDB converte o JSON já materializado para Parquet com
compressão ZSTD depois do Astro build e antes do upload do Pages. Assim, o Parquet
não entra no caminho crítico de renderização do Astro e não vira fonte de verdade.

## SEO

O dataset não substitui HTML indexável. Comentários/críticas Hrönir relevantes
continuam podendo ser incorporados estaticamente aos posts. O Parquet serve o
arquivo completo para exploração, filtros e histórico sem exigir milhares de
páginas individuais `noindex`.

## Evolução

A próxima etapa é materializar views por post (`post -> featured hronir[]`) e
eliminar páginas individuais de batalha que não tenham valor indexável, mantendo
o comentário editorial relevante no HTML do post.
