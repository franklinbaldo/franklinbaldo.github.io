# O Mágico e o Fogo — HyperFrames v2

Fonte da narrativa: https://franklinbaldo.github.io/pt/blog/o-magico-e-o-fogo/
Música relacionada: https://franklinbaldo.github.io/pt/blog/o-sonhador-e-o-fogo/
Skill estudada: https://github.com/remotion-dev/skills

art.py produz o cenário original; film.py escreve subcomposições HyperFrames, timeline e VTT; audio.py sintetiza voz neural brasileira Kokoro e trilha instrumental com FluidSynth.
cloudbuild.yaml constrói e renderiza o filme. Arquivos gerados: index.html, compositions/, assets/, ruinas-v2.mp4.
A versão não usa o áudio do Suno sem exportação oficial autorizada, pois o acesso direto à CDN retornou HTTP 403.
