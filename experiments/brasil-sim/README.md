# BrasilSim: modelo econômico e previsões automáticas

Objetivo: laboratório econômico ambicioso com 215 milhões de pessoas representadas por 100 mil agentes ponderados, 127 categorias estatísticas iniciais e número endógeno de variedades. Não há entidade fundamental "empresa": pessoas, tempo, recursos, produtos, dinheiro e relações estruturais são o núcleo.

## Contrato de inputs

Cada variável primitiva declara magnitude, unidade, shape de distribuição, fonte e data. Variáveis derivadas são calculadas por equações e conservação. Correlações são outputs, não inputs por padrão. Âncoras oficiais permanecem distinguíveis de parâmetros livres.

## Fontes e atualização

Consultar diariamente fontes oficiais, preservando a data de referência original e a periodicidade de cada série. Começar com Banco Central SGS: Selic diária (11), IPCA mensal (433), IBC-Br mensal (24363). Expandir para IBGE, Tesouro, Ipea e Comex Stat. Não inventar observações nem preencher falhas silenciosamente.

## Modelo e inferência

Usar UEKG como fonte de equações com unidades, hipóteses, domínios e evidências. Usar paper MMT como fonte de identidades e proposições condicionais, não como lei empírica de inflação. Construir motor estrutural de produção e consumo por pessoa, conservação física e financeira, distribuições de propriedade e produtividade. Estimar parâmetros livres por MCMC/SMC, com identificabilidade e validação fora da amostra.

## Outputs

Publicar todas as séries derivadas úteis: produção por atividade e produto, estoques, variedades, preços, inflação, PIB, emprego, horas, produtividade, renda e patrimônio por quantil, crédito, juros, tributos, dívida, comércio exterior, desigualdade, longevidade e valência. Para cada output: cenário, horizonte, p05/p50/p95, hipótese, origem dos dados, data de observação e backtest. Exibir também falhas e erros do modelo.

## Execução por fatias

1. Coletor diário oficial e snapshots reproduzíveis.
2. Primeiro baseline de previsão probabilística e backtesting.
3. Publicação de gráficos e resultados no blog.
4. Motor estrutural com 100 mil agentes ponderados e catálogo dinâmico.
5. UEKG, inferência MCMC/SMC, cenários e cobertura ampliada.

Este documento define o contrato do projeto, não afirma que o simulador já foi executado.
