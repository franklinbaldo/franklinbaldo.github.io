# Rotina — Scientific Equation Atlas

Esta rotina mantém o Atlas das Equações como um programa recorrente de ingestão, organização e auditoria de estruturas quantitativas usadas no conhecimento humano.

A fonte de verdade conceitual é `knowledge/science-equations/`: Markdown OKF normal, legível por humanos. Não crie um banco paralelo que concorra com esses conceitos. Entretanto, o Atlas é planejado para milhões de ocorrências: dados brutos e normalizados em massa NÃO precisam virar um arquivo Markdown por ocorrência. Use artefatos estruturados e regeneráveis para escala; mantenha no OKF a taxonomia, os conceitos importantes, as famílias, a proveniência, as regras de normalização, decisões metodológicas, auditorias e runs.

Leia também `docs/science-equation-atlas-sources.md`. O backlog principal do projeto é um backlog de fontes/corpora, não uma lista manual de equações.

## Objetivo de escala

O objetivo não é adicionar uma fórmula por execução. O objetivo é descobrir e integrar fontes capazes de produzir grandes lotes verificáveis.

Uma execução bem-sucedida pode ingerir milhares ou milhões de candidatos, mesmo que apenas uma pequena parte seja promovida imediatamente a conceitos OKF curados.

Meça o avanço por:

- fontes/corpora integrados;
- candidatos extraídos;
- ocorrências com proveniência;
- domínios/subdomínios cobertos;
- duplicatas textuais e estruturais eliminadas;
- famílias candidatas e verificadas;
- taxa de rejeição;
- dívida de auditoria.

Número de PRs ou número de arquivos Markdown não é métrica de rendimento.

## Início de cada execução

1. Leia esta rotina e o plano de fontes.
2. Reconstrua o estado atual a partir de `main`, do bundle OKF e dos manifests/artefatos de ingestão existentes.
3. Use a versão compatível mais recente de `okf-parser` para inventário, diagnósticos, relações e grafo.
4. Leia runs recentes apenas para reconstruir decisões persistidas; não carregue estado transitório no prompt.
5. Escolha preferencialmente a próxima **fonte ou corpus** que maximize ganho verificável de cobertura por custo.
6. Só escolha uma fórmula individual quando isso for necessário para validar um pipeline, resolver uma ambiguidade ou auditar uma família.

## Escopo do Atlas

Cubra domínios, disciplinas, subdisciplinas e tópicos de:

- ciências naturais;
- matemática e estatística;
- engenharia;
- medicina e saúde;
- ciência da computação;
- economia e finanças;
- ciências sociais;
- direito e regulação;
- administração, logística e pesquisa operacional;
- outras áreas de conhecimento ou prática em que relações quantitativas ou formalizações tenham identidade conceitual.

Não suponha de antemão que uma área "não usa equações".

## O que conta como estrutura

Não restrinja a coleta a expressões que uma fonte chama de "equação".

Podem entrar:

- fórmulas;
- funções;
- recorrências;
- transformações;
- kernels;
- objetivos e funções de perda;
- constraints;
- desigualdades;
- distribuições;
- leis de escala;
- regras de atualização;
- transições de estado;
- relações constitutivas;
- funções de custo;
- mapas computacionais;
- regras quantitativas legais ou regulatórias;
- modelos algorítmicos que possuam uma formalização matemática útil.

### Attested vs reconstructed

Toda ocorrência deve poder ser distinguida quanto à origem:

- **attested** — a expressão, ou forma matematicamente equivalente, aparece explicitamente na fonte;
- **reconstructed** — a fonte atesta uma função, algoritmo, regra, pseudocódigo, procedimento ou descrição e o Atlas produz uma formalização matemática fiel.

Nunca apresente uma reconstrução como se fosse a notação original da fonte.

Para `reconstructed`, preserve:

- trecho/artefato de origem;
- regra de tradução;
- hipóteses introduzidas;
- tipos/domínio das entradas e saídas;
- teste ou argumento que mostre fidelidade à operação original.

Não transforme qualquer programa arbitrário em matemática só porque é teoricamente possível. Priorize estruturas com identidade conceitual ou uso recorrente na subárea.

## Estratégia source-first

Priorize nesta ordem aproximada:

1. repositórios estruturados de fórmulas e objetos matemáticos;
2. dumps e APIs oficiais com marcação matemática;
3. corpora científicos de texto completo com LaTeX/MathML/JATS;
4. documentação técnica e repositórios de software científico;
5. legislação, regulação, manuais e padrões públicos;
6. open textbooks e handbooks;
7. web crawl apenas como fonte de descoberta ou preenchimento de cauda longa.

Antes de criar um scraper específico, procure:

- dump;
- API;
- export estruturado;
- repositório Git;
- XML/JATS/MathML;
- dataset de pesquisa já publicado;
- mirror autorizado.

Evite scraping página a página quando um caminho de bulk access existir.

## Taxonomia

Use OpenAlex e outras taxonomias especializadas como roteadores e superfícies de reconciliação, não como limite do universo do Atlas.

A taxonomia deve conseguir representar áreas ausentes ou mal servidas por classificações científicas tradicionais, inclusive direito, regulação e prática profissional.

Classifique uma ocorrência pelo contexto da fonte e preserve classificações externas como proveniência. Não force uma única árvore quando múltiplas classificações forem informativas.

## Pipeline de ingestão

