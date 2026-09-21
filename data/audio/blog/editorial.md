---
type: Audio Editorial Guide
audience: blog
lang: pt-BR
status: canonical
---

# Guia editorial de áudio do blog

A matéria publicada é a fonte canônica. A versão de narração pode apenas adaptar a realização oral: expandir siglas, resolver pronúncias, inserir pausas, dividir frases excessivamente longas e omitir elementos puramente visuais que não carreguem conteúdo proposicional. Não pode acrescentar fatos, argumentos, exemplos ou conclusões.

A voz padrão é `narrator`, definida em `voices.yaml`. A direção deve privilegiar fala brasileira natural, sem voz de locutor, dramatização artificial ou eventos vocais inventados. Termos cobertos por `pronunciation.yaml` devem seguir aquela leitura.

`ready_for_audio: true` significa que a derivação foi revista contra a matéria canônica, identidade e lineage estão estáveis, voz e pronúncia foram resolvidas e nenhum gate editorial permanece aberto. Só depois disso TTS externo pode ser acionado.

O binário final nunca entra no Git. Ele é publicado no Internet Archive, verificado por HEAD, byte range e tamanho, e somente então entra em `data/blog-audio.json`, que alimenta player, índice e feed.
