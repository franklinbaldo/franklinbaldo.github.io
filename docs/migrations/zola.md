# Migração Astro → Zola

## Estado

A produção continua no workflow `deploy.yml`, com Astro. Este trabalho adiciona
uma pipeline Zola nativa e verificável, sem substituir produção por uma versão
com rotas ou funcionalidades faltantes. A presença de um build Zola verde não
significa que a migração esteja concluída.

## Executar

Use Node 24, `npm ci` e o binário oficial **Zola 0.23.6**. A versão está fixada
porque ela usa Tera 2 (components), não a sintaxe antiga de macros/import.
O workflow `zola-preview.yml` verifica o SHA-256 do release oficial antes de
executar o binário.

```sh
npm run test:zola
npm run build:zola
python3 -m http.server 8000 --directory dist-zola
```

`ZOLA_BIN=/caminho/zola npm run build:zola` permite um binário fora do PATH.
A entrada descartável vive em `.cache/zola-site/`; a saída é `dist-zola/`.
**Nunca execute Zola com a saída padrão sobre o diretório `public/` deste
repositório**: ele contém assets-fonte, não um artefato descartável.

Não é necessário gerar HTML com Astro para executar `build:zola`. Node continua
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

O artigo `/pt/blog/migracao-do-blog-para-zola/` explica a mudança sem anunciar
um cutover que ainda não aconteceu.

## Gate de publicação

```sh
ASTRO_TELEMETRY_DISABLED=1 npm run build
npm run build:zola
npm run check:zola:parity
```

O último comando compara rotas/artefatos existentes e todos os assets públicos,
gera `.cache/zola-parity.json` e retorna erro se houver ausências. O relatório
não transforma páginas genéricas em equivalência funcional. Além de zerar ou
justificar explicitamente cada diferença, é obrigatório testar:

1. Homes, posts EN/PT, Markdown/KaTeX/iframes, imagens e links de tradução
2. Busca, filtros e paginação, feeds e sitemaps
3. Rankings, duelos, perspectivas e dossiês com evidências completas
4. Player e continuidade de reprodução na navegação
5. Livros, projetos, papers, ToE Arena, Atlas, MaleCNS e demais páginas especiais
6. Demos, jogos, apresentações e seus scripts/artefatos
7. Preview visual desktop/mobile e ausência de erros de console

Somente após esses gates deve-se trocar `deploy.yml` para `build:zola` e
`dist-zola`. O workflow de preview não tem permissão de Pages e nunca publica.
Não há migração automática de configuração de segurança ou permissões.

## Referências

- https://www.getzola.org/documentation/getting-started/installation/
- https://www.getzola.org/documentation/getting-started/cli-usage/
- https://www.getzola.org/documentation/deployment/github-pages/