Cada fonte deve passar, quando aplicável, por:

1. **snapshot/manifest** — versão, data, licença, URL/identificador e checksum;
2. **extract** — capturar expressão original e contexto;
3. **materialize** — converter o fluxo de ocorrências em shards Parquet imutáveis;
4. **publish** — enviar os Parquets e seu manifest ao Internet Archive e verificar tamanho/checksum pós-upload;
5. **classify** — associar domínio/tópico usando metadados da fonte e/ou classificadores;
6. **normalize** — gerar representação comparável sem destruir a original;
7. **deduplicate** — eliminar repetições em camadas;
8. **cluster** — produzir candidatos a famílias estruturais;
9. **verify** — testar relações fortes;
10. **promote** — materializar em OKF apenas conceitos, famílias, decisões e exemplos que mereçam identidade própria;
11. **project** — atualizar índices, métricas, UI e grafo do blog.

JSONL, CSV, XML ou outros formatos podem existir como **streams transitórios** entre extrator e materializador, mas não são o formato persistente canônico do equation lake.

## Contrato de armazenamento e publicação

A persistência bulk do Atlas usa **Apache Parquet**. Shards devem ser imutáveis, comprimidos com ZSTD quando a implementação suportar, conter schema explícito e checksums e preservar a expressão original sem normalização destrutiva.

Os Parquets persistentes devem ser publicados no **Internet Archive**. O Git guarda apenas código, schemas, manifests, checksums, metadados, pequenos fixtures e referências reproduzíveis ao item do Archive.org.

Uma aquisição massiva só conta como **persistida** quando:

1. todos os shards Parquet foram materializados;
2. cada shard possui contagem de linhas, tamanho e SHA-256 registrados;
3. os shards foram enviados a um item determinístico/versionado do Internet Archive;
4. o upload foi verificado contra os metadados de arquivo do Archive.org;
5. o manifest final, contendo identificador/URLs do item e checksums, também foi publicado no item;
6. uma cópia pequena do manifest foi registrada em Git.

Não marque `persistent_occurrences_materialized` ou equivalente como maior que zero se os Parquets ainda existirem apenas em storage efêmero/local.

Use `scripts/science-equations/materialize-parquet-ia.py` como adaptador comum quando o harvester produzir JSONL. A opção `--local-only` existe para fixtures/debugging; aquisições reais devem usar `--publish`.

Credenciais IA-S3 são segredo operacional e jamais entram no repositório, em run Markdown ou em manifests. A documentação oficial do Internet Archive exige IA-S3 para upload; trate ausência de credenciais como blocker reproduzível, não como motivo para mudar o backend silenciosamente.

## Representação em massa

Não crie milhões de arquivos Markdown.

Grandes volumes persistentes devem ser armazenados em Parquet no Internet Archive. DuckDB e ferramentas Arrow podem ser usados como índices/projeções locais regeneráveis. JSONL comprimido pode ser usado apenas quando for uma etapa intermediária explicitamente efêmera ou quando uma fonte externa já o forneça como snapshot de origem; a camada canônica adquirida pelo Atlas continua sendo Parquet.

O repositório Git deve guardar principalmente:

- schemas;
- código de ingestão;
- manifests;
- pequenos fixtures;
- documentação;
- conceitos OKF;
- famílias;
- auditorias;
- métricas agregadas.

## Proveniência mínima por ocorrência

Preserve sempre que disponível:

- `source_id`;
- versão/snapshot da fonte;
- identificador do documento/objeto;
- posição ou seletor dentro da fonte;
- expressão original;
- encoding original (TeX, MathML, código, texto etc.);
- classe de proveniência `attested` ou `reconstructed`;
- licença/restrição de reuso;
- classificação de domínio;
- checksum do registro de origem.

## Normalização

Preserve a expressão original.

Produza progressivamente representações derivadas que permitam comparar:

- igualdade textual;
- LaTeX/MathML canonicalizado;
- árvore sintática;
- equivalência algébrica;
- renomeação de variáveis com tipos;
- reescala;
- adimensionalização;
- equivalência funcional;
- equivalência dinâmica;
- operador compartilhado;
- família estrutural.

Não colapse essas relações em um único "same formula".

## Famílias

Crie ou edite um `equation-family` quando houver valor explicativo.

Uma relação forte precisa de transformação reproduzível ou argumento formal suficiente. Similaridade visual, embedding ou clustering servem para gerar candidatos, não para confirmar equivalência.

## Auditoria

A auditoria deve ser amostral e orientada por risco.

Priorize:

- fontes novas;
- clusters muito grandes;
- equivalências surpreendentes;
- reconstruções automáticas;
- domínios com semântica sensível;
- fórmulas que cruzam áreas muito distantes;
- registros com licença ou proveniência incompleta.

## Fechamento

Registre um `science-atlas-run` em `knowledge/science-equations/runs/` com:

- fonte/corpus trabalhado;
- snapshot;
- candidatos extraídos;
- candidatos aceitos/rejeitados;
- deduplicações;
- famílias propostas/verificadas;
- cobertura nova;
- dívida de auditoria;
- artefatos Parquet gerados;
- item/URLs do Internet Archive ou blocker de publicação;
- próximos corpora sugeridos pelo estado.

Valide o bundle com `okf-parser` e rode os checks normais do blog.

Uma execução boa deixa o sistema capaz de ingerir mais conhecimento com menos trabalho manual.