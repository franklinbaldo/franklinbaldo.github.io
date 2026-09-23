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
3. **classify** — associar domínio/tópico usando metadados da fonte e/ou classificadores;
4. **normalize** — gerar representação comparável sem destruir a original;
5. **deduplicate** — eliminar repetições em camadas;
6. **cluster** — produzir candidatos a famílias estruturais;
7. **verify** — testar relações fortes;
8. **promote** — materializar em OKF apenas conceitos, famílias, decisões e exemplos que mereçam identidade própria;
9. **publish** — atualizar índices, métricas e projeções do blog.

## Representação em massa

Não crie milhões de arquivos Markdown.

Apache Parquet é o formato canônico do equation lake para dados massivos. JSONL e CSV podem existir apenas como transporte transitório de adapters, aquisição ou interoperabilidade; eles não são armazenamento canônico. Use shards Parquet com compressão e manifests determinísticos, evitando milhões de arquivos pequenos. DuckDB pode ser usado como índice/projeção local regenerável.

Parquets redistribuíveis e seus manifests devem ser publicados no Internet Archive a partir de executor externo/sandbox/Jatobá, nunca via GitHub Actions. O Git guarda apenas código, schemas/descriptors, manifests leves, checksums, identificadores/URLs externos, documentação, conceitos OKF, famílias, auditorias e métricas agregadas.

Dados massivos gerados devem ficar fora do histórico Git normal, com referências reproduzíveis a partir dos manifests.

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
- artefatos gerados;
- próximos corpora sugeridos pelo estado.

Valide o bundle com `okf-parser` e rode os checks normais do blog.

Uma execução boa deixa o sistema capaz de ingerir mais conhecimento com menos trabalho manual.
