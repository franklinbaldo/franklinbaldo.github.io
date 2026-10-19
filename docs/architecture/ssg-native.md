# Arquitetura-alvo — SSG como núcleo de publicação

Status: **proposta em implementação incremental** na PR #2394.
Data: 2026-10-19. Não corresponde ainda à arquitetura publicada.

## Diagnóstico fundamentado em código

O blog cresceu muito além de posts, mas a preparação do gerador foi
concentrando regras editoriais, computação de domínio, HTML, bundling de apps,
assets e publicação em scripts específicos da engine.

Exemplos concretos (arquivos no repositório):

- `scripts/zola/build.mjs` orquestra mais de dez etapas Node antes/depois do
  Zola. Há integração forte entre gerador e regras editoriais.
- `scripts/zola/science-pages.mjs` e `scripts/zola/rankings.mjs` superam
  40 KB cada, combinando leitura de OKF, rankings, HTML e emissão de páginas.
- `scripts/zola/music.mjs` lê o catálogo Suno, calcula rankings e renderiza
  a UI no mesmo estágio de projeção.
- `scripts/zola/interactive-apps.mjs` extrai scripts/estilos dos componentes
  para montar aplicações; `scripts/zola/og.mjs` ainda consome módulos em
  `src/pages/og/`, mantendo dependências de apresentação herdadas.
- O candidato SSG importava `../zola/content.mjs`; isso foi corrigido na
  própria PR movendo funções independentes para `scripts/lib/publication.mjs`.
- O build SSG executado no GitHub compilou 252 posts, mas ainda não entregou
  todas as rotas especiais e o relatório do próprio SSG tem pendências de
  qualidade. Portanto, build verde não prova equivalência funcional.

## Modelo de dependências proposto

```text
fontes canônicas (Markdown OKF, catálogo Suno, snapshots, assets)
                    |
                    v
bibliotecas de domínio (Hrönir, música, livros, projetos, pesquisa)
                    |
                    v
projeções determinísticas (Markdown/frontmatter/JSON/manifest)
                    |
                    v
SSG nativo (schema, templates, i18n, archive, search, RSS, SEO, a11y)
                    |
                    v
dist-ssg/  -> QA de paridade/visual/funcional -> GitHub Pages
```

Apps interativas são bundles estáticos independentes que entram como assets
no estágio apropriado, sem obrigar o SSG a executar Astro ou scripts ad hoc
para renderizar documentos. O site pode ser estático sem ser uma coleção de
páginas totalmente estáticas.

## Regras de propriedade e diretórios

| Camada | Fonte canônica ou destino | Regra |
| --- | --- | --- |
| Publicações | `src/content/blog/**` | Nunca duplicar fontes em `ssg/content`; `translationKey` e seleção Hrönir preservados |
| Evidência editorial | `.routines/hronir/**` | OKF e imutabilidade são anteriores ao gerador |
| Pesquisa curada | `knowledge/**`, `specs/okf-types/**` | Validação normativa antes da projeção; não inferir conteúdo privado |
| Catálogos/snapshots | `data/**`, `src/generated/**` quando aplicável | Fatos e identidade separados de HTML; frescor explicitado |
| Regras compartilhadas | `scripts/lib/**`, `src/hronir/**`, `src/lib/**` | Sem importar Zola, SSG, Astro ou código do DOM para definir o domínio |
| Entrada para SSG | `.cache/ssg-native/content/**` | Descartável, regenerável, não editável manualmente |
| Configuração/apresentação | `ssg/ssg.toml`, `ssg/templates/**` | Preferir plugins nativos e MiniJinja; não escrever outro gerador |
| Artefato de publicação | `dist-ssg/**` | Gerado, nunca fonte; `public/**` é origem de assets e jamais saída |
| Demos e apps | Módulos de cliente sob `src/**` no estágio atual | Evoluir para bundles isolados sem imports de renderizador; migrar por rota, não em massa |
| Persistência de CI | GitHub, `changelog/changes/**`, relatórios | Cada avanço em PR, checks e evidências reproduzíveis |

A propriedade das raízes especiais fica declarada em
`ssg/route-ownership.json`, usada pelo gate de paridade. Esse catálogo não
supõe que a rota já foi portada: uma propriedade declarada sem arquivo no
artefato continua bloqueando o cutover.

