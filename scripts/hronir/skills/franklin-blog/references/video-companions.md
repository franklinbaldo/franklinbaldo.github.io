## Vídeo complementar ao post

Pesquisar primeiro as obras do autor no próprio blog: músicas, narrações, versões anteriores, imagens e letras. Preservar a intenção e o impacto narrativo; não substituir uma adaptação já boa por sinopse genérica. Propor vídeo quando o movimento trouxer valor real (demonstração, narrativa, ensino, música); não impor vídeo a todo post.

Após o rascunho descartável, definir argumento, storyboard e plano de som. Usar `hyperframes`, `hyperframes-registry`, `hyperframes-cli`, `media-use` para vídeo HTML; `remotion-best-practices`, `remotion-markup`, `remotion-render`, `remotion-captions` para Remotion; `remotion-to-hyperframes` quando migrar composições. Consultar os arquivos SKILL.md das versões pinadas em `skills-lock.json`. Respeitar acesso, licença e proveniência dos áudios originais.

Post multimídia: arquivo Markdown canônico, vídeo HTML5 responsivo com controles, poster, WebVTT, transcrição, créditos e alternativa textual. Só publicar quando o MP4 real existir, tiver áudio/legendas sincronizados, tamanho adequado, revisão visual e reprodução móvel verificada. Não entregar slideshow de textos como se fosse curta cinematográfico.

Para blog e repositórios públicos, renderizar por **GitHub Actions**, com artefatos para revisão, não por Cloud Build. A automação não deve fazer merge de vídeo não aprovado.
