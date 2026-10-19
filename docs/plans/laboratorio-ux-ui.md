# Laboratório aberto — fila incremental de UX/UI

Este plano registra fatias pequenas do site Zola, sem criar um catálogo de
pesquisa paralelo: hipóteses e evidências continuam nos DAGs/OKF canônicos.
Cada fatia exige HTML acessível e teste de regressão no CI antes do merge.

| Estado | Superfície | Próxima fatia verificável | Critério |
| --- | --- | --- | --- |
| Implementada em 2026-10-19 | Home PT/EN | Entradas claras para Papers, Repo Factory e MaleCNS, com limites explícitos dos experimentos | Três links reais, cópia bilíngue e layout em 390/1440 px |
| Fila | Papers | Expor hipótese, evidência e estado a partir dos dados existentes | Nenhuma inferência de status sem fonte |
| Fila | MaleCNS | Dar filtro por evidência nos cartões de projetos, sem recomputar tiers | Filtro utilizável por teclado, URL preservada |
| Fila | Demos | Estado legível de inicialização, erro e simulado/medido nas experiências ainda sem isso | Smoke em Chromium, com e sem WebGL |
| Fila | Busca | Melhorar descoberta transversal entre documentos e experimentos | Consultas PT/EN e retorno por histórico |
| Fila | Navegação | Agrupar Ler / Experimentar / Pesquisar / Ouvir sem alterar rotas | Desktop e 390 px, leitor de tela |

## Decisão desta fatia

Em 2026-10-19, as PRs #2382 (busca/idiomas), #2392 (cena) e #2393
(fly-shader) já estavam integradas. A PR aberta #2414 trata de audiobook,
sem sobreposição na homepage. A navegação global já havia destacado Papers
em #2412; a home ainda apresentava essencialmente trilhas de leitura e
publicações recentes, sem explicar o laboratório em andamento.
Escolhida a superfície home por maior benefício de orientação inicial,
sem duplicar nem reformular os catálogos científicos.

**Hipótese:** três caminhos explícitos com descrição e advertência de
limitações reduzem o esforço para encontrar pesquisa, demo e evidências de
projetos, sem sugerir que experimentos exploratórios sejam resultados validados.

**Aceite:** rotas preservadas; links para /papers/, /games/repo-factory/
e /malecns/ (ou /pt/malecns/); textos em PT/EN; landmarks e nomes
acessíveis; teste Chromium em 1440 e 390 px; CI/lint/build verdes.
