---
type: Blog Post
author: franklin
docType: essay
date: 2024-07-12T00:00:00.000Z
lang: pt
title: >-
  Patentes para vulnerabilidades sociais: uma proposta modesta para transformar
  criminosos em consultores
translationKey: social-vulnerabilities
description: >-
  E se tratássemos técnicas de engenharia social como bugs de software —
  divulgáveis, patenteáveis, negociáveis?
tags:
  - security
  - social engineering
  - policy
  - patents
  - economics
supersedes: 98710b19-4cff-57a1-9eb8-b86da1df5e7c
draftCreatedAt: '2026-06-11T20:04:35.818Z'
draftMsg: >-
  Rewrite the English and Portuguese versions of the worst post to be more
  reflective of the blog's tone and Franklin's perspective on the matter,
  following the skill guidelines.
draftCommittedAt: '2026-06-11T20:05:59.307Z'
---

Estou há três dias tentando encontrar o defeito central dessa ideia e não consigo, o que costuma significar que ou deixei passar algo óbvio ou a ideia é realmente boa. Ainda não tenho certeza de qual.

A ideia: tratar técnicas de engenharia social como propriedade intelectual patenteável.

Antes de explicar por que não consigo descartar isso, deixe-me admitir o que me atrai na proposta. Eu trabalho na administração pública. Eu conheço os roteiros. Alguém liga dizendo ser do Tribunal de Contas, urgente, precisa confirmar uma transferência. Alguém se passa por fiscal federal. A variação do "motoboy" — um mensageiro físico aparece para recolher o cartão "para análise". Não são golpes aleatórios; são refinados. Foram iterados em milhares de ligações até a taxa de conversão estabilizar. Alguém sabe exatamente quais palavras fazem o cortisol subir e quais fazem ele cair. Esse conhecimento é a vulnerabilidade. E nós só ficamos sabendo disso pelas vítimas, depois do fato consumado.

Softwares têm CVEs. O [Common Vulnerabilities and Exposures database](https://www.cve.org/) existe porque alguém decidiu que a divulgação coordenada era melhor que a alternativa — que é cada equipe de segurança descobrir o mesmo bug de forma independente enquanto os invasores o exploram em escala. A correção chega mais rápido quando o bug tem um nome. Não existe equivalente para vulnerabilidades humanas.

## Uma terceira opção

Um pesquisador — ou, sim, um ex-criminoso — documenta um vetor social repetível: os gatilhos psicológicos específicos, as etapas de execução, a demografia-alvo. Ele registra isso. O registro é publicado imediatamente; o pedido de patente _é_ a divulgação. As corporações licenciam a patente para construir treinamentos e defesas. O pesquisador ganha royalties do licenciamento defensivo.

Hoje, o chapéu preto tem duas opções: explorar a vulnerabilidade (alto risco, alta recompensa) ou divulgá-la de graça (recompensa zero). Isso adiciona uma terceira: patentear a vulnerabilidade. Risco zero, recompensa alta.

E é aqui que a coisa fica estranha, o que também é onde suspeito que a falha esteja escondida.

Se um criminoso futuramente empregar a técnica patenteada sem licença, enfrentará não apenas acusações de estelionato, mas de quebra de patente — apreensão de bens, responsabilidade civil, toda a máquina usada contra violações de propriedade intelectual. Em tese, seria possível perseguir a infraestrutura das operações de engenharia social da mesma forma que se persegue redes de pirataria de software. Em tese.

Sinceramente, não sei se isso funciona na prática. Algumas dúvidas que carrego:

O problema do estado da técnica (prior art): se a técnica já circula antes de alguém patenteá-la, a patente se sustenta? Se não, apenas técnicas inéditas seriam patenteáveis — o que é uma fatia mínima das ameaças. A maior parte da engenharia social é variação sobre temas que rodam desde Ponzi. O estado da técnica para "fingir ser a área de fraudes do seu banco" é toda a história telefônica registrada. A busca seria infinita.

A assimetria de execução: processos por infração de patente funcionam quando o réu tem bens. Operações criminosas focadas em engenharia social costumam ser estruturadas justamente para não deter bens. Você estaria processando fantasmas.

O problema do conhecimento: quem atesta que a técnica divulgada é genuína e distinta? Analistas de patentes avaliam novidade buscando no estado da técnica. O estado da técnica para engenharia social está pulverizado em boletins de ocorrência, depoimentos de vítimas, palestras de cibersegurança e lendas urbanas. Não há um corpus unificado.

Nenhuma dessas questões liquida a ideia, exatamente. Mas elas tornam a execução difícil. O problema do estado da técnica talvez possa ser resolvido com um sistema em camadas que não exija ineditismo absoluto, apenas a primeira articulação _documentada_. A assimetria de execução é real, mas a infração de patente não é a única via — poderia ser usada como ferramenta adicional contra aqueles que de fato possuem bens: plataformas, provedores de infraestrutura, processadores de pagamento, "laranjas" com contas ativas. O problema do conhecimento é uma versão da mesma dificuldade que o CVE enfrenta, e o CVE funciona mesmo assim, de forma imperfeita, o que é melhor do que não funcionar.

O que me faz voltar a isso é a estrutura de incentivos. Hoje não existe um mercado legítimo para o conhecimento que os engenheiros sociais detêm. Esse conhecimento é vendido em fóruns clandestinos ou usado diretamente. Criar um mercado lícito — mesmo um mercado estranho que envolva direitos de PI sobre padrões de ataque — altera o cálculo racional na margem. Algumas pessoas, na margem, escolheriam o caminho legítimo. Provavelmente não a maioria. Mas margens são margens.

O ecossistema brasileiro do Pix tem sido um laboratório para isso. As tentativas de engenharia social explodiram depois de 2021 porque o sistema de pagamentos funcionou — se você conseguir enganar alguém a iniciar a transferência, o dinheiro se move instantaneamente e de forma irreversível. Lembro de ler os relatos e perceber que a resposta focada na plataforma sempre parecia um passo atrás da taxonomia dos golpes. Nós aprendemos com as vítimas, uma a uma, sempre tarde demais.

Um sistema de divulgação — patente ou não — criaria pelo menos uma taxonomia. E taxonomias, mesmo as imperfeitas, são o caminho para se escalar a defesa.

Eu ainda não encontrei a falha fundamental. Mas sigo procurando.
