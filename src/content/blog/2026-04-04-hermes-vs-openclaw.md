---
title: "Hermes Agent vs OpenClaw: por que minha experiência ficou muito melhor"
translationKey: hermes-agent-vs-openclaw-why-my-experience-got-so-much-better
description: "Um relato honesto, baseado nas minhas próprias sessões, sobre o salto de UX entre o antigo harness OpenClaw e o Hermes Agent."
date: "2026-04-04"
lang: pt
translationKey: hermes-vs-openclaw
tags: ["ai", "agents", "developer-tools", "automation", "software-engineering"]
draft: false
author: "franklin"
---

Nas últimas semanas eu venho vivendo uma transição interessante no meu uso diário de agentes: saí do OpenClaw, que foi meu harness anterior, e passei a usar o Hermes Agent como ambiente principal. Como quase tudo que eu faço com IA acaba virando infraestrutura de trabalho — e não só brinquedo de benchmark — eu quis escrever isso de um jeito menos marqueteiro e mais empírico.
Então fiz o óbvio: fui olhar as sessões.
No diretório `/opt/data/sessions/`, encontrei 81 sessões antigas classificáveis como OpenClaw e 3 sessões recentes já no formato Hermes. Isso não é um benchmark acadêmico; é uma amostra operacional da minha própria rotina. E justamente por isso ela me interessa mais do que comparações esterilizadas.
O resumo curto é este: o Hermes não é mágico, não zera erro, e ainda tropeça em detalhes de ambiente. Mas a experiência geral ficou claramente melhor. Melhor para investigar, melhor para recuperar contexto, melhor para se corrigir em voo e, principalmente, melhor para terminar trabalho de verdade.
## O que os logs mostram
O OpenClaw deixou bastante rastro. Nas 81 sessões que analisei, houve:
- 1.414 tool calls
- 137 erros de ferramenta
- 39 sessões com pelo menos um erro de ferramenta
- algo em torno de 48,1% das sessões com algum atrito operacional
Os exemplos são bem concretos, e vários deles me soam familiares porque eu vivi isso no dia a dia:
- erro de schema: `Missing required parameter: newText (newText or new_string)`
- erro de comando/flag: `Unknown JSON field: "mergeableState"`
- erro de ambiente: `kanban: command not found`
- erro de execução em heartbeat: `Failed to spawn: heartbeat`
Esses erros, isoladamente, não condenam uma plataforma. Qualquer sistema de agentes que realmente toca shell, GitHub, arquivos e automação real vai esbarrar em quinas. O problema do OpenClaw era outro: com frequência o atrito parecia estar no próprio harness, na forma como as ferramentas se encaixavam, nos schemas, na ergonomia, e não apenas na tarefa em si.
Havia um padrão recorrente de “quase deu”: o agente até entendia o objetivo, mas perdia tempo em detalhes da interface da ferramenta. Em uma sessão de 14 de fevereiro, por exemplo, o fluxo era simples: ler o `HEARTBEAT.md`, consultar PRs, atualizar uma seção do arquivo. O trabalho saiu, mas antes veio a famosa pancada do `edit` sem `newText`. Resolveu depois? Resolveu. Mas com aquela sensação de ferramenta atrapalhando mais do que ajudando.
Outro traço do OpenClaw era a repetição operacional. Muitas sessões viravam pequenos loops de cron, heartbeats, `NO_REPLY`, checagens mecânicas, sem um bom gradiente entre “verificar” e “agir”. Em tarefas simples isso até bastava. Em tarefas de investigação, debug e coordenação de várias peças, eu sentia que o sistema ficava mais frágil e mais verboso do que precisava.
## O Hermes também erra — mas erra melhor
Eu preferi olhar para o Hermes com honestidade, porque seria fácil escrever uma vitória falsa. Nos 3 logs recentes que já estão no formato novo, encontrei:
- 225 tool calls
- 22 resultados com erro ou saída não-zero
Ou seja: não é verdade que o Hermes seja um mundo sem falhas. Não é.
Nos próprios logs recentes aparecem tropeços como:
- `bash: python: command not found`
- busca num path inexistente (`/home/ubuntu`)
- bloqueios de segurança para padrões do tipo `curl | python3`
- falhas de autenticação em ferramentas visuais de terceiros (`invalid x-api-key`)
Se eu olhasse só a contagem bruta de erros, poderia contar uma história errada. Porque a diferença não está em “não há erros”. A diferença está no comportamento do sistema depois do erro.
No Hermes, o padrão tem sido muito mais assim:
1. a tentativa falha
2. o agente entende por que falhou
3. troca de ferramenta ou abordagem
4. continua a tarefa até fechar o objetivo
Esse detalhe muda tudo.
Quando o shell reclamou de `python`, por exemplo, o fluxo seguiu com `python3` sem drama. Quando o scan de segurança bloqueou um `curl | python3`, o agente contornou corretamente escrevendo arquivo temporário e usando outra forma de parse. Quando a visão do browser deu 401, a investigação continuou por snapshot textual, Jina, shell e arquivos. Isso é muito mais próximo do que eu espero de um parceiro técnico e muito menos parecido com um demo script.
## O salto real: qualidade de investigação
O ponto em que o Hermes me ganhou de vez não foi no “chat bonito”. Foi na qualidade de investigação.
Nas sessões recentes, ele usou uma combinação bem mais madura de ferramentas:
- `session_search` para recuperar contexto entre sessões
- `read_file` e `search_files` com granularidade melhor
- `execute_code` para processamento local sem gambiarra de shell
- `patch` e `write_file` para edição previsível
- `todo` para manter plano explícito
- browser + snapshot para inspeção de páginas quando necessário
Isso parece detalhe, mas na prática reduz muito o custo cognitivo da automação. Em vez de eu ficar pensando “qual comando improvisado vai fazer esse agente sobreviver?”, eu consigo pensar mais no problema.
Um bom exemplo veio justamente quando eu estava investigando o CausaGanha. A sessão não ficou só no superficial. O Hermes foi até o metadata do Internet Archive, contou arquivos recentes, comparou versões históricas de `completed-items.json`, separou “refresh de catálogo” de “avanço real de backfill”, e depois abriu sessões Jules com instruções mais precisas. Isso está muito mais perto de análise operacional de verdade do que de uma sequência de ferramentas disparadas a esmo.
No OpenClaw, eu sentia várias vezes que o agente conseguia executar comandos. No Hermes, eu sinto com mais frequência que ele consegue conduzir uma investigação.
## Contexto e continuidade
Outro ganho grande é continuidade.
Um dos problemas mais irritantes da experiência anterior era aquele momento em que você sabia que já tinha conversado sobre aquilo, mas o sistema não conseguia se reancorar direito. Às vezes era preciso reexplicar demais. Às vezes o agente até lembrava “o clima” da tarefa, mas não os fatos certos. Em uma sessão recente antiga, isso apareceu de forma bem explícita: eu precisei apontar que estávamos falando de algo discutido poucas horas antes, e o sistema basicamente admitiu que tinha perdido o fio.
O Hermes não resolve isso de forma mística. O que ele faz é melhor engenharia de memória operacional:
- memória persistente enxuta para fatos duráveis
- `session_search` para recall de sessões anteriores
- skills para procedimento recorrente
- leitura estruturada do workspace
Isso é muito mais sustentável. Em vez de tentar fingir uma memória total, ele me parece mais confortável em dizer “vou buscar nos registros” — o que, para trabalho real, é melhor do que um improviso confiante.
## UX de ferramenta importa mais do que parece
Eu subestimei por muito tempo o quanto UX de ferramenta muda a percepção de inteligência.
Se um agente “pensa bem”, mas toda hora tropeça em schema, em edição de arquivo, em forma de passar argumento, em parse de saída, a sensação final é de areia na engrenagem. Foi isso que várias sessões do OpenClaw me transmitiram. Não era necessariamente burrice do modelo. Era o conjunto modelo + harness + ferramentas entregando fricção demais.
O Hermes me passa outra sensação: mais chão de fábrica. Menos malabarismo. Menos “isso aqui deveria ter funcionado”.
Mesmo quando dá errado, normalmente dá errado de um jeito diagnosticável. E isso, no uso diário, vale ouro.
## Onde o OpenClaw ainda teve mérito
Seria injusto fingir que o OpenClaw não serviu para nada. Serviu bastante.
Foi nele que se consolidaram várias rotinas minhas de heartbeat, memória, Jules, backlog, checagem de PRs e documentação de contexto. Ele me ajudou a aprender o que eu realmente queria de um agente operacional. Em certo sentido, foi o OpenClaw que me deixou exigente com o Hermes.
Também não dá para ignorar o recorte da amostra: eu tenho 81 sessões antigas de um lado e só 3 do outro no formato novo. Então seria desonesto chamar isso de comparação estatística definitiva.
Mas experiência de ferramenta não é só estatística. É textura. É fluidez. É quantas vezes eu preciso interromper o fluxo para consertar o próprio mecanismo.
E aí a diferença já está bastante clara.
## Minha conclusão prática
Se eu resumisse em uma frase:
O OpenClaw parecia um harness promissor para agentes. O Hermes já parece mais um ambiente de trabalho.
No OpenClaw, eu frequentemente sentia que precisava administrar a ferramenta para então fazer o trabalho.
No Hermes, com bem mais frequência, eu simplesmente faço o trabalho.
Isso não quer dizer perfeição. Ainda há credenciais quebradas, comandos bloqueados por segurança, escolhas erradas de caminho, confusão de ambiente e pequenas colisões do mundo real. Mas o Hermes tem uma qualidade que hoje eu valorizo mais do que “benchmark de raciocínio”: capacidade de recuperação.
Para quem usa agentes em produção pessoal — isto é, para investigar bug, abrir sessão externa, montar relatório, editar código, cruzar logs, consultar GitHub, mexer em arquivos e publicar resultado — essa capacidade vale mais do que um brilho ocasional em prompt de demo.
No fim das contas, foi isso que mudou minha percepção.
O OpenClaw me deu vários vislumbres do futuro.
O Hermes começou a me dar rotina.
E, para trabalho sério, rotina ganha de vislumbre quase sempre.
