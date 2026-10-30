# O menino que nasceu de um sonho

Fonte do curta animado original inspirado livremente em *As ruínas circulares*, de Jorge Luis Borges.

A composição usa [Hyperframes](https://github.com/heygen-com/hyperframes), HTML/SVG e GSAP. O roteiro original, as legendas e as ilustrações vetoriais são gerados por build.py; os áudios são sintetizados via edge-tts (pt-BR), com fallback local para espeak-ng. A trilha é sintetizada com FFmpeg.

## Reproduzir

Requisitos: Node.js 22 ou posterior, Python 3, FFmpeg, FFprobe, espeak-ng, edge-tts e Hyperframes.

1. Execute python3 build.py a partir deste diretório (o script cria index.html, meta.json e assets/).
2. Copie node_modules/gsap/dist/gsap.min.js para assets/.
3. Execute npx hyperframes lint e npx hyperframes render --output ruinas-circulares.mp4 --fps 24.
4. Verifique o MP4 e copie-o para public/videos/ruinas-circulares/ruinas-circulares.mp4.

A publicação usa src/content/blog/o-menino-que-nasceu-de-um-sonho.md. O arquivo MP4 final é uma saída de build, não um recurso executado no navegador.

Não se reproduz nenhum texto de Borges literalmente; este roteiro é uma adaptação infantil independente.
