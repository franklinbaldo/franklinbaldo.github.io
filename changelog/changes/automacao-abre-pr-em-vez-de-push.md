---
type: changelog
date: 2026-09-02
description: Automated workflows now open a pull request instead of pushing straight to main.
tags: [ci, automation, main]
---

# Automação abre PR em vez de empurrar na main

- A branch `main` passou a exigir que o head esteja atualizado antes do merge, e essa regra também vale para push: o `git push origin HEAD:main` dos workflows agendados seria recusado.
- `suno-daily-sync.yml` e `audiobook-media.yml` passam a commitar numa branch `automation/*`, abrir PR e deixar em auto-merge; o PR cai sozinho quando o check passa.
- O retry com rebase sai dos dois. Ele existia para lidar com a main andando durante o push, e a branch de automação é recriada a cada execução — nunca fica atrás.
