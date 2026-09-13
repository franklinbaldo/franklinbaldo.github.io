# Evidência — MaleCNS byte tagger, primeiro controle pareado

Execução canônica desta rodada: GitHub Actions `34734708310`, commit `fe5aad591bfabc821ec9d8bbfdc9dfcf94b27693`.

Artifact: `malecns-tagger-34734708310`, digest `sha256:b4e222312119c1babada41e281ba7758eb1ab7c35d27d24de015c9548c1a5af7`.

## Configuração

- seed: `20260912`;
- grafo MaleCNS: 512 neurônios, 16.726 arestas internas;
- seleção: maior grau sináptico ponderado entre neurônios retidos do MaleCNS v1.0;
- entrada: bytes UTF-8, embedding treinável de 64 dimensões, 64 neurônios de entrada;
- janela: 192 bytes;
- treino: 3 épocas, batch 4;
- dados: 14 documentos de treino, 3 de validação; 42/9 janelas;
- rótulo: `resultado` vs `O`;
- `test.jsonl` não foi usado;
- dispositivo: CUDA/Kaggle.

CausaGanha fixado em `7c3d6557bb692932553622ae6e00493ba04e534f`.

MaleCNS v1.0:

- annotations SHA-256 `2177e246113e4cfbf1e7772ec37c6da1955ff22e8063d0b1f833101f99a9a3b2`;
- edges SHA-256 `e35da783d1c686b2b58b3b87cd6a403ae43bfcfba8bff28e08ef752c1a56afc1`.

## Resultado final

| modelo                     | precision |  recall |          F1 |  TP |  FP |  FN |   TN |
| -------------------------- | --------: | ------: | ----------: | --: | --: | --: | ---: |
| MaleCNS reservoir          |   0.20727 | 0.83824 | **0.33236** |  57 | 218 |  11 | 1442 |
| degree-preserving shuffled |   0.20678 | 0.89706 | **0.33609** |  61 | 234 |   7 | 1426 |
| byte-only                  |   0.19930 | 0.83824 | **0.32203** |  57 | 229 |  11 | 1431 |
| all-O                      |         0 |       0 |           0 |   0 |   0 |  68 | 1660 |

Diferenças:

- MaleCNS − shuffled: `-0.00373` F1;
- MaleCNS − byte-only: `+0.01033` F1.

A loss do MaleCNS caiu `0.61896 -> 0.36773 -> 0.28081`. A loss do shuffled caiu `0.64568 -> 0.47962 -> 0.33715`.

## Controle de topologia

O null model realizou 167.260 double-edge swaps dirigidos (10 por aresta), preservando:

- número de nós;
- número de arestas;
- in-degree de cada nó;
- out-degree de cada nó;
- multiconjunto dos pesos das arestas;
- arquitetura treinável e seed de inicialização.

Ele destrói a maior parte da organização de ordem superior do wiring MaleCNS sem trocar o tamanho do reservoir.

## Leitura provisória

A rodada demonstra que o pipeline `byte embedding 64d -> recurrent reservoir -> tag` aprende a tarefa. Os dois reservoirs recorrentes ficaram ligeiramente acima do baseline sem recorrência, mas o MaleCNS não venceu o grafo embaralhado nesta seed.

Portanto, esta execução **não fornece evidência de vantagem da topologia biológica**. A diferença é pequena demais para conclusão e deve ser tratada como hipótese para uma rodada pareada com múltiplas seeds.

Limite do claim: trata-se de dinâmica de taxa engenheirada constrangida pelo wiring MaleCNS, não de uma simulação fisiologicamente fiel do cérebro da Drosophila.
