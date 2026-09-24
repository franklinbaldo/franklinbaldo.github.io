# Rotina de tiers

A infraestrutura de tiers é compartilhada entre três workloads: posts, músicas e projetos.

Leia primeiro:

1. `docs/tier-system.md`;
2. a spec do domínio em `specs/okf-types/`;
3. os cards canônicos do domínio;
4. a evidência atual específica do domínio.

Não invente paths, campos, registries, componentes ou uma segunda taxonomia. O golden path, fronteiras, validação e merge estão em `docs/tier-system.md`.

## Escopos

- **Blog Post Tiering**: somente posts normais; exclui `postType: music` e `translationKey: music-*`.
- **Music Tiering**: somente gravações públicas Suno, identificadas por UUID.
- **Project Tiering**: somente repositórios/projetos públicos elegíveis, identificados por `owner/repo`.

## Gate mínimo antes de publicar

```bash
npm run tiers:check
npm run format:check
npm run lint
npm test
npx astro check
npm run build
```

Se um gate externo obrigatório do repositório estiver pendente, não fabrique equivalência; preserve a PR e reporte o blocker exato.
