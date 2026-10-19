# Propriocepção passiva: contrato e limites da primeira etapa

A rota `/fly-proprioception/` acrescenta um laboratório independente. A demo
`/fly-shader/` continua disponível. Nenhum controlador motor, treinamento,
recompensa, experimento remoto ou mudança de infraestrutura faz parte desta etapa.

## Três camadas separadas

1. **Estado físico prescrito:** articulação fêmur–tíbia da perna posterior
   direita; senoide passiva com ângulo e derivada analítica. Não é simulação de
   forças, músculos, contato ou dinâmica de um corpo completo. Intervalo
   20°–160°, amplitude máxima 70° e frequência até 1 Hz são escolhas de UI.
2. **Encoder qualitativo:** índices sem unidade inspirados nas distinções
   FeCO da literatura. Claw representa posição; hook separa flexão/extensão;
   club representa magnitude de movimento. Vibração de alta frequência não é
   simulada. Curvas lineares e normalização em 180°/s são suposições de código,
   não parâmetros ajustados nem medidas biológicas.
3. **Propagação exploratória opcional:** clique para carregar o grafo e
   verificar sua identidade. Antes disso, ou se a verificação falhar, estado
   `NOT_CONNECTED` com atividade ausente. Após verificação:
   `MODELLED_INPUT / EXPLORATORY`. A entrada artificial é uniforme por subtipo:
   claw recebe posição normalizada crescente, hook recebe velocidade absoluta,
   club recebe zero. Não se atribui tuning individual, preferência de direção,
   sensibilidade angular ou seletividade de vibração aos neurônios identificados.
   Portanto os canais ilustrativos da camada 2 não equivalem a taxas aferentes
   validadas; a redução para a camada 3 é uma intervenção de engenharia explícita.

## Auditoria anatômica

`public/fly-proprioception/audit.json` registra fonte oficial, hashes, índices,
body IDs e campos originais. A ordem é a linha zero-based após filtrar
`status == Traced` sem reordenar a tabela original de anotações MaleCNS v1.0.
Essa regra foi conferida contra os grupos `dn_all`, `dnl` e visual projection
já embarcados. Há 165.122 linhas Traced e 33 células com sinônimo explicitamente
FeCO: 13 claw, 15 club e 5 hook, todas `entryNerve=MetaLN`, `rootSide=R`.
Não expandimos a seleção por nomes de tipos presumidos homólogos. Buscar apenas
“claw” é incorreto: o termo também ocorre fora da classe proprioceptiva.

O arquivo compacto não contém body IDs; a ligação depende da tabela externa e
seus hashes. A existência de VNC e aferentes neste artefato foi confirmada;
a limitação não é ausência anatômica, mas falta de tuning/ganho por célula e
validação fisiológica da dinâmica. Não transferimos parâmetros medidos nas
figuras dos estudos para aferentes metatorácicos como se fossem calibrados. Este subconjunto anotado não representa
todas as células FeCO, todas as pernas ou uma população completa presumida.

## Contrato do adapter

- `validateAudit`: exige contagem, hashes, alinhamento, índices únicos/válidos,
  classe proprioceptiva, sinônimo FeCO explícito e mesma perna/lado; readouts não
  podem conter aferentes estimulados
- `modelledDrive`: produz pares índice/entrada artificial em [0,1]; não renomeia
  neurônios visuais, olfatórios ou DNs como proprioceptores
- `brainStepWithDrive`: acrescenta uma entrada esparsa explícita ao simulador
  já existente. Mantém a mesma recorrência 0,65/0,35, tanh, escalas e pesos;
  não altera a entrada visual antiga nem usa DNs como saída nova
- Worker verifica SHA-256 do binário antes de decodificar/conectar; não baixa
  novas anotações em runtime, não envia dados a terceiros e falha fechado
- Readouts: média do módulo do estado em `vnc_intrinsic` e
  `ascending_neuron`, populações anotadas inteiras. Incluem células que podem
  não ser alcançadas pela intervenção; não são somente parceiros pós-sinápticos
  diretos. Não são spikes, atividade registrada nem evidência de percepção
- Um passo recorrente por 0,1 s de tempo da demonstração é convenção visual,
  sem equivalência temporal fisiológica. O atraso do computador apenas torna a
  execução mais lenta; não pula passos. Reset zera os estados e o tempo.
  O controle “sem entrada” mantém os sinais ilustrativos visíveis mas injeta
  zero no grafo; alterná-lo reinicia estados para comparação limpa

## Validação e próxima etapa

Os testes de unidade exercitam posição/velocidade, limites, inversão, silêncio,
propagação em grafo **sintético**, seleção real de identidades, isolamento do
readout e equivalência de decodificação com o loader existente. Um teste de
integração também carrega o grafo real no worker, executa três passos e verifica
reset, finitude e rejeição de hash divergente. O manifesto foi regenerado da
fonte oficial e comparado campo a campo nos dados operacionais. Esses testes
são verificações de software, não experimentos científicos.

O smoke inclui desktop/celular, nomes acessíveis dos controles, teclado,
pausa/reset, ausência de overflow e screenshots. Neste executor, Chromium
não iniciou: falha de socket/sandbox; tentativa com execução escalada falhou
na infraestrutura. Não há evidência visual local fabricada. Exigir smoke e
inspeção dos screenshots antes de considerar a interface validada visualmente.

A próxima etapa científica exige escolher uma hipótese de codificação,
compará-la com alternativas e controles sem entrada, examinar parceiros
pós-sinápticos documentados e confrontar a dinâmica com medidas. Modulação
entre movimento passivo e autogerado permanece fora do escopo. Nenhuma
resposta produzida aqui prova consciência ou estabelece um resultado novo.

## Fontes

- [Mamiya et al. (2018), codificação de posição e movimento no FeCO](https://pmc.ncbi.nlm.nih.gov/articles/PMC6481666/)
- [Agrawal et al. (2020), processamento central na VNC](https://pmc.ncbi.nlm.nih.gov/articles/PMC7752136/)
- [Modulação em movimento passivo/autogerado, etapa futura](https://pmc.ncbi.nlm.nih.gov/articles/PMC10634730/)
- [Nomenclatura MetaLN: nervo da perna metatorácica](https://elifesciences.org/articles/96084/figures)
- [Anotações oficiais MaleCNS v1.0](https://storage.googleapis.com/flyem-male-cns/v1.0/connectome-data/flat-connectome/body-annotations-male-cns-v1.0-minconf-0.5.feather)
- `scripts/fly-proprioception-audit.py`: reprodução read-only da seleção e dos
  índices de readout; imprime JSON para comparação com o manifesto
- `scripts/fly-shader-build-eye.py`: regra e checks de alinhamento já existentes
- `scripts/fly-shader-load.mjs` e `public/fly-shader/sim.js`: loader e recorrência
