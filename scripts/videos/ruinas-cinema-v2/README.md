# O Mágico e o Fogo — HyperFrames v2

Fontes narrativas: [O Mágico e o Fogo](https://franklinbaldo.github.io/pt/blog/o-magico-e-o-fogo/) e [O Sonhador e o Fogo](https://franklinbaldo.github.io/pt/blog/o-sonhador-e-o-fogo/).

- `art.py` desenha cenas vetoriais originais em camadas.
- `film.py` compõe 14 cenas editáveis e legendas WebVTT.
- `audio.py` sintetiza narração Kokoro pt-BR e música com FluidSynth.
- `SPEC.md` e `STORYLINES.md` documentam as decisões criativas.
- `.github/workflows/ruinas-cinema.yml` executa o render no **GitHub Actions público**, sem depender de Cloud Build/GCP.

O workflow é ativado apenas por atualizações do projeto na branch de revisão. Valida o MP4, anexa o resultado ao run e adiciona o vídeo validado à PR **draft**; não faz merge nem publica o artigo. A página só será publicada após revisão humana.

A gravação original do Suno permanece vinculada no artigo, sem contornar a restrição HTTP 403 da CDN. A nova locução é sintética e independente.
