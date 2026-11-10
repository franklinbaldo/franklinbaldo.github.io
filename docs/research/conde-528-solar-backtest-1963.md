# NORAD 528 — ensaio de forçantes solares e geomagnéticas (1963)

Data da execução: **10/11/2026**, [Kaggle privado](https://www.kaggle.com/code/franklinbaldo/conde-1963-historical-tle-audit), versão 5.

## Fontes verificadas

- Histórico dos TLEs 527/528/529: [Space-Track TLE History, espelho oxzoid](https://huggingface.co/datasets/oxzoid/space-track-tle-history), SHA-256 Parquet `c4bf072a8fc1084506a6146ec79f97d8f8a918fdbe2fabdd16e8cc077f3ddc09`.
- CelesTrak [Space Weather All CSV](https://celestrak.org/SpaceData/SW-All.csv), SHA-256 no dia da coleta `8f3d32bf88d106a803788bfc3f8d2ed5ee209e6cd42e4eab04b89d3d976f398c`. Colunas `F10.7_ADJ` e `AP_AVG` foram efetivamente utilizadas.
- Código: `scripts/research/conde_528_solar_fit.py`.
- Resultado bruto: `docs/research/data/conde-528-solar-validation.json`.

## Dados novos

Em 27/10/1963, CelesTrak registra `F10.7_OBS=89.0`, `AP_AVG=4`; em 08/11/1963, `F10.7_OBS=75.4`, `AP_AVG=46`. São fatos da série histórica; não identificam a hora da reentrada nem demonstram causalidade.

## Modelo testado

Mantivemos a lei de decaimento de altitude circular equivalente do experimento anterior, mas multiplicamos o arrasto por

```
forcing(t)=exp[beta_F (F10.7_adj(t)-Fref)/100 + beta_A (Ap(t-1d)-Apref)/40]
```

`K`, `H`, `beta_F` e `beta_A` são ajustados por mínimos quadrados, com penalização dos dois últimos coeficientes. O controle, com a mesma equação, tem `beta_F=beta_A=0` e apenas dois parâmetros. O índice Ap é defasado em um dia, por convenção de modelagem. Índices meteorológicos posteriores ao corte de treinamento são usados apenas como **forçantes externas de um hindcast retrospectivo**, e não como observações orbitais para calibrar parâmetros.

Esse modelo é **empírico**, não NRLMSISE-00, JB2008 ou outro modelo termoesférico físico validado. Um coeficiente `beta_A` pode ter sinal negativo pelo ajuste, sem interpretação física segura. É possível haver sobreajuste com apenas 45 observações orbitais irregulares.

## Resultado de validação fora da amostra

Erros RMSE do movimento médio, revoluções/dia:

| Corte da calibração | Controle sem clima espacial | Com F10.7 + Ap | Diferença |
|---|---:|---:|---|
| Até 31/08 | 0.049649 | 0.058149 | **pior** |
| Até 28/09 | 0.056830 | 0.056802 | melhora praticamente nula |
| Até 11/10 | 0.056588 | 0.071010 | **pior** |
| Até 21/10 | 0.055529 | 0.069871 | **pior** |

Os dois modelos subestimaram sistematicamente o movimento médio de 27/10 no corte de 11/10: erro final -0.08822 rev/dia sem clima e -0.10950 rev/dia com clima.

**Conclusão do teste:** esta implementação de dependência de F10.7/Ap **não melhorou a capacidade preditiva fora da amostra**. Não há justificativa para usá-la para estimar uma longitude final, nem para inferir que a tempestade de 8/11 determinou a queda.

## Perspectiva realista

- É possível melhorar a **história quantitativa do decaimento até 27/10**; os 45 TLEs já possibilitam testes de modelos.
- Determinar **faixas de horário/longitude sobre o Brasil em 08/11** requer propagação real de elementos orbitais com incerteza, condições atmosféricas adequadas e, idealmente, TLE/observação posterior a 27/10. O estado atual não permite corredor validado.
- Identificar **qual peça física era o 528** e verificar **se houve objeto encontrado em Conde** são problemas documentais distintos; registros locais da Bahia continuam essenciais.
- O maior valor esperado das próximas buscas está em registros originais de rastreamento, boletins de reentrada e jornais baianos, não em acrescentar livremente novos coeficientes de arrasto.

Nenhum teorema Lean foi produzido nesta rodada que prove um limite geográfico. Esses ajustes são saídas de regressão, não certificados de integração intervalar.
