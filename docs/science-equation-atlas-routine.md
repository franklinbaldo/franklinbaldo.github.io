# Rotina — Scientific Equation Atlas

Esta rotina mantém o Atlas das Equações como um programa recorrente de ingestão, organização e auditoria de estruturas quantitativas usadas no conhecimento humano.

A fonte de verdade conceitual é `knowledge/science-equations/`, em Markdown OKF legível por humanos. O Atlas, porém, é planejado para milhões de ocorrências: dados massivos não viram um arquivo Markdown por ocorrência. Leia também `docs/science-equation-atlas-sources.md` e `docs/science-equation-atlas-storage.md`.

## Objetivo de escala

A unidade primária de trabalho é uma **fonte/corpus**, não uma fórmula individual. Prefira dumps, APIs, XML/JATS/MathML, datasets publicados, repositórios Git e outros canais bulk oficiais. Só faça busca página a página quando não existir caminho estruturado melhor.

Meça avanço por fontes integradas, ocorrências com proveniência, cobertura de domínios/subdomínios, rejeições, duplicatas eliminadas, famílias candidatas/verificadas e dívida de auditoria. Número de PRs ou arquivos Markdown não é métrica de rendimento.

## Início de cada execução

1. Leia esta rotina, o plano de fontes e o contrato de storage.
2. Reconstrua o estado exclusivamente de `main`, `knowledge/science-equations/` e manifests persistidos; não carregue estado transitório no prompt.
3. Use `okf-parser` para inventário, diagnósticos, relações e grafo do bundle.
4. Inspecione runs recentes apenas para reconstruir decisões persistidas.
5. Escolha a fonte/corpus com maior ganho verificável de cobertura por custo, estrutura, proveniência e risco de licença.
6. Só escolha uma fórmula isolada para validar pipeline, resolver ambiguidade ou auditar família.

## Escopo

Cubra ciências naturais, matemática e estatística, engenharia, medicina e saúde, ciência da computação, economia e finanças, ciências sociais, direito e regulação, administração, logística, pesquisa operacional e outras áreas em que relações quantitativas ou formalizações tenham identidade conceitual. Não suponha que uma área "não usa equações".

Inclua fórmulas, funções, recorrências, transformações, kernels, objetivos/losses, constraints, desigualdades, distribuições, leis de escala, regras de atualização, transições de estado, relações constitutivas, funções de custo, mapas computacionais, regras quantitativas legais/regulatórias e modelos algorítmicos com formalização matemática útil.

## Attested vs reconstructed

Toda ocorrência deve ser classificada como:

- **attested** — a expressão, ou forma matematicamente equivalente, aparece explicitamente na fonte;
- **reconstructed** — a fonte atesta função, algoritmo, regra, pseudocódigo, procedimento ou descrição, e o Atlas produz uma formalização matemática fiel.

Nunca apresente reconstrução como notação original. Para `reconstructed`, preserve artefato de origem, regra de tradução, hipóteses introduzidas, tipos/domínios e teste ou argumento de fidelidade.

## Um adapter por source

Cada fonte tem um adapter próprio de aquisição e extração. O adapter deve:

1. descobrir e pinçar um snapshot oficial;
2. adquirir pelo canal bulk preferido;
3. extrair ocorrências fiéis com proveniência;
4. preservar licença/restrições;
5. emitir um stream transitório aceito pelo materializer comum.

O adapter não decide o armazenamento final. Todos desembocam no mesmo lake Parquet e no mesmo publisher do Internet Archive.

## Pipeline

Quando aplicável, cada fonte passa por:

1. **snapshot/manifest** — versão, data, licença, URL/identificador e checksum;
2. **extract** — expressão original e contexto;
3. **classify** — domínio/tópico;
4. **normalize** — representação comparável sem destruir o original;
5. **deduplicate** — camadas progressivas;
6. **cluster** — candidatos a famílias;
7. **verify** — relações fortes;
8. **promote** — materializar em OKF apenas conceitos/famílias/decisões com identidade própria;
9. **publish** — Parquet + Internet Archive + manifest leve no Git.

## Lake e publicação

Apache Parquet é o formato canônico de armazenamento em massa. JSONL/CSV podem existir somente como entrada transitória ou interoperabilidade. Separe, quando aplicável, estágios `extracted`, `normalized` e `deduplicated`, preservando expressão original e proveniência em todos eles.

Particione por fonte, snapshot e estágio sem criar milhões de arquivos pequenos. Cada lote deve ter schema versionado, row counts, estatísticas, SHA-256 por shard e manifest determinístico.

Parquets e manifests do snapshot são publicados no **Internet Archive** a partir de Jatobá, sandbox ou outro executor explicitamente disponível. Não use GitHub Actions para aquisição, processamento, geração de Parquet ou upload. O fluxo obrigatório é `UPLOAD -> VERIFY -> COMMIT MANIFEST`.

O Git guarda somente código, schemas, manifests leves, checksums, Internet Archive identifiers/URLs, proveniência, documentação, OKF, auditorias e runs. Nunca guarde shards massivos no histórico Git.

Snapshots publicados são imutáveis por identidade: nova versão da fonte gera novo item/identificador. Se a licença não permitir redistribuição do bruto, publique apenas derivados permitidos e registre origem, snapshot, licença e checksums suficientes para auditoria.

## Proveniência mínima

Preserve sempre que disponível:

- `source_id`;
- versão/snapshot;
- identificador do documento/objeto;
- posição/seletor na fonte;
- expressão original;
- encoding original;
- `attested`/`reconstructed`;
- licença/restrição de reuso;
- classificação de domínio;
- checksum do registro de origem.

## Normalização e deduplicação

Preserve a expressão original. Compare progressivamente por:

- igualdade source-exact/textual;
- LaTeX/MathML canonicalizado;
- árvore sintática;
- equivalência algébrica;
- renomeação tipada;
- reescala/adimensionalização;
- equivalência funcional;
- equivalência dinâmica;
- operador compartilhado;
- família estrutural.

Não colapse tudo em `same formula`. Clustering/embeddings geram candidatos; relações fortes e `equation-family` exigem transformação reproduzível ou argumento formal suficiente.

## Taxonomia e auditoria

Use OpenAlex e taxonomias especializadas como roteadores, não como limite do universo. Preserve múltiplas classificações quando forem informativas, especialmente em direito, regulação e prática profissional.

A auditoria é amostral e orientada por risco. Priorize fontes novas, clusters muito grandes, equivalências surpreendentes, reconstruções automáticas, domínios sensíveis, cruzamentos distantes e registros com licença/proveniência incompletas.

## Fechamento

Registre um `science-atlas-run` em `knowledge/science-equations/runs/` com fonte/corpus, snapshot, executor, Internet Archive identifier, Parquet manifests/shards, quantidades extraídas/normalizadas/deduplicadas, rejeições, famílias candidatas/verificadas, cobertura nova, dívida de auditoria e próximos corpora sugeridos pelo estado.

Valide o bundle com `okf-parser` e rode os checks locais/reprodutíveis do blog. Uma execução boa deixa o sistema capaz de ingerir mais conhecimento com menos trabalho manual.
