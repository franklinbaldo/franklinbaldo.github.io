# NORAD 528 — ajuste e validação fora da amostra dos 45 TLEs

**Execução:** 10/11/2026, Kaggle (CPU), [notebook privado](https://www.kaggle.com/code/franklinbaldo/conde-1963-historical-tle-audit), versão 4.
**Entrada:** espelho anual de Space-Track 1963, [oxzoid/space-track-tle-history](https://huggingface.co/datasets/oxzoid/space-track-tle-history), SHA-256 `c4bf072a8fc1084506a6146ec79f97d8f8a918fdbe2fabdd16e8cc077f3ddc09`.
**Códigos/resultados:** `scripts/research/conde_528_fit.py` e `docs/research/data/conde-528-fit-results.json`.

## Modelo e seus limites

Utilizados os 45 TLEs do objeto 528 entre 17/01/1963 e 27/10/1963; nenhuma coordenada de Conde foi empregada no ajuste.

Convertemos movimento médio `n` em altitude **circular equivalente**, com `μ=398600.4418 km³/s²`, `R=6378.137 km`. O modelo simplificado usa:

```
dh/dt = -K exp[(h_ref - h)/H] sqrt[(R+h)/(R+h_ref)]
```

Aqui `K` é a taxa de descida na altitude de referência e `H` é a escala atmosférica efetiva, ambos ajustados com mínimos quadrados. A integração é feita por quadratura de tempo versus altitude, com fronteira convencional de **120 km**. Ela **não** representa densidade histórica efetiva, componentes de força 3D, radiação solar variável, SGP4 ou certificação intervalar.

Compararam-se curvas exponencial e quadrática de movimento médio. Em quatro cortes, modelos foram calibrados **apenas com épocas anteriores ao corte**, e avaliados em todos os TLEs posteriores até 27/10.

## Validação temporal

RMSE de movimento médio em revoluções/dia (menor é melhor):

| Último período de treinamento | Pontos de treino | Pontos reservados | Modelo físico exponencial | Exponencial em n | Quadrático em n |
|---|---:|---:|---:|---:|---:|
| até 31/08 | 29 | 16 | 0.04965 | 0.07555 | 0.08043 |
| até 28/09 | 37 | 8 | 0.05393 | 0.08081 | 0.09061 |
| até 11/10 | 41 | 4 | 0.06151 | 0.09370 | 0.10836 |
| até 21/10 | 43 | 2 | 0.04609 | 0.09326 | 0.11686 |

No corte de **11/10**, o modelo físico prevê para o último TLE movimento médio **0.08606 rev/dia abaixo do observado**. O erro é sistemático: os três modelos subestimam a aceleração do decaimento no fim de outubro. A melhoria relativa sobre curvas estatísticas **não significa validade para a fase final**.

Separando os cinco últimos TLEs (treino até 09/10), os erros assinados do modelo físico em `n` foram -0.00354, -0.02642, -0.04344, -0.07504 e -0.08823 rev/dia. Novamente existe viés de subestimação crescente.

## Instabilidade da extrapolação até 8/11

Calibrando de novo em diferentes subconjuntos e usando 120 km como condição terminal artificial:

| Treino | Chegada calculada a 120 km | Observação |
|---|---|---|
| Todos 45 | ~09/11/1963 12:40 UTC | Em 08/11 às 12h prevê altitude circular equivalente ~238.76 km |
| Últimos 25 | ~03/11/1963 07:04 UTC | Reentrada prevista antes da data catalogada |
| Últimos 15 | ~04/11/1963 19:24 UTC | Reentrada prevista antes da data catalogada |
| Últimos 10 | ~01/11/1963 01:09 UTC | Reentrada prevista antes da data catalogada |

**Essas são saídas de cenários não validados, não estimativas históricas de horário de reentrada.** O código não atribui probabilidades a elas nem produz latitude e longitude final. O divergente comportamento entre janelas é evidência de instabilidade do modelo e inviabiliza usar os resultados como um corredor geográfico confiável.

## Conclusão experimental

1. O modelo de arrasto exponencial explica melhor as observações tardias que as duas curvas estatísticas comparadas, porém apresenta erro fora da amostra de ~0.046–0.062 rev/dia e viés crescente em outubro.
2. A extrapolação até novembro **não é robusta**: a data prevista depende fortemente da janela de treinamento, de parâmetros atmosféricos constantes e do limiar arbitrário de 120 km.
3. Nenhuma conclusão sobre Conde, Rondônia ou qualquer longitude pode ser retirada. Os dados de fase orbital, RAAN e época de observação não foram propagados nesta análise.
4. Para tentar falsificar hipóteses com Lean, é preciso primeiro ter integrador orbital com erro controlado e modelagem temporal da densidade atmosférica; o atual módulo de alcançabilidade 1D é abstrato.
5. Próxima abordagem mais informativa: ajustar modelos de densidade com F10.7/Kp/ap históricos; validar contra TLEs retirados do treinamento, especialmente no fim de setembro/outubro; só depois estimar incerteza sobre novembro.

**Não introduzir no artigo qualquer previsão única de queda baseada nestes ajustes.**
