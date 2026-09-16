---
type: changelog
date: 2026-09-15
description: Adiciona FlyTTS, experimento de aprendizado contínuo no navegador que usa o MaleCNS congelado para gerar waveform PCM direto com auto-feedback de áudio.
tags: [malecns, tts, audio, browser, experiment]
---

# FlyTTS: waveform direto com feedback contínuo

- Nova rota `public/flytts/index.html` reutiliza `public/flydoom/malecns_l3_compact.mcns` em um Web Worker.
- Texto e a waveform produzida no bloco anterior são reinjetados como estímulo.
- Readout de 512 estados gera blocos de 128 samples PCM e aprende online por NLMS contra uma gravação-alvo.
- UI mostra voltas, MSE, correlação, passos cerebrais/s e permite ouvir alvo e última saída.
- Publicados posts PT/EN com o demo embutido e limites metodológicos explícitos.
