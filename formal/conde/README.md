# Núcleo formal: Conde 1963 (Lean 4)

Este experimento separa **fatos observados**, **hipóteses** e **consequências prováveis dentro do modelo**.

## O que está formalizado

- Datas civis das três reentradas e origem comum: `Observed`.
- Latitude subsatélite permitida pela inclinação idealizada de 81,8615°:
  `InInclinationBand`.
- Conde e Porto Velho dentro da faixa, Polo Norte fora.
- Contraexemplo lógico: duas atribuições de longitude distintas satisfazem as
  mesmas observações históricas; logo a longitude não pode ser deduzida apenas
  dessas datas e da origem comum.
- Monotonicidade de refinamentos e certificados de exclusão.

**Crítico:** `Scenario` é um registro lógico e não um estado orbital dinâmico.
`scenarioConde` não é certificado de uma queda fisicamente viável. Os
teoremas geométricos tratam somente do ponto subsatélite no modelo idealizado,
não de dispersão de fragmentos.

## Separação comum e limites condicionais

O módulo [`Conde1963/Separation.lean`](Conde1963/Separation.lean) agora
introduz um modelo **instantâneo de origem comum** para as três velocidades:
`v_i = v_parent + Δv_i`. Todas as grandezas de velocidade são inteiras,
em uma unidade que deverá ser declarada na futura aplicação empírica.

Cada impulso `Δv_i` tem um limite por componente (`L∞`) que é
**parâmetro sem valor histórico escolhido**, e não uma medição.

Provas propostas: cancelamento da velocidade do corpo pai nas diferenças
relativas; limite por componente `|v528-v529|≤max528+max529`; limite
analogamente para o par 527/528; exclusão de candidato que viole o limite;
identidade de velocidades na coordenada x caso ambos os limites sejam zero.

**Não existe conclusão numérica** sobre velocidades de separação, trajetórias
ou local de queda. A hipótese de separação simultânea dos três objetos é
uma simplificação a ser substituída se registros técnicos mostrarem
eventos distintos ou datas de desprendimento diferentes. Essa formalização
não transforma o registro catalográfico de origem comum em prova de
separação simultânea.

## Alcançabilidade e ligação com observações

O módulo `Conde1963/Reachability.lean` formaliza uma dinâmica relativa
**discreta e unidimensional**: atualização de velocidade pela aceleração
relativa e atualização do deslocamento pela velocidade. Demonstra, por
indução e com inteiros exatos, intervalos que contêm todos os estados
compatíveis com limites `K` (impulso inicial) e `A` (aceleração relativa
máxima por passo). Inclui provas de exclusão de observações externas ao
intervalo.

O módulo `Conde1963/Bridge.lean` conecta efetivamente esses teoremas
aos limites `max528 + max529` derivados da separação comum. Assim,
**sob as premissas explicitadas**, uma observação futura de separação
relativa maior que o raio admissível poderá falsificar uma hipótese.

Nenhum `A`, `K` ou duração de passo foi obtido da documentação histórica,
e a discretização não corresponde ainda à dinâmica orbital real (nem TEME,
nem SGP4). O caderno
[`docs/research/conde-orbital-constraints-provenance.md`](../../docs/research/conde-orbital-constraints-provenance.md)
documenta o que os catálogos permitem afirmar, a divergência de
etiqueta Agena D vs. lançador Agena B e os dados ainda ausentes.

## Executar

```sh
cd formal/conde
lake build
```

A CI usa `leanprover/lean-action@v1` com Lean 4.25.0 e sem Mathlib.
Nenhum axioma físico foi introduzido; os dados históricos foram codificados
como premissas explícitas.

## Próxima fatia

1. Transformar TLEs e suas incertezas em estados intervalares separados por objeto, com validação independente.
2. Substituir limites simbólicos de impulso por intervalos fisicamente documentados, apenas após identificar mecanismos de separação.
3. Definir solução dinâmica certificada: integração validada e aritmética
   intervalar para arrasto e gravitação.
4. Construir certificado reproduzível para inexistência de solução
   compatível com Conde, caso as restrições físicas o permitam.

Não se deve criar axiomas que declarem sem prova que o satélite reentrou na
Bahia, que a atmosfera seguiu certa curva, nem que a localização final foi
observada. Sem novos dados, o resultado principal é *não identificabilidade*.
