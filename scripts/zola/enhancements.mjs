// The browser enhancements are native TypeScript, not extracted from .astro components.
import { build } from "esbuild";
import { readFileSync, writeFileSync } from "node:fs";
const target = ".cache/zola-site/static";
const source = ["code-copy", "mermaid"]
  .map((name) => readFileSync(`scripts/zola/client/${name}.ts`, "utf8"))
  .map((script) => `(() => {${script}})();`)
  .join("\n");
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
