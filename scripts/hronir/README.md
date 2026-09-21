# Hrönir — recursos e compatibilidade

O Hrönir deixou de expor um CLI Node para agentes.

A interface operacional canônica é:

```text
Markdown OKF → okf-parser check → corrigir/preencher → repetir até verde
```

Veja `docs/hronir-agent-routine.md` e
`specs/okf-types/hronir-evaluation.md`.

## O que permanece neste diretório

- `perspectives/`: lentes de leitura usadas pelos avaliadores;
- `skills/`: instruções editoriais para revisão de textos;
- documentação e recursos históricos necessários para interpretar avaliações
  antigas.

O antigo `scripts/hronir/index.js` foi removido. Não use `npx hronir` nem
`npm run hronir:*`.

## Persistência

Novas avaliações são arquivos em `.routines/hronir/rates/` com:

```yaml
---
type: Hronir Evaluation
---
```

O agente não recebe um formulário de um programa. Ele roda o `okf-parser`,
lê os diagnósticos `OKF011`, preenche o Markdown e repete até
`conformant: true`.

Arquivos históricos `type: Rate File` continuam legíveis e imutáveis.

## Projeções do site

Enquanto ainda existem posts no layout legado de versões, o prebuild executa
`scripts/generate-hronir-selection.mjs` para produzir uma projeção de leitura
necessária ao Astro. Essa compatibilidade não é uma interface de agente nem uma
máquina de estado Hrönir. Ela deve desaparecer quando o layout legado restante
for achatado.

O ranking público também pode ser calculado em TypeScript a partir dos rate
files já validados. Isso é consumo dos dados, não autoria ou validação deles.