## Contratos obrigatórios

1. **Uma fonte da verdade por domínio.** Hrönir seleciona versões; música
   filtra clipes públicos; livros/projetos têm regras próprias. SSG recebe
   projeções, nunca reimplementa essas decisões nos templates.
2. **Nenhum ciclo entre geradores.** SSG não importa Zola/Astro. Zola pode
   importar bibliotecas comuns enquanto for fallback; não o contrário.
3. **Publicação é fail-closed.** Rascunhos, `publishDate` futuros e conteúdo
   privado não entram. Manifestos registram exclusões e incompatibilidades.
4. **Geração tem entrada explícita.** Trabalhos de rede/harvest atualizam
   snapshots persistidos antes do build; evitar tornar a publicação
   dependente de API externa ao vivo.
5. **SSG nativo antes de código extra.** Arquivo, taxonomias, i18n, SEO,
   sitemap, RSS, busca, acessibilidade e schemas pertencem ao núcleo SSG,
   salvo incompatibilidade real documentada e reproduzível.
6. **Paridade não é contagem de arquivos.** Comparar URLs, conteúdo,
   fragmentos, idioma, hreflang, mídia, assets, scripts, interatividade,
   acessibilidade e desempenho. Rotas antigas e JSON feeds são contratos.
7. **Sem grande mudança às cegas.** Uma família de rota por PR/etapa;
   snapshot de referência, smoke de navegador, rollback e merge seguro.
8. **Qualidade tem orçamento.** Medir a soma de scripts e peso no browser;
   não aceitar um novo plugin por conveniência se reintroduz duplicação.

## Sequência de refatoração

### A — Isolar regras compartilhadas (iniciado)
Extração de `scripts/lib/publication.mjs`; Zola conserva reexportação
compatível e serialização TOML específica; SSG usa a biblioteca diretamente.
Adicionar guard contra importações de outros geradores.

### B — Corrigir integridade do núcleo nativo
Resolver/reproduzir falha de `/archive/` no plugin de paginação (o plugin
atual procura sidecars só em `build_dir/.meta`, enquanto o gerador promove
os arquivos para o diretório final), corrigir metadados, warnings e relatórios
de a11y. Preferir correção upstream à implementação paralela.

### C — Um domínio por vez
Portar `projects`, `music`, `books`, `ranking` e `papers` de renderizadores
monolíticos para fontes de dados/projeções, templates SSG e bundle JS
isolado. Reaproveitar módulos canônicos; não transportar HTML gerado.

### D — Apps e experiências
Separar código de cliente de componentes Astro antigos e de exportadores
Node. Preservar a identidade das rotas e comportamentos verificados no
Chromium. Evitar que templates carreguem JS das outras páginas.

### E — Simplificação e remoção
Quando toda rota passar nos gates, fazer o cutover. Somente *depois* remover
fallback Zola, dependências Astro legadas e scripts duplicados; medir linhas
de código, dependências, tempo de build e bundle final. Código morto é
removido com evidência, não pela extensão do arquivo.

## Indicadores de sucesso

- 0 rotas desaparecidas, 0 vazamentos de rascunho/dados privados;
- menos geradores e renderizadores customizados ativos;
- diretório SSG não importa código específico de Zola/Astro;
- schemas OKF e SSG mantidos com contratos sem divergência;
- peso transferido, desempenho e resultados de acessibilidade sem regressão;
- fluxos de PR/CI simples e repetíveis; toda etapa persistida em GitHub.

Em particular, **não** criar monorepo, mover 250 posts de uma só vez nem
reescrever os componentes de apps simultaneamente. O objetivo é diminuir o
número de conceitos e caminhos ativos, não aumentar o número de pastas.

### Integridade mensurável da migração

A partir da etapa de instrumentação, a PR de SSG deve confrontar todos os caminhos HTML e os demais arquivos do artefato Zola real, além de calcular hashes dos assets de origem. A existência de seis páginas raiz não significa equivalência de milhares de rotas de detalhe. O relatório `.cache/ssg-native/full-parity.json` é a base verificável dessa cobertura e o `quality-summary.json` explicita os pilares de auditoria por prioridade. A função de comparação não autoriza o cutover sozinha: comportamento, conteúdo, SEO, navegação e multimídia continuam exigindo testes próprios.
