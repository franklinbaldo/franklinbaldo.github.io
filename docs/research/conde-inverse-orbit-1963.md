# Teste inverso condicionado a Conde — NORAD 528

Data: 2026-11-10. Estado: **experimento de sensibilidade, não reconstrução validada**.

## Pergunta

Existe uma família de trajetórias simplificadas que, partindo do TLE histórico do NORAD 528 de 27/10/1963 e terminando numa altitude hipotética de reentrada em 08/11/1963, cruze a posição geográfica de Conde (BA)?

**Resposta limitada:** sim, por ajuste de parâmetros. Isso NÃO estabelece que a trajetória real tenha passado ali e não estima a probabilidade da hipótese.

## Entradas

- TLE: `1 00528U 63003  B 63300.61129783  .00686563 +00000-0 +00000-0 0  9990`
- TLE: `2 00528 081.8615 198.5261 0017147 104.7477 255.4423 15.74901460043614`
- Época: 27/10/1963 14:40:16 UTC
- Posição de Conde (sede): 11°48′49″S, 37°36′38″W (anuário estadual da Bahia, IBGE código 2908606).
- Movimento médio inicial: `n0 = 15.74901460 rev/dia`.
- Primeiro termo derivativo do TLE: `ndot_TLE = 0.00686563 rev/dia²`, que **é metade da derivada em convenção TLE** e não é utilizado pelo SGP4.
- Inclinação `81.8615°`, RAAN `198.5261°`, excentricidade `0.0017147`, argumento do perigeu `104.7477°`, anomalia média `255.4423°`.
- **Hipótese livre**, não observação: movimento médio no fim `n_f=16.5 rev/dia` (altitude circular equivalente `~139.3 km`, não necessariamente instante real de impacto).

## Modelo exploratório

Para intervalo `D` entre TLE e encontro hipotético, e `d ∈ [0,D]`:

```text
s = 2 * ndot_TLE = 0.01373126 rev/dia²
n(d) = n0 + s*d + (nf - n0 - s*D)*(d/D)^p
N(d) = integral_0^d n(t) dt
```

O expoente `p>1` representa aceleração arbitrária do decaimento. Integra-se a fase orbital em termos do movimento médio e aplicam-se taxas seculares aproximadas J2 à ascensão reta do nodo, ao argumento do perigeu e à anomalia média; calculam-se coordenadas do ponto subsatélite com a rotação sideral da Terra, assumindo Terra esférica. Ajustam-se **p e o instante de encontro**, por mínimos quadrados em latitude e longitude, mantendo os parâmetros de entrada.

Esta família de funções é um **ansatz matemático**, não uma lei física do arrasto. O valor da derivada do TLE tampouco é, necessariamente, a derivada física instantânea de n. TLEs são elementos médios de um modelo próprio; a integração secular J2 de dois corpos não reproduz rigorosamente a convenção TEME/SGP4. **Sem densidade atmosférica, área/massa, coeficiente balístico e observações posteriores, não existe validação dinâmica.**

## Dois ajustes demonstrativos distintos

Com `nf=16.5 rev/dia`:

| Ajuste | p | Cruzamento forçado em Conde (UTC) | Observação |
|---|---:|---|---|
| A | ~1.99086 | 08/11/1963 11:31:54 | Ajuste geométrico |
| B | ~7.63225 | 08/11/1963 23:42:14 | Ajuste geométrico |

Resíduos numéricos podem aproximar-se de zero porque há **dois parâmetros livres para duas coordenadas-alvo**. Um bom ajuste não é evidência independente. Horários acima não são horários históricos do evento.

Sensibilidade da evolução hipotética de `n(d)`:

| Dia desde 27/10 | A (rev/dia) | B (rev/dia) |
|---:|---:|---:|
| 0 | 15.74901 | 15.74901 |
| 3 | 15.82825 | 15.79022 |
| 6 | 15.98260 | 15.83372 |
| 9 | 16.21154 | 15.92368 |
| final | 16.50000 | 16.50000 |

A derivada inicial do TLE isoladamente, extrapolada linearmente, levaria a apenas `~15.91 rev/dia` em 8/11, altitude circular equivalente ainda de centenas de quilômetros. Para reentrar no dia 8, portanto, seria indispensável uma evolução de decaimento que se acentuasse substancialmente. O TLE isolado não determina qual evolução ocorreu.

## Interpretação

O teste não refuta Conde, mas também **não aumenta de forma mensurável a probabilidade de queda em Conde**: as trajetórias foram ajustadas usando a localização como premissa. Para transformá-lo em teste falsificável: fixar independentemente um modelo atmosférico, faixa de coeficiente balístico e condições observadas próximas de 8/11; propagar as incertezas e verificar se Conde cai dentro do conjunto previsto, sem ajustá-lo à cidade.

## Fontes

- TLE histórico AFSPC/NORAD reproduzido em https://www.itau.magnetic-declination.com/satellite/?s=528
- Explicação dos campos e advertência sobre derivadas em SGP4: https://celestrak.org/columns/v04n03/
- CelesTrak/Vallado, Revisiting Spacetrack Report #3: https://www.celestrak.org/publications/aiaa/2006-6753/AIAA-2006-6753.pdf
- Sede de Conde: https://www.ba.gov.br/sei/sites/site-sei/files/migracao_2024/arquivos/images/publicacoes/download/anuario_estatistico/anuario_estatistico_2008.pdf
