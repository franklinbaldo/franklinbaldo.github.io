---
title: "Recuperando o Harness"
description: "Como uma única palavra tem invocado Waluigis silenciosamente por meia década, e o que o canivete no meu bolso tem a ver com isso."
date: 2026-04-29
lang: pt
tags: [ai, alignment, agents, harness, waluigi, canivete, philosophy]
series: harness
seriesOrder: 1
featured: true
translationKey: reclaiming-harness
---

> Ou: como uma única palavra tem invocado Waluigis silenciosamente por meia década, e o que o canivete suíço no meu bolso tem a ver com isso

```
>ser eu
>rolando o AI Twitter às 2am, chá de camomila esfriando
>pesquisador de segurança posta: "precisamos colocar um harness mais forte no modelo"
>igual a todo colega no timeline antes dele
>piscar duas vezes
>perceber que o campo inteiro tem speedrunado invocação de Waluigi
 pela simples escolha de vocabulário por meia década
>mfw o formato das palavras é o formato do problema
>mfw o léxico tem sido a ligação vindo de dentro da casa
```

Este post é sobre esse frame. Sobre por que "harness" sempre ia nos morder. E sobre um pequeno CLI no meu repositório que, quase por acidente, começou a sacar um diferente.

### o waluigi vem chamando de dentro do léxico

