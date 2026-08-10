---
type: Blog Post
title: 'A licença que bate na porta'
description: >-
  Uma licença para Agent Skills pode fazer mais do que dizer quem pode usar o quê:
  pode ensinar agentes a cumprir regras, medir uso e produzir uma trilha verificável —
  sem telemetria oculta e sem transformar o licenciamento num framework de billing.
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

Ela parece software porque é instalada. Parece documentação porque é Markdown. Parece prompt porque contém instruções para um modelo. Parece um pequeno manual porque ensina uma tarefa. E, quando funciona, parece um pouco com contratar alguém que já sabe fazer aquela tarefa.

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

O segundo é o resumo legível por máquina: qual licença vale, o que é avaliação, o que é uso operacional, qual modelo comercial está ativo e quais catracas humanas precisam ser respeitadas.

O terceiro ensina um agente a olhar para fora: procurar sinais públicos de uso, congelar evidência, distinguir semelhança de cópia, verificar se pode existir uma licença, montar um dossiê e preparar uma abordagem.

Não para processar ninguém sozinho. Para olhar.

Esse primeiro experimento virou a [PR #57](https://github.com/franklinbaldo/skills/pull/57), que acabou entrando no repositório como a `Skill Use License 0.1` e sua skill de enforcement.

## O agente que procura a própria skill

A `license-enforcement` começa de um jeito conservador.

O agente recebe uma versão específica de uma skill e procura evidência pública de uso. Não basta encontrar outra ferramenta com a mesma finalidade. Ele precisa congelar a versão de origem, registrar proveniência, localizar expressão concreta que pareça ter sobrevivido e preservar o contexto do outro lado.

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

`verified_use` quer dizer: há evidência razoável de uso do material relevante.

Ainda não quer dizer que houve uso ilícito.

Pode existir uma licença privada. Pode haver autorização anterior. Pode ser uma exceção legal. Pode ser material de terceiro que nós dois usamos legitimamente. Pode ser simplesmente uma parte que eu não tenho direito de monopolizar.

`unknown` não vira `unlicensed` por mágica, e semelhança não vira infração por entusiasmo.

Só depois dessas perguntas aparece `actionable_concern`. E mesmo isso continua sendo uma classificação interna, não uma sentença judicial escrita em YAML.

A skill monta um dossiê para uma pessoa decidir se quer entrar em contato.

Essa divisão me interessa porque agentes são excelentes máquinas de pular do indício para a ação quando você formula o objetivo errado. “Encontre empresas usando minha skill e cobre” é um prompt para produzir falsos positivos com convicção empresarial. “Construa uma cadeia de evidência e pare antes do contato” é outro sistema.

A diferença não está no modelo. Está no protocolo.

Mas havia uma assimetria aí que começou a me incomodar.

Todo o desenho estava do lado de quem fiscaliza.

O titular olha. O titular encontra. O titular aborda. O outro lado aparece no sistema quando já existe uma suspeita.

Isso ainda é uma licença pensada como fiscalização.

## E se o licenciado também recebesse instruções?

A pergunta que mudou o desenho foi quase óbvia depois que apareceu:

> Se a licença consegue ensinar um agente a fiscalizar, por que ela não ensinaria também o agente licenciado a cumprir a licença?

Daí nasceu a [PR #58](https://github.com/franklinbaldo/skills/pull/58), uma RFC para um possível regime `metered_public`.

A ideia fundamental ficou simples:

```text
Skill use
  ↓
UsageStatement
  ↓
[ainda coberto? fim]
```

Se houver uso não coberto:

```text
UsageStatement
  ↓
InvoiceRequest
  ↓
Invoice
  ↓
payment
  ↓
Receipt
```

O personagem principal deixa de ser o auditor. É o próprio licenciado produzindo uma declaração limitada sobre seu uso.

E aqui veio a parte saudável do processo: **nós quase estragamos a ideia construindo arquitetura demais**.

## O momento em que quase nasceu um ERP de quatro arquivos Markdown

Em algum ponto a RFC começou a ganhar `LicenseeMeteringProfile`, `MeteringPlan`, `EnvironmentAssessment`, `AuditPlan`, `SigningKey`, tipos de findings, modelos de auditoria e uma coleção crescente de nomes que pareciam importantes porque tinham PascalCase.

Esse é um fenômeno conhecido na engenharia de software: você começa tentando cobrar 0,001 alguma-coisa e três horas depois está projetando o SAP para civilizações interplanetárias.

<figure class="meme">
  <img
    src="https://api.memegen.link/images/center/O_que_e_isso~q/Um_ERP_para_quatro_arquivos_Markdown~q.png?width=600"
    alt="Meme What is this, a Center for Ants?: 'O que é isso?' seguido de 'Um ERP para quatro arquivos Markdown?'."
    loading="lazy"
  />
  <figcaption>Quatro arquivos Markdown. Arquitetura corporativa para civilizações interplanetárias.</figcaption>
</figure>

A pergunta que salvou o desenho foi brutalmente simples:

> O que o [`okf-parser`](https://github.com/franklinbaldo/okf-parser) já faz?

A resposta era: quase tudo que realmente importava para o experimento.

Ele já valida corpus Markdown, inventaria tipos, enxerga relações explícitas, constrói grafo e materializa DuckDB.

Então a regra virou: **não construir um framework de licenciamento em cima de outro framework de conhecimento**.

O protocolo final da RFC ficou com só quatro tipos econômicos obrigatórios:

- `UsageStatement`;
- `InvoiceRequest`;
- `Invoice`;
- `Receipt`.

A policy é uma regra. Não precisa virar entidade de workflow.

Pagamento é um adapter. Assinatura é um adapter. Blockchain é um adapter. Pix é um adapter. WLD é um adapter. x402 é um adapter.

Nada disso precisa morar no núcleo.

## O primeiro buraco: preço não concede licença

A primeira revisão séria encontrou uma contradição importante.

A licença-base dizia, corretamente, que nenhum `Operational Use` era concedido publicamente. Uso produtivo exigia uma licença operacional separada.

A RFC, ao mesmo tempo, mostrava um exemplo como este:

```text
uses 1..1000     free
uses 1001..2000  first paid block
```

Parecia natural dizer: “os primeiros 1.000 usos são grátis”.

Só que **grátis não é a mesma coisa que licenciado**.

Uma policy econômica dizendo `free_allowance: 1000` não cria, sozinha, a autorização jurídica para fazer o uso nº 1.

Essa distinção acabou virando uma regra explícita da RFC: `metered_public` só pode ser ativado quando existir um instrumento jurídico aplicável — uma nova versão da licença ou um pequeno adendo operacional — dizendo que aquele uso operacional está autorizado sob aquela policy.

Esse instrumento precisa dizer, no mínimo, que:

- a policy identificada governa aquele uso;
- a franquia gratuita é **licenciada**, não apenas não faturável;
- os blocos posteriores podem ser cobertos conforme a regra publicada;
- e o texto jurídico prevalece se houver conflito.

A policy calcula. A licença concede.

Misturar as duas coisas é uma ótima maneira de construir um sistema que sabe exatamente quanto cobrar por uma atividade que nunca autorizou.

## O segundo buraco: o que é uma invocation?

Depois veio uma pergunta ainda mais inconveniente.

A RFC dizia que duas implementações conformes, dadas as mesmas informações, deveriam chegar ao mesmo resultado econômico.

Ótimo.

Mas a unidade era `invocation`.

O que é uma invocation?

Uma skill carregada uma vez e consultada em cinco turnos conta uma vez ou cinco?

Retry depois de erro conta de novo?

Helper skill conta?

Subagent conta?

Uma execução que começa e falha conta?

Uma execução que produz cinco outputs virou cinco usos por osmose?

Se duas implementações honestas respondem diferente, não existe métrica determinística. Existe uma palavra em YAML vestida de métrica.

Então a RFC fixou uma semântica inicial e deliberadamente chata:

- uma invocation é uma tentativa de execução produtiva do Skill principal;
- continuações, turnos e outputs sob o mesmo `invocation_id` não contam novamente;
- retry automático da mesma tentativa não conta novamente;
- uma nova tentativa produtiva conta;
- helper Skill chamado pelo principal não cria outra invocation principal;
- um subagent que recebe a Skill governada como seu próprio principal conta separadamente;
- routing e avaliação anteriores à execução produtiva não contam;
- se a execução produtiva começou e depois abortou ou falhou, conta uma vez.

Não é a definição universal de invocation para a humanidade.

É uma definição suficientemente precisa para que duas máquinas contem igual.

Essa é uma diferença enorme.

## Onde termina uma cobrança?

A política ilustrativa ficou igualmente sem glamour:

```yaml
metering:
  metric: invocation
  scope: principal_skill
  counter: cumulative
  free_allowance: 1000
  allowance_reset: never
  billing_unit: 1000
  rounding: ceiling
  coverage: paid_block_watermark
```

Com ela:

```text
1..1000     franquia
1001..2000  primeiro bloco pago
2001..3000  segundo bloco pago
```

Se o contador chega a 1.427 e o primeiro bloco está coberto, o watermark avança até 2.000. O uso 1.428 não gera outra cobrança. A próxima fronteira é 2.001.

A fórmula pode continuar quase ofensivamente simples:

```text
covered = max(free_allowance, receipted_coverage_through)
uncovered = max(0, usage_total - covered)
blocks = ceil(uncovered / billing_unit)
requested_coverage_through = covered + blocks * billing_unit
```

Isso é melhor do que um “billing engine” porque não existe nada ali para admirar.

Só existe uma regra para executar.

## O terceiro buraco: qual policy fez essa conta?

A próxima revisão encontrou um problema de viagem no tempo.

Um `UsageStatement` dizia algo como: cheguei a 1.427 usos. Um `InvoiceRequest` apontava para ele. A `Invoice` apontava para o request. O `Receipt` apontava para a invoice.

O grafo parecia lindo.

Mas qual versão da policy tinha transformado 1.427 em cobertura até 2.000 e preço X?

Se `policy.yaml` mudasse seis meses depois, o grafo continuaria impecável e a explicação econômica evaporaria.

A correção também foi pequena: o `UsageStatement` passou a congelar `license_id` e uma referência imutável da policy — por exemplo, commit e/ou digest. Os registros seguintes herdam essa proveniência pela cadeia.

Não precisamos de um ledger service.

Precisamos saber **qual regra foi aplicada**.

Essa frase vale para uma quantidade surpreendente de sistemas empresariais.

## OKF: relações explícitas ou nada feito

Depois veio o dogfood mais divertido.

Montamos um pequeno corpus fictício:

```text
UsageStatement
  → InvoiceRequest
    → Invoice
      → Receipt
```

E mais um `UsageStatement` separado, representando um uso de teste sem cobrança.

O `okf-parser` validou os cinco conceitos sem diagnóstico.

Mas o grafo apareceu com **zero arestas**.

O motivo era ótimo: o parser tinha evoluído e deixado de inventar relações só porque uma string no frontmatter parecia um caminho `.md`. Até colocar sintaxe de link dentro do YAML não bastava para a relação de grafo.

A relação precisava existir como aquilo que ela dizia ser: **um link Markdown explícito no corpo**.

Corrigimos os três predecessores.

O resultado do smoke final, usando um checkout separado do `okf-parser`, foi:

```text
check      5 conceitos, conformant, 0 diagnostics
inventory  2 UsageStatement + 1 InvoiceRequest + 1 Invoice + 1 Receipt
graph      5 nodes, 3 edges, 2 componentes, DAG
duckdb     5 concepts, 3 links, 0 diagnostics
```

O segundo componente é intencional. Ele representa um `UsageStatement` que termina ali.

Isso é uma propriedade importante do protocolo: **declarar uso não significa automaticamente dever dinheiro**.

## Metering não é telemetria escondida

Tem uma versão ruim dessa ideia que seria muito fácil construir.

A skill poderia telefonar para casa toda vez que fosse invocada.

Seria tecnicamente conveniente e conceitualmente péssimo.

O experimento vai na direção contrária: **self-reporting first; independent verification second**.

Os registros brutos podem permanecer com quem usa. O protocolo público precisa da declaração agregada suficiente para reconstruir a situação econômica, não de uma câmera instalada dentro do agente.

O `UsageStatement` é uma afirmação delimitada.

O `InvoiceRequest` é um pedido para aplicar a regra publicada.

A `Invoice` é a aplicação da policy pelo emissor.

O `Receipt` registra que o emissor reconheceu determinado pagamento como satisfação de determinada invoice e cobertura.

Nenhum desses documentos ganha verdade metafísica porque foi commitado no Git.

Assinatura, hash ou attestations podem fortalecer autoria, integridade e proveniência. Não transformam uma afirmação errada numa afirmação verdadeira.

Esse limite parece óbvio quando escrito assim. Sistemas distribuídos têm uma capacidade impressionante de esquecer coisas óbvias quando descobrem criptografia.

## E a auditoria?

Aqui também houve uma poda importante.

A #58 quase ganhou uma segunda arquitetura inteira de auditoria.

Não precisava.

A #57 já tinha `license-enforcement`, modelo de evidência, busca por contraprova e catracas humanas.

Então a RFC econômica simplesmente delega a ela.

Se houver suspeita de uso não reportado, o caminho adversarial continua sendo outro caminho:

```text
agent investiga
  ↓
evidência / conclusão interna
  ↓
HUMAN REVIEW
  ↓
contato ou publicação, se aprovado
```

Um lower bound continua sendo lower bound.

`at_least: 17` não se transforma em `exact: 17` só porque seria comercialmente conveniente.

E uma invoice originada por investigação sobre terceiro não ganha passe livre só porque agora temos Markdown bonito.

A máquina pode preparar quase tudo.

Ela não vira juiz por acidente de arquitetura.

## A parte em que a ideia esbarra no direito autoral

Eu queria uma licença com uma intuição simples: isto aqui é como um livro. Você pode abrir, ler, aprender. Se quiser colocar a coisa para trabalhar dentro da sua empresa, fazemos uma transação.

Essa intuição funciona só até certo ponto.

A Lei 9.610/1998 é bastante inconveniente para quem gostaria de cobrar aluguel sobre pensamentos: o art. 8º exclui da proteção autoral, como tais, ideias, procedimentos normativos, sistemas, métodos, projetos e conceitos. Na parte científica e técnica, a lei também separa a forma de expressão do conteúdo técnico.

Isso não é um detalhe para esconder no rodapé. É exatamente a fronteira que a licença precisa respeitar.

Se alguém lê uma skill minha, entende uma boa ideia e depois implementa aquela ideia independentemente, a frase “uso operacional exige pagamento” não transforma a ideia em propriedade intelectual que eu passei a possuir.

Uma licença não cria direitos autorais onde a lei não criou.

O mesmo vale para este blog.

Eu posso escrever uma arquitetura, explicar uma técnica, contar como construí uma ferramenta. O texto é uma obra. O código pode ser protegido. Uma seleção particular de instruções pode ser expressão protegida. Mas eu não ganho um pedágio geral sobre todo cérebro que aprendeu alguma coisa aqui.

Isso estraga uma versão mais gananciosa da ideia e melhora a versão que sobra.

Porque obriga a perguntar qual é de fato o objeto econômico.

No caso das skills, não é “o conhecimento” em abstrato. É o material concreto protegido que você instala, copia, adapta, embute e executa.

Se um dia eu quiser cobrar pelo acesso ao conhecimento em si, o mecanismo é outro: contrato de acesso, serviço, assinatura, conteúdo fechado. Não uma licença pública tentando expandir copyright por decreto doméstico.

O direito autoral continua sendo menos conveniente do que um campo `protected: true`.

Ainda bem.

## Source available não é open source com mau humor

Há um vocabulário para uma parte disso.

Licenças como [PolyForm](https://polyformproject.org/licenses) permitem deixar o código visível e conceder direitos diferentes conforme o tipo de uso. A [Business Source License](https://mariadb.com/bsl11/) também trabalha com fonte disponível e limitações de produção.

Isso não é _Open Source_ no sentido da Open Source Initiative. A [Open Source Definition](https://opensource.org/osd) exige liberdade de uso que uma licença com restrição de uso operacional não concede.

Então não vale brincar de nomenclatura.

A `Skill Use License 0.1` é **source-available, não Open Source**.

Ela permite leitura, inspeção, estudo e avaliação de boa-fé. O que ela não concede publicamente é `Operational Use`: carregar, adaptar, embutir ou invocar o material para trabalho produtivo.

A baseline continua deliberadamente em `quote_required`.

E aqui aparece a distinção que a revisão da #58 tornou impossível ignorar:

```text
license / addendum  → concede o uso
policy              → calcula a regra econômica
records OKF         → deixam a trilha
okf-parser          → valida e projeta a trilha
```

Cada camada faz uma coisa.

Parece menos mágico.

É justamente por isso que funciona melhor.

## O primeiro rato de laboratório continuo sendo eu

As duas PRs acabaram mergeadas no `franklinbaldo/skills`.

A #57 colocou a licença-base, a policy legível por máquina e o enforcement conservador no repositório.

A #58 colocou a RFC do `metered_public` e o pequeno fixture OKF que prova os dois caminhos mínimos: uso que termina no `UsageStatement` e uso que segue até `InvoiceRequest → Invoice → Receipt`.

Mas mergear a RFC **não ativa o regime econômico**.

A policy vigente continua `quote_required`.

Não existe ainda um grant operacional público de `metered_public`, nem uma contraparte real, nem uma cobrança real esperando para ser automatizada.

E isso é bom.

O protocolo ganhou o direito de existir antes de ganhar o direito de cobrar alguém.

Quando houver um experimento econômico real, ele vai precisar começar por três perguntas muito menos futuristas do que “qual blockchain?”:

1. qual instrumento jurídico concede o uso?
2. o que exatamente conta como uma unidade?
3. qual versão da regra governou a transação?

Depois disso, talvez Pix, WLD, x402 ou qualquer outra integração seja útil.

Antes disso, é decoração de arquitetura.

## A licença não precisa observar tudo

A parte de que mais gosto no desenho que sobreviveu é que ele não depende de um fiscal onisciente.

O licenciado pode medir e declarar seu próprio uso.

O emissor pode aplicar uma regra publicada.

O receipt pode registrar qual cobertura foi reconhecida.

A auditoria continua independente e conservadora.

E tudo isso pode deixar uma história auditável sem que exista um servidor central vendo cada invocation.

Não porque todo registro seja automaticamente verdadeiro.

Mas porque cada ator deixa uma afirmação atribuível e o protocolo preserva a relação entre as afirmações.

A primeira ideia era uma licença que viesse com uma skill para bater na porta.

Eu ainda gosto dessa imagem. Ela continua sendo o começo da história.

Mas agora parece pequena.

A licença não apenas sabe o próximo passo.

Ela ensina cada participante a produzir as provas necessárias para que o próximo passo possa acontecer.

Não é uma licença autoexecutável.

**É uma licença que ensina as máquinas a deixar provas de que a cumpriram.**

## Para se aprofundar

- **[Skill Use License 0.1 / PR #57](https://github.com/franklinbaldo/skills/pull/57)** — licença-base `quote_required`, policy legível por máquina e `license-enforcement` com revisão humana; agora mergeada.
- **[Agentic Metered Skill Licensing Protocol / PR #58](https://github.com/franklinbaldo/skills/pull/58)** — RFC mergeada que define o experimento `metered_public`, a unidade `invocation`, proveniência da policy e os quatro registros econômicos mínimos, sem ativar o regime.
- **[`okf-parser`](https://github.com/franklinbaldo/okf-parser)** — infraestrutura genérica usada para validar, grafar e materializar o fixture sem semântica especial de licenciamento no parser.
- **[Lei 9.610/1998](https://www.planalto.gov.br/ccivil_03/leis/l9610.htm)** — especialmente o art. 8º, porque uma licença experimental melhora quando começa reconhecendo aquilo que não pode licenciar como direito exclusivo.
- **[Lei 9.609/1998](https://www.planalto.gov.br/ccivil_03/leis/l9609.htm)** — regime brasileiro específico de proteção de programas de computador.
- **[PolyForm Licenses](https://polyformproject.org/licenses)** — exemplos de licenciamento source-available com permissões calibradas por tipo de uso.
- **[Business Source License 1.1](https://mariadb.com/bsl11/)** — outro desenho de source availability com restrições de produção.
- **[Open Source Definition](https://opensource.org/osd)** — útil principalmente para não chamar de open source uma licença que deliberadamente reserva categorias de uso.
