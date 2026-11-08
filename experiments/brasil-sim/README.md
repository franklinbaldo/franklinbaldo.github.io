# BrasilSim 0.1 — laboratório de previsão econômica brasileira

Protótipo executável do **simulador people-first**, sem entidades "empresa": 100.000 agentes sintéticos ponderados representam 215 milhões de pessoas, com 127 categorias iniciais de produtos e variedades comerciais dinâmicas.

## Fonte de verdade e atualização

O próprio blog atualiza as projeções no GitHub Actions de publicação diária. A coleta é **sempre** das APIs oficiais do **Banco Central do Brasil / SGS**, sem copiar dados de blogs ou redes sociais:

| Série | Código SGS | Frequência | Uso |
| --- | --- | --- | --- |
| Meta Selic | 432 | Diária | Cenário de política monetária |
| IPCA | 433 | Mensal | Inflação mensal observada |
| IBC-Br com ajuste sazonal | 24364 | Mensal | Índice de atividade, **não PIB** |

A execução usa o valor Selic mais recente não posterior à data da coleta; IPCA e IBC-Br são alinhados por **mês de referência publicado**. Nenhuma observação mensal ausente é inventada. As séries, datas de coleta e SHA-256 dos dados recebidos ficam no JSON publicado.

Endpoint por série: https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados/ultimos/150?formato=json

**Atualização diária não significa observação diária de todas as variáveis.** Quando não houver nova divulgação, o modelo ainda roda com o último conjunto oficial disponível, registrando a defasagem de referência.

## Duas camadas diferentes

1. **Macroeconômica inferencial:** taxa de crescimento do IBC-Br e IPCA mensal previstos usando um modelo ARX bayesiano com persistência, juros reais, atividade, desvio da inflação e erros. Os nove parâmetros livres são amostrados por Metropolis com priors limitados. Intervalos p05/p50/p95 são marginais sobre parâmetros *e* choques. Não são previsões do próprio BCB, nem identificam efeitos causais de política.
2. **Economia sintética de pessoas e produtos:** produtividade normalizada beta, disponibilidade de tempo beta, patrimônio lognormal, propriedade/capital individual e 127 categorias. Pessoas produzem; estoques físicos atendem consumo; preços e variedades mudam. Há resultados por categoria, por cenário e por mês. **Esta camada é condicionada à trajetória macro prevista** e ainda não determina independentemente o IBC-Br ou o IPCA.

Ainda não é um SFC completo nem uma formalização de todas as equações do UEKG. Não interpretamos índices monetários sintéticos como reais, nem o índice subjetivo de satisfação como valência observada ou QALY. Longevidade permanece explicitamente nula até existir uma ponte causal calibrável.

Referências locais: [UEKG](./references/universal_equation_knowledge_graph.md) e [MMT](./references/mmt-minimal-core-lean4.md).

## Previsões públicas e outputs

Após a publicação: [Painel BrasilSim](https://franklinbaldo.github.io/brasil-sim/).

Arquivos derivados no deploy (não editados manualmente):
- \`latest.json\`: entrada bruta e hashes, metadados, posterior, diagnósticos, backtest, todos os cenários, resumos por pessoa e produto;
- \`forecast.csv\`: todos os horizontes e quantis por indicador/cenário;
- \`micro.csv\`: renda, patrimônio, concentração, estoques, disponibilidade, bem-estar sintético, variedades e correlações emergentes;
- \`products.csv\`: 127 categorias × 24 meses × 3 cenários, estoques, produção, vendas, preços, escassez e variedades.

Os cenários são Selic constante, menos 2 p.p. e mais 2 p.p.; **não são recomendações de taxa**. A política usada é aplicada a todos os 24 meses do horizonte.

## Reproduzir

Python 3.11+; somente biblioteca padrão.

\`\`\`bash
python3 -m unittest discover -s experiments/brasil-sim/tests -v
python3 experiments/brasil-sim/model.py --output public/brasil-sim
\`\`\`

Para reprodução offline, passar um JSON de snapshot do campo \`official_series\` reorganizado em \`series\`, \`provider\` e \`retrieved_utc\`; a suíte de testes inclui um gerador sintético marcado \`TEST FIXTURE - NOT OFFICIAL\` que **nunca** é publicado como previsão do Brasil.

## Critérios de melhoria

- Recalcular a cada nova divulgação, guardando *as of dates*, e executar avaliações retrospectivas sem vazamento de futuro.
- Testar MCMC com cadeias múltiplas e diagnóstico de convergência/identificabilidade (v0.1 não certifica convergência).
- Mapear categorias reais e matriz insumo-produto de 127 produtos, substituir a microcamada condicionada por equações de produção/mercados endógenos.
- Adicionar famílias de dados oficiais, distribuições empíricas, contabilidade monetária SFC e quantificação séria de bem-estar.
- Ligação tipada ao UEKG com prova de compatibilidade dimensional/semântica antes da promoção de uma equação.
