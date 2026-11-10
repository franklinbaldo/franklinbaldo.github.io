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

## Executar

```sh
cd formal/conde
lake build
```

A CI usa `leanprover/lean-action@v1` com Lean 4.25.0 e sem Mathlib.
Nenhum axioma físico foi introduzido; os dados históricos foram codificados
como premissas explícitas.

## Próxima fatia

1. Transformar TLEs e suas incertezas em estados intervalares separados por objeto.
2. Formalizar o acoplamento inicial e limites de impulso de separação
   **após** obter informações mecânicas que fundamentem esses limites.
3. Definir solução dinâmica certificada: integração validada e aritmética
   intervalar para arrasto e gravitação.
4. Construir certificado reproduzível para inexistência de solução
   compatível com Conde, caso as restrições físicas o permitam.

Não se deve criar axiomas que declarem sem prova que o satélite reentrou na
Bahia, que a atmosfera seguiu certa curva, nem que a localização final foi
observada. Sem novos dados, o resultado principal é *não identificabilidade*.
