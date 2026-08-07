---
type: Blog Post
title: 'A licença que bate na porta'
description: >-
  Se uma skill é texto que um agente pode executar, talvez a licença dela também
  devesse vir acompanhada de um procedimento executável para descobrir uso,
  provar o caminho e oferecer regularização.
date: '2026-08-07'
lang: pt
docType: essay
translationKey: the-license-that-knocks
tags:
  - ai
  - agents
  - copyright
  - licensing
  - law
emoji: '🧾'
---

Meu repositório de skills não tinha licença.

Isso é uma frase meio ridícula para alguém que passa uma quantidade pouco defensável de tempo pensando em regras, contratos, proveniência e agentes. O repositório estava público. As skills estavam ali para serem lidas, instaladas e usadas. E eu nunca tinha parado para decidir, de forma explícita, o que exatamente eu estava autorizando.

A omissão fica mais interessante quando se pergunta o que é uma skill.

Ela parece software porque é instalada. Parece documentação porque é Markdown. Parece prompt porque contém instruções para um modelo. Parece um pequeno manual porque ensina uma tarefa. E, quando funciona, parece um pouco com contratar alguém que já sabe como fazer aquela tarefa.

Uma licença MIT sabe lidar muito bem com software. Uma licença de livro sabe lidar razoavelmente bem com texto. Uma Agent Skill fica num lugar esquisito entre as duas coisas: você pode lê-la como um capítulo e pode também carregá-la num agente e fazê-la trabalhar.

Foi aí que me ocorreu uma ideia um pouco mais desagradável.

E se a própria licença viesse com uma skill para cobrar a licença?

## Uma licença normalmente fica parada

Licenças são documentos passivos.

Elas dizem o que você pode fazer, o que não pode fazer, quais avisos precisa preservar, talvez quando precisa comprar outra licença. Depois ficam esperando que seres humanos descubram uma violação, identifiquem quem fez, juntem provas, encontrem a empresa responsável, mandem um e-mail, negociem, notifiquem e eventualmente litiguem.

A licença descreve uma regra. A execução da regra fica fora dela.

Isso é particularmente estranho num repositório de Agent Skills, porque a coisa licenciada já é, ela mesma, um pedaço de procedimento legível por máquina.

Então imagine o pacote:

```text
LICENSE.md
licensing/policy.yaml
license-enforcement/SKILL.md
```

O primeiro arquivo continua sendo a norma jurídica.

O segundo é a parte mecânica: qual licença vale, o que é avaliação, o que é uso operacional, se existe preço público, quais estados uma investigação pode assumir, quando um humano precisa aprovar alguma coisa.

O terceiro ensina um agente a fazer o trabalho que normalmente aparece meses depois, quando alguém percebe que talvez sua obra esteja sendo usada sem autorização.

Não para processar ninguém sozinho. Para olhar.

## O agente que procura a própria skill

