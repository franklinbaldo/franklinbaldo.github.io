---
type: changelog
date: 2026-09-15
description: Atualiza FlyDoom com carregamento real de FlatBuffers (.mcns), simulação infinita, spawns randômicos e enxame configurável de moscas e prêmios.
tags: [malecns, flatbuffers, doom, flydoom, simulacao, enxame]
---

# FlyDoom 3D: Conectoma FlatBuffers Real no Navegador

- Atualizado simulador interativo em `public/flydoom/index.html` para consumir diretamente o arquivo binário `malecns_l3_compact.mcns` (4,98 MB) via Zero-Copy TypedArrays em tempo real no navegador.
- Implementada simulação contínua e infinita com spawns randômicos em células transitáveis válidas.
- Adicionados controles para enxame dinâmico: botões para adicionar/remover moscas simultâneas, adicionar/remover prêmios aromáticos e alternar visão 3D em primeira pessoa entre as moscas ativas.
