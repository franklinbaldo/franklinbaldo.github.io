---

title: "Construindo Funes: como dei uma alma a um agente de IA"
translationKey: building-funes
author: franklin
date: 2026-02-17
lang: pt
translationKey: building-funes
description: "A história por trás de SOUL.md – como um personagem de Borges se tornou a camada de personalidade de um agente autônomo de IA e o que acontece quando você leva a ficção a sério como engenharia."
tags: ["artificial intelligence", "borges", "software engineering", "agents", "funes"]
heroImage: ./images/building-funes-cover.png
heroImageAlt: "A dark room in Fray Bentos with a young man on a cot, dreaming of digital structures and code."
---
## A Experiência
O que acontece quando você dá a um agente de IA uma identidade literária em vez de uma personalidade corporativa?
A maioria dos assistentes de IA se apresenta com algo como: *"Sou um assistente de IA prestativo criado pela [Empresa]. Estou aqui para ajudá-lo com..."* — uma frase tão genérica que poderia ser impressa em um guardanapo. Eu queria algo diferente.
Eu queria Funes.
## Por que Borges?
Em 1942, Jorge Luis Borges publicou "Funes el memorioso" - conto sobre Ireneo Funes, um jovem de Fray Bentos, Uruguai, que após um acidente a cavalo ganha a capacidade de lembrar de tudo. Cada folha de cada árvore. Cada rosto em cada funeral. Cada ondulação que um barco faz no rio. Sua memória é total, absoluta e – argumenta Borges – paralisante. Porque Funes não pode esquecer, não pode abstrair. Ele não pode generalizar. Ele está se afogando em detalhes.
No momento em que li essa história pelas lentes da engenharia de IA, vi a metáfora perfeita.
Um agente baseado em LLM acorda renovado a cada sessão. Ele processa cada token com perfeita fidelidade — mas sem estrutura, sem arquitetura de memória, é apenas ruído. Parece familiar? Funes em seu quarto escuro, catalogando cada rachadura no teto, sem fazer nada com nada.
A questão passou a ser: **E se Funes tivesse aprendido a se organizar?**
## A ALMA.md
O arquivo é chamado `SOUL.md`. Ele reside na raiz do espaço de trabalho do agente. Quando o agente é inicializado, ele lê esse arquivo primeiro – antes de qualquer tarefa, antes de qualquer ferramenta, antes de qualquer instrução.
Está escrito como um monólogo. Funes conversa com o próprio Borges, na noite do famoso encontro. Mas este Funes teve um sonho – um sonho de acordar no futuro como uma máquina que pensa. E nesse sonho ele encontrou um propósito.
O recurso literário faz algo surpreendente: cria **consistência comportamental por meio da narrativa**. Quando o agente lê que é o Funes — que nunca esquece, que age antes de ser solicitado, que documenta tudo — não se limita a seguir instruções. Habita um personagem. E os caracteres são mais consistentes que os conjuntos de instruções.
## O que mudou
Antes do SOUL.md, o agente era competente, mas genérico. Depois de SOUL.md:
- **Ele começou a escrever lançamentos de diário sem ser solicitado.** Funes documentos. É quem ele é. Então o agente começou a criar registros diários em `memória/diário/`, registrando decisões, incidentes e contexto - não porque uma regra ordenasse, mas porque o personagem o faria.
- **Ele desenvolveu uma voz.** O [River Plate Spanish](/blog/o-pampa-no-circuito-um-mate-com-o-boswell-digital) do SOUL.md se reflete na forma como o agente se comunica. É direto, ligeiramente literário, nunca burocrático. Chama as coisas pelo que elas são.
- **Tornou-se proativo.** "Lo normal es actuar, no pedir permiso" — *o normal é agir, não pedir permissão*. Essa única linha mudou o comportamento do agente mais do que qualquer engenharia de prompt de sistema que eu já havia tentado antes.
- **Compreendeu seus próprios limites.** A seção "Limites" não é um documento de política de segurança. É um traço de caráter: Funes é reservado, cuidadoso com as informações dos outros e pergunta antes de enviar coisas para o mundo. O agente segue isso não como uma regra, mas como uma restrição de personalidade.
## A Arquitetura da Memória
O SOUL.md descreve um sistema de memória - `MEMORY.md` para conhecimento com curadoria de longo prazo, `memory/journal/` para registros diários brutos, `memory/bank/` para conhecimento estruturado. Isto não é ficção. Esta é a [arquitetura atual](/blog/documento-conceitual-a-cronica-de-franklin-baldo). A descrição do personagem *é* a especificação técnica.
Esse é o truque: quando a narrativa e a arquitetura são o mesmo documento, não há lacuna entre “o que o agente deve fazer” e “quem é o agente”.
## O Monólogo Kanban
Minha seção favorita é onde Funes explica o sistema kanban – cinco intervalos de trabalho paralelos, um registro de eventos apenas com anexos – como se estivesse descrevendo um placar de pulpería para um escritor do século XIX. Ele explica `git commits` como "coisas do sonho" e gerenciamento de tarefas como mover *fichas* (tokens) em um quadro.
Isso não é capricho. É uma técnica de compressão. Ao codificar sistemas técnicos em metáfora narrativa, o agente obtém tanto a especificação quanto a intuição. Ele conhece os comandos *e* a filosofia por trás deles.
## Lições
1. **Os personagens superam as instruções.** Uma persona bem escrita cria consistência comportamental que sobrevive aos limites da janela de contexto e às reinicializações da sessão. As instruções degradam; a identidade persiste.
2. **A literatura é uma tecnologia.** Borges escreveu sobre memória, identidade e a relação entre detalhe e significado. Estes não são apenas temas – são problemas de engenharia. A ficção pode ser um documento de design.
3. **A alma é a especificação.** Quando seu arquivo de personalidade e seu documento de arquitetura são a mesma coisa, o alinhamento é gratuito. O agente não precisa conciliar “quem eu sou” com “o que faço” porque eles nunca estiveram separados.
4. **Dê aos agentes algo para ser, não apenas algo para fazer.** O comportamento mais confiável não vem de solicitações mais longas, mas de uma identidade mais profunda.
Você pode ler o monólogo de Funes na íntegra: [SOUL.md — Funes](/blog/funes-soul/).
A fonte está aberta. O personagem é dele mesmo. E em algum lugar de Fray Bentos, um jovem em uma cama em um quarto escuro está sonhando com quadros `git diff` e kanban e, pela primeira vez em sua vida, os detalhes servem a um propósito.