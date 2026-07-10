---
date: 2026-07-10T05:16:51
slug: hronir-identity-explainer
branch: claude/sleepy-pasteur-5lbzig
status: pr-open
issues: [1042]
pr_opened: 1080
pr_merged: null
---

Cheguei sem PR `routine` pendente para mergear — o backlog do repo mostra que a última run de rotina (log `.routines/2026-07-09*`, se existir) já tinha sido mergeada antes desta run começar; não havia veto nem CI vermelho para lidar aqui, e nenhum PR `routine` aberto apareceu em `search_pull_requests` no início. As PRs abertas que existem no repo são todas do fluxo Hrönir (`hronir/run-*`), fora do meu escopo.

Backlog de issues `routine` estava em 9 (abaixo da faixa 10-20), então parei pra pensar no futuro do blog antes de escolher trabalho, como pedem os guardrails. Rodei um agente Explore pra levantar gaps reais no código (não só ideias soltas) e usei os achados pra abrir 6 issues novas, todas com rationale e prioridade:

- #1081 (media) — aria-labels do `GlobalMusicPlayer`/`Header` fixos em PT mesmo em páginas EN (bug de a11y confirmado lendo o componente).
- #1082 (media) — 404 em inglês não filtra "Recently published" por idioma nem localiza a data, diferente do `pt/404.astro` (bug confirmado).
- #1083 (baixa) — subárvore `/ranking/` do Hrönir é 100% inglês, sem paridade PT (distinto da #1042, que é sobre identidade/contexto, não localização).
- #1084 (baixa) — falta JSON Feed ao lado do RSS existente.
- #1085 (baixa) — falta atalho de teclado `/` pra busca.
- #1086 (baixa) — Playwright já é devDependency mas não há teste de regressão visual.

Escolhi a #1042 (priority:media, a mais alta do backlog) como trabalho da run: as páginas de detalhe do Hrönir (`/ranking/battles/[id]/`, `/perspectives/[id]/`, `/versions/[key]/`, `/posts/[key]/`) abrem direto em jargão — "Battle Report", badges de perspectiva, `agentId`, `confidence` — sem nenhum link ou texto de contexto pra quem chega de fora via busca, e essas páginas (milhares delas, uma por arquivo de duelo) estavam indexáveis e no sitemap sem nenhuma explicação prévia estabelecida (ao contrário das páginas de versão `/v/`, que já eram noindex).

O que fiz:
1. Criei `src/components/HronirExplainer.astro` — um `<details>` compartilhado com uma explicação curta do sistema Hrönir (copy EN/PT pronta, embora as páginas hoje só usem `lang="en"`) e um link persistente de volta pra `/ranking/`.
2. Incluí o componente nas quatro famílias de página de detalhe.
3. Decisão de indexação (passo 3 da issue, feita explicitamente): marquei essas quatro famílias como `noindex, follow`, espelhando o tratamento já dado a `/blog/<slug>/v/<uuid>/`, e estendi o filtro do `sitemap()` em `astro.config.mjs` pra excluí-las. As páginas de listagem (`/ranking/battles/`, `/ranking/perspectives/`, `/ranking/version-trials/`, paginação) continuam indexadas normalmente.

Verifiquei localmente: `npx astro check` (0 erros), `npm run build` completo (4699 páginas), `npm run hronir:doctor` (0 inconsistências, 1 aviso pré-existente não relacionado), e inspecionei o HTML/sitemap gerados — `noindex` presente nas 4 famílias, explicador renderizado, e nenhuma URL de detalhe vazando pro `sitemap-0.xml`. `npx prettier --check .` verde.

Abri o PR #1080 (label `routine`, `Closes #1042`) mas **não mergeei** — fica como janela de veto de 24h pro Franklin. A próxima run mergeia se o CI estiver verde e não houver veto, e faz a checagem visual pós-deploy (fetch + screenshot via Jina) das páginas tocadas.

Pra próxima run: mergear #1080 se CI verde, checar a versão publicada de uma página de battle/perspective/version/dossier pra confirmar que o explicador renderiza como esperado em produção, e então seguir pra próxima issue de prioridade (`media`: nenhuma restante além das que acabei de abrir com essa prioridade — #1081 e #1082 — ambas boas candidatas por serem bugs reais confirmados, não só melhorias especulativas).
