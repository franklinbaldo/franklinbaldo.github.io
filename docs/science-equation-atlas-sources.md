# Scientific Equation Atlas — plano de fontes

O Atlas deve crescer por **integração de corpora**, não por busca manual de uma fórmula por vez.

Este documento registra a estratégia estável para encontrar grandes volumes de estruturas quantitativas. Estado operacional, progresso de cada importador e números de execução pertencem aos runs/manifests.

## Princípio

A unidade primária de aquisição é uma fonte:

```text
fonte grande
→ snapshot
→ extração
→ candidatos
→ classificação
→ normalização
→ deduplicação
→ clusters
→ verificação
→ conceitos/famílias OKF
```

O corpus final pode conter milhões de ocorrências sem que cada uma se transforme em um arquivo Markdown.

## Classe A — fontes estruturadas de alta precisão

### Wikidata — defining formula (P2534)

Ponto de partida extremamente útil porque a fórmula já está associada a uma entidade conceitual.

Uso esperado:

- bootstrap de dezenas de milhares de fórmulas explícitas;
- ligação imediata com conceitos Wikidata;
- criação de aliases e entidades;
- sementes para deduplicação contra outras fontes.

Importador deve guardar QID, statement id quando disponível, expressão original e qualificadores/referências.

### NIST DLMF / DRMF

Fonte de alta qualidade para funções especiais, identidades, equações diferenciais, aproximações e relações matemáticas.

A DLMF oferece encodings TeX e MathML para fórmulas individuais. É excelente para construir normalizadores porque a mesma matemática já aparece em representação semântica relativamente rica.

### OEIS

O conteúdo completo pode ser obtido em bulk e mantido incrementalmente.

Não trate cada sequência como "equação". Extraia separadamente:

- fórmulas;
- recurrences;
- generating functions;
- transforms;
- relações entre sequências.

É uma fonte particularmente boa para famílias discretas, recorrências e combinatória.

### LMFDB

Base estruturada de objetos matemáticos com API, downloads e acesso SQL de leitura.

Útil para equações/parametrizações associadas a:

- curvas elípticas;
- formas modulares;
- campos numéricos;
- funções L;
- grupos;
- outros objetos aritméticos.

Aqui o desafio não é OCR: é traduzir schemas matemáticos ricos para ocorrências e famílias sem apagar o tipo do objeto.

## Classe B — literatura científica em escala

### arXiv

A principal fonte potencial para expressões LaTeX atestadas em pesquisa.

O pipeline deve preferir source files ou representações machine-readable e capturar:

- display math;
- inline math quando semanticamente relevante;
- labels/references;
- seção e contexto;
- macros resolvidas;
- arXiv id e versão;
- categoria do paper.

O Atlas NÃO deve espelhar indiscriminadamente os source bundles. Extraia apenas o que a licença e o objetivo do corpus permitem, preservando proveniência.

### Semantic Scholar / S2ORC

Corpus machine-readable de texto científico em escala de milhões de documentos.

Útil para:

- ampliar cobertura fora do arXiv;
- obter contexto textual em torno de fórmulas;
- ligar expressão a paper, seção e citações;
- cruzar com taxonomia/metadata.

Quando a camada disponível não preservar matemática suficientemente bem, use-a como roteador e contexto em vez de inventar expressão.

### PubMed Central Open Access Subset

Muito valioso para medicina e life sciences porque o full text é distribuído em JATS XML.

JATS permite recuperar estruturas matemáticas e contexto de modo mais confiável que PDF/OCR. Respeite a licença de cada artigo e use exclusivamente os serviços de bulk/text-mining autorizados pelo PMC.

## Classe C — taxonomia e roteamento

### OpenAlex

OpenAlex não é primariamente um banco de equações. É o roteador do Atlas.

Use:

- domain;
- field;
- subfield;
- topic;
- work metadata;
- localizações OA;
- classificações de trabalhos.

A hierarquia atual tem milhares de tópicos e permite garantir que a coleta não fique presa às áreas que já conhecemos.

Use também classificadores de texto quando uma fonte externa precisar ser colocada na taxonomia científica.

### MSC e classificações especializadas

Use MSC para matemática e classificações próprias de outras áreas quando elas fornecerem granularidade melhor que a taxonomia geral.

Não há obrigação de que direito, engenharia profissional ou regulação se encaixem perfeitamente no OpenAlex.

## Classe D — computação e software

Ciência da computação exige dois canais.

### Documentação matemática explícita

