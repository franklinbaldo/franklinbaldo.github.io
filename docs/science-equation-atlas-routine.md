# Rotina — Scientific Equation Atlas

Esta rotina mantém o Atlas das Equações como um programa de pesquisa recorrente no próprio blog.

A fonte de verdade é `knowledge/science-equations/`: Markdown OKF normal, legível por humanos. Não crie um banco JSON, YAML agregado ou catálogo paralelo para representar o mesmo conhecimento. Projeções TypeScript, páginas Astro, DuckDB, Ibis e grafos são derivados regeneráveis.

## Início de cada execução

1. Leia esta rotina e reconstrua o estado atual a partir do bundle.
2. Use a versão compatível mais recente de `okf-parser` para inspecionar inventário, links, diagnósticos e grafo.
3. Leia os runs recentes e derive a fronteira atual do corpus. Estado transitório não pertence a este documento.
4. Verifique mudanças relevantes no prior art antes de inventar uma taxonomia, tipo ou relação nova.

Fontes de prior art que merecem consulta recorrente incluem OpenAlex, OECD/FORD, MSC, Wolfram Formula Repository, EqWorld, OntoMathPro, Bootstrap, textbooks, handbooks, standards e revisões técnicas.

## Escolha do trabalho

Escolha uma unidade pequena e verificável. Prefira, conforme o estado real do corpus:

- grandes regiões da ciência ainda sem amostragem;
- branches abertos sem fórmulas suficientemente justificadas;
- fórmulas candidatas sem evidência;
- ocorrências verificadas ainda sem normalização;
- hipóteses de equivalência ainda não demonstradas;
- famílias com alto potencial transdisciplinar;
- auditoria de relações antigas, especialmente as mais surpreendentes.

Não aprofunde indefinidamente uma única disciplina enquanto áreas inteiras continuam vazias.

## Descoberta e evidência

Para cada ramo selecionado, procure fórmulas reconhecidamente usadas naquele domínio. Não suponha que todo ramo possua fórmula canônica.

Uma fórmula nova deve ter, quando aplicável:

- expressão LaTeX no frontmatter para projeção da UI;
- explicação humana no corpo;
- variáveis e unidades;
- condições de validade e aproximações;
- por que e como é usada;
- fonte técnica suficiente para sustentar a alegação;
- links Markdown para os branches relevantes.

Diferencie fórmula conhecida, central, frequente, histórica e especializada quando a evidência permitir. Não transforme intuição do agente em frequência de uso.

## Normalização e grafo

Preserve sempre a expressão científica original.

Quando duas ocorrências parecerem compartilhar matemática, teste explicitamente relações como:

- igualdade;
- equivalência algébrica;
- renomeação de variáveis;
- reescala;
- adimensionalização;
- caso especial;
- generalização;
- aproximação;
- limite;
- discretização;
- solução de;
- mesma família de equações;
- mesma dinâmica;
- operador compartilhado.

Crie ou edite um `equation-family` apenas quando a abstração for útil. Mostre no Markdown a transformação que justifica a relação. Sem transformação ou argumento reproduzível, registre como hipótese, não como equivalência verificada.

As arestas canônicas são os próprios links Markdown. O código em `src/data/science-equations.ts` apenas os projeta para a interface.

## Auditoria

Cada execução deve procurar ao menos uma oportunidade real de corrigir conhecimento antigo: fonte fraca, importância exagerada, branch inadequado, duplicata, equivalência forte demais, condição de validade omitida ou relação que não se reproduz.

## Fechamento

Registre um `science-atlas-run` em `knowledge/science-equations/runs/` com o que foi adicionado, corrigido, rejeitado e qual fronteira ficou evidente.

Valide o bundle com `okf-parser` usando as specs de `specs/okf-types/`. Depois rode os checks normais do blog antes da PR.

A execução é boa quando deixa o corpus mais correto, mais abrangente, mais conectado ou mais auditável — não quando simplesmente aumenta o número de fórmulas.