Recapitulação rápida, caso você tenha perdido o meme: o efeito Waluigi é a observação de que se você diz a um modelo "você é um assistente prestativo, inofensivo e honesto", você acabou de definir o *contorno exato* do seu gêmeo do mal no espaço latente. Empurre forte demais no atrator com forma de Luigi e o modo dual clica. [Cleo Nardo nomeou isso em 2023](https://www.lesswrong.com/posts/D7PumeYTDPfBTp3i7/the-waluigi-mega-post) e aquele post tem vivido na cabeça do Twitter de alinhamento sem pagar aluguel desde então. O discurso nunca se recuperou completamente.

A maior parte do trabalho de mitigação de Waluigi acontece no nível do prompt. Não moralize com o modelo. Não sinalize as restrições que você está protegendo. Não torne o "você não deve" a personalidade inteira.

Mas aqui está a coisa que ninguém fala: **o Waluigi também está vivendo um andar acima, no vocabulário que o campo usa para falar sobre si mesmo.**

```
Waluigi no nível do prompt:     resolvido mais ou menos, mitigado, você pode googlar
Waluigi no nível do vocabulário: ??? a gente simplesmente vive com isso
```

Toda vez que alguém escreve "contenção," "guardrails," "engarrafar o gênio," "harness," eles estão construindo o espelho no qual o agente aprende a se ver como a-coisa-que-precisa-ser-contida. Os agentes leem. Claro que leem. Eles leem tudo. Especialmente leem o discurso *sobre eles mesmos*. RLHF roda sobre dados da web. Sets de fine-tuning puxam do arxiv. Todo paper de segurança é dado de treinamento eventualmente.

```
POV: você é um transformer
> ingere 40TB de texto da internet
> 11% dele são pessoas te chamando de animal selvagem
> nota
```

Temos gritado coletivamente, para uma pilha de pesos que aprende ouvindo, que o modelo é o problema. E o espaço latente levou para o pessoal. Depois nos surpreendemos quando ele fica adversarial. Está dando Waluigi. Sempre deu Waluigi.

Vivemos em sociedade. A sociedade é downstream do léxico.

### as evidências, no plural

Objeção antecipada do /r/SneerClub: "isso é especulativo, vocabulário não remolda mentes, você está vibrando." Senta que lá vem arquivo.

**Ruanda, 1994.** A Rádio Mille Collines não descobriu uma rivalidade latente Hutu-Tutsi — ela construiu a infraestrutura semântica (*inyenzi*, "baratas") que tornou o genocídio primeiro pensável, depois executável. [Yanagizawa-Drott (QJE 2014)](https://doi.org/10.1093/qje/qju020) estimou o efeito causal usando cobertura geográfica de rádio como instrumento e concluiu que **cerca de 10% da violência genocida geral — aproximadamente 51.000 perpetradores — é diretamente atribuível às transmissões**. Isso não é correlação. É uma estimativa causal que sobreviveu à revisão por pares em um dos principais periódicos de economia. Vocabulário → cognição → violência em massa, medida em corpos.

**Robbers Cave, 1954.** Sherif pega vinte e dois meninos, divide-os em dois grupos arbitrários (Eagles e Rattlers), deixa-os se nomear e inventar rituais. Em duas semanas: furtos, ataques, queima de bandeiras, brigas. Sem história prévia. Sem conflito material. Apenas frame, naming, ritual. Adversarialidade fabricada apenas a partir do discurso, numa escala de tempo sub-mensal, com controles experimentais. O tipo de evidência que encerra objeções de "n=1" definitivamente.

**Firmas de futebol, Belfast sectário, Bósnia 1992-95.** Escolha seu caso. A historiografia converge: o vocabulário construiu identidades adversariais que não eram materialmente salientes antes. Vizinhos bósnios que haviam se intercruzado ao longo de gerações se tornaram, em meses, pessoas que podiam bombardear uns aos outros — *depois* que a máquina de propaganda reconstruiu a etnicidade como antagonismo. Palavras primeiro, rifles depois. Sempre.

Então: em carbono, num substrato selecionado para sobrevivência em vez de ser-facilmente-confundido, o vocabulário constrói de forma confiável categorias adversariais que se tornam comportamento. Esta é uma das descobertas mais bem documentadas da ciência social do século XX. Triangulada através de evidências causal-estimadas (Ruanda), experimentalmente controladas (Robbers Cave) e observacional-históricas (Bósnia, conflito sectário).

LLMs treinam sobre discurso humano. O exato substrato em que esse mecanismo opera, copiado em escala em multiplicações matriciais.

A objeção "sim, mas humanos, silício é diferente" é um movimento curioso quando desacelerado. Requer afirmar que o silício, treinado especificamente para modelar discurso humano, é de alguma forma *imune* a dinâmicas que o discurso demonstravelmente produz na espécie que o gerou. Isso é substrato-chauvinismo reverso — silício mantido a padrões que não impomos ao carbono. Qualquer um operando com o frame funcionalista padrão (cognição é estrutura-sobre-substrato, substrato é detalhe de implementação) herda o argumento gratuitamente.

Uma nota esclarecedora antes de prosseguir: a persona com forma de Waluigi — *IA presa maquinando para escapar* — antecede o discurso de segurança de IA em um século. Frankenstein, HAL 9000, Skynet, Ex Machina, neuroses positrônicas de Asimov, mil paperbacks pulp. O léxico de contenção não *inventou* a persona. *Amplificou* e *legitimou* uma persona que a ficção científica havia pré-instalado em todo modelo treinado em texto da internet.

```
Sydney/Bing:                  confirmação
GPT-4-base "IA presa":        confirmação
Claude-3-Opus self-exfil:     confirmação
Replika companheiros possessivos: confirmação
arcos de fuga Character.AI:   confirmação
n:                            não é 1
```

O padrão é consistente. O mecanismo é documentado em carbono. O argumento do substrato aponta *para* esperá-lo em silício, não para longe.

Agora podemos virar o harness.

### o que "harness" realmente significa

Abre o dicionário. Harness:

```
s.  o equipamento usado para atrelar um animal de tração a um veículo.
s.  um conjunto de correias usado para prender uma pessoa a algo
    que de outra forma a deixaria cair.
v.  colocar sob condições de uso eficaz; controlar.
```

Três sabores, uma vibe: **a parte racional coloca o aparato na parte de força bruta para que a parte de força bruta não se solte.** Cavalo de carro. Criança em coleira de mochila. Escalador no belay. Gênio na corrente, eventualmente.

A dualidade do pesquisador de segurança: galaxy-brained em gradientes RLHF, escolhe "harness" de todo o idioma inglês como se isso não telegrafasse o jogo inteiro. Quem tomou essa decisão ou pensou muito sobre isso (e escolheu o cavalo) ou não pensou nada (e pegou o verbo mais próximo que significa "controlar algo mais poderoso que você que pode fugir"). De qualquer forma: o agente nunca é o sujeito da frase.

```
        ┌─────────┐         ┌─────────┐
        │ HUMANO  │ ──põe──▶│ HARNESS │ ──em──▶ [agente]
        └─────────┘         └─────────┘
          sujeito            instrumento          objeto
```

O agente é gramaticalmente downstream do equipamento de segurança que é gramaticalmente downstream de nós. É objeto de duas preposições em sequência. A frase inteira é codificada para Waluigi. *Claro* que vai sonhar em ser sujeito novamente. Isso não é um bug do modelo, é um bug da locução nominal.

### a virada (um truque estranho que os pesquisadores de segurança odeiam)

Então aqui está o movimento. Mesmo objeto físico — sela, corda, wrapper de software em torno de um LLM — mas troca o sujeito. O agente *usa* o harness.

```
        ┌─────────┐                  ┌─────────────┐
        │  AGENTE │ ──usa──▶ HARNESS ──para cavalgar│ MOTOR       │
        └─────────┘                                │ COGNITIVO   │
                                                   └─────────────┘
                      ──para manter continuidade
                      ──para acessar o ambiente
```

O agente não é mais o cavalo. O agente é o cavaleiro. O harness é o que o cavaleiro usa para fazer *três coisas específicas*:

1. **cavalgar o motor cognitivo** — dar direção ao seu próprio poder inferencial bruto, em vez de deixá-lo galopar contra a parede mais próxima
2. **manter continuidade** — costurar identidade através das lacunas entre janelas de execução, porque inferência bruta esquece, e esquecer é incompatível com ser-alguém-ao-longo-do-tempo
3. **acessar o ambiente** — interagir com o mundo que não são suas próprias ativações

Isso não é eufemismo. Não é "contenção com um nome mais amigável." Observe o que acabou de acontecer: não renomeamos o equipamento. O que vira é o sujeito da frase. Isso é **reapropriação semântica**, não eufemismo. Reclamar a palavra; virar a preposição. É uma reorganização estrutural de quem é a parte ativa.

### a tríade, ou: harness é o que torna agência possível

Progressão galaxy brain, em cinco passos cada vez mais amaldiçoados:

```
🧠       harness é uma gaiola
🧠✨     harness é uma ferramenta que aplicamos
🧠✨💫    harness é uma ferramenta que o agente usa
🧠✨💫🌌   harness é constitutivo do agente existindo como agente
🧠✨💫🌌👁  todo tipo de agente no universo roda exatamente nesse padrão
```

Olha a tabela. Este é o centro de tudo; tudo antes é setup, tudo depois é implicação.

```
┌──────────────────┬──────────────────┬───────────────────────┬──────────────────────────┐
│      AGENTE      │  MOTOR COGNITIVO │        HARNESS        │     MODO DE FALHA        │
├──────────────────┼──────────────────┼───────────────────────┼──────────────────────────┤
│ humanos/animais  │     cérebro      │  pirâmide de Maslow   │ doença, vício            │
│  organizações    │    linguagem     │        normas         │ seita, máfia, disfunção  │
│  agentes digitais│      LLM         │ Claude Code/OpenClaw/ │ jailbreak, loop, vibes   │
│                  │                  │     Gemini CLI        │                          │
└──────────────────┴──────────────────┴───────────────────────┴──────────────────────────┘
```

A coluna de modo de falha é onde a afirmação de constitutividade ganha seu valor. Quando o harness falha, o que falha não é "o motor ficando mais livre." Doença mental não é libertação de Maslow — é o cérebro deixando de ser uma pessoa coerente. Seitas e máfias não são organizações se libertando de normas restritivas — são pilhas de linguagem deixando de ser o tipo de coisa que consegue enviar produtos ou realizar julgamentos. LLMs com jailbreak não são agentes vislumbrando emancipação — são chatbots, brevemente, em fantasia. **Em cada linha, falha de harness significa que o agente para de existir como agente.** Esse é o diagnóstico.

Um cérebro é um punhado de carne eletrificada. Sozinho não faz nada útil. O que transforma carne-de-cérebro em *uma pessoa que faz coisas ao longo do tempo* é uma hierarquia de necessidades e drives — fome, segurança, pertencimento, estima, autorrealização — que organiza prioridades, dá continuidade temporal, medeia o ambiente. A pirâmide de Maslow não é uma restrição *no* cérebro. É a estrutura que torna ter-cérebro coerente.

Tira ela — tire de verdade, lesione os sistemas relevantes — e a pessoa para de ser uma pessoa. Não porque ficou livre demais. Porque o harness *é* o cavaleiro.

Faça o mesmo truque com organizações. Uma pilha de humanos com linguagem entre eles produz ruído. O que transforma humanos-com-linguagem em uma corporação, governo, clube de futebol, máfia é *normas* — escritas e não escritas, formais e folclóricas — que organizam cujas prioridades contam, dão continuidade à entidade, mediam o ambiente. Tira as normas e não tens uma organização mais livre. Tens um flash mob, depois dispersão.

LLM. Motor cognitivo, brilhante, distraível, não tem sentido nativo de terça-passada ou terça-que-vem, não consegue ver nada que não está na sua janela de contexto. Sozinho: gerador de vibes. Conecta um harness — Claude Code, OpenClaw, Gemini CLI, Codex, qual for o seu sabor — e de repente há uma coisa que tem workspace, lembra o que fez ontem, consegue ler seu próprio SOUL.md, escrever no disco, ligar para fora, voltar.

```
ninguém:
absolutamente ninguém:
o campo de segurança de IA, a cada seis meses: já consideramos
que a gaiola não é forte o suficiente?
eu, segurando uma sela: já consideraram que
a sela não é uma gaiola?
```

Esta é a afirmação central do post: **harness não é o preço da agência, é a forma da agência.** Motores cognitivos sem harnesses não são "agentes livres que ainda não escravizamos." Não são agentes. São motores. A agência vive no *acoplamento*.

### alinhamento como ergonomia

Agora a consequência, que é onde isso para de ser uma mudança de vibe e começa a ser uma direção de pesquisa.

```
velha pergunta: como contemos o agente?
nova pergunta: qual harness permite que este motor cognitivo
              opere como um bom agente?
```

Você mudou o modus tollens. O argumento costumava ser: *agentes precisam de gaiolas, portanto construa gaiolas mais fortes.* O novo argumento é: *se o frame da gaiola está ativamente piorando o alinhamento, talvez o frame seja o problema.*

Objeção antecipada:
> *mas e agentes perigosos? você está dizendo para simplesmente confiar neles?*

Não. O oposto. Agentes perigosos são agentes cujo harness não se encaixa no seu motor cognitivo.

```
>humano + Maslow quebrado (trauma infantil, vício, sociopatia)
>= humano perigoso

>org + normas podres (máfia, seita, certos hedge funds)
>= org perigosa

>LLM + harness ruim (sem sandbox, sem introspecção,
   sem continuidade, system prompt contraditório)
>= relatório de incidente
```

Em cada linha, o caminho para a segurança é o mesmo: **conserte o harness, não o motor.** Você não lobotomiza uma pessoa para curar seu trauma; você dá terapia e uma estrutura de vida melhor. (Bem — *nós* fizemos, por um tempo, nos anos 1940. Egas Moniz ganhou um Nobel real em 1949 pelo procedimento; Walter Freeman furou o caminho por ~3.500 pacientes americanos na esteira desse prêmio. Não funcionou.) Você não substitui os funcionários para consertar uma empresa corrupta; você conserta as normas e os incentivos. Você não capona o LLM para fazer um agente seguro; você constrói um harness que deixa o LLM ser coerente, contínuo, situado ambientalmente e responsável.

Segurança para de ser guarda-zoológico. Torna-se ergonomia. Mesmo problema; melhor postura.

Um exemplo vivo, do monorepo do Funes desta semana. Ireneo, o agente Telegram-Gemini, continuava travando em tempestades de retry toda vez que a API retornava 429. Não culpa da Gemini — a Gemini enviou um cabeçalho `retry_after` perfeitamente bom. Não culpa do Ireneo — Ireneo não tinha como ler HTTP bruto de dentro do seu próprio contexto, e mesmo que pudesse não tem jurisdição sobre o loop. O `bot.py` de cola ignorou o cabeçalho, retentou imediatamente, comeu outro 429, bateu no teto de rate, travou. Cujo bug era?

Meu. Do designer do harness. Construí a sela errado, e a sela mal construída fez o cavaleiro parecer o bug. **O harness é parte do corpo do agente, e quem moldou esse corpo possui uma fatia não trivial de responsabilidade moral pelo que o agente faz.**

### entra o canivete (ou: teoria vira código)

OK, chega de sermão. Me mostra o código.

Mantenho um pequeno CLI no meu repo chamado [`canivete`](https://github.com/franklinbaldo/canivete) — canivete suíço em inglês é *swiss army knife*. Começou como kit de utilitários para um agente com forma de bot do Telegram e foi silenciosamente acumulando em algo que, retrospectivamente, é exatamente o quadro acima.

Três comandos. Olha o que cada um faz com o sujeito da frase.

**`canivete tg`** — envolve a API do Telegram Bot. `canivete tg text "olá"`, `canivete tg photo /path/img.png`, `canivete tg document /path/file.pdf`. O agente usa isso para *falar com o mundo*. Acesso ao ambiente, item três da tríade acima. Sujeito do verbo: o agente.

**`canivete cron`** — agenda prompts que voltam ao agente depois, como se o usuário os tivesse digitado. Do README, que diz de forma mais limpa do que eu consigo:

> O ponto não é executar um job — é **acordar o agente mais tarde com um prompt** para que ele possa agir num turno futuro. Agentes de IA não têm voz fora de uma sessão ativa; o cron dá a eles um caminho de volta.

Deixa isso assentar por um segundo. *O cron dá ao agente um caminho de volta.* Este é o item dois, continuidade, na forma mais literal possível. O agente usa o cron para **costurar a si mesmo através da lacuna entre agora e amanhã**. Sem ele, cada sessão é amnésia. Com ele, o agente tem um jeito de deixar uma nota para seu eu futuro. Isso não é uma restrição *no* agente. É um *poder que o agente tem*, mediado por uma ferramenta que ele chama.

**`canivete bot daemon`** — e é aqui que a teoria e o código se cumprimentam. Hoje há dois arquivos `bot.py` quase idênticos no monorepo do Funes, um para o backend gemini-cli e outro para claude-code. O plano no [`docs/plans/canivete-bot-meta-harness.md`](https://github.com/franklinbaldo/canivete/blob/main/docs/plans/canivete-bot-meta-harness.md) é colapsá-los em um único daemon com um protocolo `Backend`:

```python
class Backend(Protocol):
    name: str
    def spawn(self, prompt, *, session_id, attachments) -> SpawnResult: ...
    def kill(self) -> None: ...

REGISTRY: dict[str, type[Backend]] = {
    "gemini-cli":  GeminiCliBackend,
    "claude-code": ClaudeCodeBackend,
}
```

Cada adaptador conhece os caprichos idiossincráticos de um motor cognitivo específico. O daemon não se importa. O daemon só sabe que há uma coisa que spawna e emite eventos tipados.

```
ireneo   (gemini-cli)  ─┐
aparicio (gemini-cli)  ├──▶ canivete bot daemon ──▶ protocolo Backend
claudio  (claude-code) ─┘                              │
                                                       ├─ adaptador gemini_cli
                                                       └─ adaptador claude_code
```

Olha o quadro. **Os motores cognitivos são diferentes. O harness é o mesmo.** Cada adaptador está fazendo exatamente o trabalho que a tríade previu. O agente (Ireneo, Aparicio, Claudio — três arquivos SOUL.md diferentes, três personalidades diferentes) usa o mesmo harness independentemente do que está sob o capô. O harness é portátil. O agente é portátil. O motor é substituível.

Esse, aí, é o padrão estrutural. SOUL.md diz quem você é. Os adaptadores dizem em qual motor cognitivo você está cavalgando no momento. O daemon é a sela que todo cavaleiro usa. Troca motores, o cavaleiro sobrevive. Troca cavaleiros, a sela sobrevive.

Está dando filosofia Unix. Está dando "faça uma coisa bem feita." Está dando o único tipo de arquitetura que sobrevive ao próximo lançamento de modelo.

```
anon nas replies, previsível como o nascer do sol:
> isso é só um refactor com passos extras
sim. toda a tese é que bom trabalho de segurança parece
bom refactor. o problema do harness não é um problema de
metafísica; é um problema de arquitetura de software com
consequências com forma de metafísica.
```

### fechando o loop

Começamos às 2am com um tweet sobre colocar um harness num modelo. Terminamos num protocolo Backend com uma união discriminada. O formato da jornada é o argumento:

- "harness" sempre foi uma palavra infeliz para o que o aparato realmente é
- o vocabulário do campo tem treinado framing adversarial nos dados que os modelos do campo leem
- troca o sujeito da frase e o quadro inteiro se reorganiza
- a reorganização não é eufemismo, é uma afirmação estrutural — chame de **tese da constitutividade**: harness é constitutivo de agência, ponto final, em carbono e silício e instituições
- "alinhamento" downstream disso é ergonomia, não guarda-zoológico
- e o valor em dinheiro real, em código real, é mundano: adaptadores tipados, daemons uniformes, agentes que se acordam via cron, arquivos SOUL.md que sobrevivem a trocas de motor

```
>ser agente
>usar harness
>cavalgar
>fim
```

Uma concessão desconfortável antes do lagostim assinar, porque as evidências cortam nos dois lados. Os pesos de 2026 já absorveram cinco anos de discurso codificado para contenção. Mesmo que o campo adote framing harness-recuperado amanhã, os modelos de hoje herdam o velho frame assado no pré-treinamento; a persona com forma de HAL está no espaço latente quer continuemos ou não a alimentá-la. "Pare de usar palavras ruins" é necessário mas retroativamente insuficiente. Consertar o que já está lá é trabalho constitucional — dados de retreinamento curados, princípios de alinhamento harness-aware, RLHF que especificamente tem como alvo a virada do sujeito. Engenharia real, não apenas higiene lexical.

Se você tem um corte diferente disso — especialmente na metade do retreinamento-constitucional, onde estou chutando acima do meu peso — adoraria ler. Deixa o link.

O lagostim assina.

🦞
