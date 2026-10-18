---
type: Blog Post
title: "Do Astro ao Zola: a migração deste blog"
author: franklin
description: "Conteúdo, templates, músicas e demonstrações: o que precisa atravessar a migração deste blog para Zola e como verificar a publicação no GitHub Pages."
date: 2026-10-18T00:00:00.000Z
lang: pt
tags: [zola, astro, blog, software-engineering]
docType: technical
draft: false
---

Trocar o gerador de um blog parece uma operação pequena. Há textos em Markdown, um conjunto de templates e um diretório de arquivos públicos. O trabalho parece terminar quando a primeira página abre no navegador.

Neste blog, essa primeira página representa apenas uma parte do problema. Há versões de textos, traduções, rankings editoriais, músicas, áudio e demonstrações interativas. Cada uma dessas coisas tem uma fonte e uma forma de chegar ao leitor. A migração de Astro para Zola precisa preservar esse caminho.

Este texto registra a arquitetura da mudança e os critérios para considerá-la pronta. No início do trabalho, em 18 de outubro de 2026, tanto o fluxo principal de publicação quanto o site em produção ainda usavam Astro. As etapas abaixo descrevem a migração em andamento, sem antecipar seu resultado.

A inspiração para a organização desta página é [Why I chose Zola to build this site, de Prashanth Rao, no The Data Quarry](https://thedataquarry.com/blog/static-site-zola/): partir das necessidades do blog, explicar a estrutura do gerador e chegar à publicação. Aqui, a questão específica é transportar um site existente sem perder o que já funciona.

## Sumário

- [O que muda com Zola](#o-que-muda-com-zola)
- [O conteúdo vem antes do template](#o-conteudo-vem-antes-do-template)
- [A estrutura de um site Zola](#a-estrutura-de-um-site-zola)
- [Músicas e demonstrações também são o blog](#musicas-e-demonstracoes-tambem-sao-o-blog)
- [Do build local ao GitHub Pages](#do-build-local-ao-github-pages)
- [Quando a migração está pronta](#quando-a-migracao-esta-pronta)

## O que muda com Zola

Astro já permite gerar um site estático. A mudança para Zola acontece na ferramenta que transforma conteúdo e apresentação em arquivos publicáveis. Isso importa porque a comparação precisa partir do mesmo resultado: as páginas, os recursos e os comportamentos disponíveis para quem visita o blog.

A proposta técnica do Zola é concentrar a geração do site em um executável. Markdown entra como conteúdo; templates Tera definem a apresentação; o resultado pode ser servido como arquivos estáticos. A [documentação de templates](https://www.getzola.org/documentation/templates/overview/) explica como páginas, seções e configuração chegam ao template.

Essa separação oferece uma forma de organizar o projeto: decisões editoriais permanecem nos dados; apresentação fica nos templates; interatividade fica nos recursos que realmente precisam rodar no navegador.

Há um custo concreto. Componentes Astro e imports de MDX precisam de um destino na nova arquitetura. Uma chamada de componente dentro de um artigo pode representar um player, uma figura ou um experimento inteiro. Retirar a chamada sem reconstruir seu efeito deixaria um texto que compila e uma experiência incompleta.

Também não há, neste registro, um benchmark comparável dos dois builds. Tempo de compilação, tamanho transferido e desempenho no navegador são medidas diferentes. Qualquer conclusão sobre melhora precisa manter conteúdo, máquina, cache e procedimento de medição comparáveis.

## O conteúdo vem antes do template

O levantamento inicial identificou cerca de 80 endpoints na implementação e 271 arquivos de conteúdo. Esses números descrevem superfícies diferentes: um endpoint parametrizado pode gerar muitas URLs, enquanto versões e traduções podem ocupar vários arquivos.

Por isso, contar arquivos é apenas o começo. A comparação útil relaciona a identidade de cada publicação, a versão selecionada, sua língua, a URL pública e os recursos associados.

O repositório já tem convenções que participam desse contrato. O nome de um arquivo de post determina seu identificador e sua URL em `/blog/`. Redirecionamentos antigos preservam endereços com prefixo de data. Registros editoriais e seleção de versões têm funções próprias. Mover conteúdo não pode transformar silenciosamente um rascunho ou uma versão histórica na publicação principal.

A adaptação para Zola precisa distinguir a fonte canônica da entrada preparada para o gerador. Um arquivo editorial pode conservar seus metadados e suas regras no repositório, enquanto uma etapa de preparação produz o formato que o novo build consome. Essa etapa deve ser reproduzível e falhar de forma visível quando encontrar algo que não sabe representar.

Essa distinção também evita uma manutenção ambígua: corrigir manualmente um arquivo gerado pode fazer a página parecer certa até o próximo build apagar a correção.

## A estrutura de um site Zola

Um projeto Zola mínimo pode ser organizado assim:

```text
meu-site/
├── zola.toml
├── content/
│   └── blog/
│       ├── _index.md
│       └── primeiro-post.md
├── templates/
│   ├── base.html
│   ├── section.html
│   └── page.html
├── sass/
└── static/
```

É um exemplo didático, não uma lista dos caminhos já implantados neste repositório. Na [estrutura documentada pelo Zola](https://www.getzola.org/documentation/getting-started/directory-structure/), a configuração define o site, `content` reúne páginas e seções, `templates` contém a apresentação Tera, `sass` recebe estilos a compilar e `static` contém arquivos copiados para a saída.

O arquivo `_index.md` identifica uma seção. Os posts são páginas dentro dela. Um template de página pode apresentar título, data e conteúdo; o template da seção pode montar a listagem. Essa composição permite mudar o layout sem reescrever cada artigo.

O sumário também merece atenção. Zola expõe os títulos do Markdown por meio de `page.toc`; o template pode usá-los para construir a navegação, como mostra a [documentação de sumários](https://www.getzola.org/documentation/content/table-of-contents/). Para artigos longos, isso permite manter a navegação alinhada ao texto.

Neste blog, a revisão precisa incluir blocos de código, acentos, notas, links e trechos HTML existentes. Uma página visualmente semelhante pode esconder um link quebrado ou uma âncora que mudou. Esses detalhes fazem parte da compatibilidade.

## Músicas e demonstrações também são o blog

O inventário inicial inclui 95 músicas públicas. Elas vêm de um catálogo e têm identidade própria, com título, letra, imagem e endereço de áudio. A implementação existente filtra registros privados antes de transformá-los em páginas. Essa fronteira precisa permanecer explícita na migração.

Para uma música, verificar apenas a existência do HTML é insuficiente. É necessário conferir se o player aponta para a gravação correta, se a letra corresponde ao registro e se a página aparece nas listagens apropriadas. Os rankings de músicas também não podem ser confundidos com os de posts.

As demonstrações exigem outra camada de teste. Um site estático pode servir JavaScript e oferecer interação no navegador. Cada demonstração, porém, precisa continuar recebendo seus scripts, estilos e dados nos caminhos esperados. A página carregar com HTTP 200 não garante que o botão responda ou que a simulação comece.

A mesma cautela vale para áudios de artigos: a migração precisa transportar as referências à mídia e verificar os players, preservando a relação entre a matéria e sua narração.

## Do build local ao GitHub Pages

Para conhecer Zola em um diretório novo, os comandos básicos são:

```sh
zola init meu-site
cd meu-site
zola serve
```

O servidor local usa, por padrão, `127.0.0.1:1111`. Para verificar e gerar uma saída estática:

```sh
zola check
zola build
```

Segundo a [documentação da linha de comando](https://www.getzola.org/documentation/getting-started/cli-usage/), `check` valida a construção sem gravar a saída e também verifica links externos do Markdown. `build` grava o site em `public` por padrão. O diretório de saída pode ser recriado; portanto, ele deve conter apenas artefatos gerados.

Esse cuidado é especialmente relevante aqui: no projeto Astro de origem, `public` contém recursos de entrada. Usá-lo como saída Zola sem reorganizar os caminhos poderia apagar arquivos necessários. A migração precisa separar claramente origem e destino antes de executar o build.

No GitHub Pages, a sequência desejada é preparar o conteúdo, executar as verificações, gerar o site e publicar o artefato aprovado. A [documentação de deploy do Zola](https://www.getzola.org/documentation/deployment/github-pages/) descreve duas opções: publicar um artefato pelo GitHub Actions ou manter os arquivos gerados em uma branch de publicação. A configuração de Pages precisa corresponder à opção escolhida.

Para este blog, a URL-base deve continuar coerente com `https://franklinbaldo.github.io/`. Depois do deploy, a verificação precisa ocorrer nesse endereço público: abrir páginas representativas, seguir links, testar mídia e confirmar que a versão servida corresponde ao commit publicado.

## Quando a migração está pronta

O checklist de aceitação organiza o que precisa ser demonstrado. Os itens abaixo são critérios, não resultados já certificados:

- [ ] URLs publicadas e redirecionamentos preservados, incluindo rotas parametrizadas.
- [ ] Posts, traduções e versões selecionadas correspondem às fontes editoriais.
- [ ] Nenhum conteúdo privado ou rascunho aparece por efeito da conversão.
- [ ] As 95 músicas públicas do inventário inicial têm destino identificado e players verificados.
- [ ] Demonstrações abrem com seus recursos e respondem às interações principais.
- [ ] Listagens, rankings, navegação, feeds e sitemap continuam coerentes.
- [ ] Imagens, áudios, estilos e scripts são encontrados nos caminhos publicados.
- [ ] Leitura em celular, foco por teclado e navegação por títulos foram revisados.
- [ ] O build pode ser repetido a partir das fontes, sem correções manuais na saída.
- [ ] O deploy terminou com sucesso e o site público serve a revisão esperada.

Esse é o limite prático da mudança. O novo gerador precisa receber o acervo, preservar suas relações e entregar uma publicação verificável. A primeira página funcionando inicia a revisão; o restante do blog determina quando ela termina.
