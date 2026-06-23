## Escopo real (o que o site realmente é e faz)
Este repositório é o código fonte de um blog estático pessoal e "jardim digital" de Franklin Baldo (`franklinbaldo.github.io`). O site hospeda posts focados em tecnologia, filosofia, agentes de inteligência artificial, arte e contos, oferecendo suporte a múltiplas línguas (Português/Inglês). O site também roda processos automatizados offline (como ranqueamento).

## Subsistema de ranking (existe? como funciona? está quebrado?)
Sim, o projeto possui o **Hrönir**, um subsistema robusto de "pairwise post-ranking" (ranqueamento em pares). Ele funciona comparando os posts dois a dois e utiliza o algoritmo OpenSkill para dar notas e calcular a qualidade (mu, sigma) a fim de criar um ranking automatizado dos textos. Atualmente o script funciona, como mostrado pelo comando `npm run hronir:ranking` listando os rankings completos dos posts. O sistema possui comandos CLI diversos (`init`, `continue`, `decide`, etc) em `scripts/hronir/index.js`, e os dados de sessões passadas de agentes de IA rodando comparações são imutáveis e salvos em `.routines/hronir/rates/`.

## Stack (Astro version, libs, plugins, hospedagem)
* **Framework:** Astro 6 (versão ^6.2.1)
* **Linguagem:** TypeScript e MDX. Conteúdo em Markdown (`.md` e `.mdx`).
* **Estilos:** Pico.css v2 (semântico, classless).
* **Fontes:** Fraunces e Inter (@fontsource).
* **Integrações (plugins/libs relevantes):** `@astrojs/mdx`, `@astrojs/sitemap`, `@astrojs/rss`, `remark-math`, `rehype-katex`, `pagefind` (busca).
* **Hospedagem / CI:** GitHub Pages, feito o deploy por Actions configurado no arquivo `.github/workflows/deploy.yml`.

## Estado atual (o que funciona, o que está quebrado)
* O site builda (`npm run build`) corretamente gerando as páginas estáticas no diretório `dist/`, sem erros fatais de build.
* A busca via `pagefind` roda normalmente na pasta `dist/`.
* O pipeline de `check` e `hygiene` do Hrönir roda perfeitamente via CLI.
* O comando de `doctor` do Hrönir funcionou localmente sem erros apontando integridade das sessions.

## Issues abertas (top 5, com números e resumo de uma linha)
* Issue #591: ux: reading time visível nos PostCards do arquivo
* Issue #589: perf: preconnect e dns-prefetch para domínios de terceiros
* Issue #588: ux: Web Share API — botão nativo de compartilhamento em posts
* Issue #587: seo: PersonPage/ProfilePage schema para /about/ e /pt/about/
* Issue #585: perf: font-display e subset otimizado para fontes de código (Fira Code)

## PRs abertas (número, título, estado — incluindo PR #620)
* PR #626: hronir: 10 matches — haiku-4.5 - Open
* PR #620: Add JULES_HRONIR.md prompt - Open
* PR #577: hronir: 20 matches — jules - Open
* PR #576: hronir: 20 matches — jules - Open
* PR #575: chore(deps): bump the npm_and_yarn group across 1 directory with 2 updates - Open

## Próximas sessões Jules recomendadas (top 3 tarefas concretas)
1. **Atender PR #620:** Revisar e fazer o merge da instrução de prompt focada no agente Jules (`JULES_HRONIR.md`) para padronizar e apoiar a orquestração do loop do Hrönir.
2. **Avaliar e fundir sessões do Hrönir (PRs #576, #577 e afins):** Avaliar a qualidade das "first impressions" das avaliações do Hrönir rodadas recentemente e dar merge pra evoluir o ranking da página.
3. **Melhorias de Performance UX/A11Y (Issue #591 e #585):** Implementar e fechar as tarefas de visualização de reading time nos cards (Issue 591) e otimização no display das fontes customizadas como `font-display` para a Fira Code (Issue 585).
