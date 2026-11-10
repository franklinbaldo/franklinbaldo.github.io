# Conde 1963: ponte entre catálogo, separação e estados observacionais

Estado: 2026-11-10. Este documento especifica quais variáveis históricas podem entrar no núcleo formal **sem serem inventadas**.

## Proveniência e natureza dos dados

| Objeto | Identificação | Classe catalogada | Vínculo técnico documentado | TLE de época | Reentrada catalogada |
|---|---|---|---|---|---|
| 527 | 1963-003A | carga útil OPS 0180 / FTV 2313 | reentrou ainda preso ao Agena B 2313 | 1969-01-08 | 1969-01-09 |
| 528 | 1963-003B | debris do satélite/Agena | objeto vinculado ao S00527; peça material não identificada | 1963-10-27 | 1963-11-08 |
| 529 | 1963-003C | debris do satélite/Agena | objeto vinculado ao S00527; peça material não identificada | 1963-12-30 | 1963-12-31 |

Origem do lançamento: **1963-003**, **16/01/1963 às 21h59 UTC**, Vandenberg **75-3-5**, **Thor Agena B**, número **363/2313**.

Fontes:
- GCAT — [launch log](https://www.planet4589.org/space/gcat/data/derived/launchlog.html)
- GCAT — [catálogo de objetos](https://planet4589.com/space/gcat/data/derived/currentcat.html)
- GCAT — [lista do Thor](https://planet4589.org/space/gcat/data/launch/Thor.html)
- [TLE 528 atribuído à AFSPC](https://www.itau.magnetic-declination.com/satellite/?s=528)

**Divergência a resolver**: a legenda resumida dos detritos no catálogo menciona "Agena D", mas o lançamento 1963-003 foi **Thor Agena B**. Não deduzir do nome do detrito que o estágio fosse Agena D, nem que uma peça específica provenha do tanque, adaptador, carenagem, motor ou satélite. A etiqueta "PART" ou "debris" não identifica mecanicamente o componente.

**Importante**: o campo `2300?` usado para a época orbital desses detritos é aproximado/incerto. Não o transformar em uma observação cronometrada de desprendimento. Permanecer catalogado como originário da mesma missão não comprova separação simultânea dos objetos 527, 528 e 529.

## Interfaces para os modelos

### 1. Separação instantânea

Em `Conde1963.Separation`:

```text
v_i(t_sep+) = v_parent(t_sep-) + Δv_i
|Δv_i,k| ≤ K_i  para cada eixo k
⇒ |v_528,k - v_529,k| ≤ K_528 + K_529
```

Esse é um teorema **condicionado** à hipótese de mesma época e mesma posição inicial. Sem mecanismo de soltura documentado e massa/forma dos detritos, os limites `K_i` continuam simbólicos.

### 2. Movimento relativo e incerteza posterior

Em `Conde1963.Reachability`:

```text
v_rel(t+1) = v_rel(t) + a_rel(t)
x_rel(t+1) = x_rel(t) + v_rel(t)
|v_rel(0)| ≤ K, |a_rel(t)| ≤ A
⇒ |x_rel(t)| ≤ R_x(t)
```

Os `R_x(t)` e `R_v(t)` são definidos recursivamente e verificados em Lean, sem extrapolação por floats. Precisam de unidades explícitas e de **limites físicos independentes** para constituírem restrições sobre missões reais.

O modelo é 1D, discreto, de aceleração relativa, sem gravidade central, rotação da Terra ou fase orbital. **Não compara diretamente coordenadas geográficas ou TLEs**. Deve ser usado para certificados de consistência de uma aproximação externa, não para anunciar previsões de queda.

### 3. Medições tardias

Cada TLE é uma observação média em época distinta; conversão TLE→estado cartesiano exige convenções TEME/SGP4, e uma covariância não está presente no TLE. Devemos usar estimativas intervalares cuja largura seja justificada por validação externa (séries TLE e resíduos). Não inventar barras de erro iguais a zero.

### 4. Dados que eliminariam dimensões livres

1. Manual do Ferret/FTV 2313 ou documento de engenharia com eventos de separação e massa/forma de cada peça.
2. Rastreamento de 528 de 27/10 até 08/11/1963; de 529 em 1963 e 527 próximo ao lançamento para estimar estados compartilhados.
3. Série contemporânea F10.7/Kp/ap e um modelo atmosférico com arrasto parametrizado.
4. Fonte baiana com data/hora da alegada observação física. O horário da Rádio Tupi não é um horário de reentrada.
5. Qualquer registro de longitude/latitude real de reentrada dos três objetos, distinto de suas datas.

## Critérios de falsificação

- Se uma observação de separação exigir diferença de velocidade maior que os limites mecânicos documentados, rejeitar **aquele** modelo de separação.
- Se uma medição validada da separação relativa estiver fora do intervalo de alcançabilidade sob aceleração/densidade documentadas, rejeitar a família de parâmetros, nunca as leis físicas gerais.
- Para excluir Conde, usar localização/horário apenas após integrar os dados independentes, e testar se o corredor de posição em 8/11 exclui a cidade.
- Não inferir verdade física de um certificado sobre variáveis abstratas quando os limites foram escolhidos para obter a resposta.

## Status

Nenhum limite de impulso, massa, área, arrasto, estado cartesiano inicial, erro de TLE ou longitude final pode ser preenchido numericamente pelas fontes localizadas até agora. A investigação ainda não pode excluir Conde por física orbital.
