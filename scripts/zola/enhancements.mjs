// Bundle browser-only enhancements from their canonical sources, without Astro.
import { readFileSync, writeFileSync } from "node:fs";
import { build } from "esbuild";
const target = ".cache/zola-site/static";
let source = "";
for (const name of ["CodeCopyEnhancer", "MermaidEnhancer"]) {
  const component = readFileSync(`src/components/${name}.astro`, "utf8");
  let script = component.match(/<script>([\s\S]*?)<\/script>/)[1];
  script = script.replaceAll("astro:page-load", "zola:page-load");
  if (name === "CodeCopyEnhancer") {
    script = script.replace(
      'const el = document.getElementById("code-copy-labels");',
      `const pt = document.documentElement.lang.startsWith('pt');
      const el = {dataset: {copyLabel: pt ? 'Copiar' : 'Copy', copiedLabel: pt ? 'Copiado!' : 'Copied!', failedLabel: pt ? 'Falhou' : 'Failed', ariaCopyLabel: pt ? 'Copiar código' : 'Copy code'}};`
    );
  } else {
    script = script.replace(
      "article pre[data-language='mermaid']",
      "article pre[data-language='mermaid'], article pre:has(code.language-mermaid)"
    );
  }
  source += `(() => {${script}})();\n`;
}
await build({
  stdin: { contents: source, loader: "ts", resolveDir: process.cwd() },
  bundle: true,
  splitting: true,
  format: "esm",
  outdir: `${target}/js/enhancements`,
  entryNames: "article",
  minify: true,
});
writeFileSync(
  `${target}/css/enhancements.css`,
  `.code-block{position:relative}.code-copy{position:absolute;top:.4rem;right:.4rem;background:var(--paper,#fff);color:inherit;border:1px solid #888;border-radius:4px;padding:.2rem .5rem;font-size:.75rem;cursor:pointer}.code-copy-status{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}.mermaid{overflow:auto}`
);
