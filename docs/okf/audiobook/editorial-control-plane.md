---
type: Architecture Contract
title: Audiobook Factory — editorial control plane
description: Contrato do agente editorial recorrente no ChatGPT e sua separação estrita da síntese TTS em GitHub Actions.
tags: [audiobook, editorial, chatgpt, automation, okf, tts]
timestamp: 2026-08-30T20:15:00Z
---

# Plano de controle editorial

## 1. Decisão

A produção editorial da Audiobook Factory acontece no **ChatGPT**, em sessões recorrentes, usando raciocínio do próprio agente e acesso ao repositório.

GitHub Actions **não traduz, não reescreve e não prepara narração por LLM**. Actions começa somente depois que uma unidade editorial já estiver pronta para áudio.

A separação é deliberada:

```text
ChatGPT / agente editorial recorrente
  original -> tradução -> narração -> revisão -> ready_for_audio
                                      |
                                      v
GitHub Actions / fábrica de mídia
  plan -> TTS -> assemble -> validate media -> publish -> podcast
```

## 2. Regra de uso de modelos externos

A pipeline editorial não chama APIs externas de LLM.

Isso inclui:

- tradução;
- adaptação de estilo;
- preparação de narração;
- segmentação semântica;
- revisão textual;
- criação de glossário;
- decisão sobre emoção, ritmo ou pronúncia;
- manutenção dos guias editoriais.

O único estágio autorizado a chamar modelos externos é **síntese de voz/TTS** depois do gate `ready_for_audio`.

## 3. Agente recorrente

O fluxo suportado é um agendamento recorrente do ChatGPT, executado aproximadamente a cada hora.

Cada execução deve:

1. ler o estado persistido no repositório;
2. escolher a próxima unidade editorial incompleta;
3. trabalhar em uma unidade coerente por vez;
4. atualizar original/tradução/narração ou documentação necessária;
5. validar alinhamento e aderência aos guias;
6. persistir progresso em branch/PR ou no estado editorial definido;
7. nunca duplicar trabalho já marcado como concluído;
8. deixar um estado determinístico quando a unidade não puder ser concluída em uma única execução.

O agente não precisa finalizar um capítulo inteiro por execução. A unidade de trabalho pode ser um segmento, bloco ou capítulo, desde que o estado permita retomada sem ambiguidade.

## 4. Ordem editorial

Para cada obra e unidade:

```text
source_ready
  -> translation_ready
  -> narration_ready
  -> editorial_review_ready
  -> ready_for_audio
```

Nenhum estado pode ser inferido apenas porque o arquivo existe. O gate depende das validações definidas em `chapter-readiness.md`.

## 5. Documentos de projeto antes do primeiro capítulo

Antes de declarar o primeiro capítulo de uma obra como `ready_for_audio`, devem existir e ser aplicáveis:

- contrato global da Audiobook Factory;
- guia global de tradução;
- guia global de preparação de narração;
- convenções de segmentação e IDs;
- política de pronúncia e glossário;
- política de vozes/personagens;
- regras de proveniência e direitos;
- contrato de readiness;
- metadata da obra em `work.md`;
- overrides específicos da obra, quando necessários.

A ausência de um desses documentos pode ser resolvida pelo próprio agente recorrente antes de continuar o capítulo.

## 6. Global vs. específico da obra

O projeto mantém duas camadas de orientação:

```text
docs/okf/audiobook/guides/       regras globais

data/audiobooks/<work_id>/
  work.md                         identidade/proveniência
  editorial.md                    overrides editoriais da obra
  voices.yaml                     identidade lógica das vozes
  pronunciation.yaml              léxico/pronúncia específica
```

Regras específicas da obra prevalecem sobre defaults globais apenas quando a exceção é explícita.

## 7. Persistência de estado

O estado de produção deve ser legível do Git. O agente não pode depender de memória privada para saber onde parou.

Cada capítulo/unidade deve expor ao menos:

- estado atual;
- próxima ação necessária;
- IDs concluídos;
- IDs pendentes;
- digests das fontes relevantes;
- revisão/gates já executados;
- bloqueios conhecidos.

O formato concreto pode evoluir, mas deve ser validável por script e revisável em PR.

## 8. Relação com GitHub Actions

Actions recebe conteúdo editorial já pronto e trata somente trabalho mecânico/reprodutível:

- validar readiness;
- calcular plano de síntese;
- selecionar backend/runner;
- despachar TTS para API, Colab ou Kaggle;
- coletar áudio;
- montar capítulo;
- validar mídia;
- publicar no storage;
- atualizar RSS/podcast.

Se `ready_for_audio != true`, o workflow de síntese deve falhar antes de qualquer chamada externa.

## 9. Critério de sucesso

A arquitetura está correta quando:

- uma hora editorial pode terminar sem chamar nenhuma API de LLM;
- o próximo agente consegue retomar apenas lendo o repositório;
- nenhum GitHub Action precisa decidir como traduzir uma frase;
- o TTS nunca recebe uma tradução ainda não preparada para oralidade;
- um capítulo só entra em GPU/API depois de todos os gates editoriais passarem;
- a mesma rotina funciona para HPMOR, Bhagavad Gita e futuras obras sem código específico por livro.