Harvest de documentação técnica de projetos como bibliotecas numéricas, ML, otimização, gráficos, criptografia, processamento de sinais e computação científica.

Equações em docs são `attested`.

### Formalização reconstruída

Muitas estruturas centrais aparecem como:

- função;
- pseudocódigo;
- recurrence;
- update rule;
- algoritmo;
- API;
- transformação;
- loss;
- scheduler;
- state transition.

O Atlas pode gerar uma equação equivalente, mas ela deve ser marcada `reconstructed`.

Exemplos de corpora candidatos:

- documentação e source de bibliotecas científicas;
- repositórios de algoritmos;
- especificações abertas;
- notebooks educacionais;
- coleções de benchmarks e modelos.

O importador deve manter ligação ao código/pseudocódigo de origem e um teste de equivalência operacional sempre que viável.

## Classe E — direito e regulação

Direito entra quando existe estrutura quantitativa real, não apenas porque números aparecem no texto.

Fontes de alto rendimento podem incluir:

- legislação estruturada;
- regulamentos;
- fórmulas de benefícios e tributos;
- regras de juros e atualização;
- rateios;
- indenizações;
- limites e thresholds;
- modelos regulatórios;
- tarifas;
- cálculos previdenciários;
- antitruste e regulação econômica;
- sentencing formulas/guidelines onde existirem;
- normas técnicas incorporadas a regimes jurídicos.

### Corpora candidatos

- eCFR/GovInfo em XML para regulação federal dos EUA;
- EUR-Lex/Cellar e dumps em XML para atos da União Europeia;
- fontes oficiais brasileiras em HTML/XML/PDF quando houver acesso automatizável e juridicamente seguro;
- manuais oficiais de cálculo e reguladores setoriais.

A proveniência jurídica deve incluir jurisdição, vigência/versão e natureza da fonte. Nunca misture uma fórmula normativa vigente com uma fórmula descritiva de paper sem marcar o tipo.

## Classe F — livros, handbooks e material didático aberto

OpenStax e outros OER são valiosos para:

- nomes canônicos;
- explicações de variáveis;
- condições de validade;
- fórmulas centrais de graduação;
- auditoria semântica de clusters vindos de fontes massivas.

São especialmente úteis como camada de **curadoria**, mesmo quando o volume bruto vem de outra fonte.

## Classe G — web em escala

Common Crawl e web search são cauda longa, não primeira escolha.

Use para descobrir:

- handbooks públicos;
- manuais técnicos;
- documentação esquecida;
- fórmulas em páginas especializadas;
- corpora ainda não cadastrados.

Antes de extrair do crawl, tente encontrar a fonte original em formato estruturado.

## Priorização

O scheduler deve preferir fontes com alta combinação de:

[
	ext{valor} approx
rac{	ext{rendimento esperado}	imes	ext{estrutura}	imes	ext{proveniência}	imes	ext{diversidade}}
{	ext{custo de ingestão}	imes	ext{risco de licença}	imes	ext{ruído}}
]

A expressão é uma heurística de planejamento, não uma métrica científica fixa.

Ordem inicial recomendada para construir infraestrutura:

1. Wikidata P2534;
2. DLMF;
3. OEIS;
4. PMC OA/JATS;
5. arXiv source;
6. S2ORC;
7. LMFDB;
8. documentação de software;
9. corpora legais/regulatórios;
10. Common Crawl para descoberta de cauda longa.

A ordem pode mudar quando o estado real do projeto mostrar maior retorno em outra fonte.

## Deduplicação em camadas

Não faça apenas hash de LaTeX.

Mantenha fingerprints separados:

1. source-exact;
2. text-normalized;
3. syntax-normalized;
4. algebraic candidate;
5. typed variable-renaming candidate;
6. dimensionless candidate;
7. functional/dynamical family candidate.

Embeddings e modelos podem gerar candidatos, mas nunca devem ser a evidência final de equivalência.

## Escala de armazenamento

Milhões de registros não devem ser milhões de blobs Git.

Prefira shards imutáveis:

```text
dataset/
  source=<id>/
    snapshot=<version>/
      part-00000.parquet
      part-00001.parquet
      ...
```

O Git guarda manifests, schemas, código, checksums, amostras e resultados agregados.

O site usa índices/projeções para busca e navegação; não precisa carregar o dataset inteiro no build.

## Critério de sucesso

A pergunta de uma execução não é:

> qual fórmula vamos adicionar hoje?

É:

> qual fonte podemos integrar agora que aumenta de forma reproduzível o universo de estruturas formalizadas pelo Atlas?
