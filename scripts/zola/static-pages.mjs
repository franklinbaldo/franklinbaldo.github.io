// Transitional ports of literal HTML and independent browser apps. This never
// evaluates Astro frontmatter or compiles Astro: nonliteral markup fails closed.
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import ts from "typescript";
import matter from "gray-matter";
import { frontmatter, stableName } from "./content.mjs";
const target = ".cache/zola-site";
function write(path, content) {
  const file = join(target, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}
function page(path, title, body, lang = "en") {
  write(
    `content/pages/${stableName(path)}.md`,
    path === "/changelog/"
      ? frontmatter({ title, path, template: "page.html" }, { lang }) + body
      : frontmatter(
          { title, path, template: "literal.html" },
          { lang, literal_html: body, show_title: path.endsWith("/about/") }
        )
  );
}
function emitModule(file, source = readFileSync(file, "utf8")) {
  const path = `/js/modules/${relative(process.cwd(), file).replace(/\.(ts|astro)$/, ".js")}`;
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
    },
    fileName: file,
    reportDiagnostics: true,
  });
  const errors =
    compiled.diagnostics?.filter(
      (d) => d.category === ts.DiagnosticCategory.Error
    ) ?? [];
  if (errors.length)
    throw new Error(
      ts.formatDiagnosticsWithColorAndContext(errors, {
        getCurrentDirectory: () => process.cwd(),
        getNewLine: () => "\n",
        getCanonicalFileName: (x) => x,
      })
    );
  let js = compiled.outputText.replace(
    /(["'])(\.\.?\/[^"']+)\1/g,
    (whole, q, specifier) => {
      const raw = resolve(dirname(file), specifier);
      const dependency = [raw, raw + ".ts", raw + ".js"].find(
        (p) => existsSync(p) && extname(p)
      );
      if (!dependency)
        throw new Error(`Missing browser import: ${file}: ${specifier}`);
      return JSON.stringify(emitModule(dependency));
    }
  );
  js = js.replace(
    "function bind() {",
    'function bind() { const root = document.querySelector("#rug-start"); if (!root || root.dataset.bound) return; root.dataset.bound = "true";'
  );
  js = js.replace(
    'document.addEventListener("astro:page-load", bind);',
    'if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind, {once:true}); else bind();'
  );
  write(`static/${path}`, js);
  return path;
}
for (const [name, path, title] of [
  ["games-index", "/games/", "Games"],
  ["rug-pull", "/games/rug-pull/", "Rug Pull Simulator"],
]) {
  const body = readFileSync(`scripts/zola/source/pages/${name}.html`, "utf8");
  const css = readFileSync(`scripts/zola/source/pages/${name}.css`, "utf8");
  const scriptUrl = name === "rug-pull"
    ? emitModule(resolve("src/pages/games/rug-pull-client.ts"))
    : null;
  page(path, title, `${body}\n<style>${css}</style>\n${scriptUrl ? `<script type="module" src="${scriptUrl}"></script>` : ""}`);
}
for (const lang of ["en", "pt"]) {
  const body = readFileSync(`scripts/zola/source/pages/about-${lang}.html`, "utf8");
  page(`${lang === "pt" ? "/pt" : ""}/about/`, lang === "pt" ? "Sobre" : "About", body, lang);
}
const entries = [];
for (const dir of ["changelog", "changelog/changes"]) {
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".md"))) {
    const { data, content } = matter(readFileSync(join(dir, file), "utf8"));
    entries.push({
      data,
      content,
      id:
        dir === "changelog"
          ? `version-${data.version}`
          : `change-${file.replace(/\.md$/, "")}`,
    });
  }
}
entries.sort((a, b) => new Date(b.data.date) - new Date(a.data.date));
page(
  "/changelog/",
  "Changelog",
  entries
    .map(
      ({ data, content, id }) =>
        `<h2 id="${id}">${data.version ? `v${data.version}` : data.description}</h2>\n\n${new Date(data.date).toISOString().slice(0, 10)}\n\n${content}`
    )
    .join("\n\n")
);
console.log(
  "Zola static ports: bilingual about, changelog, games and independent Rug Pull engine"
);
