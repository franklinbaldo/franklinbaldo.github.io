# Migração Astro → Zola

## Estado

A publicação está em Zola 0.23.6; este documento preserva os contratos e as evidências da migração.

## Executar

Use Node 24, `npm ci` e o binário oficial **Zola 0.23.6**. A versão está fixada
porque ela usa Tera 2 (components), não a sintaxe antiga de macros/import.
O workflow `zola-preview.yml` verifica o SHA-256 do release oficial antes de
executar o binário.

```sh
npm run test:zola
npm run build:zola
npm run preview
# desenvolvimento com rebuild automático:
npm run dev
```

`ZOLA_BIN=/caminho/zola npm run build:zola` permite um binário fora do PATH.
A entrada descartável vive em `.cache/zola-site/`; a saída é `dist-zola/`.
**Nunca execute Zola com a saída padrão sobre o diretório `public/` deste
repositório**: ele contém assets-fonte, não um artefato descartável.

O build Zola não executa nenhuma etapa Astro. Node continua
responsável por projeções editoriais, KaTeX, imagens sociais e Pagefind; Zola
renderiza os templates e o conteúdo das páginas.

## Contratos preservados

- Fontes editoriais continuam em `src/content/blog/`, sem reescrever histórico
- Seleção legada e precedência entre diretórios/arquivos usam os helpers existentes
- Rascunhos e `publishDate` futuro não entram no site
- Música derivada só inclui registros públicos com `createdAt`; a precedência por
  identidade replica o loader existente
- URLs canônicas usam `slug ?? id`; português continua em `/pt/blog/`
- Tags mantêm rótulos exatos, sem a slugificação padrão de taxonomias Zola
- Todo `public/` é copiado byte a byte; imagens locais de posts são copiadas e
  seus links reescritos
- RSS e JSON Feed EN/PT contêm o HTML integral efetivamente renderizado por Zola
- Capítulos de audiolivro só entram quando `publication.status` é `published`
- OG continua usando os renderizadores e fontes existentes

O artigo `/pt/blog/migracao-do-blog-para-zola/` documenta a mudança.

## Gate de publicação

```sh
npm run build
npm run test:zola
npm run check:no-astro
```

A paridade histórica foi registrada na PR #2374. O último comando impede
reintrodução de Astro; regressões funcionais são cobertas pelos testes
Zola, pela auditoria de artefatos e pelos smoke tests do navegador. Além de zerar ou
justificar explicitamente cada diferença, é obrigatório testar:

1. Homes, posts EN/PT, Markdown/KaTeX/iframes, imagens e links de tradução
2. Busca, filtros e paginação, feeds e sitemaps
3. Rankings, duelos, perspectivas e dossiês com evidências completas
4. Player e continuidade de reprodução na navegação
5. Livros, projetos, papers, ToE Arena, Atlas, MaleCNS e demais páginas especiais
6. Demos, jogos, apresentações e seus scripts/artefatos
7. Preview visual desktop/mobile e ausência de erros de console

O deploy já utiliza exclusivamente `dist-zola`. O workflow de preview não tem permissão de Pages e nunca publica.
Não há migração automática de configuração de segurança ou permissões.

## Referências

- https://www.getzola.org/documentation/getting-started/installation/
- https://www.getzola.org/documentation/getting-started/cli-usage/
- https://www.getzola.org/documentation/deployment/github-pages/

## Checkpoint de paridade de rotas

O build integrado de 18/10/2026 cobre os 4.704 artefatos comparados do baseline,
com zero rota pública ausente e todos os arquivos de `public/` idênticos.
A única remoção deliberada é a imagem OG de
`the-art-of-delegating-orchestrating-jules-and-claude-in-everyday-life`,
cuja fonte está marcada `draft: true`. O teste verifica essa condição antes
de aceitar a exceção; uma futura publicação exige removê-la.

Os dois URLs históricos de sitemap continuam disponíveis. Páginas `noindex`
não entram nos sitemaps. Rankings, ciência, apps, música e livros têm
exportadores nativos; o player fica fora do conteúdo substituído durante
a navegação progressiva. Mermaid e cópia de código usam bundles independentes
de Astro. A cobertura de caminhos não substitui o smoke funcional/visual
no Chromium, ainda obrigatório antes do cutover.
