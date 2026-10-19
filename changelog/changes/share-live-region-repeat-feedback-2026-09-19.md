---
type: changelog
date: 2026-09-19
description: "Mantém o feedback acessível do botão de compartilhar repetível em usos sucessivos."
tags: [accessibility, ux]
---

O status `aria-live` do botão de compartilhar agora volta a vazio quando o feedback temporário termina. Assim, copiar o link novamente produz uma nova mudança observável para tecnologias assistivas, sem alterar o texto, o visual ou o comportamento de compartilhamento.