A primeira versão que estou testando no [`franklinbaldo/skills`](https://github.com/franklinbaldo/skills) começa de um jeito conservador.

O agente recebe uma versão específica de uma skill minha e procura evidência pública de uso. Não basta encontrar outra ferramenta com a mesma finalidade. Ele precisa congelar a versão de origem, registrar o commit, localizar expressão concreta que pareça ter sobrevivido e preservar o contexto do outro lado.

Depois classifica o caso.

```text
signal
  ↓
verified_use
  ↓
actionable_concern
  ↓
human_review
  ↓
compliance_inquiry
  ↓
regularization_offer
  ↓
formal_notice
  ↓
legal_escalation
```

`signal` quer dizer: achei algo parecido o suficiente para olhar.

`verified_use` quer dizer: há evidência razoável de que material daquela skill foi copiado, adaptado, incorporado ou executado.

Ainda não quer dizer que houve uso ilícito.

Pode existir uma licença privada. Pode haver autorização anterior. Pode ser uma exceção legal. Pode ser material de terceiro que nós dois copiamos legitimamente. Pode ser simplesmente uma parte que eu não tenho direito de monopolizar.

Só depois dessas perguntas aparece `actionable_concern`: uso verificado, aparentemente operacional, sem licença conhecida ou explicação suficiente. E mesmo isso continua sendo uma classificação interna, não uma sentença judicial escrita em YAML.

A skill então monta um dossiê para uma pessoa decidir se quer entrar em contato.

Essa divisão me interessa porque agentes são excelentes máquinas de pular do indício para a ação quando você formula o objetivo errado. “Encontre empresas usando minha skill e cobre” é um prompt para produzir falsos positivos com convicção empresarial. “Construa uma cadeia de evidência e pare antes do contato” é outro sistema.

A diferença não está no modelo. Está no protocolo.

## A parte em que a ideia esbarra no direito autoral

Eu queria uma licença com uma intuição simples: isto aqui é como um livro. Você pode abrir, ler, aprender. Se quiser colocar a coisa para trabalhar dentro da sua empresa, fazemos uma transação.

Essa intuição funciona só até certo ponto.

A Lei 9.610/1998 é bastante inconveniente para quem gostaria de cobrar aluguel sobre pensamentos: o art. 8º exclui da proteção autoral, como tais, ideias, procedimentos normativos, sistemas, métodos, projetos e conceitos. Na parte científica e técnica, a própria lei também separa a forma de expressão do conteúdo técnico.

Isso não é um detalhe para esconder no rodapé. É exatamente a fronteira que a licença precisa respeitar.

Se alguém lê uma skill minha, entende uma boa ideia e depois implementa aquela ideia independentemente, a frase “uso operacional exige pagamento” não transforma a ideia em propriedade intelectual que eu passei a possuir. Uma licença não cria direitos autorais onde a lei deliberadamente não criou.

O mesmo vale para este blog.

Eu posso escrever uma arquitetura, explicar uma técnica, contar como construí uma ferramenta. O texto é uma obra. O código pode ser protegido. Uma seleção particular de instruções pode ser expressão protegida. Mas eu não ganho um pedágio geral sobre todo cérebro que aprendeu alguma coisa aqui.

Isso estraga uma versão mais gananciosa da ideia e melhora a versão que sobra.

Porque obriga a perguntar qual é de fato o objeto econômico.

No caso das skills, não é “o conhecimento” em abstrato. É o pacote concreto que você instala, copia, adapta, embute e executa. No caso das ferramentas do blog, pode ser o código, as skills, os schemas, os pipelines e outros artefatos concretos. Se um dia eu quiser cobrar pelo acesso ao conhecimento em si, aí o mecanismo é outro: contrato de acesso, serviço, assinatura, conteúdo fechado. Não uma licença pública tentando expandir copyright por decreto doméstico.

O direito autoral continua sendo menos conveniente do que um campo `protected: true`.

Ainda bem.

## Source available não é open source com mau humor

Há um vocabulário para uma parte disso.

Licenças como [PolyForm](https://polyformproject.org/licenses) permitem deixar o código visível e conceder direitos diferentes conforme o tipo de uso. A [Business Source License](https://mariadb.com/bsl11/) também trabalha com fonte disponível e limitações de produção antes de uma mudança futura de licença.

Isso não é _Open Source_ no sentido da Open Source Initiative. A [Open Source Definition](https://opensource.org/osd) exige, entre outras coisas, liberdade para uso em qualquer campo e não admite cobrar uma licença adicional simplesmente porque o uso é comercial.

Então não vale brincar de nomenclatura.

A licença que coloquei na primeira PR é **source-available, não Open Source**.

Ela permite leitura, inspeção, estudo e avaliação de boa-fé. O que ela não concede publicamente é o que chamei de `Operational Use`: carregar, adaptar, embutir ou invocar o material num agente, automação, produto ou processo para produzir trabalho de verdade.

Para isso, a licença diz que é preciso uma licença paga separada.

Ainda não defini o preço.

Isso é proposital.

Seria fácil colocar “US$ 100 por empresa por ano” porque números dão à arquitetura um ar reconfortante de produto. Seria também uma decisão econômica tirada do nada. A primeira versão usa `quote_required`: encontrou alguém que quer usar, conversa-se sobre escopo e preço.

Mais importante: a licença também diz que encontrar uso não autorizado **não cria magicamente uma dívida contratual igual ao preço que eu resolver publicar depois**.

Eu posso oferecer uma licença retroativa ou um acordo. Posso, conforme o caso, ter outros direitos e remédios previstos em lei. Mas “minha tabela diz R$ X” e “você já me deve R$ X” são frases diferentes.

Eu queria que a própria skill soubesse essa diferença.

## A cobrança começa tentando não cobrar a pessoa errada

A parte divertida da ideia é imaginar um agente vasculhando a internet, reconhecendo uma skill, descobrindo a empresa responsável e batendo na porta.

A parte importante é todo o trabalho que acontece antes da batida.

A skill que coloquei na [PR experimental do repositório](https://github.com/franklinbaldo/skills/pull/57) tem algumas proibições que fazem mais trabalho do que a parte de cobrança.

Ela não pode tratar semelhança funcional como cópia. Não pode assumir que “não achei licença” significa “não existe licença”. Precisa procurar contraprova. Precisa distinguir expressão concreta de método ou ideia. Não pode inventar um preço. E não pode entrar em contato com ninguém sem aprovação humana explícita.

O primeiro contato, quando houver, é uma consulta de compliance.

Algo na linha de: encontramos este artefato público, ele parece incorporar este material, a licença pública não concede uso operacional, mas talvez exista uma autorização privada que não conhecemos. Se existe, nos diga. Se não existe, podemos conversar sobre regularização.

Só depois faria sentido uma proposta retroativa. E, se ainda houver uma controvérsia, uma notificação extrajudicial preparada para revisão humana.

O agente pode montar a cronologia, preservar páginas, comparar versões, identificar a pessoa jurídica, organizar correspondência e construir o pacote que um advogado ou titular dos direitos vai analisar.

Ele não precisa ganhar o direito de ser o advogado.

Isso é muito parecido com o que venho descobrindo em outros usos de agentes: o lugar útil da automação frequentemente termina um passo antes da autoridade.

## A licença tem uma porta dos fundos, mas para entrar pela frente

A parte de que mais gostei no desenho é uma pequena recursão.

Se todo uso operacional das skills exige uma licença paga, então a própria `license-enforcement` também exigiria licença para alguém descobrir se está violando a licença.

Seria engraçado por aproximadamente cinco segundos.

Então a licença contém uma exceção específica: qualquer pessoa pode usar gratuitamente a skill de enforcement para fazer _self-audit_, entender os termos, verificar se precisa de licença, entrar em contato comigo ou responder a uma apuração.

A ferramenta que fiscaliza a licença é também a ferramenta que ajuda o outro lado a ficar em conformidade com ela.

Isso muda um pouco o caráter da coisa.

Uma licença tradicional é escrita para um leitor hipotético. Aqui existe a possibilidade de duas máquinas lerem a mesma política de lados diferentes. Meu agente pergunta: “este uso parece coberto?”. O agente da empresa pergunta: “o nosso workflow é operacional? qual material estamos carregando? temos uma licença?”. Os dois podem produzir artefatos comparáveis antes de um ser humano precisar começar a discutir por e-mail.

A licença começa a parecer menos com um aviso na parede e mais com um protocolo.

Não um _smart contract_. Nada se executa sozinho no mundo jurídico. Não existe blockchain capaz de transformar uma inferência ruim em fundamento legal bom.

Mas existe algo menor e talvez mais útil: uma norma acompanhada da sua implementação operacional.

```text
legal text
    +
machine-readable policy
    +
compliance/enforcement skill
    =
a license an agent can actually work with
```

## O primeiro rato de laboratório sou eu

A parte conveniente de ter uma ideia dessas é que eu já mantenho um repositório cheio de material adequado para testá-la.

Então a primeira aplicação não vai ser uma startup hipotética nem uma nova “licença para IA” tentando resolver a economia inteira dos modelos generativos.

São as minhas próprias skills.

A [PR #57](https://github.com/franklinbaldo/skills/pull/57) adiciona a `Skill Use License 0.1`, o `policy.yaml` e a primeira versão da `license-enforcement` skill. Ainda está em draft. Não há preço definido, registro de licenças emitidas, fingerprint automático nem sistema de pagamento. Muito menos um exército de agentes mandando notificações para empresas.

O que existe é o contrato entre as peças.

E ele já produz perguntas que eu não teria feito se tivesse simplesmente colocado MIT no repositório e ido dormir.

Como se prova que uma skill foi usada, e não apenas reinventada? Qual é a unidade econômica: skill, empresa, agente, execução, ano? Como uma empresa prova para um agente fiscalizador que tem licença sem publicar seu contrato? Como versionar direitos quando a skill muda todo mês? O que acontece com forks anteriores? Quanto da detecção pode ser automática sem transformar fingerprint em caça a coincidências? Qual é a forma mínima de um recibo que outra máquina consegue verificar?

Essas perguntas são melhores do que “qual licença eu coloco no GitHub?”.

A hipótese que estou testando é que Agent Skills criam uma categoria especialmente boa para experimentar com licenças operacionais porque o objeto e o procedimento vivem no mesmo meio: texto estruturado que agentes conseguem ler.

Uma licença para software sempre pôde ser lida por uma máquina. Isso é banal.

A diferença é uma licença que vem acompanhada de instruções para a máquina saber o que fazer depois de ler.

Não é uma licença autoexecutável.

É uma licença que sabe o próximo passo.

## Para se aprofundar

- **[Skill Use License 0.1 / PR #57](https://github.com/franklinbaldo/skills/pull/57)** — o experimento descrito aqui, ainda em draft e deliberadamente sem preço fixo.
- **[Lei 9.610/1998](https://www.planalto.gov.br/ccivil_03/leis/l9610.htm)** — especialmente o art. 8º, porque uma licença experimental melhora bastante quando começa reconhecendo aquilo que não pode licenciar como exclusividade autoral.
- **[Lei 9.609/1998](https://www.planalto.gov.br/ccivil_03/leis/l9609.htm)** — regime brasileiro de proteção de programas de computador, relevante para as partes das skills e ferramentas que efetivamente são software.
- **[PolyForm Licenses](https://polyformproject.org/licenses)** — exemplos de licenciamento source-available com permissões calibradas pelo tipo de uso.
- **[Business Source License 1.1](https://mariadb.com/bsl11/)** — outro desenho em que código fica publicamente disponível sem receber imediatamente todas as liberdades de Open Source.
- **[Open Source Definition](https://opensource.org/osd)** — útil sobretudo para não chamar de open source uma licença que deliberadamente exige pagamento para determinado uso.
