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
    frontmatter({ title, path, template: "page.html" }, { lang }) + body
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
for (const [file, path, title, lang] of [
  ["src/pages/games/index.astro", "/games/", "Games", "en"],
  [
    "src/pages/games/rug-pull.astro",
    "/games/rug-pull/",
    "Rug Pull Simulator",
    "en",
  ],
]) {
  const source = readFileSync(file, "utf8");
  const body = source.match(/<PageLayout\b[^>]*>([\s\S]*?)<\/PageLayout>/)?.[1];
  if (!body || /[{}]/.test(body))
    throw new Error(`Static page acquired dynamic markup: ${file}`);
  const css = source.match(/<style[^>]*>([\s\S]*?)<\/style>/)?.[1] ?? "";
  const script = source.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  const scriptUrl = script ? emitModule(resolve(file), script) : null;
  page(
    path,
    title,
    `${body}\n<style>${css}</style>\n${scriptUrl ? `<script type="module" src="${scriptUrl}"></script>` : ""}`,
    lang
  );
}
for (const lang of ["en", "pt"]) {
  const source = readFileSync(
    `src/pages/${lang === "pt" ? "pt/" : ""}about.astro`,
    "utf8"
  );
  let body = source.match(
    /<article data-pagefind-body>([\s\S]*?)<\/article>/
  )?.[1];
  if (!body || /[{}]/.test(body))
    throw new Error("About page is no longer literal HTML");
  body = body
    .replace(/<h1>[\s\S]*?<\/h1>/, "")
    .replace(
      '<a href="https://astro.build/">Astro</a>',
      '<a href="https://www.getzola.org/">Zola</a>'
    )
    .replace(
      /(?: and vanilla | e )<a href="https:\/\/picocss.com\/">Pico.css<\/a>/,
      ""
    )
    .replace(/\s+vanilla —/, " —");
  page(
    `${lang === "pt" ? "/pt" : ""}/about/`,
    lang === "pt" ? "Sobre" : "About",
    body,
    lang
  );
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
