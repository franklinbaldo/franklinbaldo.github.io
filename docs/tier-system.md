# Sistema unificado de tiers

Este documento é o contrato operacional comum para tiers de **posts**, **músicas** e **projetos** no blog.

A regra principal é simples:

> decisão editorial canônica em Markdown OKF; métricas/rankings são projeções de evidência; UI é projeção derivada.

Nenhuma rotina deve criar um segundo registry em JSON, YAML, TypeScript, planilha ou estado escondido.

## Domínios e fontes de verdade

| Domínio | Identidade | Card canônico | Spec | Evidência derivada |
| --- | --- | --- | --- | --- |
| Posts | `translationKey` | `knowledge/blog-post-tiers/<key>.md` | `specs/okf-types/blog-post-tier.md` | Hrönir textual: OpenSkill, estrelas, de-confounding, perspectivas e versões |
| Músicas | Suno clip UUID | `knowledge/music-tiers/<slug>.md` | `specs/okf-types/music-tier.md` | `.routines/suno-rank/duels/` + `src/suno-rank/` |
| Projetos | `owner/repo` | `knowledge/project-tiers/<slug>.md` | `specs/okf-types/project-tier.md` | GitHub atual: código, docs, testes, releases, issues/PRs e sinais de uso |

As fronteiras são duras:

- `postType: music` e `translationKey: music-*` **não** pertencem ao tier de posts;
- repositórios/projetos **não** pertencem ao tier de posts;
- uma música é tierizada por gravação Suno, não pelo post textual que eventualmente a descreve.

Cards históricos `knowledge/blog-post-tiers/music-*.md` permanecem como proveniência legada, mas não são projetados como tiers de posts e não devem receber novas atualizações.

## Semântica comum

Todos os três domínios usam:

- `quality_tier`: S/A/B/C/D/F;
- `interest_tier`: S/A/B/C/D/F;
- `confidence`: low/medium/high;
- `summary`, `strengths`, `open_problems`, `history`;
- `reviewed_at` e uma âncora de revisão (`reviewed_revision`).

A letra não é percentil.

- **S**: excepcional e deliberadamente raro;
- **A**: excelente e robusto;
- **B**: forte, com limitações visíveis;
- **C**: competente/misto;
- **D**: materialmente fraco ou incompleto;
- **F**: falha revista / fora do cânone ativo na forma atual.

`interest_tier` é independente de `quality_tier`: algo pode ser tecnicamente imperfeito e ainda assim extremamente fértil ou singular.

`confidence` mede cobertura e qualidade da evidência, não unanimidade.

## Golden path para uma rotina

### 1. Começar de `main`

```bash
git switch main
git pull --ff-only
npm ci
```

Antes de criar branch nova, procure PR aberta que toque a mesma superfície de tier e continue/reconcilie esse trabalho quando apropriado.

### 2. Ler o contrato do domínio

Leia esta página e a spec normativa específica do domínio. Reconstrua o estado dos cards canônicos e da evidência atual. Não use memória de execução anterior como fonte de verdade.

### 3. Escolher por ganho de informação

Não percorra itens mecanicamente. Priorize:

1. item elegível ainda sem card;
2. card com baixa confiança;
3. mudança material desde a revisão;
4. sinais discordantes capazes de mudar uma letra;
5. evidência nova na fronteira de tier;
6. card stale.

Uma execução normalmente aprofunda um item; lote grande só quando as decisões forem realmente independentes e bem sustentadas.

### 4. Criar/editar somente o card canônico

Para um item novo, comece com o mínimo:

```yaml
---
type: <tipo-do-domínio>
---
```

Então deixe o `okf-parser` informar os campos estruturais ausentes. Não copie estado derivado para o card apenas para facilitar a UI.

### 5. Validar

Validação agregada:

```bash
npm run tiers:check
```

Ou por domínio:

```bash
npm run tiers:check:posts
npm run tiers:check:music
npm run tiers:check:projects
```

Depois rode os gates relevantes do site:

```bash
npm run format:check
npm run lint
npm test
npx astro check
npm run build
```

A spec garante forma. O agente continua responsável pela qualidade semântica da decisão.

### 6. Mudança de tier exige história

Promoção ou demissão exige evidência material. Acrescente ao `history`:

- data;
- tier anterior;
- tier novo;
- evidência que mudou;
- fraquezas ainda abertas quando relevantes.

Não altere a letra só porque a rotina rodou.

### 7. PR e merge

Inclua change card quando exigido pelo repositório. Revise o diff e use squash merge quando os gates obrigatórios permitirem.

## Projeções do site

A infraestrutura compartilhada é:

- `src/data/tier-types.ts` — tipos comuns;
- `src/components/TierBoard.astro` — UI única;
- `src/data/blog-post-tiers.ts` — loader/projeção de posts;
- `src/data/music-tiers.ts` — loader/projeção de músicas;
- `src/data/project-tiers.ts` — loader/projeção de projetos.

Superfícies:

- `/ranking/` e `/pt/ranking/`: ranking Hrönir + tiers de posts;
- `/music/` e `/pt/musicas/`: tiers de músicas + catálogo;
- `/projects/` e `/pt/projects/`: tiers de projetos + catálogo;
- `/pt/blog-tiers/`: compatibilidade/atalho para a mesma projeção compartilhada.

Não crie um segundo componente de board por domínio.

## Evidência por domínio

### Posts

Use Hrönir textual e suas projeções atuais. O card responde ao julgamento editorial; o Hrönir responde à evidência comparativa.

### Músicas

Use o sistema `src/suno-rank/` e `.routines/suno-rank/duels/`. Com pouca cobertura, prefira card provisório com baixa confiança a inferir uma letra forte de poucos duelos. Uma nova renderização Suno é outra gravação e outro UUID.

### Projetos

Leia o projeto real. Stars, forks e recência são sinais secundários. Avalie execução conforme o tipo de projeto e interesse conforme originalidade/alavancagem/fertilidade. Inatividade não implica baixa qualidade se o projeto estiver maduro e estável.

## Invariantes

1. Um item conceitual possui no máximo um card canônico por domínio.
2. UI nunca é fonte de verdade.
3. Ranking/métricas nunca viram letra automaticamente.
4. Não misturar domínios.
5. Não apagar histórico apenas porque a decisão mudou.
6. Não criar estado operacional paralelo.
7. Se uma nova necessidade recorrente aparecer, evolua este contrato/spec/helpers antes de ensiná-la só no prompt da automação.
