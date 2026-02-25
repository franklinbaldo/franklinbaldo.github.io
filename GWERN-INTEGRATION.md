# Integração de Tipografia Gwern

Este documento descreve como ativar as melhorias tipográficas inspiradas em **Gwern Branwen** (justificativa, hifenização, pontuação suspensa) no blog.

## O Que Foi Adicionado

O arquivo CSS `public/css/gwern-typography.css` contém as seguintes regras:
- `text-align: justify` + `hyphens: auto`: Cria blocos de texto alinhados ("justificados") sem os "rios" de espaço em branco comuns na web, imitando a diagramação de livros impressos.
- `hanging-punctuation: first last`: Permite que pontuações (aspas, hifens) fiquem ligeiramente fora da margem, melhorando o alinhamento visual.
- `font-feature-settings`: Ativa ligaduras e kerning avançado.
- `font-variant-numeric: oldstyle-nums`: Usa números "antigos" (que descem abaixo da linha de base) para melhor harmonia com texto corrido.

## Como Integrar

Como o código fonte do Astro não estava acessível no momento desta análise, a integração deve ser feita manualmente quando o ambiente de build estiver disponível.

### Passo 1: Adicionar o CSS ao Layout

Edite o arquivo de layout principal do blog (provavelmente `src/layouts/BlogPost.astro` ou `src/layouts/BaseLayout.astro`).

Dentro da tag `<head>`, adicione a seguinte linha:

```astro
<head>
  <!-- ... outras meta tags ... -->
  <link rel="stylesheet" href="/css/gwern-typography.css" />
</head>
```

### Passo 2 (Opcional): Ajustar o Tailwind

Se o projeto usar Tailwind CSS, verifique se a classe `prose` (do `@tailwindcss/typography`) não está sobrescrevendo o alinhamento de texto. Se estiver, você pode forçar o estilo no arquivo `gwern-typography.css` adicionando `!important` ou aumentando a especificidade:

```css
.prose p {
  text-align: justify;
  hyphens: auto;
}
```

## Por que Gwern?

Gwern Branwen defende que a leitura na web deve ser tão confortável quanto em livros. A combinação de justificação com hifenização automática é a chave para isso, permitindo linhas de comprimento ideal (~65-75 caracteres) sem quebra visual.
