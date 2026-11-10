# Aposentadoria do Astro

Status: proposta em pilha de PRs, aguardando CI e revisão.

A publicação do blog usa apenas Zola 0.23.6. A migração original preservou as URLs e assets públicos e registrou o baseline na PR #2374. A árvore antiga deixou de ser um artefato de produção e foi retirada em quatro etapas: melhorias de navegador; páginas estáticas e OG; música, Atlas e apresentações; arquivos, pacotes, configurações e CI.

## Contratos preservados

- `src/content/blog/` permanece como fonte editorial, inclusive artigos MDX legados e histórico Hrönir.
- `scripts/zola/source/` guarda apenas fontes de apresentação específicas do Zola; regras de publicação permanecem em `scripts/lib/` e fontes OKF.
- `public/` continua sendo fonte de assets, nunca saída de build.
- Rotas existentes, feeds, pesquisa, imagens sociais, apps e interatividade não devem sofrer regressões.
- `npm run check:no-astro` veta pacotes Astro, arquivos `.astro`, rotas antigas e imports legados nos caminhos executáveis.

## Gates antes de mesclar

1. `npm ci`, `npm test`, `npm run test:zola`, `npm run check:no-astro` e demais gates do `check.yml`.
2. `npm run build`, auditoria de rotas/assets do artefato e Chromium desktop/mobile.
3. Comparação de rotas e comportamento com o baseline Zola da main: busca, filtros, navegação, player, jogos, decks, Atlas, rankings, feeds, imagens OG e páginas PT/EN.
4. Confirmar o GitHub Pages após merge; sem alteração do `deploy.yml` nesta pilha.

A remoção do código antigo não prova por si só a equivalência visual, funcional ou editorial. Não mesclar enquanto houver falhas ou checks pendentes.
