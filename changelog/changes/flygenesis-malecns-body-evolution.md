---
type: changelog
date: 2026-09-15
description: Adiciona FlyGenesis ao blog, reutilizando o MaleCNS compactado do FlyDoom em um demo de evolução morfológica e currículo físico progressivo.
tags: [malecns, connectome, evolution, robotics, flygenesis, simulation]
---

# FlyGenesis: evolução de corpo sobre o MaleCNS existente

- Adiciona `public/flygenesis/index.html`, que reutiliza `/flydoom/malecns_l3_compact.mcns` e `/flydoom/malecns_circuit.json` sem duplicar o asset de 4,98 MB.
- Implementa física 2D reduzida, mutação morfológica, seleção de champions e currículo automático de terrenos.
- Usa neurônios visuais/olfativos como entrada e neurônios descendentes como saída do mesmo kernel recorrente MaleCNS do FlyDoom.
- Publica post em português e tradução em inglês com distinção explícita entre topologia MaleCNS real e módulos proteicos/física/adapters sintéticos.
