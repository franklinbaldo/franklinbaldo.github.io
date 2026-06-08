---
title: 'A Arte de Delegar: Assinaturas e Caixas de Areia'
description: >-
  A ansiedade sobre agentes autônomos não é sobre o que eles sabem. É sobre o
  fato de que, no código, a distância entre escrever e assinar desapareceu.
date: '2026-03-28'
lang: pt
tags:
  - ai
  - agents
  - software-engineering
  - law
  - metaphysics
draft: false
author: franklin
translationKey: delegating-to-agents
previousVersion:
  uuid: 56620869-a868-52f3-ac2f-f4720e160fdd
  url: >-
    https://github.com/franklinbaldo/franklinbaldo.github.io/blob/4d6c9b2a2b5711080406dfc7e9886ca65287595f/src/content/blog/delegando-para-agentes.md
  timestamp: '2026-06-08T10:41:16.435Z'
  msg: >-
    Revised worst post based on evaluation feedback to give it real stakes and a
    stronger argument about accountability
---

Em fevereiro, uma janela de impugnação de auto de infração quase fechou sem protocolo porque cometi o erro mais básico da burocracia: confundi quem escreve com quem assina.

A minuta estava na minha caixa de entrada, impecável. O prazo era na terça. Mentalmente, eu já tinha despachado o problema. Mas a Justiça Federal não lê minutas. A Justiça Federal só lê o que tem um certificado digital acoplado.

Passo meus dias lendo _pareceres_ em Rondônia. O acordo silencioso entre o procurador e o assessor é que o assessor constrói a máquina — cruza a jurisprudência, empilha os fatos, propõe a conclusão — e o procurador vira a chave. A assinatura não é um carimbo de controle de qualidade; é o ato irreversível que transforma um texto especulativo em força de Estado.

A ansiedade em torno de agentes como Jules ou Devin não vem do fato de que eles alucinam bibliotecas. Vem do fato de que o ambiente em que eles operam — o repositório Git, o pipeline de CI/CD — foi construído por uma cultura que apagou a distinção entre fazer o parecer e assinar o ofício. No software, se os testes passam, o PR faz merge. A minuta _é_ o ato.

Quando você coloca um agente autônomo nesse tubo, você não está apenas automatizando a escrita. Você está automatizando a assinatura. É isso que aterroriza.

Para resolver isso, a intuição padrão da engenharia é construir uma caixa de areia.

A caixa de areia restringe o que a máquina pode ver e onde ela pode tocar. Você cria regras de linting paranoicas, testes que não perdoam e políticas de deploy que amarram as mãos do agente. A ideia é que, se a caixa for apertada o suficiente, o agente não pode causar dano irreparável. Se os testes passam, o agente propõe; o humano aprova.

Isso soa como um _ofício_ esperando a assinatura do procurador, mas é um espelho falso.

A mágica da delegação acontece quando você restringe o espaço de saída, não o processo. Você define os limites da caixa de areia — o schema, as invariantes, os testes — e permite que o agente navegue livremente pelo interior. Se os testes passam, a proposta é válida. Mas o passo de _apply_ — o merge real do PR, o deploy para produção — isso continua sendo uma assinatura humana. Um pipeline de CI que não pode ser bypassado é um protocolo: uma etapa de processamento obrigatória entre a minuta e o ato.

Numa estrutura administrativa real, o assessor tem uma carreira a perder. Pareceres que ignoram a lei levam à Corregedoria. Há uma tensão estrutural que segura o sistema em pé: a pessoa que não assina o ato ainda responde pela qualidade da minuta. A cadeia de responsabilidade tem dentes.

Um LLM não tem carreira a perder. O "harness" de regras que você coloca em volta dele (os testes, os prompts negativos, a caixa de areia) não cria uma posição institucional; cria apenas um labirinto mais difícil de resolver. Quando o labirinto falha, e o agente produz uma alucinação que passa nos testes de unidade e o humano aprova sem ler o "diff" com atenção, a responsabilidade sobe inteiramente para o humano que projetou a caixa de areia.

Não existe responsabilidade lateral. O passo de "aprovar o Pull Request" feito por um humano em relação a um agente de software carrega um peso que o Direito Administrativo não pede que o procurador carregue: o de assumir não apenas a decisão final, mas a autoria moral da própria proposta.

<figure class="meme">
  <img
    src="https://api.memegen.link/images/custom/the_assessor_is_good/Jules_is_good.jpg?background=https://i.imgflip.com/4/8q5y4u.jpg&width=500"
    alt="Meme showing two different levels of realization. 'The assessor is good' (calm). 'Jules is good' (panicked)."
    loading="lazy"
  />
  <figcaption>Ambas descrevem capacidade. Só uma descreve alguém que pode ser demitido.</figcaption>
</figure>

Essa é a fronteira que a analogia burocrática tenta esconder. Eu achei que a assinatura era apenas o que separava a proposta da ação. Ela é. Mas no mundo dos agentes sintéticos, a assinatura também é o que esconde o fato de que não há ninguém do outro lado da mesa.

Quando o [Funes](/blog/funes-soul/) escreve o rascunho de uma issue e espera que eu a publique, a regra que o impede de postar sozinho não é comportamental — o "harness" simplesmente não tem os fios ligados à API de postagem do GitHub. O fio cortado obriga a assinatura.

_Reversível → age, irreversível → pergunta._

Mas, mesmo que ele perguntasse, se ele gerasse algo catastrófico que eu não li direito e assinei, a corregedoria não iria atrás do script em Python. Ela viria atrás de mim. O erro de fevereiro me provou isso. A burocracia é construída sobre carne, não sobre tokens.

A caixa de areia funciona para limitar os estragos que a máquina pode causar. Mas é a assinatura que revela quem vai pagar por eles.

## Para se aprofundar

- **Lucy Suchman, _Plans and Situated Actions_ (1987)** — distingue o plano como modelo cognitivo do plano como artefato de prestação de contas. O PR como proposta está exatamente nessa linha; o livro se justifica só pela seção sobre o que significa "seguir um plano" para quem está seguindo.
- **Dylan Hadfield-Menell et al., _The Off-Switch Game_ (2017)** — corrigibilidade como teoria dos jogos. O passo de aprovação humana antes do _apply_ é uma instância concreta; o artigo formula o caso geral.
- **Diane Vaughan, _The Challenger Launch Decision_ (1996)** — sobre como mecanismos de prestação de contas se ritualizam e viram teatro. Se quem assina o PR não está realmente lendo o diff, a assinatura é burocracia, não responsabilidade. É o que o modelo caixa-de-areia-mais-assinatura não protege por si só.
- **Lei 9.784/1999, arts. 11–17** — o arcabouço jurídico para delegação de atos administrativos. A distinção entre _competência_ e seus limites delegáveis é a fonte normativa da separação minuta/assinatura que estou descrevendo.
- **Fred Brooks, _The Mythical Man-Month_ (1975)** — o capítulo da equipe cirúrgica: a mesma capacidade pode existir em duas arquiteturas de prestação de contas, e a escolha entre elas não é uma questão de capacidade.
