---
name: hronir-edit
description: Identifica o pior post sob cooldown e orienta a reescrita e selagem.
checks:
  - shell: "python -c \"import os; exit(1 if os.path.exists('hronir_session.json') else 0)\""
    message: "A sessão do Hrönir deve ser finalizada com sucesso (hronir_session.json deletado) ao fim do processo."
---

## Step 1: Extrair Diagnósticos e Preparar Arquivos

```routine
run: "bun run hronir:edit-worst"
```

Rode o comando a seguir para identificar o pior post elegível, injetar as tags de controle `replacedVersion` e exibir o contraste do top 3 com as defesas e críticas textuais acumuladas.

## Step 2: Realizar a Reescrita das Traduções

Abra as duas skills de escrita do blog para alinhar os objetivos estilísticos:

- `.routines/hronir/skills/franklin-blog/SKILL.md` (Padrão para ensaios pessoais, lateralidade e incertezas)
- `.routines/hronir/skills/franklin-essay/SKILL.md` (Para posts formais, teses acadêmicas e defesas densas)

Edite **todas** as traduções do post pior ranqueado indicadas no passo anterior, aprimorando seu ritmo, fidelidade de voz e eliminando os pontos fracos.

## Step 3: Registrar e Selar a Rodada

```routine
run: "bun run hronir:edit-commit --msg \"<msg>\""
inputs:
  - name: msg
    type: string
    description: "Justificativa detalhada do que foi alterado e porquê (mínimo de 10 palavras)"
    min_words: 10
```

Valide se todos os arquivos de tradução sofreram alterações de UUIDv5, registre a linked list `previousVersion` apontando para o SHA da versão anterior e finalize a sessão de rodada do Hrönir.
