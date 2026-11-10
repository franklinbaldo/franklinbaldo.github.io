# Ferret 3 — experimento conjunto de decaimento orbital

Data: 10/11/2026. **Status: análise exploratória de identificabilidade, não previsão de reentrada.**

## Pergunta e resposta

Os três objetos do lançamento de 16/01/1963 (527, 528, 529) permitem testar independentemente os ajustes que foram feitos para forçar o 528 a Conde em 08/11/1963?

**Não, com os dados hoje disponíveis.** Foram localizados apenas um TLE próximo ao término de cada objeto e as datas civis de reentrada. Não há três coordenadas geográficas de queda; os TLEs são de épocas distintas. Ao atribuir um parâmetro livre de arrasto a cada objeto, as três datas podem ser reproduzidas por construção para qualquer uma das escalas atmosféricas exemplificadas. Isso não valida latitude, longitude nem fase do 528.

## Entradas auditáveis

| NORAD | Último TLE | n (rev/dia) | h circular equivalente | Data de término |
|---|---|---:|---:|---|
| 528 | 27/10/1963 14:40:16 UTC | 15.74901460 | 344.9 km | 08/11/1963 |
| 529 | 30/12/1963 11:25:41 UTC | 16.09825765 | 247.3 km | 31/12/1963 |
| 527 | 08/01/1969 12:44:15 UTC | 16.32827153 | 185.0 km | 09/01/1969 |

São datas civis sem a hora física exata da reentrada. Para calcular um cenário demonstrativo, convencionou-se **12:00 UTC** em cada dia de término. Esse horário não está documentado.

TLEs:
- https://www.itau.magnetic-declination.com/satellite/?s=528
- https://www.itau.magnetic-declination.com/satellite/?s=529
- https://www.itau.magnetic-declination.com/satellite/?s=527

## Modelo reproduzível

Arquivo: `scripts/research/conde_joint_decay.py`. Usa apenas a biblioteca-padrão Python.

Definimos h(n) = [μ/(2πn/86400)²]^(1/3) − R, com μ=398600.4418 km³/s² e R=6378.137 km. Impondo por hipótese uma altitude terminal circular equivalente de 120 km, o movimento terminal é ~16.5737 revoluções/dia.

Para cada objeto i:
```
dn_i/dt = k_i × (n_i/n_i0)^(4/3) × exp((h_i0 − h_i)/H)
k_i = (1 / Δt_i) × ∫[n_i0,n_terminal] (n_i0/n)^(4/3) exp((h(n) − h_i0)/H) dn
```
H é comum aos três; k_i é independente por objeto e, como as épocas pertencem a anos diferentes, também incorpora a densidade atmosférica de referência e o arrasto próprio. Não inferimos Cd, área, massa ou densidade efetiva.

### Ajustes por escala de altura

| H (km) | k_528 (rev/dia²) | k_529 (rev/dia²) | k_527 (rev/dia²) |
|---:|---:|---:|---:|
| 30 | 0.00888 | 0.10549 | 0.10242 |
| 50 | 0.01467 | 0.16453 | 0.14027 |
| 70 | 0.01995 | 0.20949 | 0.16329 |

Cada linha reproduz os três tempos por construção. Os k não são diretamente comparáveis entre objetos pois estão definidos em altitudes iniciais e datas diferentes. Trata-se de simplificação circular, exponencial, não de modelo atmosférico histórico ou integração SGP4.

## O que o teste falsifica e o que não falsifica

1. **Não confirma** as trajetórias inversas previamente ajustadas para Conde (11:32/23:42 UTC): elas não foram submetidas a um teste independente de fase com esse modelo.
2. **Não discrimina** o valor de H: cada H testado permite três valores de k que reproduzem as três datas.
3. Os campos TLE de derivada de movimento médio são descritivos no formato e **não são utilizados pelo SGP4**. Nos três TLEs disponibilizados, o campo B* está zerado; portanto, aplicá-los diretamente ao SGP4 **não fornece arrasto individual confiável**.
4. O período orbital inicial comum em janeiro não está recuperado nesta investigação em forma de TLE dos três objetos. Além disso, separar-se com pequenas diferenças de velocidade pode gerar evoluções de longo prazo distintas.

## Próximo teste realmente independente

- Obter séries históricas de TLEs dos objetos 528/529/527, sobretudo 01–08/11/1963 e primeiras semanas após 16/01/1963.
- Obter densidade histórica baseada em atividade solar F10.7 e índices geomagnéticos; a NASA OMNI tem esses índices desde 1963: https://omniweb.gsfc.nasa.gov/html/ow_data.html
- Escolher intervalo físico plausível de Cd·A/m com referência técnica à identidade do fragmento e validar em TLEs **não usados no ajuste**.
- Propagar estado e incerteza para 08/11 sem condicionar latitude/longitude a Conde; comparar o corredor previsto com Conde depois.

## Conclusão

O experimento conjunto foi realizado, mas sua resposta é um limite de conhecimento: **as três datas são insuficientes para validar ou refutar um ponto de queda na Bahia**. Uma calibração que reproduz exatamente três dados usando três parâmetros individuais não tem poder preditivo demonstrado.
