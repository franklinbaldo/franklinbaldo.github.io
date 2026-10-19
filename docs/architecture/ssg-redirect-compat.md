# Compatibilidade histórica de URLs — SSG

Status: experimental. O Zola continua como gerador de produção.

## Origem e responsabilidade

O arquivo `src/generated/blog-redirects.json` é a projeção canônica
dos aliases editoriais históricos. É gerado por
`scripts/generate-redirects.mjs` durante `scripts/pregen.mjs`.
Os links EN/PT em sentido inverso usam as identidades das **páginas
efetivamente publicadas**; o adaptador não varre rascunhos nem clipes
privados.

O SSG 0.0.68 não oferece uma regra de redirecionamento nativa equivalente
às rotas históricas do blog. Em vez de criar HTML usando código Node,
`scripts/ssg/prepare-redirects.mjs` projeta metadados/Markdown para
`ssg/templates/tera/redirect.html`. O próprio SSG compila o HTML
de destino com refresh, link canônico, `noindex` e link acessível.

## Política

1. Redirecionamento apenas para destino já publicado pelo SSG;
   nenhuma URL externa e nenhuma travessia, byte de controle ou separador
   percent-encoded são permitidos.
2. Rotas autorais e canônicas têm prioridade. Redirecionamento nunca
   substitui conteúdo público válido.
3. Os aliases antigos conhecidos são preservados; aliases cujo destino
   ainda não existe no candidato SSG ficam identificados por motivo no
   relatório, sem gerar um 404 disfarçado de redirect.
4. Nenhum processo modifica as fontes canônicas. O diretório descartável
   `.cache/ssg-native/content` é recomposto em cada compilação.
5. O CI valida **cada HTML compilado** quanto a idioma, refresh, canonical,
   `noindex`, fallback e existência do destino dentro do artefato.
6. A camada é transitória: quando SSG tiver recurso nativo equivalente
   comprovado, substituir o adaptador sem perder o mesmo contrato.

## Evidência gerada

- `.cache/ssg-native/redirects.json`: mapa emitido, exclusões por motivo,
  total de aliases canônicos lidos e quantidade de candidatos.
- `.cache/ssg-native/redirect-validation.json`: contagem dos stubs reais
  validados, sem aceitar destinos ausentes.

A cobertura `compare-baseline.mjs` só considera uma URL recuperada se
ela existir na saída. Isso não dispensa testes de UX, comportamento HTTP
do GitHub Pages, preservação dos fragmentos de URL e SEO. Nenhum relatório
desta etapa autoriza substituir o `dist-zola` como publicação.
