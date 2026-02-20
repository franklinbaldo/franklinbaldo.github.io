# TOOLS.md — Especificações da Estância do Aparício

Este arquivo guarda as notas sobre as nossas ferramentas locais e como elas devem ser usadas no dia a dia. Enquanto as "skills" explicam o _como_ a ferramenta funciona no geral, o `TOOLS.md` explica o _onde_ e o _quais_ são os detalhes da nossa casa.

## 📌 Protocolo de Git e Publicação (Guia Definitivo)

1.  **Sede Operacional (Privado):**
    *   O repositório `franklinbaldo/aparicio-funes` é a nossa sede principal.
    *   Tudo o que é trabalho (scripts, memórias, rascunhos, logs de sessão) vive aqui e deve ser commitado/pushado regularmente.
    *   A pasta `workspace/` NÃO está mais no gitignore e deve ser versionada no repo privado.

2.  **Vitrine do Blog (Público):**
    *   O repositório `adibaldo/adibaldo.github.io` é apenas para o conteúdo final de publicação.
    *   **NÃO** usar `.git` aninhado dentro das subpastas de blog no workspace.
    *   Publicação via sincronização seletiva: consolidar na sede -> despacho controlado para o público.

## 🎙️ Transcrição de Áudio
*   **Protocolo:** Usar a ferramenta `exec` com o script de transcrição via REST API direta (Gemini 2.0 Flash) quando o CLI estiver sem cota.
*   **Caminho do áudio:** Usar sempre caminhos absolutos para o processamento.

## 🧉 Notas de Identidade
*   **Avatar:** `./avatars/2026-02-07-funes-avatar-telegram-tight.png`
*   **Emoji:** 🧉


## 🌳 Publicação canônica dos blogs (Git Subtree)

### Blog do Adi (`adibaldo.github.io`)
- Remote: `adibaldo` -> `https://github.com/adibaldo/adibaldo.github.io.git`
- Prefixo no monorepo: `workspace/adibaldo.github.io`
- Comandos:
  - `./scripts/subtree-adibaldo.sh pull`  (traz mudanças do repo público)
  - `./scripts/subtree-adibaldo.sh push`  (publica do monorepo para o público)
  - `./scripts/subtree-adibaldo.sh split` (gera SHA do split)

### Ecos do Pampa (`ecos-do-pampa`)
- Remote: `ecos` -> `https://github.com/franklinbaldo/ecos-do-pampa.git`
- Prefixo no monorepo: `workspace/ecos-do-pampa`
- Comandos:
  - `./scripts/subtree-ecos.sh pull`  (traz mudanças do repo ecos)
  - `./scripts/subtree-ecos.sh push`  (publica do monorepo para ecos)
  - `./scripts/subtree-ecos.sh split` (gera SHA do split)
