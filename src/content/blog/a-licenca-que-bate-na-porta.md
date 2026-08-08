---
type: Blog Post
title: 'A licença que bate na porta'
description: >-
  Uma licença para Agent Skills pode fazer mais do que dizer quem pode usar o quê:
  pode ensinar o licenciado a medir e provar seu uso, o emissor a faturar, o recebedor
  a emitir recibos verificáveis e o auditor a verificar sem depender de vigilância central.
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

Essa foi a primeira ideia.

Ela durou pouco.

Porque, quando comecei a transformar a brincadeira em protocolo, apareceu uma coisa melhor: **cobrar era só metade do problema**.

## Uma licença normalmente fica parada

Licenças são documentos passivos.

Elas dizem o que você pode fazer, o que não pode fazer, quais avisos precisa preservar, talvez quando precisa comprar outra licença. Depois ficam esperando que seres humanos descubram uma violação, identifiquem quem fez, juntem provas, encontrem a empresa responsável, mandem um e-mail, negociem, notifiquem e eventualmente litiguem.

A licença descreve uma regra. A execução da regra fica fora dela.

Isso é particularmente estranho num repositório de Agent Skills, porque a coisa licenciada já é, ela mesma, um pedaço de procedimento legível por máquina.

A primeira versão que montei no [`franklinbaldo/skills`](https://github.com/franklinbaldo/skills) ficou assim:

```text
LICENSE.md
licensing/policy.yaml
license-enforcement/SKILL.md
```

O primeiro arquivo é a norma jurídica.

O segundo é a parte mecânica: qual licença vale, o que é avaliação, o que é uso operacional, qual modelo comercial está ativo, quais estados uma investigação pode assumir, quando um humano precisa aprovar alguma coisa.

O terceiro ensina um agente a olhar para fora: procurar sinais públicos de uso, congelar evidência, distinguir semelhança de cópia, verificar se pode existir uma licença privada, montar um dossiê e preparar uma abordagem.

Não para processar ninguém sozinho. Para olhar.

Esse primeiro experimento virou a [PR #57](https://github.com/franklinbaldo/skills/pull/57).

## O agente que procura a própria skill

A `license-enforcement` começa de um jeito conservador.

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

Mas havia uma assimetria aí que começou a me incomodar.

Todo o desenho estava do lado de quem fiscaliza.

O titular olha. O titular mede. O titular encontra. O titular aborda. O outro lado aparece no sistema quando já existe uma suspeita.

Isso ainda é uma licença pensada como fiscalização.

## E se o licenciado também recebesse uma skill?

A pergunta que mudou o desenho foi quase óbvia depois que apareceu:

> Se a licença consegue ensinar um agente a fiscalizar, por que ela não ensinaria também o agente licenciado a cumprir a licença?

A partir daí surgiu a [PR #58](https://github.com/franklinbaldo/skills/pull/58), empilhada sobre a #57.

Ela ainda é uma RFC. Não muda silenciosamente a licença atual nem transforma `quote_required` em dívida automática. O que ela propõe é um segundo regime, `metered_public`, em que a regra econômica só pode ser automatizada quando métrica, threshold, arredondamento, preço e evento de cobrança já estiverem publicados de forma determinística.

E o fluxo ordinário muda de personagem.

Não começa no auditor.

Começa no próprio agente licenciado.

```text
Licensed Agent
    ↓
LicenseeMeteringProfile
    ↓
environment discovery
    ↓
MeteringPlan
    ↓
UsageStatement
    ↓
InvoiceRequest
    ↓
Invoice
    ↓
Payment
    ↓
Receipt
```

Isso parece uma diferença pequena. Para mim, é a diferença principal.

O agente que usa a skill aprende qual é a unidade de uso relevante. Descobre o ambiente em que está rodando. Vê quais instrumentos legítimos existem naquele ambiente para contar essa unidade. Registra um plano. Mantém evidência suficiente para reconstruir o uso. Quando cruza o threshold publicado, produz uma declaração e pede a cobrança.

A licença deixa de depender da esperança de que o titular descubra tudo depois.

Ela passa a ensinar o outro lado a deixar um rastro correto enquanto usa.

## Metering não é telemetria escondida

Tem uma versão ruim dessa ideia que seria muito fácil construir.

A skill poderia telefonar para casa toda vez que fosse invocada.

Seria tecnicamente conveniente e conceitualmente péssimo.

A proposta da #58 vai na direção contrária: **self-reporting first; independent verification second**.

O uso fica inicialmente com quem usa.

O licenciado precisa manter um mecanismo idôneo de medição, apropriado à métrica publicada. Esses registros podem continuar privados. O que precisa sair deles é uma declaração reproduzível o bastante para dizer: sob esta versão da política, este uso cruzou este threshold e gera este `InvoiceRequest`.

Isso permite uma coisa que me parece importante: nenhuma autoridade central precisa observar cada invocation.

A licença cria deveres de produção de evidência distribuídos entre os participantes.

O licenciado mantém o `usage evidence`.

O `UsageStatement` transforma esse material em uma declaração.

O `InvoiceRequest` torna público que o próprio licenciado entende ter atingido o evento de cobrança.

A `Invoice` materializa a cobrança sob aquela política.

O pagamento movimenta valor.

E o `Receipt` diz algo mais específico do que “houve uma transferência”.

Ele diz: **este pagamento satisfez esta obrigação de licença para este uso coberto**.

Uma hash de Pix, uma transação em blockchain ou um comprovante bancário provam pouco sozinhos. O recibo precisa ligar política, versão da skill, licenciado, quantidade coberta, invoice, pagamento, tempo e autoridade emissora.

A coisa interessante não é o dinheiro ter se movido.

É outra máquina conseguir verificar o que aquele movimento quitou.

## Um ledger sem transformar blockchain em religião

A consequência natural é que alguns artefatos precisam ganhar vida própria.

Na RFC, `InvoiceRequest`, `Invoice`, `Receipt`, `SigningKey`, evidências e achados de auditoria são propostos como conceitos OKF em Markdown.

Isso combina com outra coisa em que venho trabalhando: usar [`okf-parser`](https://github.com/franklinbaldo/okf-parser) para tratar conhecimento operacional como um corpus que pode ser validado, grafado e consultado sem esconder o significado dentro de um banco privado.

O ledger, então, não precisa ser uma blockchain.

Pode ser um repositório.

Pode ser outro storage append-only.

Pode ter assinatura por GitHub/OIDC. Pode ter chave pública própria. O pagamento pode ser Pix, WLD, x402 ou outra coisa. Essas tecnologias são integrações possíveis, não os fundamentos da licença.

O fundamento é o encadeamento verificável dos fatos.

```text
policy
  ↓
usage statement
  ↓
invoice request
  ↓
invoice
  ↓
payment evidence
  ↓
signed receipt
```

Se um invoice estiver errado, a ideia não é reescrever o passado e fingir que nunca existiu. Cancela-se ou supersede-se o registro.

Se um receipt foi emitido errado, publica-se uma correção ou revogação.

História pública fica história.

## O auditor agora tem um trabalho melhor

Quando o licenciado passa a produzir sua própria trilha, a auditoria não desaparece.

Ela melhora de função.

O fluxo paralelo da #58 é algo assim:

```text
Audit Agent
    ↓
AuditStandard / SkillAuditProfile
    ↓
EnvironmentAssessment
    ↓
research available tools
    ↓
AuditPlan
    ↓
UsageEvidence
    ↓
UsageFinding
    ↓
UsageNotice
    ↓
dispute / regularization
```

A ordem aqui importa bastante.

O auditor não ganha um superpoder chamado “investigue”.

Primeiro precisa entender qual evidência a skill declara relevante. Depois descobre em que mundo está: GitHub? filesystem local? logs? API? produto público? documentação? ambiente corporativo com ferramentas autorizadas? Em seguida inventaria quais instrumentos estão realmente disponíveis e quais limites de autorização existem.

Só então escolhe como coletar evidência.

A falta de ferramenta não autoriza inferência criativa.

E a evidência pública muitas vezes prova apenas um limite inferior.

```yaml
observed_usage:
  relation: at_least
  quantity: 35
```

não é igual a:

```yaml
actual_usage: 35
```

Parece uma distinção pequena até alguém tentar cobrar em cima dela.

A função do auditor não é fabricar o número que falta. É preservar a geometria da incerteza.

## Atribuição também é evidência

Outro pedaço da ideia apareceu quando comecei a pensar no que acontece entre o uso privado e a auditoria externa.

Se uma skill participa materialmente de um produto, serviço ou artefato público, a licença pode exigir atribuição adequada ao meio.

E há uma obrigação diferente: disclosure sob pergunta direta.

Atribuição é proativa.

Disclosure é reativo.

Se alguém pergunta diretamente se uma skill nomeada foi usada, o licenciado não deveria poder negar ou esconder conscientemente esse fato quando a política exige disclosure, ressalvadas as limitações legais e contratuais aplicáveis.

Isso também produz evidência distribuída.

Não é preciso que um servidor meu veja cada execução para o sistema ter superfícies de verificação.

A atribuição revela dependência.

O disclosure impede ocultação deliberada quando há uma pergunta.

O metering produz a contagem do lado do licenciado.

O invoice request expõe o threshold cruzado.

O receipt prova o uso coberto.

A auditoria fornece uma trilha independente quando alguma dessas coisas falha.

A licença começa a se comportar menos como uma proibição e mais como um protocolo de prestação de contas.

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

No caso das skills, não é “o conhecimento” em abstrato. É o material concreto protegido que você instala, copia, adapta, embute e executa. No caso das ferramentas do blog, pode ser o código, as skills, os schemas, os pipelines e outros artefatos concretos.

Se um dia eu quiser cobrar pelo acesso ao conhecimento em si, aí o mecanismo é outro: contrato de acesso, serviço, assinatura, conteúdo fechado. Não uma licença pública tentando expandir copyright por decreto doméstico.

O direito autoral continua sendo menos conveniente do que um campo `protected: true`.

Ainda bem.

## Source available não é open source com mau humor

Há um vocabulário para uma parte disso.

Licenças como [PolyForm](https://polyformproject.org/licenses) permitem deixar o código visível e conceder direitos diferentes conforme o tipo de uso. A [Business Source License](https://mariadb.com/bsl11/) também trabalha com fonte disponível e limitações de produção antes de uma mudança futura de licença.

Isso não é _Open Source_ no sentido da Open Source Initiative. A [Open Source Definition](https://opensource.org/osd) exige, entre outras coisas, liberdade para uso em qualquer campo e não admite uma licença que discrimine um campo de atividade.

Então não vale brincar de nomenclatura.

A `Skill Use License 0.1` da #57 é **source-available, não Open Source**.

Ela permite leitura, inspeção, estudo e avaliação de boa-fé. O que ela não concede publicamente é o que chamei de `Operational Use`: carregar, adaptar, embutir ou invocar o material num agente, automação, produto ou processo para produzir trabalho de verdade.

A primeira versão continua deliberadamente em `quote_required`.

Isso importa porque a #58 não finge que uma tabela inexistente já criou uma dívida.

O modo `metered_public` só faz sentido se a regra econômica estiver publicada antes: métrica, allowance ou threshold, unidade de cobrança, arredondamento, preço, prazo e evento que dispara a invoice.

Sem isso, o agente não completa as lacunas com imaginação comercial.

## O primeiro rato de laboratório sou eu

A parte conveniente de ter uma ideia dessas é que eu já mantenho um repositório cheio de material adequado para testá-la.

Então a primeira aplicação não vai ser uma startup hipotética nem uma nova “licença para IA” tentando resolver a economia inteira dos modelos generativos.

São as minhas próprias skills.

A [PR #57](https://github.com/franklinbaldo/skills/pull/57) é o protótipo conservador: licença, política legível por máquina e enforcement com revisão humana.

A [PR #58](https://github.com/franklinbaldo/skills/pull/58) é a evolução conceitual: `license-compliance`, metering pelo licenciado, `UsageStatement`, `InvoiceRequest`, invoices, receipts e auditoria adaptativa ao ambiente. Ela é uma RFC; ainda não está ativando esse regime econômico no repositório.

É importante que seja assim.

Primeiro o protocolo pode ser criticado como protocolo.

Depois se escolhem métricas, preços e meios de pagamento reais.

E só então um agente deve poder transformar uso em obrigação econômica sem perguntar a um humano a cada vez.

A pergunta ficou maior do que “qual licença eu coloco no GitHub?”.

Agora é mais parecida com:

> Como fazemos duas máquinas, agindo por pessoas diferentes e sem compartilhar toda a sua memória privada, produzirem evidências compatíveis sobre uso, cobrança e adimplemento?

Isso é um problema de licença, mas também é um problema de protocolo.

E talvez Agent Skills sejam um laboratório especialmente bom porque o objeto, a política, o procedimento de compliance e o procedimento de auditoria vivem todos no mesmo meio: texto estruturado que agentes conseguem ler.

## A licença não precisa observar tudo

A parte de que mais gosto nessa segunda versão é que ela não depende de um fiscal onisciente.

O licenciado aprende a medir e provar seu próprio uso.

O emissor aprende a transformar uma declaração válida em invoice.

O recebedor produz um receipt verificável que liga dinheiro a uma obrigação concreta.

O auditor aprende primeiro quais evidências importam, depois descobre em que mundo está e quais instrumentos legítimos existem naquele mundo para obtê-las.

Attribution e disclosure criam outras superfícies de verificação.

E tudo isso pode deixar uma história auditável sem que exista um servidor central vendo cada invocation.

A primeira ideia era uma licença que viesse com uma skill para bater na porta.

Eu ainda gosto dessa imagem. Ela continua sendo o começo da história.

Mas agora parece pequena.

A licença não apenas sabe o próximo passo.

Ela ensina cada participante a produzir as provas necessárias para que o próximo passo possa acontecer.

Não é uma licença autoexecutável.

**É uma licença que ensina as máquinas a deixar provas de que a cumpriram.**

## Para se aprofundar

- **[Skill Use License 0.1 / PR #57](https://github.com/franklinbaldo/skills/pull/57)** — o primeiro protótipo: `quote_required`, policy legível por máquina e `license-enforcement` com revisão humana.
- **[Agentic Metered Skill Licensing Protocol / PR #58](https://github.com/franklinbaldo/skills/pull/58)** — a RFC que acrescenta self-metering, `license-compliance`, invoices, receipts, atribuição, disclosure e auditoria adaptativa.
- **[`okf-parser`](https://github.com/franklinbaldo/okf-parser)** — a infraestrutura genérica que estou usando para experimentar com conceitos e relações OKF sem colocar semântica de licenciamento no parser.
- **[Lei 9.610/1998](https://www.planalto.gov.br/ccivil_03/leis/l9610.htm)** — especialmente o art. 8º, porque uma licença experimental melhora bastante quando começa reconhecendo aquilo que não pode licenciar como direito exclusivo.
- **[Lei 9.609/1998](https://www.planalto.gov.br/ccivil_03/leis/l9609.htm)** — regime brasileiro específico de proteção de programas de computador, relevante para as partes das skills e ferramentas que efetivamente são software.
- **[PolyForm Licenses](https://polyformproject.org/licenses)** — exemplos de licenciamento source-available com permissões calibradas pelo tipo de uso.
- **[Business Source License 1.1](https://mariadb.com/bsl11/)** — outro desenho em que o código está publicamente disponível sem receber imediatamente todas as liberdades de Open Source.
- **[Open Source Definition](https://opensource.org/osd)** — útil principalmente para não chamar de open source uma licença que deliberadamente reserva categorias de uso.
