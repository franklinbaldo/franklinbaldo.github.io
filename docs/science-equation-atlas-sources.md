# Scientific Equation Atlas — plano de fontes

O Atlas deve crescer por **integração de corpora**, não por busca manual de uma fórmula por vez.

Este documento registra a estratégia estável para encontrar grandes volumes de estruturas quantitativas. Estado operacional, progresso de cada importador, contagens e snapshots pertencem aos runs/manifests.

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

## Readiness antes de volume

Uma fonte grande não é automaticamente uma fonte de harvest. Cada corpus deve ser classificado antes da ingestão:

- **harvest-ready** — bulk/API oficial e direitos suficientemente claros para o uso planejado;
- **license-filtered** — pode ser analisado em escala, mas cada documento/registro precisa passar por filtro de licença ou política de redistribuição;
- **index-only** — pode orientar descoberta, classificação ou linking, mas o Atlas não deve republicar o conteúdo em massa;
- **reference-only** — excelente para curadoria e verificação, mas os termos impedem bulk copying/redistribution;
- **discovery-only** — útil para achar fontes primárias melhores, não como origem canônica do corpus.

Nunca inferir permissões a partir do fato de uma página ser pública. O manifest de cada snapshot deve registrar a política/licença observada e o caminho oficial de acesso.

## Classe A — fontes estruturadas de alta precisão

### Wikidata — defining formula (P2534)

Primeiro alvo natural para bootstrap: a fórmula já está associada a uma entidade conceitual. O dado estruturado do Wikidata é CC0 e a propriedade P2534 possui uma ordem de grandeza de `10^5` usos; registre a contagem exata no run do snapshot, não neste plano estável.

Fontes oficiais:

