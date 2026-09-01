---
type: Style Guide
title: Audiobook Factory — guia global de tradução
description: Regras para produzir a camada de tradução antes da adaptação específica para narração.
tags: [audiobook, translation, style-guide, pt-br, okf]
timestamp: 2026-08-30T20:18:00Z
---

# Guia global de tradução

## 1. Objetivo

Produzir uma tradução em português brasileiro que seja fiel, legível e revisável por comparação direta com o original.

A tradução não é ainda a versão enviada ao TTS.

## 2. Prioridades

Em ordem:

1. preservar sentido e relações lógicas;
2. preservar voz, humor, registro e intenção;
3. produzir português brasileiro natural;
4. manter consistência terminológica entre capítulos;
5. preservar estrutura suficiente para alinhamento por segmentos;
6. evitar literalismo que torne a frase artificial.

## 3. O que não pertence à tradução

Não colocar na tradução:

- grafia fonética inventada para ajudar sintetizador;
- tags de emoção/pausa;
- instruções de voz;
- quebras artificiais feitas apenas por limite de contexto do TTS;
- nomes de modelos/providers;
- SSML ou sintaxe proprietária.

Esses elementos pertencem à camada de narração ou aos adapters.

## 4. Termos e nomes

Decisões recorrentes devem entrar no glossário da obra.

Antes de traduzir um termo recorrente de forma diferente do glossário:

- verificar contexto;
- registrar a exceção quando intencional;
- atualizar a regra global da obra se a decisão anterior estiver errada.

Nomes próprios permanecem conforme a política específica da obra. Não traduzir ou abrasileirar automaticamente.

## 5. Estrutura e alinhamento

Cada segmento traduzido preserva o `segment_id` correspondente ao original sempre que houver equivalência semântica clara.

Quando uma tradução exige dividir ou fundir material:

- não reutilizar IDs de forma ambígua;
- registrar a relação explicitamente;
- preferir que a mudança estrutural aconteça na camada de narração se a tradução textual não precisa dela.

## 6. Registro

A tradução deve respeitar idade, posição social, época, personalidade e situação dos falantes.

Não nivelar todos os personagens para um mesmo português neutro se o original distingue suas vozes.

## 7. Passada de revisão

Antes de `translation_ready`:

- comparar todos os segmentos com o original;
- procurar omissões e acréscimos;
- revisar números, nomes, negações e relações causais;
- reler trechos longos sem olhar o original para testar fluência;
- conferir termos recorrentes no glossário;
- registrar qualquer dúvida que impeça afirmar fidelidade.
