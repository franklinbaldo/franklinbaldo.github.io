# MVP — MaleCNS como sequence tagger por bytes

## Pergunta

Um reservoir recorrente cuja topologia é extraída do **MaleCNS v1.0** consegue aprender a marcar `resultado` em decisões judiciais usando uma interface textual mínima?

Este é um experimento de engenharia sobre uma topologia de connectoma. Não é uma alegação de simulação fisiologicamente fiel do cérebro da mosca.

## Pipeline

```text
UTF-8 bytes (0..255)
  -> embedding treinável 64d
  -> projeção linear para 64 neurônios de entrada
  -> reservoir MaleCNS congelado
  -> readout linear por byte
  -> O | resultado
```

A primeira execução usa 512 neurônios para reduzir custo. A seleção é determinística: os neurônios retidos com maior grau sináptico ponderado, preservando todas as arestas entre eles. Os pesos do reservoir são contagens de contatos normalizadas pela entrada de cada neurônio. A dinâmica de taxa (`tanh` + leak) é uma escolha experimental nossa; não é fisiologia inferida do dataset.

## Dados

O script fixa o CausaGanha no commit `7c3d6557bb692932553622ae6e00493ba04e534f` e lê apenas:

- `data/segmenter_splits/train.jsonl`;
- `data/segmenter_splits/val.jsonl`.

O `test.jsonl` não participa do MVP. Os offsets de caracteres são convertidos para offsets de bytes UTF-8 antes do treino, inclusive para caracteres multibyte.

## Controles

A mesma execução treina:

1. **MaleCNS reservoir** — embedding 64d + projeção de entrada + reservoir congelado + readout;
2. **byte-only baseline** — embedding 64d + readout, sem contexto recorrente;
3. **all-O trivial** — referência sem treino.

O primeiro resultado útil não é "a mosca entende português". É saber se o reservoir connectome-constrained produz sinal adicional sobre o baseline minúsculo.

## Reprodutibilidade

A execução registra seed, configuração, commit dos dados, número de nós/arestas, curvas de loss e precision/recall/F1. O checkpoint contém apenas os parâmetros treinados e a representação do subgrafo usada no run.

As fontes flat-connectome do MaleCNS v1.0 são baixadas diretamente do bucket público da Janelia e verificadas por tamanho e SHA-256 antes do uso.

## Execução

Smoke local, sem download do MaleCNS:

```bash
uv run --script scripts/malecns-tagger/experiment.py self-test
```

Run real (exige cerca de 1 GB de download para o arquivo de arestas):

```bash
uv run --script scripts/malecns-tagger/experiment.py run \
  --graph malecns \
  --nodes 512 \
  --input-nodes 64 \
  --epochs 3
```

O caminho preferido para GPU é o workflow manual **MaleCNS Tagger Experiment**, que reaproveita `KAGGLE_API_TOKEN` e `KAGGLE_USERNAME` já usados pelo repositório e devolve `metrics.json` + checkpoint como artifact.

## Próxima decisão

Se a F1 do reservoir superar de forma clara o baseline byte-only, repetir com seeds adicionais e escalar 512 -> 1k -> 2k -> 5k neurônios. Se não superar, primeiro testar dinâmica/input mapping; não abrir plasticidade sináptica antes de provar que o reservoir fixo carrega sinal útil.
