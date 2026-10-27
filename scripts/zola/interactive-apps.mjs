// Native Zola projections. No Astro compiler, renderer, build output or runtime.
// Existing literal CSS and independent browser TypeScript remain the canonical
// presentation/behavior sources, while Node projects canonical data into HTML.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import ts from "typescript";
import { frontmatter, stableName } from "./content.mjs";
import { renderFactory } from "./apps/factory.mjs";
import { readScienceCards } from "./apps/science.mjs";
import { renderAtlas } from "./apps/atlas.mjs";
import { readDeck } from "./apps/decks.mjs";

const target = process.env.ZOLA_PREPARED_DIR || ".cache/zola-site";
const read = (file) => readFileSync(file, "utf8");
function write(path, content) {
  const file = join(target, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}
function script(source, name) {
  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
    },
    fileName: `${name}.ts`,
    reportDiagnostics: true,
  });
  const errors =
    result.diagnostics?.filter(
      (d) => d.category === ts.DiagnosticCategory.Error
    ) ?? [];
  if (errors.length)
    throw new Error(
      ts.formatDiagnostics(errors, {
        getCurrentDirectory: () => process.cwd(),
        getNewLine: () => "\n",
        getCanonicalFileName: (x) => x,
      })
    );
  write(`static/js/apps-${name}.js`, result.outputText);
}
function css(source, name) {
  write(
    `static/css/apps-${name}.css`,
    source.replace(/:global\(([^)]+)\)/g, "$1")
  );
}
function extract(source, tag) {
  const found = source.match(
    new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`)
  );
  if (!found) throw new Error(`Missing ${tag} block in app source`);
  return found[1];
}
function page(
  id,
  path,
  title,
  description,
  body,
  lang = "en",
  standalone = false,
  extra = {}
) {
  const data = `apps/${id}.json`;
  write(data, JSON.stringify({ body, ...extra }));
  write(
    `content/pages/${stableName(path)}.md`,
    frontmatter(
      {
        title,
        description,
        path,
        template: standalone ? "apps-deck.html" : "apps.html",
      },
      {
        lang,
        kind: "app",
        app_id: id,
        app_data: data,
        app_css: `css/apps-${id}.css`,
        app_script: `js/apps-${id}.js`,
      }
    )
  );
}
function lifecycle(source, selector, name, prepare = "") {
  return `// Independent native app module, initialized for first load and Zola navigation.
const registry = window.__zolaNativeApps ??= new Map();
if (!registry.has(${JSON.stringify(name)})) {
  let cleanup = () => {};
  function initialize() {
    const appRoot = document.querySelector(${JSON.stringify(selector)});
    if (!appRoot || appRoot.dataset.nativeInitialized) return;
    cleanup();
    appRoot.dataset.nativeInitialized = "true";
    const controller = new AbortController();
    const cleanups = [];
    cleanup = () => {
      controller.abort();
      for (const dispose of cleanups) dispose();
      delete appRoot.dataset.nativeInitialized;
      delete appRoot.dataset.initialized;
      cleanup = () => {};
    };
    ${prepare}
    ${source}
  }
  registry.set(${JSON.stringify(name)}, initialize);
  document.addEventListener("zola:page-load", initialize);
  document.addEventListener("zola:before-swap", () => cleanup());
}
const initialize = registry.get(${JSON.stringify(name)});
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
else initialize();
`;
}

// Atlas contains no keyframes or comma-bearing functional selectors. Restore
// the component boundary that its generic class selectors had in Astro.
function scopeAtlasCss(source) {
  if (/@(?:keyframes|font-face)|:(?:is|where|not)\([^)]*,/.test(source))
    throw new Error("Atlas CSS gained rules requiring explicit native scoping");
  return source
    .replace(/:global\(([^)]+)\)/g, "$1")
    .replace(/([^{}]+)\{/g, (rule, selector) => {
      if (selector.trim().startsWith("@")) return rule;
      return (
        selector
          .split(",")
          .map((part) => `[data-app="atlas-das-equacoes"] ${part.trim()}`)
          .join(",\n") + " {"
      );
    });
}

const snapshot = JSON.parse(read("src/generated/repo-factory.json"));
css(read("src/styles/repo-factory.css"), "repo-factory");
script(
  lifecycle(
    read("src/scripts/repo-factory.ts"),
    ".factory-shell",
    "RepoFactory"
  ),
  "repo-factory"
);
page(
  "repo-factory",
  "/games/repo-factory/",
  "Repo Factory",
  "A living factory-floor map of Franklin Baldo's public GitHub repositories: issues become inputs, pull requests become assembly lines, Actions runs become machines, and merges and releases leave as products.",
  renderFactory(snapshot)
);

const component = read("src/components/EquationUniverse.astro");
const atlas = read("src/pages/pt/atlas-das-equacoes.astro");
const cards = readScienceCards();
css(
  scopeAtlasCss(extract(atlas, "style") + "\n" + extract(component, "style")),
  "atlas-das-equacoes"
);
let graphScript = extract(component, "script")
  .replace(
    'document.addEventListener("keydown", (event) => {\n        if (event.key === "Escape") focusNode(null, true);\n      });',
    'document.addEventListener("keydown", (event) => {\n        if (event.key === "Escape") focusNode(null, true);\n      }, { signal: controller.signal });'
  )
  .replace(
    "observer.observe(stage);",
    "observer.observe(stage);\n      cleanups.push(() => { observer.disconnect(); window.clearTimeout(autoMorphTimer); });"
  );
script(
  lifecycle(graphScript, "#uekg-universe", "EquationUniverse"),
  "atlas-das-equacoes"
);
page(
  "atlas-das-equacoes",
  "/pt/atlas-das-equacoes/",
  "Atlas das Equações",
  "Uma taxonomia viva das fórmulas usadas pela ciência e das estruturas matemáticas que reaparecem entre disciplinas.",
  renderAtlas(cards, component),
  "pt"
);

for (const id of ["nathan-holmes", "theranos-nathan", "achei-sera"]) {
  const file = `src/pages/powerpoint-club/${id}.astro`;
  const deck = readDeck(read(file), file);
  css(deck.css, id);
  script(deck.script, id);
  page(
    id,
    `/powerpoint-club/${id}/`,
    deck.title,
    deck.description,
    deck.body,
    "pt",
    true,
    { stylesheets: deck.stylesheets }
  );
}
console.log(
  `Native apps projected: ${snapshot.repositories?.length ?? 0} repositories, ${cards.formulas.length} formulas, ${cards.families.length} families, 3 complete Reveal decks`
);