- [Wikidata P2534 — defining formula](https://www.wikidata.org/wiki/Property:P2534)
- [documentação e contagem de P2534](https://www.wikidata.org/wiki/Property_talk:P2534)
- [Wikidata licensing](https://www.wikidata.org/wiki/Wikidata:Licensing)

Uso esperado:

- bootstrap de dezenas de milhares de fórmulas explícitas;
- ligação imediata com conceitos/QIDs;
- símbolos e entidades quando P7235/P9758 estiverem presentes;
- sementes de deduplicação contra outras fontes.

O importador deve guardar QID, statement id quando disponível, expressão original, rank, qualificadores, referências e identificadores dos símbolos.

**Readiness:** `harvest-ready`.

### OEIS

O conteúdo completo pode ser obtido em bulk e mantido incrementalmente; o próprio projeto disponibiliza arquivos de download e o repositório `oeisdata`. O conteúdo é CC BY-SA 4.0, portanto atribuição e share-alike precisam acompanhar qualquer redistribuição derivada que entre no escopo da licença.

Fontes oficiais:

- [OEIS bulk download](https://oeis.org/wiki/Download)
- [OEIS End-User License](https://oeis.org/wiki/The_OEIS_End-User_License_Agreement)

Não trate cada sequência como "equação". Extraia separadamente:

- fórmulas;
- recorrências;
- generating functions;
- transforms;
- relações entre sequências.

É uma fonte particularmente boa para famílias discretas, recorrências, combinatória e estruturas que também aparecem em ciência da computação teórica.

**Readiness:** `harvest-ready`, preservando atribuição/licença.

### LMFDB

Base estruturada de objetos matemáticos com API e downloads; a documentação oficial informa que os dados subjacentes são CC BY-SA.

Fonte oficial:

- [LMFDB access options](https://www.lmfdb.org/api/options)

Útil para equações/parametrizações associadas a:

- curvas elípticas;
- formas modulares;
- campos numéricos;
- funções L;
- grupos;
- outros objetos aritméticos.

Aqui o desafio não é OCR: é traduzir schemas matemáticos ricos para ocorrências e famílias sem apagar o tipo do objeto.

**Readiness:** `harvest-ready`, respeitando limites operacionais e CC BY-SA.

### NIST DLMF / DRMF

A DLMF é uma referência de altíssima qualidade para funções especiais, identidades, equações diferenciais, aproximações e relações matemáticas e expõe representações úteis para auditoria semântica.

Porém, os [notices oficiais da DLMF](https://dlmf.nist.gov/about/notices) proíbem bulk copying, reproduction ou redistribution. Portanto ela **não** deve aparecer na fila de harvest massivo do Atlas.

Use-a para:

- validar clusters e nomenclatura;
- testar normalizadores em pequenas amostras permitidas;
- conferir condições de validade;
- resolver ambiguidades entre fórmulas já obtidas de fontes compatíveis.

**Readiness:** `reference-only`.

## Classe B — literatura científica em escala

### PubMed Central Article Datasets / JATS

Canal prioritário para medicina, life sciences e áreas biomédicas porque o full text é estruturado em JATS XML, no qual matemática pode aparecer como `disp-formula`, `inline-formula`, MathML ou TeX/LaTeX.

Em agosto de 2026 o PMC concluiu a migração dos Article Datasets: os antigos arquivos dos serviços FTP/Cloud foram retirados e o **PMC Cloud Service em AWS** tornou-se o canal principal. Não construa importador novo sobre o antigo OA Web Service/FTP.

Fontes oficiais:

- [PMC Article Datasets via AWS](https://pmc.ncbi.nlm.nih.gov/tools/pmcaws/)
- [anúncio da transição de 2026](https://ncbiinsights.ncbi.nlm.nih.gov/2026/02/12/pmc-article-dataset-distribution-services/)
- [JATS `disp-formula`](https://jats.nlm.nih.gov/articleauthoring/tag-library/1.4/element/disp-formula.html)
- [JATS `inline-formula`](https://jats.nlm.nih.gov/articleauthoring/tag-library/1.4/element/inline-formula.html)

A licença varia por artigo. Preserve licença no nível do documento e só publique/redistribua conteúdo conforme ela permitir. O pipeline deve preferir XML estruturado a PDF/OCR.

**Readiness:** `license-filtered` com acesso bulk oficial.

### arXiv

Fonte enorme de expressões LaTeX atestadas. O arXiv fornece PDFs e source files em S3 requester-pays, com manifests e atualização aproximadamente mensal.

Fonte oficial:

- [arXiv Full Text via S3](https://info.arxiv.org/help/bulk_data_s3.html)
- [arXiv licenses](https://info.arxiv.org/help/license/index.html)

O pipeline deve capturar, quando autorizado:

- display math;
- inline math semanticamente relevante;
- labels/references;
- seção e contexto;
- macros resolvidas sem destruir a fonte;
- arXiv id e versão;
- categoria do paper;
- licença do item.

A licença padrão do arXiv dá ao arXiv direito de distribuição, mas não dá automaticamente a terceiros direito de redistribuir os artigos. O próprio arXiv orienta ferramentas construídas sobre full text a apontarem de volta ao arXiv para downloads; outras licenças aparecem apenas em uma fração dos submissions e podem ser lidas no OAI-PMH.

**Readiness:** `license-filtered/index-only` por padrão; harvest redistribuível apenas onde a licença do item autorizar.

### Semantic Scholar / S2ORC

Corpus machine-readable útil para cobertura e contexto fora do arXiv.

Antes de harvest, cada versão do dataset precisa de auditoria explícita de acesso, licença, campos preservados e permissões de redistribuição. Quando a camada disponível não preservar matemática suficientemente bem, use-a como roteador/contexto em vez de reconstruir expressões sem evidência.

**Readiness:** `license-filtered` até o manifest de uma versão concreta ser auditado.

## Classe C — taxonomia e roteamento

### OpenAlex

OpenAlex não é primariamente um banco de equações; é um roteador do Atlas.

Use:

- domain;
- field;
- subfield;
- topic;
- work metadata;
- localizações OA;
- classificações de trabalhos.

A taxonomia ajuda a impedir que a coleta fique presa às áreas mais familiares, mas não deve limitar direito, regulação, engenharia profissional, ciência da computação aplicada ou outros domínios fora de uma árvore científica única.

### MSC e classificações especializadas

Use MSC para matemática e classificações próprias de outras áreas quando fornecerem granularidade melhor que a taxonomia geral. Preserve múltiplas classificações quando elas forem informativas.

## Classe D — computação, algoritmos e padrões

Ciência da computação exige dois canais diferentes.

### Documentação matemática explícita

Harvest de documentação técnica de projetos de bibliotecas numéricas, ML, otimização, gráficos, criptografia, bancos de dados, redes, processamento de sinais e computação científica. Equações efetivamente presentes na documentação são `attested`.

### Formalização reconstruída

Muitas estruturas centrais aparecem como:

- função;
- pseudocódigo;
- recurrence;
- update rule;
- algoritmo;
- API;
- transformação;
- loss/objective;
- scheduler;
- state transition;
- invariantes e constraints.

O Atlas pode produzir uma equação equivalente, mas ela deve ser `reconstructed`. Preserve o código/pseudocódigo/regra original, os tipos de entrada/saída, a regra de tradução e um teste de equivalência operacional sempre que viável.

Não formalize qualquer programa arbitrário apenas porque isso é possível. Priorize operações nomeadas, algoritmos recorrentes e objetos com identidade conceitual na subárea.

### IETF RFC series

A série RFC é uma fonte de alto valor para redes, protocolos, segurança, algoritmos e cálculos operacionais. Há mais de 9000 RFCs; documentos recentes têm RFCXML como raw source desde RFC 8650.

Fonte oficial:

- [IETF — RFCs](https://www.ietf.org/process/rfcs/)

Os RFCs podem ser baixados, copiados, publicados, exibidos e distribuídos sob a licença do IETF Trust, mas há restrições relevantes a modificações fora do Standards Process. O Atlas deve guardar a expressão original/posição e tratar qualquer formalização derivada como `reconstructed`, sem apresentar texto modificado como RFC.

**Readiness:** `harvest-ready` para indexação/extração com preservação da licença e das restrições de modificação.

## Classe E — direito, regulação e regras quantitativas

Direito entra quando existe estrutura quantitativa real, não apenas porque números aparecem no texto.

Inclua tanto fórmulas explícitas quanto regras quantitativas que possam ser formalizadas com fidelidade, por exemplo:

- benefícios e tributos;
- juros, atualização e correção monetária;
- rateios e indenizações;
- limites, thresholds e faixas;
- tarifas e price caps;
- modelos prudenciais e regulatórios;
- cálculos previdenciários;
- antitruste e regulação econômica;
- sentencing formulas/guidelines onde existirem;
- normas técnicas incorporadas a regimes jurídicos.

Uma fórmula impressa na norma é `attested`. Uma regra verbal traduzida para matemática é `reconstructed` e deve manter o texto normativo de origem, jurisdição, dispositivo, versão/vigência, hipóteses introduzidas e teste por exemplos de fronteira.

### GovInfo / CFR / eCFR

O GovInfo possui API e repositório oficial de **bulk XML**. Entre as coleções disponíveis estão CFR anual, eCFR corrente, Federal Register, bills, Statutes at Large e outras coleções legislativas/regulatórias. Isso cria uma fonte de alto rendimento para direito + engenharia regulada sem scraping de página individual.

Fontes oficiais:

- [GovInfo Developer Hub](https://www.govinfo.gov/developers)
- [Code of Federal Regulations](https://www.govinfo.gov/help/cfr)

O CFR anual é a edição legal oficial correspondente; o eCFR é uma compilação editorial continuamente atualizada e deve ser marcado como tal, com snapshot/data.

**Readiness:** `harvest-ready` para texto/XML público, preservando coleção, título, parte/seção e data da versão.

### União Europeia e Brasil

Alvos de alto valor incluem EUR-Lex/Cellar e fontes oficiais brasileiras de legislação, tributação, previdência e reguladores setoriais. Eles entram na fila **somente após** confirmar canal oficial de bulk/API, política de automação e formato do snapshot; não invente um endpoint porque o texto seja público.

Para o Brasil, procurar primeiro fontes oficiais estruturadas e datasets/serviços de Planalto, Câmara, Senado, Receita, Banco Central, CVM, SUSEP, ANEEL, ANATEL, ANS e demais reguladores antes de recorrer a PDF/OCR ou scraping.

## Classe F — livros, handbooks e material didático

Open textbooks, handbooks, standards e revisões técnicas são excelentes para:

- nomes canônicos;
- explicações de variáveis;
- condições de validade;
- fórmulas centrais;
- auditoria semântica de clusters vindos de fontes massivas.

Eles são prioritariamente camada de **curadoria**. A licença e os termos de cada coleção precisam ser verificados; não assuma que "open textbook" significa permissão irrestrita de bulk redistribution.

## Classe G — web em escala

Common Crawl e web search são cauda longa, não primeira escolha.

Use para descobrir:

- handbooks públicos;
- manuais técnicos;
- documentação esquecida;
- fórmulas em páginas especializadas;
- corpora ainda não cadastrados.

Antes de extrair do crawl, tente encontrar a fonte original em formato estruturado. A página encontrada na web pode ser apenas um ponteiro para uma fonte melhor e com direitos mais claros.

**Readiness:** `discovery-only` por padrão.

## Priorização

O scheduler deve preferir fontes com alta combinação de:

\[
\text{valor}\approx
\frac{\text{rendimento esperado}\times\text{estrutura}\times\text{proveniência}\times\text{diversidade}}
{\text{custo de ingestão}\times\text{risco de licença}\times\text{ruído}}
\]

A expressão é uma heurística de planejamento, não uma métrica científica fixa.

Fila inicial de infraestrutura, sujeita ao estado real do corpus:

1. **Wikidata P2534** — alto volume, CC0, entidade + fórmula;
2. **OEIS** — bulk explícito para recorrências/fórmulas discretas;
3. **LMFDB** — objetos matemáticos estruturados;
4. **GovInfo/CFR/eCFR** — primeira grande faixa de direito/regulação;
5. **PMC Article Datasets/JATS** — medicina/life sciences com licença por item;
6. **IETF RFCXML** — ciência da computação/redes/padrões;
7. **arXiv** — enorme, porém com filtro de licença e política de não redistribuição por default;
8. documentação e repositórios de software por subárea;
9. corpora europeus e brasileiros depois de auditoria de canal bulk;
10. S2ORC e outros corpora científicos após auditoria de versão/licença;
11. Common Crawl para descoberta de cauda longa.

**DLMF não entra nessa fila de harvest**: permanece referência de curadoria por restrição explícita a bulk copying/redistribution.

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

Uma ocorrência pode ser duplicata textual sem ser semanticamente redundante: a mesma expressão pode ter significados distintos em áreas diferentes. Preserve contexto e tipos antes de colapsar.

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

O Git guarda schemas, importadores, manifests, checksums, pequenos fixtures, documentação, conceitos OKF e resultados agregados. O snapshot massivo pode morar em storage apropriado e ser reproduzível a partir do manifest.

O site usa índices/projeções para busca e navegação; não precisa carregar o dataset inteiro no build.

## Critério de sucesso

A pergunta de uma execução não é:

> qual fórmula vamos adicionar hoje?

É:

> qual fonte podemos integrar agora que aumenta de forma reproduzível o universo de estruturas formalizadas pelo Atlas?
