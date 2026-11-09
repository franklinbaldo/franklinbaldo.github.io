# Referências do BrasilSim — UEKG e MMT

Cópias integrais de dois manuscritos de `franklinbaldo/papers` para uso local na pesquisa e implementação do BrasilSim. **Não são novos posts publicados automaticamente** e não substituem as fontes canônicas.

## Proveniência (snapshot em 2026-11-08)

Repositório de origem: `franklinbaldo/papers` — commit `a175b4441321d86bbfb204ac7c22cc7faf9b07b4`.

| Cópia local | Arquivo original | Git blob SHA original |
| --- | --- | --- |
| [UEKG](./universal_equation_knowledge_graph.md) | [universal_equation_knowledge_graph.md](https://github.com/franklinbaldo/papers/blob/a175b4441321d86bbfb204ac7c22cc7faf9b07b4/universal_equation_knowledge_graph.md) | `251a200b2f22f812564276637f4942652410c0aa` |
| [MMT](./mmt-minimal-core-lean4.md) | [monetary-formalization/mmt-minimal-core-lean4.md](https://github.com/franklinbaldo/papers/blob/a175b4441321d86bbfb204ac7c22cc7faf9b07b4/monetary-formalization/mmt-minimal-core-lean4.md) | `fd7b4590cb6066da9482cfbaa07c838fca69bc66` |

Os arquivos foram importados sem alterar seu frontmatter, linguagem ou corpo. Links relativos internos dos manuscritos continuam referindo-se à organização original de `papers`; para seguir tais links, consulte o arquivo canônico acima.

## Uso no BrasilSim

- **UEKG:** descoberta e reutilização de equações com tipagem, dimensões, regimes e contratos de transferência. Similaridade sintática não garante aplicabilidade econômica nem certificação de transferência.
- **MMT:** ponto de partida para identidades fiscais nominais e resultados condicionais, separando contabilidade, hipóteses e previsões empíricas. Não implica uma lei de inflação ou validação empírica do Brasil.
- **Parâmetros:** manter somente entradas primitivas efetivamente necessárias. Calcular variáveis derivadas por equações com premissas explícitas; tratar correlações emergentes como resultados a validar.
- **Calibração:** comparar resultados do simulador aos dados observados e usar inferência probabilística apenas nos parâmetros ainda livres e identificáveis.

O blog já contém o post [André Lara Resende e MMT: uma incompatibilidade que não aparece](../../../src/content/blog/lara-resende-mmt-lean4-compatibilidade.md) e o código em [experiments/juros-mmt-lean4](../../juros-mmt-lean4/). O paper copiado é um artefato científico distinto, não um substituto para o post ou as provas Lean.

### Limites

Os manuscritos indicam status de *draft/working paper*. Cópia não equivale a revisão independente, execução do CI ou certificação do código do BrasilSim. Para uma futura atualização, comparar explicitamente os novos blobs com as fontes e atualizar este manifesto.
