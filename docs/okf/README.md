# Bundle OKF do Hrönir

Este diretório é um bundle no [Open Knowledge Format
(OKF)](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing):
um arquivo Markdown por conceito, com front-matter YAML leve (`type` é o
único campo obrigatório) e links relativos entre conceitos relacionados.
O objetivo é dar a agentes — e a humanos — um mapa navegável dos conceitos
centrais do sistema Hrönir, complementar (não substituto) ao `CLAUDE.md` e
aos READMEs de operação.

Comece por [`index.md`](./index.md).

Ver [RFC 0014](../rfcs/0014-adocao-open-knowledge-format.md) para a decisão
de adotar o formato e o desenho do bundle. Desde a RFC 0014 (r1), a adoção
não é só documental: os posts em `src/content/blog/**` e os rate files em
`.routines/hronir/rates/**` carregam literalmente o campo `type` do OKF —
ver [Post](./concepts/post.md) e [Rate file](./concepts/rate-file.md).
