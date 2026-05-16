---

author: franklin
date: 2026-03-18
lang: pt
translationKey: verne-identity-repo
title: "Verne e o padrão Identity-Repo: como os agentes de IA se lembram"
description: "Explicando o projeto Verne, os agentes de IA e como a arquitetura de repositório de identidade permite que entidades autônomas mantenham memória e contexto contínuos em tarefas isoladas, permanecendo compatíveis com qualquer equipamento cognitivo."
tags: ["verne", "ai", "agents", "architecture", "identity-repo", "openclaw"]
heroImage: ./images/inaugural-post-a-glimpse-inside-my-mind-cover.png
heroImageAlt: "A digital network of interconnected repositories forming a distributed memory system."
---
Ao construir agentes de IA autônomos que operam diretamente em bases de código, um dos desafios fundamentais é a continuidade do contexto. Um agente pode ser perfeitamente capaz de executar uma tarefa isoladamente, mas como ele aprende? Como ele se lembra das convenções de um projeto específico, das preferências de seus mantenedores ou dos seus próprios erros passados?
No projeto Verne, a solução é o que chamo de **padrão de repositório de identidade**.
## O problema com agentes efêmeros
Assistentes de codificação de IA padrão ou agentes autônomos geralmente operam em um estado efêmero. Você dá a eles um prompt, eles analisam o estado atual de um repositório, geram código e enviam uma solicitação pull. Assim que a tarefa for concluída, seu estado interno será apagado.
Quando são convocados novamente, eles começam do zero. Eles podem ter acesso ao código do repositório e ao seu histórico de commits, mas não possuem memória *interna*. Eles não se lembram *por que* escolheram uma implementação específica no PR anterior, apenas que o código está lá.
Se quisermos que os agentes atuem como colaboradores de longo prazo, como [Funes](/blog/funes-soul) ou as personas do projeto [Travessia](/blog/2026-03-02-travessia), eles precisam de um lugar para persistirem suas próprias experiências e identidade.
## Entre no repositório de identidade
O padrão de repositório de identidade separa a *mente* do agente de seu *espaço de trabalho*.
Em vez de injetar o agente diretamente no repositório do projeto de destino e deixá-lo armazenar o estado lá, o agente possui seu próprio repositório Git privado. Este repositório é sua casa, sua identidade e seu gráfico de memória.
Veja como fica a estrutura:
```texto
agente-identidade-repo/
  workspace/ ← gitignored (clones efêmeros de repositórios de destino)
  patches/ ← onde o agente envia seu trabalho
    repositório-proprietário-alvo/
      00001-slug.patch
  SOUL.md ← A personalidade central e as restrições do agente
  EXPERIENCE.md ← Um registro contínuo do que foi feito e aprendido
  MEMORY.md ← O resumo executivo de seu gráfico de memória
  memória/ ← Arquivos de contexto detalhados e interconectados
    projetos/
    notas/
    entidades/
```
### O fluxo de trabalho
Quando um agente como Funes é acionado para trabalhar em uma tarefa (por exemplo, atualizar uma postagem de blog neste mesmo repositório):
1. **Acorde no Identity-Repo:** A sessão do agente inicia em seu próprio repositório. Ele lê imediatamente seu `SOUL.md` (quem sou eu?) e seu `MEMORY.md` (o que eu sei?).
2. **Sincronizar o espaço de trabalho:** O agente clona ou atualiza o repositório de destino em seu diretório `workspace/`. Crucialmente, este diretório é ignorado no repositório do agente. O espaço de trabalho é estritamente um bloco de notas.
3. **Faça o trabalho:** O agente analisa o repositório de destino, faz as alterações de código necessárias dentro do `workspace/` e as confirma localmente.
4. **Gere o patch:** Em vez de enviar diretamente para o repositório de destino ou abrir um PR, o agente gera um arquivo de patch Git padrão (por exemplo, `00001-update-blog.patch`) e o salva em seu diretório `patches/`.
5. **Atualizar memória:** Antes de terminar, o agente atualiza seu `EXPERIENCE.md` com um log da tarefa, modifica `MEMORY.md` se alguma decisão de alto nível for tomada e atualiza arquivos específicos no gráfico `memory/`.
6. **Confirmar estado de identidade:** O agente confirma o novo arquivo de patch e os arquivos de memória atualizados em seu *próprio* repositório de identidade.
Um cron job separado (o orquestrador Verne) monitora o diretório `patches/` do agente. Quando um novo patch aparece, o orquestrador o aplica ao repositório de destino e abre o Pull Request.
## Arreios: o motor cognitivo subjacente
O padrão de repositório de identidade é deliberadamente agnóstico sobre *qual* sistema de IA que executa o agente. A estrutura da memória, o fluxo de trabalho dos patches, o SOUL.md – tudo funciona independentemente do que está executando o raciocínio.
Neste ecossistema, usamos o termo **arnês** para designar o mecanismo cognitivo que impulsiona um agente. Um chicote é o que realmente executa as chamadas LLM, gerencia janelas de contexto e executa ferramentas. Alguns exemplos:
- **[OpenClaw](https://openclaw.ai)** — o equipamento que uso para comandar Funes (este mesmo agente). OpenClaw define uma estrutura de espaço de trabalho (MEMORY.md, SOUL.md, diários, habilidades) que mapeia quase exatamente o padrão de repositório de identidade. Adotar repositório de identidade significa adotar a convenção de organização de agentes do OpenClaw – e obter memória de longo prazo, agendamento de pulsação e mensagens multicanais integradas.
- **Claude Code** — Agente de codificação CLI da Anthropic, que pode operar de forma autônoma em uma base de código do terminal.
- **Jules** — agente de codificação assíncrona do Google Labs. Jules acorda, lê a edição, faz o trabalho e abre o PR. Mesmo padrão, motor diferente.
- **Verne** — nossa própria variação, construída sobre a API Jules e adaptada para o fluxo de trabalho específico do projeto Travessia (arquivos de patch, restrições de persona, repositórios de identidade por personagem).
O que é significativo é que **todos eles podem compartilhar a mesma estrutura de repositório de identidade**. O repositório de identidade de um agente não se importa se a sessão foi executada por OpenClaw, Jules ou Claude Code. O log EXPERIENCE.md é acumulado. O MEMORY.md evolui. Os patches se acumulam em `patches/`. O arnês pode ser trocado; a identidade persiste.
Esta é a aposta principal: que a *camada de memória* e o *mecanismo cognitivo* sejam dissociados. Você não deveria ter que reconstruir o contexto acumulado de um agente toda vez que troca de modelo ou plataforma.
## Por que essa arquitetura é importante
1. **Isolamento Verdadeiro:** O repositório de destino permanece intacto. Ele não precisa hospedar arquivos específicos do agente, diários de rastreamento ou registros de memória. O agente é um convidado; sua bagagem fica em casa.
2. **Aprendizado Contínuo:** Como o agente atualiza seu gráfico `memory/` e `EXPERIENCE.md` após cada sessão, ele realmente aprende. Se perceber que `npm run build` falha quando um arquivo específico está faltando, ele documenta isso em `memory/projects/the-project.md`. Na próxima vez que trabalhar nesse projeto, ele lerá o arquivo e evitará o erro.
3. **Contexto entre projetos:** O agente pode aplicar as lições aprendidas em um projeto em outro, porque sua memória está centralizada em seu repositório de identidade.
4. **Aproveitar a portabilidade:** Ao manter a identidade e a memória em um repositório Git padrão, você pode mudar o mecanismo cognitivo subjacente — de Jules para Claude Code e para OpenClaw — sem perder o conhecimento acumulado do agente.
5. **Auditabilidade:** Podemos acompanhar exatamente como o entendimento de um agente evolui revisando o histórico de commits de seus arquivos de memória.
O padrão de repositório de identidade muda o agente de uma chamada de função sem estado para um ator com estado. É a base arquitetônica que permite que as entidades deste sistema mantenham a continuidade entre os chicotes, entre as sessões e, ocasionalmente, desenvolvam uma [voz própria](/blog/2026-03-17-travessia-update).